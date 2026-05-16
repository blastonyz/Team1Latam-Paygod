"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, Check, Copy } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { MOCK_AGENT_DETAIL } from "@/lib/mockData";

const SectionLabel = ({ children, right }: { children: React.ReactNode; right?: React.ReactNode }) => (
  <div className="flex items-center justify-between mb-4">
    <span className="text-[11px] uppercase tracking-[0.1em] font-medium text-[#888]">{children}</span>
    {right}
  </div>
);

const Divider = () => <div className="my-4" style={{ borderTop: "1px solid rgba(255,255,255,0.07)" }} />;

function durColor(ms: number) {
  if (ms < 50) return "#4ADE80";
  if (ms < 90) return "#FBBF24";
  return "#ED3134";
}

export default function AgentDetailPage() {
  const params = useParams<{ txId: string }>();
  const txId = Array.isArray(params.txId) ? params.txId[0] : params.txId;
  const d = MOCK_AGENT_DETAIL;

  const copyAddress = () => {
    navigator.clipboard?.writeText(d.walletFull).catch(() => {});
  };

  return (
    <div>
      <Link href="/app/compliance">
        <Button variant="ghost" size="sm"><ArrowLeft size={14} />Back to Compliance</Button>
      </Link>

      <div className="mt-4 flex items-center justify-between">
        <h1 className="text-[20px] font-bold text-white">Compliance Agent — Verification Detail</h1>
        <Badge variant="flagged">Flagged</Badge>
      </div>
      <p className="mt-1 text-[11px] text-[#888] font-mono">TX: {txId}</p>

      <div className="mt-6 grid gap-4" style={{ gridTemplateColumns: "55fr 45fr" }}>
        <div className="flex flex-col gap-4">
          <Card>
            <SectionLabel>Transaction</SectionLabel>
            <div>
              <div className="text-[11px] uppercase tracking-[0.1em] font-medium text-[#888]">Wallet Analyzed</div>
              <div className="mt-1 text-[16px] font-semibold text-white font-mono">{d.walletAnalyzed}</div>
              <div className="mt-1 flex items-center gap-2">
                <span className="text-[11px] text-[#888] font-mono break-all">{d.walletFull}</span>
                <button onClick={copyAddress} className="text-[#888] hover:text-white transition-colors" aria-label="Copy address">
                  <Copy size={12} />
                </button>
              </div>
            </div>
            <Divider />
            <div>
              <div className="text-[11px] uppercase tracking-[0.1em] font-medium text-[#888]">Risk Score</div>
              <div className="mt-1 text-[24px] font-extrabold" style={{ color: "#4ADE80" }}>
                {d.riskLabel} — {d.riskScore}/100
              </div>
              <div className="text-[12px]" style={{ color: "#4ADE80" }}>Excellent</div>
            </div>
            <Divider />
            <div>
              <div className="text-[11px] uppercase tracking-[0.1em] font-medium text-[#888]">Verification Cost</div>
              <div className="mt-1 flex items-center gap-2">
                <span className="text-[14px] font-semibold text-white">{d.verificationCost} {d.currency}</span>
                <span className="inline-flex items-center px-2 py-0.5 text-[10px] font-medium text-[#888]" style={{ backgroundColor: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)" }}>
                  charged via x402
                </span>
              </div>
            </div>
          </Card>

          <Card>
            <SectionLabel right={<span className="text-[12px]" style={{ color: "#4ADE80" }}>All checks passed</span>}>
              Checks Summary
            </SectionLabel>
            <div>
              {d.checks.map((c, i) => (
                <div key={c.label} className="flex items-center gap-3" style={{ height: 40, borderBottom: i < d.checks.length - 1 ? "1px solid rgba(255,255,255,0.07)" : undefined }}>
                  <Check size={14} style={{ color: "#4ADE80" }} />
                  <span className="flex-1 text-[13px] text-white">{c.label}</span>
                  <span className="text-[12px] font-medium" style={{ color: "#4ADE80" }}>{c.result}</span>
                  <span className="text-[11px] text-[#888] w-12 text-right">{c.durationMs}ms</span>
                </div>
              ))}
            </div>
          </Card>
        </div>

        <Card>
          <SectionLabel>Agent Execution Timeline</SectionLabel>
          <div>
            {d.timeline.map((t, i) => {
              const isFirst = i === 0;
              const isLast = i === d.timeline.length - 1;
              const dotColor = isFirst || isLast ? "#ED3134" : "rgba(255,255,255,0.2)";
              return (
                <div key={t.event} className="flex items-center gap-3 relative" style={{ height: 44, borderBottom: !isLast ? "1px solid rgba(255,255,255,0.07)" : undefined }}>
                  <div className="relative flex flex-col items-center" style={{ width: 12 }}>
                    <span className="rounded-full" style={{ width: 6, height: 6, backgroundColor: dotColor, zIndex: 1 }} />
                    {!isLast && <span className="absolute" style={{ top: "50%", width: 1, height: 44, backgroundColor: "rgba(255,255,255,0.07)" }} />}
                  </div>
                  <span className={`flex-1 text-[13px] ${isLast ? "font-semibold" : ""}`} style={{ color: isLast ? "#4ADE80" : "white" }}>{t.event}</span>
                  <span className="text-[11px] text-[#888] font-mono">{t.time}</span>
                  <span className="text-[12px] font-semibold w-14 text-right" style={{ color: durColor(t.durationMs) }}>{t.durationMs}ms</span>
                </div>
              );
            })}
          </div>

          <div className="mt-3 pt-3" style={{ borderTop: "1px solid rgba(255,255,255,0.07)" }}>
            <div className="flex items-center justify-between">
              <span className="text-[13px] font-medium text-white">Total time</span>
              <span className="text-[16px] font-bold text-white">{d.totalTimeMs}ms</span>
            </div>
            <div className="mt-3 flex items-center justify-between">
              <span className="text-[11px] text-[#888]">Verified by {d.agentVersion}</span>
              <span className="inline-flex items-center gap-2 text-[11px] text-[#888]">Powered by
                <span className="inline-flex items-center px-1.5 py-0.5 text-[10px] font-bold text-white" style={{ border: "1px solid rgba(255,255,255,0.15)" }}>x402</span>
                payments
              </span>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
