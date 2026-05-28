import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { User } from "@supabase/supabase-js";
import { Package, Plus, Maximize2, Edit2, Check, X, HelpCircle, ChevronRight } from "lucide-react";

interface Order {
  id: string;
  toy_name: string;
  tier: string;
  price: number;
  status: string;
  concept_image_url: string;
  story_title: string;
  created_at: string;
  customer_email: string;
}

const AVATAR_ICONS = [
  "🐻", "🐼", "🦁", "🐯", "🐨", "🐰", "🦊", "🐶",
  "🐱", "🐭", "🐹", "🐷", "🐮", "🐸", "🐵", "🦄",
];

const STATUS_STYLES: Record<string, { bg: string; color: string; border: string; label: string }> = {
  pending:   { bg: "#FFF6ED", color: "#B93815", border: "#F9DBAF", label: "⏳ Pending" },
  in_progress: { bg: "#EFF8FF", color: "#175CD3", border: "#B2DDFF", label: "🔨 In Progress" },
  shipped:   { bg: "#ECFDF3", color: "#027A48", border: "#A9EFC5", label: "📦 Shipped" },
  delivered: { bg: "#F4EBFF", color: "#6941C6", border: "#D6BBFB", label: "✅ Delivered" },
};

export default function Profile() {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<any>(null);
  const [username, setUsername] = useState("");
  const [editingUsername, setEditingUsername] = useState(false);
  const [tempUsername, setTempUsername] = useState("");
  const [selectedAvatar, setSelectedAvatar] = useState("🦄");
  const [showAvatarPicker, setShowAvatarPicker] = useState(false);
  const [userConcepts, setUserConcepts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<"creations" | "orders">("creations");

  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();

  useEffect(() => {
    if (searchParams.get("tab") === "orders") setActiveTab("orders");
  }, [searchParams]);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) { navigate("/auth"); return; }
      setUser(user);
      loadProfile(user.id);
      loadConcepts(user.id);
      loadOrders(user.id);
    });
  }, []);

  const loadProfile = async (userId: string) => {
    const { data } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .single();

    if (data) {
      setProfile(data);
      setUsername(data.username || "");
      setSelectedAvatar(data.avatar_icon || "🦄");
    }
    setLoading(false);
  };

  const loadConcepts = async (userId: string) => {
    const { data } = await supabase
      .from("user_concepts")
      .select("*, user_images(*)")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    setUserConcepts(data || []);
  };

  const loadOrders = async (userId: string) => {
    setOrdersLoading(true);
    try {
      const apiBase = import.meta.env.VITE_API_URL || "";
      const res = await fetch(`${apiBase}/api/orders/${userId}`);
      if (res.ok) setOrders(await res.json());
    } catch { /* non-fatal */ } finally {
      setOrdersLoading(false);
    }
  };

  const handleSaveUsername = async () => {
    if (!user) return;
    const { error } = await supabase
      .from("profiles")
      .update({ username: tempUsername, avatar_icon: selectedAvatar })
      .eq("id", user.id);

    if (error) {
      toast({ title: "Update failed", description: error.message, variant: "destructive" });
    } else {
      setUsername(tempUsername);
      setEditingUsername(false);
      toast({ title: "Profile updated!" });
    }
  };

  const handleSaveAvatar = async (icon: string) => {
    setSelectedAvatar(icon);
    setShowAvatarPicker(false);
    if (!user) return;
    await supabase.from("profiles").update({ avatar_icon: icon }).eq("id", user.id);
  };

  const getDisplayName = () => {
    if (username) return username;
    return user?.email?.split("@")[0] || "there";
  };

  const conceptCount = userConcepts.length;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div
          className="w-10 h-10 rounded-full animate-spin"
          style={{ border: "3px solid var(--purple-200)", borderTopColor: "var(--purple-600)" }}
        />
      </div>
    );
  }

  return (
    <>
      {/* Image preview modal */}
      {previewImage && (
        <div
          className="fixed inset-0 z-[400] flex items-center justify-center p-4"
          style={{ background: "rgba(0,0,0,0.8)", backdropFilter: "blur(8px)" }}
          onClick={() => setPreviewImage(null)}
        >
          <img
            src={previewImage}
            alt="Preview"
            className="max-w-full max-h-[85vh] rounded-2xl object-contain"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}

      {/* Avatar picker modal */}
      {showAvatarPicker && (
        <div
          className="fixed inset-0 z-[400] flex items-center justify-center p-4"
          style={{ background: "rgba(0,0,0,0.6)" }}
          onClick={() => setShowAvatarPicker(false)}
        >
          <div
            className="bg-white rounded-3xl p-6 max-w-xs w-full shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-sm font-bold mb-4" style={{ color: "var(--purple-900)" }}>Choose avatar</h3>
            <div className="grid grid-cols-4 gap-2">
              {AVATAR_ICONS.map((icon) => (
                <button
                  key={icon}
                  onClick={() => handleSaveAvatar(icon)}
                  className="text-3xl py-2 rounded-xl transition-all hover:scale-110"
                  style={{
                    background: icon === selectedAvatar ? "var(--purple-100)" : "transparent",
                    outline: icon === selectedAvatar ? "2px solid var(--purple-600)" : "none",
                  }}
                >
                  {icon}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      <div className="pb-10 space-y-6">
        {/* ── Welcome header ── */}
        <div
          className="rounded-3xl p-6 border"
          style={{
            background: "linear-gradient(135deg, #F9F5FF 0%, #F4EBFF 100%)",
            borderColor: "var(--purple-100)",
          }}
        >
          <div className="flex items-center gap-4">
            {/* Avatar */}
            <button
              onClick={() => setShowAvatarPicker(true)}
              className="w-16 h-16 rounded-2xl text-4xl flex items-center justify-center flex-shrink-0 transition-transform hover:scale-105 relative"
              style={{ background: "var(--purple-100)" }}
              title="Change avatar"
            >
              {selectedAvatar}
              <span
                className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center text-white text-[10px]"
                style={{ background: "var(--purple-600)" }}
              >
                ✏️
              </span>
            </button>

            {/* Name + edit */}
            <div className="flex-1 min-w-0">
              {editingUsername ? (
                <div className="flex items-center gap-2">
                  <input
                    value={tempUsername}
                    onChange={(e) => setTempUsername(e.target.value)}
                    className="flex-1 min-w-0 text-lg font-bold border-b-2 bg-transparent focus:outline-none"
                    style={{
                      color: "var(--purple-900)",
                      borderColor: "var(--purple-400)",
                      fontFamily: "var(--font-display)",
                    }}
                    autoFocus
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleSaveUsername();
                      if (e.key === "Escape") setEditingUsername(false);
                    }}
                  />
                  <button onClick={handleSaveUsername} className="p-1 rounded-full text-green-600 hover:bg-green-50">
                    <Check className="w-4 h-4" />
                  </button>
                  <button onClick={() => setEditingUsername(false)} className="p-1 rounded-full text-red-500 hover:bg-red-50">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <h1 className="text-xl font-bold truncate" style={{ color: "var(--purple-900)", fontFamily: "var(--font-display)" }}>
                    Welcome back, {getDisplayName()}! 👋
                  </h1>
                  <button
                    onClick={() => { setTempUsername(username); setEditingUsername(true); }}
                    className="flex-shrink-0 p-1 rounded-full hover:bg-purple-100 transition-colors"
                    style={{ color: "var(--purple-400)" }}
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
              <p className="text-sm mt-0.5 truncate" style={{ color: "var(--gray-500)" }}>
                {user?.email}
              </p>
            </div>
          </div>

          {/* Stats row */}
          <div className="grid grid-cols-3 gap-3 mt-5">
            {[
              { label: "Concepts", value: conceptCount, icon: "🎨" },
              { label: "Free today", value: "2", icon: "🎫" },
              { label: "Ordered", value: orders.length, icon: "📦" },
            ].map(({ label, value, icon }) => (
              <div
                key={label}
                className="rounded-2xl p-3 text-center"
                style={{ background: "rgba(255,255,255,0.7)" }}
              >
                <div className="text-xl mb-1">{icon}</div>
                <div className="text-lg font-bold" style={{ color: "var(--purple-900)", fontFamily: "var(--font-display)" }}>
                  {value}
                </div>
                <div className="text-[10px] font-medium" style={{ color: "var(--gray-500)" }}>
                  {label}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── Quick actions ── */}
        <div className="grid grid-cols-3 gap-3">
          {[
            {
              icon: "🎨",
              label: "New Toy",
              sublabel: "Upload a drawing",
              action: () => navigate("/"),
              color: "var(--purple-600)",
              bg: "var(--purple-50)",
            },
            {
              icon: "🎫",
              label: "Credits",
              sublabel: "2 free today",
              action: () => {},
              color: "#D97706",
              bg: "#FFFBEB",
            },
            {
              icon: "📦",
              label: "Orders",
              sublabel: `${orders.length} order${orders.length !== 1 ? "s" : ""}`,
              action: () => setActiveTab("orders"),
              color: "#027A48",
              bg: "#ECFDF3",
            },
          ].map(({ icon, label, sublabel, action, color, bg }) => (
            <button
              key={label}
              onClick={action}
              className="rounded-3xl p-4 text-left border transition-all hover:shadow-md hover:scale-[1.02]"
              style={{ background: bg, borderColor: "transparent" }}
            >
              <div className="text-2xl mb-2">{icon}</div>
              <div className="text-sm font-bold" style={{ color }}>
                {label}
              </div>
              <div className="text-[11px]" style={{ color: "var(--gray-400)" }}>
                {sublabel}
              </div>
            </button>
          ))}
        </div>

        {/* ── Tab bar ── */}
        <div className="flex gap-2">
          {(["creations", "orders"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className="flex-1 py-2.5 rounded-2xl text-sm font-semibold transition-all"
              style={{
                background: activeTab === tab ? "var(--purple-600)" : "var(--purple-50)",
                color: activeTab === tab ? "#fff" : "var(--purple-700)",
              }}
            >
              {tab === "creations" ? `🎨 My Creations` : `📦 My Orders${orders.length ? ` (${orders.length})` : ""}`}
            </button>
          ))}
        </div>

        {/* ── My Creations ── */}
        {activeTab === "creations" && <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-bold" style={{ color: "var(--purple-900)", fontFamily: "var(--font-display)" }}>
              My Creations
            </h2>
            <button
              onClick={() => navigate("/")}
              className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full transition-colors"
              style={{ color: "var(--purple-700)", background: "var(--purple-100)" }}
            >
              <Plus className="w-3 h-3" /> Create new
            </button>
          </div>

          {userConcepts.length === 0 ? (
            <div
              className="rounded-3xl border-2 border-dashed flex flex-col items-center justify-center py-14 text-center"
              style={{ borderColor: "var(--purple-200)", background: "var(--purple-50)" }}
            >
              <div className="text-5xl mb-3">🎨</div>
              <h3 className="font-bold mb-1" style={{ color: "var(--purple-900)" }}>No creations yet</h3>
              <p className="text-sm mb-5" style={{ color: "var(--gray-500)" }}>
                Upload your first drawing to create an amazing toy!
              </p>
              <button
                onClick={() => navigate("/")}
                className="ds-btn-primary px-6 py-3 text-sm font-bold"
              >
                Start Creating ✨
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
              {userConcepts.map((concept) => (
                <div
                  key={concept.id}
                  className="rounded-3xl border overflow-hidden group transition-shadow hover:shadow-lg"
                  style={{ borderColor: "var(--gray-200)", background: "#fff" }}
                >
                  {/* Image */}
                  <div className="aspect-square relative" style={{ background: "var(--purple-50)" }}>
                    {concept.generated_concept_url ? (
                      <img
                        src={concept.generated_concept_url}
                        alt="Toy concept"
                        className="w-full h-full object-contain p-2"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-4xl">🎨</div>
                    )}
                    {/* Expand button */}
                    <button
                      onClick={() => setPreviewImage(concept.generated_concept_url)}
                      className="absolute top-2 right-2 w-8 h-8 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-white"
                      style={{ background: "rgba(0,0,0,0.5)" }}
                    >
                      <Maximize2 className="w-3.5 h-3.5" />
                    </button>
                    {/* Status badge */}
                    <div
                      className="absolute bottom-2 left-2 px-2 py-0.5 rounded-full text-[10px] font-semibold text-white"
                      style={{ background: "var(--purple-700)" }}
                    >
                      💾 Saved
                    </div>
                  </div>

                  {/* Card body */}
                  <div className="p-3">
                    <p className="text-xs font-medium mb-2" style={{ color: "var(--gray-400)" }}>
                      {new Date(concept.created_at).toLocaleDateString("en-GB", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </p>
                    <button
                      onClick={() => navigate("/checkout", {
                        state: {
                          cartItems: [{
                            orderName: "Saved Toy",
                            price: 59.99,
                            type: "Fully crafted toy",
                            quantity: 1,
                            description: "",
                          }],
                        },
                      })}
                      className="w-full flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-semibold transition-colors"
                      style={{ background: "var(--purple-100)", color: "var(--purple-700)" }}
                    >
                      <Package className="w-3.5 h-3.5" /> Order toy
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>}

        {/* ── My Orders ── */}
        {activeTab === "orders" && <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-bold" style={{ color: "var(--purple-900)", fontFamily: "var(--font-display)" }}>
              My Orders
            </h2>
            <button
              onClick={() => navigate("/")}
              className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full transition-colors"
              style={{ color: "var(--purple-700)", background: "var(--purple-100)" }}
            >
              <Plus className="w-3 h-3" /> New toy
            </button>
          </div>

          {ordersLoading ? (
            <div className="flex justify-center py-12">
              <div className="w-8 h-8 rounded-full animate-spin" style={{ border: "3px solid var(--purple-200)", borderTopColor: "var(--purple-600)" }} />
            </div>
          ) : orders.length === 0 ? (
            <div
              className="rounded-3xl border-2 border-dashed flex flex-col items-center justify-center py-14 text-center"
              style={{ borderColor: "var(--purple-200)", background: "var(--purple-50)" }}
            >
              <div className="text-5xl mb-3">📦</div>
              <h3 className="font-bold mb-1" style={{ color: "var(--purple-900)" }}>No orders yet</h3>
              <p className="text-sm mb-5" style={{ color: "var(--gray-500)" }}>
                Create a toy and place your first order!
              </p>
              <button onClick={() => navigate("/")} className="ds-btn-primary px-6 py-3 text-sm font-bold">
                Start Creating ✨
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {orders.map((order) => {
                const st = STATUS_STYLES[order.status] || STATUS_STYLES.pending;
                return (
                  <div
                    key={order.id}
                    className="rounded-3xl border overflow-hidden"
                    style={{ background: "#fff", borderColor: "var(--gray-200)" }}
                  >
                    <div className="flex items-start gap-4 p-4">
                      {order.concept_image_url ? (
                        <img
                          src={order.concept_image_url}
                          alt={order.toy_name}
                          className="w-20 h-20 rounded-2xl object-cover flex-shrink-0"
                        />
                      ) : (
                        <div className="w-20 h-20 rounded-2xl flex items-center justify-center text-3xl flex-shrink-0" style={{ background: "var(--purple-50)" }}>
                          🎨
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-sm truncate mb-0.5" style={{ color: "var(--purple-900)" }}>
                          {order.toy_name || "Custom Toy"}
                        </h3>
                        <p className="text-xs mb-2" style={{ color: "var(--gray-500)" }}>
                          {order.tier === "diy" ? "DIY Kit" : "Fully Crafted"} · £{Number(order.price).toFixed(2)}
                        </p>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span
                            className="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-bold"
                            style={{ background: st.bg, color: st.color, border: `1px solid ${st.border}` }}
                          >
                            {st.label}
                          </span>
                          <span className="text-[11px]" style={{ color: "var(--gray-400)" }}>
                            {new Date(order.created_at).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div
                      className="px-4 py-3 border-t text-xs leading-relaxed"
                      style={{ borderColor: "var(--gray-100)", color: "var(--gray-500)", background: "var(--purple-50)" }}
                    >
                      We're working on your order and will email you at <strong>{order.customer_email}</strong> with updates shortly.
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>}

        {/* ── Help & Support ── */}
        <button
          onClick={() => navigate("/help")}
          className="w-full flex items-center gap-4 px-5 py-4 rounded-3xl border text-left transition-colors hover:bg-purple-50"
          style={{ background: "#fff", borderColor: "var(--gray-200)" }}
        >
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ background: "var(--purple-100)" }}
          >
            <HelpCircle className="w-5 h-5" style={{ color: "var(--purple-700)" }} />
          </div>
          <div className="flex-1">
            <p className="text-sm font-semibold" style={{ color: "var(--purple-900)" }}>
              How can we help?
            </p>
            <p className="text-xs" style={{ color: "var(--gray-500)" }}>
              FAQ, contact support, returns &amp; materials
            </p>
          </div>
          <ChevronRight className="w-4 h-4 flex-shrink-0" style={{ color: "var(--gray-300)" }} />
        </button>

        {/* ── Account info card ── */}
        <div
          className="rounded-3xl p-5 border"
          style={{ background: "#fff", borderColor: "var(--gray-200)" }}
        >
          <h2 className="text-sm font-bold mb-4" style={{ color: "var(--purple-900)" }}>Account</h2>
          <div className="space-y-3">
            <div className="flex items-center justify-between py-2 border-b" style={{ borderColor: "var(--gray-100)" }}>
              <span className="text-sm" style={{ color: "var(--gray-500)" }}>Email</span>
              <span className="text-sm font-medium" style={{ color: "var(--gray-700)" }}>{user?.email}</span>
            </div>
            <div className="flex items-center justify-between py-2 border-b" style={{ borderColor: "var(--gray-100)" }}>
              <span className="text-sm" style={{ color: "var(--gray-500)" }}>Member since</span>
              <span className="text-sm font-medium" style={{ color: "var(--gray-700)" }}>
                {user?.created_at
                  ? new Date(user.created_at).toLocaleDateString("en-GB", { month: "long", year: "numeric" })
                  : "—"}
              </span>
            </div>
            <div className="flex items-center justify-between py-2">
              <span className="text-sm" style={{ color: "var(--gray-500)" }}>Auth provider</span>
              <span
                className="text-xs font-semibold px-2.5 py-1 rounded-full"
                style={{ background: "var(--purple-100)", color: "var(--purple-700)" }}
              >
                {user?.app_metadata?.provider === "google" ? "Google" : "Email"}
              </span>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
