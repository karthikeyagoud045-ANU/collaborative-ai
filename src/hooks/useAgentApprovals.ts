"use client";

import { useEffect, useRef } from "react";
import { showToast } from "@/hooks/useToast";
import type * as Y from "yjs";

interface PendingAction {
  id: string;
  type: string;
  target: string;
  status: string;
}

export function useAgentApprovals(ydoc: Y.Doc | null) {
  const [pendingActions, setPendingActions] = useState<PendingAction[]>([]);
  const actionsRef = useRef<Y.Map<unknown> | null>(null);

  useEffect(() => {
    if (!ydoc) return;
    const actions = ydoc.getMap("pendingAgentActions");
    actionsRef.current = actions;

    const update = () => {
      const pending: PendingAction[] = [];
      actions.forEach((value, key) => {
        const action = value as Record<string, unknown>;
        if (action.status === "pending") {
          pending.push({
            id: key,
            type: action.type as string,
            target: action.target as string,
            status: action.status as string,
          });
        }
      });
      setPendingActions(pending);
    };

    update();
    actions.observe(update);
    return () => actions.unobserve(update);
  }, [ydoc]);

  const approveAction = (actionId: string) => {
    if (!actionsRef.current) return;
    const action = actionsRef.current.get(actionId) as Y.Map<string> | undefined;
    if (action) {
      action.set("status", "approved");
      showToast("Action approved", "success");
    }
  };

  const rejectAction = (actionId: string) => {
    if (!actionsRef.current) return;
    const action = actionsRef.current.get(actionId) as Y.Map<string> | undefined;
    if (action) {
      action.set("status", "rejected");
      showToast("Action rejected", "warning");
    }
  };

  return { pendingActions, approveAction, rejectAction };
}

import { useState } from "react";
