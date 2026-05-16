"use client";

import { useState } from "react";
import Link from "next/link";
import { Search, Filter, X, Download } from "lucide-react";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Table, type TableColumn } from "@/components/ui/Table";
import { Pagination } from "@/components/app/Pagination";
import { MOCK_AUDIT_LOG, MOCK_DECRYPTED_TX, type MockAuditEntry } from "@/lib/mockData";

export default function CompliancePage() {
  const [drawerOpen, setDrawerOpen] = useState(false);

  const columns: TableColumn<MockAuditEntry>[] = [
    {
      key: "id",
      header: "TX ID",
      render: (r) => <span className="font-mono text-[13px] text-[#888]">{r.id}</span>,
    },
    {
      key: "institution",
      header: "Institution",
      render: (r) => <span className="text-[13px] text-white">{r.institution}</span>,
    },
    {
      key: "amount",
      header: "Amount",
      render: () => <span className="text-[13px] text-[#888]">•••••</span>,
    },
    {
      key: "status",
      header: "Status",
      render: (r) => <Badge variant={r.agentDecision}>{r.agentDecision}</Badge>,
    },
    {
      key: "timestamp",
      header: "Timestamp",
      render: (r) => <span className="text-[13px] text-[#888]">{r.timestamp}</span>,
    },
  ];

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-[28px] font-extrabold text-white tracking-tight">Regulatory Audit Dashboard</h1>
        <span
          className="inline-flex items-center gap-2 px-3 h-7 text-[12px] font-medium"
          style={{
            backgroundColor: "rgba(74,222,128,0.08)",
            border: "1px solid rgba(74,222,128,0.2)",
            color: "#4ADE80",
          }}
        >
          <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ backgroundColor: "#4ADE80" }} />
          View Key ID: Active
        </span>
      </div>
      <p className="mt-2 text-[13px] text-[#888]">Banxico — Authorized Auditor</p>

      <div className="mt-8 flex items-center gap-3">
        <Input className="flex-1" placeholder="Search by TX ID, wallet, or institution..." leftIcon={<Search size={14} />} />
        <Button variant="outline" size="sm">
          <Filter size={14} />
          Filters
        </Button>
      </div>

      <div className="mt-4">
        <Table
          columns={columns}
          data={MOCK_AUDIT_LOG}
          onRowClick={() => setDrawerOpen(true)}
          rowStyle={(r) =>
            r.agentDecision === "flagged" || r.agentDecision === "blocked"
              ? { backgroundColor: "rgba(237,49,52,0.03)" }
              : undefined
          }
        />
      </div>

      <Pagination rangeLabel="1–10 of 248" currentPage={1} totalPages={25} />

      <div
        className="fixed top-14 right-0 h-[calc(100vh-56px)] w-[360px] overflow-y-auto z-40 transition-transform duration-200 ease-out flex flex-col"
        style={{
          backgroundColor: "#0A0A0A",
          borderLeft: "1px solid rgba(255,255,255,0.07)",
          transform: drawerOpen ? "translateX(0)" : "translateX(100%)",
        }}
      >
        <div className="px-5 pt-5 pb-4" style={{ borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
          <div className="flex items-center justify-between">
            <h2 className="text-[14px] font-bold text-white">Transaction Details</h2>
            <button onClick={() => setDrawerOpen(false)} className="text-[#888] hover:text-white transition-colors" aria-label="Close drawer">
              <X size={16} />
            </button>
          </div>
          <div className="mt-3">
            <span
              className="inline-flex items-center gap-1.5 px-2 py-0.5 text-xs font-medium border"
              style={{ backgroundColor: "rgba(237,49,52,0.1)", color: "#ED3134", borderColor: "rgba(237,49,52,0.2)" }}
            >
              <span className="inline-block w-1.5 h-1.5 rounded-full" style={{ backgroundColor: "#ED3134" }} />
              Decrypted via View Key
            </span>
          </div>
        </div>

        <div className="flex-1 px-5 py-5 space-y-4">
          <DrawerRow label="TX ID" value={MOCK_DECRYPTED_TX.id} mono />
          <DrawerRow label="Institution" value={MOCK_DECRYPTED_TX.institution} />
          <DrawerRow label="Sender Wallet" value={MOCK_DECRYPTED_TX.senderWallet} mono small />
          <DrawerRow label="Recipient Wallet" value={MOCK_DECRYPTED_TX.recipientWallet} mono small />
          <div>
            <div className="text-[11px] uppercase tracking-[0.1em] font-medium text-[#888]">Amount</div>
            <div className="mt-1 text-[20px] font-bold" style={{ color: "#ED3134" }}>
              {MOCK_DECRYPTED_TX.amountDecrypted} {MOCK_DECRYPTED_TX.currency}
            </div>
          </div>
          <DrawerRow label="Timestamp" value={MOCK_DECRYPTED_TX.timestamp} />
          <div>
            <div className="text-[11px] uppercase tracking-[0.1em] font-medium text-[#888]">Risk Score</div>
            <div className="mt-1 text-[13px]" style={{ color: "#4ADE80" }}>
              LOW — {MOCK_DECRYPTED_TX.riskScore}/100
            </div>
          </div>
          <div>
            <div className="text-[11px] uppercase tracking-[0.1em] font-medium text-[#888]">Agent Decision</div>
            <div className="mt-1">
              <Badge variant="flagged">flagged</Badge>
            </div>
          </div>
          <div>
            <div className="text-[11px] uppercase tracking-[0.1em] font-medium text-[#888]">Compliance Agent</div>
            <div className="mt-1 text-[11px] text-[#888]">{MOCK_DECRYPTED_TX.agentVersion}</div>
          </div>
          <div>
            <div className="text-[11px] uppercase tracking-[0.1em] font-medium text-[#888]">View Key Used By</div>
            <div className="mt-1 text-[11px] text-[#888]">{MOCK_DECRYPTED_TX.viewKeyUsedBy}</div>
          </div>
        </div>

        <div className="px-4 py-4 flex flex-col gap-2" style={{ borderTop: "1px solid rgba(255,255,255,0.07)" }}>
          <Button variant="primary" className="w-full">
            <Download size={14} />
            Export Compliance Report
          </Button>
          <Link href={`/app/compliance/agent/${MOCK_DECRYPTED_TX.id}`} className="w-full">
            <Button variant="ghost" size="sm" className="w-full">View Agent Detail</Button>
          </Link>
        </div>
      </div>
    </div>
  );
}

function DrawerRow({ label, value, mono, small }: { label: string; value: string; mono?: boolean; small?: boolean }) {
  return (
    <div>
      <div className="text-[11px] uppercase tracking-[0.1em] font-medium text-[#888]">{label}</div>
      <div
        className={`mt-1 ${mono ? "font-mono" : ""} ${small ? "text-[11px] break-all" : "text-[13px]"} ${mono ? "text-[#888]" : "text-white"}`}
      >
        {value}
      </div>
    </div>
  );
}
