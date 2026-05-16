"use client";

import Link from "next/link";
import { Building2, Shield } from "lucide-react";
import { PaygodMark } from "@/components/ui/Logo";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";

const Triangle = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M12 3 L22 21 L2 21 Z" /></svg>
);

const LockIcon = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <rect x="4" y="11" width="16" height="10" />
    <path d="M8 11V7a4 4 0 0 1 8 0v4" />
  </svg>
);

const trusted: Array<{ label: string; icon?: React.ReactNode; weight: 600 | 700; tracking?: string; border?: boolean }> = [
  { label: "AVALANCHE", icon: <Triangle />, weight: 700, tracking: "0.05em" },
  { label: "bankaool", weight: 600, tracking: "-0.02em" },
  { label: "ARKÁNGELES", weight: 600, tracking: "0.1em" },
  { label: "x402", weight: 700, border: true },
  { label: "eERC20", icon: <LockIcon />, weight: 600, tracking: "0.05em" },
];

export default function OnboardingPage() {
  return (
    <div className="min-h-screen bg-black text-white">
      <header className="flex items-center justify-center" style={{ height: 56, borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
        <div className="flex items-center gap-2">
          <PaygodMark size={20} />
          <span className="text-white font-bold tracking-tight" style={{ fontSize: 18 }}>paygod</span>
        </div>
      </header>

      <main className="flex flex-col items-center justify-center px-6" style={{ minHeight: "calc(100vh - 56px)" }}>
        <div className="flex flex-col items-center" style={{ marginBottom: 48 }}>
          <div className="flex items-center gap-3">
            <PaygodMark size={48} />
            <span className="text-white font-extrabold tracking-tight" style={{ fontSize: 36 }}>paygod</span>
          </div>
          <p className="mt-3 text-center text-[16px] text-[#888]">Institutional Privacy Layer for LatAm Payments</p>
        </div>

        <div className="grid grid-cols-2 gap-4 w-full" style={{ maxWidth: 640 }}>
          <Card highlight className="flex flex-col items-center text-center">
            <Building2 size={32} className="text-white" />
            <h2 className="mt-4 text-[16px] font-bold text-white">Connect as Institution</h2>
            <p className="mt-2 mb-6 text-[13px] text-[#888]">Banks, Fintechs and Payment Institutions.</p>
            <Link href="/app/overview" className="w-full mt-auto">
              <Button variant="primary" className="w-full">Get Started</Button>
            </Link>
          </Card>

          <Card className="flex flex-col items-center text-center">
            <Shield size={32} className="text-white" />
            <h2 className="mt-4 text-[16px] font-bold text-white">Connect as Regulator</h2>
            <p className="mt-2 mb-6 text-[13px] text-[#888]">Regulators and Auditors with View Key access.</p>
            <Link href="/app/compliance" className="w-full mt-auto">
              <Button variant="outline" className="w-full">Get Started</Button>
            </Link>
          </Card>
        </div>

        <div className="mt-12 w-full flex flex-col items-center">
          <p className="text-[12px] text-[#888] mb-5">Trusted by and built on</p>
          <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-4">
            {trusted.map((it) => (
              <div
                key={it.label}
                className="flex items-center gap-2 transition-colors duration-150 cursor-default"
                style={{
                  color: "rgba(255,255,255,0.3)",
                  fontFamily: "Inter, sans-serif",
                  fontWeight: it.weight,
                  letterSpacing: it.tracking,
                  fontSize: 14,
                  padding: it.border ? "4px 10px" : 0,
                  border: it.border ? "1px solid rgba(255,255,255,0.15)" : undefined,
                }}
                onMouseEnter={(e) => (e.currentTarget.style.color = "rgba(255,255,255,0.7)")}
                onMouseLeave={(e) => (e.currentTarget.style.color = "rgba(255,255,255,0.3)")}
              >
                {it.icon}
                <span>{it.label}</span>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
