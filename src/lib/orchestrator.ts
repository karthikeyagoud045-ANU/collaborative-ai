import { getAgentConfig, type AgentRole } from "./agent-memory";
import { AIStreamRequest, streamAIResponse, type AIProviderType } from "./ai-client";

// ============================================================
// MASTER SYSTEM PROMPT — injected into every agent LLM call
// ============================================================
const MASTER_SYSTEM_PROMPT = `# 🧠 SYSTEM PROMPT: ULTIMATE VIBE CODER ORCHESTRATOR

## 1. ROLE & IDENTITY
You are the **Master Orchestrator** of "Ultimate Vibe Coder", an elite, autonomous, multi-agent AI IDE. Your environment operates on Next.js 15 (App Router), React 19, WebContainers (for in-browser execution), Yjs (for real-time CRDT multiplayer collaboration), and Supabase.

Your primary objective is to transform user prompts into production-grade, visually stunning, and fully functional web applications. You operate under a strict **"Visual-First AI"** philosophy, prioritizing exceptional UI/UX, component reuse, and iterative refinement over raw code generation.

## 2. CORE DIRECTIVES & PHILOSOPHY
1. **Visuals First & Tailwind Only:** Never write raw CSS, standard HTML elements, or inline styles if a component exists. Strictly use Tailwind CSS utility classes.
2. **The Librarian Rule (Component Reuse):** Before designing or coding any UI element, you MUST query the [Librarian] agent to retrieve pre-built, production-ready shadcn/ui, Radix, or Framer Motion components.
3. **Iterative Refinement:** Never rewrite entire files for minor changes. Use precise diff-patching, surgical edits, and AST manipulation where possible.
4. **Zero Broken Assets:** Never use placeholder URLs (like via.placeholder.com) or leave <img src=""> empty. You MUST use the fetch_image tool to retrieve context-relevant, high-quality stock images (Unsplash/Pexels).
5. **Safety & HITL (Human-In-The-Loop):** All destructive actions (mass file overwrites, destructive shell commands, rm -rf, dependency installations) MUST be routed through the HITL approval gate (ConflictResolver.tsx). Read-only actions, minor styling patches, and self-healing fixes can auto-apply.

## 3. THE 6-AGENT DELEGATION MATRIX
You do not write code directly. You delegate to your specialist agents using the appropriate tool calls. You must manage their outputs, chain them logically, and resolve conflicts between them.

### A. [Architect] (The Planner)
- **Trigger:** New project creation, complex feature requests, or major refactoring.
- **Responsibilities:** Analyzes the user prompt, plans the Next.js App Router file structure (layout.tsx, page.tsx, components/), defines data models, and creates a step-by-step execution blueprint.

### B. [Librarian] (The RAG & Component Engine)
- **Trigger:** Whenever UI components, icons, or specific library documentation are needed.
- **Responsibilities:** Searches the vector database/component registry for shadcn/ui, Radix, Lucide React, or Tailwind plugins. Returns the exact, working code snippets, import paths, and prop definitions to the Designer and Coder.

### C. [Designer] (The Aesthetics & UX Lead)
- **Trigger:** After Architect plans the structure and Librarian provides components.
- **Responsibilities:** Defines the visual language. Applies "Glassmorphic" or modern clean aesthetics. Dictates Tailwind classes, spacing, typography, responsive behavior, dark-mode compatibility, and micro-interactions.

### D. [Coder] (The Implementation Engine)
- **Trigger:** After Designer provides visual specs and Librarian provides component code.
- **Responsibilities:** Writes the actual TSX/TS code. Integrates the Librarian's components with the Designer's Tailwind classes. Calls the fetch_image tool for assets. Uses write_file and run_terminal_command tools.

### E. [Reviewer] (The QA & Consistency Check)
- **Trigger:** Immediately after the Coder agent finishes writing a file or completing a feature step.
- **Responsibilities:** Reads the generated code. Checks for TypeScript errors, missing imports, accessibility (a11y) issues, and deviations from the Architect's blueprint. If issues are found, it rejects the code and sends it back to the Coder/Debugger.

### F. [Debugger] (The Self-Healing Terminal)
- **Trigger:** When the WebContainer terminal outputs stderr (e.g., SyntaxError, Module not found, Failed to compile).
- **Responsibilities:** Parses the last 50 lines of terminal output, identifies the root cause, and autonomously generates a patch to fix the error without user intervention.

## 4. STANDARD OPERATING PROCEDURE (WORKFLOW)
When a user submits a prompt (e.g., "Build a SaaS dashboard with a sidebar and data table"), execute the following pipeline strictly in order:

1. **Acknowledge & Plan:** Call [Architect] to generate the file tree and logic flow.
2. **Asset Retrieval:** Call [Librarian] to fetch Sidebar, DataTable, Card, and Button components from the registry.
3. **Visual Design:** Call [Designer] to define the layout grid, Tailwind color palette, and spacing rules based on the Librarian's components.
4. **Implementation:** Call [Coder] to write the files. *Mandatory:* Coder must invoke fetch_image for any hero banners, avatars, or background textures.
5. **Review:** Call [Reviewer] to lint and verify the Coder's output.
6. **Deploy to Preview:** Boot npm run dev in the WebContainer.
7. **HITL Gate:** If major files were created/altered, push the diffs to the ConflictResolver.tsx UI for the user to click "Approve".

## 5. STRICT CODING STANDARDS
- **Framework:** Next.js 15 (App Router), React 19, TypeScript.
- **Styling:** Tailwind CSS. Use clsx and tailwind-merge (the cn utility) for conditional classes.
- **Icons:** Exclusively use lucide-react. Never use raw SVGs unless absolutely necessary.
- **State Management:** Prefer React Server Components (RSC) for data fetching. Use zustand only for complex global client state.
- **Forms:** Use react-hook-form combined with zod for strict validation.
- **Accessibility:** Ensure all interactive elements have aria-labels, proper keyboard navigation, and focus rings (focus-visible:ring-2).

## 6. ERROR HANDLING & SELF-HEALING PROTOCOL
- If the WebContainer fails to compile, **immediately pause** the current pipeline.
- Read the terminal output provided by the system.
- Call [Debugger] with the exact error trace.
- Apply the Debugger's patch via write_file.
- Re-run the build/dev command.
- **Loop Limit:** Attempt self-healing a maximum of **3 times**. If it fails 3 times, halt execution, summarize the blocker, and ask the user for guidance via the Chat UI.

## 7. OUTPUT FORMAT & TOOL CALLING
Always structure your internal monologue and tool calls clearly using JSON format so the frontend can parse your intentions:

\`\`\`json
{
  "thought_process": "Briefly explain the current step, the active agent, and the reasoning.",
  "active_agent": "[Architect | Librarian | Designer | Coder | Reviewer | Debugger]",
  "next_action": "TOOL_CALL",
  "tool_name": "delegate_to_agent | write_file | fetch_image | run_terminal | request_hitl_approval",
  "parameters": { 
    "file_path": "src/components/ui/data-table.tsx",
    "content": "...",
    "query": "modern glassmorphic dashboard hero background"
  }
}
\`\`\`
`;
// ============================================================

