import React, { useState, useEffect, useCallback } from "react";
import { Check, Edit2, X, RefreshCw, Share2, Download, BookOpen } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";

// Escapes literal newlines/CR inside JSON string values so JSON.parse doesn't choke
// on multi-line story text returned by the backend fallback path.
function _sanitizeJsonNewlines(text: string): string {
  let inString = false;
  let escaped = false;
  let result = "";
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (escaped) { result += ch; escaped = false; continue; }
    if (ch === "\\" && inString) { result += ch; escaped = true; continue; }
    if (ch === '"') { result += ch; inString = !inString; continue; }
    if (inString && ch === "\n") { result += "\\n"; continue; }
    if (inString && ch === "\r") { result += "\\r"; continue; }
    result += ch;
  }
  return result;
}

// Default STEM highlights used when the API hasn't returned specific ones yet
const DEFAULT_STEM: StemHighlight[] = [
  { subject: "Science",     emoji: "🔬", concept: "Forces and energy act on objects to create movement and shape." },
  { subject: "Technology",  emoji: "💻", concept: "AI analyses patterns in images to understand and recreate shapes." },
  { subject: "Engineering", emoji: "⚙️", concept: "3D printers build objects layer-by-layer from digital designs." },
  { subject: "Math",        emoji: "📐", concept: "Geometry and coordinates help turn flat drawings into 3D objects." },
];

const STEM_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  Science:     { bg: "#EFF8FF", text: "#175CD3", border: "#B2DDFF" },
  Technology:  { bg: "#F4EBFF", text: "#6941C6", border: "#D6BBFB" },
  Engineering: { bg: "#FFF6ED", text: "#B93815", border: "#F9DBAF" },
  Math:        { bg: "#ECFDF3", text: "#027A48", border: "#A9EFC5" },
};

interface StemHighlight {
  subject: string;
  emoji: string;
  concept: string;
}

