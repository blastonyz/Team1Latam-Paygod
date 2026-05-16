"use client";

import { NewTransfer } from "@/components/app/NewTransfer";

export default function TransfersPage() {
  return (
    <div>
      <h1 className="text-white" style={{ fontSize: 28, fontWeight: 800, letterSpacing: "-0.02em" }}>
        Transfers
      </h1>
      <div style={{ marginTop: 32, maxWidth: 560, marginInline: "auto" }}>
        <NewTransfer />
      </div>
    </div>
  );
}
