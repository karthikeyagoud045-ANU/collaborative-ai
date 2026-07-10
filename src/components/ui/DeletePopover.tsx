"use client";

import { useEffect, useRef, useCallback } from "react";

interface DeletePopoverProps {
  filename: string;
  anchorRect: DOMRect | null;
  onConfirm: () => void;
  onCancel: () => void;
}

export function DeletePopover({ filename, anchorRect, onConfirm, onCancel }: DeletePopoverProps) {
  const popoverRef = useRef<HTMLDivElement>(null);

  const handleClickOutside = useCallback((e: MouseEvent) => {
    if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
      onCancel();
    }
  }, [onCancel]);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === "Escape") onCancel();
    if (e.key === "Enter") onConfirm();
  }, [onCancel, onConfirm]);

  useEffect(() => {
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [handleClickOutside, handleKeyDown]);

  if (!anchorRect) return null;

  // Position the popover near the anchor
  const top = anchorRect.bottom + 4;
  const right = window.innerWidth - anchorRect.right;

  return (
    <div
      ref={popoverRef}
      className="delete-popover"
      style={{
        position: "fixed",
        top,
        right: Math.max(8, right),
        zIndex: 1000,
      }}
    >
      <div className="delete-popover-text">
        Delete <code>{filename}</code>?
        <br />
        <span style={{ fontSize: "11px", color: "var(--muted-soft)" }}>This can't be undone.</span>
      </div>
      <div className="delete-popover-actions">
        <button className="btn btn-danger btn-sm" onClick={onConfirm}>
          Delete
        </button>
        <button className="btn btn-secondary btn-sm" onClick={onCancel}>
          Cancel
        </button>
      </div>
    </div>
  );
}
