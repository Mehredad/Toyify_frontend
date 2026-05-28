import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

const INTERESTS = [
  { emoji: "🚀", label: "Space" },
  { emoji: "🦖", label: "Dinos" },
  { emoji: "🎨", label: "Art" },
  { emoji: "⚽", label: "Sports" },
  { emoji: "🤖", label: "Robots" },
  { emoji: "🧪", label: "Science" },
  { emoji: "📚", label: "Books" },
  { emoji: "🎮", label: "Games" },
  { emoji: "🎵", label: "Music" },
  { emoji: "🌳", label: "Nature" },
  { emoji: "🐶", label: "Animals" },
  { emoji: "🍕", label: "Cooking" },
];

export default function Artist() {
  const [name, setName] = useState("");
  const [age, setAge] = useState("");
  const [gender, setGender] = useState("");
  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);
  const navigate = useNavigate();

  const toggleInterest = (label: string) => {
    if (selectedInterests.includes(label)) {
      setSelectedInterests((prev) => prev.filter((i) => i !== label));
    } else if (selectedInterests.length < 5) {
      setSelectedInterests((prev) => [...prev, label]);
    }
  };

  const canGenerate = name.trim().length >= 2 && age !== "";

  const handleGenerate = () => {
    sessionStorage.setItem("artistName", name.trim());
    sessionStorage.setItem("artistAge", age);
    sessionStorage.setItem("artistGender", gender);
    sessionStorage.setItem("artistInterests", JSON.stringify(selectedInterests));
    navigate("/generating");
  };

  return (
    <div className="pb-28 lg:pb-8">
      {/* Progress bar */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold" style={{ color: "var(--purple-600)" }}>
            Almost there!
          </span>
          <span className="text-xs" style={{ color: "var(--gray-400)" }}>80% complete</span>
        </div>
        <div className="w-full h-2 rounded-full overflow-hidden" style={{ background: "var(--gray-100)" }}>
          <div
            className="h-2 rounded-full"
            style={{ width: "80%", background: "var(--purple-gradient)" }}
          />
        </div>
      </div>

      {/* Header */}
      <div className="text-center mb-8">
        <div className="text-4xl mb-3">👨‍🎨</div>
        <h1
          className="text-2xl font-bold mb-2"
          style={{ color: "var(--purple-900)", fontFamily: "var(--font-display)" }}
        >
          Tell Us About the Artist!
        </h1>
        <p className="text-sm" style={{ color: "var(--gray-500)" }}>
          This helps us create the perfect toy (takes 1 minute)
        </p>
      </div>

      {/* Form */}
      <div className="max-w-xl mx-auto space-y-4">
        {/* Name */}
        <div
          className="rounded-3xl p-6 border"
          style={{ background: "#fff", borderColor: "var(--gray-200)" }}
        >
          <label
            className="block text-sm font-semibold mb-3"
            style={{ color: "var(--gray-700)" }}
          >
            What's your name?
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={50}
            placeholder="First name only"
            className="w-full px-4 py-3 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-purple-400 transition-colors"
            style={{ borderColor: "var(--gray-200)", color: "var(--gray-800)" }}
          />
          <p className="text-xs mt-2" style={{ color: "var(--gray-400)" }}>
            Just your first name is fine!
          </p>
        </div>

        {/* Age */}
        <div
          className="rounded-3xl p-6 border"
          style={{ background: "#fff", borderColor: "var(--gray-200)" }}
        >
          <label
            className="block text-sm font-semibold mb-3"
            style={{ color: "var(--gray-700)" }}
          >
            How old are you?
          </label>
          <select
            value={age}
            onChange={(e) => setAge(e.target.value)}
            className="w-full px-4 py-3 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-purple-400 transition-colors appearance-none"
            style={{
              borderColor: "var(--gray-200)",
              color: age ? "var(--gray-800)" : "var(--gray-400)",
            }}
          >
            <option value="">Select age</option>
            {Array.from({ length: 9 }, (_, i) => i + 7).map((a) => (
              <option key={a} value={a}>
                {a} years old
              </option>
            ))}
          </select>
        </div>

        {/* Gender (optional) */}
        <div
          className="rounded-3xl p-6 border"
          style={{ background: "#fff", borderColor: "var(--gray-200)" }}
        >
          <label
            className="block text-sm font-semibold mb-1"
            style={{ color: "var(--gray-700)" }}
          >
            I identify as:{" "}
            <span className="font-normal" style={{ color: "var(--gray-400)" }}>
              (optional)
            </span>
          </label>
          <p className="text-xs mb-4" style={{ color: "var(--gray-400)" }}>
            This helps us personalise your toy
          </p>
          <div className="grid grid-cols-2 gap-2">
            {["Boy", "Girl", "Other", "Prefer not to say"].map((g) => (
              <button
                key={g}
                type="button"
                onClick={() => setGender(g === gender ? "" : g)}
                className="px-4 py-2.5 rounded-xl text-sm font-medium transition-all border"
                style={{
                  background: gender === g ? "var(--purple-600)" : "#fff",
                  color: gender === g ? "#fff" : "var(--gray-600)",
                  borderColor: gender === g ? "var(--purple-600)" : "var(--gray-200)",
                }}
              >
                {g}
              </button>
            ))}
          </div>
        </div>

        {/* Interests */}
        <div
          className="rounded-3xl p-6 border"
          style={{ background: "#fff", borderColor: "var(--gray-200)" }}
        >
          <div className="flex items-center justify-between mb-1">
            <label
              className="text-sm font-semibold"
              style={{ color: "var(--gray-700)" }}
            >
              What are you interested in?
            </label>
            <span
              className="text-xs font-semibold px-2.5 py-1 rounded-full"
              style={{ background: "var(--purple-100)", color: "var(--purple-700)" }}
            >
              {selectedInterests.length}/5
            </span>
          </div>
          <p className="text-xs mb-4" style={{ color: "var(--gray-400)" }}>
            Pick up to 5 things
          </p>
          <div className="grid grid-cols-4 gap-2">
            {INTERESTS.map(({ emoji, label }) => {
              const selected = selectedInterests.includes(label);
              const maxed = selectedInterests.length >= 5 && !selected;
              return (
                <button
                  key={label}
                  type="button"
                  onClick={() => toggleInterest(label)}
                  disabled={maxed}
                  className="flex flex-col items-center gap-1 py-3 px-1 rounded-2xl text-center transition-all border"
                  style={{
                    background: selected ? "var(--purple-600)" : "#fff",
                    borderColor: selected ? "var(--purple-600)" : "var(--gray-200)",
                    opacity: maxed ? 0.45 : 1,
                    cursor: maxed ? "not-allowed" : "pointer",
                  }}
                >
                  <span className="text-xl">{emoji}</span>
                  <span
                    className="text-[11px] font-medium leading-tight"
                    style={{ color: selected ? "#fff" : "var(--gray-600)" }}
                  >
                    {label}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Desktop CTA */}
      <div className="hidden lg:block max-w-xl mx-auto mt-6 space-y-3">
        <button
          onClick={handleGenerate}
          disabled={!canGenerate}
          className="w-full ds-btn-primary py-4 text-[15px] font-bold transition-opacity"
          style={{ opacity: canGenerate ? 1 : 0.45 }}
        >
          Generate My Toy Concept! 🚀
        </button>
        <p className="text-center text-xs" style={{ color: "var(--gray-400)" }}>
          This usually takes 30–60 seconds
        </p>
      </div>

      {/* Mobile sticky CTA */}
      <div
        className="lg:hidden fixed bottom-0 left-0 right-0 z-50 border-t px-4 pt-3 pb-4 safe-area-pb"
        style={{
          background: "rgba(255,255,255,0.97)",
          backdropFilter: "blur(12px)",
          borderColor: "var(--gray-100)",
        }}
      >
        <button
          onClick={handleGenerate}
          disabled={!canGenerate}
          className="w-full ds-btn-primary py-4 text-[15px] font-bold transition-opacity"
          style={{ opacity: canGenerate ? 1 : 0.45 }}
        >
          Generate My Toy Concept! 🚀
        </button>
        <p className="text-center text-xs mt-1.5" style={{ color: "var(--gray-400)" }}>
          This usually takes 30–60 seconds
        </p>
      </div>
    </div>
  );
}
