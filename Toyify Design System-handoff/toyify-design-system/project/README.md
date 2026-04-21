# Toyify Design System

**Toyify** turns children's drawings into real, 3D-printed STEM toys. A child uploads a doodle; AI generates a toy-preview concept + a short illustrated story; a parent orders the physical toy (fully crafted £39 or DIY colour-it-yourself £29). Printed in PLA (eco-friendly), shipped to UK homes in 5–7 working days.

This design system documents the visual language, code tokens, and reusable UI so future work stays on-brand.

> **Tone in one line:** Curious and cheerful, not childish. We talk *with* kids (and their grown-ups), never down to them. British spelling — *colour*, *customise*, *realise*.

---

## Sources we pulled from

- **Primary codebase** — `github.com/Mehredad/Toyify_frontend` (main branch, commit `40657961`). React + Vite + shadcn/ui + Tailwind. Lovable-scaffolded. Ships the live marketing + upload + preview + checkout flow.
- **Related repos** (not pulled, but referenced as product surfaces): `Mehredad/Toyify_backend`, `Mehredad/Buzzy-Interpretator` (AI concept generator), `Mehredad/Customer_Analysis`.
- **Assets copied into `assets/`** — `Logo.svg`, `Logo.png`, `Hero Video 2 1.png` (pink Molang-style mascot), `Video frame.png` (3 rotated feature chips), `arrow.png` (breadcrumb kicker).
- We rely on shadcn HSL vars from `src/index.css` and the hard-coded hex values from `src/pages/Home.tsx` / `Result.tsx` / `MainLayout.tsx` (purple ramp `#42307D → #7F56D9 → #9E77ED`, `#F9F5FF` surface, `#414651` body).

Don't assume the reader has repo access; everything the system needs lives in this project.

---

## Index — what's in this folder

| Path | What it is |
|---|---|
| `README.md` | This file — brand context, tone, visual foundations, iconography |
| `SKILL.md` | Agent-skill entrypoint so this folder is drop-in for Claude Code |
| `colors_and_type.css` | CSS variables — colour ramps, semantic tokens, type recipes, radii, shadows, motion |
| `assets/` | Logos, mascot hero image, feature-chip illustration, arrow glyph |
| `preview/` | Design-system card snippets (colour swatches, type specimens, component states). These populate the **Design System** tab |
| `UI Kit · Mobile App.html` | Three-screen mobile kit — Upload, AI Preview + plan picker, Comic story editor |
| `UI Kit · Landing Page.html` | Marketing landing page — nav, gradient hero with collage, How It Works, gallery, parallax CTA, footer |
| `ios-frame.jsx` | iOS device frame (starter component) used by the mobile UI kit |

---

## Product map

Toyify is one surface today (a responsive web app that works on mobile + desktop). The repo uses React Router; the key user-facing routes are:

- `/` **Home / Landing** — hero mascot, breadcrumb kicker, drag-and-drop upload zone, "Get started for free" CTA
- `/result` **Result** — shows original drawing vs AI preview, auto-generated toy name + story, two pricing cards (£39 Fully Crafted / £29 DIY), Add to cart
- `/preview`, `/customize` — stubs in the current repo
- `/checkout`, `/success`, `/cart`, `/profile` — commerce surface
- `/auth`, `/signup` — account creation
- `/about`, `/contact`, `/terms`, `/privacy` — marketing footer

The **5-step journey** the brief mentions is: **Upload → Preview → Customise → Review Story → Checkout**. The repo currently ships Upload → Result → Checkout; this design system builds out the missing steps in `ui_kits/app`.

---

## Content fundamentals (how we write)

**Voice**: warm, cheerful grown-up talking to a curious 7-year-old *and* their parent at the same time. Never babyish. Never salesy. A tiny bit of wonder.

