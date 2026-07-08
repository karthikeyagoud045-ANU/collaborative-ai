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
import { getOrCreateRoom, saveRoomFile, saveChatMessage, getChatMessages } from "@/lib/supabase-ops";
import { listAgentMemories, createAgentMemory, buildMemoryContext, AGENT_TEAM, getAgentConfig, AgentRole, AgentMemory } from "@/lib/agent-memory";
import { OrchestratorAgent, type ThinkingStep } from "@/lib/orchestrator";
import { ThinkingPanel } from "@/components/ThinkingPanel";
import { ProjectSettingsPanel, type ProjectConfig } from "@/components/ProjectSettingsPanel";
import { VersionHistory, type VersionEntry } from "@/components/VersionHistory";
import { BuildHistory } from "@/components/BuildHistory";
import { ContextAttachments } from "@/components/ContextAttachments";
import { useCodebaseDownloader } from "@/hooks/useDownloader";

const WS_URL = process.env.NEXT_PUBLIC_WS_URL || "ws://localhost:8080";
const DEV_USER = {
id: "dev-user-" + crypto.randomUUID().slice(0, 8),
  username: "Developer",
  avatarUrl: `https://api.dicebear.com/9.x/bottts-neutral/svg?seed=${Date.now()}`,
};

interface ChatMessage {
  id: string;
  userId: string;
  username: string;
  text: string;
  timestamp: number;
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

// ---- Artist Mode Component ----
function ArtistMode({ onClose, onSendToAI }: { onClose: () => void; onSendToAI: (prompt: string, dataUrl: string) => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [color, setColor] = useState("#000000");
  const [brushSize, setBrushSize] = useState(3);
  const [tool, setTool] = useState<"pen" | "eraser">("pen");
  const [history, setHistory] = useState<ImageData[]>([]);
  const [prompt, setPrompt] = useState("");
  const lastPos = useRef<{ x: number; y: number } | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;
    const resize = () => {
      const rect = container.getBoundingClientRect();
      const tempCanvas = document.createElement("canvas");
      tempCanvas.width = canvas.width;
      tempCanvas.height = canvas.height;
      const tempCtx = tempCanvas.getContext("2d")!;
      tempCtx.drawImage(canvas, 0, 0);
      canvas.width = rect.width;
      canvas.height = rect.height;
      const ctx = canvas.getContext("2d")!;
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(tempCanvas, 0, 0);
    };
    resize();
    window.addEventListener("resize", resize);
    return () => window.removeEventListener("resize", resize);
  }, []);

  const saveState = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const data = ctx.getImageData(0, 0, canvas.width, canvas.height);
    setHistory((prev) => [...prev.slice(-30), data]);
  };

  const undo = () => {
    if (history.length <= 1) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const newHistory = [...history];
    newHistory.pop();
    const lastState = newHistory[newHistory.length - 1];
    ctx.putImageData(lastState, 0, 0);
    setHistory(newHistory);
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    saveState();
  };

  const getPos = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const rect = canvasRef.current!.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  };

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const pos = getPos(e);
    setIsDrawing(true);
    lastPos.current = pos;
    const ctx = canvasRef.current!.getContext("2d")!;
    ctx.beginPath();
    ctx.moveTo(pos.x, pos.y);
    ctx.fillStyle = tool === "eraser" ? "#ffffff" : color;
    ctx.fillRect(pos.x - brushSize / 2, pos.y - brushSize / 2, brushSize, brushSize);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !lastPos.current) return;
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext("2d")!;
    const pos = getPos(e);
    ctx.beginPath();
    ctx.moveTo(lastPos.current.x, lastPos.current.y);
    ctx.lineTo(pos.x, pos.y);
    ctx.strokeStyle = tool === "eraser" ? "#ffffff" : color;
    ctx.lineWidth = tool === "eraser" ? brushSize * 3 : brushSize;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.stroke();
    lastPos.current = pos;
  };

  const stopDrawing = () => {
    if (!isDrawing) return;
    setIsDrawing(false);
    lastPos.current = null;
    saveState();
  };

  const handleSendToAI = () => {
    const dataUrl = canvasRef.current?.toDataURL("image/png") || "";
    onSendToAI(prompt, dataUrl);
  };

  const downloadCanvas = () => {
    const link = document.createElement("a");
    link.download = "vibe-sketch.png";
    link.href = canvasRef.current!.toDataURL();
    link.click();
  };

  return (
    <div className="artist-mode-fullscreen">
      <div className="artist-header">
        <div className="artist-header-left">
          <span className="artist-logo">🎨</span>
          <span className="artist-title">Artist Mode</span>
          <span className="artist-subtitle">Sketch your UI vision</span>
        </div>
        <div className="artist-header-right">
          <button className="btn btn-ghost btn-sm" onClick={onClose}>✕ Close</button>
        </div>
      </div>
      <div className="artist-body">
        <div className="artist-canvas-area" ref={containerRef}>
          <div className="artist-toolbar">
            <div className="artist-tool-group">
              <button className={`artist-tool-btn ${tool === "pen" ? "active" : ""}`} onClick={() => setTool("pen")} title="Pen">✏️</button>
              <button className={`artist-tool-btn ${tool === "eraser" ? "active" : ""}`} onClick={() => setTool("eraser")} title="Eraser">🧹</button>
            </div>
            <div className="artist-divider" />
            <div className="artist-colors">
              {["#000000", "#4f46e5", "#dc2626", "#059669", "#d97706", "#7c3aed", "#ec4899", "#6b7280"].map((c) => (
                <button key={c} className={`artist-color-dot ${color === c ? "active" : ""}`} style={{ background: c }} onClick={() => { setColor(c); setTool("pen"); }} />
              ))}
            </div>
            <div className="artist-divider" />
            <input type="range" min="1" max="20" value={brushSize} onChange={(e) => setBrushSize(Number(e.target.value))} title="Brush size" />
            <span className="artist-brush-size">{brushSize}px</span>
            <div className="artist-divider" />
            <button className="btn btn-ghost btn-sm" onClick={undo} title="Undo">↩️</button>
            <button className="btn btn-ghost btn-sm" onClick={clearCanvas} title="Clear">🗑️</button>
            <button className="btn btn-ghost btn-sm" onClick={downloadCanvas} title="Save">💾</button>
          </div>
          <canvas
            ref={canvasRef}
            className="artist-canvas"
            onMouseDown={startDrawing}
            onMouseMove={draw}
            onMouseUp={stopDrawing}
            onMouseLeave={stopDrawing}
          />
        </div>
        <div className="artist-prompt-panel">
          <div className="artist-prompt-header">
            <span>💬 Tell the AI about your design</span>
          </div>
          <textarea
            className="artist-prompt-textarea"
            placeholder={"Describe what you drew and what you want the AI to build...\n\nExample: \"I drew a dashboard layout with a sidebar on the top left card showing user stats, and a data table below. Please generate the HTML/CSS code for this layout.\""}
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
          />
          <button className="btn btn-primary btn-lg" style={{ width: "100%" }} onClick={handleSendToAI}>
            ✨ Send to AI Agent
          </button>
          <div className="artist-tip">
            💡 <strong>Tip:</strong> Draw your UI layout, then describe what each section should do. The AI will generate matching code and place it in the editor.
          </div>
        </div>
      </div>
    </div>
  );
}

