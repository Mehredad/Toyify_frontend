"""
Toyify AI Backend — FastAPI
Run: uvicorn main:app --reload --port 8001

Endpoints:
  POST /api/ai/toy-concept          — Gemini Vision → drawing description + toy name + Pollinations 3D render
  POST /api/ai/toy-story            — Gemini Flash → 1,200–1,800 word STEM story (JSON)
  POST /api/ai/story-pdf            — fpdf2 → styled PDF download
  POST /api/ai/toy-preview          — alias for /api/ai/toy-concept (legacy compat)
  POST /api/create-checkout-session — Stripe Checkout Session → returns redirect URL
  POST /api/confirm-order           — Verify Stripe payment, save order, send owner email
  GET  /api/orders/{user_id}        — Fetch orders for a user from Supabase
"""

from __future__ import annotations

import base64
import io
import json
import os
import random
import smtplib
import urllib.parse
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText

import google.generativeai as genai
import httpx
import stripe
from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel

load_dotenv()

GOOGLE_AI_KEY = os.environ.get("GOOGLE_AI_KEY", "")
STRIPE_SECRET_KEY = os.environ.get("STRIPE_SECRET_KEY", "")
STRIPE_WEBHOOK_SECRET = os.environ.get("STRIPE_WEBHOOK_SECRET", "")
OWNER_EMAIL = os.environ.get("OWNER_EMAIL", "")
SMTP_USER = os.environ.get("SMTP_USER", "")
SMTP_PASS = os.environ.get("SMTP_PASS", "")
SUPABASE_URL = os.environ.get("SUPABASE_URL", "")
SUPABASE_SERVICE_KEY = os.environ.get("SUPABASE_SERVICE_KEY", "")
FRONTEND_URL = os.environ.get("FRONTEND_URL", "http://localhost:8080")

if not GOOGLE_AI_KEY:
    raise RuntimeError(
        "GOOGLE_AI_KEY is not set. "
        "Get a free key at https://aistudio.google.com/app/apikey and add it to backend/.env"
    )

if STRIPE_SECRET_KEY:
    stripe.api_key = STRIPE_SECRET_KEY

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


# ──────────────────────────────────────────────
# Orders — Stripe + email + Supabase
# ──────────────────────────────────────────────

class CheckoutSessionRequest(BaseModel):
    customerEmail: str
    fullName: str
    phoneNumber: str = ""
    address: dict = {}
    allergyNotes: str = ""
    items: list[dict] = []
    toyName: str = ""
    artistName: str = ""
    artistAge: str = ""
    artistGender: str = ""
    artistInterests: list[str] = []
    conceptImageUrl: str = ""
    storyTitle: str = ""
    story: str = ""
    tier: str = "crafted"
    userId: str = ""
    uploadedImageB64: str = ""  # base64 data-URI of original drawing (for owner email)


class ConfirmOrderRequest(BaseModel):
    sessionId: str
    userId: str = ""


