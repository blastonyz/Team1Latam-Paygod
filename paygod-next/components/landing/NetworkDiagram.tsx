import * as React from "react";
import { PaygodMark } from "@/components/ui/Logo";

const InstitutionNode: React.FC<{ label: string; align?: "left" | "right" }> = ({
  label,
  align = "left",
}) => (
  <div
    className="bg-black"
    style={{
      border: "1px solid var(--border-strong, rgba(255,255,255,0.18))",
      padding: "10px 14px",
      minWidth: 132,
      textAlign: align,
      boxShadow: "0 0 0 4px rgba(0,0,0,0.6)",
    }}
  >
    <div
      className="uppercase"
      style={{
        color: "var(--text-secondary)",
        fontSize: 9,
        letterSpacing: "0.18em",
        marginBottom: 4,
      }}
    >
      Institution
    </div>
    <div className="text-white" style={{ fontSize: 12, fontWeight: 600, letterSpacing: "-0.01em" }}>
      {label}
    </div>
    <div
      className="font-mono"
      style={{ color: "#666", fontSize: 10, marginTop: 4 }}
    >
      •••• DoC
    </div>
  </div>
);

const Lock: React.FC<{ x: number; y: number }> = ({ x, y }) => (
  <g transform={`translate(${x - 11} ${y - 11})`}>
    <rect width="22" height="22" fill="#000" stroke="rgba(237,49,52,0.6)" />
    <g transform="translate(5 5)" stroke="#ED3134" strokeWidth="1.3" fill="none">
      <rect x="1" y="5" width="10" height="7" />
      <path d="M3 5V3a3 3 0 0 1 6 0v2" />
    </g>
  </g>
);

export const NetworkDiagram: React.FC = () => {
  // Coordinate system
  const W = 720;
  const H = 380;
  const cx = W / 2;
  const cy = H / 2 - 10;

  const corners = [
    { x: 100, y: 70 },
    { x: W - 100, y: 70 },
    { x: 100, y: H - 110 },
    { x: W - 100, y: H - 110 },
  ];

  return (
    <div className="w-full flex justify-center">
      <div
        className="relative w-full"
        style={{ maxWidth: 720, aspectRatio: `${W}/${H}` }}
      >
        <svg
          viewBox={`0 0 ${W} ${H}`}
          className="absolute inset-0 w-full h-full"
          preserveAspectRatio="xMidYMid meet"
        >
          <defs>
            <pattern id="diagDots" width="18" height="18" patternUnits="userSpaceOnUse">
              <circle cx="1" cy="1" r="1" fill="rgba(255,255,255,0.05)" />
            </pattern>
            <radialGradient id="diagMask" cx="50%" cy="50%" r="60%">
              <stop offset="0%" stopColor="#000" stopOpacity="1" />
              <stop offset="100%" stopColor="#000" stopOpacity="0" />
            </radialGradient>
            <mask id="fade">
              <rect width={W} height={H} fill="url(#diagMask)" />
            </mask>
          </defs>
          <rect width={W} height={H} fill="url(#diagDots)" mask="url(#fade)" />

          {/* Outer frame brackets — 4 corners */}
          {[
            { x: 8, y: 8, dx: 1, dy: 1 },
            { x: W - 8, y: 8, dx: -1, dy: 1 },
            { x: 8, y: H - 8, dx: 1, dy: -1 },
            { x: W - 8, y: H - 8, dx: -1, dy: -1 },
          ].map((c, i) => (
            <path
              key={i}
              d={`M ${c.x} ${c.y + c.dy * 18} L ${c.x} ${c.y} L ${c.x + c.dx * 18} ${c.y}`}
              stroke="rgba(255,255,255,0.18)"
              strokeWidth="1"
              fill="none"
            />
          ))}

          {/* Connection lines */}
          {corners.map((c, i) => (
            <line
              key={i}
              x1={c.x}
              y1={c.y}
              x2={cx}
              y2={cy}
              stroke="rgba(237,49,52,0.35)"
              strokeWidth="1"
              strokeDasharray="5 5"
            />
          ))}

          {/* Padlocks midway */}
          {corners.map((c, i) => (
            <Lock key={i} x={(c.x + cx) / 2} y={(c.y + cy) / 2} />
          ))}
        </svg>

        {/* Institution nodes */}
        <div className="absolute" style={{ left: "3%", top: "8%" }}>
          <InstitutionNode label="Bankaool" />
        </div>
        <div className="absolute" style={{ right: "3%", top: "8%" }}>
          <InstitutionNode label="Arkangeles" align="right" />
        </div>
        <div className="absolute" style={{ left: "3%", bottom: "22%" }}>
          <InstitutionNode label="Institution C" />
        </div>
        <div className="absolute" style={{ right: "3%", bottom: "22%" }}>
          <InstitutionNode label="Institution D" align="right" />
        </div>

        {/* Central node */}
        <div
          className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 flex items-center justify-center"
          style={{
            backgroundColor: "var(--surface)",
            border: "1px solid var(--accent)",
            width: 96,
            height: 96,
            boxShadow: "0 0 0 6px rgba(0,0,0,0.8), 0 0 40px rgba(237,49,52,0.25)",
          }}
        >
          <PaygodMark size={40} />
        </div>

        {/* Compliance Agent badge */}
        <div className="absolute left-1/2 -translate-x-1/2" style={{ bottom: "2%" }}>
          <div
            className="flex items-center"
            style={{
              backgroundColor: "rgba(74,222,128,0.06)",
              border: "1px solid rgba(74,222,128,0.25)",
              padding: "8px 14px",
              gap: 10,
              fontSize: 11,
              fontWeight: 500,
            }}
          >
            <span
              className="rounded-full"
              style={{
                width: 6,
                height: 6,
                backgroundColor: "var(--success)",
                boxShadow: "0 0 8px var(--success)",
              }}
            />
            <span className="text-white">Compliance Agent</span>
            <span style={{ color: "var(--text-secondary)" }}>·</span>
            <span style={{ color: "var(--success)" }}>Risk: LOW</span>
          </div>
        </div>
      </div>
    </div>
  );
};
