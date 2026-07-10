"use client";

import type { ThinkingStep } from "@/lib/orchestrator";
import { getAgentConfig } from "@/lib/agent-memory";

export function ThinkingPanel({ steps, isVisible }: { steps: ThinkingStep[]; isVisible: boolean }) {
  if (!isVisible || steps.length === 0) return null;

  return (
    <div style={{
      padding: "var(--sp-sm) var(--sp-md)",
      borderBottom: "1px solid var(--hairline)",
      background: "var(--chip-active-bg)",
      maxHeight: 200,
      overflow: "auto",
    }}>
      <div style={{
        fontSize: "10px",
        fontWeight: 600,
        color: "var(--muted)",
        textTransform: "uppercase",
        letterSpacing: "0.5px",
        marginBottom: "var(--sp-xs)",
        display: "flex",
        alignItems: "center",
        gap: "4px",
      }}>
        {steps.some((s) => s.status === "thinking") && (
          <span className="loading-dots" style={{ fontSize: 8 }}><span>.</span><span>.</span><span>.</span></span>
        )}
        Orchestrator Thinking
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
        {steps.map((step) => {
          const config = getAgentConfig(step.agent);
          return (
            <div
              key={step.id}
              style={{
                display: "flex",
                alignItems: "flex-start",
                gap: "6px",
                padding: "4px 6px",
                borderRadius: "var(--r-sm)",
                background: step.status === "done" ? "rgba(5,150,105,0.06)" : step.status === "error" ? "rgba(220,38,38,0.06)" : "transparent",
                fontSize: "11px",
                transition: "all 0.2s ease",
              }}
            >
              <span style={{
                fontSize: "12px",
                lineHeight: "16px",
                flexShrink: 0,
              }}>
                {step.status === "done" ? "✅" : step.status === "error" ? "❌" : "🧠"}
              </span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                  <span>{config.icon}</span>
                  <span style={{ fontWeight: 600, color: config.color }}>{config.name}</span>
                  <span style={{ color: "var(--muted)" }}>·</span>
                  <span style={{ color: "var(--body)" }}>{step.action}</span>
                </div>
                {step.result && (
                  <div style={{
                    color: "var(--muted)",
                    marginTop: "2px",
                    fontSize: "10px",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}>
                    {step.result.slice(0, 120)}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