def _send_owner_email(order: dict) -> None:
    """Send a rich HTML order notification to the Toyify owner."""
    if not all([OWNER_EMAIL, SMTP_USER, SMTP_PASS]):
        return  # Email not configured — skip silently

    subject = f"🎨 New Toyify Order — {order.get('toyName', 'Unknown Toy')} ({order.get('tier', '').title()})"

    concept_img_html = ""
    if order.get("conceptImageUrl"):
        concept_img_html = f"""
        <tr><td style="padding:12px 0 4px;font-weight:600;color:#42307D;">3D Concept</td></tr>
        <tr><td>
          <img src="{order['conceptImageUrl']}" width="300" style="border-radius:12px;display:block;" alt="3D concept"/>
          <a href="{order['conceptImageUrl']}" style="font-size:12px;color:#7F56D9;">View full image</a>
        </td></tr>"""

    drawing_html = ""
    if order.get("uploadedImageB64") and order["uploadedImageB64"].startswith("data:image"):
        drawing_html = f"""
        <tr><td style="padding:12px 0 4px;font-weight:600;color:#42307D;">Original Drawing</td></tr>
        <tr><td>
          <img src="{order['uploadedImageB64']}" width="200" style="border-radius:12px;display:block;" alt="Child's drawing"/>
        </td></tr>"""

    addr = order.get("address", {})
    address_lines = "<br>".join(filter(None, [
        addr.get("addressLine1"), addr.get("addressLine2"),
        addr.get("townCity"), addr.get("county"), addr.get("postcode"),
    ]))

    interests = ", ".join(order.get("artistInterests", [])) or "—"

    html = f"""
<!DOCTYPE html>
<html>
<body style="font-family:Arial,sans-serif;color:#1D2939;max-width:600px;margin:0 auto;padding:20px;">
  <div style="background:linear-gradient(135deg,#42307D,#7F56D9);padding:24px;border-radius:16px;color:white;margin-bottom:24px;">
    <h1 style="margin:0;font-size:24px;">🎉 New Toyify Order!</h1>
    <p style="margin:8px 0 0;opacity:0.85;">{order.get('toyName', 'A new toy')} — {order.get('tier', '').replace('_', ' ').title()}</p>
  </div>

  <table style="width:100%;border-collapse:collapse;">

    <tr><td colspan="2" style="padding:8px 0;border-bottom:2px solid #E9D7FE;font-weight:700;color:#42307D;font-size:16px;">
      Customer
    </td></tr>
    <tr><td style="padding:6px 0;color:#667085;width:40%;">Name</td><td style="font-weight:600;">{order.get('fullName','—')}</td></tr>
    <tr><td style="padding:6px 0;color:#667085;">Email</td><td><a href="mailto:{order.get('customerEmail','')}" style="color:#7F56D9;">{order.get('customerEmail','—')}</a></td></tr>
    <tr><td style="padding:6px 0;color:#667085;">Phone</td><td>{order.get('phoneNumber','—')}</td></tr>
    <tr><td style="padding:6px 0;color:#667085;vertical-align:top;">Address</td><td>{address_lines or '—'}</td></tr>
    {f'<tr><td style="padding:6px 0;color:#667085;vertical-align:top;">Allergy notes</td><td>{order["allergyNotes"]}</td></tr>' if order.get("allergyNotes") else ''}

    <tr><td colspan="2" style="padding:16px 0 8px;border-bottom:2px solid #E9D7FE;font-weight:700;color:#42307D;font-size:16px;">
      Order
    </td></tr>
    <tr><td style="padding:6px 0;color:#667085;">Toy name</td><td style="font-weight:600;">{order.get('toyName','—')}</td></tr>
    <tr><td style="padding:6px 0;color:#667085;">Type</td><td>{order.get('tier','—').replace('_',' ').title()}</td></tr>
    <tr><td style="padding:6px 0;color:#667085;">Price</td><td style="font-weight:700;color:#42307D;">£{order.get('price','?')}</td></tr>
    <tr><td style="padding:6px 0;color:#667085;">Story</td><td>{order.get('storyTitle','—')}</td></tr>
    <tr><td style="padding:6px 0;color:#667085;">Stripe session</td><td style="font-size:12px;color:#98A2B3;">{order.get('stripeSessionId','—')}</td></tr>

    <tr><td colspan="2" style="padding:16px 0 8px;border-bottom:2px solid #E9D7FE;font-weight:700;color:#42307D;font-size:16px;">
      Child Artist
    </td></tr>
    <tr><td style="padding:6px 0;color:#667085;">Name</td><td>{order.get('artistName','—')}</td></tr>
    <tr><td style="padding:6px 0;color:#667085;">Age</td><td>{order.get('artistAge','—')}</td></tr>
    <tr><td style="padding:6px 0;color:#667085;">Gender</td><td>{order.get('artistGender','—') or '—'}</td></tr>
    <tr><td style="padding:6px 0;color:#667085;">Interests</td><td>{interests}</td></tr>

    <tr><td colspan="2" style="padding:16px 0 8px;">{concept_img_html}</td></tr>
    <tr><td colspan="2" style="padding:0;">{drawing_html}</td></tr>

  </table>

  <div style="margin-top:24px;padding:16px;background:#F9F5FF;border-radius:12px;border:1px solid #E9D7FE;">
    <p style="margin:0;font-size:13px;color:#667085;">
      Reply to this email to contact the customer at <a href="mailto:{order.get('customerEmail','')}" style="color:#7F56D9;">{order.get('customerEmail','')}</a>
    </p>
  </div>
</body>
</html>"""

    msg = MIMEMultipart("alternative")
    msg["From"] = SMTP_USER
    msg["To"] = OWNER_EMAIL
    msg["Reply-To"] = order.get("customerEmail", SMTP_USER)
    msg["Subject"] = subject
    msg.attach(MIMEText(html, "html"))

    try:
        with smtplib.SMTP_SSL("smtp.gmail.com", 465) as server:
            server.login(SMTP_USER, SMTP_PASS)
            server.sendmail(SMTP_USER, OWNER_EMAIL, msg.as_string())
    except Exception as exc:
        print(f"[email] Failed to send owner notification: {exc}")


