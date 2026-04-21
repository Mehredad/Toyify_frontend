---
name: toyify-design-system
description: Brand and UI system for Toyify — a kid-safe platform that turns children's drawings into 3D-printed toys. Use when designing any Toyify-branded surface (landing pages, upload/preview flows, comic-story editors, checkout, gallery pages). Provides colour tokens (purple gradient + pink/amber accents), dyslexia-friendly type stack (Lexend body, Fredoka display, Caveat handwriting, Permanent Marker SFX), component patterns (pill CTAs, upload zones, pricing cards, comic panels), and tone-of-voice rules.
---

# Toyify Design System — Agent Skill

Use this skill whenever a user asks for Toyify design work. Everything you need is in this folder — no external fetches, no repo lookups.

## What Toyify is

Toyify turns children's drawings into real, 3D-printed keepsake toys. Flow: upload → AI preview → pick plan (£39 Fully Crafted / £29 DIY) → short comic-style story → checkout → 5-7 day delivery. Audience: UK parents buying on behalf of kids aged 3-12.

Tone: curious & cheerful, not childish. British spelling (*colour, customise, realise*). Talk *with* kids and grown-ups, not down to them.

## How to use this folder

1. **Read `README.md`** first — brand context, voice rules, content fundamentals, iconography.
2. **Import `colors_and_type.css`** at the top of any HTML file (`<link rel="stylesheet" href="path/to/colors_and_type.css">`). All tokens are CSS vars on `:root`. Google Fonts are loaded by the same file.
3. **Lift components from the UI kits**:
   - `UI Kit · Mobile App.html` — upload screen, AI preview + plan picker, comic editor (uses `ios-frame.jsx`)
   - `UI Kit · Landing Page.html` — nav, gradient hero, how-it-works, gallery, parallax CTA
4. **Lift single elements from `preview/`** — each card is a standalone demo of one token or component (buttons, badges, pricing cards, upload zone, progress, comic panels, colour scales, type specimens, spacing, shadows).

## Token cheatsheet

**Brand gradient:** `var(--purple-gradient)` = `linear-gradient(to top right, #42307D, #7F56D9)`. Use for hero bands and parallax CTAs.

**Primary CTA:** purple pill (`--purple-600` bg, white text, 9999px radius, min-height 48px). For hero "magic moments", swap to the sparkle gradient (`linear-gradient(180deg, #EC4899, #BE185D)` + pink glow).

**Body text:** Lexend 16/1.65, `--gray-700`. Never pure black. Line height 1.65+ for dyslexia-friendly reading.

**Headlines:** Fredoka 600-700, letter-spacing −.02em. Mix in Caveat (handwritten) for emotional beats ("*play with it*") and Permanent Marker for comic SFX (POW!, ZOOM!).

**Radii:** 12/16/20/24px rounded, 9999px for pills and chips. No sharp corners on interactive elements.

**Semantic:** `--success #12B76A`, `--warning #F79009`, `--danger #F04438`, `--info #2E90FA` — each with a `-bg` tinted background.

## Rules to follow

- **48px minimum touch target.** Kids' fingers, parents' thumbs.
- **No emoji in UI chrome** unless explicitly part of a badge or kicker. Draw SVG icons or use placeholder frames instead.
- **Imagery first, data second.** Show the drawing and the toy. Don't pad with stats or icon rows.
- **One pink and one amber accent per screen, max.** The purple gradient does the heavy lifting.
- **Never use Inter, Roboto, or a system stack for body.** Lexend is non-negotiable — it's the accessibility commitment.
- **Placeholders over bad AI art.** If you don't have the real child's drawing or the toy render, use the existing `assets/Hero Video 2 1.png` (pink mascot) or `assets/test-penguin.jpeg` plus a dashed frame.

## Files

- `README.md` — full brand context, voice, visual foundations, iconography
- `colors_and_type.css` — all tokens (colours, type, radii, shadows, motion, focus rings)
- `assets/` — logos (`Logo.svg`, `Logo-purple.svg`), mascot, arrow, video frame
- `preview/*.html` — standalone component/token specimens
- `UI Kit · Mobile App.html`, `UI Kit · Landing Page.html` — in-context examples
- `ios-frame.jsx` — iOS device frame for mobile mocks
