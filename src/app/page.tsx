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
    <div style={{ minHeight: "100vh", fontFamily: "var(--font-sans)", color: "var(--text-primary)", background: "var(--bg-primary)" }}>
      {/* Warm cream canvas background — Claude signature */}
      <div style={{ position: "fixed", inset: 0, zIndex: 0, background: "var(--bg-primary)" }}>
        <div style={{
          position: "absolute", top: "-20%", left: "-10%", width: 600, height: 600,
          background: "radial-gradient(circle, rgba(204, 120, 92, 0.07) 0%, transparent 70%)",
          borderRadius: "50%", filter: "blur(80px)", animation: "float1 20s ease-in-out infinite",
        }} />
        <div style={{
          position: "absolute", bottom: "-10%", right: "-5%", width: 500, height: 500,
          background: "radial-gradient(circle, rgba(93, 184, 166, 0.05) 0%, transparent 70%)",
          borderRadius: "50%", filter: "blur(80px)", animation: "float2 25s ease-in-out infinite",
        }} />
      </div>

      {/* Navigation — Cream nav bar, Claude style */}
      <nav style={{
        position: "sticky", top: 0, zIndex: 100,
        padding: "0 var(--space-2xl)",
        background: "rgba(250, 249, 245, 0.92)",
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
        borderBottom: "1px solid var(--border-primary)",
        height: 64,
      }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", maxWidth: 1200, margin: "0 auto", height: "100%" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "var(--space-sm)" }}>
            <div style={{
              width: 32, height: 32, borderRadius: "var(--radius-md)",
              background: "var(--primary)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 16, color: "#fff",
            }}>⚡</div>
            <span style={{
              fontFamily: "var(--font-serif)",
              fontWeight: 400, fontSize: "1.15rem", letterSpacing: "-0.02em",
              color: "var(--text-primary)",
            }}>
              Ultimate Vibe Coder
            </span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "var(--space-xl)" }}>
            <a href="#features" style={{ color: "var(--text-muted)", fontSize: "var(--font-size-sm)", textDecoration: "none", fontWeight: 500, transition: "color 0.15s" }}>Features</a>
            <a href="#how" style={{ color: "var(--text-muted)", fontSize: "var(--font-size-sm)", textDecoration: "none", fontWeight: 500, transition: "color 0.15s" }}>How it Works</a>
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

      {/* Hero — Claude editorial serif headline */}
      <section style={{
        position: "relative", zIndex: 1,
        padding: "var(--spacing-section) var(--space-2xl) calc(var(--spacing-section) - 40px)",
        textAlign: "center",
      }}>
        <div style={{ maxWidth: 800, margin: "0 auto" }}>
          {/* Coral badge */}
          <div style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "6px",
            padding: "6px 16px",
            borderRadius: "var(--radius-full)",
            background: "rgba(204, 120, 92, 0.1)",
            border: "1px solid rgba(204, 120, 92, 0.2)",
            fontSize: "var(--font-size-xs)",
            fontWeight: 500,
            color: "var(--primary)",
            marginBottom: "var(--space-xl)",
            animation: "fadeInUp 0.6s ease",
          }}>
            <span style={{ fontSize: "14px" }}>✦</span> AI-powered multiplayer IDE with persistent memory
          </div>
          <h1 style={{
            animation: "fadeInUp 0.6s ease 0.1s both",
            fontFamily: "var(--font-serif)",
            fontSize: "clamp(2.5rem, 5vw, 4rem)",
            fontWeight: 400,
            lineHeight: 1.05,
            letterSpacing: "-0.02em",
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
              fontWeight: 500,
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

        {/* Code editor mockup — Claude dark surface card */}
        <div className="claude-dark-card" style={{
          maxWidth: 700,
          margin: "80px auto 0",
          borderRadius: "var(--radius-xl)",
          overflow: "hidden",
          animation: "fadeInUp 0.8s ease 0.4s both",
          transform: `translateY(${scrollY * -0.05}px)`,
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", padding: "12px 16px", borderBottom: "1px solid var(--surface-dark-elevated)" }}>
            <div style={{ width: 10, height: 10, borderRadius: "50%", background: "#ff5f57" }} />
            <div style={{ width: 10, height: 10, borderRadius: "50%", background: "#ffbd2e" }} />
            <div style={{ width: 10, height: 10, borderRadius: "50%", background: "#28c840" }} />
            <span style={{ marginLeft: "auto", fontSize: "var(--font-size-xs)", color: "var(--text-on-dark-soft)", fontFamily: "var(--font-mono)" }}>
              index.html
            </span>
          </div>
          <pre style={{
            margin: 0,
            padding: "var(--space-xl)",
            fontFamily: "var(--font-mono)",
            fontSize: "var(--font-size-sm)",
            lineHeight: 1.8,
            color: "var(--text-on-dark-soft)",
            overflow: "auto",
            background: "transparent",
          }}>
            <code>
              <span style={{ color: "#f87171" }}>{"<div"}</span> <span style={{ color: "#e8a55a" }}>className</span>=<span style={{ color: "#5db872" }}>{'"glass-hero"'}</span><span style={{ color: "#f87171" }}>{">"}</span>
              {"\n  "}<span style={{ color: "#f87171" }}>{"<h1>"}</span><span style={{ color: "#5db8a6" }}>Build Beautiful Apps</span><span style={{ color: "#f87171" }}>{"</h1>"}</span>
              {"\n  "}<span style={{ color: "#f87171" }}>{"<p>"}</span>The orchestrator planned, designed, and built this in 30 seconds<span style={{ color: "#f87171" }}>{"</p>"}</span>
              {"\n  "}<span style={{ color: "#f87171" }}>{"<button"}</span> <span style={{ color: "#e8a55a" }}>onClick</span>={<span style={{ color: "#5db872" }}>{"shipIt"}</span>}<span style={{ color: "#f87171" }}>{">"}</span><span style={{ color: "#5db8a6" }}>Deploy</span><span style={{ color: "#f87171" }}>{"</button>"}</span>
              {"\n"}<span style={{ color: "#f87171" }}>{"</div>"}</span>
            </code>
          </pre>
        </div>
      </section>

      {/* Features Grid — Claude cream cards */}
      <section id="features" style={{ position: "relative", zIndex: 1, padding: "var(--spacing-section) var(--space-2xl)" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <h2 style={{
            textAlign: "center",
            marginBottom: "var(--space-2xl)",
            fontFamily: "var(--font-serif)",
            fontSize: "clamp(2rem, 4vw, 3rem)",
            fontWeight: 400,
            letterSpacing: "-0.015em",
          }}>
            Everything you need to ship fast
          </h2>
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
            gap: "var(--space-lg)",
          }}>
            {FACES.map((feat, i) => (
              <div key={feat.title} className="claude-card" style={{
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
                <h3 style={{
                  fontFamily: "var(--font-sans)",
                  fontSize: "var(--font-size-lg)",
                  fontWeight: 500,
                  marginBottom: "var(--space-sm)",
                  letterSpacing: 0,
                  lineHeight: 1.3,
                }}>{feat.title}</h3>
                <p style={{ fontSize: "var(--font-size-sm)", color: "var(--text-secondary)", lineHeight: 1.6 }}>{feat.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it Works — Editorial steps */}
      <section id="how" style={{ position: "relative", zIndex: 1, padding: "var(--spacing-section) var(--space-2xl)" }}>
        <div style={{ maxWidth: 900, margin: "0 auto", textAlign: "center" }}>
          <h2 style={{
            marginBottom: "var(--space-2xl)",
            fontFamily: "var(--font-serif)",
            fontSize: "clamp(2rem, 4vw, 3rem)",
            fontWeight: 400,
            letterSpacing: "-0.015em",
          }}>
            Three steps to production
          </h2>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "var(--space-lg)", justifyContent: "center" }}>
            {STEPS.map((step, i) => (
              <div key={step.title} className="claude-card" style={{
                flex: "1 1 250px", maxWidth: 280,
                padding: "var(--space-xl)",
                borderRadius: "var(--radius-lg)",
                textAlign: "center",
              }}>
                <div style={{
                  width: 40, height: 40, borderRadius: "50%",
                  background: "var(--primary)", color: "#fff",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: "var(--font-size-base)", fontWeight: 600,
                  margin: "0 auto var(--space-lg)",
                }}>{i + 1}</div>
                <h3 style={{
                  fontFamily: "var(--font-sans)",
                  fontWeight: 500,
                  fontSize: "var(--font-size-lg)",
                  marginBottom: "var(--space-sm)",
                  letterSpacing: 0,
                }}>{step.title}</h3>
                <p style={{ fontSize: "var(--font-size-sm)", color: "var(--text-secondary)", lineHeight: 1.6 }}>{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA — Coral callout card, Claude style */}
      <section style={{ position: "relative", zIndex: 1, padding: "0 var(--space-2xl) var(--spacing-section)" }}>
        <div style={{
          maxWidth: 800, margin: "0 auto",
          padding: "var(--spacing-section) var(--space-2xl)",
          borderRadius: "var(--radius-lg)",
          background: "var(--primary)",
          color: "var(--text-inverse)",
          textAlign: "center",
        }}>
          <h2 style={{
            marginBottom: "var(--space-md)",
            color: "var(--text-inverse)",
            fontFamily: "var(--font-serif)",
            fontSize: "clamp(1.75rem, 3vw, 2.25rem)",
            fontWeight: 400,
            letterSpacing: "-0.01em",
          }}>
            Ready to build?
          </h2>
          <p style={{
            color: "rgba(255,255,255,0.85)",
            marginBottom: "var(--space-xl)",
            fontSize: "var(--font-size-base)",
            maxWidth: 460,
            margin: "0 auto var(--space-xl)",
            lineHeight: 1.6,
          }}>
            Sign in with Google and start creating in seconds. No credit card required.
          </p>
          <button onClick={handleGetStarted} className="btn" style={{
            padding: "14px 40px",
            fontSize: "var(--font-size-base)",
            fontWeight: 500,
            background: "var(--bg-primary)",
            color: "var(--primary)",
            border: "none",
            borderRadius: "var(--radius-md)",
          }}>
            {user ? "Go to Dashboard" : "Sign In with Google"}
          </button>
        </div>
      </section>

      {/* Footer — Dark navy, Claude style */}
      <footer style={{
        position: "relative", zIndex: 1,
        padding: "var(--spacing-section) var(--space-2xl)",
        background: "var(--surface-dark)",
        color: "var(--text-on-dark-soft)",
      }}>
        <div style={{ maxWidth: 1100, margin: "0 auto", display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "var(--space-2xl)" }}>
          <div>
            <h4 style={{
              fontFamily: "var(--font-sans)",
              fontSize: "var(--font-size-sm)",
              fontWeight: 500,
              color: "var(--text-on-dark)",
              marginBottom: "var(--space-md)",
            }}>Product</h4>
            <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: "var(--space-sm)" }}>
              <li><a href="#features" style={{ fontSize: "var(--font-size-sm)", color: "var(--text-on-dark-soft)", textDecoration: "none" }}>Features</a></li>
              <li><a href="#how" style={{ fontSize: "var(--font-size-sm)", color: "var(--text-on-dark-soft)", textDecoration: "none" }}>How it Works</a></li>
            </ul>
          </div>
          <div>
            <h4 style={{
              fontFamily: "var(--font-sans)",
              fontSize: "var(--font-size-sm)",
              fontWeight: 500,
              color: "var(--text-on-dark)",
              marginBottom: "var(--space-md)",
            }}>Resources</h4>
            <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: "var(--space-sm)" }}>
              <li><a href="#" style={{ fontSize: "var(--font-size-sm)", color: "var(--text-on-dark-soft)", textDecoration: "none" }}>Documentation</a></li>
              <li><a href="#" style={{ fontSize: "var(--font-size-sm)", color: "var(--text-on-dark-soft)", textDecoration: "none" }}>Templates</a></li>
            </ul>
          </div>
          <div>
            <h4 style={{
              fontFamily: "var(--font-sans)",
              fontSize: "var(--font-size-sm)",
              fontWeight: 500,
              color: "var(--text-on-dark)",
              marginBottom: "var(--space-md)",
            }}>Company</h4>
            <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: "var(--space-sm)" }}>
              <li><a href="#" style={{ fontSize: "var(--font-size-sm)", color: "var(--text-on-dark-soft)", textDecoration: "none" }}>About</a></li>
              <li><a href="#" style={{ fontSize: "var(--font-size-sm)", color: "var(--text-on-dark-soft)", textDecoration: "none" }}>Blog</a></li>
            </ul>
          </div>
          <div>
            <h4 style={{
              fontFamily: "var(--font-sans)",
              fontSize: "var(--font-size-sm)",
              fontWeight: 500,
              color: "var(--text-on-dark)",
              marginBottom: "var(--space-md)",
            }}>Legal</h4>
            <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: "var(--space-sm)" }}>
              <li><a href="#" style={{ fontSize: "var(--font-size-sm)", color: "var(--text-on-dark-soft)", textDecoration: "none" }}>Privacy</a></li>
              <li><a href="#" style={{ fontSize: "var(--font-size-sm)", color: "var(--text-on-dark-soft)", textDecoration: "none" }}>Terms</a></li>
            </ul>
          </div>
        </div>
        <div style={{
          borderTop: "1px solid var(--surface-dark-elevated)",
          marginTop: "var(--spacing-section)",
          paddingTop: "var(--space-xl)",
          textAlign: "center",
          fontSize: "var(--font-size-sm)",
          color: "var(--text-on-dark-soft)",
          maxWidth: 1100,
          margin: "var(--spacing-section) auto 0",
        }}>
          ⚡ Ultimate Vibe Coder — Built with AI agents · {new Date().getFullYear()}
        </div>
      </footer>
    </div>
  );
}

