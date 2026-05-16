import Link from "next/link";
import { PaygodLogo } from "@/components/ui/Logo";

const linkGroups = [
  {
    title: "Product",
    items: [
      { label: "Overview", href: "/app/overview" },
      { label: "Compliance Agent", href: "/app/compliance" },
      { label: "View Keys", href: "/app/settings" },
      { label: "Docs", href: "/#how-it-works" },
    ],
  },
  {
    title: "Company",
    items: [
      { label: "About", href: "/" },
      { label: "Careers", href: "/#cta" },
      { label: "Press", href: "/#cta" },
      { label: "Contact", href: "/#cta" },
    ],
  },
  {
    title: "Legal",
    items: [
      { label: "Privacy", href: "/#cta" },
      { label: "Terms", href: "/#cta" },
      { label: "Security", href: "/#cta" },
      { label: "Compliance", href: "/app/compliance" },
    ],
  },
];

export const Footer: React.FC = () => (
  <footer
    style={{
      padding: "80px 24px 40px",
      borderTop: "1px solid var(--border)",
      backgroundColor: "#050505",
    }}
  >
    <div className="max-w-6xl mx-auto">
      <div className="grid gap-12" style={{ gridTemplateColumns: "1.6fr repeat(3, 1fr)" }}>
        <div>
          <PaygodLogo size={24} />
          <p
            style={{
              color: "var(--text-secondary)",
              fontSize: 13,
              lineHeight: 1.6,
              marginTop: 20,
              maxWidth: 280,
            }}
          >
            Confidential B2B settlement infrastructure for LatAm financial institutions.
          </p>
        </div>

        {linkGroups.map((g) => (
          <div key={g.title}>
            <p
              className="uppercase"
              style={{
                color: "white",
                fontSize: 11,
                fontWeight: 600,
                letterSpacing: "0.15em",
                marginBottom: 20,
              }}
            >
              {g.title}
            </p>
            <ul className="flex flex-col" style={{ gap: 12 }}>
              {g.items.map((l) => (
                <li key={l.label}>
                  <Link href={l.href} className="transition-colors duration-150 hover:text-white" style={{ color: "var(--text-secondary)", fontSize: 13 }}>
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div
        className="flex flex-col md:flex-row md:items-center md:justify-between gap-4"
        style={{ marginTop: 64, paddingTop: 28, borderTop: "1px solid var(--border)" }}
      >
        <p style={{ color: "var(--text-secondary)", fontSize: 12 }}>© 2025 Paygod. All rights reserved.</p>
        <p style={{ color: "var(--text-secondary)", fontSize: 12 }}>Built on Avalanche · Powered by eERC20</p>
      </div>
    </div>
  </footer>
);
