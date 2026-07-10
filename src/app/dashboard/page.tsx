"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/hooks/useAuth"
import { ApiKeyManager } from "@/components/ApiKeyManager"

export default function DashboardPage() {
  const router = useRouter()
  const [showUserMenu, setShowUserMenu] = useState(false)
  const { user, loading, signOut } = useAuth()

  const handleCreateRoom = () => {
    const newRoomId = crypto.randomUUID().slice(0, 8)
    router.push(`/room/${newRoomId}`)
  }

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--canvas)" }}>
        <div className="loading-dots" style={{ color: "var(--muted)" }}>Loading<span>.</span><span>.</span><span>.</span></div>
      </div>
    )
  }

  if (!user) {
    router.push("/auth/login")
    return null
  }

  return (
    <div className="dashboard-page" style={{ background: "var(--canvas)", minHeight: "100vh" }}>
      {/* Top Navigation — Claude cream nav */}
      <header style={{
        position: "relative",
        zIndex: 2,
        background: "rgba(250, 249, 245, 0.92)",
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
        borderBottom: "1px solid var(--hairline)",
        padding: "0 var(--sp-xl)",
        height: 64,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "var(--sp-sm)" }}>
          <div style={{
            width: 28, height: 28, borderRadius: "var(--r-md)",
            background: "var(--primary-violet)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 14, color: "#fff",
          }}>⚡</div>
          <span style={{
            fontFamily: "var(--font-sans)",
            fontSize: "1.1rem",
            fontWeight: 400,
            letterSpacing: "-0.02em",
            color: "var(--ink)"
          }}>Ultimate Vibe Coder</span>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "var(--sp-xl)" }}>
          <nav style={{ display: "flex", gap: "var(--sp-lg)" }}>
            <a href="/dashboard" style={{
              fontFamily: "var(--font-sans)",
              fontSize: "13px",
              fontWeight: 500,
              color: "var(--ink)",
              textDecoration: "none"
            }}>Dashboard</a>
            <a href="/templates" style={{
              fontFamily: "var(--font-sans)",
              fontSize: "13px",
              fontWeight: 500,
              color: "var(--muted)",
              textDecoration: "none"
            }}>Templates</a>
          </nav>

          <div style={{ position: "relative" }}>
            <button
              style={{
                background: "transparent",
                border: "none",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: "var(--sp-sm)",
                padding: "4px 8px",
                borderRadius: "var(--r-md)",
                transition: "background 0.15s",
              }}
              onClick={() => setShowUserMenu(!showUserMenu)}
            >
              <img
                src={user.user_metadata?.avatar_url || `https://api.dicebear.com/9.x/bottts-neutral/svg?seed=${user.id}`}
                alt={user.user_metadata?.name || "User"}
                style={{
                  border: "1px solid var(--hairline)",
                  borderRadius: "var(--r-pill)",
                  width: 32,
                  height: 32
                }}
              />
              <span style={{
                fontFamily: "var(--font-sans)",
                fontSize: "13px",
                fontWeight: 500,
                color: "var(--ink)"
              }}>{user.user_metadata?.name || user.email?.split("@")[0] || "User"}</span>
            </button>

            {showUserMenu && (
              <div className="user-menu-dropdown">
                <div style={{ fontSize: "12px", color: "var(--muted)", padding: "var(--sp-xs) var(--sp-sm)" }}>{user.email}</div>
                <div style={{ borderBottom: "1px solid var(--hairline)", margin: "var(--sp-xs) 0" }}></div>
                <button className="user-menu-item" onClick={() => signOut()}>
                  Sign Out
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main style={{ padding: "6rem var(--sp-xl)", maxWidth: 1100, margin: "0 auto" }}>
        {/* Welcome Section — Serif headline */}
        <div style={{ marginBottom: "6rem" }}>
          <h1 style={{
            fontFamily: "var(--font-sans)",
            fontSize: "clamp(2.5rem, 5vw, 3.5rem)",
            fontWeight: 400,
            letterSpacing: "-0.02em",
            color: "var(--ink)",
            margin: "0 0 var(--sp-md)"
          }}>
            Welcome back, {user.user_metadata?.name || user.email?.split("@")[0] || "Developer"}
          </h1>
          <p style={{
            fontSize: "15px",
            color: "var(--muted)",
            maxWidth: 600,
            lineHeight: 1.6,
          }}>
            Create a new room or manage your API keys to start building.
          </p>
        </div>

        {/* Action Cards — Cream feature cards */}
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
          gap: "var(--sp-xl)",
          marginBottom: "6rem"
        }}>
          <div
            className="claude-card"
            style={{
              cursor: "pointer",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              padding: "var(--sp-xl)",
              borderRadius: "var(--r-lg)",
            }}
            onClick={handleCreateRoom}
          >
            <div style={{
              width: 56, height: 56, borderRadius: "var(--r-lg)",
              background: "rgba(204, 120, 92, 0.1)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 28, marginBottom: "var(--sp-lg)", color: "var(--primary-violet)"
            }}>+</div>
            <h3 style={{
              fontFamily: "var(--font-sans)",
              fontSize: "15px",
              fontWeight: 500,
              color: "var(--ink)",
              marginBottom: "var(--sp-xs)",
              letterSpacing: 0,
            }}>Create New Room</h3>
            <p style={{ fontSize: "13px", color: "var(--muted)", textAlign: "center", lineHeight: 1.5 }}>
              Start a fresh project with AI assistance
            </p>
          </div>

          <div
            className="claude-card"
            style={{
              cursor: "pointer",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              padding: "var(--sp-xl)",
              borderRadius: "var(--r-lg)",
            }}
            onClick={() => {
              const id = prompt("Enter room ID to join:");
              if (id) router.push(`/room/${id}`);
            }}
          >
            <div style={{
              width: 56, height: 56, borderRadius: "var(--r-lg)",
              background: "rgba(93, 184, 166, 0.1)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 28, marginBottom: "var(--sp-lg)", color: "var(--primary-violet)"
            }}>🔗</div>
            <h3 style={{
              fontFamily: "var(--font-sans)",
              fontSize: "15px",
              fontWeight: 500,
              color: "var(--ink)",
              marginBottom: "var(--sp-xs)",
              letterSpacing: 0,
            }}>Join Room</h3>
            <p style={{ fontSize: "13px", color: "var(--muted)", textAlign: "center", lineHeight: 1.5 }}>
              Enter a room ID to collaborate
            </p>
          </div>
        </div>

        {/* API Keys Section — Cream surface card */}
        <section style={{
          background: "var(--chip-active-bg)",
          borderRadius: "var(--r-xl)",
          padding: "6rem var(--sp-xl)",
          marginBottom: "6rem"
        }}>
          <div style={{ maxWidth: 720, margin: "0 auto" }}>
            <h2 style={{
              fontFamily: "var(--font-sans)",
              fontSize: "clamp(1.75rem, 3vw, 2.25rem)",
              fontWeight: 400,
              letterSpacing: "-0.01em",
              color: "var(--ink)",
              marginBottom: "var(--sp-md)"
            }}>
              API Keys
            </h2>
            <p style={{
              fontSize: "15px",
              color: "var(--muted)",
              marginBottom: "var(--sp-xl)",
              lineHeight: 1.6,
            }}>
              Manage your API keys for different AI providers. Add multiple keys per provider for automatic load balancing.
            </p>
            <ApiKeyManager />
          </div>
        </section>

        {/* Dark CTA Band — Claude dark surface */}
        <div style={{
          background: "var(--ink)",
          borderRadius: "var(--r-xl)",
          padding: "6rem",
          textAlign: "center"
        }}>
          <h2 style={{
            fontFamily: "var(--font-sans)",
            fontSize: "clamp(1.75rem, 3vw, 2.25rem)",
            fontWeight: 400,
            letterSpacing: "-0.01em",
            color: "white",
            marginBottom: "var(--sp-md)"
          }}>
            Ready to start building?
          </h2>
          <p style={{
            fontSize: "15px",
            color: "var(--muted-soft)",
            marginBottom: "var(--sp-xl)",
            maxWidth: 500,
            marginLeft: "auto",
            marginRight: "auto",
            lineHeight: 1.6,
          }}>
            Create a new room and let AI help you code faster than ever.
          </p>
          <button
            className="btn"
            onClick={handleCreateRoom}
            style={{
              background: "var(--canvas)",
              color: "var(--primary-violet)",
              padding: "var(--sp-md) var(--sp-xl)",
              fontSize: "15px",
              fontWeight: 500,
              border: "none",
              cursor: "pointer",
              borderRadius: "var(--r-md)",
            }}
          >
            Create Your First Room →
          </button>
        </div>
      </main>

      {/* Footer — Dark navy */}
      <footer style={{
        background: "var(--ink)",
        padding: "6rem var(--sp-xl)",
      }}>
        <div style={{ maxWidth: 1100, margin: "0 auto", display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "var(--sp-xl)" }}>
          <div>
            <h4 style={{
              fontFamily: "var(--font-sans)",
              fontSize: "13px",
              fontWeight: 500,
              color: "white",
              marginBottom: "var(--sp-md)"
            }}>Product</h4>
            <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: "var(--sp-sm)" }}>
              <li><a href="#" style={{ fontSize: "13px", color: "var(--muted-soft)", textDecoration: "none" }}>Features</a></li>
              <li><a href="#" style={{ fontSize: "13px", color: "var(--muted-soft)", textDecoration: "none" }}>Pricing</a></li>
              <li><a href="#" style={{ fontSize: "13px", color: "var(--muted-soft)", textDecoration: "none" }}>Templates</a></li>
            </ul>
          </div>
          <div>
            <h4 style={{
              fontFamily: "var(--font-sans)",
              fontSize: "13px",
              fontWeight: 500,
              color: "white",
              marginBottom: "var(--sp-md)"
            }}>Resources</h4>
            <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: "var(--sp-sm)" }}>
              <li><a href="#" style={{ fontSize: "13px", color: "var(--muted-soft)", textDecoration: "none" }}>Documentation</a></li>
              <li><a href="#" style={{ fontSize: "13px", color: "var(--muted-soft)", textDecoration: "none" }}>API Reference</a></li>
            </ul>
          </div>
          <div>
            <h4 style={{
              fontFamily: "var(--font-sans)",
              fontSize: "13px",
              fontWeight: 500,
              color: "white",
              marginBottom: "var(--sp-md)"
            }}>Company</h4>
            <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: "var(--sp-sm)" }}>
              <li><a href="#" style={{ fontSize: "13px", color: "var(--muted-soft)", textDecoration: "none" }}>About</a></li>
              <li><a href="#" style={{ fontSize: "13px", color: "var(--muted-soft)", textDecoration: "none" }}>Blog</a></li>
            </ul>
          </div>
          <div>
            <h4 style={{
              fontFamily: "var(--font-sans)",
              fontSize: "13px",
              fontWeight: 500,
              color: "white",
              marginBottom: "var(--sp-md)"
            }}>Legal</h4>
            <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: "var(--sp-sm)" }}>
              <li><a href="#" style={{ fontSize: "13px", color: "var(--muted-soft)", textDecoration: "none" }}>Privacy</a></li>
              <li><a href="#" style={{ fontSize: "13px", color: "var(--muted-soft)", textDecoration: "none" }}>Terms</a></li>
            </ul>
          </div>
        </div>
        <div style={{
          borderTop: "1px solid #1a1a1a",
          marginTop: "6rem",
          paddingTop: "var(--sp-xl)",
          textAlign: "center",
          fontSize: "13px",
          color: "var(--muted-soft)"
        }}>
          © {new Date().getFullYear()} Ultimate Vibe Coder. All rights reserved.
        </div>
      </footer>
    </div>
  )
}
