"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useParams } from "next/navigation";
import * as Y from "yjs";
import { WebsocketProvider } from "y-websocket";
import { submitPrompt } from "@/lib/agentic-queue";
import { streamAIResponse, AIStreamRequest } from "@/lib/ai-client";
import { bootWebContainer, startDevServer, mountFileSystem } from "@/lib/webcontainer";
import { showToast } from "@/hooks/useToast";
import { useAgentApprovals } from "@/hooks/useAgentApprovals";
import { logger } from "@/lib/logger";

const WS_URL = process.env.NEXT_PUBLIC_WS_URL || "ws://localhost:8080";
const DEV_USER = {
  id: "dev-user-" + Math.random().toString(36).slice(2, 8),
  username: "Developer",
  avatarUrl: `https://api.dicebear.com/9.x/bottts-neutral/svg?seed=${Date.now()}`,
};

interface ChatMessage {
  id: string;
  userId: string;
  username: string;
  text: string;
  timestamp: number;
  isSystem?: boolean;
}

interface AIMessage {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  timestamp: number;
}

interface FileEntry {
  name: string;
  path: string;
  isDir: boolean;
}

const DEFAULT_FILES: Record<string, string> = {
  "index.html": `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Vibe App</title>
  <link rel="stylesheet" href="/style.css" />
</head>
<body>
  <div id="app">
    <h1>Hello, Vibe Coder! ⚡</h1>
    <p>Start editing to see changes live.</p>
  </div>
  <script src="/main.js"><\/script>
</body>
</html>`,
  "style.css": `* { margin: 0; padding: 0; box-sizing: border-box; }
body { font-family: Inter, sans-serif; padding: 2rem; background: #fafafa; color: #0a0a0a; }
h1 { font-size: 2rem; margin-bottom: 1rem; }
p { color: #525252; }`,
  "main.js": `console.log("Hello from Vibe Coder!");`,
  "package.json": `{
  "name": "vibe-app",
  "version": "1.0.0",
  "scripts": {
    "dev": "npx serve . -l 3001"
  }
}`,
};