**Tone shifts by surface**:
- **Marketing / hero copy** — declarative and direct: *"A platform to make your drawings into real toys."* No adjectives stacked, no hype words.
- **Micro-copy / prompts** — action-verb first: *"Drag & drop your drawing here"*, *"Get started for free"*, *"Click to upload"*.
- **Generated story blocks (AI)** — short, imaginative, second-person: *"Buzzy the cutie Cat is waiting for its adventure to begin."* Title-cased names. Never scary.
- **System / error** — plain and reassuring, no blame on the child. *"Failed to generate AI image — Try again."* / *"Please upload an image file."*
- **Toasts** — past-tense confirmation + next step: *"Preview ready — Toy preview generated!"*, *"Order submitted! — Check your email for confirmation."*

**Person**: we say *you* (*your drawing*, *your toy*). Toyify refers to itself as *we* only in legal/footer; elsewhere the product is invisible.

**Casing**: Sentence case for everything — buttons, nav, headings. Only proper nouns and toy-names are Title Case. `Toyify` is the only all-lowercase-looking wordmark and is always capitalised when inline (*"Let's toyify"* kicker is deliberately lowercase).

**Emoji**: one rocket 🚀 in the breadcrumb kicker (*"🚀 Let's toyify"*). **That's the only emoji in the product.** Do not add more. If you need a glyph, use a Lucide icon.

**British spelling**: *colour, customise, realise, personalise, favourite*. **£** not $. Phone numbers are UK format.

**Numbers / prices**: `£39`, `£29`. VAT status stated inline (*"VAT included"*). Delivery in *working days* not *business days*.

