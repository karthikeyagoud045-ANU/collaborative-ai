"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";

export default function LandingPage() {
  const router = useRouter();
  const { user, loading, signInWithGoogle } = useAuth();
  const [scrollY, setScrollY] = useState(0);

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleGetStarted = () => {
    if (user) {
      router.push("/dashboard");
    } else {
      signInWithGoogle();
    }
  };

  return (
    <div style={{ minHeight: "100vh", fontFamily: "var(--font-sans)", color: "var(--text-primary)", overflow: "hidden" }}>
      {/* Animated mesh gradient background */}
      <div style={{ position: "fixed", inset: 0, zIndex: 0, background: "var(--mesh-subtle)" }}>
        <div style={{
          position: "absolute", top: "-20%", left: "-10%", width: 600, height: 600,
          background: "radial-gradient(circle, rgba(99,102,241,0.15) 0%, transparent 70%)",
          borderRadius: "50%", filter: "blur(80px)", animation: "float1 20s ease-in-out infinite",
        }} />
        <div style={{
          position: "absolute", bottom: "-10%", right: "-5%", width: 500, height: 500,
          background: "radial-gradient(circle, rgba(236,72,153,0.1) 0%, transparent 70%)",
          borderRadius: "50%", filter: "blur(80px)", animation: "float2 25s ease-in-out infinite",
        }} />
        <div style={{
          position: "absolute", top: "40%", left: "50%", width: 400, height: 400,
          background: "radial-gradient(circle, rgba(6,182,212,0.08) 0%, transparent 70%)",
          borderRadius: "50%", filter: "blur(60px)", animation: "float3 18s ease-in-out infinite",
        }} />
      </div>

      <style>{`
        @keyframes float1 { 0%,100%{transform:translate(0,0)} 50%{transform:translate(60px,40px)} }
        @keyframes float2 { 0%,100%{transform:translate(0,0)} 50%{transform:translate(-50px,-30px)} }
        @keyframes float3 { 0%,100%{transform:translate(0,0)} 50%{transform:translate(30px,-50px)} }
        @keyframes fadeInUp { from{opacity:0;transform:translateY(20px)} to{opacity:1;transform:translateY(0)} }
        .glass-card { transition: transform 0.3s ease, box-shadow 0.3s ease; }
        .glass-card:hover { transform: translateY(-4px); box-shadow: var(--glass-shadow-lg), 0 0 30px rgba(99,102,241,0.1); }
      `}</style>

      {/* Navigation */}
      <nav style={{
        position: "sticky", top: 0, zIndex: 100,
        padding: "var(--space-md) var(--space-2xl)",
        background: "var(--glass-bg)",
        backdropFilter: "blur(var(--blur-strong))",
        WebkitBackdropFilter: "blur(var(--blur-strong))",
        borderBottom: "1px solid var(--glass-border)",
      }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", maxWidth: 1200, margin: "0 auto" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "var(--space-sm)" }}>
            <div style={{
              width: 36, height: 36, borderRadius: "var(--radius-md)",
              background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 18, color: "#fff",
            }}>⚡</div>
            <span style={{ fontWeight: 700, fontSize: "var(--font-size-lg)", letterSpacing: "-0.02em" }}>
              Ultimate Vibe Coder
            </span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "var(--space-lg)" }}>
            <a href="#features" style={{ color: "var(--text-secondary)", fontSize: "var(--font-size-sm)", textDecoration: "none" }}>Features</a>
            <a href="#how" style={{ color: "var(--text-secondary)", fontSize: "var(--font-size-sm)", textDecoration: "none" }}>How it Works</a>
            {!loading && (
              user ? (
                <button onClick={() => router.push("/dashboard")} className="btn btn-primary" style={{ padding: "8px 20px" }}>
                  Dashboard
                </button>
              ) : (
                <button onClick={handleGetStarted} className="btn btn-primary" style={{ padding: "8px 20px" }}>
                  Get Started
                </button>
              )
            )}
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section style={{
        position: "relative", zIndex: 1,
        padding: "120px var(--space-2xl) 80px",
        textAlign: "center",
      }}>
        <div style={{ maxWidth: 800, margin: "0 auto" }}>
          <div style={{
            display: "inline-block",
            padding: "6px 16px",
            borderRadius: "var(--radius-full)",
            background: "var(--glass-bg)",
            border: "1px solid var(--glass-border)",
            backdropFilter: "blur(8px)",
            fontSize: "var(--font-size-xs)",
            fontWeight: 500,
            color: "var(--text-secondary)",
            marginBottom: "var(--space-xl)",
            animation: "fadeInUp 0.6s ease",
          }}>
            ✨ AI-powered multiplayer IDE with persistent memory
          </div>
          <h1 style={{
            fontSize: "clamp(var(--font-size-3xl), 5vw, var(--font-size-display))",
            fontWeight: 800,
            lineHeight: 1.1,
            letterSpacing: "-0.04em",
            margin: 0,
            background: "linear-gradient(135deg, var(--text-primary) 0%, var(--text-secondary) 100%)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            animation: "fadeInUp 0.6s ease 0.1s both",
          }}>
            Build apps at the<br />speed of thought
          </h1>
          <p style={{
            fontSize: "var(--font-size-lg)",
            color: "var(--text-secondary)",
            maxWidth: 560,
            margin: "var(--space-xl) auto 0",
            lineHeight: 1.7,
            animation: "fadeInUp 0.6s ease 0.2s both",
          }}>
            Your AI agent team plans, designs, codes, and reviews — so you ship production-grade web apps in minutes, not days.
          </p>
          <div style={{
            display: "flex", gap: "var(--space-md)", justifyContent: "center",
            marginTop: "var(--space-2xl)",
            animation: "fadeInUp 0.6s ease 0.3s both",
          }}>
            <button onClick={handleGetStarted} className="btn btn-primary" style={{
              padding: "14px 32px",
              fontSize: "var(--font-size-base)",
              fontWeight: 600,
            }}>
              Start Building →
            </button>
            <button onClick={() => document.getElementById("features")?.scrollIntoView({ behavior: "smooth" })} className="btn btn-secondary" style={{
              padding: "14px 32px",
              fontSize: "var(--font-size-base)",
            }}>
              See Features
            </button>
          </div>
        </div>

        {/* Floating code preview card */}
        <div className="glass-strong glass-card" style={{
          maxWidth: 700,
          margin: "80px auto 0",
          borderRadius: "var(--radius-xl)",
          overflow: "hidden",
          animation: "fadeInUp 0.8s ease 0.4s both",
          transform: `translateY(${scrollY * -0.05}px)`,
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", padding: "var(--space-md)", borderBottom: "1px solid var(--border-primary)" }}>
            <div style={{ width: 10, height: 10, borderRadius: "50%", background: "#ff5f57" }} />
            <div style={{ width: 10, height: 10, borderRadius: "50%", background: "#ffbd2e" }} />
            <div style={{ width: 10, height: 10, borderRadius: "50%", background: "#28c840" }} />
            <span style={{ marginLeft: "auto", fontSize: "var(--font-size-xs)", color: "var(--text-tertiary)", fontFamily: "var(--font-mono)" }}>
              index.html
            </span>
          </div>
          <pre style={{
            margin: 0,
            padding: "var(--space-xl)",
            fontFamily: "var(--font-mono)",
            fontSize: "var(--font-size-sm)",
            lineHeight: 1.8,
            color: "var(--text-secondary)",
            overflow: "auto",
          }}>
            <code>
              <span style={{ color: "#f87171" }}>{"<div"}</span> <span style={{ color: "#a78bfa" }}>className</span>=<span style={{ color: "#34d399" }}>"glass-hero"</span><span style={{ color: "#f87171" }}>{">"}</span>
              {"\n  "}<span style={{ color: "#f87171" }}>{"<h1>"}</span><span style={{ color: "#38f9d7" }}>Build Beautiful Apps</span><span style={{ color: "#f87171" }}>{"</h1>"}</span>
              {"\n  "}<span style={{ color: "#f87171" }}>{"<p>"}</span>The orchestrator planned, designed, and built this in 30 seconds<span style={{ color: "#f87171" }}>{"</p>"}</span>
              {"\n  "}<span style={{ color: "#f87171" }}>{"<button"}</span> <span style={{ color: "#a78bfa" }}>onClick</span>={<span style={{ color: "#34d399" }}>{"shipIt"}</span>}<span style={{ color: "#f87171" }}>{">"}</span><span style={{ color: "#38f9d7" }}>Deploy</span><span style={{ color: "#f87171" }}>{"</button>"}</span>
              {"\n"}<span style={{ color: "#f87171" }}>{"</div>"}</span>
            </code>
          </pre>
        </div>
      </section>

      {/* Features Grid */}
      <section id="features" style={{ position: "relative", zIndex: 1, padding: "80px var(--space-2xl)" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <h2 style={{
            fontSize: "var(--font-size-2xl)", fontWeight: 700, textAlign: "center",
            letterSpacing: "-0.02em", marginBottom: "var(--space-2xl)",
          }}>
            Everything you need to ship fast
          </h2>
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
            gap: "var(--space-lg)",
          }}>
            {FACES.map((feat, i) => (
              <div key={feat.title} className="glass glass-card" style={{
                padding: "var(--space-xl)",
                borderRadius: "var(--radius-lg)",
                animation: `fadeInUp 0.6s ease ${i * 0.1}s both`,
              }}>
                <div style={{
                  width: 48, height: 48, borderRadius: "var(--radius-md)",
                  background: `${feat.color}15`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 24, marginBottom: "var(--space-lg)",
                }}>{feat.icon}</div>
                <h3 style={{ fontSize: "var(--font-size-lg)", fontWeight: 600, marginBottom: "var(--space-sm)" }}>{feat.title}</h3>
                <p style={{ fontSize: "var(--font-size-sm)", color: "var(--text-secondary)", lineHeight: 1.6 }}>{feat.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it Works */}
      <section id="how" style={{ position: "relative", zIndex: 1, padding: "80px var(--space-2xl)" }}>
        <div style={{ maxWidth: 900, margin: "0 auto", textAlign: "center" }}>
          <h2 style={{ fontSize: "var(--font-size-2xl)", fontWeight: 700, letterSpacing: "-0.02em", marginBottom: "var(--space-2xl" }}>
            Three steps to production
          </h2>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "var(--space-lg)", justifyContent: "center" }}>
            {STEPS.map((step, i) => (
              <div key={step.title} className="glass glass-card" style={{
                flex: "1 1 250px", maxWidth: 280,
                padding: "var(--space-xl)",
                borderRadius: "var(--radius-lg)",
                textAlign: "center",
              }}>
                <div style={{
                  width: 40, height: 40, borderRadius: "50%",
                  background: "var(--accent)", color: "#fff",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: "var(--font-size-base)", fontWeight: 700,
                  margin: "0 auto var(--space-lg)",
                }}>{i + 1}</div>
                <h3 style={{ fontWeight: 600, marginBottom: "var(--space-sm)" }}>{step.title}</h3>
                <p style={{ fontSize: "var(--font-size-sm)", color: "var(--text-secondary)", lineHeight: 1.6 }}>{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section style={{ position: "relative", zIndex: 1, padding: "100px var(--space-2xl)", textAlign: "center" }}>
        <div className="glass-strong" style={{
          maxWidth: 600, margin: "0 auto",
          padding: "var(--space-3xl)",
          borderRadius: "var(--radius-2xl)",
        }}>
          <h2 style={{ fontSize: "var(--font-size-2xl)", fontWeight: 700, marginBottom: "var(--space-md", letterSpacing: "-0.02em" }}>
            Ready to build?
          </h2>
          <p style={{ color: "var(--text-secondary)", marginBottom: "var(--space-xl)" }}>
            Sign in with Google and start creating in seconds. No credit card required.
          </p>
          <button onClick={handleGetStarted} className="btn btn-primary" style={{
            padding: "14px 40px", fontSize: "var(--font-size-base)", fontWeight: 600,
          }}>
            {user ? "Go to Dashboard" : "Sign In with Google"}
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer style={{
        position: "relative", zIndex: 1,
        padding: "var(--space-xl) var(--space-2xl)",
        borderTop: "1px solid var(--border-primary)",
        textAlign: "center",
      }}>
        <p style={{ fontSize: "var(--font-size-xs)", color: "var(--text-tertiary)" }}>
          ⚡ Ultimate Vibe Coder — Built with AI agents · {new Date().getFullYear()}
        </p>
      </footer>
    </div>
  );
}

const FACES = [
  { icon: "🧠", title: "AI Orchestrator", desc: "Brain agent plans your request, delegates to specialists, and combines results — like having a senior engineer leading the team.", color: "#6366f1" },
  { icon: "🎨", title: "Artist Mode", desc: "Sketch your UI idea on canvas. The AI interprets your drawing and generates pixel-perfect code from it.", color: "#ec4899" },
  { icon: "🔄", title: "Real-time Collab", desc: "Multiplayer IDE with conflict-free sync. See everyone's cursors and edits live via CRDT technology.", color: "#10b981" },
  { icon: "🔑", title: "Multi-Key Rotation", desc: "Add unlimited API keys per provider. Round-robin load balancing prevents rate limits and downtime.", color: "#f59e0b" },
  { icon: "💾", title: "Persistent Memory", desc: "Your AI agents remember past decisions, preferences, and learnings across sessions. They get smarter over time.", color: "#8b5cf6" },
  { icon: "🚀", title: "Live Preview", desc: "One-click dev server with WebContainer. See changes instantly, no setup needed. Export to production in seconds.", color: "#06b6d4" },
];

const STEPS = [
  { title: "Describe", desc: "Tell the orchestrator what you want to build — in plain English, a sketch, or both." },
  { title: "Build", desc: "Watch agents plan, design, code, and review — each contributing their expertise." },
  { title: "Ship", desc: "Preview live, export code, or deploy directly. From idea to production in minutes." },
];
