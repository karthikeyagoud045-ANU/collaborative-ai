"use client";

import { useState } from "react";

interface ProjectSettingsProps {
  onClose: () => void;
  settings: ProjectConfig;
  onSave: (config: ProjectConfig) => void;
}

export interface ProjectConfig {
  framework: "nextjs" | "vite" | "remix";
  styling: "tailwind" | "css-modules" | "styled";
  uiLibrary: "shadcn" | "radix" | "mui" | "none";
  stateManagement: "zustand" | "redux" | "context" | "jotai";
  aiModel: "claude-sonnet" | "gpt-4o" | "gemini" | "groq";
  vibePreset: "strict" | "balanced" | "experimental";
  aiCanDelete: boolean;
  aiCanInstall: boolean;
  contextWindow: "auto" | "32k" | "128k";
}

const DEFAULT_CONFIG: ProjectConfig = {
  framework: "nextjs",
  styling: "tailwind",
  uiLibrary: "shadcn",
  stateManagement: "zustand",
  aiModel: "groq",
  vibePreset: "balanced",
  aiCanDelete: false,
  aiCanInstall: false,
  contextWindow: "auto",
};

export function ProjectSettingsPanel({ onClose, settings, onSave }: ProjectSettingsProps) {
  const [config, setConfig] = useState<ProjectConfig>(settings || DEFAULT_CONFIG);
  const [activeTab, setActiveTab] = useState<"project" | "ai" | "permissions" | "integrations">("project");

  const update = <K extends keyof ProjectConfig>(key: K, value: ProjectConfig[K]) => {
    setConfig((prev) => ({ ...prev, [key]: value }));
  };

  const tabs = [
    { id: "project" as const, label: "⚙️ Project", desc: "Framework & styling" },
    { id: "ai" as const, label: "🧠 AI & Vibe", desc: "Model & personality" },
    { id: "permissions" as const, label: "🔒 Permissions", desc: "What AI can do" },
    { id: "integrations" as const, label: "🔗 Integrations", desc: "Supabase, GitHub, Env" },
  ];

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 1000,
      display: "flex", alignItems: "center", justifyContent: "center",
      background: "rgba(0,0,0,0.5)", backdropFilter: "blur(8px)",
    }}>
      <div className="glass-strong" style={{
        width: "100%", maxWidth: 720, maxHeight: "85vh",
        borderRadius: "var(--radius-xl)",
        overflow: "hidden",
        display: "flex", flexDirection: "column",
        boxShadow: "0 24px 80px rgba(0,0,0,0.3)",
      }}>
        {/* Header */}
        <div style={{
          padding: "var(--space-lg) var(--space-xl)",
          borderBottom: "1px solid var(--border-primary)",
          display: "flex", alignItems: "center", justifyContent: "space-between",
        }}>
          <div>
            <h2 style={{ fontSize: "var(--font-size-xl)", fontWeight: 700, margin: 0 }}>Project Settings</h2>
            <p style={{ fontSize: "var(--font-size-xs)", color: "var(--text-tertiary)", marginTop: "2px" }}>
              Configure your project stack, AI behavior, and integrations
            </p>
          </div>
          <button onClick={onClose} style={{
            background: "none", border: "none", fontSize: 20, cursor: "pointer",
            color: "var(--text-tertiary)", padding: "4px 8px",
          }}>✕</button>
        </div>

        {/* Tabs */}
        <div style={{
          display: "flex", gap: 0,
          borderBottom: "1px solid var(--border-primary)",
          padding: "0 var(--space-xl)",
        }}>
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                padding: "var(--space-md) var(--space-lg)",
                background: "none",
                border: "none",
                borderBottom: activeTab === tab.id ? "2px solid var(--accent)" : "2px solid transparent",
                color: activeTab === tab.id ? "var(--text-primary)" : "var(--text-tertiary)",
                fontSize: "var(--font-size-sm)",
                fontWeight: activeTab === tab.id ? 600 : 400,
                cursor: "pointer",
                transition: "all var(--transition-fast)",
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div style={{ flex: 1, overflow: "auto", padding: "var(--space-xl)" }}>
          {activeTab === "project" && (
            <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-xl)" }}>
              <SettingGroup title="Framework" desc="Your app's foundation">
                <Select value={config.framework} onChange={(v) => update("framework", v)} options={[
                  { value: "nextjs", label: "Next.js (App Router)", icon: "▲" },
                  { value: "vite", label: "Vite + React", icon: "⚡" },
                  { value: "remix", label: "Remix", icon: "💿" },
                ]} />
              </SettingGroup>
              <SettingGroup title="Styling" desc="How styles are written">
                <Select value={config.styling} onChange={(v) => update("styling", v)} options={[
                  { value: "tailwind", label: "Tailwind CSS", icon: "🎨" },
                  { value: "css-modules", label: "CSS Modules", icon: "📦" },
                  { value: "styled", label: "Styled Components", icon: "💅" },
                ]} />
              </SettingGroup>
              <SettingGroup title="UI Library" desc="Component primitives">
                <Select value={config.uiLibrary} onChange={(v) => update("uiLibrary", v)} options={[
                  { value: "shadcn", label: "shadcn/ui (recommended)", icon: "🧩" },
                  { value: "radix", label: "Radix UI", icon: "🔲" },
                  { value: "mui", label: "Material UI", icon: "🎭" },
                  { value: "none", label: "None (custom)", icon: "✋" },
                ]} />
              </SettingGroup>
              <SettingGroup title="State Management" desc="How data flows through your app">
                <Select value={config.stateManagement} onChange={(v) => update("stateManagement", v)} options={[
                  { value: "zustand", label: "Zustand", icon: "🐻" },
                  { value: "redux", label: "Redux Toolkit", icon: "🔄" },
                  { value: "context", label: "React Context", icon: "🌲" },
                  { value: "jotai", label: "Jotai", icon: "⚛️" },
                ]} />
              </SettingGroup>
            </div>
          )}

          {activeTab === "ai" && (
            <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-xl)" }}>
              <SettingGroup title="AI Model" desc="Which model generates your code">
                <Select value={config.aiModel} onChange={(v) => update("aiModel", v)} options={[
                  { value: "groq", label: "Groq (Llama 3.3 70B) — Fastest, Free", icon: "⚡" },
                  { value: "claude-sonnet", label: "Claude 3.5 Sonnet — Best for coding", icon: "🧠" },
                  { value: "gpt-4o", label: "GPT-4o — Most capable", icon: "🟢" },
                  { value: "gemini", label: "Gemini 1.5 Pro — Google", icon: "🔵" },
                ]} />
              </SettingGroup>
              <SettingGroup title="Vibe Preset" desc="AI personality & coding style">
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "var(--space-sm" }}>
                  {[
                    { id: "strict" as const, emoji: "🎯", label: "Strict & Clean", desc: "Low temp. Strict TS, no `any`, documented." },
                    { id: "balanced" as const, emoji: "⚖️", label: "Balanced", desc: "Medium temp. Working UI + good architecture." },
                    { id: "experimental" as const, emoji: "🚀", label: "Hacker Mode", desc: "High temp. Bleeding-edge libraries." },
                  ].map((preset) => (
                    <button
                      key={preset.id}
                      onClick={() => update("vibePreset", preset.id)}
                      style={{
                        padding: "var(--space-md)",
                        borderRadius: "var(--radius-md)",
                        border: config.vibePreset === preset.id ? "2px solid var(--accent)" : "1px solid var(--border-primary)",
                        background: config.vibePreset === preset.id ? "var(--accent)" : "var(--glass-bg)",
                        color: config.vibePreset === preset.id ? "#fff" : "var(--text-primary)",
                        cursor: "pointer",
                        textAlign: "left",
                        transition: "all var(--transition-fast)",
                      }}
                    >
                      <div style={{ fontSize: "var(--font-size-lg)" }}>{preset.emoji}</div>
                      <div style={{ fontSize: "var(--font-size-sm)", fontWeight: 600, marginTop: "4px" }}>{preset.label}</div>
                      <div style={{ fontSize: "10px", marginTop: "2px", opacity: 0.8 }}>{preset.desc}</div>
                    </button>
                  ))}
                </div>
              </SettingGroup>
              <SettingGroup title="Context Window" desc="How much code the AI can see">
                <Select value={config.contextWindow} onChange={(v) => update("contextWindow", v)} options={[
                  { value: "auto", label: "Auto (recommended)", icon: "🤖" },
                  { value: "32k", label: "32K tokens", icon: "📄" },
                  { value: "128k", label: "128K tokens", icon: "📚" },
                ]} />
              </SettingGroup>
            </div>
          )}

          {activeTab === "permissions" && (
            <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-lg)" }}>
              <ToggleSetting
                label="AI can delete files"
                desc="Allow the AI to remove files from the project"
                value={config.aiCanDelete}
                onChange={(v) => update("aiCanDelete", v)}
              />
              <ToggleSetting
                label="AI can install NPM packages"
                desc="Allow the AI to add new dependencies automatically"
                value={config.aiCanInstall}
                onChange={(v) => update("aiCanInstall", v)}
              />
              <SettingGroup title="Collaboration Roles" desc="Who can do what">
                <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-sm)" }}>
                  {[
                    { role: "Admin", desc: "Full access, deploy, billing", color: "var(--accent-red)" },
                    { role: "Coder", desc: "Chat, edit, push to GitHub", color: "var(--accent-blue)" },
                    { role: "Viewer", desc: "Preview and chat history only", color: "var(--text-tertiary)" },
                  ].map((r) => (
                    <div key={r.role} style={{
                      display: "flex", alignItems: "center", gap: "var(--space-sm)",
                      padding: "var(--space-sm) var(--space-md)",
                      borderRadius: "var(--radius-md)",
                      background: "var(--bg-secondary)",
                    }}>
                      <div style={{ width: 8, height: 8, borderRadius: "50%", background: r.color }} />
                      <span style={{ fontWeight: 600, fontSize: "var(--font-size-sm)" }}>{r.role}</span>
                      <span style={{ fontSize: "var(--font-size-xs)", color: "var(--text-tertiary)", marginLeft: "auto" }}>{r.desc}</span>
                    </div>
                  ))}
                </div>
              </SettingGroup>
            </div>
          )}

          {activeTab === "integrations" && (
            <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-xl)" }}>
              <IntegrationCard
                title="Supabase"
                desc="Database, Auth, Storage"
                icon="⚡"
                status="connected"
                details="Project: vtfecfpgekoywotywjyk"
              />
              <IntegrationCard
                title="GitHub"
                desc="Code sync and version control"
                icon="🐙"
                status="disconnected"
                details="Click to connect a repository"
              />
              <IntegrationCard
                title="Environment Variables"
                desc=".env.local secrets for your app"
                icon="🔐"
                status="partial"
                details="3 variables configured"
              />
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{
          padding: "var(--space-md) var(--space-xl)",
          borderTop: "1px solid var(--border-primary)",
          display: "flex", justifyContent: "flex-end", gap: "var(--space-sm)",
        }}>
          <button onClick={onClose} className="btn btn-secondary">Cancel</button>
          <button onClick={() => onSave(config)} className="btn btn-primary">Save Settings</button>
        </div>
      </div>
    </div>
  );
}