const FACES = [
  { icon: "🧠", title: "AI Orchestrator", desc: "Brain agent plans your request, delegates to specialists, and combines results — like having a senior engineer leading the team.", color: "#cc785c" },
  { icon: "🎨", title: "Artist Mode", desc: "Sketch your UI idea on canvas. The AI interprets your drawing and generates pixel-perfect code from it.", color: "#5db8a6" },
  { icon: "🔄", title: "Real-time Collab", desc: "Multiplayer IDE with conflict-free sync. See everyone's cursors and edits live via CRDT technology.", color: "#5db872" },
  { icon: "🔑", title: "Multi-Key Rotation", desc: "Add unlimited API keys per provider. Round-robin load balancing prevents rate limits and downtime.", color: "#e8a55a" },
  { icon: "💾", title: "Persistent Memory", desc: "Your AI agents remember past decisions, preferences, and learnings across sessions. They get smarter over time.", color: "#cc785c" },
  { icon: "🚀", title: "Live Preview", desc: "One-click dev server with WebContainer. See changes instantly, no setup needed. Export to production in seconds.", color: "#5db8a6" },
];

const STEPS = [
  { title: "Describe", desc: "Tell the orchestrator what you want to build — in plain English, a sketch, or both." },
  { title: "Build", desc: "Watch agents plan, design, code, and review — each contributing their expertise." },
  { title: "Ship", desc: "Preview live, export code, or deploy directly. From idea to production in minutes." },
];
