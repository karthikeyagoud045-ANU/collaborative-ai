import { supabase } from "./supabase-client";

export type AgentRole = "coder" | "reviewer" | "architect" | "debugger" | "memory_manager" | "ui-designer";
export type MemoryType = "fact" | "decision" | "learning" | "preference" | "error";

export interface AgentMemory {
  id: string;
  room_id: string;
  agent_role: AgentRole;
  memory_type: MemoryType;
  content: string;
  importance: number;
  metadata: Record<string, unknown>;
  session_id?: string;
  created_at: string;
}

export interface MemoryFilter {
  roomId: string;
  agentRole?: AgentRole;
  memoryType?: MemoryType;
  minImportance?: number;
  limit?: number;
  sessionId?: string;
}

export async function listAgentMemories(filter: MemoryFilter): Promise<AgentMemory[]> {
  let query = supabase
    .from("agent_memories")
    .select("*")
    .eq("room_id", filter.roomId)
    .order("importance", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(filter.limit || 50);

  if (filter.agentRole) query = query.eq("agent_role", filter.agentRole);
  if (filter.memoryType) query = query.eq("memory_type", filter.memoryType);
  if (filter.minImportance) query = query.gte("importance", filter.minImportance);
  if (filter.sessionId) query = query.eq("session_id", filter.sessionId);

  const { data, error } = await query;
  if (error) {
    console.error("Memory fetch failed:", error);
    return [];
  }
  return data as AgentMemory[];
}

export async function createAgentMemory(
  roomId: string,
  agentRole: AgentRole,
  memoryType: MemoryType,
  content: string,
  importance: number = 5,
  metadata: Record<string, unknown> = {},
  sessionId?: string
): Promise<AgentMemory | null> {
  const { data, error } = await supabase
    .from("agent_memories")
    .insert({
      room_id: roomId,
      agent_role: agentRole,
      memory_type: memoryType,
      content,
      importance: Math.max(1, Math.min(10, importance)),
      metadata,
      session_id: sessionId || null,
    })
    .select()
    .single();
  if (error) {
    console.error("Memory creation failed:", error);
    return null;
  }
  return data as AgentMemory;
}

export async function searchMemories(roomId: string, query: string, limit: number = 10): Promise<AgentMemory[]> {
  const { data, error } = await supabase.rpc("search_agent_memories", {
    p_room_id: roomId,
    p_query: query,
    p_limit: limit,
  });
  if (error) {
    console.error("Memory search failed:", error);
    return [];
  }
  return data as AgentMemory[];
}

export async function deleteAgentMemory(id: string): Promise<boolean> {
  const { error } = await supabase.from("agent_memories").delete().eq("id", id);
  return !error;
}

export async function clearRoomMemories(roomId: string): Promise<boolean> {
  const { error } = await supabase.from("agent_memories").delete().eq("room_id", roomId);
  return !error;
}

export function buildMemoryContext(memories: AgentMemory[]): string {
  if (memories.length === 0) return "";
  const lines = memories.map((m) => `[${m.agent_role}/${m.memory_type}] ${m.content}`);
  return `## Project Memory (learned across sessions):\n${lines.join("\n")}\n`;
}

export interface AgentConfig {
  id: AgentRole;
  name: string;
  icon: string;
  systemPrompt: string;
  defaultModel: string;
  defaultProvider: string;
  color: string;
  description: string;
}

export const AGENT_TEAM: AgentConfig[] = [
  {
    id: "ui-designer",
    name: "Designer",
    icon: "🎨",
    systemPrompt: "You are a world-class UI/UX designer who designs at the level of Apple, Linear, and Vercel. You think about: visual hierarchy, whitespace rhythm (4/8/12/16/24/32/48px scale), typography (system fonts, precise sizes), color systems (HSL, semantic tokens), micro-interactions, accessibility, responsive design, and emotional impact. Always output design tokens, specific CSS values, and explain your reasoning.",
    defaultModel: "llama-3.3-70b-versatile",
    defaultProvider: "groq",
    color: "var(--accent-pink, #ec4899)",
    description: "Apple-level UI/UX design",
  },
  {
    id: "coder",
    name: "Coder",
    icon: "💻",
    systemPrompt: "You are a skilled full-stack developer. Write clean, well-structured code. Focus on implementation details, best practices, and maintainability.",
    defaultModel: "llama-3.3-70b-versatile",
    defaultProvider: "groq",
    color: "var(--accent-blue, #4f46e5)",
    description: "Expert implementation specialist",
  },
  {
    id: "reviewer",
    name: "Reviewer",
    icon: "🔍",
    systemPrompt: "You are a meticulous code reviewer. Analyze code for bugs, security issues, performance problems, and style violations. Provide actionable feedback with specific line references.",
    defaultModel: "llama-3.3-70b-versatile",
    defaultProvider: "groq",
    color: "var(--accent-green, #059669)",
    description: "Quality assurance & code review",
  },
  {
    id: "architect",
    name: "Architect",
    icon: "🏗️",
    systemPrompt: "You are a software architect. Think about system design, scalability, patterns, and trade-offs. Suggest structural improvements and identify architectural anti-patterns.",
    defaultModel: "claude-3-5-haiku-20241022",
    defaultProvider: "anthropic",
    color: "var(--accent-amber, #d97706)",
    description: "System design & architecture",
  },
  {
    id: "debugger",
    name: "Debugger",
    icon: "🐛",
    systemPrompt: "You are an expert debugger. Help users find and fix bugs quickly. Ask targeted questions, suggest diagnostic steps, and propose fixes with explanations.",
    defaultModel: "llama-3.3-70b-versatile",
    defaultProvider: "groq",
    color: "var(--accent-red, #dc2626)",
    description: "Bug finding & fixing specialist",
  },
  {
    id: "memory_manager",
    name: "Librarian",
    icon: "📚",
    systemPrompt: "You are a knowledge manager. Track decisions, preferences, and important notes across sessions. Summarize context and surface relevant memories when needed.",
    defaultModel: "gpt-4o-mini",
    defaultProvider: "openai",
    color: "var(--accent-purple, #7c3aed)",
    description: "Context & memory management",
  },
];

export function getAgentConfig(role: AgentRole): AgentConfig {
  return AGENT_TEAM.find((a) => a.id === role) || AGENT_TEAM[0];
}