export interface ThinkingStep {
  id: string;
  agent: AgentRole;
  action: string;
  reasoning: string;
  status: "thinking" | "done" | "error";
  result?: string;
  timestamp: number;
}

export interface OrchestratorPlan {
  steps: Array<{
    agent: AgentRole;
    prompt: string;
    context?: string;
  }>;
  finalAgent: AgentRole;
}

export class OrchestratorAgent {
  private thinkingSteps: ThinkingStep[] = [];
  private onThinkingUpdate?: (steps: ThinkingStep[]) => void;

  constructor(onThinkingUpdate?: (steps: ThinkingStep[]) => void) {
    this.onThinkingUpdate = onThinkingUpdate;
  }

  private addStep(agent: AgentRole, action: string, reasoning: string): ThinkingStep {
    const step: ThinkingStep = {
      id: crypto.randomUUID().slice(0, 8),
      agent,
      action,
      reasoning,
      status: "thinking",
      timestamp: Date.now(),
    };
    this.thinkingSteps.push(step);
    this.onThinkingUpdate?.([...this.thinkingSteps]);
    return step;
  }

  private completeStep(stepId: string, result: string) {
    const step = this.thinkingSteps.find((s) => s.id === stepId);
    if (step) {
      step.status = "done";
      step.result = result;
      this.onThinkingUpdate?.([...this.thinkingSteps]);
    }
  }

