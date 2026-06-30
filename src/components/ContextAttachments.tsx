"use client";

export function ContextAttachments({ files, onRemove }: {
  files: Array<{ path: string; active: boolean }>;
  onRemove: (path: string) => void;
}) {
  if (files.length === 0) return null;

  return (
    <div style={{
      padding: "var(--space-sm) var(--space-md)",
      borderBottom: "1px solid var(--border-primary)",
      background: "var(--bg-tertiary)",
    }}>
      <div style={{
        fontSize: "10px", fontWeight: 600, color: "var(--text-tertiary)",
        textTransform: "uppercase", letterSpacing: "0.5px",
        display: "flex", alignItems: "center", gap: "4px",
        marginBottom: "var(--space-xs)",
      }}>
        📎 Context ({files.length})
      </div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: "4px" }}>
        {files.map((file) => (
          <div
            key={file.path}
            style={{
              display: "flex", alignItems: "center", gap: "4px",
              padding: "2px 8px",
              borderRadius: "var(--radius-sm)",
              background: file.active ? "var(--accent)" : "var(--bg-secondary)",
              color: file.active ? "#fff" : "var(--text-secondary)",
              fontSize: "10px", fontFamily: "var(--font-mono)",
              border: `1px solid ${file.active ? "var(--accent)" : "var(--border-primary)"}`,
            }}
          >
            <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 120 }}>
              {file.path}
            </span>
            <button
              onClick={() => onRemove(file.path)}
              style={{
                background: "none", border: "none", cursor: "pointer",
                color: "inherit", fontSize: 10, padding: "0 2px",
                opacity: 0.7,
              }}
            >✕</button>
          </div>
        ))}
      </div>
    </div>
  );
}