async def _save_order_to_supabase(order: dict) -> str | None:
    """Insert order into Supabase orders table. Returns the order id or None."""
    if not SUPABASE_URL or not SUPABASE_SERVICE_KEY:
        return None
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            resp = await client.post(
                f"{SUPABASE_URL}/rest/v1/orders",
                headers={
                    "apikey": SUPABASE_SERVICE_KEY,
                    "Authorization": f"Bearer {SUPABASE_SERVICE_KEY}",
                    "Content-Type": "application/json",
                    "Prefer": "return=representation",
                },
                json={
                    "user_id": order.get("userId") or None,
                    "stripe_session_id": order.get("stripeSessionId"),
                    "customer_email": order.get("customerEmail"),
                    "full_name": order.get("fullName"),
                    "phone_number": order.get("phoneNumber"),
                    "address": order.get("address", {}),
                    "allergy_notes": order.get("allergyNotes"),
                    "toy_name": order.get("toyName"),
                    "artist_name": order.get("artistName"),
                    "artist_age": order.get("artistAge"),
                    "artist_gender": order.get("artistGender"),
                    "artist_interests": order.get("artistInterests", []),
                    "tier": order.get("tier"),
                    "price": order.get("price"),
                    "concept_image_url": order.get("conceptImageUrl"),
                    "story_title": order.get("storyTitle"),
                    "status": "pending",
                },
            )
        if resp.is_success:
            rows = resp.json()
            return rows[0]["id"] if rows else None
    except Exception as exc:
        print(f"[supabase] Failed to save order: {exc}")
    return None


@app.post("/api/create-checkout-session")
async def create_checkout_session(req: CheckoutSessionRequest) -> dict:
    """Create a Stripe Checkout Session and return the redirect URL."""
    if not STRIPE_SECRET_KEY:
        raise HTTPException(status_code=503, detail="Stripe is not configured.")

    price_pence = int(round(
        sum(item.get("price", 0) * item.get("quantity", 1) for item in req.items) * 100
    )) + 500  # +£5 shipping

    try:
        session = stripe.checkout.Session.create(
            payment_method_types=["card"],
            mode="payment",
            customer_email=req.customerEmail,
            line_items=[
                {
                    "price_data": {
                        "currency": "gbp",
                        "unit_amount": price_pence,
                        "product_data": {
                            "name": req.toyName or "Toyify Custom Toy",
                            "description": (
                                f"{req.tier.replace('_', ' ').title()} — "
                                f"designed for {req.artistName or 'your child'}"
                            ),
                            "images": [req.conceptImageUrl] if req.conceptImageUrl and req.conceptImageUrl.startswith("http") else [],
                        },
                    },
                    "quantity": 1,
                }
            ],
            success_url=f"{FRONTEND_URL}/success?session_id={{CHECKOUT_SESSION_ID}}",
            cancel_url=f"{FRONTEND_URL}/checkout",
            metadata={
                "fullName": req.fullName[:490],
                "phoneNumber": req.phoneNumber[:490],
                "toyName": req.toyName[:490],
                "artistName": req.artistName[:490],
                "artistAge": req.artistAge[:490],
                "artistGender": req.artistGender[:490],
                "tier": req.tier[:490],
                "storyTitle": req.storyTitle[:490],
                "userId": req.userId[:490],
                "conceptImageUrl": req.conceptImageUrl[:490],
                "allergyNotes": req.allergyNotes[:490],
            },
            # Store full address as JSON in a single metadata field
            payment_intent_data={
                "metadata": {
                    "address": json.dumps(req.address)[:490],
                    "artistInterests": json.dumps(req.artistInterests)[:490],
                    "uploadedImageB64": req.uploadedImageB64[:490] if req.uploadedImageB64 else "",
                }
            },
        )
        # Cache order data in session metadata for confirm-order step
        return {"url": session.url, "sessionId": session.id}
    except stripe.StripeError as exc:
        raise HTTPException(status_code=502, detail=f"Stripe error: {exc}")


