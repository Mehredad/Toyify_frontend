"""
Toyify AI Backend — FastAPI
Run: uvicorn main:app --reload --port 8000

Endpoints:
  POST /api/ai/toy-concept  — Gemini Vision → drawing description + toy name + Pollinations 3D render
  POST /api/ai/toy-story    — Gemini Flash → 1,200–1,800 word STEM story (JSON)
  POST /api/ai/story-pdf    — fpdf2 → styled PDF download
  POST /api/ai/toy-preview  — alias for /api/ai/toy-concept (legacy compat)
"""

from __future__ import annotations

import base64
import io
import json
import os
import random
import urllib.parse

import google.generativeai as genai
import httpx
from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel

load_dotenv()

GOOGLE_AI_KEY = os.environ.get("GOOGLE_AI_KEY", "")

if not GOOGLE_AI_KEY:
    raise RuntimeError(
        "GOOGLE_AI_KEY is not set. "
        "Get a free key at https://aistudio.google.com/app/apikey and add it to backend/.env"
    )

genai.configure(api_key=GOOGLE_AI_KEY)

_vision_model = genai.GenerativeModel("gemini-flash-latest")
_story_model = genai.GenerativeModel(
    "gemini-flash-latest",
    system_instruction=(
        "You are a celebrated children's book author whose stories are loved by children aged 6–14 "
        "and the adults who read with them. You write in the tradition of Roald Dahl's playful wit, "
        "Philip Pullman's epic scope, and the scientific wonder of a natural history museum.\n\n"
        "Your hallmarks:\n"
        "• STEM concepts appear as plot-driving superpowers and problem-solving tools — never as lessons\n"
        "• Characters have distinct voices, flaws, and growth arcs\n"
        "• Children are never talked down to — they're treated as capable of big ideas\n"
        "• Prose is vivid, rhythmic, and surprising; you earn every adjective\n"
        "• British English throughout (colour, favourite, realise, maths, etc.)"
    ),
)

app = FastAPI(title="Toyify AI API", version="2.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["POST", "GET", "OPTIONS"],
    allow_headers=["*"],
)


# ──────────────────────────────────────────────
# Request schemas
# ──────────────────────────────────────────────

class ConceptRequest(BaseModel):
    imageData: str                    # data-URI or raw base64
    artistName: str = "the artist"
    artistAge: str = "8"
    artistGender: str = ""            # "Boy" | "Girl" | "Other" | ""
    artistInterests: list[str] = []


class StoryRequest(BaseModel):
    toyName: str
    drawingDescription: str = ""
    artistName: str = "the artist"
    artistAge: str = "8"
    artistGender: str = ""
    artistInterests: list[str] = []


class PdfRequest(BaseModel):
    toyName: str
    storyTitle: str
    story: str
    artistName: str = ""
    conceptImageUrl: str = ""


# ──────────────────────────────────────────────
# Helpers
# ──────────────────────────────────────────────

def _parse_image(data_uri: str) -> tuple[str, bytes]:
    """Return (media_type, raw_bytes) — Gemini needs bytes, not base64 string."""
    if data_uri.startswith("data:"):
        header, b64 = data_uri.split(",", 1)
        media_type = header.split(":")[1].split(";")[0]
        return media_type, base64.b64decode(b64)
    return "image/jpeg", base64.b64decode(data_uri)


def _escape_json_strings(text: str) -> str:
    """Escape literal newlines/carriage-returns that appear inside JSON string values."""
    in_string = False
    escaped = False
    result: list[str] = []
    for ch in text:
        if escaped:
            result.append(ch)
            escaped = False
        elif ch == "\\" and in_string:
            result.append(ch)
            escaped = True
        elif ch == '"':
            result.append(ch)
            in_string = not in_string
        elif in_string and ch == "\n":
            result.append("\\n")
        elif in_string and ch == "\r":
            result.append("\\r")
        else:
            result.append(ch)
    return "".join(result)


