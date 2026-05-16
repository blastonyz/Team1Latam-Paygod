import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { GridShader } from "./GridShader";

export const CTASection: React.FC = () => (
  <section
    id="cta"
    className="relative overflow-hidden"
    style={{
      padding: "140px 24px",
      backgroundColor: "var(--surface)",
      borderTop: "1px solid var(--border)",
      borderBottom: "1px solid var(--border)",
      scrollMarginTop: 80,
    }}
  >
    <GridShader intensity="low" />

    <div className="relative text-center flex flex-col items-center" style={{ maxWidth: 640, margin: "0 auto" }}>
      <h2 className="font-extrabold text-white" style={{ fontSize: "clamp(32px, 5vw, 48px)", letterSpacing: "-0.03em" }}>
        Ready to settle privately?
      </h2>
      <p
        style={{
          color: "var(--text-secondary)",
          fontSize: 16,
          maxWidth: 460,
          margin: "24px auto 48px",
          lineHeight: 1.6,
        }}
      >
        Join the first wave of LatAm institutions building on confidential payment infrastructure.
      </p>

      <form className="w-full flex justify-center" onSubmit={(e) => e.preventDefault()}>
        <div className="flex w-full" style={{ maxWidth: 520, gap: 12 }}>
          <input
            type="email"
            placeholder="Work email"
            className="flex-1 h-12 text-sm text-white placeholder:text-[var(--text-secondary)] bg-black outline-none transition-colors duration-150 focus:border-[var(--accent)]"
            style={{ border: "1px solid var(--border)", padding: "0 18px" }}
          />
          <Link href="/app_/onboarding">
            <Button variant="primary" size="lg" type="button">Request Access</Button>
          </Link>
        </div>
      </form>

      <div className="flex items-center justify-center gap-2" style={{ color: "var(--text-secondary)", fontSize: 12, marginTop: 24 }}>
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2">
          <path d="M12 3l8 4v6c0 5-3.5 7.5-8 8-4.5-.5-8-3-8-8V7l8-4z" />
        </svg>
        <span>No crypto experience required. Onboarding support included.</span>
      </div>
    </div>
  </section>
);
