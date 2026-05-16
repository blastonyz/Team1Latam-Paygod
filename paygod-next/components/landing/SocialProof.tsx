import * as React from "react";

const AvalancheLogo = () => (
  <div className="flex items-center" style={{ gap: 8 }}>
    <img
      src="/assets/logos/avalanche.svg"
      alt="Avalanche"
      style={{ height: 22, width: 22, opacity: 0.6 }}
    />
    <span style={{ fontWeight: 700, letterSpacing: "0.08em", fontSize: 14 }}>
      AVALANCHE
    </span>
  </div>
);

const BankaoolLogo = () => (
  <div className="flex items-center" style={{ gap: 8 }}>
    <span
      style={{
        fontWeight: 800,
        fontSize: 18,
        color: "rgba(237,49,52,0.7)",
        letterSpacing: "-0.04em",
      }}
    >
      »
    </span>
    <span style={{ fontWeight: 700, letterSpacing: "-0.02em", fontSize: 18 }}>
      bankaool
    </span>
  </div>
);

const ArkangelesLogo = () => (
  <div className="flex items-center" style={{ gap: 8 }}>
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M12 2 L22 20 L2 20 Z" />
      <path d="M12 8 L17 18 L7 18 Z" />
    </svg>
    <span style={{ fontWeight: 600, letterSpacing: "0.1em", fontSize: 13 }}>
      ARKÁNGELES
    </span>
  </div>
);

const X402Logo = () => (
  <span
    style={{
      fontWeight: 700,
      fontSize: 14,
      padding: "5px 12px",
      border: "1px solid currentColor",
      letterSpacing: "0.02em",
    }}
  >
    x402
  </span>
);

const EERC20Logo = () => (
  <div className="flex items-center" style={{ gap: 8 }}>
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="4" y="11" width="16" height="10" />
      <path d="M8 11V7a4 4 0 0 1 8 0v4" />
    </svg>
    <span style={{ fontWeight: 700, letterSpacing: "0.04em", fontSize: 14 }}>
      eERC20
    </span>
  </div>
);

const TextMark: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <span style={{ fontWeight: 600, letterSpacing: "0.18em", fontSize: 12 }}>
    {children}
  </span>
);

const items: { node: React.ReactNode; key: string }[] = [
  { key: "avalanche", node: <AvalancheLogo /> },
  { key: "bankaool", node: <BankaoolLogo /> },
  { key: "arkangeles", node: <ArkangelesLogo /> },
  { key: "x402", node: <X402Logo /> },
  { key: "eerc20", node: <EERC20Logo /> },
  { key: "mica", node: <TextMark>MICA READY</TextMark> },
  { key: "travel", node: <TextMark>TRAVEL RULE</TextMark> },
];

export const SocialProof: React.FC = () => {
  const loop = [...items, ...items];
  return (
    <section
      style={{
        padding: "56px 0",
        borderTop: "1px solid var(--border)",
        borderBottom: "1px solid var(--border)",
      }}
    >
      <p
        className="text-center uppercase"
        style={{
          color: "var(--text-secondary)",
          fontSize: 11,
          marginBottom: 36,
          letterSpacing: "0.2em",
        }}
      >
        Trusted and built with
      </p>
      <div className="marquee">
        <div className="marquee-track" style={{ gap: 72 }}>
          {loop.map((it, i) => (
            <div
              key={`${it.key}-${i}`}
              className="shrink-0 transition-colors duration-200 hover:text-white"
              style={{ color: "rgba(255,255,255,0.38)" }}
            >
              {it.node}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
