import React, { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Check, ArrowRight, ShieldCheck } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

interface FormData {
  fullName: string;
  email: string;
  phoneNumber: string;
  postcode: string;
  addressLine1: string;
  addressLine2: string;
  townCity: string;
  county: string;
  deliveryInstructions: string;
  allergyNotes: string;
}

export default function Checkout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const cartItems = (() => {
    if (location.state?.cartItems?.length) return location.state.cartItems;
    // Pick up cart saved before the login redirect
    const pending = sessionStorage.getItem("pendingCartItems");
    if (pending) {
      sessionStorage.removeItem("pendingCartItems");
      try { return JSON.parse(pending); } catch { /* fall through */ }
    }
    return [];
  })();

  const [formData, setFormData] = useState<FormData>({
    fullName: "",
    email: "",
    phoneNumber: "",
    postcode: "",
    addressLine1: "",
    addressLine2: "",
    townCity: "",
    county: "",
    deliveryInstructions: "",
    allergyNotes: "",
  });

  const [allergyChecks, setAllergyChecks] = useState({
    plastics: false,
    paints: false,
    none: false,
  });

  const toggleAllergyCheck = (key: keyof typeof allergyChecks) => {
    setAllergyChecks((prev) => {
      if (key === "none") return { plastics: false, paints: false, none: !prev.none };
      return { ...prev, none: false, [key]: !prev[key] };
    });
  };

  const [termsAccepted, setTermsAccepted] = useState(false);
  const [checkingOut, setCheckingOut] = useState(false);
  const [isFindingAddress, setIsFindingAddress] = useState(false);
  const [addressMessage, setAddressMessage] = useState("");
  const [addressError, setAddressError] = useState("");
  const [postcodeValidated, setPostcodeValidated] = useState(false);
  const [voucherCode, setVoucherCode] = useState("");

  const subtotal = cartItems.reduce((sum: number, item: any) => sum + (item.price ?? 0) * item.quantity, 0);
  const shipping = 5;
  const discount = 0;
  const total = subtotal + shipping - discount;

  // Unblocked for preview — re-enable full validation when flow is wired up
  const isFormValid = true;

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (name === "postcode") {
      setAddressMessage("");
      setAddressError("");
      setPostcodeValidated(false);
    }
  };

  const handleFindAddress = async () => {
    const postcode = formData.postcode.trim();
    if (!postcode) { setAddressError("Please enter a postcode"); return; }

    try {
      setIsFindingAddress(true);
      setAddressError("");
      setAddressMessage("");
      setPostcodeValidated(false);

      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/address-lookup?postcode=${encodeURIComponent(postcode)}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data?.message || "Failed to validate postcode");

      setFormData((prev) => ({
        ...prev,
        postcode: data?.address?.postcode || data?.postcode || prev.postcode,
        townCity: data?.address?.townCity || prev.townCity,
        county: data?.address?.county || prev.county,
      }));
      setPostcodeValidated(true);
      setAddressMessage("Postcode verified. Enter the rest of your address below.");
    } catch (err: any) {
      setPostcodeValidated(false);
      setAddressError(err?.message || "Address lookup failed");
    } finally {
      setIsFindingAddress(false);
    }
  };

  const handleCheckout = async () => {
    if (checkingOut) return;
    if (cartItems.length === 0) { navigate("/success"); return; }
    try {
      setCheckingOut(true);

      // Collect toy metadata saved during the generation flow
      const conceptImageUrl = sessionStorage.getItem("generatedConceptUrl") || cartItems[0]?.conceptImageUrl || "";
      const toyName = sessionStorage.getItem("toyName") || cartItems[0]?.orderName || "";
      const storyTitle = sessionStorage.getItem("storyTitle") || cartItems[0]?.storyTitle || "";
      const artistName = sessionStorage.getItem("artistName") || "";
      const artistAge = sessionStorage.getItem("artistAge") || "";
      const artistGender = sessionStorage.getItem("artistGender") || "";
      const artistInterests: string[] = JSON.parse(sessionStorage.getItem("artistInterests") || "[]");
      const uploadedImageB64 = sessionStorage.getItem("uploadedImage") || "";
      const tier = cartItems[0]?.type?.toLowerCase().includes("diy") ? "diy" : "crafted";

      const apiBase = import.meta.env.VITE_API_URL || "";
      const res = await fetch(`${apiBase}/api/create-checkout-session`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerEmail: formData.email,
          fullName: formData.fullName,
          phoneNumber: formData.phoneNumber,
          address: {
            postcode: formData.postcode,
            addressLine1: formData.addressLine1,
            addressLine2: formData.addressLine2,
            townCity: formData.townCity,
            county: formData.county,
            deliveryInstructions: formData.deliveryInstructions,
          },
          allergyNotes: formData.allergyNotes,
          items: cartItems.map((item: any) => ({
            fileName: item.fileName,
            imageVersion: item.imageVersion,
            size: item.size,
            quantity: item.quantity,
            description: item.description || "",
            price: item.price ?? 0,
          })),
          toyName,
          artistName,
          artistAge,
          artistGender,
          artistInterests,
          conceptImageUrl,
          storyTitle,
          tier,
          userId: user?.id || "",
          uploadedImageB64,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data?.detail || data?.message || "Checkout failed");

      // Redirect to Stripe's hosted payment page
      window.location.href = data.url;
    } catch (err: any) {
      alert(err?.message || "Failed to start payment. Please try again.");
    } finally {
      setCheckingOut(false);
    }
  };

  const inputClass = "w-full px-4 py-3 rounded-xl border text-sm transition-all focus:outline-none focus:ring-2";
  const inputStyle = {
    borderColor: "var(--gray-200)",
    color: "var(--gray-900)",
    "--tw-ring-color": "var(--purple-300)",
  } as React.CSSProperties;

  return (
    <div className="pb-24 lg:pb-6">
      {/* Header */}
      <div className="mb-6">
        <p className="text-xs font-bold uppercase tracking-widest mb-1" style={{ color: "var(--purple-600)" }}>
          Almost there
        </p>
        <h1 className="text-2xl font-bold" style={{ color: "var(--purple-900)", fontFamily: "var(--font-display)" }}>
          Shipping details
        </h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Form */}
        <div className="lg:col-span-2 space-y-4">

          {/* ── Material & Allergy Safety ── */}
          <div
            className="rounded-3xl border overflow-hidden"
            style={{ borderColor: "#B2DDFF" }}
          >
            {/* Header */}
            <div
              className="flex items-center gap-3 px-5 py-4 border-b"
              style={{ background: "#EFF8FF", borderColor: "#B2DDFF" }}
            >
              <ShieldCheck className="w-5 h-5 flex-shrink-0" style={{ color: "#175CD3" }} />
              <div>
                <h2 className="text-sm font-bold" style={{ color: "#175CD3" }}>
                  Material &amp; Allergy Information
                </h2>
                <p className="text-xs mt-0.5" style={{ color: "#1D4ED8" }}>
                  Please review before ordering
                </p>
              </div>
            </div>

            <div className="px-5 py-5 space-y-5" style={{ background: "#fff" }}>
              {/* Material list */}
              <div>
                <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: "var(--gray-500)" }}>
                  Our toys are made with
                </p>
                <div className="space-y-2">
                  {[
                    { icon: "🌽", label: "PLA bioplastic", sub: "Corn-based, food-safe, and eco-friendly" },
                    { icon: "🎨", label: "Non-toxic acrylic paints", sub: "Finished toys only — hypoallergenic formula" },
                    { icon: "✅", label: "Food-safe materials throughout", sub: "No BPA, no phthalates, no heavy metals" },
                  ].map(({ icon, label, sub }) => (
                    <div key={label} className="flex items-start gap-3">
                      <span className="text-lg leading-none mt-0.5">{icon}</span>
                      <div>
                        <p className="text-sm font-semibold" style={{ color: "var(--gray-800)" }}>{label}</p>
                        <p className="text-xs" style={{ color: "var(--gray-500)" }}>{sub}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Allergy checkboxes */}
              <div>
                <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: "var(--gray-500)" }}>
                  Does your child have allergies to?
                </p>
                <div className="space-y-2">
                  {[
                    { key: "plastics" as const, label: "Plastics (PLA / ABS)" },
                    { key: "paints" as const, label: "Paints or dyes" },
                    { key: "none" as const, label: "No known allergies ✓" },
                  ].map(({ key, label }) => (
                    <label
                      key={key}
                      className="flex items-center gap-3 cursor-pointer group"
                    >
                      <div
                        className="w-5 h-5 rounded-md border-2 flex items-center justify-center flex-shrink-0 transition-all"
                        style={{
                          borderColor: allergyChecks[key] ? "var(--purple-600)" : "var(--gray-300)",
                          background: allergyChecks[key] ? "var(--purple-600)" : "#fff",
                        }}
                        onClick={() => toggleAllergyCheck(key)}
                      >
                        {allergyChecks[key] && <Check className="w-3 h-3 text-white" />}
                      </div>
                      <span
                        className="text-sm"
                        style={{ color: "var(--gray-700)" }}
                        onClick={() => toggleAllergyCheck(key)}
                      >
                        {label}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Additional notes */}
              <div>
                <label className="block text-xs font-semibold mb-1.5" style={{ color: "var(--gray-700)" }}>
                  Additional notes <span style={{ color: "var(--gray-400)", fontWeight: 400 }}>(optional)</span>
                </label>
                <textarea
                  name="allergyNotes"
                  value={formData.allergyNotes}
                  onChange={handleInputChange}
                  placeholder="e.g. sensitive skin, prefer natural paints, latex allergy..."
                  rows={2}
                  className="w-full px-4 py-3 rounded-xl border text-sm transition-all focus:outline-none focus:ring-2 resize-none"
                  style={{ borderColor: "var(--gray-200)", color: "var(--gray-900)" }}
                />
              </div>

              {/* Safety certifications */}
              <div
                className="flex flex-wrap gap-2 pt-3 border-t"
                style={{ borderColor: "var(--gray-100)" }}
              >
                {["✓ CE Marked", "✓ UKCA Marked", "✓ Lab tested"].map((cert) => (
                  <span
                    key={cert}
                    className="text-xs font-semibold px-3 py-1 rounded-full"
                    style={{ background: "#ECFDF3", color: "#027A48" }}
                  >
                    {cert}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Personal info */}
          <div className="rounded-3xl p-5 border" style={{ background: "#fff", borderColor: "var(--gray-200)" }}>
            <h2 className="text-sm font-bold mb-4" style={{ color: "var(--purple-900)" }}>Contact information</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold mb-1.5" style={{ color: "var(--gray-700)" }}>Full name *</label>
                <input
                  type="text"
                  name="fullName"
                  value={formData.fullName}
                  onChange={handleInputChange}
                  placeholder="Your full name"
                  className={inputClass}
                  style={inputStyle}
                />
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1.5" style={{ color: "var(--gray-700)" }}>Email *</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  placeholder="you@example.com"
                  className={inputClass}
                  style={inputStyle}
                />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold mb-1.5" style={{ color: "var(--gray-700)" }}>Phone number *</label>
                <input
                  type="tel"
                  name="phoneNumber"
                  value={formData.phoneNumber}
                  onChange={handleInputChange}
                  placeholder="+44 7700 900000"
                  className={inputClass}
                  style={inputStyle}
                />
              </div>
            </div>
          </div>

          {/* Address */}
          <div className="rounded-3xl p-5 border" style={{ background: "#fff", borderColor: "var(--gray-200)" }}>
            <h2 className="text-sm font-bold mb-4" style={{ color: "var(--purple-900)" }}>Delivery address</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

              {/* Postcode lookup */}
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold mb-1.5" style={{ color: "var(--gray-700)" }}>Postcode *</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    name="postcode"
                    value={formData.postcode}
                    onChange={handleInputChange}
                    placeholder="SW1A 1AA"
                    className={`${inputClass} flex-1 min-w-0`}
                    style={inputStyle}
                  />
                  <button
                    type="button"
                    onClick={handleFindAddress}
                    disabled={isFindingAddress}
                    className="px-4 py-3 rounded-xl text-sm font-semibold text-white transition-colors flex-shrink-0 disabled:opacity-50"
                    style={{ background: "var(--purple-600)" }}
                  >
                    {isFindingAddress ? "Checking…" : "Validate"}
                  </button>
                </div>
                {addressMessage && (
                  <p className="text-xs mt-1.5 flex items-center gap-1" style={{ color: "var(--ds-success)" }}>
                    <Check className="w-3 h-3" /> {addressMessage}
                  </p>
                )}
                {addressError && <p className="text-xs mt-1.5 text-red-500">{addressError}</p>}
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold mb-1.5" style={{ color: "var(--gray-700)" }}>Address line 1 *</label>
                <input
                  type="text"
                  name="addressLine1"
                  value={formData.addressLine1}
                  onChange={handleInputChange}
                  placeholder="House number and street"
                  className={inputClass}
                  style={inputStyle}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1.5" style={{ color: "var(--gray-700)" }}>Address line 2</label>
                <input
                  type="text"
                  name="addressLine2"
                  value={formData.addressLine2}
                  onChange={handleInputChange}
                  placeholder="Flat, apartment, etc."
                  className={inputClass}
                  style={inputStyle}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1.5" style={{ color: "var(--gray-700)" }}>Town / city *</label>
                <input
                  type="text"
                  name="townCity"
                  value={formData.townCity}
                  onChange={handleInputChange}
                  placeholder="London"
                  className={inputClass}
                  style={inputStyle}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1.5" style={{ color: "var(--gray-700)" }}>County</label>
                <input
                  type="text"
                  name="county"
                  value={formData.county}
                  onChange={handleInputChange}
                  placeholder="Greater London"
                  className={inputClass}
                  style={inputStyle}
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold mb-1.5" style={{ color: "var(--gray-700)" }}>Delivery instructions</label>
                <textarea
                  name="deliveryInstructions"
                  value={formData.deliveryInstructions}
                  onChange={handleInputChange}
                  placeholder="Leave with neighbour, ring doorbell twice, etc."
                  rows={3}
                  className={`${inputClass} resize-none`}
                  style={inputStyle}
                />
              </div>

            </div>
          </div>

          {/* Back button (desktop) */}
          <button
            onClick={() => navigate(-1)}
            className="hidden lg:inline-flex items-center gap-2 text-sm px-5 py-2.5 rounded-full border transition-colors"
            style={{ borderColor: "var(--gray-200)", color: "var(--gray-600)" }}
          >
            ← Back to cart
          </button>
        </div>

        {/* Order summary sidebar */}
        <div className="lg:col-span-1">
          <div className="rounded-3xl p-5 border sticky top-24" style={{ background: "var(--purple-50)", borderColor: "var(--purple-100)" }}>
            <h2 className="text-sm font-bold mb-4" style={{ color: "var(--purple-900)" }}>Order summary</h2>

            {/* Items */}
            <div className="space-y-2 mb-4">
              {cartItems.length > 0 ? (
                cartItems.map((item: any, i: number) => (
                  <div key={i} className="flex justify-between items-start gap-2 text-sm">
                    <span className="truncate" style={{ color: "var(--gray-700)" }}>{item.orderName || item.type}</span>
                    <span className="font-semibold flex-shrink-0" style={{ color: "var(--purple-900)" }}>£{(item.price * item.quantity).toFixed(2)}</span>
                  </div>
                ))
              ) : (
                <p className="text-sm" style={{ color: "var(--gray-400)" }}>No items in cart</p>
              )}
            </div>

            {/* Voucher */}
            <div className="mb-4">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={voucherCode}
                  onChange={(e) => setVoucherCode(e.target.value)}
                  placeholder="Discount code"
                  className="flex-1 min-w-0 px-3 py-2 rounded-xl border text-xs focus:outline-none"
                  style={{ borderColor: "var(--gray-200)" }}
                />
                <button
                  type="button"
                  className="px-3 py-2 rounded-xl text-xs font-semibold text-white flex-shrink-0"
                  style={{ background: "var(--purple-600)" }}
                >
                  Apply
                </button>
              </div>
            </div>

            {/* Totals */}
            <div className="space-y-2 pt-3 border-t" style={{ borderColor: "var(--purple-200)" }}>
              <div className="flex justify-between text-sm">
                <span style={{ color: "var(--gray-600)" }}>Subtotal</span>
                <span style={{ color: "var(--gray-900)" }}>£{subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span style={{ color: "var(--gray-600)" }}>UK shipping</span>
                <span style={{ color: "var(--gray-900)" }}>£{shipping.toFixed(2)}</span>
              </div>
              {discount > 0 && (
                <div className="flex justify-between text-sm">
                  <span style={{ color: "var(--gray-600)" }}>Discount</span>
                  <span style={{ color: "var(--ds-success)" }}>−£{discount.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between font-bold text-base pt-2 border-t" style={{ borderColor: "var(--purple-200)", color: "var(--purple-900)" }}>
                <span>Total</span>
                <span>£{total.toFixed(2)}</span>
              </div>
            </div>

            {/* Consent */}
            <label className="flex items-start gap-2.5 mt-5 cursor-pointer">
              <input
                type="checkbox"
                checked={termsAccepted}
                onChange={(e) => setTermsAccepted(e.target.checked)}
                className="w-4 h-4 mt-0.5 rounded flex-shrink-0"
                style={{ accentColor: "var(--purple-600)" }}
              />
              <span className="text-xs leading-relaxed" style={{ color: "var(--gray-600)" }}>
                I've read the{" "}
                <a href="/terms" className="underline" style={{ color: "var(--purple-700)" }}>terms of service</a>{" "}
                and I'm happy to proceed with payment
              </span>
            </label>

            {/* Desktop CTA */}
            <button
              onClick={handleCheckout}
              disabled={!isFormValid || checkingOut}
              className="hidden lg:flex mt-4 w-full items-center justify-center gap-2 py-4 rounded-full text-white font-bold text-[15px] transition-all ds-btn-primary"
              style={{ opacity: isFormValid ? 1 : 0.5 }}
            >
              {checkingOut ? (
                <>
                  <div className="w-4 h-4 rounded-full animate-spin" style={{ border: "2px solid rgba(255,255,255,0.4)", borderTopColor: "#fff" }} />
                  Placing order…
                </>
              ) : (
                <>Continue to payment <ArrowRight className="w-4 h-4" /></>
              )}
            </button>

            <div className="hidden lg:flex flex-wrap gap-3 justify-center mt-3 text-xs" style={{ color: "var(--gray-400)" }}>
              <span>🔒 Stripe secure</span>
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
        <button
          onClick={handleCheckout}
          disabled={!isFormValid || checkingOut}
          className="w-full ds-btn-primary py-4 text-[15px] font-bold flex items-center justify-center gap-2"
          style={{ opacity: isFormValid ? 1 : 0.55 }}
        >
          {checkingOut ? (
            <>
              <div className="w-4 h-4 rounded-full animate-spin" style={{ border: "2px solid rgba(255,255,255,0.4)", borderTopColor: "#fff" }} />
              Placing order…
            </>
          ) : (
            <>Continue to payment — £{total.toFixed(2)} <ArrowRight className="w-4 h-4" /></>
          )}
        </button>
      </div>
    </div>
  );
}