**Forbidden words**: *awesome*, *amazing*, *magical* (overused in kids' products), *revolutionary*, *cutting-edge*, *kids* in nav (use *children* in body, *kids* only in casual micro-copy like *"Safe material for kids & environment"*).

**Examples from the codebase**:
- `"A platform to make your drawings into real toys"`
- `"Transform any drawing, scribble, doodle and mark-making into real toys and preview it for free"`
- `"Drag & drop your drawing here to upload"`
- `"Ready in 5-7 days"` / `"Safe material for kids & environment"` / `"Free shipping !"` (feature chips)
- `"Creating your toy magic..."` (loading state — one of the rare "magic" uses, reserved for the single genesis moment)
- `"I am happy with the selected name, story, and style to continue"` (confirmation checkbox)

---

## Visual foundations

### Colour
The brand sits on a **two-tone purple gradient** (`#42307D → #7F56D9`) applied to the full viewport — all content lives on a **white rounded-3xl card** floating on top of that gradient (`MainLayout`). Inside the card, colour is used sparingly: **purple-900 (`#42307D`) for headings**, **purple-500 (`#9E77ED`) for emphasis words**, **purple-600 (`#7F56D9`) for all primary CTAs**, and Untitled-UI-grey for body copy (`#414651`). Supporting pops are **hot pink** (sparkle button, accent UI via `--primary: 323 81% 65%`) and **amber** (via `--secondary: 43 100% 63%`) — used tiny and sparingly, never both at once.

Dark mode is defined in `src/index.css` but the live product ships light-only.

### Type
- **Display / playful** — Fredoka (free, rounded, geometric) for headlines and the "toyify" energy. The repo uses Inter for everything, which reads flat; **we're substituting Fredoka for display and Lexend for body** to hit the dyslexia-friendly requirement — Lexend is designed expressly for that. **Flag for the user**: if you have a licensed display font, drop the `.woff2` into `fonts/` and swap `--font-display`.
- **Body** — Lexend (Google Fonts, dyslexia-research-based; loose letter-spacing, high x-height). Line-height `1.65` on body. Paragraph widths max out at ~65ch.
- **Handwritten** — Caveat, for stickers, margin scribbles, doodle annotations. Already in the repo's Tailwind config as `font-handwritten`.
- **Comic / SFX** — Permanent Marker, already in repo as `font-sketchy`. For the comic-panel speech bubbles and big "POW!" style accents in the story editor.
- **Inter** — kept for form UI chrome to preserve shadcn defaults.

### Spacing & grid
4px base unit. Pages are `max-w-[1500px]` centred on a white card with `px-6 py-6` inside. Hero grid is `lg:grid-cols-2` with `gap-10`. Product surfaces commonly use `lg:grid-cols-4` with 2+2 splits. Touch targets are **min 48px** (`--space-9`) per the brief; CTA buttons are `h-11 px-8` rounded-full.

### Backgrounds
- Full-viewport purple gradient (`linear-gradient(to top right, #42307D, #7F56D9)`) — this is the signature.
- Content surfaces are white, radius `24–28px`, shadow `xl`, floating on the gradient with 20px top and 40px bottom margin.
- Breadcrumb "kicker" pills use `--purple-100` fill with `--purple-200` inner badge — a pill-in-a-pill pattern with an arrow glyph, copied from `Home.tsx`.
- Upload/drop-zones are dashed `2px` `--purple-500` on `white`, snapping to dashed `--purple-600` on drag-over with a subtle `--purple-50` fill.
- No gradient meshes, no aurora, no noise textures. Stay flat.

### Animation
Short, bouncy, generous. The repo's `sparkle-button` uses `.3s` transitions with `scale(1.1)` on hover and a conic-gradient sparkle orbit; the `loader` uses a contrast-15 clipPath animation rotating over 2s with a hue-rotate cycle. **We formalise this**: use `--ease-spring` (overshoot `cubic-bezier(0.34, 1.56, 0.64, 1)`) for "enter" states, `--ease-out` for dismisses, and `--dur-base` (250ms) as the default duration. Feature chips (`Video frame.png`) are rotated `-6deg` at rest and straighten (`rotate(0)`) on hover — **chip tilt is a brand motif**.

### Hover / press / focus
- **Hover (buttons)**: darken by ~10% (`bg-purple-600 → bg-purple-700`). No translate.
- **Hover (tilted cards / chips)**: un-rotate to 0.
- **Press**: scale to 1 (coming down from a hover scale of 1.1 in the sparkle pattern), no shadow change.
- **Focus**: `box-shadow: 0 0 0 4px rgba(127, 86, 217, 0.25)` — always visible, WCAG 2.1 AA.
- **Disabled**: `opacity: 0.5`, pointer-events none, cursor not-allowed. Grey fill if standalone (e.g. the Add-to-cart button goes `bg-gray-400 cursor-not-allowed`).

### Borders
- Default border is `1px` `--gray-300`.
- Brand borders are `2px` `--purple-300` or `--purple-500` (dashed, for drop zones).
- Selected-state borders: `2px` `--purple-600` with `shadow-lg` + `--purple-50` fill.

### Shadows (elevation)
Neutral drop shadows on white cards; **no coloured glow except on brand CTAs**. The sparkle button uses a `--glow-purple` ring. Tilted chips have `shadow-md`.

### Radii
Rounded is the vibe. Buttons: `rounded-full`. Small UI (inputs, badges): `12px`. Cards: `16–24px`. Outer app shell: `28px`. Never sharp.

### Transparency / blur
Used once: the mobile nav drops to `bg-purple-600/95 backdrop-blur-sm` when the menu opens. Otherwise surfaces are opaque. Don't use frosted glass elsewhere.

### Imagery
Warm, pink/purple-tinted, slightly glossy mascots (the hero is a Molang-style pink blob hugging a yellow chick). Illustrations have thin black outlines + pastel fills + subtle marbled paper texture. Rotated tilt on feature cards. **No photography** in the current product; if you need photos, use warm-lit, soft-focus kid-drawing/craft shots.

### Corner radii on images
Hero mascot images are un-cropped, freestanding (PNG with transparency). Thumbnail / toy-preview tiles are `rounded-2xl` with a `2px` dashed `--purple-300` inner frame.

### Cards
- **Toy-preview tile** (Result page) — `rounded-3xl`, `--purple-50` fill, `2px` `--purple-50` border (goes `--purple-600` + shadow on select), inner dashed 2px frame.
- **Pricing card** — `rounded-2xl`, white, `2px` `--gray-300` default → `--purple-500` + `shadow-lg` selected.
- **Feature chip** — `rounded-lg`, white, `shadow-md`, rotated `-6deg`/`+4deg`/`-3deg`.

### Layout rules
- Nav is `fixed top-0`, transparent over the gradient, white text. Logo is the white SVG (use `Logo.svg` on gradient, `Logo-purple.svg` on white).
- Footer copyright is `fixed bottom-2`, tiny, centred.
- The white content shell has `max-height: calc(100vh - 140px)` with its own scroll (`no-scrollbar` utility). Don't break this.

---

## Iconography

**The product uses [lucide-react](https://lucide.dev) v0.462.** Stroke-based, rounded caps, 24×24 @ `stroke-width: 2`. In the codebase Lucide is rendered at `w-4 h-4` (16px) for inline UI and `w-5 h-5` (20px) for the nav.

Lucide icons seen live in the repo: `Upload, ChevronDown, ChevronUp, Menu, X, Loader2, Sparkles, Edit, Edit2, Download, LogIn, LogOut, User, Check, UserIcon`, plus inline SVG for the cart (hand-drawn stroke path matching Lucide's weight).

**Rules**:
- Always `lucide-react`. No Material, Feather, Heroicons, or custom icon fonts.
- Colour from `currentColor`. Size via Tailwind `size-*` or explicit `width/height`.
- Icons in buttons get a `gap-2` between icon + label; icon sits **left** of the label unless it's a directional "Add to cart →" arrow, which goes right.
- **No emoji**, ever, except the one `🚀` in the breadcrumb kicker. If you need a playful stand-in, use `Sparkles` from Lucide.
- Unicode → avoid. `→` in buttons is fine (repo uses it literally). `£` for currency.
- No custom SVG icons in this system. The only bespoke SVGs are the **logo** (`assets/Logo.svg`) and the **cart glyph** inlined in `navbar.tsx` (kept as-is to preserve the brand's drawn feel).
- **Loading spinner** is the repo's `<Loader2 className="animate-spin" />` or the bespoke `.loader` CSS (see `src/index.css`) for the hero-scale "creating your toy magic" state.

**Illustration**: the hero mascot (`Hero Video 2 1.png`) and feature chips (`Video frame.png`) are raster illustrations. Treat them as first-class brand assets. Never redraw in SVG; if we need more, commission matching assets.

---

## Do's and don'ts

**Do**
- Put all content on a white rounded-3xl card floating on the purple gradient.
- Use Fredoka for headlines, Lexend for body, keep line-height ≥1.5.
- Use British spelling and sentence case.
- Tilt feature chips a few degrees; straighten on hover.
- Use purple-600 for primary CTAs, always pill-shaped.
- Use Lucide icons, 16px inline / 20px in nav.
- Use `£` + *working days*.
- Min 48px touch targets.

**Don't**
- Don't put emoji anywhere except the single 🚀 kicker.
- Don't stack gradients — one gradient, one direction, one system.
- Don't use `Inter` for headlines (legacy); migrate to Fredoka.
- Don't nest frosted glass / blur — one mobile-menu use only.
- Don't use hard right-angles. Ever.
- Don't use the words *awesome / amazing / magical / revolutionary* in copy.
- Don't tint images purple to match the brand — let illustrations be their native warm colours.
- Don't use pure `#000` text — always `--gray-700` or darker purple.

---

## Caveats / flags for the user

- **Fonts**: we substituted **Fredoka** (display) and **Lexend** (body) from Google Fonts. The repo currently ships Inter-only. If you have licensed brand fonts, drop the files into `fonts/` and update `--font-display` + `--font-body` in `colors_and_type.css`.
- **5-step journey**: the brief specifies Upload → Preview → Customise → Review → Checkout. The live repo collapses Preview+Customise into the `/result` route. The UI kit fills in the missing steps based on the brief, not the code.
- **Spline 3D viewer**: `index.html` loads `@splinetool/viewer` but no scene URL is checked in. The landing-hero 3D toy preview is mocked with a rotating PNG + CSS in the UI kit; wire up a real Spline scene in production.
- **Mascot**: the repo's mascot isn't named in code but uses "Buzzy" in sample titles (and the component file is `BuzzyLanding.tsx`). Confirm the canonical mascot + product name — "Toyify" in the logo vs "Buzzy / BuzzyMuzzy" in code is inconsistent today.