function SettingGroup({ title, desc, children }: { title: string; desc: string; children: React.ReactNode }) {
  return (
    <div>
      <div style={{ marginBottom: "var(--space-sm)" }}>
        <div style={{ fontSize: "var(--font-size-sm)", fontWeight: 600 }}>{title}</div>
        <div style={{ fontSize: "var(--font-size-xs)", color: "var(--text-tertiary)" }}>{desc}</div>
      </div>
      {children}
    </div>
  );
}

function Select({ value, onChange, options }: {
  value: string;
  onChange: (v: any) => void;
  options: Array<{ value: string; label: string; icon: string }>;
}) {
  return (
    <div style={{ display: "flex", gap: "var(--space-sm)", flexWrap: "wrap" }}>
      {options.map((opt) => (
        <button
          key={opt.value}
          onClick={() => onChange(opt.value)}
          style={{
            display: "flex", alignItems: "center", gap: "6px",
            padding: "var(--space-sm) var(--space-md)",
            borderRadius: "var(--radius-md)",
            border: value === opt.value ? "2px solid var(--accent)" : "1px solid var(--border-primary)",
            background: value === opt.value ? "var(--accent)" : "var(--glass-bg)",
            color: value === opt.value ? "#fff" : "var(--text-secondary)",
            fontSize: "var(--font-size-sm)",
            cursor: "pointer",
            transition: "all var(--transition-fast)",
          }}
        >
          <span>{opt.icon}</span>
          <span>{opt.label}</span>
        </button>
      ))}
    </div>
  );
}

