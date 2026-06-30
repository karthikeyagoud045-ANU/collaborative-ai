"use client";

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
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--glass-bg)", backdropFilter: "blur(10px)" }}>
        <div className="loading-dots" style={{ color: "var(--text-tertiary)" }}>Loading<span>.</span><span>.</span><span>.</span></div>
      </div>
    )
  }

  if (!user) {
    router.push("/auth/login")
    return null
  }

  return (
    <div className="dashboard-page" style={{ background: "linear-gradient(to bottom right, var(--glass-bg), transparent)", backdropFilter: "blur(10px)" }}>
      <header className="glass-navbar" style={{ position: "relative", zIndex: 2, backdropFilter: "blur(8px)", background: "var(--glass-bg)", borderBottom: "1px solid var(--glass-border)", padding: "var(--space-md)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div className="topbar-logo" style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
          <div className="topbar-logo-icon" style={{ fontSize: "var(--font-size-xl)" }}>⚡</div>
          <span style={{ fontSize: "var(--font-size-xl)", color: "var(--text-primary)" }}>Ultimate Vibe Coder</span>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
          <div className="user-menu-glass" style={{ background: "var(--glass-bg)", backdropFilter: "blur(5px)", padding: "var(--space-lg)", border: "2px solid var(--glass-border)", borderRadius: "var(--radius-lg)", position: "relative" }}>
            <button
              className="user-menu-trigger"
              style={{ background: "transparent", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: "0.5rem" }}
              onClick={() => setShowUserMenu(!showUserMenu)}
            >
              <img
                src={user.user_metadata?.avatar_url || `https://api.dicebear.com/9.x/bottts-neutral/svg?seed=${user.id}`}
                alt={user.user_metadata?.name || "User"}
                className="user-menu-avatar"
                style={{ border: "2px solid var(--glass-border)", borderRadius: "var(--radius-lg)", backdropFilter: "blur(3px)", width: 32, height: 32 }}
              />
              <span style={{ fontSize: "var(--font-size-xl)", color: "var(--text-primary)" }}>{user.user_metadata?.name || user.email?.split("@")[0] || "User"}</span>
            </button>

            {showUserMenu && (
              <div className="user-menu-dropdown-glass" style={{ background: "var(--glass-bg)", backdropFilter: "blur(5px)", padding: "var(--space-md)", border: "1px solid var(--glass-border)", borderRadius: "var(--radius-lg)", position: "absolute", top: "100%", right: 0, marginTop: "var(--space-sm)", minWidth: 200 }}>
                <div style={{ fontSize: "0.875rem", color: "var(--text-tertiary)", padding: "var(--space-sm)" }}>{user.email}</div>
                <div className="user-menu-divider" style={{ borderBottom: "1px solid var(--glass-border)", margin: "var(--space-sm) 0" }}></div>
                <button
                  className="user-menu-item"
                  style={{ background: "transparent", border: "none", padding: "var(--space-sm)", cursor: "pointer", width: "100%", textAlign: "left" }}
                  onClick={() => signOut()}
                >
                  🔤 Sign Out
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      <div className="dashboard-content" style={{ position: "relative", zIndex: 1, padding: "var(--space-xl)", display: "flex", flexDirection: "column", gap: "var(--space-xl)" }}>
        <div className="glass-welcome" style={{ background: "var(--glass-bg)", backdropFilter: "blur(8px)", border: "1px solid var(--glass-border)", borderRadius: "var(--radius-lg)", padding: "var(--space-xl)" }}>
          <h1 style={{ fontSize: "var(--font-size-xl)", color: "var(--text-primary)", margin: 0 }}>Welcome back, {user.user_metadata?.name || user.email?.split("@")[0] || "Developer"}</h1>
          <p style={{ color: "var(--text-secondary)", fontSize: "1rem", margin: "1rem 0 0" }}>Create a new room or join an existing one to start collaborating.</p>
        </div>

        <div className="glass-actions" style={{ display: "flex", gap: "var(--space-lg)" }}>
          <div
            className="glass-card-create"
            style={{ flex: 1, background: "var(--glass-bg)", backdropFilter: "blur(8px)", border: "1px solid var(--glass-border)", borderRadius: "var(--radius-lg)", padding: "var(--space-xl)", cursor: "pointer", transition: "transform 0.2s", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}
            onClick={handleCreateRoom}
          >
            <div style={{ fontSize: "2rem", marginBottom: "0.75rem", opacity: 0.3, color: "var(--text-tertiary)" }}>+</div>
            <div style={{ fontSize: "1rem", color: "var(--text-primary)" }}>Create New Room</div>
          </div>

          <div
            className="glass-card-join"
            style={{ flex: 1, background: "var(--glass-bg)", backdropFilter: "blur(8px)", border: "1px solid var(--glass-border)", borderRadius: "var(--radius-lg)", padding: "var(--space-xl)", cursor: "pointer", transition: "transform 0.2s", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}
          >
            <div style={{ fontSize: "2rem", marginBottom: "0.75rem", opacity: 0.3, color: "var(--text-tertiary)" }}>⍚</div>
            <div style={{ fontSize: "1rem", color: "var(--text-primary)" }}>Join Room</div>
          </div>
        </div>

        <div className="glass-recent-rooms" style={{ display: "flex", flexDirection: "column", gap: "var(--space-md)" }}>
          <h2 style={{ fontSize: "var(--font-size-xl)", color: "var(--text-primary)", margin: 0 }}>Recent Rooms</h2>
          <div style={{ display: "flex", gap: "var(--space-md)" }}>
            <div className="glass-card-room" style={{ background: "var(--glass-bg)", backdropFilter: "blur(8px)", border: "1px solid var(--glass-border)", borderRadius: "var(--radius-lg)", padding: "var(--space-lg)", cursor: "pointer", transition: "transform 0.2s" }}>
              <div style={{ fontSize: "1.2rem", color: "var(--text-primary)" }}>Room 1234</div>
              <div style={{ color: "var(--text-tertiary)", fontSize: "0.875rem", marginTop: "0.5rem" }}>Created 5 mins ago</div>
            </div>
            <div className="glass-card-room" style={{ background: "var(--glass-bg)", backdropFilter: "blur(8px)", border: "1px solid var(--glass-border)", borderRadius: "var(--radius-lg)", padding: "var(--space-lg)", cursor: "pointer", transition: "transform 0.2s" }}>
              <div style={{ fontSize: "1.2rem", color: "var(--text-primary)" }}>Room ABCD</div>
              <div style={{ color: "var(--text-tertiary)", fontSize: "0.875rem", marginTop: "0.5rem" }}>Created 10 mins ago</div>
            </div>
          </div>
        </div>

        <div className="glass-api-keys" style={{ background: "var(--glass-bg)", backdropFilter: "blur(8px)", border: "1px solid var(--glass-border)", borderRadius: "var(--radius-lg)", padding: "var(--space-xl)" }}>
          <ApiKeyManager />
        </div>
      </div>
    </div>
  )
}