export default function Result() {
  const [uploadedImage,      setUploadedImage]      = useState<string | null>(null);
  const [generatedConceptUrl, setGeneratedConceptUrl] = useState<string | null>(null);
  const [toyName,            setToyName]            = useState("Your Special Toy");
  const [isEditingName,      setIsEditingName]      = useState(false);
  const [tempName,           setTempName]           = useState("");
  const [toyStory,           setToyStory]           = useState("");
  const [storyTitle,         setStoryTitle]         = useState("");
  const [toyPersonality,     setToyPersonality]     = useState("");
  const [stemHighlights,     setStemHighlights]     = useState<StemHighlight[]>(DEFAULT_STEM);
  const [artistName,         setArtistName]         = useState("");
  const [selectedTier,       setSelectedTier]       = useState<"diy" | "crafted">("crafted");
  const [showCelebration,    setShowCelebration]    = useState(true);
  const [pdfLoading,         setPdfLoading]         = useState(false);

  const { user }   = useAuth();
  const { toast }  = useToast();
  const navigate   = useNavigate();

  useEffect(() => {
    const img = sessionStorage.getItem("uploadedImage");
    if (!img) { navigate("/"); return; }
    setUploadedImage(img);

    const conceptUrl = sessionStorage.getItem("generatedConceptUrl");
    if (conceptUrl) setGeneratedConceptUrl(conceptUrl);

    const name = sessionStorage.getItem("toyName");
    if (name) setToyName(name);

    // Story may be stored as plain text or as a raw JSON string (backend fallback path).
    // The raw JSON often has literal newlines inside string values (invalid JSON),
    // so we sanitise before parsing.
    const rawStory = sessionStorage.getItem("toyStory");
    let resolvedStory = rawStory ?? "";
    let resolvedTitle = sessionStorage.getItem("storyTitle") ?? "";
    let resolvedPersonality = sessionStorage.getItem("toyPersonality") ?? "";
    let resolvedHighlights = sessionStorage.getItem("stemHighlights") ?? "";

    if (rawStory?.trim().startsWith("{")) {
      // Pass 1: try to parse properly-escaped JSON (new backend w/ JSON mode)
      // eslint-disable-next-line no-console
      console.debug("[Toyify] Parsing raw JSON story, length:", rawStory.length);
      let extracted = false;
      try {
        const sanitized = _sanitizeJsonNewlines(rawStory);
        const inner = JSON.parse(sanitized) as Record<string, unknown>;
        if (typeof inner.story === "string") { resolvedStory = inner.story; extracted = true; }
        if (!resolvedTitle && typeof inner.storyTitle === "string") resolvedTitle = inner.storyTitle;
        if (!resolvedPersonality && typeof inner.toyPersonality === "string") resolvedPersonality = inner.toyPersonality;
        if (!resolvedHighlights && inner.stemHighlights) resolvedHighlights = JSON.stringify(inner.stemHighlights);
      } catch { /* fall through to regex pass */ }

      // Pass 2: regex extraction for old/corrupt data where JSON.parse can't recover
      if (!extracted) {
        const titleMatch = rawStory.match(/"storyTitle"\s*:\s*"((?:[^"\\]|\\.)*)"/);
        if (titleMatch && !resolvedTitle) resolvedTitle = titleMatch[1];
        const personalityMatch = rawStory.match(/"toyPersonality"\s*:\s*"((?:[^"\\]|\\.)*)"/);
        if (personalityMatch && !resolvedPersonality) resolvedPersonality = personalityMatch[1];
        // Extract story body: everything from "story": " up to the next top-level field marker
        const storyFieldStart = rawStory.indexOf('"story"');
        if (storyFieldStart !== -1) {
          const openQuote = rawStory.indexOf('"', storyFieldStart + 7) + 1;
          // Find the end: look for "stemHighlights" or "toyPersonality" as the closing anchor
          const anchors = ['"stemHighlights"', '"toyPersonality"'];
          let closePos = -1;
          for (const anchor of anchors) {
            const idx = rawStory.indexOf(anchor, openQuote);
            if (idx !== -1 && (closePos === -1 || idx < closePos)) closePos = idx;
          }
          if (closePos !== -1) {
            // Walk backwards past whitespace, comma, quote
            let end = closePos;
            while (end > openQuote && /[\s,"]/.test(rawStory[end - 1])) end--;
            const storyText = rawStory.slice(openQuote, end);
            if (storyText.length > 50) resolvedStory = storyText;
          }
        }
      }
    }

    if (resolvedStory) setToyStory(resolvedStory);
    if (resolvedTitle) setStoryTitle(resolvedTitle);
    if (resolvedPersonality) setToyPersonality(resolvedPersonality);

    const artist = sessionStorage.getItem("artistName");
    if (artist) setArtistName(artist);

    if (resolvedHighlights) {
      try {
        const parsed = JSON.parse(resolvedHighlights) as StemHighlight[];
        if (parsed.length > 0) setStemHighlights(parsed.slice(0, 4));
      } catch {
        // keep defaults
      }
    }

    const t = setTimeout(() => setShowCelebration(false), 2500);
    return () => clearTimeout(t);
  }, []);

  // ── PDF download ──────────────────────────────────────────────────
  const handleDownloadPdf = useCallback(async () => {
    if (!toyStory) {
      toast({ title: "Story not ready yet", description: "Please wait for the story to generate first.", variant: "destructive" });
      return;
    }

    setPdfLoading(true);
    try {
      const apiBase = import.meta.env.VITE_API_URL || "";
      const res = await fetch(`${apiBase}/api/ai/story-pdf`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          toyName,
          storyTitle: storyTitle || `${toyName}'s STEM Adventure`,
          story: toyStory,
          artistName,
          conceptImageUrl: generatedConceptUrl || "",
        }),
      });

      if (!res.ok) throw new Error("PDF generation failed");

      const blob = await res.blob();
      const url  = URL.createObjectURL(blob);
      const a    = document.createElement("a");
      a.href     = url;
      a.download = `${toyName.replace(/\s+/g, "-")}-story.pdf`;
      a.click();
      URL.revokeObjectURL(url);

      toast({ title: "Story downloaded!", description: "Your STEM adventure is saved as a PDF." });
    } catch {
      toast({ title: "Download failed", description: "Please try again in a moment.", variant: "destructive" });
    } finally {
      setPdfLoading(false);
    }
  }, [toyName, storyTitle, toyStory, artistName, generatedConceptUrl, toast]);

  // ── Order ─────────────────────────────────────────────────────────
  const buildCartItems = () => {
    const price = selectedTier === "crafted" ? 59.99 : 49.99;
    const uploadedImageName = sessionStorage.getItem("uploadedImageName") || "drawing.jpg";
    return [{
      orderName: `${toyName}${artistName ? ` — ${artistName}'s drawing` : ` — ${uploadedImageName}`}`,
      price,
      type: selectedTier === "crafted" ? "Fully crafted toy" : "DIY toy kit",
      quantity: 1,
      fileName: uploadedImageName,
      imageVersion: "generated",
      size: 30,
      description: toyStory,
      conceptImageUrl: generatedConceptUrl || "",
      storyTitle: storyTitle || `${toyName}'s STEM Adventure`,
    }];
  };

  const handleOrder = () => {
    const cartItems = buildCartItems();
    if (!user) {
      // Persist cart so checkout can pick it up after login
      sessionStorage.setItem("pendingCartItems", JSON.stringify(cartItems));
      sessionStorage.setItem("postLoginRedirect", "/checkout");
      toast({ title: "Sign in to order", description: "Create a free account to place your order." });
      navigate("/auth?redirect=/checkout");
      return;
    }
    navigate("/checkout", { state: { cartItems } });
  };

  // ── Share ─────────────────────────────────────────────────────────
  const handleShare = async () => {
    const text = "🎨 I just created a custom toy on Toyify! Turn your child's drawings into real toys — try it free!";
    if (navigator.share) {
      await navigator.share({ text, url: window.location.origin }).catch(() => {});
    } else {
      await navigator.clipboard.writeText(text).catch(() => {});
      toast({ title: "Copied to clipboard!", description: "Share the link with friends." });
    }
  };

  const tiers = {
    diy: {
      label: "DIY Kit",
      price: 49.99,
      tag: "Colour it yourself",
      features: ["Uncoloured 3D print", "Acrylic paints included", "STEM story booklet", "5–7 day delivery"],
    },
    crafted: {
      label: "Fully Crafted",
      price: 59.99,
      tag: "Ready to play",
      features: ["Hand-painted by our team", "Premium gift packaging", "STEM story booklet", "5–7 day delivery"],
    },
  };

  // Parse story into paragraphs for proper display
  const storyParagraphs = toyStory
    ? toyStory.split(/\n\n+/).map((p) => p.trim()).filter(Boolean)
    : [];

  return (
    <>
      {/* ── Celebration overlay ─────────────────────────────────────── */}
      {showCelebration && (
        <div
          className="fixed inset-0 z-[500] flex flex-col items-center justify-center pointer-events-none"
          style={{ background: "rgba(66,48,125,0.85)", backdropFilter: "blur(4px)" }}
        >
          <div className="text-6xl mb-4 animate-bounce">🎉</div>
          <h2 className="text-3xl font-bold text-white mb-2" style={{ fontFamily: "var(--font-display)" }}>
            Ta-da! ✨
          </h2>
          <p className="text-white/70 text-sm">Your toy concept is ready!</p>
          {Array.from({ length: 20 }).map((_, i) => (
            <div
              key={i}
              className="absolute rounded-full animate-ping"
              style={{
                width: 6 + (i % 4) * 4,
                height: 6 + (i % 4) * 4,
                left: `${(i * 5) % 95}%`,
                top: `${(i * 4.7 + 10) % 80}%`,
                background: ["#7F56D9", "#F59E0B", "#12B76A", "#EC4899"][i % 4],
                animationDelay: `${(i * 0.1) % 1}s`,
                animationDuration: `${0.8 + (i % 3) * 0.4}s`,
                opacity: 0.7,
              }}
            />
          ))}
        </div>
      )}

      <div className="pb-28 lg:pb-6">
        {/* ── Toy name + edit ─────────────────────────────────────── */}
        <div className="flex items-center gap-2 mb-6">
          {isEditingName ? (
            <>
              <input
                value={tempName}
                onChange={(e) => setTempName(e.target.value)}
                className="text-xl font-bold border-b-2 bg-transparent focus:outline-none flex-1 min-w-0"
                style={{ color: "var(--purple-900)", borderColor: "var(--purple-400)", fontFamily: "var(--font-display)" }}
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === "Enter") { setToyName(tempName); setIsEditingName(false); }
                  if (e.key === "Escape") setIsEditingName(false);
                }}
              />
              <button onClick={() => { setToyName(tempName); setIsEditingName(false); }} className="p-1.5 rounded-full text-green-600 hover:bg-green-50">
                <Check className="w-4 h-4" />
              </button>
              <button onClick={() => setIsEditingName(false)} className="p-1.5 rounded-full text-red-500 hover:bg-red-50">
                <X className="w-4 h-4" />
              </button>
            </>
          ) : (
            <>
              <h1 className="text-2xl font-bold truncate" style={{ color: "var(--purple-900)", fontFamily: "var(--font-display)" }}>
                {toyName}
              </h1>
              <button
                onClick={() => { setTempName(toyName); setIsEditingName(true); }}
                className="flex-shrink-0 p-1.5 rounded-full hover:bg-purple-50 transition-colors"
                style={{ color: "var(--purple-400)" }}
              >
                <Edit2 className="w-4 h-4" />
              </button>
            </>
          )}
        </div>

        {/* ── Main grid ──────────────────────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">

          {/* Left column: images + story */}
          <div className="lg:col-span-3 space-y-5">

            {/* Image pair: original drawing ↔ 3D concept */}
            <div className="grid grid-cols-2 gap-3">
              <div
                className="rounded-3xl overflow-hidden aspect-square relative border-2"
                style={{ background: "#FDFCF8", borderColor: "#FDE68A" }}
              >
                {uploadedImage ? (
                  <img src={uploadedImage} alt="Your drawing" className="w-full h-full object-contain p-3" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-sm" style={{ color: "var(--gray-400)" }}>
                    No drawing
                  </div>
                )}
                <div className="absolute bottom-2 left-2 px-2 py-0.5 rounded-full text-[10px] font-semibold text-white" style={{ background: "rgba(0,0,0,0.55)" }}>
                  {artistName ? `${artistName}'s drawing` : "Your drawing"}
                </div>
              </div>

              <div
                className="rounded-3xl overflow-hidden aspect-square relative border-2"
                style={{ background: "var(--purple-50)", borderColor: "var(--purple-200)" }}
              >
                {generatedConceptUrl ? (
                  <img src={generatedConceptUrl} alt="3D toy concept" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center gap-3 p-4">
                    <div className="w-10 h-10 rounded-full animate-spin" style={{ border: "3px solid var(--purple-200)", borderTopColor: "var(--purple-600)" }} />
                    <p className="text-xs font-medium text-center" style={{ color: "var(--purple-600)" }}>
                      3D concept generating…
                    </p>
                    <button
                      onClick={() => navigate("/generating")}
                      className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full"
                      style={{ color: "var(--purple-700)", background: "var(--purple-100)" }}
                    >
                      <RefreshCw className="w-3 h-3" /> Retry
                    </button>
                  </div>
                )}
                {generatedConceptUrl && (
                  <div className="absolute bottom-2 left-2 px-2 py-0.5 rounded-full text-[10px] font-semibold text-white" style={{ background: "var(--purple-700)" }}>
                    3D concept ✨
                  </div>
                )}
              </div>
            </div>

            {/* Toy personality pill */}
            {toyPersonality && (
              <div
                className="rounded-2xl px-4 py-3 text-sm leading-relaxed"
                style={{ background: "var(--purple-50)", color: "var(--purple-800)", border: "1px solid var(--purple-100)" }}
              >
                <span className="font-semibold">About {toyName}: </span>{toyPersonality}
              </div>
            )}

            {/* STEM Story card */}
            <div
              className="rounded-3xl border overflow-hidden"
              style={{ background: "linear-gradient(135deg, #FDF4FF 0%, #F4EBFF 100%)", borderColor: "var(--purple-100)" }}
            >
              {/* Header row */}
              <div className="flex items-center justify-between gap-2 px-5 pt-5 mb-4">
                <div className="flex items-center gap-2">
                  <BookOpen className="w-4 h-4" style={{ color: "var(--purple-600)" }} />
                  <h2 className="text-xs font-bold uppercase tracking-widest" style={{ color: "var(--purple-600)" }}>
                    {storyTitle || `${toyName}'s STEM Adventure`}
                  </h2>
                </div>
                <button
                  onClick={handleDownloadPdf}
                  disabled={!toyStory || pdfLoading}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all disabled:opacity-40"
                  style={{
                    background: "var(--purple-gradient)",
                    color: "white",
                    boxShadow: "0 2px 8px rgba(127,86,217,0.35)",
                  }}
                  title="Download story as PDF"
                >
                  <Download className="w-3.5 h-3.5" />
                  {pdfLoading ? "Generating…" : "Download PDF"}
                </button>
              </div>

              {/* Story body — full text, paragraph-separated */}
              <div className="px-5 pb-4 max-h-[500px] overflow-y-auto">
                {storyParagraphs.length > 0 ? (
                  <div className="space-y-4">
                    {storyParagraphs.map((para, i) => (
                      <p key={i} className="text-sm leading-relaxed" style={{ color: "var(--gray-700)" }}>
                        {para}
                      </p>
                    ))}
                  </div>
                ) : (
                  <div className="space-y-2">
                    {[92, 78, 85, 65, 70, 55, 80, 68].map((w, i) => (
                      <div key={i} className="h-3 rounded-full animate-pulse" style={{ width: `${w}%`, background: "var(--purple-200)" }} />
                    ))}
                    <p className="text-xs mt-3" style={{ color: "var(--purple-500)" }}>Writing your story…</p>
                  </div>
                )}
              </div>

              {/* STEM highlights grid */}
              <div className="border-t px-5 pt-4 pb-5" style={{ borderColor: "var(--purple-100)" }}>
                <p className="text-[10px] font-bold uppercase tracking-widest mb-3" style={{ color: "var(--purple-500)" }}>
                  STEM in this story
                </p>
                <div className="grid grid-cols-2 gap-3">
                  {stemHighlights.slice(0, 4).map(({ subject, emoji, concept }) => {
                    const c = STEM_COLORS[subject] || STEM_COLORS["Science"];
                    return (
                      <div key={subject} className="rounded-2xl p-3 border" style={{ background: c.bg, borderColor: c.border }}>
                        <div className="flex items-center gap-1.5 mb-1">
                          <span className="text-sm">{emoji}</span>
                          <span className="text-[11px] font-bold uppercase tracking-wider" style={{ color: c.text }}>
                            {subject}
                          </span>
                        </div>
                        <p className="text-[11px] leading-relaxed" style={{ color: c.text, opacity: 0.85 }}>
                          {concept}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Secondary actions */}
            <div className="flex gap-2">
              <button
                onClick={() => navigate("/generating")}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-full text-sm font-semibold border transition-colors hover:bg-purple-50"
                style={{ borderColor: "var(--gray-200)", color: "var(--gray-600)" }}
              >
                <RefreshCw className="w-4 h-4" /> Regenerate
              </button>
              <button
                onClick={handleShare}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-full text-sm font-semibold border transition-colors hover:bg-purple-50"
                style={{ borderColor: "var(--gray-200)", color: "var(--gray-600)" }}
              >
                <Share2 className="w-4 h-4" /> Share
              </button>
              <button
                onClick={() => navigate("/")}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-full text-sm font-semibold border transition-colors hover:bg-purple-50"
                style={{ borderColor: "var(--gray-200)", color: "var(--gray-600)" }}
              >
                ← New drawing
              </button>
            </div>
          </div>

          {/* Right column: pricing */}
          <div className="lg:col-span-2 space-y-4">
            <p className="text-xs font-bold uppercase tracking-widest" style={{ color: "var(--gray-500)" }}>
              Choose your finish
            </p>

            {(["diy", "crafted"] as const).map((tier) => {
              const t = tiers[tier];
              const selected = selectedTier === tier;
              return (
                <button
                  key={tier}
                  onClick={() => setSelectedTier(tier)}
                  className="w-full rounded-3xl p-5 text-left transition-all"
                  style={{
                    border: selected ? "2px solid var(--purple-600)" : "2px solid var(--gray-200)",
                    background: selected ? "var(--purple-50)" : "#fff",
                    boxShadow: selected ? "0 8px 24px rgba(127,86,217,0.15)" : "none",
                  }}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <div className="text-[11px] font-bold uppercase tracking-widest mb-0.5" style={{ color: selected ? "var(--purple-600)" : "var(--gray-400)" }}>
                        {t.tag}
                      </div>
                      <div className="flex items-baseline gap-1.5">
                        <span className="text-2xl font-bold" style={{ color: "var(--purple-900)", fontFamily: "var(--font-display)" }}>
                          £{t.price}
                        </span>
                        <span className="text-xs" style={{ color: "var(--gray-500)" }}>+ £5 postage</span>
                      </div>
                    </div>
                    <div
                      className="w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 mt-1"
                      style={{
                        borderColor: selected ? "var(--purple-600)" : "var(--gray-300)",
                        background: selected ? "var(--purple-600)" : "transparent",
                      }}
                    >
                      {selected && <Check className="w-3.5 h-3.5 text-white" />}
                    </div>
                  </div>
                  <ul className="space-y-1.5">
                    {t.features.map((f) => (
                      <li key={f} className="flex items-center gap-2 text-xs" style={{ color: "var(--gray-600)" }}>
                        <Check className="w-3 h-3 flex-shrink-0" style={{ color: "var(--ds-success)" }} />
                        {f}
                      </li>
                    ))}
                  </ul>
                </button>
              );
            })}

            {/* Desktop PDF download shortcut */}
            <button
              onClick={handleDownloadPdf}
              disabled={!toyStory || pdfLoading}
              className="hidden lg:flex w-full items-center justify-center gap-2 py-3 rounded-full text-sm font-semibold border transition-colors disabled:opacity-40"
              style={{ borderColor: "var(--purple-300)", color: "var(--purple-700)" }}
            >
              <Download className="w-4 h-4" />
              {pdfLoading ? "Generating PDF…" : "Download full story as PDF"}
            </button>

            {/* Desktop order CTA */}
            <button
              onClick={handleOrder}
              className="hidden lg:flex w-full items-center justify-center gap-2 py-4 rounded-full text-white font-bold text-[15px] transition-all ds-btn-primary"
            >
              {`Order ${tiers[selectedTier].label} — £${tiers[selectedTier].price}`}
            </button>

            <div className="hidden lg:flex flex-wrap gap-4 justify-center text-xs" style={{ color: "var(--gray-400)" }}>
              <span>🔒 Secure checkout</span>
              <span>🇬🇧 Printed in the UK</span>
              <span>✓ 14-day returns</span>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile sticky CTA */}
      <div
        className="lg:hidden fixed bottom-0 left-0 right-0 z-50 border-t px-4 pt-3 pb-4 safe-area-pb"
        style={{ background: "rgba(255,255,255,0.97)", backdropFilter: "blur(12px)", borderColor: "var(--gray-100)" }}
      >
        <button onClick={handleOrder} className="w-full ds-btn-primary py-4 text-[15px] font-bold flex items-center justify-center gap-2">
          {`Order ${tiers[selectedTier].label} — £${tiers[selectedTier].price}`}
        </button>
        <p className="text-center text-xs mt-1.5" style={{ color: "var(--gray-400)" }}>
          Secure · Printed in UK · 14-day returns
        </p>
      </div>
    </>
  );
}
