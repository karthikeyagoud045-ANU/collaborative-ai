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
  const [availableModels, setAvailableModels] = useState<Record<string, string[]>>({});
  const [fetchingModels, setFetchingModels] = useState<Record<string, boolean>>({});
  const [expandedKeys, setExpandedKeys] = useState<Record<string, boolean>>({});
  const [selectedModels, setSelectedModels] = useState<Record<string, string>>({});

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
      // Fetch models for this provider with the new key
      fetchModels(selectedProvider, newKeyValue.trim());
    } else {
      setMsg(res.error || "Failed to add key");
    }
    setLoading(false);
    setTimeout(() => setMsg(""), 3000);
  };

  const fetchModels = async (provider: string, apiKey: string) => {
    setFetchingModels(prev => ({ ...prev, [provider]: true }));
    try {
      const res = await fetch(`/api/models?provider=${provider}&apiKey=${encodeURIComponent(apiKey)}`);
      const data = await res.json();
      if (data.success && data.models) {
        setAvailableModels(prev => ({ ...prev, [provider]: data.models }));
      }
    } catch (err) {
      console.error("Failed to fetch models:", err);
    }
    setFetchingModels(prev => ({ ...prev, [provider]: false }));
  };

  const handleModelSelect = (keyId: string, model: string) => {
    setSelectedModels(prev => ({ ...prev, [keyId]: model }));
    // Store in localStorage for persistence across sessions
    const storageKey = `selected_model_${keyId}`;
    localStorage.setItem(storageKey, model);
  };

  const loadSelectedModel = (keyId: string) => {
    const storageKey = `selected_model_${keyId}`;
    return localStorage.getItem(storageKey) || null;
  };

  const handleToggle = async (id: string) => {
    await manager.toggleKey(id);
    await loadKeys();
  };

  const handleDelete = async (id: string) => {
    await manager.deleteKey(id);
    await loadKeys();
  };

  const toggleExpand = (keyId: string) => {
    setExpandedKeys(prev => ({ ...prev, [keyId]: !prev[keyId] }));
  };

  const grouped = PROVIDERS.map((p) => ({
    ...p,
    keys: keys.filter((k) => k.provider === p.id),
  }));

  return (
    <div className="api-key-manager" style={{
      padding: "var(--space-xl)",
      maxWidth: 720,
      margin: "0 auto",
    }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "var(--space-xl)" }}>
        <div>
          <h2 style={{ 
            fontFamily: "var(--font-serif)",
            fontSize: "var(--font-size-2xl)", 
            fontWeight: 400,
            letterSpacing: "-0.01em",
            color: "var(--text-primary)",
            margin: 0 
          }}>
            🔑 API Keys
          </h2>
          <p style={{ 
            fontSize: "var(--font-size-sm)", 
            color: "var(--text-muted)", 
            marginTop: "var(--space-xs)" 
          }}>
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
        <div className="card" style={{
          padding: "var(--space-lg)",
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
                  border: selectedProvider === p.id ? "2px solid var(--primary)" : "1px solid var(--border-primary)",
                  background: selectedProvider === p.id ? "var(--primary)" : "var(--bg-primary)",
                  color: selectedProvider === p.id ? "var(--text-inverse)" : "var(--text-secondary)",
                  fontSize: "var(--font-size-xs)",
                  fontWeight: 500,
                  cursor: "pointer",
                  transition: "all var(--transition-fast)",
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
          background: msg.includes("added") ? "rgba(93,184,114,0.1)" : "rgba(198,69,69,0.1)",
          color: msg.includes("added") ? "var(--success)" : "var(--error)",
          fontSize: "var(--font-size-sm)",
          marginBottom: "var(--space-md)",
        }}>
          {msg}
        </div>
      )}

      {/* Provider Groups */}
      <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-lg)" }}>
        {grouped.map((provider) => (
          <div key={provider.id} className="card" style={{
            padding: "var(--space-lg)",
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: "var(--space-sm)", marginBottom: provider.keys.length > 0 ? "var(--space-md)" : 0 }}>
              <span style={{ fontSize: "var(--font-size-lg)" }}>{provider.icon}</span>
              <span style={{ fontWeight: 500, color: "var(--text-primary)" }}>{provider.name}</span>
              <span style={{
                padding: "2px 8px",
                borderRadius: "var(--radius-full)",
                background: provider.keys.length > 0 ? "rgba(93,184,114,0.1)" : "var(--bg-tertiary)",
                color: provider.keys.length > 0 ? "var(--success)" : "var(--text-muted)",
                fontSize: "10px",
                fontWeight: 600,
              }}>
                {provider.keys.length} key{provider.keys.length !== 1 ? "s" : ""}
              </span>
            </div>
            {provider.keys.length === 0 ? (
              <p style={{ fontSize: "var(--font-size-xs)", color: "var(--text-muted)" }}>No keys added yet</p>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-sm)" }}>
                {provider.keys.map((key) => (
                  <div key={key.id} style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "var(--space-sm)",
                    padding: "var(--space-md)",
                    borderRadius: "var(--radius-md)",
                    background: "var(--bg-secondary)",
                    border: "1px solid var(--border-primary)",
                  }}>
                    <div style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "var(--space-sm)",
                    }}>
                      <div style={{
                        width: 8,
                        height: 8,
                        borderRadius: "50%",
                        background: key.isActive ? "var(--success)" : "var(--text-muted)",
                        flexShrink: 0,
                      }} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: "var(--font-size-sm)", color: "var(--text-primary)", fontFamily: "var(--font-mono)" }}>
                          {key.keyValue}
                        </div>
                        {key.keyLabel && (
                          <div style={{ fontSize: "10px", color: "var(--text-muted)" }}>{key.keyLabel}</div>
                        )}
                      </div>
                      <div style={{ fontSize: "10px", color: "var(--text-muted)", whiteSpace: "nowrap" }}>
                        {key.totalRequests} reqs
                      </div>
                      <button
                        onClick={() => handleToggle(key.id)}
                        style={{
                          padding: "4px 10px",
                          borderRadius: "var(--radius-full)",
                          border: "none",
                          fontSize: "10px",
                          fontWeight: 600,
                          cursor: "pointer",
                          background: key.isActive ? "rgba(198,69,69,0.1)" : "rgba(93,184,114,0.1)",
                          color: key.isActive ? "var(--error)" : "var(--success)",
                        }}
                      >
                        {key.isActive ? "Disable" : "Enable"}
                      </button>
                      <button
                        onClick={() => handleDelete(key.id)}
                        style={{
                          padding: "4px 6px",
                          background: "none",
                          border: "none",
                          cursor: "pointer",
                          color: "var(--text-muted)",
                          fontSize: "14px",
                        }}
                      >
                        ✕
                      </button>
                      <button
                        onClick={() => toggleExpand(key.id)}
                        style={{
                          padding: "4px 8px",
                          background: "var(--bg-primary)",
                          border: "1px solid var(--border-primary)",
                          borderRadius: "var(--radius-sm)",
                          cursor: "pointer",
                          color: "var(--text-secondary)",
                          fontSize: "10px",
                        }}
                      >
                        {expandedKeys[key.id] ? "▲" : "▼"} Models
                      </button>
                    </div>
                    
                    {/* Expanded Model Selection */}
                    {expandedKeys[key.id] && (
                      <div style={{
                        padding: "var(--space-md)",
                        background: "var(--bg-primary)",
                        borderRadius: "var(--radius-md)",
                        border: "1px solid var(--border-primary)",
                      }}>
                        {fetchingModels[provider.id] ? (
                          <div style={{ fontSize: "var(--font-size-xs)", color: "var(--text-muted)" }}>
                            Fetching available models...
                          </div>
                        ) : availableModels[provider.id] ? (
                          <div>
                            <div style={{ fontSize: "var(--font-size-xs)", fontWeight: 500, color: "var(--text-secondary)", marginBottom: "var(--space-sm)" }}>
                              Select Model for this Key:
                            </div>
                            <select
                              value={selectedModels[key.id] || loadSelectedModel(key.id) || ""}
                              onChange={(e) => handleModelSelect(key.id, e.target.value)}
                              style={{
                                width: "100%",
                                padding: "var(--space-sm)",
                                borderRadius: "var(--radius-md)",
                                border: "1px solid var(--border-primary)",
                                background: "var(--bg-primary)",
                                color: "var(--text-primary)",
                                fontSize: "var(--font-size-sm)",
                                fontFamily: "var(--font-mono)",
                                outline: "none",
                                cursor: "pointer",
                              }}
                            >
                              <option value="">-- Choose a model --</option>
                              {availableModels[provider.id].map((model) => (
                                <option key={model} value={model}>
                                  {model}
                                </option>
                              ))}
                            </select>
                            {selectedModels[key.id] || loadSelectedModel(key.id) ? (
                              <div style={{ 
                                marginTop: "var(--space-sm)", 
                                fontSize: "var(--font-size-xs)", 
                                color: "var(--success)" 
                              }}>
                                ✓ Selected: <strong style={{ fontFamily: "var(--font-mono)" }}>{selectedModels[key.id] || loadSelectedModel(key.id)}</strong>
                              </div>
                            ) : null}
                          </div>
                        ) : (
                          <button
                            onClick={() => fetchModels(provider.id, key.keyValue.replace("...", ""))}
                            className="btn btn-primary btn-sm"
                            style={{ fontSize: "var(--font-size-xs)" }}
                          >
                            🔄 Fetch Available Models
                          </button>
                        )}
                      </div>
                    )}
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
