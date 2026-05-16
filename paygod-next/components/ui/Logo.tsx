import * as React from "react";

// Inline SVG » chevron mark (icon-only)
export const PaygodMark: React.FC<{ size?: number; className?: string; color?: string }> = ({
  size = 20,
  className,
  color = "#ED3134",
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 18"
    fill="none"
    className={className}
    aria-label="Paygod"
  >
    <path d="M2 0 L14 0 L22 9 L14 18 L2 18 L10 9 Z" fill={color} />
  </svg>
);

// Full lockup using the SVG asset (mark + wordmark already inside the SVG).
export const PaygodLogo: React.FC<{ size?: number; className?: string }> = ({
  size = 28,
  className,
}) => (
  <img
    src="/assets/paygod-logo.svg"
    alt="Paygod"
    style={{ height: size, width: "auto", display: "block" }}
    className={className}
  />
);