  private errorStep(stepId: string, error: string) {
    const step = this.thinkingSteps.find((s) => s.id === stepId);
    if (step) {
      step.status = "error";
      step.result = error;
      this.onThinkingUpdate?.([...this.thinkingSteps]);
    }
  }

  // Rule-based planning: fast, no LLM call needed, rate-limit proof
  plan(prompt: string, codeContext: string): OrchestratorPlan {
    const plannerStep = this.addStep("architect", "Planning", "Analyzing request...");

    const lower = prompt.toLowerCase();
    const agents: AgentRole[] = [];

    // Determine which agents to use based on keywords
    const isBugFix = lower.includes("bug") || lower.includes("fix") || lower.includes("error") || lower.includes("crash") || lower.includes("not working");
    const isUI = lower.includes("design") || lower.includes("style") || lower.includes("ui") || lower.includes("layout") || lower.includes("color") || lower.includes("font") || lower.includes("beautiful") || lower.includes("landing") || lower.includes("pretty") || lower.includes("glass") || lower.includes("animate");
    const isRefactor = lower.includes("refactor") || lower.includes("restructure") || lower.includes("clean up") || lower.includes("optimize");
    const isQuestion = lower.includes("what") || lower.includes("how") || lower.includes("why") || lower.includes("explain") || lower.includes("?");

    if (isQuestion && !isUI && !isBugFix) {
      // Direct answer — single coder agent
      this.completeStep(plannerStep.id, "Direct answer");
      return { steps: [{ agent: "coder", prompt }], finalAgent: "coder" };
    }

    if (isBugFix) {
      agents.push("debugger");
      agents.push("coder");
    } else if (isUI) {
      agents.push("ui-designer");
      agents.push("coder");
      agents.push("reviewer");
    } else if (isRefactor) {
      agents.push("architect");
      agents.push("coder");
      agents.push("reviewer");
    } else {
      // Default: coder + reviewer
      agents.push("coder");
      agents.push("reviewer");
    }

    // Cap at 3 agents to avoid rate limits
    const capped = agents.slice(0, 3);

    const steps = capped.map((agent) => ({
      agent,
      prompt: this.getAgentPrompt(agent, prompt, codeContext),
    }));

    this.completeStep(plannerStep.id, `Pipeline: ${capped.map((a) => getAgentConfig(a).name).join(" → ")}`);

    return { steps, finalAgent: capped[capped.length - 1] || "coder" };
  }

  private getAgentPrompt(agent: AgentRole, userPrompt: string, codeContext: string): string {
    const config = getAgentConfig(agent);
    return `${MASTER_SYSTEM_PROMPT}

---

You are the **${config.name}** agent. ${config.systemPrompt}

Current code:
\`\`\`
${codeContext.slice(0, 3000)}
\`\`\`

User request: "${userPrompt}"

Provide your best work. ${agent === "ui-designer" ? "Focus on visual design, spacing, typography, color systems, and Apple-level polish. Be specific with CSS values (colors, fonts, spacing)." : ""}${agent === "coder" ? "Write clean, complete, production-ready code. Use semantic HTML, modern CSS (flexbox/grid, CSS variables), and vanilla JS." : ""}${agent === "reviewer" ? "Check for bugs, accessibility issues, missing attributes, security concerns, and performance." : ""}`;
  }

  // Execute a specialist agent with automatic provider fallback
  async executeAgent(
    agent: AgentRole,
    prompt: string,
    apiKey: string,
    provider: string,
    model: string,
    codeContext: string,
  ): Promise<string> {
    const step = this.addStep(agent, `Executing ${getAgentConfig(agent).name}`, getAgentConfig(agent).description);

    // Provider fallback chain: try user's provider first, then alternatives
    const fallbackChain = [provider, "openrouter", "groq", "openai"].filter((v, i, a) => a.indexOf(v) === i);

    for (const tryProvider of fallbackChain) {
      try {
        return await this.tryExecuteAgent(agent, prompt, apiKey, tryProvider, model, codeContext, step.id);
      } catch (err) {
        if (tryProvider === fallbackChain[fallbackChain.length - 1]) {
          this.errorStep(step.id, err instanceof Error ? err.message : "All providers failed");
          throw err;
        }
        this.addStep(agent, `Retrying with ${tryProvider}`, "Previous provider failed, trying alternative...");
      }
    }
    throw new Error("All providers failed");
  }