function ToggleSetting({ label, desc, value, onChange }: {
  label: string; desc: string; value: boolean; onChange: (v: boolean) => void;
}) {
  return (
    <div style={{
      display: "flex", alignItems: "center", justifyContent: "space-between",
      padding: "var(--space-md)",
      borderRadius: "var(--radius-md)",
      background: "var(--bg-secondary)",
    }}>
      <div>
        <div style={{ fontSize: "var(--font-size-sm)", fontWeight: 600 }}>{label}</div>
        <div style={{ fontSize: "var(--font-size-xs)", color: "var(--text-tertiary)" }}>{desc}</div>
      </div>
      <button
        onClick={() => onChange(!value)}
        style={{
          width: 44, height: 24, borderRadius: 12,
          border: "none", cursor: "pointer",
          background: value ? "var(--accent)" : "var(--border-secondary)",
          position: "relative", transition: "all var(--transition-fast)",
        }}
      >
        <div style={{
          width: 18, height: 18, borderRadius: "50%",
          background: "#fff", position: "absolute", top: 3,
          left: value ? 22 : 3,
          transition: "all var(--transition-fast)",
        }} />
      </button>
    </div>
  );
}

function IntegrationCard({ title, desc, icon, status, details }: {
  title: string; desc: string; icon: string; status: "connected" | "disconnected" | "partial"; details: string;
}) {
  const statusColors = { connected: "var(--accent-green)", disconnected: "var(--text-tertiary)", partial: "var(--accent-orange)" };
  const statusLabels = { connected: "Connected", disconnected: "Not Connected", partial: "Partial" };

  return (
    <div style={{
      display: "flex", alignItems: "center", gap: "var(--space-md)",
      padding: "var(--space-md)",
      borderRadius: "var(--radius-md)",
      background: "var(--glass-bg)",
      border: "1px solid var(--border-primary)",
    }}>
      <div style={{ fontSize: "var(--font-size-2xl)" }}>{icon}</div>
      <div style={{ flex: 1 }}>
        <div style={{ fontWeight: 600, fontSize: "var(--font-size-sm)" }}>{title}</div>
        <div style={{ fontSize: "var(--font-size-xs)", color: "var(--text-tertiary)" }}>{desc}</div>
        <div style={{ fontSize: "10px", color: statusColors[status], marginTop: "2px" }}>
          ● {statusLabels[status]} — {details}
        </div>
      </div>
      <button className="btn btn-sm btn-secondary" style={{ fontSize: "var(--font-size-xs)" }}>
        {status === "connected" ? "Manage" : "Connect"}
      </button>
    </div>
  );
}
