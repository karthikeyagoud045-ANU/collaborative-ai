"use client";

import { useState, useEffect, useCallback } from "react";
import { KeyPoolManager, type KeyPoolEntry } from "@/lib/key-pool";

const PROVIDERS = [
  { id: "openai", name: "OpenAI", placeholder: "sk-..." },
  { id: "anthropic", name: "Anthropic", placeholder: "sk-ant-..." },
  { id: "google", name: "Google", placeholder: "AIza..." },
  { id: "groq", name: "Groq", placeholder: "gsk_..." },
  { id: "openrouter", name: "OpenRouter", placeholder: "sk-or-..." },
  { id: "nvidia", name: "NVIDIA", placeholder: "nvapi-..." },
];

export function ApiKeyManager() {
  const [keys, setKeys] = useState<KeyPoolEntry[]>([]);
  const [showAdd, setShowAdd] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState("openrouter");
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

  const detectProvider = useCallback((keyVal: string) => {
    if (keyVal.startsWith("sk-or-")) return "openrouter";
    if (keyVal.startsWith("sk-ant-")) return "anthropic";
    if (keyVal.startsWith("gsk_")) return "groq";
    if (keyVal.startsWith("AIza")) return "google";
    if (keyVal.startsWith("nvapi-")) return "nvidia";
    if (keyVal.startsWith("sk-")) return "openai";
    return null;
  }, []);

  const handleKeyInputChange = useCallback((value: string) => {
    setNewKeyValue(value);
    const detected = detectProvider(value);
    if (detected) {
      setSelectedProvider(detected);
    }
  }, [detectProvider]);

  const fetchModels = useCallback(async (provider: string, apiKey: string) => {
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
  }, []);

  const handleAdd = async () => {
    if (!newKeyValue.trim()) return;
    setLoading(true);
    const res = await manager.addKey({
      provider: selectedProvider,
      keyValue: newKeyValue.trim(),
      label: newKeyLabel || undefined,
    });
    if (res.success) {
      setMsg("Key added successfully!");
      setNewKeyValue("");
      setNewKeyLabel("");
      setShowAdd(false);
      await loadKeys();
      // Auto-fetch models for this provider
      fetchModels(selectedProvider, newKeyValue.trim());
    } else {
      setMsg(res.error || "Failed to add key");
    }
    setLoading(false);
    setTimeout(() => setMsg(""), 3000);
  };

  const handleModelSelect = (keyId: string, model: string) => {
    setSelectedModels(prev => ({ ...prev, [keyId]: model }));
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

  const toggleExpand = async (keyId: string, provider: string, keyValue: string) => {
    const isExpanding = !expandedKeys[keyId];
    setExpandedKeys(prev => ({ ...prev, [keyId]: isExpanding }));
    // Auto-fetch models when expanding if not already fetched
    if (isExpanding && !availableModels[provider]) {
      fetchModels(provider, keyValue);
    }
  };

  const grouped = PROVIDERS.map((p) => ({
    ...p,
    keys: keys.filter((k) => k.provider === p.id),
  }));

  return (
    <div className="api-key-manager">
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "var(--space-xl)" }}>
        <div>
          <h3 style={{
            fontFamily: "var(--font-serif)",
            fontSize: "var(--font-size-2xl)",
            fontWeight: 400,
            letterSpacing: "-0.01em",
            color: "var(--text-primary)",
            margin: 0
          }}>
            API Keys
          </h3>
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
          <div style={{ fontSize: "var(--font-size-xs)", fontWeight: 600, color: "var(--text-secondary)", marginBottom: "var(--space-xs)" }}>
            Select Provider
          </div>
          <div style={{ display: "flex", gap: "var(--space-sm)", flexWrap: "wrap" }}>
            {PROVIDERS.map((p) => (
              <button
                key={p.id}
                onClick={() => setSelectedProvider(p.id)}
                style={{
                  padding: "8px 16px",
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
                {p.name}
              </button>
            ))}
          </div>
          <div>
            <div style={{ fontSize: "var(--font-size-xs)", fontWeight: 500, color: "var(--text-secondary)", marginBottom: "var(--space-xs)" }}>
              API Key
            </div>
            <input
              type="password"
              placeholder={PROVIDERS.find((p) => p.id === selectedProvider)?.placeholder || "Enter API key..."}
              value={newKeyValue}
              onChange={(e) => handleKeyInputChange(e.target.value)}
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
          </div>
          <div>
            <div style={{ fontSize: "var(--font-size-xs)", fontWeight: 500, color: "var(--text-secondary)", marginBottom: "var(--space-xs)" }}>
              Label (optional)
            </div>
            <input
              type="text"
              placeholder="e.g. 'My OpenRouter Key #1'"
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
          </div>

          {/* Auto-fetch models hint */}
          {newKeyValue && detectProvider(newKeyValue) && (
            <div style={{
              padding: "var(--space-sm) var(--space-md)",
              background: "rgba(204, 120, 92, 0.06)",
              borderRadius: "var(--radius-md)",
              fontSize: "var(--font-size-xs)",
              color: "var(--primary)",
              display: "flex",
              alignItems: "center",
              gap: "var(--space-sm)",
            }}>
              <span>✦</span>
              Provider detected: <strong>{PROVIDERS.find(p => p.id === detectProvider(newKeyValue))?.name}</strong> — Available models will be fetched automatically after adding.
            </div>
          )}

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
          background: msg.includes("success") ? "rgba(93,184,114,0.1)" : "rgba(198,69,69,0.1)",
          color: msg.includes("success") ? "var(--success)" : "var(--error)",
          fontSize: "var(--font-size-sm)",
          marginBottom: "var(--space-md)",
          border: `1px solid ${msg.includes("success") ? "rgba(93,184,114,0.2)" : "rgba(198,69,69,0.2)"}`,
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
              <span style={{
                width: 8, height: 8, borderRadius: "50%",
                background: provider.keys.length > 0 ? "var(--success)" : "var(--border-primary)",
                flexShrink: 0,
              }} />
              <span style={{ fontWeight: 500, color: "var(--text-primary)", fontSize: "var(--font-size-sm)" }}>{provider.name}</span>
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
                {provider.keys.map((key) => {
                  const currentModel = selectedModels[key.id] || loadSelectedModel(key.id);
                  return (
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
                          {currentModel && (
                            <div style={{ fontSize: "10px", color: "var(--primary)", fontFamily: "var(--font-mono)", marginTop: 2 }}>
                              Model: {currentModel}
                            </div>
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
                            transition: "all var(--transition-fast)",
                          }}
                        >
                          {key.isActive ? "Disable" : "Enable"}
                        </button>
                        <button
                          onClick={() => toggleExpand(key.id, provider.id, key.keyValue)}
                          style={{
                            padding: "4px 8px",
                            background: "var(--bg-primary)",
                            border: "1px solid var(--border-primary)",
                            borderRadius: "var(--radius-sm)",
                            cursor: "pointer",
                            color: "var(--text-secondary)",
                            fontSize: "10px",
                            transition: "all var(--transition-fast)",
                          }}
                        >
                          {expandedKeys[key.id] ? "▲" : "▼"} Models
                        </button>
                        <button
                          onClick={() => handleDelete(key.id)}
                          className="file-delete-btn"
                          style={{ opacity: 1 }}
                          title="Delete key"
                        >
                          ✕
                        </button>
                      </div>

                      {/* Expanded Model Selection — LLM Discovery */}
                      {expandedKeys[key.id] && (
                        <div style={{
                          padding: "var(--space-md)",
                          background: "var(--bg-primary)",
                          borderRadius: "var(--radius-md)",
                          border: "1px solid var(--border-primary)",
                        }}>
                          {fetchingModels[provider.id] ? (
                            <div style={{ fontSize: "var(--font-size-xs)", color: "var(--text-muted)", display: "flex", alignItems: "center", gap: "var(--space-sm)" }}>
                              <div className="animate-spin" style={{ width: 14, height: 14, border: "2px solid var(--border-primary)", borderTopColor: "var(--primary)", borderRadius: "50%" }} />
                              Fetching available models from {provider.name}...
                            </div>
                          ) : availableModels[provider.id] ? (
                            <div>
                              <div style={{ fontSize: "var(--font-size-xs)", fontWeight: 600, color: "var(--text-secondary)", marginBottom: "var(--space-sm)" }}>
                                Available Models ({availableModels[provider.id].length})
                              </div>
                              <div className="model-chips">
                                {availableModels[provider.id].map((model) => (
                                  <button
                                    key={model}
                                    className={`model-chip ${(selectedModels[key.id] || loadSelectedModel(key.id)) === model ? "selected" : ""}`}
                                    onClick={() => handleModelSelect(key.id, model)}
                                  >
                                    {model}
                                  </button>
                                ))}
                              </div>
                              {(selectedModels[key.id] || loadSelectedModel(key.id)) && (
                                <div style={{
                                  marginTop: "var(--space-sm)",
                                  padding: "var(--space-xs) var(--space-sm)",
                                  background: "rgba(93,184,114,0.06)",
                                  borderRadius: "var(--radius-sm)",
                                  fontSize: "var(--font-size-xs)",
                                  color: "var(--success)",
                                  display: "flex",
                                  alignItems: "center",
                                  gap: "var(--space-xs)",
                                }}>
                                  ✓ Selected: <strong style={{ fontFamily: "var(--font-mono)" }}>{selectedModels[key.id] || loadSelectedModel(key.id)}</strong>
                                </div>
                              )}
                            </div>
                          ) : (
                            <button
                              onClick={() => fetchModels(provider.id, key.keyValue)}
                              className="btn btn-secondary btn-sm"
                              style={{ fontSize: "var(--font-size-xs)" }}
                            >
                              Fetch Available Models
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
