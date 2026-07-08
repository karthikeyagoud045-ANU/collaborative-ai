"use client";

import { useState, useEffect } from "react";
import { supabase as client } from "@/lib/supabase-client";

export interface BuildEntry {
  id: string;
  roomId: string;
  version: number;
  filesSnapshot: Record<string, string>;
  aiPrompt?: string;
  createdAt: string;
  createdBy: string;
}

interface BuildHistoryProps {
  roomId: string;
  onSelectVersion?: (version: number, files: Record<string, string>) => void;
}

export function BuildHistory({ roomId, onSelectVersion }: BuildHistoryProps) {
  const [builds, setBuilds] = useState<BuildEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedBuild, setExpandedBuild] = useState<string | null>(null);

  useEffect(() => {
    loadBuilds();
  }, [roomId]);

  const loadBuilds = async () => {
    try {
      const { data: { user } } = await client.auth.getUser();
      if (!user) return;

      const { data, error } = await client
        .from("build_history")
        .select("*")
        .eq("room_id", roomId)
        .order("created_at", { ascending: false })
        .limit(50);

      if (error) throw error;
      setBuilds(data || []);
    } catch (err) {
      console.error("Failed to load build history:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleRestore = async (build: BuildEntry) => {
    if (onSelectVersion && confirm(`Restore to version ${build.version}?`)) {
      onSelectVersion(build.version, build.filesSnapshot);
    }
  };

  const toggleExpand = (buildId: string) => {
    setExpandedBuild(expandedBuild === buildId ? null : buildId);
  };

  if (loading) {
    return (
      <div style={{ padding: "var(--space-lg)", textAlign: "center" }}>
        <div className="animate-pulse" style={{ color: "var(--text-muted)" }}>
          Loading build history...
        </div>
      </div>
    );
  }

  if (builds.length === 0) {
    return (
      <div style={{ padding: "var(--space-xl)", textAlign: "center" }}>
        <div style={{ fontSize: "2rem", marginBottom: "var(--space-md)", opacity: 0.3 }}>📦</div>
        <h3 style={{ 
          fontFamily: "var(--font-serif)",
          fontSize: "var(--font-size-lg)", 
          fontWeight: 400,
          color: "var(--text-primary)",
          marginBottom: "var(--space-sm)"
        }}>
          No build history yet
        </h3>
        <p style={{ fontSize: "var(--font-size-sm)", color: "var(--text-muted)" }}>
          Builds will be automatically saved when you generate new code with AI.
        </p>
      </div>
    );
  }

  return (
    <div style={{ padding: "var(--space-lg)" }}>
      <h3 style={{ 
        fontFamily: "var(--font-serif)",
        fontSize: "var(--font-size-lg)", 
        fontWeight: 400,
        color: "var(--text-primary)",
        marginBottom: "var(--space-lg)"
      }}>
        📦 Build History ({builds.length})
      </h3>
      
      <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-md)" }}>
        {builds.map((build) => (
          <div
            key={build.id}
            className="card"
            style={{
              padding: "var(--space-md)",
              cursor: "pointer",
              transition: "all var(--transition-fast)",
            }}
            onClick={() => toggleExpand(build.id)}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "var(--space-md)" }}>
                <div style={{
                  width: 32,
                  height: 32,
                  borderRadius: "var(--radius-md)",
                  background: "var(--bg-tertiary)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "var(--font-size-lg)",
                }}>
                  📦
                </div>
                <div>
                  <div style={{ 
                    fontWeight: 500, 
                    color: "var(--text-primary)",
                    fontSize: "var(--font-size-sm)"
                  }}>
                    Version {build.version}
                  </div>
                  <div style={{ 
                    fontSize: "var(--font-size-xs)", 
                    color: "var(--text-muted)",
                    marginTop: "2px"
                  }}>
                    {new Date(build.created_at).toLocaleString()}
                  </div>
                </div>
              </div>
              
              <div style={{ display: "flex", gap: "var(--space-sm)", alignItems: "center" }}>
                <span style={{ 
                  fontSize: "var(--font-size-xs)", 
                  color: "var(--text-muted)",
                  background: "var(--bg-secondary)",
                  padding: "2px 8px",
                  borderRadius: "var(--radius-full)"
                }}>
                  {Object.keys(build.filesSnapshot).length} files
                </span>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleRestore(build);
                  }}
                  className="btn btn-secondary btn-sm"
                  style={{ fontSize: "var(--font-size-xs)" }}
                >
                  Restore
                </button>
                <span style={{ fontSize: "var(--font-size-lg)", color: "var(--text-muted)" }}>
                  {expandedBuild === build.id ? "▲" : "▼"}
                </span>
              </div>
            </div>

            {expandedBuild === build.id && (
              <div style={{
                marginTop: "var(--space-md)",
                paddingTop: "var(--space-md)",
                borderTop: "1px solid var(--border-primary)",
              }}>
                {build.aiPrompt && (
                  <div style={{ marginBottom: "var(--space-md)" }}>
                    <div style={{ 
                      fontSize: "var(--font-size-xs)", 
                      fontWeight: 500, 
                      color: "var(--text-secondary)",
                      marginBottom: "var(--space-xs)"
                    }}>
                      Prompt:
                    </div>
                    <div style={{ 
                      fontSize: "var(--font-size-sm)", 
                      color: "var(--text-primary)",
                      background: "var(--bg-secondary)",
                      padding: "var(--space-sm)",
                      borderRadius: "var(--radius-md)",
                      fontFamily: "var(--font-sans)",
                      lineHeight: 1.5
                    }}>
                      {build.aiPrompt.length > 200 
                        ? build.aiPrompt.slice(0, 200) + "..." 
                        : build.aiPrompt}
                    </div>
                  </div>
                )}
                
                <div>
                  <div style={{ 
                    fontSize: "var(--font-size-xs)", 
                    fontWeight: 500, 
                    color: "var(--text-secondary)",
                    marginBottom: "var(--space-xs)"
                  }}>
                    Files in this build:
                  </div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "var(--space-xs)" }}>
                    {Object.keys(build.filesSnapshot).map((fileName) => (
                      <span
                        key={fileName}
                        className="badge badge-blue"
                        style={{
                          background: "var(--bg-tertiary)",
                          color: "var(--text-primary)",
                          fontSize: "10px",
                          padding: "4px 8px",
                        }}
                      >
                        {fileName}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