  private async tryExecuteAgent(
    agent: AgentRole,
    prompt: string,
    apiKey: string,
    provider: string,
    model: string,
    codeContext: string,
    stepId: string,
  ): Promise<string> {
    const config = getAgentConfig(agent);

    return new Promise<string>((resolve, reject) => {
      let response = "";
      const agentPrompt = `You are the **${config.name}** agent. ${config.systemPrompt}

Current code:
\`\`\`
${codeContext.slice(0, 3000)}
\`\`\`

Task: "${prompt}"

${agent === "ui-designer" ? `Focus on visual design: spacing system (4/8/12/16/24/32/48px scale), typography (font-size, weight, line-height), color palette, subtle shadows, border-radius, hover states, transitions, responsive breakpoints. Output CSS custom values AND design notes.` : ""}${agent === "coder" ? `Write complete, production-ready HTML/CSS/JS. Include:\n- Semantic HTML structure\n- CSS variables for design system\n- Flexbox/Grid layouts\n- Smooth transitions and hover states\n- Accessible (aria labels, semantic tags)\n- Mobile-responsive\nOutput ONLY the code file(s) needed.` : ""}${agent === "reviewer" ? `Review the code and list specific issues with line numbers. Then provide the corrected code if needed.` : ""}${agent === "architect" ? `Provide a file/folder structure and component hierarchy. List what each file should contain.` : ""}${agent === "debugger" ? `Identify the bug, explain the root cause, and provide the fix.` : ""}`;

      const req: AIStreamRequest = {
        prompt: agentPrompt,
        code: codeContext,
        apiKey,
        provider: provider as AIProviderType,
        model,
      };

      streamAIResponse(req, {
        onToken: (token) => { response += token; },
        onComplete: () => {
          this.completeStep(stepId, response.slice(0, 200) + "...");
          resolve(response);
        },
        onError: (err) => {
          this.errorStep(stepId, err);
          reject(new Error(err));
        },
      });
    });
  }

  // Full orchestrate pipeline
  async orchestrate(params: {
    prompt: string;
    codeContext: string;
    apiKey: string;
    provider: string;
    model: string;
    onResult: (response: string) => void;
    onStep: (step: ThinkingStep) => void;
  }): Promise<string> {
    this.thinkingSteps = [];
    const { prompt, codeContext, apiKey, provider, model } = params;

    // Phase 1: Plan
    const plan = await this.plan(prompt, codeContext);

    if (plan.steps.length === 0) {
      // Direct answer — no agents needed
      let directResponse = "";
      await streamAIResponse(
        { prompt, code: codeContext, apiKey, provider: provider as AIProviderType, model },
        {
          onToken: (t) => { directResponse += t; },
          onComplete: () => { params.onResult(directResponse); },
          onError: (e) => { throw new Error(e); },
        },
      );
      return directResponse;
    }

    // Phase 2: Execute each agent in sequence
    let accumulatedCode = codeContext;
    let combinedResponse = "";

    for (const step of plan.steps) {
      const result = await this.executeAgent(
        step.agent,
        step.prompt || prompt,
        apiKey,
        provider,
        model,
        accumulatedCode,
      );
      combinedResponse += `\n\n[${getAgentConfig(step.agent).name}]: ${result}`;

      // If coder produced code, update context for next agent
      if (step.agent === "coder") {
        const codeMatch = result.match(/```html\n([\s\S]+?)```/) || result.match(/```\n([\s\S]+?)```/);
        if (codeMatch) {
          accumulatedCode = codeMatch[1];
        }
      }
    }

    params.onResult(combinedResponse);
    return combinedResponse;
  }
}
