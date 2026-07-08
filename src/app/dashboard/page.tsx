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
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--bg-primary)" }}>
        <div className="loading-dots" style={{ color: "var(--text-muted)" }}>Loading<span>.</span><span>.</span><span>.</span></div>
      </div>
    )
  }

  if (!user) {
    router.push("/auth/login")
    return null
  }

  return (
    <div className="dashboard-page" style={{ background: "var(--bg-primary)", minHeight: "100vh" }}>
      {/* Top Navigation */}
      <header style={{ 
        position: "relative", 
        zIndex: 2, 
        background: "var(--bg-primary)", 
        borderBottom: "1px solid var(--border-primary)", 
        padding: "var(--space-md) var(--space-xl)",
        display: "flex", 
        alignItems: "center", 
        justifyContent: "space-between" 
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "var(--space-md)" }}>
          <span style={{ fontSize: "var(--font-size-2xl)" }}>⚡</span>
          <span style={{ 
            fontFamily: "var(--font-serif)",
            fontSize: "var(--font-size-xl)", 
            fontWeight: 400,
            letterSpacing: "-0.01em",
            color: "var(--text-primary)" 
          }}>Ultimate Vibe Coder</span>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "var(--space-lg)" }}>
          <nav style={{ display: "flex", gap: "var(--space-md)" }}>
            <a href="/dashboard" style={{ 
              fontFamily: "var(--font-sans)",
              fontSize: "var(--font-size-sm)", 
              fontWeight: 500,
              color: "var(--text-primary)",
              textDecoration: "none"
            }}>Dashboard</a>
            <a href="/templates" style={{ 
              fontFamily: "var(--font-sans)",
              fontSize: "var(--font-size-sm)", 
              fontWeight: 500,
              color: "var(--text-muted)",
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
                gap: "var(--space-sm)" 
              }}
              onClick={() => setShowUserMenu(!showUserMenu)}
            >
              <img
                src={user.user_metadata?.avatar_url || `https://api.dicebear.com/9.x/bottts-neutral/svg?seed=${user.id}`}
                alt={user.user_metadata?.name || "User"}
                style={{ 
                  border: "1px solid var(--border-primary)", 
                  borderRadius: "var(--radius-full)", 
                  width: 32, 
                  height: 32 
                }}
              />
              <span style={{ 
                fontFamily: "var(--font-sans)",
                fontSize: "var(--font-size-sm)", 
                fontWeight: 500,
                color: "var(--text-primary)" 
              }}>{user.user_metadata?.name || user.email?.split("@")[0] || "User"}</span>
            </button>

            {showUserMenu && (
              <div style={{ 
                background: "var(--bg-elevated)", 
                padding: "var(--space-md)", 
                border: "1px solid var(--border-primary)", 
                borderRadius: "var(--radius-lg)", 
                position: "absolute", 
                top: "100%", 
                right: 0, 
                marginTop: "var(--space-sm)", 
                minWidth: 200,
                boxShadow: "var(--shadow-md)"
              }}>
                <div style={{ fontSize: "var(--font-size-xs)", color: "var(--text-muted)", padding: "var(--space-xs)" }}>{user.email}</div>
                <div style={{ borderBottom: "1px solid var(--border-primary)", margin: "var(--space-sm) 0" }}></div>
                <button
                  style={{ 
                    background: "transparent", 
                    border: "none", 
                    padding: "var(--space-sm)", 
                    cursor: "pointer", 
                    width: "100%", 
                    textAlign: "left",
                    fontFamily: "var(--font-sans)",
                    fontSize: "var(--font-size-sm)",
                    color: "var(--text-primary)"
                  }}
                  onClick={() => signOut()}
                >
                  🔤 Sign Out
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main style={{ padding: "var(--spacing-section) var(--space-xl)", maxWidth: 1200, margin: "0 auto" }}>
        {/* Welcome Section */}
        <div style={{ marginBottom: "var(--spacing-section)" }}>
          <h1 style={{ 
            fontFamily: "var(--font-serif)",
            fontSize: "clamp(2.5rem, 5vw, 4rem)", 
            fontWeight: 400,
            letterSpacing: "-0.02em",
            color: "var(--text-primary)", 
            margin: "0 0 var(--space-md)" 
          }}>
            Welcome back, {user.user_metadata?.name || user.email?.split("@")[0] || "Developer"}
          </h1>
          <p style={{ 
            fontSize: "var(--font-size-lg)", 
            color: "var(--text-muted)",
            maxWidth: 600
          }}>
            Create a new room or join an existing one to start collaborating.
          </p>
        </div>

        {/* Action Cards */}
        <div style={{ 
          display: "grid", 
          gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", 
          gap: "var(--space-xl)",
          marginBottom: "var(--spacing-section)"
        }}>
          <div
            className="card"
            style={{ 
              cursor: "pointer", 
              transition: "transform var(--transition-fast), box-shadow var(--transition-fast)",
              display: "flex", 
              flexDirection: "column", 
              alignItems: "center", 
              justifyContent: "center",
              padding: "var(--space-2xl)"
            }}
            onClick={handleCreateRoom}
          >
            <div style={{ fontSize: "3rem", marginBottom: "var(--space-lg)", color: "var(--primary)" }}>+</div>
            <h3 style={{ 
              fontFamily: "var(--font-serif)",
              fontSize: "var(--font-size-lg)", 
              fontWeight: 400,
              color: "var(--text-primary)",
              marginBottom: "var(--space-xs)"
            }}>Create New Room</h3>
            <p style={{ fontSize: "var(--font-size-sm)", color: "var(--text-muted)", textAlign: "center" }}>
              Start a fresh project with AI assistance
            </p>
          </div>

          <div
            className="card"
            style={{ 
              cursor: "pointer", 
              transition: "transform var(--transition-fast), box-shadow var(--transition-fast)",
              display: "flex", 
              flexDirection: "column", 
              alignItems: "center", 
              justifyContent: "center",
              padding: "var(--space-2xl)"
            }}
          >
            <div style={{ fontSize: "3rem", marginBottom: "var(--space-lg)", color: "var(--text-muted)" }}>⍚</div>
            <h3 style={{ 
              fontFamily: "var(--font-serif)",
              fontSize: "var(--font-size-lg)", 
              fontWeight: 400,
              color: "var(--text-primary)",
              marginBottom: "var(--space-xs)"
            }}>Join Room</h3>
            <p style={{ fontSize: "var(--font-size-sm)", color: "var(--text-muted)", textAlign: "center" }}>
              Enter a room ID to collaborate
            </p>
          </div>
        </div>

        {/* API Keys Section */}
        <section style={{ 
          background: "var(--bg-secondary)",
          borderRadius: "var(--radius-xl)",
          padding: "var(--spacing-section) var(--space-xl)",
          marginBottom: "var(--spacing-section)"
        }}>
          <div style={{ maxWidth: 720, margin: "0 auto" }}>
            <h2 style={{ 
              fontFamily: "var(--font-serif)",
              fontSize: "var(--font-size-2xl)", 
              fontWeight: 400,
              letterSpacing: "-0.01em",
              color: "var(--text-primary)",
              marginBottom: "var(--space-lg)"
            }}>
              🔑 API Keys
            </h2>
            <p style={{ 
              fontSize: "var(--font-size-base)", 
              color: "var(--text-muted)",
              marginBottom: "var(--space-xl)"
            }}>
              Manage your API keys for different AI providers. Add multiple keys per provider for automatic load balancing.
            </p>
            <ApiKeyManager />
          </div>
        </section>

        {/* Dark CTA Band */}
        <div style={{ 
          background: "var(--surface-dark)",
          borderRadius: "var(--radius-xl)",
          padding: "var(--spacing-section)",
          textAlign: "center"
        }}>
          <h2 style={{ 
            fontFamily: "var(--font-serif)",
            fontSize: "var(--font-size-2xl)", 
            fontWeight: 400,
            color: "var(--text-on-dark)",
            marginBottom: "var(--space-md)"
          }}>
            Ready to start building?
          </h2>
          <p style={{ 
            fontSize: "var(--font-size-base)", 
            color: "var(--text-on-dark-soft)",
            marginBottom: "var(--space-xl)",
            maxWidth: 500,
            marginLeft: "auto",
            marginRight: "auto"
          }}>
            Create a new room and let AI help you code faster than ever.
          </p>
          <button
            className="btn"
            onClick={handleCreateRoom}
            style={{ 
              background: "var(--bg-primary)",
              color: "var(--text-primary)",
              padding: "var(--space-md) var(--space-xl)",
              fontSize: "var(--font-size-base)",
              fontWeight: 500,
              border: "none",
              cursor: "pointer"
            }}
          >
            Create Your First Room →
          </button>
        </div>
      </main>

      {/* Footer */}
      <footer style={{ 
        background: "var(--surface-dark)",
        padding: "var(--spacing-section) var(--space-xl)",
        marginTop: "var(--spacing-section)"
      }}>
        <div style={{ maxWidth: 1200, margin: "0 auto", display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "var(--space-2xl)" }}>
          <div>
            <h4 style={{ 
              fontFamily: "var(--font-sans)",
              fontSize: "var(--font-size-sm)", 
              fontWeight: 500,
              color: "var(--text-on-dark)",
              marginBottom: "var(--space-md)"
            }}>Product</h4>
            <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: "var(--space-sm)" }}>
              <li><a href="#" style={{ fontSize: "var(--font-size-sm)", color: "var(--text-on-dark-soft)", textDecoration: "none" }}>Features</a></li>
              <li><a href="#" style={{ fontSize: "var(--font-size-sm)", color: "var(--text-on-dark-soft)", textDecoration: "none" }}>Pricing</a></li>
              <li><a href="#" style={{ fontSize: "var(--font-size-sm)", color: "var(--text-on-dark-soft)", textDecoration: "none" }}>Templates</a></li>
            </ul>
          </div>
          <div>
            <h4 style={{ 
              fontFamily: "var(--font-sans)",
              fontSize: "var(--font-size-sm)", 
              fontWeight: 500,
              color: "var(--text-on-dark)",
              marginBottom: "var(--space-md)"
            }}>Resources</h4>
            <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: "var(--space-sm)" }}>
              <li><a href="#" style={{ fontSize: "var(--font-size-sm)", color: "var(--text-on-dark-soft)", textDecoration: "none" }}>Documentation</a></li>
              <li><a href="#" style={{ fontSize: "var(--font-size-sm)", color: "var(--text-on-dark-soft)", textDecoration: "none" }}>API Reference</a></li>
              <li><a href="#" style={{ fontSize: "var(--font-size-sm)", color: "var(--text-on-dark-soft)", textDecoration: "none" }}>Community</a></li>
            </ul>
          </div>
          <div>
            <h4 style={{ 
              fontFamily: "var(--font-sans)",
              fontSize: "var(--font-size-sm)", 
              fontWeight: 500,
              color: "var(--text-on-dark)",
              marginBottom: "var(--space-md)"
            }}>Company</h4>
            <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: "var(--space-sm)" }}>
              <li><a href="#" style={{ fontSize: "var(--font-size-sm)", color: "var(--text-on-dark-soft)", textDecoration: "none" }}>About</a></li>
              <li><a href="#" style={{ fontSize: "var(--font-size-sm)", color: "var(--text-on-dark-soft)", textDecoration: "none" }}>Blog</a></li>
              <li><a href="#" style={{ fontSize: "var(--font-size-sm)", color: "var(--text-on-dark-soft)", textDecoration: "none" }}>Careers</a></li>
            </ul>
          </div>
          <div>
            <h4 style={{ 
              fontFamily: "var(--font-sans)",
              fontSize: "var(--font-size-sm)", 
              fontWeight: 500,
              color: "var(--text-on-dark)",
              marginBottom: "var(--space-md)"
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
          color: "var(--text-on-dark-soft)"
        }}>
          © {new Date().getFullYear()} Ultimate Vibe Coder. All rights reserved.
        </div>
      </footer>
    </div>
  )
}
