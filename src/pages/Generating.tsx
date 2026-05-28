import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

const STEPS = [
  { icon: "🔍", text: "Analysing your drawing..." },
  { icon: "📐", text: "Designing the 3D concept..." },
  { icon: "🎨", text: "Adding colours and personality..." },
  { icon: "📝", text: "Writing your STEM story..." },
  { icon: "✨", text: "Almost done! Putting it all together..." },
];

const STEP_DURATION = 12_000; // 12s per step

const FACTS = [
  "The first 3D printer was invented in 1983 by Chuck Hull!",
  "Robots were first used in car factories in the 1960s.",
  "STEM skills are used in every single job in the world.",
  "The International Space Station orbits Earth every 92 minutes!",
  "Engineers designed the first video game controller in 1972.",
  "There are more than 8.7 million species of animals on Earth.",
  "Light travels 299,792 km every single second.",
  "The human brain has about 86 billion neurons.",
  "3D printing is used to make everything from houses to human bones.",
  "The word 'robot' comes from the Czech word 'robota', meaning 'hard work'.",
];

const SHOW_SKIP_HINT_MS  = 60_000;
const SHOW_SKIP_CTA_MS   = 120_000;

export default function Generating() {
  const [currentStep, setCurrentStep]   = useState(0);
  const [elapsed, setElapsed]           = useState(0);
  const [factIndex, setFactIndex]       = useState(0);
  const [isDone, setIsDone]             = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const img = sessionStorage.getItem("uploadedImage");
    if (!img) { navigate("/"); return; }

    // Clear previous results
    for (const k of ["generatedConceptUrl", "toyName", "toyStory", "drawingDescription",
                      "stemHighlights", "storyTitle", "toyPersonality"]) {
      sessionStorage.removeItem(k);
    }

    generateAll(img);
  }, []);

  const generateAll = async (imageData: string) => {
    try {
      const apiBase = import.meta.env.VITE_API_URL || "";

      // Collect artist context saved by Artist.tsx
      const artistName      = sessionStorage.getItem("artistName")      || "the artist";
      const artistAge       = sessionStorage.getItem("artistAge")       || "8";
      const artistGender    = sessionStorage.getItem("artistGender")    || "";
      const artistInterests = JSON.parse(sessionStorage.getItem("artistInterests") || "[]") as string[];

      // ── Step 1: 3D concept image + toy name ──────────────────────
      const conceptRes = await fetch(`${apiBase}/api/ai/toy-concept`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageData, artistName, artistAge, artistGender, artistInterests }),
      });

      let toyName = "Your Special Toy";
      let drawingDescription = "";

      if (conceptRes.ok) {
        const d = await conceptRes.json();
        if (d.previewImage)        sessionStorage.setItem("generatedConceptUrl", d.previewImage);
        if (d.toyName)             { toyName = d.toyName; sessionStorage.setItem("toyName", d.toyName); }
        if (d.drawingDescription)  { drawingDescription = d.drawingDescription; sessionStorage.setItem("drawingDescription", d.drawingDescription); }
      }

      // ── Step 2: Personalised STEM story ──────────────────────────
      const storyRes = await fetch(`${apiBase}/api/ai/toy-story`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ toyName, drawingDescription, artistName, artistAge, artistGender, artistInterests }),
      });

      if (storyRes.ok) {
        const d = await storyRes.json();
        if (d.story)            sessionStorage.setItem("toyStory",       d.story);
        if (d.storyTitle)       sessionStorage.setItem("storyTitle",     d.storyTitle);
        if (d.stemHighlights)   sessionStorage.setItem("stemHighlights", JSON.stringify(d.stemHighlights));
        if (d.toyPersonality)   sessionStorage.setItem("toyPersonality", d.toyPersonality);
      } else {
        const errText = await storyRes.text().catch(() => "unknown");
        console.error("[Toyify] Story generation failed:", storyRes.status, errText);
      }
    } catch (err) {
      console.error("[Toyify] Generation error:", err);
    } finally {
      setIsDone(true);
    }
  };

  // Step ticker — every 500 ms
  useEffect(() => {
    const t = setInterval(() => {
      setElapsed((prev) => {
        const next = prev + 500;
        setCurrentStep(Math.min(Math.floor(next / STEP_DURATION), STEPS.length - 1));
        return next;
      });
    }, 500);
    return () => clearInterval(t);
  }, []);

  // Fact rotation — every 8 s
  useEffect(() => {
    const t = setInterval(() => setFactIndex((p) => (p + 1) % FACTS.length), 8000);
    return () => clearInterval(t);
  }, []);

  // Auto-navigate when done (minimum 3 s of animation shown)
  useEffect(() => {
    if (!isDone) return;
    const remaining = Math.max(0, 3000 - elapsed);
    const t = setTimeout(() => navigate("/result"), remaining + 1200);
    return () => clearTimeout(t);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isDone]);

  const step         = STEPS[currentStep];
  const showSkipHint = elapsed >= SHOW_SKIP_HINT_MS;
  const showSkipCta  = elapsed >= SHOW_SKIP_CTA_MS;

  return (
    <div
      className="fixed inset-0 z-[200] flex flex-col items-center justify-center overflow-hidden"
      style={{ background: "var(--purple-gradient-hero)" }}
    >
      {/* Floating sparkles */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden" aria-hidden>
        {Array.from({ length: 14 }).map((_, i) => (
          <div
            key={i}
            className="absolute text-white/20 animate-bounce select-none"
            style={{
              fontSize: `${14 + (i % 3) * 6}px`,
              left: `${(i * 7.14) % 95}%`,
              top: `${(i * 6.5 + 5) % 85}%`,
              animationDelay: `${(i * 0.25) % 2}s`,
              animationDuration: `${2 + (i % 4) * 0.5}s`,
            }}
          >
            ✨
          </div>
        ))}
      </div>

      {/* Centre card */}
      <div className="relative z-10 flex flex-col items-center text-center px-6 max-w-sm w-full">

        {/* Spinning ring + step icon */}
        <div className="relative w-36 h-36 mb-8">
          <svg
            className="absolute inset-0 w-full h-full animate-spin"
            style={{ animationDuration: "2s" }}
            viewBox="0 0 140 140"
          >
            <circle cx="70" cy="70" r="62" fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="8" />
            <circle
              cx="70" cy="70" r="62"
              fill="none"
              stroke="white"
              strokeWidth="8"
              strokeDasharray="390"
              strokeDashoffset="292"
              strokeLinecap="round"
            />
          </svg>
          <div
            className="absolute inset-4 rounded-full animate-pulse"
            style={{ background: "rgba(255,255,255,0.08)" }}
          />
          <div className="absolute inset-0 flex items-center justify-center" style={{ fontSize: "3rem" }}>
            {step.icon}
          </div>
        </div>

        {/* Step text */}
        <h2
          className="text-xl font-bold text-white mb-2"
          style={{ fontFamily: "var(--font-display)" }}
        >
          {showSkipCta
            ? "Still crafting your toy…"
            : showSkipHint
            ? "Taking a bit longer than usual..."
            : step.text}
        </h2>
        <p className="text-sm mb-8" style={{ color: "rgba(255,255,255,0.65)" }}>
          {showSkipCta
            ? "Our AI is being extra creative. Browse while we finish!"
            : showSkipHint
            ? "Our AI is working extra hard on your toy! 🚀"
            : "Creating something magical just for you"}
        </p>

        {/* STEM fact card */}
        <div
          className="w-full rounded-2xl px-5 py-4 mb-6"
          style={{ background: "rgba(255,255,255,0.12)", backdropFilter: "blur(8px)" }}
        >
          <p className="text-[10px] font-bold uppercase tracking-widest mb-1.5" style={{ color: "rgba(255,255,255,0.55)" }}>
            Did you know?
          </p>
          <p className="text-sm text-white font-medium leading-relaxed">
            {FACTS[factIndex]}
          </p>
        </div>

        {/* Step dots */}
        <div className="flex gap-2">
          {STEPS.map((_, i) => (
            <div
              key={i}
              className="rounded-full transition-all duration-500"
              style={{
                width: i === currentStep ? 20 : 8,
                height: 8,
                background: i <= currentStep ? "white" : "rgba(255,255,255,0.3)",
              }}
            />
          ))}
        </div>

        {/* 60 s: soft skip link */}
        {showSkipHint && !showSkipCta && (
          <button
            onClick={() => navigate("/result")}
            className="mt-8 text-xs font-medium underline underline-offset-2 transition-opacity hover:opacity-100"
            style={{ color: "rgba(255,255,255,0.55)" }}
          >
            Browse while we finish →
          </button>
        )}

        {/* 2 min: prominent CTA */}
        {showSkipCta && (
          <div
            className="mt-8 w-full rounded-2xl p-4 text-center"
            style={{ background: "rgba(255,255,255,0.15)", backdropFilter: "blur(8px)" }}
          >
            <p className="text-xs text-white/70 mb-3">
              Generation is still running in the background.<br />
              You can view your result now and refresh when ready.
            </p>
            <button
              onClick={() => navigate("/result")}
              className="w-full py-3 rounded-xl text-sm font-bold text-white border-2 border-white/40 hover:bg-white/10 transition-colors"
            >
              Take a look anyway →
            </button>
            <button
              onClick={() => navigate("/")}
              className="mt-2 w-full py-2 text-xs font-medium transition-opacity hover:opacity-100"
              style={{ color: "rgba(255,255,255,0.5)" }}
            >
              Go back to home
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
