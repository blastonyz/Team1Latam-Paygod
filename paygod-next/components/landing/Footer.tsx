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
  <footer className="my-16 w-full bg-black px-6 md:px-10">
    <div className="mx-auto h-full w-full max-w-6xl">
      <div className="grid gap-12 md:grid-cols-[1.6fr_repeat(3,minmax(0,1fr))]">
        <div>
          <PaygodLogo size={24} />
          <p
            className="mt-5 max-w-[280px] text-[13px] leading-[1.6] text-[var(--text-secondary)]"
          >
            Confidential B2B settlement infrastructure for LatAm financial institutions.
          </p>
        </div>

        {linkGroups.map((g) => (
          <div key={g.title}>
            <p
              className="mb-5 text-[11px] font-semibold uppercase tracking-[0.15em] text-white"
            >
              {g.title}
            </p>
            <ul className="flex flex-col gap-3">
              {g.items.map((l) => (
                <li key={l.label}>
                  <Link
                    href={l.href}
                    className="text-[13px] text-[var(--text-secondary)] transition-colors duration-150 hover:text-white"
                  >
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div
        className="mt-16 flex flex-col gap-4 border-t border-[var(--border)] pt-7 md:flex-row md:items-center md:justify-between"
      >
        <p className="text-[12px] text-[var(--text-secondary)]">© 2025 Paygod. All rights reserved.</p>
        <p className="text-[12px] text-[var(--text-secondary)]">Built on Avalanche · Powered by eERC20</p>
      </div>
    </div>
  </footer>
);
