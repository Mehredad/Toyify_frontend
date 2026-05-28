import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '@/components/ui/navbar';

export default function Home() {
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  /* ── upload helpers ─────────────────────────────────── */
  const handleImageUpload = (file: File) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64 = reader.result as string;
      sessionStorage.setItem('uploadedImage', base64);
      sessionStorage.setItem('uploadedImageName', file.name);
      navigate('/artist');
    };
    reader.readAsDataURL(file);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file?.type.startsWith('image/')) handleImageUpload(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file?.type.startsWith('image/')) handleImageUpload(file);
  };

  const triggerUpload = () => fileInputRef.current?.click();

  /* ── How-it-works data ──────────────────────────────── */
  const steps = [
    { n: 1, title: 'Draw', body: 'Any scribble, on any paper. A phone photo works.', icon: '✏️', tint: '#FEF3C7', border: '#FDE68A' },
    { n: 2, title: 'Preview', body: 'Our AI crafts a 3D toy concept and a STEM story in under a minute.', icon: '✨', tint: '#F4EBFF', border: '#E9D7FE' },
    { n: 3, title: 'Receive', body: 'Printed in PLA, packed, and posted in 5–7 working days.', icon: '📦', tint: '#CCFBF1', border: '#5EEAD4' },
  ];

  return (
    <>
      <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileSelect} style={{ display: 'none' }} />

      {/* ═══════════════════════════════════════════════════
          HERO  —  full-bleed purple gradient
      ═══════════════════════════════════════════════════ */}
      <div style={{
        position: 'relative',
        background: 'linear-gradient(135deg, #42307D 0%, #7F56D9 60%, #9E77ED 100%)',
        minHeight: '100vh',
        overflow: 'hidden',
        fontFamily: 'Lexend, Inter, sans-serif',
      }}>

        {/* Floating decorative shapes */}
        <div aria-hidden="true" style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none' }}>
          <div style={{ position: 'absolute', top: 120, right: 80, width: 140, height: 140, borderRadius: 32, background: 'rgba(253,211,77,0.2)', transform: 'rotate(-15deg)', filter: 'blur(0.3px)' }} />
          <div style={{ position: 'absolute', top: 340, right: 260, width: 80, height: 80, borderRadius: '50%', background: 'rgba(244,114,182,0.3)' }} />
          <div style={{ position: 'absolute', bottom: 180, right: 160, width: 120, height: 120, borderRadius: 24, background: 'rgba(94,234,212,0.25)', transform: 'rotate(22deg)' }} />
          <div style={{ position: 'absolute', top: 220, left: 80, width: 60, height: 60, borderRadius: '50%', background: 'rgba(255,255,255,0.12)' }} />
          <div style={{ position: 'absolute', bottom: 300, left: 140, width: 100, height: 100, borderRadius: 20, background: 'rgba(251,191,36,0.2)', transform: 'rotate(12deg)' }} />
          {([[200,500],[900,200],[1100,440],[300,700],[1250,620]] as [number,number][]).map(([x,y],i) => (
            <div key={i} style={{ position:'absolute', left:x, top:y, width:8, height:8, background:'#fff', borderRadius:'50%', opacity:0.8, boxShadow:'0 0 12px rgba(255,255,255,0.9)' }} />
          ))}
        </div>

        {/* Navbar overlaid on gradient */}
        <Navbar navigate={navigate} />

        {/* Hero content — paddingTop accounts for fixed nav (h-14 = 56px) */}
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '104px 40px 80px', position: 'relative' }} className="hero-content-wrap">
          <div className="hero-grid" style={{ display: 'grid', gridTemplateColumns: '1.1fr 1fr', gap: 64, alignItems: 'center' }}>

            {/* ── LEFT: copy + CTAs ─────────────────────── */}
            <div style={{ color: '#fff' }}>
              {/* Kicker badge */}
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '6px 14px 6px 6px', background: 'rgba(255,255,255,0.15)', borderRadius: 999, fontSize: 13, fontWeight: 600, marginBottom: 24, border: '1px solid rgba(255,255,255,0.2)' }}>
                <span style={{ background: 'rgba(255,255,255,0.2)', width: 26, height: 26, borderRadius: 999, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>🚀</span>
                Let's toyify
              </div>

              {/* Headline */}
              <h1 style={{ fontFamily: "'Space Grotesk', system-ui, sans-serif", fontSize: 'clamp(40px, 5vw, 72px)', lineHeight: 1.05, fontWeight: 700, letterSpacing: '-0.02em', margin: '0 0 24px', color: '#fff' }}>
                Turn your<br />drawings into<br />
                <span style={{ background: 'linear-gradient(90deg, #FDE68A, #F472B6)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                  real toys
                </span>
              </h1>

              <p style={{ fontSize: 20, lineHeight: 1.55, opacity: 0.85, maxWidth: 480, margin: '0 0 36px' }}>
                A doodle becomes a 3D-printed STEM toy in your hands. Two free previews every day.
              </p>

              {/* CTA */}
              <div style={{ display: 'flex', gap: 16, alignItems: 'center', flexWrap: 'wrap' }}>
                <button
                  onClick={triggerUpload}
                  style={{ background: '#fff', color: '#6941C6', fontWeight: 700, fontSize: 16, padding: '16px 28px', borderRadius: 9999, border: 'none', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 8, boxShadow: '0 0 0 0 rgba(127,86,217,0.4)', animation: 'ctaPulse 2s ease-in-out infinite', minHeight: 52, fontFamily: 'Inter, sans-serif' }}
                >
                  Start creating — free
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M5 12h14M13 5l7 7-7 7"/></svg>
                </button>
              </div>

              {/* Trust badges */}
              <div style={{ marginTop: 24, display: 'flex', gap: 20, opacity: 0.85, fontSize: 13, fontFamily: 'Inter, sans-serif', flexWrap: 'wrap' }}>
                <span>✓ No sign-up to try</span>
                <span>✓ Printed in the UK</span>
                <span>✓ Safe PLA plastic</span>
              </div>
            </div>

            {/* ── RIGHT: Before/After comparison card ────── */}
            <div className="hero-card-col" style={{ position: 'relative' }}>
              <div style={{ background: '#fff', borderRadius: 28, padding: 16, boxShadow: '0 30px 60px -12px rgba(0,0,0,0.4)', transform: 'rotate(-2deg)', position: 'relative' }}>
                {/* Tape decoration */}
                <div style={{ position: 'absolute', top: -12, left: '50%', transform: 'translateX(-50%) rotate(-4deg)', width: 80, height: 22, background: 'rgba(253,211,77,0.7)', borderRadius: 2 }} />
                <div style={{ position: 'relative', borderRadius: 18, overflow: 'hidden', aspectRatio: '1 / 1', background: '#F9F5FF' }}>

                  {/* Left side — child's drawing */}
                  <div style={{ position: 'absolute', inset: 0, background: '#FDFCF8' }}>
                    <svg viewBox="0 0 400 400" style={{ width: '100%', height: '100%' }}>
                      <g stroke="#2B2516" strokeWidth="3" fill="none" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M120 180 Q100 140 140 120 Q170 100 200 110 Q230 100 260 120 Q300 140 280 180 L285 210 Q290 260 240 280 Q200 290 160 280 Q110 260 115 210 Z" />
                        <path d="M130 130 L115 105 L145 115" />
                        <path d="M270 130 L285 105 L255 115" />
                        <circle cx="170" cy="190" r="6" fill="#2B2516"/>
                        <circle cx="230" cy="190" r="6" fill="#2B2516"/>
                        <path d="M190 220 Q200 230 210 220" />
                        <path d="M180 215 L160 210" /><path d="M180 220 L160 225" />
                        <path d="M220 215 L240 210" /><path d="M220 220 L240 225" />
                      </g>
                      <text x="200" y="360" fontFamily="Caveat, cursive" fontSize="28" fill="#2B2516" textAnchor="middle">by Maya, age 9</text>
                    </svg>
                  </div>

                  {/* Right side — 3D toy concept */}
                  <div style={{ position: 'absolute', inset: 0, clipPath: 'polygon(55% 0, 100% 0, 100% 100%, 55% 100%)', background: 'linear-gradient(135deg, #F4EBFF 0%, #E9D7FE 100%)' }}>
                    <svg viewBox="0 0 400 400" style={{ width: '100%', height: '100%' }}>
                      <defs>
                        <radialGradient id="bodyG" cx="50%" cy="35%">
                          <stop offset="0%" stopColor="#FBCFE8"/>
                          <stop offset="100%" stopColor="#EC4899"/>
                        </radialGradient>
                      </defs>
                      <ellipse cx="200" cy="230" rx="90" ry="20" fill="rgba(0,0,0,0.15)"/>
                      <path d="M120 200 Q100 160 140 140 Q170 120 200 130 Q230 120 260 140 Q300 160 280 200 L285 230 Q290 280 240 300 Q200 310 160 300 Q110 280 115 230 Z" fill="url(#bodyG)"/>
                      <path d="M130 150 L115 125 L145 135" fill="url(#bodyG)"/>
                      <path d="M270 150 L285 125 L255 135" fill="url(#bodyG)"/>
                      <ellipse cx="170" cy="210" rx="8" ry="10" fill="#1F2937"/>
                      <ellipse cx="230" cy="210" rx="8" ry="10" fill="#1F2937"/>
                      <circle cx="172" cy="207" r="2.5" fill="#fff"/>
                      <circle cx="232" cy="207" r="2.5" fill="#fff"/>
                      <path d="M190 240 Q200 250 210 240" stroke="#1F2937" strokeWidth="3" fill="none" strokeLinecap="round"/>
                      <ellipse cx="155" cy="230" rx="10" ry="6" fill="#F9A8D4"/>
                      <ellipse cx="245" cy="230" rx="10" ry="6" fill="#F9A8D4"/>
                    </svg>
                  </div>

                  {/* Divider handle */}
                  <div style={{ position: 'absolute', left: '55%', top: 0, bottom: 0, width: 3, background: '#fff', boxShadow: '0 0 10px rgba(0,0,0,0.2)' }}>
                    <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: 40, height: 40, background: '#fff', borderRadius: 999, boxShadow: '0 4px 12px rgba(0,0,0,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, color: '#6941C6', fontSize: 16 }}>⇆</div>
                  </div>

                  {/* Labels */}
                  <div style={{ position: 'absolute', top: 12, left: 14, background: 'rgba(0,0,0,0.7)', color: '#fff', fontFamily: 'Inter, sans-serif', fontSize: 11, fontWeight: 600, padding: '4px 10px', borderRadius: 999 }}>Drawing</div>
                  <div style={{ position: 'absolute', top: 12, right: 14, background: '#6941C6', color: '#fff', fontFamily: 'Inter, sans-serif', fontSize: 11, fontWeight: 600, padding: '4px 10px', borderRadius: 999 }}>3D toy concept</div>
                </div>

                <div style={{ marginTop: 12, textAlign: 'center', fontFamily: 'Caveat, cursive', fontSize: 22, color: '#414651' }}>
                  Drag to compare →
                </div>
              </div>

              {/* Floating stats badge */}
              <div style={{ position: 'absolute', top: -20, right: -30, background: '#fff', borderRadius: 16, padding: '10px 14px', boxShadow: '0 10px 30px rgba(0,0,0,0.2)', transform: 'rotate(6deg)', fontFamily: 'Inter, sans-serif' }}>
                <div style={{ fontSize: 11, color: '#717680', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>This week</div>
                <div style={{ fontSize: 22, color: '#6941C6', fontWeight: 700 }}>1,247 toys</div>
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════
          HOW IT WORKS  —  white background, 3 cards
      ═══════════════════════════════════════════════════ */}
      <div style={{ background: '#fff', padding: '96px 40px', fontFamily: 'Lexend, Inter, sans-serif' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 56 }}>
            <div style={{ fontFamily: 'Inter, sans-serif', fontSize: 13, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#7F56D9', marginBottom: 12 }}>How it works</div>
            <h2 style={{ fontFamily: "'Space Grotesk', system-ui, sans-serif", fontSize: 48, fontWeight: 700, color: '#42307D', margin: 0, letterSpacing: '-0.02em' }}>
              Three steps. Zero fuss.
            </h2>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 32, position: 'relative' }}>
            {/* Dashed connector line */}
            <div aria-hidden="true" style={{ position: 'absolute', top: 60, left: '18%', right: '18%', height: 2, background: 'repeating-linear-gradient(to right, #D6BBFB 0 8px, transparent 8px 16px)' }} />

            {steps.map(s => (
              <div key={s.n} style={{ background: '#fff', border: '1.5px solid #E9EAEB', borderRadius: 24, padding: 32, position: 'relative', textAlign: 'center', transform: `rotate(${s.n === 2 ? 0 : s.n === 1 ? -1 : 1}deg)`, boxShadow: '0 4px 12px rgba(16,24,40,0.04)' }}>
                <div style={{ width: 80, height: 80, margin: '0 auto 20px', background: s.tint, border: `2px solid ${s.border}`, borderRadius: 24, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 36, position: 'relative' }}>
                  {s.icon}
                  <div style={{ position: 'absolute', top: -8, left: -8, width: 28, height: 28, background: '#7F56D9', color: '#fff', borderRadius: 999, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: 14 }}>{s.n}</div>
                </div>
                <h3 style={{ fontFamily: "'Space Grotesk', system-ui, sans-serif", fontSize: 26, fontWeight: 700, color: '#42307D', margin: '0 0 10px' }}>{s.title}</h3>
                <p style={{ margin: 0, fontSize: 16, lineHeight: 1.6, color: '#535862' }}>{s.body}</p>
              </div>
            ))}
          </div>

          {/* Bottom CTA */}
          <div style={{ textAlign: 'center', marginTop: 56 }}>
            <button
              onClick={triggerUpload}
              style={{ background: '#7F56D9', color: '#fff', fontWeight: 700, fontSize: 16, padding: '16px 36px', borderRadius: 9999, border: 'none', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 8, boxShadow: '0 8px 20px rgba(127,86,217,0.35)', fontFamily: 'Inter, sans-serif' }}
            >
              Start creating — free
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M5 12h14M13 5l7 7-7 7"/></svg>
            </button>
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════
          FOOTER  —  dark purple
      ═══════════════════════════════════════════════════ */}
      <footer style={{ background: '#42307D', color: 'rgba(255,255,255,0.7)', padding: '40px 40px 28px', fontFamily: 'Inter, sans-serif' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <img src="./Logo.svg" alt="Toyify" style={{ height: 32, filter: 'brightness(0) invert(1)', opacity: 0.9 }} />
            <span style={{ fontSize: 13 }}>Toyify Ltd, London. Made in the UK.</span>
          </div>
          <div style={{ display: 'flex', gap: 24, fontSize: 13 }}>
            {['About', 'FAQ', 'Privacy', 'Terms', 'Contact'].map(l => (
              <a key={l} href="#" style={{ color: 'rgba(255,255,255,0.7)', textDecoration: 'none' }}>{l}</a>
            ))}
          </div>
          <span style={{ fontSize: 12 }}>© 2026 Toyify Ltd</span>
        </div>
      </footer>

      {/* pulse keyframe + responsive overrides */}
      <style>{`
        @keyframes ctaPulse {
          0%, 100% { box-shadow: 0 0 0 0 rgba(127,86,217,0.4), 0 4px 16px rgba(127,86,217,0.35); }
          50% { box-shadow: 0 0 0 10px rgba(127,86,217,0), 0 4px 16px rgba(127,86,217,0.35); }
        }
        @media (max-width: 900px) {
          .hero-grid { grid-template-columns: 1fr !important; }
          .hero-card-col { display: none !important; }
          .hero-content-wrap { padding: 80px 24px 60px !important; }
        }
        @media (max-width: 600px) {
          .hero-content-wrap { padding: 72px 20px 48px !important; }
        }
      `}</style>
    </>
  );
}
