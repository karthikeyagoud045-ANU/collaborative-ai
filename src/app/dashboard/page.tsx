"use client";

export const dynamic = "force-dynamic";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { v4 as uuidv4 } from "uuid";

const DEV_USER = {
  id: "dev-user-001",
  username: "Developer",
  avatarUrl: "https://api.dicebear.com/9.x/bottts-neutral/svg?seed=dev-user",
  email: "dev@vibeide.local",
};

export default function DashboardPage() {
  const router = useRouter();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const user = DEV_USER;

  const handleCreateRoom = () => {
    const newRoomId = uuidv4().slice(0, 8);
    router.push(`/room/${newRoomId}`);
  };

  return (
    <div className="dashboard-page">
      <div className="landing-bg" />

      <header className="dashboard-header" style={{ position: "relative", zIndex: 2 }}>
        <div className="topbar-logo">
          <div className="topbar-logo-icon">⚡</div>
          <span>Ultimate Vibe Coder</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
          <div className="user-menu">
            <button
              className="user-menu-trigger"
              onClick={() => setShowUserMenu(!showUserMenu)}
            >
              <img src={user.avatarUrl} alt={user.username} className="user-menu-avatar" />
              <span className="user-menu-name">{user.username}</span>
            </button>
            {showUserMenu && (
              <div className="user-menu-dropdown">
                <div style={{ padding: "0.5rem 0.75rem", fontSize: "0.75rem", color: "var(--text-tertiary)" }}>
                  {user.email}
                </div>
                <div className="user-menu-divider" />
                <button className="user-menu-item" onClick={() => router.push("/")}>
                  🚪 Sign Out
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      <div className="dashboard-content" style={{ position: "relative", zIndex: 1 }}>
        <h1 className="dashboard-title">Welcome back, {user.username}</h1>
        <p className="dashboard-subtitle">Create a new room or join an existing one to start collaborating.</p>

        <div className="dashboard-actions">
          <button className="btn btn-primary" onClick={handleCreateRoom}>
            Create New Room
          </button>
        </div>

        <div className="room-grid">
          <div
            className="card"
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              padding: "3rem",
              cursor: "pointer",
              border: "1px dashed var(--border-secondary)",
            }}
            onClick={handleCreateRoom}
          >
            <div style={{ fontSize: "1.5rem", marginBottom: "0.75rem", opacity: 0.3 }}>+</div>
            <div style={{ color: "var(--text-tertiary)", fontSize: "0.875rem" }}>
              Create new room
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
