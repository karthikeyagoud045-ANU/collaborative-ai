"use client";

import React from "react";

interface AvatarSkeletonProps {
  count?: number;
  size?: number;
}

export function AvatarSkeleton({ count = 3, size = 24 }: AvatarSkeletonProps) {
  return (
    <div className="presence-bar">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="skeleton"
          style={{ width: size, height: size, borderRadius: "50%", marginLeft: i > 0 ? -6 : 0 }}
        />
      ))}
    </div>
  );
}

interface SkeletonProps {
  width?: string;
  height?: string;
  borderRadius?: string;
}

export function Skeleton({ width = "100%", height = "16px", borderRadius = "var(--r-sm)" }: SkeletonProps) {
  return (
    <div
      className="skeleton"
      style={{ width, height, borderRadius }}
    />
  );
}

export function MessageSkeleton() {
  return (
    <div style={{ padding: "var(--sp-md)", display: "flex", flexDirection: "column", gap: "var(--sp-sm)" }}>
      <div style={{ display: "flex", gap: "var(--sp-sm)", alignItems: "center" }}>
        <div className="skeleton" style={{ width: 24, height: 24, borderRadius: "50%" }} />
        <div className="skeleton" style={{ width: 80, height: 12 }} />
      </div>
      <div className="skeleton" style={{ width: "80%", height: 14 }} />
      <div className="skeleton" style={{ width: "60%", height: 14 }} />
    </div>
  );
}
