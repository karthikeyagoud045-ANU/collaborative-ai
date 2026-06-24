"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface Template {
  id: string;
  title: string;
  description: string;
  author_name: string;
  language: string;
  fork_count: number;
  tags: string[];
  preview_image_url: string | null;
  created_at: string;
}

export default function TemplatesPage() {
  const router = useRouter();
  const [templates, setTemplates] = useState<Template[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [language, setLanguage] = useState("");

  useEffect(() => {
    let cancelled = false;
    const loadTemplates = async () => {
      setIsLoading(true);
      try {
        const params = new URLSearchParams({ page: "1", limit: "12" });
        if (search) params.set("search", search);
        if (language) params.set("language", language);
        const res = await fetch(`/api/templates?${params}`);
        const data = await res.json();
        if (!cancelled) {
          setTemplates(data.templates || []);
          // setTotalPages(data.totalPages || 1);
        }
      } catch {
        console.error("Failed to fetch templates");
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };
    loadTemplates();
    return () => { cancelled = true; };
  }, [language, search]);

  const handleFork = async (templateId: string) => {
    try {
      const res = await fetch("/api/templates/fork", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ templateId }),
      });
      const data = await res.json();
      if (data.roomId) {
        router.push(`/room/${data.roomId}`);
      } else {
        alert(data.error || "Failed to fork template");
      }
    } catch {
      alert("Failed to fork template");
    }
  };

  const languages = [
    { value: "", label: "All Languages" },
    { value: "javascript", label: "JavaScript" },
    { value: "typescript", label: "TypeScript" },
    { value: "python", label: "Python" },
    { value: "html", label: "HTML/CSS" },
  ];

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg-primary)", padding: "var(--space-2xl)" }}>
      <div style={{ maxWidth: 1200, margin: "0 auto" }}>
        <Link href="/" style={{ fontSize: "var(--font-size-sm)", color: "var(--text-secondary)", marginBottom: "var(--space-lg)", display: "inline-block" }}>
          ← Back to IDE
        </Link>
        <h1 style={{ fontSize: "var(--font-size-2xl)", fontWeight: 700, marginBottom: "var(--space-sm)", letterSpacing: "-0.02em" }}>
          Community Templates
        </h1>
        <p style={{ color: "var(--text-secondary)", fontSize: "var(--font-size-base)", marginBottom: "var(--space-2xl)" }}>
          Fork community-built projects and start vibe coding instantly
        </p>

        <div style={{ display: "flex", gap: "var(--space-md)", marginBottom: "var(--space-2xl)" }}>
          <input
            type="text"
            placeholder="Search templates..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ flex: 1, maxWidth: 300 }}
          />
          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
            style={{ minWidth: 160 }}
          >
            {languages.map((lang) => (
              <option key={lang.value} value={lang.value}>{lang.label}</option>
            ))}
          </select>
        </div>

        {isLoading ? (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: "var(--space-lg)" }}>
            {[...Array(6)].map((_, i) => (
              <div key={i} className="skeleton" style={{ height: 180, borderRadius: "var(--radius-lg)" }} />
            ))}
          </div>
        ) : templates.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">📦</div>
            <h2>No templates yet</h2>
            <p>Be the first to publish a template!</p>
            <Link href="/" className="btn btn-primary" style={{ marginTop: "var(--space-lg)" }}>
              Start Coding
            </Link>
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: "var(--space-lg)" }}>
            {templates.map((template) => (
              <div key={template.id} className="card" style={{ display: "flex", flexDirection: "column", gap: "var(--space-md)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span className="badge badge-blue">{template.language}</span>
                  <span style={{ fontSize: "var(--font-size-sm)", color: "var(--text-tertiary)" }}>🍴 {template.fork_count}</span>
                </div>
                <h3 style={{ fontSize: "var(--font-size-base)", fontWeight: 600 }}>{template.title}</h3>
                <p style={{ fontSize: "var(--font-size-sm)", color: "var(--text-secondary)", lineHeight: 1.5, flex: 1 }}>
                  {template.description || "No description"}
                </p>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: "var(--space-md)", borderTop: "1px solid var(--border-primary)" }}>
                  <span style={{ fontSize: "var(--font-size-xs)", color: "var(--text-tertiary)" }}>by {template.author_name}</span>
                  <button className="btn btn-primary btn-sm" onClick={() => handleFork(template.id)}>
                    Fork & Start
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
