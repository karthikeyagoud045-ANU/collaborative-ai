"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { v4 as uuidv4 } from "uuid";

/** Helper to use CSS custom properties in inline styles without TS parsing issues */
const v = (name: string) => `var(--${name})`;

export default function LandingPage() {
  const router = useRouter();
  const [roomId, setRoomId] = useState("");
  const [isJoining, setIsJoining] = useState(false);

  const handleCreateRoom = () => {
    const newRoomId = uuidv4().slice(0, 8);
    router.push(`/room/${newRoomId}`);
  };

  const handleJoinRoom = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = roomId.trim();
    if (!trimmed) return;
    setIsJoining(true);
    router.push(`/room/${trimmed}`);
  };

  return (
    <div style={{ minHeight: "100dvh", display: "flex", flexDirection: "column" }}>
      <div className="landing-bg" />

      <header style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: `${v("space-md")} ${v("space-xl")}`,
        borderBottom: `1px solid ${v("border-primary")}`,
        background: v("bg-primary"),
        position: "relative",
        zIndex: 1,
      }}>
        <div className="topbar-logo">
          <div className="topbar-logo-icon">⚡</div>
          <span>Ultimate Vibe Coder</span>
        </div>
        <nav style={{ display: "flex", alignItems: "center", gap: v("space-lg") }}>
          <a href="#features" style={{ fontSize: v("font-size-base"), color: v("text-secondary") }}>Features</a>
          <a href="https://github.com" target="_blank" rel="noopener noreferrer" style={{ fontSize: v("font-size-base"), color: v("text-secondary") }}>GitHub</a>
          <button className="btn btn-primary btn-sm" onClick={handleCreateRoom}>
            New Room
          </button>
        </nav>
      </header>

      <main style={{
        flex: 1,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: `${v("space-3xl")} ${v("space-xl")}`,
        textAlign: "center",
        position: "relative",
        zIndex: 1,
        maxWidth: 720,
        margin: "0 auto",
      }}>
        <div style={{
          display: "inline-flex",
          alignItems: "center",
          gap: v("space-sm"),
          padding: `${v("space-xs")} ${v("space-md")}`,
          background: v("bg-tertiary"),
          border: `1px solid ${v("border-primary")}`,
          borderRadius: v("radius-full"),
          fontSize: v("font-size-xs"),
          color: v("text-secondary"),
          marginBottom: v("space-xl"),
        }}>
          <span style={{ width: 6, height: 6, borderRadius: "50%", background: v("accent-green") }} />
          Multiplayer AI-powered IDE
        </div>

        <h1 style={{
          fontSize: "clamp(2.5rem, 5vw, 3.5rem)",
          fontWeight: 700,
          lineHeight: 1.1,
          letterSpacing: "-0.03em",
          color: v("text-primary"),
          marginBottom: v("space-lg"),
        }}>
          Code together,<br />
          <span style={{ color: v("accent") }}>ship faster.</span>
        </h1>

        <p style={{
          fontSize: v("font-size-xl"),
          color: v("text-secondary"),
          lineHeight: 1.6,
          maxWidth: 480,
          marginBottom: v("space-2xl"),
        }}>
          A real-time collaborative IDE with AI agents that write, review, and fix code alongside you.
        </p>

        <div style={{
          display: "flex",
          flexDirection: "column",
          gap: v("space-md"),
          width: "100%",
          maxWidth: 400,
        }}>
          <button
            className="btn btn-primary btn-lg"
            onClick={handleCreateRoom}
            style={{ width: "100%", padding: `${v("space-md")} ${v("space-xl")}` }}
          >
            Create New Room
          </button>

          <div style={{ display: "flex", alignItems: "center", gap: v("space-md") }}>
            <div style={{ flex: 1, height: 1, background: v("border-primary") }} />
            <span style={{ fontSize: v("font-size-xs"), color: v("text-tertiary"), whiteSpace: "nowrap" }}>or join existing</span>
            <div style={{ flex: 1, height: 1, background: v("border-primary") }} />
          </div>

          <form onSubmit={handleJoinRoom} style={{ display: "flex", gap: v("space-sm") }}>
            <input
              type="text"
              placeholder="Enter room ID..."
              value={roomId}
              onChange={(e) => setRoomId(e.target.value)}
              style={{ flex: 1 }}
            />
            <button
              type="submit"
              className="btn btn-secondary"
              disabled={!roomId.trim() || isJoining}
            >
              {isJoining ? "Joining..." : "Join"}
            </button>
          </form>
        </div>
      </main>

      <section id="features" style={{
        padding: `${v("space-3xl")} ${v("space-xl")}`,
        borderTop: `1px solid ${v("border-primary")}`,
        background: v("bg-secondary"),
        position: "relative",
        zIndex: 1,
      }}>
        <div style={{ maxWidth: 960, margin: "0 auto" }}>
          <h2 style={{
            fontSize: v("font-size-2xl"),
            fontWeight: 700,
            textAlign: "center",
            marginBottom: v("space-2xl"),
            letterSpacing: "-0.02em",
          }}>
            Everything you need to vibe code
          </h2>
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
            gap: v("space-xl"),
          }}>
            {[
              { icon: "🤝", title: "Real-time Collaboration", desc: "Multiple cursors, instant sync via Yjs CRDT. See who's editing what, live." },
              { icon: "🤖", title: "AI Code Assistant", desc: "Chat with AI to generate, refactor, or debug code. Supports OpenAI, Anthropic, Google." },
              { icon: "🧠", title: "Autonomous Agent Mode", desc: "Let the AI agent write files, run tests, and fix bugs — with your approval." },
              { icon: "📦", title: "In-Browser Execution", desc: "Full WebContainer runtime. npm install, dev servers, all in your browser." },
              { icon: "🔒", title: "HITL Safety Gates", desc: "Every agent action requires your approval. You're always in control." },
              { icon: "🌐", title: "Multi-Language Support", desc: "JS/TS in WebContainer, plus Python, Go, Rust, Java via Judge0." },
            ].map((feature) => (
              <div key={feature.title} className="card" style={{ padding: v("space-xl") }}>
                <div style={{ fontSize: "1.5rem", marginBottom: v("space-md") }}>{feature.icon}</div>
                <h3 style={{ fontSize: v("font-size-base"), fontWeight: 600, marginBottom: v("space-sm") }}>{feature.title}</h3>
                <p style={{ fontSize: v("font-size-sm"), color: v("text-secondary"), lineHeight: 1.6 }}>{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <footer style={{
        padding: v("space-xl"),
        borderTop: `1px solid ${v("border-primary")}`,
        textAlign: "center",
        fontSize: v("font-size-sm"),
        color: v("text-tertiary"),
        position: "relative",
        zIndex: 1,
      }}>
        Built with ❤️ by Karthikeya · Ultimate Vibe Coder
      </footer>
    </div>
  );
}
