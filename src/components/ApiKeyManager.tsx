"use client";

import { useState, useEffect } from "react";
import { KeyPoolManager, type KeyPoolEntry } from "@/lib/key-pool";

const PROVIDERS = [
  { id: "openai", name: "OpenAI", icon: "🟢", placeholder: "sk-..." },
  { id: "anthropic", name: "Anthropic", icon: "🟠", placeholder: "sk-ant-..." },
  { id: "google", name: "Google", icon: "🔵", placeholder: "AIza..." },
  { id: "groq", name: "Groq", icon: "⚡", placeholder: "gsk_..." },
  { id: "openrouter", name: "OpenRouter", icon: "🌐", placeholder: "sk-or-..." },
  { id: "nvidia", name: "NVIDIA", icon: "🟩", placeholder: "nvapi-..." },
];

export function ApiKeyManager() {
  const [keys, setKeys] = useState<KeyPoolEntry[]>([]);
  const [showAdd, setShowAdd] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState("openai");
  const [newKeyValue, setNewKeyValue] = useState("");
  const [newKeyLabel, setNewKeyLabel] = useState("");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");

  const manager = new KeyPoolManager();

  const loadKeys = async () => {
    const k = await manager.listKeys();
    setKeys(k);
  };

  useEffect(() => { loadKeys(); }, []);

  const handleAdd = async () => {
    if (!newKeyValue.trim()) return;
    setLoading(true);
    const res = await manager.addKey({
      provider: selectedProvider,
      keyValue: newKeyValue.trim(),
      label: newKeyLabel || undefined,
    });
    if (res.success) {
      setMsg("Key added!");
      setNewKeyValue("");
      setNewKeyLabel("");
      setShowAdd(false);
      await loadKeys();
    } else {
      setMsg(res.error || "Failed to add key");
    }
    setLoading(false);
    setTimeout(() => setMsg(""), 3000);
  };

  const handleToggle = async (id: string) => {
    await manager.toggleKey(id);
    await loadKeys();
  };

  const handleDelete = async (id: string) => {
    await manager.deleteKey(id);
    await loadKeys();
  };

  const grouped = PROVIDERS.map((p) => ({
    ...p,
    keys: keys.filter((k) => k.provider === p.id),
  }));

  return (
    <div className="glass-key-manager" style={{
      padding: "var(--space-xl)",
      maxWidth: 640,
      margin: "0 auto",
    }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "var(--space-xl)" }}>
        <div>
          <h2 style={{ fontSize: "var(--font-size-xl)", fontWeight: 700, color: "var(--text-primary)", margin: 0 }}>
            🔑 API Keys
          </h2>
          <p style={{ fontSize: "var(--font-size-sm)", color: "var(--text-secondary)", marginTop: "4px" }}>
            Add multiple keys per provider. Requests use round-robin rotation.
          </p>
        </div>
        <button
          onClick={() => setShowAdd(!showAdd)}
          className="btn btn-primary"
        >
          + Add Key
        </button>
      </div>

      {/* Add Key Form */}
      {showAdd && (
        <div className="glass-strong" style={{
          padding: "var(--space-lg)",
          borderRadius: "var(--radius-lg)",
          marginBottom: "var(--space-xl)",
          display: "flex",
          flexDirection: "column",
          gap: "var(--space-md)",
        }}>
          <div style={{ display: "flex", gap: "var(--space-sm)", flexWrap: "wrap" }}>
            {PROVIDERS.map((p) => (
              <button
                key={p.id}
                onClick={() => setSelectedProvider(p.id)}
                style={{
                  padding: "6px 12px",
                  borderRadius: "var(--radius-full)",
                  border: selectedProvider === p.id ? "2px solid var(--accent)" : "1px solid var(--border-primary)",
                  background: selectedProvider === p.id ? "var(--accent)" : "var(--glass-bg)",
                  color: selectedProvider === p.id ? "white" : "var(--text-secondary)",
                  fontSize: "var(--font-size-xs)",
                  fontWeight: 500,
                  cursor: "pointer",
                  transition: "all var(--transition-fast)",
                  backdropFilter: "blur(8px)",
                }}
              >
                {p.icon} {p.name}
              </button>
            ))}
          </div>
          <input
            type="password"
            placeholder={PROVIDERS.find((p) => p.id === selectedProvider)?.placeholder || "Enter API key..."}
            value={newKeyValue}
            onChange={(e) => setNewKeyValue(e.target.value)}
            style={{
              padding: "var(--space-md)",
              borderRadius: "var(--radius-md)",
              border: "1px solid var(--border-primary)",
              background: "var(--bg-primary)",
              color: "var(--text-primary)",
              fontFamily: "var(--font-mono)",
              fontSize: "var(--font-size-sm)",
              outline: "none",
            }}
          />
          <input
            type="text"
            placeholder="Label (optional, e.g. 'My OpenAI Key #1')"
            value={newKeyLabel}
            onChange={(e) => setNewKeyLabel(e.target.value)}
            style={{
              padding: "var(--space-md)",
              borderRadius: "var(--radius-md)",
              border: "1px solid var(--border-primary)",
              background: "var(--bg-primary)",
              color: "var(--text-primary)",
              fontSize: "var(--font-size-sm)",
              outline: "none",
            }}
          />
          <div style={{ display: "flex", gap: "var(--space-sm)" }}>
            <button onClick={handleAdd} disabled={loading || !newKeyValue.trim()} className="btn btn-primary">
              {loading ? "Adding..." : "Add Key"}
            </button>
            <button onClick={() => setShowAdd(false)} className="btn btn-secondary">Cancel</button>
          </div>
        </div>
      )}

      {msg && (
        <div style={{
          padding: "var(--space-sm) var(--space-md)",
          borderRadius: "var(--radius-md)",
          background: msg.includes("added") ? "rgba(16,185,129,0.1)" : "rgba(239,68,68,0.1)",
          color: msg.includes("added") ? "var(--accent-green)" : "var(--accent-red)",
          fontSize: "var(--font-size-sm)",
          marginBottom: "var(--space-md)",
        }}>
          {msg}
        </div>
      )}

      {/* Provider Groups */}
      <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-lg)" }}>
        {grouped.map((provider) => (
          <div key={provider.id} className="glass" style={{
            padding: "var(--space-lg)",
            borderRadius: "var(--radius-lg)",
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: "var(--space-sm)", marginBottom: provider.keys.length > 0 ? "var(--space-md)" : 0 }}>
              <span style={{ fontSize: "var(--font-size-lg)" }}>{provider.icon}</span>
              <span style={{ fontWeight: 600, color: "var(--text-primary)" }}>{provider.name}</span>
              <span style={{
                padding: "2px 8px",
                borderRadius: "var(--radius-full)",
                background: provider.keys.length > 0 ? "rgba(16,185,129,0.1)" : "var(--bg-tertiary)",
                color: provider.keys.length > 0 ? "var(--accent-green)" : "var(--text-tertiary)",
                fontSize: "10px",
                fontWeight: 600,
              }}>
                {provider.keys.length} key{provider.keys.length !== 1 ? "s" : ""}
              </span>
            </div>
            {provider.keys.length === 0 ? (
              <p style={{ fontSize: "var(--font-size-xs)", color: "var(--text-tertiary)" }}>No keys added yet</p>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-sm)" }}>
                {provider.keys.map((key) => (
                  <div key={key.id} style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "var(--space-sm)",
                    padding: "var(--space-sm) var(--space-md)",
                    borderRadius: "var(--radius-md)",
                    background: "var(--bg-secondary)",
                    border: "1px solid var(--border-primary)",
                  }}>
                    <div style={{
                      width: 8,
                      height: 8,
                      borderRadius: "50%",
                      background: key.isActive ? "var(--accent-green)" : "var(--text-tertiary)",
                      flexShrink: 0,
                    }} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: "var(--font-size-sm)", color: "var(--text-primary)", fontFamily: "var(--font-mono)" }}>
                        {key.keyValue}
                      </div>
                      {key.keyLabel && (
                        <div style={{ fontSize: "10px", color: "var(--text-tertiary)" }}>{key.keyLabel}</div>
                      )}
                    </div>
                    <div style={{ fontSize: "10px", color: "var(--text-tertiary)", whiteSpace: "nowrap" }}>
                      {key.totalRequests} reqs
                    </div>
                    <button
                      onClick={() => handleToggle(key.id)}
                      style={{
                        padding: "2px 8px",
                        borderRadius: "var(--radius-full)",
                        border: "none",
                        fontSize: "10px",
                        fontWeight: 600,
                        cursor: "pointer",
                        background: key.isActive ? "rgba(239,68,68,0.1)" : "rgba(16,185,129,0.1)",
                        color: key.isActive ? "var(--accent-red)" : "var(--accent-green)",
                      }}
                    >
                      {key.isActive ? "Disable" : "Enable"}
                    </button>
                    <button
                      onClick={() => handleDelete(key.id)}
                      style={{
                        padding: "2px 6px",
                        background: "none",
                        border: "none",
                        cursor: "pointer",
                        color: "var(--text-tertiary)",
                        fontSize: "14px",
                      }}
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
