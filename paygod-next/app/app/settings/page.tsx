"use client";

import { useState } from "react";
import { Copy } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { MOCK_INSTITUTION } from "@/lib/mockAuth";

const Label = ({ children }: { children: React.ReactNode }) => (
  <div className="text-[11px] uppercase tracking-[0.1em] font-medium text-[#888] mb-4">{children}</div>
);

const Row = ({ label, children, divider }: { label: string; children: React.ReactNode; divider?: boolean }) => (
  <div
    className="flex items-center justify-between"
    style={{
      height: 48,
      borderBottom: divider ? "1px solid rgba(255,255,255,0.07)" : undefined,
    }}
  >
    <span className="text-[13px] text-[#888]">{label}</span>
    <div className="flex items-center gap-2">{children}</div>
  </div>
);

const Toggle = ({ value, onChange }: { value: boolean; onChange: (v: boolean) => void }) => (
  <button
    type="button"
    onClick={() => onChange(!value)}
    className="relative inline-flex items-center transition-colors duration-150"
    style={{ width: 36, height: 20, backgroundColor: value ? "#ED3134" : "#333", borderRadius: 999 }}
    aria-pressed={value}
  >
    <span
      className="inline-block bg-white transition-transform duration-150"
      style={{ width: 14, height: 14, borderRadius: 999, transform: value ? "translateX(19px)" : "translateX(3px)" }}
    />
  </button>
);

export default function SettingsPage() {
  const [agent, setAgent] = useState(true);
  const [autoBlock, setAutoBlock] = useState(true);

  const copy = () => {
    navigator.clipboard?.writeText(MOCK_INSTITUTION.wallet).catch(() => {});
  };

  return (
    <div>
      <h1 className="text-[28px] font-extrabold text-white tracking-tight">Settings</h1>
      <p className="mt-1 text-[13px] text-[#888]">Institution and account settings.</p>

      <div className="mt-8 flex flex-col gap-4">
        <Card>
          <Label>Institution</Label>
          <Row label="Name" divider>
            <span className="text-[14px] font-medium text-white">{MOCK_INSTITUTION.name}</span>
          </Row>
          <Row label="Wallet" divider>
            <span className="text-[13px] font-mono text-[#888]">{MOCK_INSTITUTION.walletShort}</span>
            <button onClick={copy} className="text-[#888] hover:text-white transition-colors" aria-label="Copy wallet">
              <Copy size={12} />
            </button>
          </Row>
          <Row label="Network">
            <span
              className="inline-flex items-center gap-1.5 px-2 py-0.5 text-[11px] font-medium"
              style={{ backgroundColor: "rgba(237,49,52,0.1)", color: "#ED3134", border: "1px solid rgba(237,49,52,0.2)" }}
            >
              <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: "#ED3134" }} />
              {MOCK_INSTITUTION.network}
            </span>
          </Row>
        </Card>

        <Card>
          <Label>Compliance</Label>
          <Row label="Compliance Agent" divider>
            <Toggle value={agent} onChange={setAgent} />
          </Row>
          <Row label="Auto-block high risk transfers" divider>
            <Toggle value={autoBlock} onChange={setAutoBlock} />
          </Row>
          <Row label="x402 payment per verification">
            <span className="text-[13px] text-[#888]">0.0003 AVAX</span>
          </Row>
        </Card>

        <Card>
          <Label>View Keys</Label>
          <Row label="Regulatory View Key" divider>
            <Badge variant="approved">Active</Badge>
          </Row>
          <Row label="Key rotation" divider>
            <span className="text-[13px] text-[#888]">Every 30 days</span>
          </Row>
          <Row label="Last rotated">
            <span className="text-[13px] text-[#888]">May 1, 2025</span>
          </Row>
          <div className="mt-4">
            <Button variant="outline" size="sm">Rotate Key Now</Button>
          </div>
        </Card>
      </div>

      <p className="mt-10 text-center text-[11px] text-[#888]">Paygod v1.2.3 · Built on Avalanche · Powered by eERC20</p>
    </div>
  );
}
