import * as React from "react";
import { cn } from "@/lib/utils";

type Variant = "primary" | "outline" | "ghost";
type Size = "sm" | "md" | "lg";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
}

const sizeStyle: Record<Size, React.CSSProperties> = {
  sm: { height: 32, padding: "0 14px", fontSize: 12 },
  md: { height: 40, padding: "0 20px", fontSize: 13 },
  lg: { height: 48, padding: "0 28px", fontSize: 14 },
};

const variantStyle: Record<Variant, React.CSSProperties> = {
  primary: { backgroundColor: "#ED3134", color: "#fff", border: "1px solid #ED3134" },
  outline: { backgroundColor: "transparent", color: "#fff", border: "1px solid rgba(255,255,255,0.3)" },
  ghost: { backgroundColor: "transparent", color: "#888", border: "1px solid transparent" },
};

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", loading, disabled, children, style, onMouseEnter, onMouseLeave, ...props }, ref) => {
    const isDisabled = disabled || loading;
    return (
      <button
        ref={ref}
        disabled={isDisabled}
        className={cn(
          "inline-flex items-center justify-center gap-2 rounded-none whitespace-nowrap",
          className,
        )}
        style={{
          fontFamily: "Inter, sans-serif",
          fontWeight: 500,
          letterSpacing: "0.02em",
          transition: "all 150ms ease",
          cursor: isDisabled ? "not-allowed" : "pointer",
          opacity: isDisabled ? 0.3 : 1,
          ...sizeStyle[size],
          ...variantStyle[variant],
          ...style,
        }}
        onMouseEnter={(e) => {
          if (!isDisabled) {
            if (variant === "primary") {
              e.currentTarget.style.backgroundColor = "#C42528";
              e.currentTarget.style.borderColor = "#C42528";
            } else if (variant === "outline") {
              e.currentTarget.style.backgroundColor = "#fff";
              e.currentTarget.style.color = "#000";
            } else if (variant === "ghost") {
              e.currentTarget.style.color = "#fff";
            }
          }
          onMouseEnter?.(e);
        }}
        onMouseLeave={(e) => {
          if (!isDisabled) {
            const v = variantStyle[variant];
            e.currentTarget.style.backgroundColor = (v.backgroundColor as string) ?? "transparent";
            e.currentTarget.style.borderColor = (v.border as string)?.split(" ").slice(-1)[0] ?? "transparent";
            e.currentTarget.style.color = (v.color as string) ?? "#fff";
          }
          onMouseLeave?.(e);
        }}
        {...props}
      >
        {loading && (
          <span
            className="inline-block w-3.5 h-3.5 border border-current border-t-transparent rounded-full animate-spin"
            aria-hidden
          />
        )}
        {children}
      </button>
    );
  },
);
Button.displayName = "Button";