def _extract_json(text: str) -> str:
    """Pull the first valid JSON object out of a model response."""
    if "```" in text:
        for part in text.split("```"):
            stripped = part.strip().lstrip("json").strip()
            if stripped.startswith("{"):
                return _escape_json_strings(stripped)
    start = text.find("{")
    end = text.rfind("}") + 1
    if start != -1 and end > start:
        return _escape_json_strings(text[start:end])
    return text


def _build_image_prompt(description: str, gender: str, interests: list[str]) -> str:
    gender_tag = {
        "Girl": "soft pastel palette, designed for a girl, ",
        "Boy":  "bold vibrant palette, designed for a boy, ",
    }.get(gender, "")
    interest_tag = (
        f"subtle {' and '.join(interests[:2])} themed motifs, " if interests else ""
    )
    return (
        "Professional children's toy product photography, single figurine, "
        "3D rendered Pixar CGI style, smooth rounded matte plastic, "
        "studio white background, soft directional lighting, "
        "sharp crisp details, toy store display quality, "
        f"{gender_tag}{interest_tag}"
        f"toy character: {description}. "
        "Centered subject, high quality render, no shadows on background, "
        "cute friendly expression"
    )


def _pollinations_url(prompt: str, seed: int) -> str:
    encoded = urllib.parse.quote(prompt, safe="")
    return (
        f"https://image.pollinations.ai/prompt/{encoded}"
        f"?width=768&height=768&seed={seed}&nologo=true&model=flux"
    )


# ──────────────────────────────────────────────
# POST /api/ai/toy-concept
# ──────────────────────────────────────────────

@app.post("/api/ai/toy-concept")
async def generate_toy_concept(req: ConceptRequest) -> dict:
    """
    1. Gemini Flash Vision → describe drawing + invent toy name (single call)
    2. Pollinations.ai FLUX  → free 3D concept image (no API key needed)
    Returns: { previewImage, toyName, drawingDescription }
    """
    media_type, image_bytes = _parse_image(req.imageData)
    interests_str = ", ".join(req.artistInterests[:3]) if req.artistInterests else "adventure"

    try:
        vision_resp = await _vision_model.generate_content_async([
            {"mime_type": media_type, "data": image_bytes},
            (
                "You are helping turn a child's drawing into a 3D printed toy.\n\n"
                "Examine the drawing carefully and return a JSON object with exactly two fields:\n"
                "1. \"description\": A precise visual description (max 80 words) covering the main subject, "
                "shape, colours, distinctive features (ears, tail, wings, limbs, accessories, markings), "
                "and overall mood/personality. Be specific and visual — do NOT interpret, just describe.\n"
                f"2. \"toyName\": A catchy, playful toy name (2–4 words, no punctuation) for "
                f"{req.artistName}, aged {req.artistAge}, who loves {interests_str}.\n\n"
                "Return ONLY valid JSON — no markdown fences, no commentary before or after."
            ),
        ])
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Gemini Vision error: {e}")

    raw = _extract_json(vision_resp.text.strip())
    try:
        parsed = json.loads(raw)
        drawing_description: str = str(parsed.get("description", "a unique toy character")).strip()
        toy_name: str = str(parsed.get("toyName", "Your Amazing Toy")).strip().strip('"\'')
    except (json.JSONDecodeError, AttributeError):
        drawing_description = vision_resp.text.strip()[:400]
        toy_name = "Your Amazing Toy"

    # ── Pollinations.ai FLUX — completely free, no API key ────────────
    preview_image: str | None = None
    try:
        prompt = _build_image_prompt(drawing_description, req.artistGender, req.artistInterests)
        seed = random.randint(1, 999_999)
        url = _pollinations_url(prompt, seed)
        async with httpx.AsyncClient(timeout=60.0) as client:
            resp = await client.get(url)
        if resp.is_success and resp.headers.get("content-type", "").startswith("image/"):
            # Return the stable URL — browser loads direct; PDF generator re-fetches it
            preview_image = url
    except Exception:
        pass  # Image generation degraded gracefully; frontend shows retry state

    return {
        "previewImage": preview_image,
        "toyName": toy_name,
        "drawingDescription": drawing_description,
    }


