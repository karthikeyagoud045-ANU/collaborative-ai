import * as Y from "yjs";
import { AgentToolCall, AgentToolResult, AgentToolContext, executeTool } from "./agent-tools";
import { showToast } from "@/hooks/useToast";
import { AGENT_MAX_ITERATIONS, APPROVAL_TIMEOUT_MS } from "./constants";

export interface AgentLoopCallbacks {
  onThought: (thought: string) => void;
  onToolCall: (call: AgentToolCall) => void;
  onToolResult: (result: AgentToolResult) => void;
  onProgress: (text: string) => void;
  onError: (error: string) => void;
  onAwaitingApproval?: (actionId: string) => void;
}

export interface AgentLoopOptions {
  prompt: string;
  apiKey: string;
  provider: "openai" | "anthropic" | "google" | "groq" | "openrouter" | "nvidia";
  model: string;
  systemContext: string;
  ragContext?: string;
  ydoc: Y.Doc;
  files: Y.Map<unknown>;
  pendingAgentActions: Y.Map<unknown>;
  userId: string;
  callbacks: AgentLoopCallbacks;
}

function isQueuedForApproval(result: AgentToolResult): boolean {
  return result.output.startsWith("ACTION_QUEUED:");
}

function extractActionId(output: string): string {
  const parts = output.split(":");
  return parts[2] || "";
}

function waitForApproval(
  pendingAgentActions: Y.Map<unknown>,
  actionId: string
): Promise<boolean> {
  return new Promise((resolve) => {
    let resolved = false;

    const cleanup = () => {
      resolved = true;
      pendingAgentActions.unobserve(observer);
    };

    const checkStatus = () => {
      if (resolved) return;
      const action = pendingAgentActions.get(actionId) as Y.Map<string> | undefined;
      if (!action) { cleanup(); resolve(false); return; }
      const status = action.get("status");
      if (status === "approved") { cleanup(); resolve(true); }
      else if (status === "rejected") { cleanup(); resolve(false); }
    };

    const observer = () => checkStatus();
    pendingAgentActions.observe(observer);
    setTimeout(() => { if (!resolved) { cleanup(); resolve(false); } }, APPROVAL_TIMEOUT_MS);
    checkStatus();
  });
}

async function executeToolWithHITL(
  call: AgentToolCall,
  context: AgentToolContext,
  callbacks: AgentLoopCallbacks
): Promise<AgentToolResult> {
  const result = await executeTool(call, context);

  if (isQueuedForApproval(result)) {
    const actionId = extractActionId(result.output);
    callbacks.onAwaitingApproval?.(actionId);
    const approved = await waitForApproval(context.pendingAgentActions, actionId);

    if (approved) {
      const action = context.pendingAgentActions.get(actionId) as Y.Map<string>;
      if (!action) {
        return { id: call.id, name: call.name, output: "Error: Action not found", success: false };
      }
      const type = action.get("type") as string | undefined;
      const target = action.get("target") as string | undefined;
      const proposedContent = action.get("proposedContent") as string | undefined;
      if (!type || !target || !proposedContent) {
        context.pendingAgentActions.delete(actionId);
        showToast("Invalid action data for approved action.", "error");
        return { id: call.id, name: call.name, output: "Error: Invalid action data", success: false };
      }
      try {
        if (type === "write_file") {
          const pathParts = target.split("/").filter(Boolean);
          let current: Y.Map<unknown> = context.files;
          for (let i = 0; i < pathParts.length - 1; i++) {
            const part = current.get(pathParts[i]);
            if (!(part instanceof Y.Map)) {
              const newMap = new Y.Map();
              current.set(pathParts[i], newMap);
              current = newMap;
            } else {
              current = part;
            }
          }
          current.set(pathParts[pathParts.length - 1], proposedContent);
          context.pendingAgentActions.delete(actionId);
          return { id: call.id, name: call.name, output: `File "${target}" written successfully after approval.`, success: true };
        } else if (type === "run_terminal") {
          const { executeCommand } = await import("./webcontainer");
          const cmd = proposedContent.split(/\s+/);
          const execResult = await executeCommand(cmd, { timeoutMs: 30000 });
          context.pendingAgentActions.delete(actionId);
          const output = execResult.exitCode === 0
            ? execResult.stdout
            : `Exit code: ${execResult.exitCode}\nstdout:\n${execResult.stdout}\nstderr:\n${execResult.stderr}`;
          return { id: call.id, name: call.name, output, success: true };
        }
      } catch (err) {
        context.pendingAgentActions.delete(actionId);
        showToast(`Execution failed: ${err instanceof Error ? err.message : "Unknown error"}`, "error");
        return { id: call.id, name: call.name, output: `Execution failed after approval: ${err instanceof Error ? err.message : "Unknown error"}`, success: false };
      }
    } else {
      context.pendingAgentActions.delete(actionId);
      showToast(`Agent action ${call.name} rejected or timed out.`, "warning");
      return { id: call.id, name: call.name, output: `ACTION_REJECTED: The user rejected the ${call.name} action. Please try a different approach or stop.`, success: false };
    }
  }
  return result;
}