// ---- Main Room Page ----
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
  const [k, setK] = useState("");
  const [aiProvider, setAiProvider] = useState<"openai" | "anthropic" | "google" | "groq" | "openrouter" | "nvidia">("openrouter");
  const [detectedProvider, setDetectedProvider] = useState<string | null>(null);

  const PROVIDER_DEFAULT_MODELS: Record<string, string> = {
    openai: "gpt-4o-mini",
    anthropic: "claude-3-5-haiku-20241022",
    google: "gemini-2.0-flash-exp",
    groq: "llama-3.3-70b-versatile",
    openrouter: "nvidia/nemotron-3-ultra-550b-a55b:free",
    nvidia: "meta/llama-3.1-8b-instruct",
  };

  const detectProvider = useCallback((keyVal: string) => {
    if (keyVal.startsWith("sk-or-")) return "openrouter";
    if (keyVal.startsWith("sk-ant-")) return "anthropic";
    if (keyVal.startsWith("gsk_")) return "groq";
    if (keyVal.startsWith("AIza")) return "google";
    if (keyVal.startsWith("nvapi-")) return "nvidia";
    if (keyVal.startsWith("sk-")) return "openai";
    return null;
  }, []);
  const [aiModel, setAiModel] = useState("nvidia/nemotron-3-ultra-550b-a55b:free");
  const [aiMode, setAiMode] = useState<"chat" | "agent">("chat");
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [rightTab, setRightTab] = useState<"chat" | "ai">("ai");
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isPreviewLoading, setIsPreviewLoading] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [editingElement, setEditingElement] = useState<{ outerHTML: string; index: number } | null>(null);
  const [newElementHtml, setNewElementHtml] = useState("");
  const [showKeyInput, setShowKeyInput] = useState(true);
  const [showKey, setShowKey] = useState(false);
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
  const [rightPanelWidth, setRightPanelWidth] = useState(340);
  const [previewDevice, setPreviewDevice] = useState<"desktop" | "tablet" | "mobile">("desktop");
  const resizeRef = useRef<{ startX: number; startW: number; panel: string } | null>(null);
  const aiMessagesEndRef = useRef<HTMLDivElement>(null);
  const [supabaseRoom, setSupabaseRoom] = useState<{ id: string } | null>(null);
  const [selectedAgent, setSelectedAgent] = useState<AgentRole>("coder");
  const [agentMemories, setAgentMemories] = useState<AgentMemory[]>([]);
  const [showMemoryPanel, setShowMemoryPanel] = useState(false);
  // Orchestrator state
  const [orchestratorSteps, setOrchestratorSteps] = useState<ThinkingStep[]>([]);
  const [showOrchestrator, setShowOrchestrator] = useState(false);
  const [orchestratorMode, setOrchestratorMode] = useState(false);
  // Blueprint features
  const [showSettings, setShowSettings] = useState(false);
  const [projectConfig, setProjectConfig] = useState<ProjectConfig | null>(null);
  const [versionHistory, setVersionHistory] = useState<VersionEntry[]>([]);
  const [contextFiles, setContextFiles] = useState<Array<{ path: string; active: boolean }>>([]);
  const [showBuildHistory, setShowBuildHistory] = useState(false);
  const activeFile2 = activeFile; // alias for context

  const { pendingActions, approveAction, rejectAction } = useAgentApprovals(ydoc);

  // Supabase room
  useEffect(() => {
    getOrCreateRoom(roomId).then((room) => {
      setSupabaseRoom(room);
      getChatMessages(room.id).then((msgs) => {
        setChatMessages(msgs.map((m: any) => ({
          id: m.id, userId: m.user_id, username: m.username, text: m.text, timestamp: new Date(m.created_at).getTime()
        })));
      });
      listAgentMemories({ roomId: room.id, limit: 20 }).then(setAgentMemories);
    }).catch((err) => logger.warn("Supabase room load failed", { error: err }));
  }, [roomId]);

  // Auto-submit Artist Mode sketches to AI
  useEffect(() => {
    const handler = (e: Event) => {
      const msg = (e as CustomEvent).detail as string;
      setAiInput(msg);
      setTimeout(() => {
        const btn = document.querySelector(".ai-panel .btn-primary") as HTMLButtonElement;
        if (btn) btn.click();
      }, 150);
    };
    window.addEventListener("artist-sketch-send", handler);
    return () => window.removeEventListener("artist-sketch-send", handler);
  }, []);

  // Save files to Supabase
  useEffect(() => {
    if (!supabaseRoom || !ydoc) return;
    const yFiles = ydoc.getMap("files");
    const saveAll = () => {
      yFiles.forEach((content, path) => {
        if (typeof content === "string") {
          const lang = path.endsWith(".html") ? "html" : path.endsWith(".css") ? "css" : path.endsWith(".js") ? "javascript" : path.endsWith(".json") ? "json" : "plaintext";
          saveRoomFile(supabaseRoom.id, path, content, lang);
        }
      });
    };
    yFiles.observe(saveAll);
    return () => yFiles.unobserve(saveAll);
  }, [supabaseRoom, ydoc]);

  // Yjs init
  useEffect(() => {
    const doc = new Y.Doc();
    const wsProvider = new WebsocketProvider(WS_URL, roomId, doc);
    wsProvider.on("status", (event: { status: string }) => setConnected(event.status === "connected"));
    wsProvider.on("sync", (isSynced: boolean) => {
      if (isSynced) {
        const yFiles = doc.getMap("files");
        if (yFiles.size === 0) {
          doc.transact(() => {
            Object.entries(DEFAULT_FILES).forEach(([name, content]) => yFiles.set(name, content));
          });
        }
      }
    });
    setYdoc(doc);
    return () => { wsProvider.destroy(); doc.destroy(); };
  }, [roomId]);

  // Sync active file
  useEffect(() => {
    if (!ydoc) return;
    const yFiles = ydoc.getMap("files");
    const update = () => { const c = yFiles.get(activeFile); if (typeof c === "string") setCode(c); };
    update();
    yFiles.observe(update);
    return () => yFiles.unobserve(update);
  }, [ydoc, activeFile]);

  // Sync file list
  useEffect(() => {
    if (!ydoc) return;
    const yFiles = ydoc.getMap("files");
    const update = () => {
      const entries: FileEntry[] = [];
      yFiles.forEach((_, key) => entries.push({ name: key, path: key, isDir: false }));
      setFiles(entries.sort((a, b) => a.name.localeCompare(b.name)));
    };
    update();
    yFiles.observe(update);
    return () => yFiles.unobserve(update);
  }, [ydoc]);

  // Auto-scroll
  useEffect(() => { aiMessagesEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [aiMessages]);

  // Resize
  const handleResizeStart = useCallback((e: React.MouseEvent, panel: string) => {
    e.preventDefault();
    resizeRef.current = { startX: e.clientX, startW: panel === "left" ? leftPanelWidth : rightPanelWidth, panel };
    const handleMove = (ev: MouseEvent) => {
      if (!resizeRef.current) return;
      const diff = ev.clientX - resizeRef.current.startX;
      if (resizeRef.current.panel === "left") {
        setLeftPanelWidth(Math.max(120, Math.min(400, resizeRef.current.startW + diff)));
      } else {
        setRightPanelWidth(Math.max(260, Math.min(600, resizeRef.current.startW - diff)));
      }
    };
    const handleUp = () => { resizeRef.current = null; document.removeEventListener("mousemove", handleMove); document.removeEventListener("mouseup", handleUp); };
    document.addEventListener("mousemove", handleMove);
    document.addEventListener("mouseup", handleUp);
  }, [leftPanelWidth, rightPanelWidth]);

  const handleCodeChange = useCallback((newCode: string) => {
    setCode(newCode);
    if (ydoc) { const yf = ydoc.getMap("files"); ydoc.transact(() => { yf.set(activeFile, newCode); }); }
  }, [ydoc, activeFile]);

  const parseElements = useCallback((html: string) => {
    const elements: Array<{ tag: string; content: string; outerHTML: string; index: number }> = [];
    const regex = /<([a-z][a-z0-9]*)[^>]*>([\s\S]*?)<\/\1>/gi;
    let match;
    while ((match = regex.exec(html)) !== null) {
      elements.push({ tag: match[1], content: match[2].trim().slice(0, 60), outerHTML: match[0], index: match.index });
    }
    return elements;
  }, []);

  const handleEditElement = useCallback((oldOuterHTML: string, newOuterHTML: string) => {
    const newCode = code.replace(oldOuterHTML, newOuterHTML);
    handleCodeChange(newCode);
    setEditingElement(null);
  }, [code, handleCodeChange]);

  const handleAddElement = useCallback((htmlString: string) => {
    const newCode = code + "\n" + htmlString;
    handleCodeChange(newCode);
  }, [code, handleCodeChange]);

  const handleFileSelect = useCallback((path: string) => setActiveFile(path), []);

  const handleChatSend = useCallback(() => {
    const trimmed = chatInput.trim();
    if (!trimmed || !ydoc) return;
    const yChat = ydoc.getMap("chat");
    const msg: ChatMessage = { id: Math.random().toString(36).slice(2), userId: DEV_USER.id, username: DEV_USER.username, text: trimmed, timestamp: Date.now() };
    yChat.set(msg.id, msg);
    setChatInput("");
    // Don't add to local state here — the Yjs observer will sync it back
    if (supabaseRoom) saveChatMessage(supabaseRoom.id, DEV_USER.id, DEV_USER.username, trimmed);
  }, [chatInput, ydoc, supabaseRoom]);

  // Sync chat — dedupe by message id to prevent duplicates
  useEffect(() => {
    if (!ydoc) return;
    const yChat = ydoc.getMap("chat");
    const update = () => {
      const msgMap = new Map<string, ChatMessage>();
      yChat.forEach((value) => {
        const m = value as ChatMessage;
        if (m.text && !msgMap.has(m.id)) msgMap.set(m.id, m);
      });
      const msgs = Array.from(msgMap.values()).sort((a, b) => a.timestamp - b.timestamp);
      setChatMessages(msgs);
    };
    update();
    yChat.observe(update);
    return () => yChat.unobserve(update);
  }, [ydoc]);

  // Auto-update context files when active file changes
  useEffect(() => {
    if (activeFile) {
      setContextFiles((prev) => {
        const exists = prev.find((f) => f.path === activeFile);
        if (exists) return prev;
        return [...prev, { path: activeFile, active: true }];
      });
    }
  }, [activeFile]);

  // AI Submit
  const handleAiSubmit = useCallback(async () => {
    const trimmed = aiInput.trim();
    if (!trimmed || !ydoc || isAiLoading) return;
    // Note: k can be empty — server will fallback to .env.local keys

    const userMsg: AIMessage = { id: Math.random().toString(36).slice(2), role: "user", content: trimmed, timestamp: Date.now() };
    setAiMessages((prev) => [...prev, userMsg]);
    setAiInput("");
    setIsAiLoading(true);
    setAgentLogs([]);

    // Inject memory context (graceful — table may not exist yet)
    let memoryContext = "";
    try {
      const memories = await listAgentMemories({ roomId: supabaseRoom?.id || "", limit: 5, minImportance: 7 });
      memoryContext = buildMemoryContext(memories);
    } catch { /* memory table not set up yet — skip silently */ }
    const enrichedPrompt = memoryContext ? `${memoryContext}\n\nUser: ${trimmed}` : trimmed;

    const yFiles = ydoc.getMap("files");
    const ytext = yFiles.get(activeFile) as string || code;
    const aiRequest: AIStreamRequest = { prompt: enrichedPrompt, code: ytext, apiKey: k, provider: aiProvider, model: aiModel };

    // Orchestrator Mode: brain agent plans + delegates to specialists
    if (orchestratorMode) {
      const orchestrator = new OrchestratorAgent((steps) => {
        setOrchestratorSteps(steps);
      });
      setShowOrchestrator(true);
      try {
        await orchestrator.orchestrate({
          prompt: enrichedPrompt,
          codeContext: ytext,
          apiKey: k,
          provider: aiProvider,
          model: aiModel,
          onResult: (response) => {
            setAiMessages((prev) => [...prev, {
              id: crypto.randomUUID().slice(0, 8),
              role: "assistant",
              content: response,
              timestamp: Date.now(),
            }]);
            setIsAiLoading(false);
            setShowOrchestrator(false);
          },
          onStep: (step) => {},
        });
      } catch (err) {
        showToast("Orchestrator failed: " + (err instanceof Error ? err.message : "Unknown error"), "error");
        setIsAiLoading(false);
        setShowOrchestrator(false);
      }
      return;
    }

    if (aiMode === "agent") {
      try {
        let fullResponse = "";
        await submitPrompt({
          aiQueue: ydoc.getMap("aiQueue"), aiBranches: ydoc.getMap("aiBranches"), ytext: new Y.Text(), ydoc,
          userId: DEV_USER.id, username: DEV_USER.username, prompt: enrichedPrompt, targetFile: activeFile, aiRequest,
          agentMode: true, files: yFiles, pendingAgentActions: ydoc.getMap("pendingAgentActions"),
          onAgentLog: (entry) => setAgentLogs((prev) => [...prev, entry]),
          onProgress: (text) => {
            fullResponse = text;
            setAiMessages((prev) => { const last = prev[prev.length - 1]; if (last?.role === "assistant") return [...prev.slice(0, -1), { ...last, content: text }]; return [...prev, { id: Math.random().toString(36).slice(2), role: "assistant" as const, content: text, timestamp: Date.now() }]; });
          },
          onComplete: async () => {
            setIsAiLoading(false);
            // Auto-store important AI exchanges as memories (graceful)
            if (supabaseRoom && fullResponse.length > 100) {
              try {
                await createAgentMemory(supabaseRoom.id, selectedAgent, "learning", `AI(${selectedAgent}): ${trimmed.slice(0, 200)} -> ${fullResponse.slice(0, 200)}`, 6, { model: aiModel, provider: aiProvider });
                const updatedMemories = await listAgentMemories({ roomId: supabaseRoom.id, limit: 20 });
                setAgentMemories(updatedMemories);
              } catch { /* memory table not set up yet */ }
            }
          },
          onError: (error) => { showToast(error, "error"); setIsAiLoading(false); }
        });
      } catch (err) { showToast("Agent failed: " + (err instanceof Error ? err.message : "Unknown error"), "error"); setIsAiLoading(false); }
    } else {
      let fullResponse = "";
      try {
        await streamAIResponse(aiRequest, {
          onToken: (token) => { fullResponse += token; setAiMessages((prev) => { const last = prev[prev.length - 1]; if (last?.role === "assistant") return [...prev.slice(0, -1), { ...last, content: fullResponse }]; return [...prev, { id: Math.random().toString(36).slice(2), role: "assistant" as const, content: fullResponse, timestamp: Date.now() }]; }); },
          onComplete: async () => {
            setIsAiLoading(false);
            if (supabaseRoom && fullResponse.length > 100) {
              try {
                await createAgentMemory(supabaseRoom.id, selectedAgent, "learning", `AI(${selectedAgent}): ${trimmed.slice(0, 200)} -> ${fullResponse.slice(0, 200)}`, 6, { model: aiModel, provider: aiProvider });
                const updatedMemories = await listAgentMemories({ roomId: supabaseRoom.id, limit: 20 });
                setAgentMemories(updatedMemories);
              } catch { /* memory table not set up yet */ }
            }
          },
          onError: (error) => { showToast(error, "error"); setIsAiLoading(false); },
        });
      } catch { setIsAiLoading(false); }
    }
  }, [aiInput, ydoc, isAiLoading, k, aiProvider, aiModel, code, activeFile, aiMode, supabaseRoom, selectedAgent]);

  // Download & Git
  const { downloadCodebase } = useCodebaseDownloader();
  const handleDownloadCodebase = useCallback(() => {
    if (!ydoc) return;
    const yFiles = ydoc.getMap("files");
    const fileMap = new Map<string, string>();
    yFiles.forEach((content, path) => {
      if (typeof content === "string") fileMap.set(path, content);
    });
    downloadCodebase(fileMap, roomId);
    showToast("Downloading codebase...", "success");
  }, [ydoc, downloadCodebase, roomId]);

  const handleGitPush = useCallback(async () => {
    if (!ydoc) return;
    const yFiles = ydoc.getMap("files");
    const files: Record<string, string> = {};
    yFiles.forEach((content, path) => {
      if (typeof content === "string") files[path] = content;
    });
    try {
      const res = await fetch("/api/github/push", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ roomId, files }),
      });
      const data = await res.json();
      if (res.ok) {
        showToast(data.message || "Pushed to GitHub!", "success");
      } else {
        showToast(data.error || "GitHub push failed", "error");
      }
    } catch {
      showToast("GitHub push failed. Check your connection.", "error");
    }
  }, [ydoc, roomId]);

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
    } catch (err) { showToast("Failed to start preview: " + (err instanceof Error ? err.message : "Unknown error"), "error"); }
    finally { setIsPreviewLoading(false); }
  }, [ydoc]);

  const providerIcons: Record<string, string> = { openai: "🟢", anthropic: "🟠", google: "🔵", groq: "⚡", openrouter: "🌐", nvidia: "🟩" };

  return (
    <div className="ide-layout">
      <header className="topbar">
        <div className="topbar-logo">
          <div className="topbar-logo-icon">⚡</div>
          <span>Ultimate Vibe Coder</span>
        </div>
        <div className="topbar-right">
          <div className="status-indicator">
            <div className={`status-dot ${connected ? "status-dot-connected" : "status-dot-connecting"}`} />
            <span>{connected ? "Connected" : "Connecting..."}</span>
          </div>
          <button className="btn btn-ghost btn-sm" onClick={handleDownloadCodebase} title="Download Codebase">📦</button>
          <button className="btn btn-ghost btn-sm" onClick={handleGitPush} title="Push to GitHub">🐙</button>
          <button className="btn btn-ghost btn-sm" onClick={() => setShowSettings(true)} title="Project Settings">⚙️</button>
          <span
            className="room-id-copy"
            onClick={() => { navigator.clipboard.writeText(roomId); showToast("Room ID copied!", "success"); }}
            title="Click to copy"
          >
            {roomId} <span style={{ fontSize: "10px", opacity: 0.5 }}>📋</span>
          </span>
        </div>
      </header>

      <div className="ide-body">
        {/* Left Sidebar */}
        <div className="ide-sidebar">
          {[
            { icon: "📁", label: "Files", action: () => setShowLeftPanel(true) },
            { icon: "💬", label: "Chat", action: () => setRightTab("chat") },
            { icon: "🎨", label: "Artist", action: () => setShowArtistMode(true) },
            { icon: "🔍", label: "Search" },
            { icon: "📦", label: "Build History", action: () => setShowBuildHistory(true) },
            { icon: "⚙️", label: "Settings", action: () => setShowSettings(true) },
          ].map((item) => (
            <button key={item.label} className="btn btn-ghost btn-sm sidebar-btn" title={item.label} onClick={item.action}>
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
                  <div style={{ display: "flex", gap: "4px" }}>
                    <button className="btn btn-ghost btn-sm" onClick={() => {
                      const name = prompt("File name (e.g. app.js, style.css, index.html):");
                      if (!name) return;
                      const path = name;
                      if (ydoc) { const yf = ydoc.getMap("files"); ydoc.transact(() => { yf.set(path, ""); }); }
                      setActiveFile(path);
                    }} title="Add file">+</button>
                    <button className="btn btn-ghost btn-sm" onClick={() => setShowLeftPanel(false)}>✕</button>
                  </div>
                </div>
                <div className="ide-panel-body">
                  {files.map((file) => (
                    <div key={file.path} className={`file-tree-item ${activeFile === file.path ? "active" : ""}`} onClick={() => handleFileSelect(file.path)}>
                      <span className="file-icon">
                        {file.name.endsWith(".html") ? "🌐" : file.name.endsWith(".css") ? "🎨" : file.name.endsWith(".js") ? "📜" : file.name.endsWith(".json") ? "📋" : "📄"}
                      </span>
                      <span>{file.name}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="resize-handle" onMouseDown={(e) => handleResizeStart(e, "left")} />
            </div>
          )}

          {/* Editor */}
          <div className="ide-panel" style={{ flex: 1 }}>
            <div className="ide-panel-header">
              <span className="ide-panel-title">{activeFile}</span>
              <span className="badge badge-blue">{activeFile.split(".").pop()?.toUpperCase() || "TXT"}</span>
            </div>
            <div className="ide-panel-body">
              <textarea
                value={code}
                onChange={(e) => handleCodeChange(e.target.value)}
                style={{ width: "100%", height: "100%", border: "none", outline: "none", resize: "none", fontFamily: "var(--font-mono)", fontSize: "var(--font-size-sm)", lineHeight: 1.7, padding: "var(--space-lg)", background: "var(--bg-primary)", color: "var(--text-primary)", tabSize: 2 }}
                spellCheck={false}
              />
            </div>
          </div>

          {/* Preview */}
          <div className="ide-panel" style={{ flex: 1 }}>
            <div className="ide-panel-header">
              <span className="ide-panel-title">Preview</span>
              <div className="preview-toolbar">
                <div className="preview-device-toggle">
                  <button className={previewDevice === "desktop" ? "active" : ""} onClick={() => setPreviewDevice("desktop")} title="Desktop">🖥</button>
                  <button className={previewDevice === "tablet" ? "active" : ""} onClick={() => setPreviewDevice("tablet")} title="Tablet">📱</button>
                  <button className={previewDevice === "mobile" ? "active" : ""} onClick={() => setPreviewDevice("mobile")} title="Mobile">📲</button>
                </div>
                <button className="btn btn-ghost btn-sm" onClick={handleStartPreview} disabled={isPreviewLoading}>
                  {isPreviewLoading ? "..." : "▶ Run"}
                </button>
                <button
                  className={`btn btn-sm ${editMode ? "btn-primary" : "btn-ghost"}`}
                  onClick={() => setEditMode(!editMode)}
                  title="Toggle Design Edit Mode"
                >
                  Design Edit
                </button>
              </div>
            </div>
            <div className="ide-panel-body preview-body">
              {editMode ? (
                <div style={{ display: "flex", flexDirection: "column", height: "100%", padding: "var(--space-md)", overflow: "auto", background: "var(--bg-secondary)" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "var(--space-sm)" }}>
                    <span style={{ fontSize: "var(--font-size-sm)", fontWeight: 600, color: "var(--text-primary)" }}>Design Edit Mode</span>
                    <button className="btn btn-ghost btn-sm" onClick={() => setEditMode(false)}>✕ Close</button>
                  </div>
                  <div style={{ marginBottom: "var(--space-sm)" }}>
                    <div style={{ fontSize: "var(--font-size-xs)", fontWeight: 600, color: "var(--text-secondary)", marginBottom: "var(--space-xs)" }}>Add New Element</div>
                    <div style={{ display: "flex", gap: "var(--space-sm)" }}>
                      <input type="text" placeholder='<button class="btn">Click me</button>' value={newElementHtml} onChange={(e) => setNewElementHtml(e.target.value)} style={{ flex: 1, padding: "var(--space-sm)", borderRadius: "var(--radius-sm)", border: "1px solid var(--border-primary)", fontFamily: "var(--font-mono)", fontSize: "var(--font-size-xs)", background: "var(--bg-primary)", color: "var(--text-primary)" }} />
                      <button className="btn btn-primary btn-sm" onClick={() => { if (newElementHtml.trim()) { handleAddElement(newElementHtml.trim()); setNewElementHtml(""); } }}>Add</button>
                    </div>
                  </div>
                  <div style={{ fontSize: "var(--font-size-xs)", fontWeight: 600, color: "var(--text-secondary)", marginBottom: "var(--space-xs)" }}>Elements in Code</div>
                  <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-xs)" }}>
                    {parseElements(code).map((el, i) => (
                      <div key={i} style={{ display: "flex", alignItems: "center", gap: "var(--space-sm)", padding: "var(--space-sm)", background: editingElement?.index === el.index ? "var(--accent-subtle, #eef2ff)" : "var(--bg-primary)", borderRadius: "var(--radius-sm)", border: "1px solid var(--border-primary)" }}>
                        <span style={{ fontSize: "var(--font-size-xs)", fontWeight: 600, fontFamily: "var(--font-mono)", color: "var(--text-tertiary)", minWidth: 50 }}>{el.tag}</span>
                        <span style={{ flex: 1, fontSize: "var(--font-size-xs)", color: "var(--text-secondary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{el.content || "(empty)"}</span>
                        <button className="btn btn-ghost btn-sm" onClick={() => setEditingElement(editingElement?.index === el.index ? null : { outerHTML: el.outerHTML, index: el.index })} style={{ fontSize: "10px", padding: "2px 8px" }}>Edit</button>
                      </div>
                    ))}
                    {parseElements(code).length === 0 && (
                      <div style={{ fontSize: "var(--font-size-xs)", color: "var(--text-tertiary)", textAlign: "center", padding: "var(--space-lg)" }}>No HTML elements found. Add code above or use the AI Assistant to generate code.</div>
                    )}
                  </div>
                  {editingElement && (
                    <div style={{ marginTop: "var(--space-sm)", padding: "var(--space-sm)", background: "var(--bg-primary)", borderRadius: "var(--radius-sm)", border: "1px solid var(--border-primary)" }}>
                      <div style={{ fontSize: "var(--font-size-xs)", fontWeight: 600, marginBottom: "var(--space-xs)", color: "var(--text-secondary)" }}>Edit Element HTML</div>
                      <textarea defaultValue={editingElement.outerHTML} style={{ width: "100%", minHeight: 80, padding: "var(--space-sm)", borderRadius: "var(--radius-sm)", border: "1px solid var(--border-primary)", fontFamily: "var(--font-mono)", fontSize: "var(--font-size-xs)", background: "var(--bg-secondary)", color: "var(--text-primary)", resize: "vertical" }} id="edit-element-textarea" />
                      <div style={{ display: "flex", gap: "var(--space-sm)", marginTop: "var(--space-xs)" }}>
                        <button className="btn btn-primary btn-sm" onClick={() => { const ta = document.getElementById("edit-element-textarea") as HTMLTextAreaElement; if (ta) handleEditElement(editingElement.outerHTML, ta.value); }}>Save</button>
                        <button className="btn btn-secondary btn-sm" onClick={() => setEditingElement(null)}>Cancel</button>
                      </div>
                    </div>
                  )}
                </div>
              ) : previewUrl ? (
                <div className={`preview-frame-wrapper preview-${previewDevice}`}>
                  <div className="preview-url-bar">
                    <span className="preview-url-dot" />
                    <span className="preview-url-dot" />
                    <span className="preview-url-dot" />
                    <span className="preview-url-text">{previewUrl}</span>
                  </div>
                  <iframe src={previewUrl} className="preview-frame" title="Preview" />
                </div>
              ) : (
                <div className="empty-state">
                  <div className="empty-state-icon">▶️</div>
                  <div className="empty-state-title">Live Preview</div>
                  <div className="empty-state-desc">Click "Run" to start the dev server and see your app live.</div>
                </div>
              )}
            </div>
          </div>

          {/* Right Panel */}
          <div className="resize-handle" onMouseDown={(e) => handleResizeStart(e, "right")} style={{ position: "absolute", right: rightPanelWidth, top: 0, bottom: 0, zIndex: 10 }} />
          <div className="ide-right-panel" style={{ width: rightPanelWidth }}>
            <div className="ide-right-tabs">
              <button className={`ide-right-tab ${rightTab === "ai" ? "active" : ""}`} onClick={() => setRightTab("ai")}>AI Assistant</button>
              <button className={`ide-right-tab ${rightTab === "chat" ? "active" : ""}`} onClick={() => setRightTab("chat")}>Chat</button>
              <button className="btn btn-ghost btn-sm" onClick={() => setShowMemoryPanel(!showMemoryPanel)} title="Memory Panel" style={{ marginLeft: "auto" }}>📚</button>
            </div>

            {/* Agent Team Picker */}
            <div style={{ padding: "var(--space-sm) var(--space-md)", borderBottom: "1px solid var(--border-primary)", display: "flex", gap: "var(--space-xs)", flexWrap: "wrap" }}>
              {AGENT_TEAM.map((agent) => (
                <button
                  key={agent.id}
                  className={`btn btn-sm ${selectedAgent === agent.id ? "btn-primary" : "btn-ghost"}`}
                  onClick={() => {
                    setSelectedAgent(agent.id);
                    setAiProvider(agent.defaultProvider as any);
                    setAiModel(agent.defaultModel);
                  }}
                  style={{ borderColor: agent.color, color: selectedAgent === agent.id ? "white" : agent.color }}
                  title={`${agent.name} — ${agent.description}`}
                >
                  {agent.icon} {agent.name}
                </button>
              ))}
            </div>

            {/* Memory Panel */}
            {showMemoryPanel && (
              <div style={{ padding: "var(--space-md)", borderBottom: "1px solid var(--border-primary)", background: "var(--bg-tertiary)", maxHeight: 300, overflow: "auto" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "var(--space-sm)" }}>
                  <div style={{ fontSize: "var(--font-size-xs)", fontWeight: 600, color: "var(--text-primary)" }}>Agent Memories ({agentMemories.length})</div>
                  <button className="btn btn-ghost btn-sm" onClick={() => setShowMemoryPanel(false)}>✕</button>
                </div>
                {agentMemories.length === 0 ? (
                  <div style={{ fontSize: "var(--font-size-xs)", color: "var(--text-tertiary)", textAlign: "center", padding: "var(--space-lg)" }}>
                    No memories yet. Chat with agents to build memory.
                  </div>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-xs)" }}>
                    {agentMemories.slice(0, 15).map((mem) => {
                      const config = getAgentConfig(mem.agent_role);
                      return (
                        <div key={mem.id} style={{ padding: "var(--space-sm)", background: "var(--bg-primary)", borderRadius: "var(--radius-sm)", border: "1px solid var(--border-primary)", fontSize: "var(--font-size-xs)" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: "var(--space-xs)", marginBottom: "var(--space-xs)" }}>
                            <span style={{ fontSize: "var(--font-size-sm)" }}>{config.icon}</span>
                            <span style={{ fontWeight: 600, color: config.color }}>{config.name}</span>
                            <span className="badge" style={{ background: config.color, fontSize: "8px", padding: "1px 6px", borderRadius: "var(--radius-sm)" }}>{mem.memory_type}</span>
                            <span style={{ marginLeft: "auto", color: "var(--text-tertiary)" }}>
                              {'★'.repeat(mem.importance)}{'☆'.repeat(10 - mem.importance)}
                            </span>
                          </div>
                          <div style={{ color: "var(--text-secondary)", whiteSpace: "pre-wrap", wordBreak: "break-word" }}>
                            {mem.content.slice(0, 200)}{mem.content.length > 200 ? "..." : ""}
                          </div>
                          <div style={{ marginTop: "var(--space-xs)", fontSize: "10px", color: "var(--text-tertiary)" }}>
                            {new Date(mem.created_at).toLocaleString()}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {rightTab === "ai" ? (
              <div className="ai-panel">
                <ThinkingPanel steps={orchestratorSteps} isVisible={showOrchestrator} />
                <ContextAttachments
                  files={contextFiles}
                  onRemove={(path) => setContextFiles((prev) => prev.filter((f) => f.path !== path))}
                />
                {showKeyInput && (
                  <div className="api-key-section">
                    <div style={{ fontSize: "var(--font-size-xs)", fontWeight: 600, marginBottom: "var(--space-sm)", color: "var(--text-secondary)" }}>API Configuration</div>
                    <div style={{ display: "flex", gap: "var(--space-sm)", marginBottom: "var(--space-sm)" }}>
                      <select value={aiProvider} onChange={(e) => setAiProvider(e.target.value as any)} className="api-select">
                        <option value="openai">🟢 OpenAI</option>
                        <option value="anthropic">🟠 Anthropic</option>
                        <option value="google">🔵 Google</option>
                        <option value="groq">⚡ Groq</option>
                        <option value="openrouter">🌐 OpenRouter</option>
                        <option value="nvidia">🟩 NVIDIA</option>
                      </select>
                      <input type="text" placeholder="Model" value={aiModel} onChange={(e) => setAiModel(e.target.value)} className="api-input" />
                    </div>
                    <div style={{ position: "relative" }}>
                      <input type={showKey ? "text" : "password"} placeholder="Enter your API key..." value={k} onChange={(e) => { const keyVal = e.target.value; setK(keyVal); const detected = detectProvider(keyVal); if (detected) { setDetectedProvider(detected); setAiProvider(detected as any); setAiModel(PROVIDER_DEFAULT_MODELS[detected] || "gpt-4o-mini"); } else { setDetectedProvider(null); } }} className="api-input" style={{ paddingRight: 40 }} />
                      <button
                        onClick={() => setShowKey(!showKey)}
                        style={{ position: "absolute", right: 8, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", fontSize: "var(--font-size-sm)", opacity: 0.5 }}
                      >
                        {showKey ? "🙈" : "👁"}
                      </button>
                    </div>
                    {detectedProvider && (
                      <div style={{ fontSize: "var(--font-size-xs)", color: "var(--text-tertiary)", marginTop: "var(--space-xs)" }}>Detected: {providerIcons[detectedProvider] || "🔑"} {detectedProvider.charAt(0).toUpperCase() + detectedProvider.slice(1)}</div>
                    )}
                    <div className="api-links">
                      <a href="https://console.groq.com/keys" target="_blank" rel="noopener noreferrer">⚡ Groq →</a>
                      <a href="https://openrouter.ai/workspaces/default/keys" target="_blank" rel="noopener noreferrer">🌐 OpenRouter →</a>
                      <a href="https://build.nvidia.com/meta/llama-3.2-90b-vision-instruct" target="_blank" rel="noopener noreferrer">🟩 NVIDIA →</a>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "var(--space-sm)" }}>
                      <label style={{ display: "flex", alignItems: "center", gap: "var(--space-xs)", fontSize: "var(--font-size-xs)", color: "var(--text-secondary)", cursor: "pointer" }}>
                        <input type="checkbox" checked={aiMode === "agent"} onChange={(e) => setAiMode(e.target.checked ? "agent" : "chat")} />
                        Agent Mode
                      </label>
                      <label style={{ display: "flex", alignItems: "center", gap: "var(--space-xs)", fontSize: "var(--font-size-xs)", color: orchestratorMode ? "var(--accent-blue, #4f46e5)" : "var(--text-secondary)", cursor: "pointer", fontWeight: orchestratorMode ? 600 : 400 }}>
                        <input type="checkbox" checked={orchestratorMode} onChange={(e) => setOrchestratorMode(e.target.checked)} />
                        🧠 Orchestrator
                      </label>
                      <button className="btn btn-ghost btn-sm" onClick={() => setShowKeyInput(false)}>Hide</button>
                    </div>
                  </div>
                )}

                {!showKeyInput && (
                  <div style={{ padding: "var(--space-sm) var(--space-md)", display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid var(--border-primary)" }}>
                    <span style={{ fontSize: "var(--font-size-xs)", color: "var(--text-tertiary)" }}>{providerIcons[aiProvider]} {aiProvider} · {aiModel} · {aiMode === "agent" ? "🤖 Agent" : "💬 Chat"}</span>
                    <button className="btn btn-ghost btn-sm" onClick={() => setShowKeyInput(true)}>⚙️</button>
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
                      <div className="loading-dots" style={{ color: "var(--text-tertiary)" }}>
                        Thinking<span>.</span><span>.</span><span>.</span>
                      </div>
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
      </div>

      {showArtistMode && <ArtistMode onClose={() => setShowArtistMode(false)} onSendToAI={(prompt, dataUrl) => {
        setShowArtistMode(false);
        setRightTab("ai");
        const msg = prompt || "I drew a UI sketch. Please generate this as a complete, polished web application with Apple-level UI/UX design.";
        setAiInput(msg);
        // Auto-submit after state update
        setTimeout(() => {
          dispatchEvent(new CustomEvent("artist-sketch-send", { detail: msg }));
        }, 100);
      }} />}

      {/* Version History */}
      <VersionHistory
        versions={versionHistory}
        onRestore={(version) => {
          showToast(`Restored: ${version.description}`, "success");
        }}
      />

      {/* Build History Modal */}
      {showBuildHistory && (
        <div className="modal-overlay" onClick={() => setShowBuildHistory(false)}>
          <div className="modal-content" style={{ maxWidth: 700, width: "90%" }} onClick={(e) => e.stopPropagation()}>
            <div style={{ 
              display: "flex", 
              justifyContent: "space-between", 
              alignItems: "center", 
              padding: "var(--space-lg)",
              borderBottom: "1px solid var(--border-primary)"
            }}>
              <h3 style={{ 
                fontFamily: "var(--font-serif)",
                fontSize: "var(--font-size-xl)", 
                fontWeight: 400,
                color: "var(--text-primary)",
                margin: 0 
              }}>
                📦 Build History
              </h3>
              <button
                className="btn btn-ghost btn-sm"
                onClick={() => setShowBuildHistory(false)}
              >
                ✕ Close
              </button>
            </div>
            <BuildHistory
              roomId={roomId}
              onSelectVersion={(version, files) => {
                // Restore files from build
                const yFiles = ydoc?.getMap("files");
                if (yFiles) {
                  Object.entries(files).forEach(([path, content]) => {
                    yFiles.set(path, content);
                  });
                }
                showToast(`Restored to version ${version}`, "success");
                setShowBuildHistory(false);
              }}
            />
          </div>
        </div>
      )}

      {/* Project Settings */}
      {showSettings && projectConfig && (
        <ProjectSettingsPanel
          settings={projectConfig}
          onClose={() => setShowSettings(false)}
          onSave={(config) => {
            setProjectConfig(config);
            setShowSettings(false);
            showToast("Settings saved!", "success");
          }}
        />
      )}
    </div>
  );
}