export default function RoomPage() {
  const params = useParams();
  const roomId = params.roomId as string;

  const [ydoc, setYdoc] = useState<Y.Doc | null>(null);
  const [connected, setConnected] = useState(false);
  const [activeFile, setActiveFile] = useState("index.html");
  const [code, setCode] = useState(DEFAULT_FILES["index.html"]);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [aiMessages, setAiMessages] = useState<AIMessage[]>([]);
  const [aiInput, setAiInput] = useState("");
  const [aiKey, setAiKey] = useState("");
  const [aiProvider, setAiProvider] = useState<"openai" | "anthropic" | "google" | "groq" | "openrouter" | "nvidia">("openai");
  const [aiModel, setAiModel] = useState("gpt-4o-mini");
  const [aiMode, setAiMode] = useState<"chat" | "agent">("chat");
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [rightTab, setRightTab] = useState<"chat" | "ai">("ai");
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isPreviewLoading, setIsPreviewLoading] = useState(false);
  const [showKeyInput, setShowKeyInput] = useState(true);
  const [files, setFiles] = useState<FileEntry[]>([
    { name: "index.html", path: "index.html", isDir: false },
    { name: "style.css", path: "style.css", isDir: false },
    { name: "main.js", path: "main.js", isDir: false },
    { name: "package.json", path: "package.json", isDir: false },
  ]);
  const [agentLogs, setAgentLogs] = useState<Array<{ type: string; content: string }>>([]);
  const [leftPanelWidth, setLeftPanelWidth] = useState(200);
  const [showLeftPanel, setShowLeftPanel] = useState(true);
  const [showArtistMode, setShowArtistMode] = useState(false);
  const [rightPanelWidth, setRightPanelWidth] = useState(320);
  const resizeRef = useRef<{ startX: number; startW: number; panel: string } | null>(null);
  const aiMessagesEndRef = useRef<HTMLDivElement>(null);

  const { pendingActions, approveAction, rejectAction } = useAgentApprovals(ydoc);

  useEffect(() => {
    const doc = new Y.Doc();
    const wsProvider = new WebsocketProvider(WS_URL, roomId, doc);
    wsProvider.on("status", (event: { status: string }) => {
      setConnected(event.status === "connected");
    });
    wsProvider.on("sync", (isSynced: boolean) => {
      if (isSynced) {
        const yFiles = doc.getMap("files");
        if (yFiles.size === 0) {
          doc.transact(() => {
            Object.entries(DEFAULT_FILES).forEach(([name, content]) => {
              yFiles.set(name, content);
            });
          });
        }
      }
    });
    setYdoc(doc);
    return () => { wsProvider.destroy(); doc.destroy(); };
  }, [roomId]);

  useEffect(() => {
    if (!ydoc) return;
    const yFiles = ydoc.getMap("files");
    const updateCode = () => {
      const content = yFiles.get(activeFile);
      if (typeof content === "string") setCode(content);
    };
    updateCode();
    yFiles.observe(updateCode);
    return () => yFiles.unobserve(updateCode);
  }, [ydoc, activeFile]);

  useEffect(() => {
    if (!ydoc) return;
    const yFiles = ydoc.getMap("files");
    const updateFiles = () => {
      const entries: FileEntry[] = [];
      yFiles.forEach((_, key) => {
        entries.push({ name: key, path: key, isDir: false });
      });
      setFiles(entries.sort((a, b) => a.name.localeCompare(b.name)));
    };
    updateFiles();
    yFiles.observe(updateFiles);
    return () => yFiles.unobserve(updateFiles);
  }, [ydoc]);

  useEffect(() => {
    aiMessagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [aiMessages]);

  const handleResizeStart = useCallback((e: React.MouseEvent, panel: string) => {
    e.preventDefault();
    resizeRef.current = { startX: e.clientX, startW: panel === "left" ? leftPanelWidth : rightPanelWidth, panel };
    const handleMove = (ev: MouseEvent) => {
      if (!resizeRef.current) return;
      const diff = ev.clientX - resizeRef.current.startX;
      if (resizeRef.current.panel === "left") {
        setLeftPanelWidth(Math.max(120, Math.min(400, resizeRef.current.startW + diff)));
      } else {
        setRightPanelWidth(Math.max(240, Math.min(600, resizeRef.current.startW - diff)));
      }
    };
    const handleUp = () => {
      resizeRef.current = null;
      document.removeEventListener("mousemove", handleMove);
      document.removeEventListener("mouseup", handleUp);
    };
    document.addEventListener("mousemove", handleMove);
    document.addEventListener("mouseup", handleUp);
  }, [leftPanelWidth, rightPanelWidth]);

  const handleCodeChange = useCallback((newCode: string) => {
    setCode(newCode);
    if (ydoc) {
      const yFiles = ydoc.getMap("files");
      ydoc.transact(() => { yFiles.set(activeFile, newCode); });
    }
  }, [ydoc, activeFile]);

  const handleFileSelect = useCallback((path: string) => { setActiveFile(path); }, []);

  const handleChatSend = useCallback(() => {
    const trimmed = chatInput.trim();
    if (!trimmed || !ydoc) return;
    const yChat = ydoc.getMap("chat");
    const msg: ChatMessage = {
      id: Math.random().toString(36).slice(2),
      userId: DEV_USER.id,
      username: DEV_USER.username,
      text: trimmed,
      timestamp: Date.now(),
    };
    yChat.set(msg.id, msg);
    setChatInput("");
    setChatMessages((prev) => [...prev, msg]);
  }, [chatInput, ydoc]);

  useEffect(() => {
    if (!ydoc) return;
    const yChat = ydoc.getMap("chat");
    const updateChat = () => {
      const msgs: ChatMessage[] = [];
      yChat.forEach((value) => {
        const msg = value as ChatMessage;
        if (msg.text) msgs.push(msg);
      });
      setChatMessages(msgs.sort((a, b) => a.timestamp - b.timestamp));
    };
    updateChat();
    yChat.observe(updateChat);
    return () => yChat.unobserve(updateChat);
  }, [ydoc]);

  const handleAiSubmit = useCallback(async () => {
    const trimmed = aiInput.trim();
    if (!trimmed || !ydoc || isAiLoading) return;
    if (!aiKey) {
      showToast("Please enter your API key first", "warning");
      setShowKeyInput(true);
      return;
    }

    const userMsg: AIMessage = {
      id: Math.random().toString(36).slice(2),
      role: "user",
      content: trimmed,
      timestamp: Date.now(),
    };
    setAiMessages((prev) => [...prev, userMsg]);
    setAiInput("");
    setIsAiLoading(true);
    setAgentLogs([]);

    const yFiles = ydoc.getMap("files");
    const ytext = yFiles.get(activeFile) as string || code;

    const aiRequest: AIStreamRequest = {
      prompt: trimmed,
      code: ytext,
      apiKey: aiKey,
      provider: aiProvider,
      model: aiModel,
    };

    if (aiMode === "agent") {
      try {
        await submitPrompt({
          aiQueue: ydoc.getMap("aiQueue"),
          aiBranches: ydoc.getMap("aiBranches"),
          ytext: new Y.Text(),
          ydoc,
          userId: DEV_USER.id,
          username: DEV_USER.username,
          prompt: trimmed,
          targetFile: activeFile,
          aiRequest,
          agentMode: true,
          files: yFiles,
          pendingAgentActions: ydoc.getMap("pendingAgentActions"),
          onAgentLog: (entry) => setAgentLogs((prev) => [...prev, entry]),
          onProgress: (text) => {
            setAiMessages((prev) => {
              const last = prev[prev.length - 1];
              if (last?.role === "assistant") return [...prev.slice(0, -1), { ...last, content: text }];
              return [...prev, { id: Math.random().toString(36).slice(2), role: "assistant" as const, content: text, timestamp: Date.now() }];
            });
          },
          onComplete: (text) => {
            setAiMessages((prev) => [...prev, { id: Math.random().toString(36).slice(2), role: "assistant" as const, content: text, timestamp: Date.now() }]);
            setIsAiLoading(false);
          },
          onError: (error) => { showToast(error, "error"); setIsAiLoading(false); },
        });
      } catch (err) {
        showToast("Agent failed: " + (err instanceof Error ? err.message : "Unknown error"), "error");
        setIsAiLoading(false);
      }
    } else {
      let fullResponse = "";
      try {
        await streamAIResponse(aiRequest, {
          onToken: (token) => {
            fullResponse += token;
            setAiMessages((prev) => {
              const last = prev[prev.length - 1];
              if (last?.role === "assistant") return [...prev.slice(0, -1), { ...last, content: fullResponse }];
              return [...prev, { id: Math.random().toString(36).slice(2), role: "assistant" as const, content: fullResponse, timestamp: Date.now() }];
            });
          },
          onComplete: () => setIsAiLoading(false),
          onError: (error) => { showToast(error, "error"); setIsAiLoading(false); },
        });
      } catch { setIsAiLoading(false); }
    }
  }, [aiInput, ydoc, isAiLoading, aiKey, aiProvider, aiModel, code, activeFile, aiMode]);

  const handleStartPreview = useCallback(async () => {
    if (!ydoc) return;
    setIsPreviewLoading(true);
    try {
      const yFiles = ydoc.getMap("files");
      await bootWebContainer();
      await mountFileSystem(yFiles);
      const { url } = await startDevServer({ onStdout: (text) => logger.info("DevServer", { output: text }) });
      setPreviewUrl(url);
      showToast("Dev server started!", "success");
    } catch (err) {
      showToast("Failed to start preview: " + (err instanceof Error ? err.message : "Unknown error"), "error");
    } finally { setIsPreviewLoading(false); }
  }, [ydoc]);

  return (
    <div className="ide-layout">
      <header className="topbar">
        <div className="topbar-logo">
          <div className="topbar-logo-icon">⚡</div>
          <span>Ultimate Vibe Coder</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <div className={`status-dot ${connected ? "status-dot-connected" : "status-dot-connecting"}`} />
            <span style={{ fontSize: "var(--font-size-xs)", color: "var(--text-tertiary)" }}>
              {connected ? "Connected" : "Connecting..."}
            </span>
          </div>
          <span style={{ fontSize: "var(--font-size-xs)", color: "var(--text-tertiary)", fontFamily: "var(--font-mono)" }}>
            {roomId}
          </span>
        </div>
      </header>

      <div className="ide-body">
        {/* Left Sidebar */}
        <div className="ide-sidebar" style={{ width: showLeftPanel ? 48 : 0, overflow: "hidden" }}>
          {[
            { icon: "📁", label: "Files", action: () => setShowLeftPanel(true) },
            { icon: "💬", label: "Chat", action: () => setRightTab("chat") },
            { icon: "🎨", label: "Artist", action: () => setShowArtistMode(!showArtistMode) },
            { icon: "🔍", label: "Search" },
            { icon: "⚙️", label: "Settings" },
          ].map((item) => (
            <button key={item.label} className="btn btn-ghost btn-sm" style={{ width: 36, height: 36, padding: 0, borderRadius: "var(--radius-md)" }} title={item.label} onClick={item.action}>
              {item.icon}
            </button>
          ))}
        </div>

        {/* Main Content */}
        <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>
          {/* File Tree */}
          {showLeftPanel && (
            <div style={{ display: "flex" }}>
              <div className="ide-panel" style={{ width: leftPanelWidth }}>
                <div className="ide-panel-header">
                  <span className="ide-panel-title">Files</span>
                  <button className="btn btn-ghost btn-sm" onClick={() => setShowLeftPanel(false)} style={{ fontSize: "var(--font-size-xs)" }}>✕</button>
                </div>
                <div className="ide-panel-body" style={{ overflowY: "auto", padding: "var(--space-sm)" }}>
                  {files.map((file) => (
                    <div key={file.path} className={`file-tree-item ${activeFile === file.path ? "active" : ""}`} onClick={() => handleFileSelect(file.path)}>
                      <span style={{ fontSize: "var(--font-size-xs)", marginRight: "var(--space-sm)" }}>
                        {file.name.endsWith(".html") ? "🌐" : file.name.endsWith(".css") ? "🎨" : file.name.endsWith(".js") ? "📜" : file.name.endsWith(".json") ? "📋" : "📄"}
                      </span>
                      <span style={{ fontSize: "var(--font-size-sm)" }}>{file.name}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="resize-handle" onMouseDown={(e) => handleResizeStart(e, "left")} style={{ width: 4, cursor: "col-resize", background: "var(--border-primary)", flexShrink: 0, zIndex: 10 }} />
            </div>
          )}

          {/* Editor */}
          <div className="ide-panel" style={{ flex: 1 }}>
            <div className="ide-panel-header">
              <span className="ide-panel-title">{activeFile}</span>
              <div style={{ display: "flex", gap: "var(--space-xs)" }}>
                <span className="badge badge-blue" style={{ fontSize: "var(--font-size-xs)" }}>
                  {activeFile.split(".").pop()?.toUpperCase() || "TXT"}
                </span>
              </div>
            </div>
            <div className="ide-panel-body">
              <textarea
                value={code}
                onChange={(e) => handleCodeChange(e.target.value)}
                style={{
                  width: "100%", height: "100%", border: "none", outline: "none", resize: "none",
                  fontFamily: "var(--font-mono)", fontSize: "var(--font-size-sm)", lineHeight: 1.7,
                  padding: "var(--space-lg)", background: "var(--bg-primary)", color: "var(--text-primary)", tabSize: 2,
                }}
                spellCheck={false}
              />
            </div>
          </div>

          {/* Preview */}
          <div className="ide-panel" style={{ flex: 1 }}>
            <div className="ide-panel-header">
              <span className="ide-panel-title">Preview</span>
              <button className="btn btn-ghost btn-sm" onClick={handleStartPreview} disabled={isPreviewLoading} style={{ fontSize: "var(--font-size-xs)" }}>
                {isPreviewLoading ? "Starting..." : "▶ Run"}
              </button>
            </div>
            <div className="ide-panel-body" style={{ background: "white" }}>
              {previewUrl ? (
                <iframe src={previewUrl} className="preview-frame" title="Preview" />
              ) : (
                <div className="empty-state">
                  <div className="empty-state-icon">▶️</div>
                  <div className="empty-state-title">Live Preview</div>
                  <div className="empty-state-desc">Click "Run" to start the dev server and see your app live.</div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Panel */}
        <div className="ide-right-panel" style={{ width: rightPanelWidth }}>
          <div className="resize-handle" onMouseDown={(e) => handleResizeStart(e, "right")} style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: 4, cursor: "col-resize", background: "var(--border-primary)", zIndex: 10 }} />
          <div className="ide-right-tabs">
            <button className={`ide-right-tab ${rightTab === "ai" ? "active" : ""}`} onClick={() => setRightTab("ai")}>AI Assistant</button>
            <button className={`ide-right-tab ${rightTab === "chat" ? "active" : ""}`} onClick={() => setRightTab("chat")}>Chat</button>
          </div>

          {rightTab === "ai" ? (
            <div className="ai-panel">
              {showKeyInput && (
                <div style={{ padding: "var(--space-md)", borderBottom: "1px solid var(--border-primary)", background: "var(--bg-tertiary)" }}>
                  <div style={{ fontSize: "var(--font-size-xs)", fontWeight: 600, marginBottom: "var(--space-sm)", color: "var(--text-secondary)" }}>API Keys</div>
                  <div style={{ display: "flex", gap: "var(--space-sm)", marginBottom: "var(--space-sm)" }}>
                    <select value={aiProvider} onChange={(e) => setAiProvider(e.target.value as any)} style={{ flex: 1, fontSize: "var(--font-size-xs)", padding: "var(--space-xs) var(--space-sm)" }}>
                      <option value="openai">OpenAI</option>
                      <option value="anthropic">Anthropic</option>
                      <option value="google">Google</option>
                      <option value="groq">Groq</option>
                      <option value="openrouter">OpenRouter</option>
                      <option value="nvidia">NVIDIA</option>
                    </select>
                    <input type="text" placeholder="Model (e.g. gpt-4o-mini)" value={aiModel} onChange={(e) => setAiModel(e.target.value)} style={{ flex: 1, fontSize: "var(--font-size-xs)", padding: "var(--space-xs) var(--space-sm)" }} />
                  </div>
                  <input type="password" placeholder="Enter your API key..." value={aiKey} onChange={(e) => setAiKey(e.target.value)} style={{ fontSize: "var(--font-size-xs)" }} />
                  <div style={{ display: "flex", gap: "var(--space-xs)", marginTop: "var(--space-sm)", flexWrap: "wrap" }}>
                    <a href="https://console.groq.com/keys" target="_blank" rel="noopener noreferrer" style={{ fontSize: "var(--font-size-xs)", color: "var(--accent)" }}>Groq Keys →</a>
                    <a href="https://openrouter.ai/workspaces/default/keys" target="_blank" rel="noopener noreferrer" style={{ fontSize: "var(--font-size-xs)", color: "var(--accent)" }}>OpenRouter Keys →</a>
                    <a href="https://build.nvidia.com/meta/llama-3.2-90b-vision-instruct" target="_blank" rel="noopener noreferrer" style={{ fontSize: "var(--font-size-xs)", color: "var(--accent)" }}>NVIDIA Keys →</a>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "var(--space-sm)" }}>
                    <label style={{ display: "flex", alignItems: "center", gap: "var(--space-xs)", fontSize: "var(--font-size-xs)", color: "var(--text-secondary)", cursor: "pointer" }}>
                      <input type="checkbox" checked={aiMode === "agent"} onChange={(e) => setAiMode(e.target.checked ? "agent" : "chat")} />
                      Agent Mode
                    </label>
                    <button className="btn btn-ghost btn-sm" onClick={() => setShowKeyInput(false)} style={{ fontSize: "var(--font-size-xs)" }}>Hide</button>
                  </div>
                </div>
              )}

              {!showKeyInput && (
                <div style={{ padding: "var(--space-sm) var(--space-md)", display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid var(--border-primary)" }}>
                  <span style={{ fontSize: "var(--font-size-xs)", color: "var(--text-tertiary)" }}>{aiProvider} · {aiModel} · {aiMode === "agent" ? "🤖 Agent" : "💬 Chat"}</span>
                  <button className="btn btn-ghost btn-sm" onClick={() => setShowKeyInput(true)} style={{ fontSize: "var(--font-size-xs)" }}>⚙️</button>
                </div>
              )}

              {agentLogs.length > 0 && (
                <div className="agent-log">
                  {agentLogs.map((log, i) => (
                    <div key={i} className={`agent-log-entry agent-log-${log.type}`}>
                      <span>{log.type === "thought" ? "💭" : log.type === "tool" ? "🔧" : "📤"}</span>
                      <span className="truncate">{log.content}</span>
                    </div>
                  ))}
                </div>
              )}

              {pendingActions.length > 0 && (
                <div style={{ padding: "var(--space-md)", borderTop: "1px solid var(--border-primary)", background: "var(--bg-tertiary)" }}>
                  <div style={{ fontSize: "var(--font-size-xs)", fontWeight: 600, color: "var(--text-primary)", marginBottom: "var(--space-sm)" }}>Pending Approvals</div>
                  {pendingActions.map((action) => (
                    <div key={action.id} style={{ padding: "var(--space-sm)", background: "var(--bg-primary)", borderRadius: "var(--radius-sm)", marginBottom: "var(--space-sm)", fontSize: "var(--font-size-xs)" }}>
                      <div style={{ fontWeight: 500, marginBottom: "var(--space-xs)" }}>{action.type}: {action.target}</div>
                      <div style={{ display: "flex", gap: "var(--space-sm)" }}>
                        <button className="btn btn-primary btn-sm" onClick={() => approveAction(action.id)}>Approve</button>
                        <button className="btn btn-secondary btn-sm" onClick={() => rejectAction(action.id)}>Reject</button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div className="ai-messages">
                {aiMessages.length === 0 && (
                  <div className="empty-state">
                    <div className="empty-state-icon">🤖</div>
                    <div className="empty-state-title">AI Assistant</div>
                    <div className="empty-state-desc">Ask the AI to write, refactor, or explain code.</div>
                  </div>
                )}
                {aiMessages.map((msg) => (
                  <div key={msg.id} className={`ai-message ai-message-${msg.role}`}>
                    {msg.role === "assistant" && <div style={{ fontSize: "var(--font-size-xs)", fontWeight: 600, color: "var(--text-tertiary)", marginBottom: "var(--space-xs)" }}>AI</div>}
                    <div style={{ whiteSpace: "pre-wrap" }}>{msg.content}</div>
                  </div>
                ))}
                {isAiLoading && (
                  <div className="ai-message ai-message-assistant">
                    <div className="animate-pulse" style={{ color: "var(--text-tertiary)" }}>Thinking...</div>
                  </div>
                )}
                <div ref={aiMessagesEndRef} />
              </div>

              <div className="ai-input-area">
                <div className="ai-input-row">
                  <textarea
                    placeholder={aiMode === "agent" ? "Describe what you want the agent to do..." : "Ask AI about your code..."}
                    value={aiInput}
                    onChange={(e) => setAiInput(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleAiSubmit(); } }}
                    style={{ flex: 1, resize: "none", minHeight: 36, maxHeight: 120 }}
                  />
                  <button className="btn btn-primary" onClick={handleAiSubmit} disabled={isAiLoading || !aiInput.trim()} style={{ alignSelf: "flex-end" }}>
                    {isAiLoading ? "..." : "Send"}
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
              <div className="chat-messages">
                {chatMessages.length === 0 && (
                  <div className="empty-state">
                    <div className="empty-state-icon">💬</div>
                    <div className="empty-state-title">Room Chat</div>
                    <div className="empty-state-desc">Messages are synced in real-time with all room members.</div>
                  </div>
                )}
                {chatMessages.map((msg) => (
                  <div key={msg.id} className="chat-message">
                    <div className="chat-message-header">
                      <span className="chat-message-username">{msg.username}</span>
                      <span className="chat-message-time">{new Date(msg.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
                    </div>
                    <div className="chat-message-text">{msg.text}</div>
                  </div>
                ))}
              </div>
              <div className="chat-input-area">
                <div className="chat-input-row">
                  <input type="text" placeholder="Type a message..." value={chatInput} onChange={(e) => setChatInput(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); handleChatSend(); } }} />
                  <button className="btn btn-primary" onClick={handleChatSend} disabled={!chatInput.trim()}>Send</button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Artist Mode */}
      {showArtistMode && (
        <div style={{ position: "fixed", inset: 0, zIndex: 200, background: "var(--bg-primary)", display: "flex", flexDirection: "column" }}>
          <div className="topbar">
            <div className="topbar-logo">
              <div className="topbar-logo-icon">🎨</div>
              <span>Artist Mode</span>
            </div>
            <div style={{ display: "flex", gap: "var(--space-md)", alignItems: "center" }}>
              <span style={{ fontSize: "var(--font-size-sm)", color: "var(--text-secondary)" }}>Sketch your UI — AI will understand it</span>
              <button className="btn btn-primary" onClick={() => setShowArtistMode(false)}>Close</button>
            </div>
          </div>
          <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>
            <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
              <div style={{ padding: "var(--space-sm) var(--space-md)", borderBottom: "1px solid var(--border-primary)", display: "flex", gap: "var(--space-sm)", alignItems: "center" }}>
                <div style={{ display: "flex", gap: "var(--space-xs)" }}>
                  {["#000000", "#4f46e5", "#dc2626", "#059669", "#d97706", "#7c3aed"].map((color) => (
                    <button key={color} style={{ width: 24, height: 24, borderRadius: "50%", background: color, border: "2px solid var(--border-secondary)", cursor: "pointer" }} />
                  ))}
                </div>
                <input type="range" min="1" max="20" defaultValue="3" style={{ width: 80 }} />
                <button className="btn btn-ghost btn-sm" style={{ fontSize: "var(--font-size-xs)" }}>Clear</button>
              </div>
              <canvas
                style={{ flex: 1, background: "#ffffff", cursor: "crosshair" }}
                onMouseDown={(e) => {
                  const canvas = e.currentTarget;
                  const rect = canvas.getBoundingClientRect();
                  const ctx = canvas.getContext("2d");
                  if (!ctx) return;
                  const x = e.clientX - rect.left;
                  const y = e.clientY - rect.top;
                  ctx.beginPath();
                  ctx.moveTo(x, y);
                  ctx.strokeStyle = "#000";
                  ctx.lineWidth = 2;
                  ctx.lineCap = "round";
                  const handleMove = (ev: MouseEvent) => {
                    ctx.lineTo(ev.clientX - rect.left, ev.clientY - rect.top);
                    ctx.stroke();
                  };
                  const handleUp = () => {
                    ctx.closePath();
                    document.removeEventListener("mousemove", handleMove);
                    document.removeEventListener("mouseup", handleUp);
                  };
                  document.addEventListener("mousemove", handleMove);
                  document.addEventListener("mouseup", handleUp);
                }}
              />
            </div>
            <div style={{ width: 320, borderLeft: "1px solid var(--border-primary)", padding: "var(--space-lg)", display: "flex", flexDirection: "column", gap: "var(--space-md)" }}>
              <h3 style={{ fontSize: "var(--font-size-base)", fontWeight: 600 }}>Describe Your Vision</h3>
              <textarea
                placeholder="Describe what you drew... e.g. 'a dashboard with sidebar navigation, a chart card at top, and a data table below'"
                style={{ flex: 1, resize: "none", fontSize: "var(--font-size-sm)", lineHeight: 1.6, fontFamily: "var(--font-sans)", background: "transparent", outline: "none", border: "none" }}
              />
              <button className="btn btn-primary">Send to AI</button>
              <div style={{ fontSize: "var(--font-size-xs)", color: "var(--text-tertiary)", lineHeight: 1.5 }}>
                💡 <strong style={{ color: "var(--text-secondary)" }}>Tip:</strong> The AI will analyze your sketch and generate matching code. Draw boxes, buttons, layouts — the AI understands visual UI descriptions.
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
