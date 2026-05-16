import { Card } from "@/components/ui/Card";
import { Reveal } from "./Reveal";

const I = ({ children }: { children: React.ReactNode }) => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.6" strokeLinecap="square">
    {children}
  </svg>
);

const features = [
  {
    icon: <I><rect x="4" y="11" width="16" height="10" /><path d="M8 11V7a4 4 0 0 1 8 0v4" /></I>,
    title: "Confidential Transfers",
    desc: "Amounts and balances hidden on-chain using homomorphic encryption. Visible only to sender and recipient.",
  },
  {
    icon: <I><path d="M12 3l8 4v6c0 5-3.5 7.5-8 8-4.5-.5-8-3-8-8V7l8-4z" /><path d="M9 12l2 2 4-4" /></I>,
    title: "Compliance by Design",
    desc: "Rotating View Keys allow authorized regulators to decrypt selectively. MiCA, Travel Rule, and AML-ready.",
  },
  {
    icon: <I><rect x="5" y="5" width="14" height="14" /><circle cx="9.5" cy="11" r="1" /><circle cx="14.5" cy="11" r="1" /><path d="M9 15h6M3 9h2M3 13h2M19 9h2M19 13h2M9 3v2M15 3v2M9 19v2M15 19v2" /></I>,
    title: "AI Compliance Agent",
    desc: "Pre-transaction risk scoring via OFAC, PEP, and velocity checks. Monetized per-call via x402 payments.",
  },
];

export const Features: React.FC = () => (
  <section id="product" style={{ padding: "120px 24px", scrollMarginTop: 80 }}>
    <div className="mx-auto flex flex-col items-center" style={{ maxWidth: 1120, width: "100%" }}>
      <p
        className="text-center uppercase font-medium"
        style={{ color: "var(--accent)", fontSize: 11, letterSpacing: "0.2em", marginBottom: 16 }}
      >
        Product
      </p>
      <h2
        className="text-center font-bold text-white"
        style={{ fontSize: "clamp(28px, 4vw, 40px)", letterSpacing: "-0.02em", marginBottom: 64, maxWidth: 720 }}
      >
        Everything institutions need. Nothing they don't.
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-3 w-full" style={{ gap: 16 }}>
        {features.map((f, i) => (
          <Reveal key={f.title} delay={i * 100}>
            <Card padding={28} className="h-full transition-colors duration-200 hover:border-[rgba(237,49,52,0.4)]">
              <div style={{ marginBottom: 20 }}>{f.icon}</div>
              <h3 className="text-white" style={{ fontSize: 16, fontWeight: 700, marginBottom: 8 }}>
                {f.title}
              </h3>
              <p style={{ color: "var(--text-secondary)", fontSize: 14, lineHeight: 1.6 }}>{f.desc}</p>
            </Card>
          </Reveal>
        ))}
      </div>
    </div>
  </section>
);
