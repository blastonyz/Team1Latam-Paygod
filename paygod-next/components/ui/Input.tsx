import * as React from "react";
import { cn } from "@/lib/utils";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  leftIcon?: React.ReactNode;
  locked?: boolean;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, leftIcon, locked, readOnly, style, ...props }, ref) => {
    const lockIcon = (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <rect x="4" y="11" width="16" height="10" rx="0" />
        <path d="M8 11V7a4 4 0 0 1 8 0v4" />
      </svg>
    );

    return (
      <div
        className={cn(
          "flex items-center h-10 bg-[var(--surface)] border rounded-none transition-colors duration-150 focus-within:border-[var(--accent)]",
          className,
        )}
        style={{
          borderColor: "var(--border)",
          borderWidth: 1,
          borderStyle: "solid",
          backgroundColor: locked ? "rgba(237,49,52,0.04)" : "var(--surface)",
          ...style,
        }}
      >
        {(leftIcon || locked) && (
          <span className="pl-3 text-[var(--text-secondary)] flex items-center" style={locked ? { color: "var(--accent)" } : undefined}>
            {locked ? lockIcon : leftIcon}
          </span>
        )}
        <input
          ref={ref}
          readOnly={readOnly || locked}
          className="flex-1 bg-transparent px-3 h-full text-sm text-white placeholder:text-[var(--text-secondary)] outline-none rounded-none"
          {...props}
        />
      </div>
    );
  },
);
Input.displayName = "Input";
