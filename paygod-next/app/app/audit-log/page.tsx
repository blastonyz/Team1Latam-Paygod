"use client";

import type React from "react";
import { Download, Lock, Eye } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Table, type TableColumn } from "@/components/ui/Table";
import { Pagination } from "@/components/app/Pagination";
import { MOCK_AUDIT_LOG, type MockAuditEntry } from "@/lib/mockData";

const filterControlStyle: React.CSSProperties = {
  backgroundColor: "#0F0F0F",
  border: "1px solid rgba(255,255,255,0.07)",
  color: "white",
  height: 36,
  padding: "0 12px",
  fontFamily: "Inter, sans-serif",
  fontSize: 13,
  fontWeight: 400,
  outline: "none",
};

function riskColor(score: number) {
  if (score >= 80) return "#4ADE80";
  if (score >= 40) return "#FBBF24";
  return "#ED3134";
}

export default function AuditLogPage() {
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
      key: "agentDecision",
      header: "Agent Decision",
      render: (r) => <Badge variant={r.agentDecision}>{r.agentDecision}</Badge>,
    },
    {
      key: "riskScore",
      header: "Risk Score",
      render: (r) => (
        <span className="text-[13px] font-semibold" style={{ color: riskColor(r.riskScore) }}>
          {r.riskScore}
        </span>
      ),
    },
    {
      key: "viewKeyStatus",
      header: "View Key Status",
      render: (r) =>
        r.viewKeyStatus === "sealed" ? (
          <span className="inline-flex items-center gap-1.5 text-[13px] text-[#888]"><Lock size={12} />Sealed</span>
        ) : (
          <span className="inline-flex items-center gap-1.5 text-[13px]" style={{ color: "#4ADE80" }}><Eye size={12} />Revealed</span>
        ),
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
        <h1 className="text-[28px] font-extrabold text-white tracking-tight">Audit Log</h1>
        <Button variant="outline" size="sm"><Download size={14} />Export</Button>
      </div>

      <div className="mt-8 flex items-center gap-2">
        <input type="text" placeholder="May 13, 2025 — May 20, 2025" style={filterControlStyle} className="placeholder:text-[#888]" />
        <select style={filterControlStyle} defaultValue="all">
          <option value="all">All Institutions</option>
          <option>Bankaool</option>
          <option>Finvero</option>
          <option>PayFin</option>
          <option>CreditLatam</option>
        </select>
        <select style={filterControlStyle} defaultValue="all">
          <option value="all">All Risk Levels</option>
          <option>Low</option>
          <option>Medium</option>
          <option>High</option>
        </select>
        <select style={filterControlStyle} defaultValue="all">
          <option value="all">All Statuses</option>
          <option>Approved</option>
          <option>Pending</option>
          <option>Flagged</option>
          <option>Blocked</option>
        </select>
        <div className="ml-auto"><Button variant="ghost" size="sm">Reset filters</Button></div>
      </div>

      <div className="mt-4">
        <Table
          columns={columns}
          data={MOCK_AUDIT_LOG}
          rowStyle={(r) =>
            r.agentDecision === "flagged" || r.agentDecision === "blocked"
              ? { backgroundColor: "rgba(237,49,52,0.03)" }
              : undefined
          }
        />
      </div>

      <Pagination rangeLabel="1–10 of 1,248" currentPage={1} totalPages={25} />
    </div>
  );
}
