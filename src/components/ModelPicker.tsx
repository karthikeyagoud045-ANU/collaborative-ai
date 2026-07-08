"use client";

import { useState, useEffect, useRef, useCallback } from "react";

export interface ModelInfo {
  id: string;
  name: string;
  provider: string;
  context_length?: number;
  pricing?: string;
}

interface ModelPickerProps {
  apiKey: string;
  selectedModel: string;
  onModelSelect: (model: string) => void;
  onApiKeyChange: (key: string) => void;
  provider: string;
  onProviderChange: (provider: string) => void;
}

const PROVIDER_COLORS: Record<string, string> = {
  anthropic: "var(--primary)",
  openai: "var(--accent-teal)",
  google: "var(--accent-amber)",
  meta: "var(--success)",
  mistralai: "var(--text-muted)",
  nvidia: "var(--success)",
  deepseek: "var(--accent-teal)",
  cohere: "var(--accent-amber)",
  qwen: "var(--primary)",
};

function getProviderFromId(modelId: string): string {
  const parts = modelId.split("/");
  if (parts.length > 1) return parts[0];
  if (modelId.startsWith("gpt")) return "openai";
  if (modelId.startsWith("claude")) return "anthropic";
  if (modelId.startsWith("gemini")) return "google";
  if (modelId.startsWith("llama")) return "meta";
  return "other";
}

function getProviderDisplayName(provider: string): string {
  const map: Record<string, string> = {
    anthropic: "Anthropic",
    openai: "OpenAI",
    google: "Google",
    meta: "Meta",
    mistralai: "Mistral",
    nvidia: "NVIDIA",
    deepseek: "DeepSeek",
    cohere: "Cohere",
    qwen: "Qwen",
    "meta-llama": "Meta",
    other: "Other",
  };
  return map[provider] || provider.charAt(0).toUpperCase() + provider.slice(1);
}

