import * as React from "react";
import { cn } from "@/lib/utils";

export type BadgeVariant =
  | "approved"
  | "pending"
  | "flagged"
  | "blocked"
  | "sealed"
  | "revealed";

const styles: Record<BadgeVariant, { bg: string; text: string; border: string; dot: string }> = {
  approved: { bg: "rgba(74,222,128,0.1)", text: "#4ADE80", border: "rgba(74,222,128,0.2)", dot: "#4ADE80" },
  pending:  { bg: "rgba(251,191,36,0.1)", text: "#FBBF24", border: "rgba(251,191,36,0.2)", dot: "#FBBF24" },
  flagged:  { bg: "rgba(237,49,52,0.1)",  text: "#ED3134", border: "rgba(237,49,52,0.2)",  dot: "#ED3134" },
  blocked:  { bg: "rgba(255,255,255,0.05)", text: "#888888", border: "rgba(255,255,255,0.1)", dot: "#888888" },
  sealed:   { bg: "rgba(255,255,255,0.05)", text: "#888888", border: "rgba(255,255,255,0.1)", dot: "#888888" },
  revealed: { bg: "rgba(74,222,128,0.1)", text: "#4ADE80", border: "rgba(74,222,128,0.2)", dot: "#4ADE80" },
};

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
}

export const Badge: React.FC<BadgeProps> = ({ variant = "approved", className, children, ...props }) => {
  const s = styles[variant];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 px-2 py-0.5 text-xs font-medium border rounded-none",
        className,
      )}
      style={{ backgroundColor: s.bg, color: s.text, borderColor: s.border }}
      {...props}
    >
      <span
        className="inline-block w-1.5 h-1.5 rounded-full"
        style={{ backgroundColor: s.dot }}
        aria-hidden
      />
      <span className="capitalize">{children ?? variant}</span>
    </span>
  );
};
