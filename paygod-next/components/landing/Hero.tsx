import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { NetworkDiagram } from "./NetworkDiagram";
import { GridShader } from "./GridShader";

export const Hero: React.FC = () => {
  return (
    <section
      className="relative flex flex-col items-center justify-center text-center overflow-hidden"
      style={{
        minHeight: "100vh",
        paddingTop: 140,
        paddingBottom: 96,
        paddingLeft: 24,
        paddingRight: 24,
      }}
    >
      <GridShader intensity="med" />

      <div className="relative w-full max-w-4xl mx-auto flex flex-col items-center">
        <p
          className="fade-up uppercase font-medium"
          style={{
            color: "var(--accent)",
            fontSize: 12,
            letterSpacing: "0.2em",
            marginBottom: 24,
            animationDelay: "0ms",
          }}
        >
          Built on Avalanche · Powered by eERC20
        </p>

        <h1
          className="fade-up font-extrabold text-white"
          style={{
            fontSize: "clamp(40px, 7vw, 72px)",
            lineHeight: 1,
            letterSpacing: "-0.04em",
            animationDelay: "100ms",
          }}
        >
          Institutional payments.
          <br />
          Private by default.
        </h1>

        <p
          className="fade-up mt-6 mx-auto"
          style={{
            color: "var(--text-secondary)",
            fontSize: 18,
            lineHeight: 1.6,
            maxWidth: 520,
            animationDelay: "200ms",
          }}
        >
          Confidential B2B settlement infrastructure for LatAm financial institutions.
          Compliance-ready. Regulator-auditable.
        </p>

        <div className="fade-up flex flex-wrap items-center justify-center" style={{ marginTop: 40, animationDelay: "300ms" }}>
          <Link href="/app_/onboarding">
            <Button variant="primary" size="lg">Request Access</Button>
          </Link>
        </div>
      </div>

      <div className="relative w-full flex justify-center" style={{ marginTop: 72 }}>
        <NetworkDiagram />
      </div>
    </section>
  );
};