# ──────────────────────────────────────────────
# POST /api/ai/toy-story
# ──────────────────────────────────────────────

@app.post("/api/ai/toy-story")
async def generate_toy_story(req: StoryRequest) -> dict:
    """Gemini Flash → structured JSON with story, STEM highlights, title, personality."""

    interests_str = ", ".join(req.artistInterests) if req.artistInterests else "science and adventure"
    pronouns = {"Girl": "she/her", "Boy": "he/him"}.get(req.artistGender, "they/them")
    description_line = (
        f"Appearance: {req.drawingDescription}"
        if req.drawingDescription
        else "Appearance: a unique and imaginative toy character"
    )

    user_prompt = f"""\
Write a personalised STEM adventure story using the details below.

━━━ CHILD PROFILE ━━━
Name: {req.artistName}
Age: {req.artistAge}
Pronouns: {pronouns}
Interests: {interests_str}

━━━ TOY CHARACTER ━━━
Name: {req.toyName}
{description_line}

━━━ STORY REQUIREMENTS ━━━
Length: 1,200–1,800 words (not fewer, not many more)

Structure:
  1. Ordinary world — {req.artistName} discovers {req.toyName} in an unexpected way
  2. Inciting incident — something goes wrong that only {req.toyName}'s STEM ability can fix
  3. Adventure — obstacles, allies, discoveries; at least one moment of real danger or urgency
  4. Resolution — the problem is solved using STEM knowledge; {req.artistName} has grown
  5. Closing wonder — a single beautiful sentence hinting at the next adventure

STEM integration (mandatory):
  • Weave at least TWO different STEM disciplines into the plot as actual mechanics
    Examples: uses fluid dynamics to cross a flood; uses prime numbers to break a code;
    uses geometry to navigate a maze; uses magnetism to retrieve a lost item
  • The STEM must drive the plot — if you removed it, the story would break

Dialogue: include 3–5 short, character-specific exchanges between {req.artistName} and {req.toyName}

British English: colour, favourite, realise, maths, etc.

━━━ OUTPUT FORMAT ━━━
Return ONLY valid JSON — absolutely no markdown fences, no commentary before or after:

{{
  "storyTitle": "specific exciting title (avoid generic like 'The Adventure')",
  "story": "full story text with paragraphs separated by \\n\\n",
  "stemHighlights": [
    {{"subject": "Science|Technology|Engineering|Math", "concept": "plain English 1-line description of the STEM concept used in the story", "emoji": "single relevant emoji"}}
  ],
  "toyPersonality": "1 sentence: {req.toyName}'s personality and special STEM-based ability"
}}
"""

    try:
        response = await _story_model.generate_content_async(
            user_prompt,
            generation_config=genai.GenerationConfig(
                max_output_tokens=4096,
                temperature=0.9,
                response_mime_type="application/json",
            ),
        )
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Gemini story error: {e}")

    try:
        return json.loads(response.text)
    except json.JSONDecodeError:
        # Fallback: attempt to sanitise and re-parse
        try:
            return json.loads(_extract_json(response.text.strip()))
        except json.JSONDecodeError:
            return {
                "storyTitle": f"{req.toyName}'s STEM Adventure",
                "story": response.text.strip(),
                "stemHighlights": [
                    {"subject": "Engineering", "concept": "3D printing builds objects layer-by-layer from digital designs", "emoji": "⚙️"},
                    {"subject": "Science",     "concept": "Forces and energy work together to create movement and shape",  "emoji": "🔬"},
                ],
                "toyPersonality": f"{req.toyName} is brave, curious, and powered by STEM.",
            }