export function ModelPicker({
  apiKey,
  selectedModel,
  onModelSelect,
  onApiKeyChange,
  provider,
  onProviderChange,
}: ModelPickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [showKeyInput, setShowKeyInput] = useState(false);
  const [models, setModels] = useState<ModelInfo[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [error, setError] = useState("");
  const [keyDraft, setKeyDraft] = useState("");
  const dropdownRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  // Load models when API key is available
  const fetchModels = useCallback(async (key: string) => {
    if (!key) return;
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/models?provider=openrouter&apiKey=${encodeURIComponent(key)}`);
      const data = await res.json();
      if (data.success && data.models) {
        const modelList: ModelInfo[] = (data.models as any[]).map((m: any) => {
          if (typeof m === "string") {
            return {
              id: m,
              name: m.split("/").pop() || m,
              provider: getProviderFromId(m),
            };
          }
          return {
            id: m.id,
            name: m.name || m.id.split("/").pop() || m.id,
            provider: m.provider || getProviderFromId(m.id),
            context_length: m.context_length,
            pricing: m.pricing,
          };
        });
        setModels(modelList);
      } else {
        setError(data.error || "Failed to fetch models");
      }
    } catch {
      setError("Failed to fetch models");
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    if (apiKey && provider === "openrouter") {
      fetchModels(apiKey);
    }
  }, [apiKey, provider, fetchModels]);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node) &&
        triggerRef.current &&
        !triggerRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  // Group models by provider
  const filteredModels = models.filter(
    (m) =>
      m.id.toLowerCase().includes(search.toLowerCase()) ||
      m.name.toLowerCase().includes(search.toLowerCase()) ||
      m.provider.toLowerCase().includes(search.toLowerCase())
  );

  const grouped: Record<string, ModelInfo[]> = {};
  for (const m of filteredModels) {
    const p = m.provider;
    if (!grouped[p]) grouped[p] = [];
    grouped[p].push(m);
  }

  // Sort groups: prioritize Anthropic, OpenAI, Google, Meta
  const priorityOrder = ["anthropic", "openai", "google", "meta", "meta-llama", "mistralai", "nvidia"];
  const sortedProviders = Object.keys(grouped).sort((a, b) => {
    const ai = priorityOrder.indexOf(a);
    const bi = priorityOrder.indexOf(b);
    if (ai !== -1 && bi !== -1) return ai - bi;
    if (ai !== -1) return -1;
    if (bi !== -1) return 1;
    return a.localeCompare(b);
  });

  const modelDisplayName = selectedModel
    ? selectedModel.split("/").pop() || selectedModel
    : "Select model";

  const handleSaveKey = () => {
    if (keyDraft.trim()) {
      onApiKeyChange(keyDraft.trim());
      onProviderChange("openrouter");
      setShowKeyInput(false);
      fetchModels(keyDraft.trim());
    }
  };

  const handleTestConnection = async () => {
    if (!keyDraft.trim()) return;
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/models?provider=openrouter&apiKey=${encodeURIComponent(keyDraft.trim())}`);
      const data = await res.json();
      if (data.success && data.models?.length > 0) {
        setError("");
        // Show brief success
        setError("✓ Connected — " + data.models.length + " models available");
        setTimeout(() => setError(""), 3000);
      } else {
        setError("Invalid key or no models available");
      }
    } catch {
      setError("Connection failed");
    }
    setLoading(false);
  };

  return (
    <div style={{ position: "relative" }}>
      {/* Trigger button — compact badge in top bar */}
      <button
        ref={triggerRef}
        className="model-picker-trigger"
        onClick={() => setIsOpen(!isOpen)}
        title={selectedModel || "Select a model"}
      >
        <span className="model-picker-dot" style={{ background: PROVIDER_COLORS[getProviderFromId(selectedModel)] || "var(--text-muted)" }} />
        <span className="model-picker-label">{modelDisplayName}</span>
        <span className="model-picker-chevron">{isOpen ? "▲" : "▼"}</span>
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div ref={dropdownRef} className="model-picker-dropdown">
          {/* Search bar */}
          <div className="model-picker-search-bar">
            <input
              type="text"
              placeholder="Search models..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="model-picker-search"
              autoFocus
            />
            <button
              className="btn btn-ghost btn-sm"
              onClick={() => { setShowKeyInput(!showKeyInput); }}
              title="Change API key"
              style={{ fontSize: "var(--font-size-xs)", flexShrink: 0 }}
            >
              🔑
            </button>
          </div>

          {/* API Key input (hidden by default) */}
          {showKeyInput && (
            <div className="model-picker-key-section">
              <input
                type="password"
                placeholder="Enter OpenRouter API key..."
                value={keyDraft}
                onChange={(e) => setKeyDraft(e.target.value)}
                className="model-picker-key-input"
              />
              <div style={{ display: "flex", gap: "var(--space-xs)", marginTop: "var(--space-xs)" }}>
                <button className="btn btn-primary btn-sm" onClick={handleSaveKey} disabled={!keyDraft.trim()}>
                  Save
                </button>
                <button className="btn btn-secondary btn-sm" onClick={handleTestConnection} disabled={!keyDraft.trim() || loading}>
                  {loading ? "Testing..." : "Test"}
                </button>
              </div>
              {error && (
                <div style={{
                  fontSize: "var(--font-size-xs)",
                  marginTop: "var(--space-xs)",
                  color: error.startsWith("✓") ? "var(--success)" : "var(--error)",
                }}>
                  {error}
                </div>
              )}
            </div>
          )}

          {/* Model list */}
          <div className="model-picker-list">
            {loading && models.length === 0 ? (
              // Skeleton loading
              <div style={{ padding: "var(--space-md)" }}>
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="skeleton" style={{ height: 32, marginBottom: 4, borderRadius: "var(--radius-sm)" }} />
                ))}
              </div>
            ) : sortedProviders.length === 0 ? (
              <div style={{
                padding: "var(--space-xl)",
                textAlign: "center",
                color: "var(--text-muted)",
                fontSize: "var(--font-size-xs)",
              }}>
                {apiKey
                  ? search
                    ? "No models match your search"
                    : "No models available"
                  : "Enter an API key to see available models"}
              </div>
            ) : (
              sortedProviders.map((providerKey) => (
                <div key={providerKey} className="model-picker-group">
                  <div className="model-picker-group-header">
                    <span
                      className="model-picker-provider-dot"
                      style={{ background: PROVIDER_COLORS[providerKey] || "var(--text-muted)" }}
                    />
                    {getProviderDisplayName(providerKey)}
                    <span className="model-picker-group-count">{grouped[providerKey].length}</span>
                  </div>
                  {grouped[providerKey].map((model) => (
                    <button
                      key={model.id}
                      className={`model-picker-item ${selectedModel === model.id ? "selected" : ""}`}
                      onClick={() => {
                        onModelSelect(model.id);
                        setIsOpen(false);
                      }}
                    >
                      <span className="model-picker-item-name">{model.name}</span>
                      {model.context_length && (
                        <span className="model-picker-item-ctx">
                          {Math.round(model.context_length / 1000)}k
                        </span>
                      )}
                      {selectedModel === model.id && (
                        <span style={{ color: "var(--primary)", fontSize: "10px" }}>✓</span>
                      )}
                    </button>
                  ))}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