function parseToolCallsFromResponse(response: string): AgentToolCall[] {
  const calls: AgentToolCall[] = [];
  const jsonMatch = response.match(/```json\n([\s\S]*?)\n```/);
  if (jsonMatch) {
    try {
      const parsed = JSON.parse(jsonMatch[1]);
      if (Array.isArray(parsed)) return parsed;
    } catch { /* not valid JSON */ }
  }
  const functionRegex = /\{"name"\s*:\s*"(write_file|read_file|run_terminal)",\s*"arguments"\s*:\s*\{([^}]*)\}\}/g;
  let match;
  while ((match = functionRegex.exec(response)) !== null) {
    try {
      const args = JSON.parse(`{${match[2]}}`);
      calls.push({ id: `call-${Date.now()}-${Math.random().toString(36).slice(2)}`, name: match[1] as AgentToolCall["name"], arguments: args });
    } catch { /* skip invalid */ }
  }
  return calls;
}

async function callLLM(
  apiKey: string, provider: string, model: string,
  messages: Array<{ role: string; content: string }>
): Promise<string> {
  const systemPrompt = messages.find((m) => m.role === "system")?.content || "";
  const userContent = messages.filter((m) => m.role !== "system").map((m) => m.content).join("\n\n");
  const res = await fetch("/api/ai", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ prompt: userContent, code: systemPrompt, apiKey, provider, model }),
  });
  if (!res.ok) throw new Error(`LLM call failed: ${res.status}`);
  const reader = res.body?.getReader();
  if (!reader) throw new Error("No reader");
  const decoder = new TextDecoder();
  let fullText = "";
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    const chunk = decoder.decode(value, { stream: true });
    for (const line of chunk.split("\n")) {
      if (line.startsWith("data: ")) {
        try {
          const data = JSON.parse(line.slice(6));
          if (data.type === "chunk" && data.content) fullText += data.content;
        } catch { /* skip */ }
      }
    }
  }
  return fullText;
}

export async function runAgentLoop(options: AgentLoopOptions): Promise<string> {
  const { prompt, apiKey, provider, model, systemContext, ragContext, ydoc, files, pendingAgentActions, userId, callbacks } = options;
  const context: AgentToolContext = { ydoc, files, pendingAgentActions, userId };
  const ragBlock = ragContext ? `\n\n## Relevant Files (auto-detected):\n${ragContext}` : "";
  const messages: Array<{ role: string; content: string }> = [
    { role: "system", content: `${systemContext}${ragBlock}\n\nYou are an autonomous coding agent with HITL (Human-in-the-Loop) safety. You can write files, read files, and run terminal commands. When the user asks you to do something, use the available tools to accomplish it. Return your final answer as plain text after completing the task. If you need to run code or fix bugs, use the tools and explain what you did. NOTE: write_file and run_terminal actions require human approval. If an action is rejected, try a different approach.` },
    { role: "user", content: prompt },
  ];
  let iterations = 0;
  while (iterations < AGENT_MAX_ITERATIONS) {
    iterations++;
    callbacks.onThought(`Iteration ${iterations}/${AGENT_MAX_ITERATIONS}`);
    const response = await callLLM(apiKey, provider, model, messages);
    callbacks.onProgress(response);
    const toolCalls = parseToolCallsFromResponse(response);
    if (toolCalls.length === 0) return response;
    for (const call of toolCalls) {
      callbacks.onToolCall(call);
      const result = await executeToolWithHITL(call, context, callbacks);
      callbacks.onToolResult(result);
      messages.push({ role: "assistant", content: JSON.stringify({ tool_call: call }) });
      messages.push({ role: "user", content: `Tool result for ${call.name}:\n${result.output}` });
    }
  }
  return `Agent completed after ${AGENT_MAX_ITERATIONS} iterations. Check the tool execution log above for details.`;
}
