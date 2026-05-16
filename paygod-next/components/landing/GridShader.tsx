import * as React from "react";

/**
 * Animated grid background with low-opacity red pulses moving across cells.
 * Pure CSS — sits absolute inside a relative parent. Pointer-events: none.
 */
export const GridShader: React.FC<{
  className?: string;
  intensity?: "low" | "med";
}> = ({ className = "", intensity = "low" }) => {
  const opacity = intensity === "med" ? 0.55 : 0.35;
  return (
    <div
      aria-hidden
      className={`absolute inset-0 overflow-hidden pointer-events-none ${className}`}
      style={{ opacity }}
    >
      {/* Static dot/line grid */}
      <div className="absolute inset-0 grid-shader-grid" />
      {/* Moving red glows */}
      <div className="absolute inset-0 grid-shader-glow grid-shader-glow-1" />
      <div className="absolute inset-0 grid-shader-glow grid-shader-glow-2" />
      <div className="absolute inset-0 grid-shader-glow grid-shader-glow-3" />
      {/* Vignette to blend into background */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse at center, transparent 40%, #000 90%)",
        }}
      />
    </div>
  );
};
