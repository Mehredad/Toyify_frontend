import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";

interface OrderSummary {
  orderId: string | null;
  toyName: string;
  tier: string;
  price: number;
  customerEmail: string;
  fullName: string;
  conceptImageUrl: string;
  storyTitle: string;
  status: string;
}

export default function Success() {
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get("session_id");
  const navigate = useNavigate();
  const { user } = useAuth();

  const [order, setOrder] = useState<OrderSummary | null>(null);
  const [confirming, setConfirming] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!sessionId) {
      // Direct visit (no Stripe session) — show generic success
      setConfirming(false);
      return;
    }

    const apiBase = import.meta.env.VITE_API_URL || "";
    fetch(`${apiBase}/api/confirm-order`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sessionId, userId: user?.id || "" }),
    })
      .then((r) => r.json())
      .then((data) => {
        if (data.detail) throw new Error(data.detail);
        setOrder(data);
      })
      .catch((e) => setError(e.message || "Could not confirm order"))
      .finally(() => setConfirming(false));
  }, [sessionId]);

  const steps = [
    { icon: "📧", title: "Order confirmed", body: "Check your inbox — a confirmation email is on its way." },
    { icon: "🎨", title: "We get to work", body: "Our team prints and crafts your toy within 1–2 working days." },
    { icon: "📦", title: "Delivered to you", body: "Your toy arrives in 5–7 working days, gift-wrapped and ready." },
  ];

  if (confirming) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <div className="w-12 h-12 rounded-full animate-spin" style={{ border: "3px solid var(--purple-200)", borderTopColor: "var(--purple-600)" }} />
        <p className="text-sm font-medium" style={{ color: "var(--purple-700)" }}>Confirming your payment…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4 gap-4">
        <div className="text-5xl">⚠️</div>
        <h1 className="text-2xl font-bold" style={{ color: "var(--purple-900)" }}>Payment issue</h1>
        <p className="text-sm max-w-sm" style={{ color: "var(--gray-600)" }}>{error}</p>
        <button onClick={() => navigate("/checkout")} className="ds-btn-primary px-8 py-3 text-sm font-semibold">
          Back to checkout
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] px-4 py-12 text-center">

      {/* Celebration icon */}
      <div
        className="w-24 h-24 rounded-full flex items-center justify-center text-5xl mb-6 shadow-xl"
        style={{ background: "linear-gradient(135deg, #F9A8D4, #C4B5FD)" }}
      >
        🎉
      </div>

      <p className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: "var(--purple-600)" }}>
        Order placed
      </p>
      <h1 className="text-3xl lg:text-4xl font-bold mb-3" style={{ color: "var(--purple-900)", fontFamily: "var(--font-display)" }}>
        {order ? `${order.toyName} is on its way!` : "Your toy is on its way!"}
      </h1>
      <p className="text-base max-w-sm mx-auto mb-6 leading-relaxed" style={{ color: "var(--gray-600)" }}>
        Thank you{order?.fullName ? `, ${order.fullName.split(" ")[0]}` : ""}! We'll email you at{" "}
        <span className="font-semibold">{order?.customerEmail || "the address you provided"}</span> once your toy has shipped.
      </p>

      {/* Order card */}
      {order && (
        <div
          className="w-full max-w-md rounded-3xl p-5 mb-8 text-left border"
          style={{ background: "var(--purple-50)", borderColor: "var(--purple-200)" }}
        >
          <div className="flex items-start gap-4">
            {order.conceptImageUrl && (
              <img
                src={order.conceptImageUrl}
                alt={order.toyName}
                className="w-20 h-20 rounded-2xl object-cover flex-shrink-0"
              />
            )}
            <div className="flex-1 min-w-0">
              <h2 className="font-bold text-base truncate" style={{ color: "var(--purple-900)" }}>{order.toyName}</h2>
              <p className="text-xs mt-0.5 mb-2" style={{ color: "var(--purple-600)" }}>
                {order.tier === "diy" ? "DIY Kit — Colour it yourself" : "Fully Crafted — Ready to play"}
              </p>
              <div className="flex items-center gap-3">
                <span
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold"
                  style={{ background: "#FFF6ED", color: "#B93815", border: "1px solid #F9DBAF" }}
                >
                  ⏳ Pending
                </span>
                <span className="text-xs" style={{ color: "var(--gray-500)" }}>£{order.price.toFixed(2)}</span>
              </div>
            </div>
          </div>
          <div
            className="mt-4 pt-4 border-t text-xs leading-relaxed"
            style={{ borderColor: "var(--purple-200)", color: "var(--gray-600)" }}
          >
            We'll get back to you shortly at <strong>{order.customerEmail}</strong> to confirm your order and provide a production update.
          </div>
        </div>
      )}

      {/* What happens next */}
      <div className="w-full max-w-2xl mb-10">
        <p className="text-xs font-bold uppercase tracking-widest mb-6" style={{ color: "var(--gray-400)" }}>
          What happens next
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {steps.map((s, i) => (
            <div
              key={i}
              className="rounded-3xl p-5 text-center border"
              style={{ background: "var(--purple-50)", borderColor: "var(--purple-100)" }}
            >
              <div className="text-3xl mb-3">{s.icon}</div>
              <div className="font-semibold text-sm mb-1" style={{ color: "var(--purple-900)" }}>{s.title}</div>
              <p className="text-xs leading-relaxed" style={{ color: "var(--gray-600)" }}>{s.body}</p>
            </div>
          ))}
        </div>
      </div>

      {/* CTAs */}
      <div className="flex flex-col sm:flex-row gap-3">
        <button onClick={() => navigate("/")} className="ds-btn-primary px-8 py-3 text-sm font-semibold">
          Toyify another drawing
        </button>
        {user && (
          <button
            onClick={() => navigate("/profile?tab=orders")}
            className="px-8 py-3 text-sm font-semibold rounded-full border transition-colors"
            style={{ borderColor: "var(--purple-300)", color: "var(--purple-700)" }}
          >
            View my orders
          </button>
        )}
      </div>

      <div className="flex flex-wrap gap-4 justify-center mt-8 text-xs" style={{ color: "var(--gray-400)" }}>
        <span>🇬🇧 Printed in the UK</span>
        <span>✓ CE / UKCA certified</span>
        <span>🔒 Secure payment via Stripe</span>
      </div>
    </div>
  );
}
