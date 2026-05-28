import React from "react";
import { useNavigate } from "react-router-dom";
import { Mail, MessageCircle, Package, RefreshCw, ShieldCheck, ChevronRight } from "lucide-react";

const TOPICS = [
  {
    icon: <Package className="w-5 h-5" />,
    title: "Track my order",
    description: "Check your delivery status and estimated arrival.",
    color: "#027A48",
    bg: "#ECFDF3",
    border: "#A9EFC5",
  },
  {
    icon: <RefreshCw className="w-5 h-5" />,
    title: "Returns & refunds",
    description: "14-day money-back guarantee — we'll sort it quickly.",
    color: "#B93815",
    bg: "#FFF6ED",
    border: "#F9DBAF",
  },
  {
    icon: <ShieldCheck className="w-5 h-5" />,
    title: "Safety & materials",
    description: "PLA plastic, non-toxic paints, CE & UKCA certified.",
    color: "#175CD3",
    bg: "#EFF8FF",
    border: "#B2DDFF",
  },
  {
    icon: <MessageCircle className="w-5 h-5" />,
    title: "Toy concept issues",
    description: "Not happy with the AI result? We'll regenerate for free.",
    color: "#6941C6",
    bg: "#F4EBFF",
    border: "#D6BBFB",
  },
];

export default function Help() {
  const navigate = useNavigate();

  return (
    <div className="pb-10 max-w-xl mx-auto">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="text-4xl mb-3">🤝</div>
        <h1
          className="text-2xl font-bold mb-2"
          style={{ color: "var(--purple-900)", fontFamily: "var(--font-display)" }}
        >
          How can we help?
        </h1>
        <p className="text-sm" style={{ color: "var(--gray-500)" }}>
          Choose a topic or contact our team directly
        </p>
      </div>

      {/* Topic cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
        {TOPICS.map(({ icon, title, description, color, bg, border }) => (
          <button
            key={title}
            className="flex items-start gap-3 p-4 rounded-2xl border text-left transition-all hover:shadow-md hover:scale-[1.01]"
            style={{ background: bg, borderColor: border }}
          >
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ background: "rgba(255,255,255,0.7)", color }}
            >
              {icon}
            </div>
            <div>
              <p className="text-sm font-semibold mb-0.5" style={{ color }}>
                {title}
              </p>
              <p className="text-xs leading-relaxed" style={{ color: "var(--gray-600)" }}>
                {description}
              </p>
            </div>
          </button>
        ))}
      </div>

      {/* FAQ shortcut */}
      <button
        onClick={() => navigate("/faq")}
        className="w-full flex items-center justify-between px-5 py-4 rounded-2xl border transition-colors hover:bg-purple-50 mb-6"
        style={{ background: "#fff", borderColor: "var(--gray-200)" }}
      >
        <div className="flex items-center gap-3">
          <span className="text-xl">❓</span>
          <div className="text-left">
            <p className="text-sm font-semibold" style={{ color: "var(--purple-900)" }}>
              Browse the FAQ
            </p>
            <p className="text-xs" style={{ color: "var(--gray-500)" }}>
              Quick answers to the most common questions
            </p>
          </div>
        </div>
        <ChevronRight className="w-4 h-4 flex-shrink-0" style={{ color: "var(--gray-400)" }} />
      </button>

      {/* Contact options */}
      <div
        className="rounded-3xl border overflow-hidden"
        style={{ background: "#fff", borderColor: "var(--gray-200)" }}
      >
        <div
          className="px-5 py-4 border-b"
          style={{
            background: "linear-gradient(135deg, #F9F5FF 0%, #F4EBFF 100%)",
            borderColor: "var(--purple-100)",
          }}
        >
          <h2 className="text-sm font-bold" style={{ color: "var(--purple-800)" }}>
            Get in touch
          </h2>
          <p className="text-xs mt-0.5" style={{ color: "var(--gray-500)" }}>
            We usually reply within a few hours
          </p>
        </div>

        {/* Email */}
        <a
          href="mailto:hello@toyify.co.uk"
          className="flex items-center gap-4 px-5 py-4 border-b transition-colors hover:bg-gray-50"
          style={{ borderColor: "var(--gray-100)" }}
        >
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ background: "var(--purple-100)" }}
          >
            <Mail className="w-5 h-5" style={{ color: "var(--purple-700)" }} />
          </div>
          <div className="flex-1">
            <p className="text-sm font-semibold" style={{ color: "var(--gray-800)" }}>
              Email us
            </p>
            <p className="text-xs" style={{ color: "var(--gray-500)" }}>
              hello@toyify.co.uk
            </p>
          </div>
          <ChevronRight className="w-4 h-4 flex-shrink-0" style={{ color: "var(--gray-300)" }} />
        </a>

        {/* Contact form */}
        <button
          onClick={() => navigate("/contact")}
          className="w-full flex items-center gap-4 px-5 py-4 text-left transition-colors hover:bg-gray-50"
        >
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ background: "#ECFDF3" }}
          >
            <MessageCircle className="w-5 h-5" style={{ color: "#027A48" }} />
          </div>
          <div className="flex-1">
            <p className="text-sm font-semibold" style={{ color: "var(--gray-800)" }}>
              Send a message
            </p>
            <p className="text-xs" style={{ color: "var(--gray-500)" }}>
              Use our contact form
            </p>
          </div>
          <ChevronRight className="w-4 h-4 flex-shrink-0" style={{ color: "var(--gray-300)" }} />
        </button>
      </div>

      {/* Trust line */}
      <p className="text-center text-xs mt-6" style={{ color: "var(--gray-400)" }}>
        🇬🇧 UK-based team · Mon–Fri, 9am–5pm GMT
      </p>
    </div>
  );
}