# ──────────────────────────────────────────────
# POST /api/ai/story-pdf
# ──────────────────────────────────────────────

@app.post("/api/ai/story-pdf")
async def generate_story_pdf(req: PdfRequest) -> StreamingResponse:
    """fpdf2 → branded story PDF (purple cover, concept image, full story, Toyify footer)."""

    try:
        from fpdf import FPDF, XPos, YPos
    except ImportError as exc:
        raise HTTPException(status_code=500, detail="fpdf2 not installed — run: pip install fpdf2") from exc

    pdf = FPDF()
    pdf.set_auto_page_break(auto=True, margin=22)
    pdf.add_page()
    pdf.set_margins(22, 22, 22)

    # ── Purple cover band ────────────────────────
    pdf.set_fill_color(66, 48, 125)
    pdf.rect(0, 0, 210, 52, "F")

    pdf.set_y(11)
    pdf.set_font("Helvetica", "B", 20)
    pdf.set_text_color(255, 255, 255)
    pdf.multi_cell(0, 9, req.storyTitle, align="C")

    if req.artistName:
        pdf.set_font("Helvetica", "I", 11)
        pdf.set_text_color(210, 195, 255)
        pdf.cell(0, 7, f"A story for {req.artistName}", align="C",
                 new_x=XPos.LMARGIN, new_y=YPos.NEXT)

    pdf.ln(6)

    # ── Concept image ────────────────────────────
    if req.conceptImageUrl:
        try:
            async with httpx.AsyncClient(timeout=30.0) as client:
                img_resp = await client.get(req.conceptImageUrl)
            if img_resp.is_success:
                img_buf = io.BytesIO(img_resp.content)
                x_img = (210 - 72) / 2
                pdf.image(img_buf, x=x_img, w=72)
                pdf.ln(5)
        except Exception:
            pass

    # ── Divider ──────────────────────────────────
    pdf.set_draw_color(127, 86, 217)
    pdf.set_line_width(0.6)
    pdf.line(22, pdf.get_y(), 188, pdf.get_y())
    pdf.ln(8)

    # ── Story body ───────────────────────────────
    pdf.set_text_color(35, 25, 60)
    paragraphs = [p.strip() for p in req.story.split("\n\n") if p.strip()]

    for i, para in enumerate(paragraphs):
        if i == 0:
            sentences = para.split(". ", 1)
            pdf.set_font("Helvetica", "B", 11)
            if len(sentences) == 2:
                pdf.multi_cell(0, 6, sentences[0] + ".")
                pdf.set_font("Helvetica", "", 11)
                pdf.multi_cell(0, 6, sentences[1])
            else:
                pdf.multi_cell(0, 6, para)
                pdf.set_font("Helvetica", "", 11)
        else:
            pdf.set_font("Helvetica", "", 11)
            pdf.multi_cell(0, 6, para)
        pdf.ln(4)

    # ── Footer ───────────────────────────────────
    pdf.set_y(-18)
    pdf.set_draw_color(200, 185, 240)
    pdf.line(22, pdf.get_y(), 188, pdf.get_y())
    pdf.ln(2)
    pdf.set_font("Helvetica", "I", 8)
    pdf.set_text_color(160, 145, 200)
    pdf.cell(0, 5, "Created with Toyify  ·  toyify.co.uk  ·  Printed in the UK", align="C")

    pdf_bytes = bytes(pdf.output())
    filename = f"{req.toyName.replace(' ', '-')}-story.pdf"

    return StreamingResponse(
        io.BytesIO(pdf_bytes),
        media_type="application/pdf",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )


# ──────────────────────────────────────────────
# Legacy alias
# ──────────────────────────────────────────────

@app.post("/api/ai/toy-preview")
async def toy_preview_alias(req: ConceptRequest) -> dict:
    """Kept for forward-compat — calls the new /api/ai/toy-concept handler."""
    return await generate_toy_concept(req)
