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
      <div style={{ padding: "var(--sp-lg)", textAlign: "center" }}>
        <div className="animate-pulse" style={{ color: "var(--muted)" }}>
          Loading build history...
        </div>
      </div>
    );
  }

  if (builds.length === 0) {
    return (
      <div style={{ padding: "var(--sp-xl)", textAlign: "center" }}>
        <div style={{ fontSize: "2rem", marginBottom: "var(--sp-md)", opacity: 0.3 }}>📦</div>
        <h3 style={{ 
          fontFamily: "var(--font-sans)",
          fontSize: "15px", 
          fontWeight: 400,
          color: "var(--ink)",
          marginBottom: "var(--sp-sm)"
        }}>
          No build history yet
        </h3>
        <p style={{ fontSize: "13px", color: "var(--muted)" }}>
          Builds will be automatically saved when you generate new code with AI.
        </p>
      </div>
    );
  }

  return (
    <div style={{ padding: "var(--sp-lg)" }}>
      <h3 style={{ 
        fontFamily: "var(--font-sans)",
        fontSize: "15px", 
        fontWeight: 400,
        color: "var(--ink)",
        marginBottom: "var(--sp-lg)"
      }}>
        📦 Build History ({builds.length})
      </h3>
      
      <div style={{ display: "flex", flexDirection: "column", gap: "var(--sp-md)" }}>
        {builds.map((build) => (
          <div
            key={build.id}
            className="card"
            style={{
              padding: "var(--sp-md)",
              cursor: "pointer",
              transition: "all 120ms ease",
            }}
            onClick={() => toggleExpand(build.id)}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "var(--sp-md)" }}>
                <div style={{
                  width: 32,
                  height: 32,
                  borderRadius: "var(--r-md)",
                  background: "var(--chip-active-bg)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "15px",
                }}>
                  📦
                </div>
                <div>
                  <div style={{ 
                    fontWeight: 500, 
                    color: "var(--ink)",
                    fontSize: "13px"
                  }}>
                    Version {build.version}
                  </div>
                  <div style={{ 
                    fontSize: "12px", 
                    color: "var(--muted)",
                    marginTop: "2px"
                  }}>
                    {new Date(build.createdAt).toLocaleString()}
                  </div>
                </div>
              </div>
              
              <div style={{ display: "flex", gap: "var(--sp-sm)", alignItems: "center" }}>
                <span style={{ 
                  fontSize: "12px", 
                  color: "var(--muted)",
                  background: "var(--canvas-panel)",
                  padding: "2px 8px",
                  borderRadius: "var(--r-pill)"
                }}>
                  {Object.keys(build.filesSnapshot).length} files
                </span>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleRestore(build);
                  }}
                  className="btn btn-secondary btn-sm"
                  style={{ fontSize: "12px" }}
                >
                  Restore
                </button>
                <span style={{ fontSize: "15px", color: "var(--muted)" }}>
                  {expandedBuild === build.id ? "▲" : "▼"}
                </span>
              </div>
            </div>

            {expandedBuild === build.id && (
              <div style={{
                marginTop: "var(--sp-md)",
                paddingTop: "var(--sp-md)",
                borderTop: "1px solid var(--hairline)",
              }}>
                {build.aiPrompt && (
                  <div style={{ marginBottom: "var(--sp-md)" }}>
                    <div style={{ 
                      fontSize: "12px", 
                      fontWeight: 500, 
                      color: "var(--body)",
                      marginBottom: "var(--sp-xs)"
                    }}>
                      Prompt:
                    </div>
                    <div style={{ 
                      fontSize: "13px", 
                      color: "var(--ink)",
                      background: "var(--canvas-panel)",
                      padding: "var(--sp-sm)",
                      borderRadius: "var(--r-md)",
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
                    fontSize: "12px", 
                    fontWeight: 500, 
                    color: "var(--body)",
                    marginBottom: "var(--sp-xs)"
                  }}>
                    Files in this build:
                  </div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "var(--sp-xs)" }}>
                    {Object.keys(build.filesSnapshot).map((fileName) => (
                      <span
                        key={fileName}
                        className="badge badge-blue"
                        style={{
                          background: "var(--chip-active-bg)",
                          color: "var(--ink)",
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
