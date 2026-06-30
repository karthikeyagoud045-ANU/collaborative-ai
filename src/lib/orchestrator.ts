import { getAgentConfig, type AgentRole } from "./agent-memory";
import { AIStreamRequest, streamAIResponse, type AIProviderType } from "./ai-client";

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
    return `You are the **${config.name}** agent. ${config.systemPrompt}

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
