"use client";

import { useState } from "react";

export interface VersionEntry {
  id: string;
  timestamp: number;
  prompt: string;
  files: string[];
  description: string;
}

export function VersionHistory({ versions, onRestore }: {
  versions: VersionEntry[];
  onRestore: (version: VersionEntry) => void;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIdx, setSelectedIdx] = useState(versions.length - 1);

  if (versions.length === 0) return null;

  return (
    <>
      {/* Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        style={{
          position: "fixed", bottom: 20, left: 20, zIndex: 50,
          padding: "var(--space-sm) var(--space-md)",
          borderRadius: "var(--radius-full)",
          background: "var(--glass-bg-strong)",
          backdropFilter: "blur(var(--blur-amount))",
          border: "1px solid var(--glass-border)",
          boxShadow: "var(--glass-shadow)",
          fontSize: "var(--font-size-xs)",
          fontWeight: 600,
          color: "var(--text-primary)",
          cursor: "pointer",
          display: "flex", alignItems: "center", gap: "6px",
        }}
      >
        🕐 History ({versions.length})
      </button>

      {/* History Panel */}
      {isOpen && (
        <div style={{
          position: "fixed", bottom: 70, left: 20, zIndex: 50,
          width: 340, maxHeight: 400,
          borderRadius: "var(--radius-lg)",
          background: "var(--glass-bg-strong)",
          backdropFilter: "blur(var(--blur-strong))",
          border: "1px solid var(--glass-border)",
          boxShadow: "var(--glass-shadow-lg)",
          overflow: "hidden",
          display: "flex", flexDirection: "column",
        }}>
          <div style={{
            padding: "var(--space-md)",
            borderBottom: "1px solid var(--border-primary)",
            display: "flex", alignItems: "center", justifyContent: "space-between",
          }}>
            <span style={{ fontSize: "var(--font-size-sm)", fontWeight: 600 }}>Version History</span>
            <button onClick={() => setIsOpen(false)} style={{
              background: "none", border: "none", cursor: "pointer",
              color: "var(--text-tertiary)", fontSize: 16,
            }}>✕</button>
          </div>

          {/* Timeline */}
          <div style={{ flex: 1, overflow: "auto", padding: "var(--space-sm)" }}>
            {versions.map((version, idx) => (
              <button
                key={version.id}
                onClick={() => setSelectedIdx(idx)}
                style={{
                  display: "flex", alignItems: "flex-start", gap: "var(--space-sm)",
                  width: "100%", textAlign: "left",
                  padding: "var(--space-sm) var(--space-md)",
                  borderRadius: "var(--radius-md)",
                  border: "none",
                  background: selectedIdx === idx ? "var(--accent)" : "transparent",
                  color: selectedIdx === idx ? "#fff" : "var(--text-primary)",
                  cursor: "pointer",
                  transition: "all var(--transition-fast)",
                  marginBottom: 2,
                }}
              >
                <div style={{
                  width: 8, height: 8, borderRadius: "50%",
                  background: selectedIdx === idx ? "#fff" : "var(--accent)",
                  marginTop: 6, flexShrink: 0,
                }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{
                    fontSize: "var(--font-size-xs)",
                    fontWeight: 600,
                    overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                  }}>
                    {version.description}
                  </div>
                  <div style={{
                    fontSize: "10px",
                    opacity: 0.7,
                    marginTop: 2,
                  }}>
                    {new Date(version.timestamp).toLocaleTimeString()} · {version.files.length} files
                  </div>
                </div>
              </button>
            ))}
          </div>

          {/* Restore Button */}
          <div style={{
            padding: "var(--space-md)",
            borderTop: "1px solid var(--border-primary)",
          }}>
            <button
              onClick={() => {
                onRestore(versions[selectedIdx]);
                setIsOpen(false);
              }}
              style={{
                width: "100%",
                padding: "var(--space-sm)",
                borderRadius: "var(--radius-md)",
                border: "none",
                background: "var(--accent)",
                color: "#fff",
                fontSize: "var(--font-size-sm)",
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              ↩ Restore This Version
            </button>
          </div>
        </div>
      )}
    </>
  );
}