@app.post("/api/confirm-order")
async def confirm_order(req: ConfirmOrderRequest) -> dict:
    """
    Called by the success page after Stripe redirects back.
    Verifies the Stripe session, saves the order to Supabase, sends owner email.
    """
    if not STRIPE_SECRET_KEY:
        raise HTTPException(status_code=503, detail="Stripe is not configured.")

    try:
        session = stripe.checkout.Session.retrieve(
            req.sessionId,
            expand=["payment_intent"],
        )
    except stripe.StripeError as exc:
        raise HTTPException(status_code=502, detail=f"Stripe error: {exc}")

    if session.payment_status != "paid":
        raise HTTPException(status_code=402, detail="Payment not completed.")

    meta = session.metadata or {}
    pi_meta = (session.payment_intent.metadata or {}) if session.payment_intent else {}

    address = {}
    try:
        address = json.loads(pi_meta.get("address", "{}"))
    except Exception:
        pass

    artist_interests: list[str] = []
    try:
        artist_interests = json.loads(pi_meta.get("artistInterests", "[]"))
    except Exception:
        pass

    price_pounds = round((session.amount_total or 0) / 100, 2)

    order = {
        "stripeSessionId": session.id,
        "userId": req.userId or meta.get("userId", ""),
        "customerEmail": session.customer_email or "",
        "fullName": meta.get("fullName", ""),
        "phoneNumber": meta.get("phoneNumber", ""),
        "address": address,
        "allergyNotes": meta.get("allergyNotes", ""),
        "toyName": meta.get("toyName", ""),
        "artistName": meta.get("artistName", ""),
        "artistAge": meta.get("artistAge", ""),
        "artistGender": meta.get("artistGender", ""),
        "artistInterests": artist_interests,
        "tier": meta.get("tier", "crafted"),
        "price": price_pounds,
        "conceptImageUrl": meta.get("conceptImageUrl", ""),
        "storyTitle": meta.get("storyTitle", ""),
        "uploadedImageB64": pi_meta.get("uploadedImageB64", ""),
    }

    order_id = await _save_order_to_supabase(order)
    _send_owner_email(order)

    return {
        "orderId": order_id,
        "toyName": order["toyName"],
        "tier": order["tier"],
        "price": price_pounds,
        "customerEmail": order["customerEmail"],
        "fullName": order["fullName"],
        "conceptImageUrl": order["conceptImageUrl"],
        "storyTitle": order["storyTitle"],
        "status": "pending",
    }


@app.get("/api/orders/{user_id}")
async def get_orders(user_id: str) -> list:
    """Fetch all orders for a given user from Supabase."""
    if not SUPABASE_URL or not SUPABASE_SERVICE_KEY:
        return []
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            resp = await client.get(
                f"{SUPABASE_URL}/rest/v1/orders",
                headers={
                    "apikey": SUPABASE_SERVICE_KEY,
                    "Authorization": f"Bearer {SUPABASE_SERVICE_KEY}",
                },
                params={
                    "user_id": f"eq.{user_id}",
                    "order": "created_at.desc",
                    "select": "id,toy_name,tier,price,status,concept_image_url,story_title,created_at,customer_email",
                },
            )
        return resp.json() if resp.is_success else []
    except Exception as exc:
        print(f"[supabase] get_orders failed: {exc}")
        return []
