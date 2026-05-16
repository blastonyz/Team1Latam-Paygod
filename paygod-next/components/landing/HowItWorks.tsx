const I = ({ children }: { children: React.ReactNode }) => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.6" strokeLinecap="square">
    {children}
  </svg>
);

const steps = [
  {
    n: 1,
    icon: <I><path d="M3 21h18M5 21V10l7-5 7 5v11M9 21v-7h6v7" /></I>,
    title: "Institution emits eERC20",
    desc: "Institution mints eERC20 tokens on the Avalanche Subnet.",
    accent: false,
  },
  {
    n: 2,
    icon: <I><rect x="4" y="11" width="16" height="10" /><path d="M8 11V7a4 4 0 0 1 8 0v4" /></I>,
    title: "Transfer executes — amount encrypted",
    desc: "Amount is encrypted using homomorphic encryption and settled on-chain.",
    accent: true,
  },
  {
    n: 3,
    icon: <I><path d="M12 3l8 4v6c0 5-3.5 7.5-8 8-4.5-.5-8-3-8-8V7l8-4z" /><path d="M9 12l2 2 4-4" /></I>,
    title: "Compliance Agent approves",
    desc: "AI Agent runs risk checks and approves the transaction in real-time.",
    accent: true,
  },
  {
    n: 4,
    icon: <I><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z" /><circle cx="12" cy="12" r="3" /></I>,
    title: "Regulator audits via View Key",
    desc: "Authorized regulators decrypt selectively using rotating View Keys.",
    accent: false,
  },
];

const Arrow = ({ vertical }: { vertical?: boolean }) => (
  <div
    className="flex items-center justify-center"
    style={{ color: "var(--accent)", fontSize: 24, lineHeight: 1, fontWeight: 600 }}
  >
    {vertical ? "⌄" : "›"}
  </div>
);

export const HowItWorks: React.FC = () => (
  <section id="how-it-works" style={{ padding: "120px 24px", backgroundColor: "#0A0A0A", scrollMarginTop: 80 }}>
    <div className="mx-auto flex flex-col items-center" style={{ maxWidth: 1120, width: "100%" }}>
      <p
        className="text-center uppercase font-medium"
        style={{ color: "var(--accent)", fontSize: 11, letterSpacing: "0.2em", marginBottom: 16 }}
      >
        How It Works
      </p>
      <h2
        className="text-center font-bold text-white"
        style={{ fontSize: "clamp(28px, 4vw, 40px)", letterSpacing: "-0.02em", marginBottom: 72, maxWidth: 720 }}
      >
        How a confidential transfer works.
      </h2>

      <div className="flex flex-col md:flex-row items-stretch md:items-start justify-center w-full" style={{ gap: 8 }}>
        {steps.map((s, idx) => (
          <div key={s.n} className="flex flex-col md:flex-row items-center md:items-start flex-1">
            <div className="flex flex-col items-center text-center px-2 flex-1">
              <div
                className="w-9 h-9 flex items-center justify-center text-sm font-semibold transition-colors duration-200"
                style={{
                  border: `1px solid ${s.accent ? "var(--accent)" : "var(--border-strong)"}`,
                  backgroundColor: s.accent ? "rgba(237,49,52,0.08)" : "transparent",
                  color: s.accent ? "var(--accent)" : "white",
                }}
              >
                {s.n}
              </div>
              <div style={{ marginTop: 16 }}>{s.icon}</div>
              <h3 className="text-white" style={{ fontSize: 14, fontWeight: 600, marginTop: 16 }}>
                {s.title}
              </h3>
              <p
                style={{
                  color: "var(--text-secondary)",
                  fontSize: 12,
                  lineHeight: 1.6,
                  maxWidth: 180,
                  marginTop: 10,
                }}
              >
                {s.desc}
              </p>
            </div>
            {idx < steps.length - 1 && (
              <div className="md:pt-4 md:px-2">
                <span className="hidden md:inline-block"><Arrow /></span>
                <span className="inline-block md:hidden"><Arrow vertical /></span>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  </section>
);
