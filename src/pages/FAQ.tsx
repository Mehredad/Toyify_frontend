import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronDown } from "lucide-react";

const FAQS = [
  {
    category: "Getting Started",
    icon: "🚀",
    items: [
      {
        q: "Do I need an account to try?",
        a: "No! Upload a drawing and see your AI-generated toy concept without creating an account. You only need to sign in when you're ready to place an order.",
      },
      {
        q: "What type of drawing works best?",
        a: "Any drawing works — phone photos, scans, or digital art. Clear outlines on a plain background give the best results, but even rough scribbles create amazing toys.",
      },
      {
        q: "How long does it take to generate a concept?",
        a: "Most concepts are ready in 30–60 seconds. During busy periods it may take up to 2 minutes. We keep you entertained with STEM facts while you wait!",
      },
    ],
  },
  {
    category: "Free Generations",
    icon: "🎫",
    items: [
      {
        q: "How many free previews do I get?",
        a: "Every account gets 2 free AI toy concept generations per day. They reset at midnight. You never need to pay to see the preview.",
      },
      {
        q: "Can I buy more generations?",
        a: "Yes! Generation credits are available for £5 = 5 concepts. They never expire, so you can use them whenever inspiration strikes.",
      },
    ],
  },
  {
    category: "The Toy",
    icon: "🧸",
    items: [
      {
        q: "What materials are used?",
        a: "Our toys are 3D printed in PLA — a corn-based bioplastic that is safe, food-grade, and eco-friendly. Finished toys are painted with non-toxic acrylic paints. All materials are CE and UKCA certified.",
      },
      {
        q: "What's the difference between DIY Kit and Fully Crafted?",
        a: "The DIY Kit (£49.99) comes as an uncoloured 3D print with acrylic paints and a paint guide — perfect for creative kids aged 8–15. The Fully Crafted option (£59.99) is hand-painted by our team and ready to play with straight away.",
      },
      {
        q: "How big will the toy be?",
        a: "Our standard toys are approximately 10–15 cm — perfect for little hands. Exact dimensions vary based on your drawing's proportions.",
      },
      {
        q: "Is it safe for young children?",
        a: "All toys are CE and UKCA certified and tested for child safety. We use food-safe, hypoallergenic materials. Recommended for ages 7 and up due to small parts.",
      },
    ],
  },
  {
    category: "Ordering & Delivery",
    icon: "📦",
    items: [
      {
        q: "How long does delivery take?",
        a: "We aim to deliver within 5–7 working days. Every toy is made to order — we start printing as soon as your order is confirmed. You'll receive a tracking email once your toy is on its way.",
      },
      {
        q: "Do you ship outside the UK?",
        a: "Currently we ship within the UK only. International shipping is coming soon — sign up to our newsletter to be the first to know.",
      },
      {
        q: "What if I'm not happy with my toy?",
        a: "We offer a 14-day money-back guarantee. If you're not satisfied, contact us at hello@toyify.co.uk and we'll arrange a return and full refund.",
      },
      {
        q: "Can I track my order?",
        a: "Yes! Once your toy is shipped you'll receive an email with a tracking link so you can follow its journey to your door.",
      },
    ],
  },
  {
    category: "Privacy & Safety",
    icon: "🔒",
    items: [
      {
        q: "What do you do with my child's drawings?",
        a: "Your child's drawing is used only to create their toy. We never share it with third parties or use it for advertising. Drawings are stored securely in your account and you can delete them at any time.",
      },
      {
        q: "Is my payment information safe?",
        a: "We use Stripe for all payments — we never see or store your card details. Stripe is PCI DSS Level 1 certified, the highest level of payment security.",
      },
      {
        q: "Are you GDPR compliant?",
        a: "Yes. We are a UK-registered company and fully GDPR compliant. You can request a copy of your data or ask us to delete it at any time. See our Privacy Policy for full details.",
      },
    ],
  },
];

function AccordionItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div
      className="border-b last:border-b-0"
      style={{ borderColor: "var(--gray-100)" }}
    >
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-start justify-between gap-3 py-4 text-left transition-colors hover:text-purple-700"
        style={{ color: "var(--gray-800)" }}
      >
        <span className="text-sm font-semibold leading-snug">{q}</span>
        <ChevronDown
          className="w-4 h-4 flex-shrink-0 mt-0.5 transition-transform duration-200"
          style={{
            transform: open ? "rotate(180deg)" : "rotate(0deg)",
            color: "var(--purple-500)",
          }}
        />
      </button>
      {open && (
        <p
          className="pb-4 text-sm leading-relaxed"
          style={{ color: "var(--gray-600)" }}
        >
          {a}
        </p>
      )}
    </div>
  );
}

export default function FAQ() {
  const navigate = useNavigate();

  return (
    <div className="pb-10 max-w-2xl mx-auto">
      {/* Header */}
      <div className="text-center mb-10">
        <div className="text-4xl mb-3">❓</div>
        <h1
          className="text-2xl font-bold mb-2"
          style={{ color: "var(--purple-900)", fontFamily: "var(--font-display)" }}
        >
          Frequently Asked Questions
        </h1>
        <p className="text-sm" style={{ color: "var(--gray-500)" }}>
          Everything you need to know about Toyify
        </p>
      </div>

      {/* Category sections */}
      <div className="space-y-4">
        {FAQS.map(({ category, icon, items }) => (
          <div
            key={category}
            className="rounded-3xl border overflow-hidden"
            style={{ background: "#fff", borderColor: "var(--gray-200)" }}
          >
            {/* Category header */}
            <div
              className="flex items-center gap-3 px-6 py-4 border-b"
              style={{
                background: "linear-gradient(135deg, #F9F5FF 0%, #F4EBFF 100%)",
                borderColor: "var(--purple-100)",
              }}
            >
              <span className="text-xl">{icon}</span>
              <h2
                className="text-sm font-bold"
                style={{ color: "var(--purple-800)" }}
              >
                {category}
              </h2>
            </div>
            {/* Items */}
            <div className="px-6">
              {items.map((item) => (
                <AccordionItem key={item.q} q={item.q} a={item.a} />
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Still have questions? */}
      <div
        className="mt-8 rounded-3xl p-6 text-center border"
        style={{
          background: "linear-gradient(135deg, #F9F5FF 0%, #F4EBFF 100%)",
          borderColor: "var(--purple-100)",
        }}
      >
        <div className="text-3xl mb-3">💬</div>
        <h3
          className="font-bold mb-1"
          style={{ color: "var(--purple-900)", fontFamily: "var(--font-display)" }}
        >
          Still have questions?
        </h3>
        <p className="text-sm mb-4" style={{ color: "var(--gray-600)" }}>
          Our team is happy to help — usually within a few hours.
        </p>
        <button
          onClick={() => navigate("/contact")}
          className="ds-btn-primary px-6 py-3 text-sm font-bold"
        >
          Contact us
        </button>
      </div>
    </div>
  );
}
