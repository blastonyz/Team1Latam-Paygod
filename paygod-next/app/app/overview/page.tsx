"use client";

import Link from "next/link";
import { ArrowUp, AlertTriangle } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Table, type TableColumn } from "@/components/ui/Table";
import { MOCK_STATS, MOCK_TRANSFERS, type MockTransfer } from "@/lib/mockData";
import { useRealtimeTransactions } from "@/hooks/useRealtimeTransactions";
import { Transaction } from "@/lib/supabase";

const Label = ({ children }: { children: React.ReactNode }) => (
  <div
    className="uppercase"
    style={{
      color: "var(--text-secondary)",
      fontSize: 11,
      fontWeight: 500,
      letterSpacing: "0.12em",
    }}
  >
    {children}
  </div>
);

const Value = ({ children }: { children: React.ReactNode }) => (
  <div className="text-white mt-3" style={{ fontSize: 32, fontWeight: 800, letterSpacing: "-0.03em", lineHeight: 1.1 }}>
    {children}
  </div>
);

const ScoreRing = ({ value, size = 56 }: { value: number; size?: number }) => {
  const stroke = 5;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const offset = c * (1 - value / 100);
  return (
    <svg width={size} height={size} viewBox={"0 0 " + size + " " + size}>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth={stroke} />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        stroke="var(--accent)"
        strokeWidth={stroke}
        strokeDasharray={c}
        strokeDashoffset={offset}
        strokeLinecap="butt"
        transform={"rotate(-90 " + (size / 2) + " " + (size / 2) + ")"}
      />
    </svg>
  );
};

type TransactionRow = MockTransfer | Transaction;

const columns: TableColumn<TransactionRow>[] = [
  {
    key: "id",
    header: "TX Hash",
    render: (r) => {
      const txHash = (r as any).id || (r as any).tx_hash || "";
      const displayHash = txHash.length > 10 ? txHash.substring(0, 10) + "..." : txHash;
      return <span className="font-mono" style={{ color: "var(--text-secondary)", fontSize: 13 }}>{displayHash}</span>;
    },
  },
  {
    key: "amount",
    header: "Amount",
    render: (r) => {
      const amount = (r as any).amount || (r as any).amount_encrypted || "••••• AVAX";
      return <span className="text-white" style={{ fontSize: 13, fontWeight: 500 }}>{amount}</span>;
    },
  },
  {
    key: "recipient",
    header: "Recipient",
    render: (r) => {
      const recipient = (r as any).recipient || (r as any).recipient_wallet || "";
      const displayRecipient = recipient.length > 10 ? recipient.substring(0, 10) + "..." : recipient;
      return <span className="font-mono" style={{ color: "var(--text-secondary)", fontSize: 13 }}>{displayRecipient}</span>;
    },
  },
  {
    key: "status",
    header: "Status",
    render: (r) => <Badge variant={(r as any).status} />,
  },
  {
    key: "timestamp",
    header: "Timestamp",
    render: (r) => <span style={{ color: "var(--text-secondary)", fontSize: 12 }}>{r.timestamp}</span>,
  },
];

export default function OverviewPage() {
  const { transactions, loading, error } = useRealtimeTransactions(6);
  
  // Use Supabase transactions if available and loaded, fallback to mock data
  const displayTransactions = (transactions && transactions.length > 0) ? transactions : MOCK_TRANSFERS.slice(0, 6);

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-white" style={{ fontSize: 28, fontWeight: 800, letterSpacing: "-0.02em" }}>
          Overview
        </h1>
        <Link href="/app/transfers">
          <Button variant="primary" size="sm">New Transfer</Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3" style={{ marginTop: 32 }}>
        <Card padding={24}>
          <Label>Total Volume</Label>
          <Value>
            {MOCK_STATS.totalVolume}{" "}
            <span style={{ fontSize: 18, fontWeight: 600, color: "var(--text-secondary)" }}>AVAX</span>
          </Value>
          <div className="flex items-center gap-1 mt-3" style={{ color: "var(--success)", fontSize: 12 }}>
            <ArrowUp size={12} strokeWidth={2} />
            <span>{MOCK_STATS.volumeChange}</span>
          </div>
        </Card>

        <Card padding={24}>
          <Label>Pending Transfers</Label>
          <Value>{MOCK_STATS.pendingTransfers}</Value>
          <div className="flex items-center gap-1 mt-3" style={{ color: "var(--warning)", fontSize: 12 }}>
            <AlertTriangle size={12} strokeWidth={2} />
            <span>{MOCK_STATS.pendingRequireAttention} require attention</span>
          </div>
        </Card>

        <Card padding={24}>
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <Label>Compliance Score</Label>
              <Value>
                {MOCK_STATS.complianceScore}{" "}
                <span style={{ fontSize: 18, fontWeight: 600, color: "var(--text-secondary)" }}>/ 100</span>
              </Value>
              <div className="mt-3" style={{ color: "var(--success)", fontSize: 12 }}>
                {MOCK_STATS.complianceLabel}
              </div>
            </div>
            <ScoreRing value={MOCK_STATS.complianceScore} />
          </div>
        </Card>
      </div>

      <div style={{ marginTop: 40 }}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-white" style={{ fontSize: 16, fontWeight: 700 }}>Recent Transfers</h2>
          <Link href="/app/audit-log">
            <Button variant="ghost" size="sm">View all</Button>
          </Link>
        </div>

        <Card padding={0}>
          <Table columns={columns} data={displayTransactions as TransactionRow[]} />
        </Card>

        <p className="mt-4 uppercase" style={{ color: "var(--text-secondary)", fontSize: 11, letterSpacing: "0.05em", textAlign: "center" }}>
          All amounts are encrypted on-chain using eERC20.
        </p>
      </div>
    </div>
  );
}
