"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import * as Y from "yjs";
import { AIBranch } from "@/lib/yjs-provider";
import {
  getBranchesForFile,
  acceptBranch,
  rejectBranch,
  discardAllBranches,
} from "@/lib/agentic-queue";

interface ConflictResolverProps {
  aiBranches: Y.Map<unknown>;
  ytext: Y.Text;
  ydoc: Y.Doc;
  userId: string;
  filePath: string;
  onClose: () => void;
}

export default function ConflictResolver({
  aiBranches,
  ytext,
  ydoc,
  userId,
  filePath,
  onClose,
}: ConflictResolverProps) {
  const [branches, setBranches] = useState<AIBranch[]>([]);
  const [selectedBranch, setSelectedBranch] = useState<string | null>(null);
  const modalRef = useRef<HTMLDivElement>(null);

  const loadBranches = useCallback(() => {
    const fileBranches = getBranchesForFile(aiBranches, filePath);
    setBranches(fileBranches);

    if (fileBranches.length === 0) {
      onClose();
    }
  }, [aiBranches, filePath, onClose]);

  useEffect(() => {
    const observer = () => {
      const fileBranches = getBranchesForFile(aiBranches, filePath);
      setBranches(fileBranches);

      if (fileBranches.length === 0) {
        onClose();
      }
    };

    aiBranches.observe(observer);

    // Initial load
    observer();

    return () => {
      aiBranches.unobserve(observer);
    };
  }, [aiBranches, filePath, onClose]);

  const handleAccept = useCallback(
    (branchId: string) => {
      acceptBranch(aiBranches, branchId, userId, ytext, ydoc);
      loadBranches();
    },
    [aiBranches, userId, ytext, ydoc, loadBranches]
  );

  const handleReject = useCallback(
    (branchId: string) => {
      rejectBranch(aiBranches, branchId, userId);
      loadBranches();
    },
    [aiBranches, userId, loadBranches]
  );

  const handleDiscardAll = useCallback(() => {
    discardAllBranches(aiBranches, filePath);
    loadBranches();
    onClose();
  }, [aiBranches, filePath, loadBranches, onClose]);

  useEffect(() => {
    if (branches.length === 0) return;

    const modal = modalRef.current;
    if (!modal) return;

    const focusableElements = modal.querySelectorAll<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );

    if (focusableElements.length === 0) return;

    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
        return;
      }
      if (e.key === "Tab") {
        if (e.shiftKey) {
          if (document.activeElement === firstElement) {
            e.preventDefault();
            lastElement.focus();
          }
        } else {
          if (document.activeElement === lastElement) {
            e.preventDefault();
            firstElement.focus();
          }
        }
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    
    // Attempt to focus the close button or fallback to first
    const closeBtn = modal.querySelector("#conflict-close-btn") as HTMLElement | null;
    if (closeBtn) {
      closeBtn.focus();
    } else {
      firstElement.focus();
    }

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [branches.length, onClose]);

  if (branches.length === 0) {
    return null;
  }

  return (
    <div
      className="conflict-resolver-overlay"
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0, 0, 0, 0.7)",
        backdropFilter: "blur(8px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1000,
        animation: "fadeIn 0.2s ease",
      }}
    >
      <div
        className="conflict-resolver-modal glass"
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="conflict-modal-title"
        aria-describedby="conflict-modal-desc"
        style={{
          width: "90%",
          maxWidth: "900px",
          maxHeight: "80vh",
          borderRadius: "var(--r-lg)",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
          animation: "slideInUp 0.3s ease",
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: "var(--sp-lg)",
            borderBottom: "1px solid var(--hairline)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div>
            <h2
              id="conflict-modal-title"
              style={{
                fontSize: "15px",
                fontWeight: 600,
                color: "var(--ink)",
                marginBottom: "var(--sp-xs)",
              }}
            >
              ⚡ Conflict Detected
            </h2>
            <p
              id="conflict-modal-desc"
              style={{
                fontSize: "13px",
                color: "var(--body)",
              }}
            >
              Multiple AI changes to <code>{filePath}</code> were detected.
              Review and vote on each branch.
            </p>
          </div>
          <button
            className="btn btn-ghost btn-icon"
            onClick={onClose}
            id="conflict-close-btn"
            aria-label="Close conflict resolver"
          >
            ✕
          </button>
        </div>

        {/* Branches */}
        <div
          style={{
            flex: 1,
            overflow: "auto",
            padding: "var(--sp-lg)",
            display: "flex",
            flexDirection: "column",
            gap: "var(--sp-lg)",
          }}
        >
          {branches.map((branch, index) => (
            <div
              key={branch.id}
              className={`branch-card ${
                selectedBranch === branch.id ? "selected" : ""
              }`}
              style={{
                border: "1px solid var(--hairline)",
                borderRadius: "var(--r-md)",
                overflow: "hidden",
                cursor: "pointer",
                transition: "all 120ms ease",
                background:
                  selectedBranch === branch.id
                    ? "hsla(217, 91%, 60%, 0.08)"
                    : "var(--chip-active-bg)",
              }}
              onClick={() => setSelectedBranch(branch.id)}
            >
              {/* Branch Header */}
              <div
                style={{
                  padding: "var(--sp-md)",
                  borderBottom: "1px solid var(--hairline)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  background: "var(--canvas-panel)",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "var(--sp-sm)",
                  }}
                >
                  <span
                    style={{
                      width: "24px",
                      height: "24px",
                      borderRadius: "50%",
                      background: index === 0 ? "var(--primary-violet)" : "var(--primary-violet)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "12px",
                      fontWeight: 600,
                      color: "white",
                    }}
                  >
                    {branch.username.charAt(0).toUpperCase()}
                  </span>
                  <div>
                    <div
                      style={{
                        fontSize: "13px",
                        fontWeight: 500,
                        color: "var(--ink)",
                      }}
                    >
                      {branch.username}
                    </div>
                    <div
                      style={{
                        fontSize: "12px",
                        color: "var(--muted)",
                      }}
                    >
                      {new Date(branch.timestamp).toLocaleTimeString()}
                    </div>
                  </div>
                </div>

                <div
                  style={{
                    display: "flex",
                    gap: "var(--sp-sm)",
                  }}
                >
                  <button
                    className="btn btn-primary btn-sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleAccept(branch.id);
                    }}
                    id={`accept-branch-${branch.id}`}
                    aria-label={`Accept branch from ${branch.username}`}
                  >
                    ✓ Accept
                  </button>
                  <button
                    className="btn btn-danger btn-sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleReject(branch.id);
                    }}
                    id={`reject-branch-${branch.id}`}
                    aria-label={`Reject branch from ${branch.username}`}
                  >
                    ✕ Reject
                  </button>
                </div>
              </div>

              {/* Branch Content */}
              <div
                style={{
                  padding: "var(--sp-md)",
                  maxHeight: "200px",
                  overflow: "auto",
                }}
              >
                <pre
                  style={{
                    fontFamily: "var(--font-mono)",
                    fontSize: "12px",
                    lineHeight: 1.6,
                    color: "var(--body)",
                    whiteSpace: "pre-wrap",
                    wordBreak: "break-all",
                    margin: 0,
                  }}
                >
                  {branch.proposedContent}
                </pre>
              </div>

              {/* Votes */}
              {Object.keys(branch.votes).length > 0 && (
                <div
                  style={{
                    padding: "var(--sp-sm) var(--sp-md)",
                    borderTop: "1px solid var(--hairline)",
                    display: "flex",
                    gap: "var(--sp-sm)",
                    fontSize: "12px",
                    color: "var(--muted)",
                  }}
                >
                  {Object.entries(branch.votes).map(([voterId, vote]) => (
                    <span
                      key={voterId}
                      className={`badge ${
                        vote === "accept" ? "badge-green" : "badge-orange"
                      }`}
                    >
                      {voterId === userId ? "You" : voterId.slice(0, 4)}: {vote}
                    </span>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Footer */}
        <div
          style={{
            padding: "var(--sp-lg)",
            borderTop: "1px solid var(--hairline)",
            display: "flex",
            justifyContent: "flex-end",
            gap: "var(--sp-sm)",
          }}
        >
          <button
            className="btn btn-danger btn-sm"
            onClick={handleDiscardAll}
            id="discard-all-btn"
          >
            Discard All Branches
          </button>
          <button
            className="btn btn-secondary btn-sm"
            onClick={onClose}
            id="keep-reviewing-btn"
          >
            Keep Reviewing
          </button>
        </div>
      </div>
    </div>
  );
}
