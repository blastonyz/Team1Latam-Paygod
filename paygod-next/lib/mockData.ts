export type TransferStatus = "approved" | "pending" | "flagged";

export interface MockTransfer {
  id: string;
  amount: string;
  recipient: string;
  status: TransferStatus;
  timestamp: string;
}

export const MOCK_TRANSFERS: MockTransfer[] = [
  { id: "0x9f3a...7c2d", amount: "••••• DoC", recipient: "0x8b21...d4F9", status: "approved", timestamp: "May 20, 2025 14:32:11" },
  { id: "0x7c1e...3a9b", amount: "••••• DoC", recipient: "0x21d9...a8E1", status: "pending",  timestamp: "May 20, 2025 13:45:02" },
  { id: "0x5b8d...9e11", amount: "••••• DoC", recipient: "0xF78a...8c31", status: "approved", timestamp: "May 20, 2025 12:18:33" },
  { id: "0x2d4f...6b8a", amount: "••••• DoC", recipient: "0x3cA1...9d72", status: "flagged",  timestamp: "May 20, 2025 11:07:21" },
  { id: "0x1a2b...4c5d", amount: "••••• DoC", recipient: "0x9E0f...7a11", status: "approved", timestamp: "May 20, 2025 10:22:09" },
  { id: "0x8e7d...1f90", amount: "••••• DoC", recipient: "0xA3c2...2b44", status: "approved", timestamp: "May 20, 2025 09:15:44" },
  { id: "0x6a3c...8b71", amount: "••••• DoC", recipient: "0xD91f...cc02", status: "pending",  timestamp: "May 20, 2025 08:41:18" },
  { id: "0x4e8b...2d33", amount: "••••• DoC", recipient: "0x77Ab...e831", status: "approved", timestamp: "May 20, 2025 07:33:29" },
  { id: "0x3f2a...9d44", amount: "••••• DoC", recipient: "0xB02d...f119", status: "flagged",  timestamp: "May 20, 2025 06:12:07" },
  { id: "0x7b9c...0a55", amount: "••••• DoC", recipient: "0xC441...9923", status: "approved", timestamp: "May 20, 2025 05:01:53" },
];

export type AgentDecision = "approved" | "pending" | "flagged" | "blocked";
export type ViewKeyStatus = "sealed" | "revealed";

export interface MockAuditEntry {
  id: string;
  institution: string;
  agentDecision: AgentDecision;
  riskScore: number;
  viewKeyStatus: ViewKeyStatus;
  timestamp: string;
}

export const MOCK_AUDIT_LOG: MockAuditEntry[] = [
  { id: "0x9f3a...7c2d", institution: "Bankaool S.A.",        agentDecision: "approved", riskScore: 94, viewKeyStatus: "sealed",   timestamp: "May 20, 2025 14:32:11" },
  { id: "0x7c1e...3a9b", institution: "Finvero S.A. de C.V.", agentDecision: "pending",  riskScore: 72, viewKeyStatus: "sealed",   timestamp: "May 20, 2025 13:45:02" },
  { id: "0x5b8d...9e11", institution: "Bankaool S.A.",        agentDecision: "approved", riskScore: 96, viewKeyStatus: "sealed",   timestamp: "May 20, 2025 12:18:33" },
  { id: "0x2d4f...6b8a", institution: "PayFin México S.A.",   agentDecision: "flagged",  riskScore: 38, viewKeyStatus: "revealed", timestamp: "May 20, 2025 11:07:21" },
  { id: "0x1a2b...4c5d", institution: "Bankaool S.A.",        agentDecision: "approved", riskScore: 91, viewKeyStatus: "sealed",   timestamp: "May 20, 2025 10:22:09" },
  { id: "0x8e7d...1f90", institution: "Finvero S.A. de C.V.", agentDecision: "approved", riskScore: 88, viewKeyStatus: "sealed",   timestamp: "May 20, 2025 09:15:44" },
  { id: "0x6a3c...8b71", institution: "CreditLatam S.A.",     agentDecision: "pending",  riskScore: 65, viewKeyStatus: "sealed",   timestamp: "May 20, 2025 08:41:18" },
  { id: "0x4e8b...2d33", institution: "Bankaool S.A.",        agentDecision: "approved", riskScore: 93, viewKeyStatus: "sealed",   timestamp: "May 20, 2025 07:33:29" },
  { id: "0x3f2a...9d44", institution: "PayFin México S.A.",   agentDecision: "blocked",  riskScore: 22, viewKeyStatus: "revealed", timestamp: "May 20, 2025 06:12:07" },
  { id: "0x7b9c...0a55", institution: "Finvero S.A. de C.V.", agentDecision: "approved", riskScore: 90, viewKeyStatus: "sealed",   timestamp: "May 20, 2025 05:01:53" },
];

export const MOCK_DECRYPTED_TX = {
  id: "0x2d4f...6b8a",
  senderWallet: "0xA182C3D4E5F678901234567890ABCDEF12345678",
  recipientWallet: "0x9pB8E7F0DC584A39281716151413121110F0E0D0C",
  institution: "PayFin México S.A.",
  amountDecrypted: "125,340.75",
  currency: "DoC",
  timestamp: "May 20, 2025 11:07:21 UTC",
  riskScore: 38,
  agentDecision: "flagged" as AgentDecision,
  agentVersion: "Paygod Compliance Agent v2.1.4",
  viewKeyUsedBy: "Banxico — RegAudit-MX-2025-05-20-00077",
};

export const MOCK_STATS = {
  totalVolume: "1,248,392.75",
  pendingTransfers: 23,
  pendingRequireAttention: 2,
  complianceScore: 94,
  complianceLabel: "Excellent",
  volumeChange: "+18.7% vs last 30 days",
};

export const MOCK_AGENT_DETAIL = {
  txId: "0x2d4f...6b8a",
  walletAnalyzed: "0xA1B2...5678",
  walletFull: "0xA182C3D4E5F678901234567890ABCDEF12345678",
  riskScore: 94,
  riskLabel: "LOW",
  verificationCost: "0.0003",
  currency: "DoC",
  agentVersion: "Paygod Compliance Agent v2.1.4",
  checks: [
    { label: "OFAC Check",      result: "Clear", passed: true, durationMs: 87 },
    { label: "PEP Screening",   result: "Clear", passed: true, durationMs: 63 },
    { label: "Velocity Check",  result: "Clear", passed: true, durationMs: 94 },
    { label: "Blacklist Check", result: "Clear", passed: true, durationMs: 71 },
    { label: "Sanctions Check", result: "Clear", passed: true, durationMs: 58 },
  ],
  timeline: [
    { event: "Request received",                time: "12:34:56.123", durationMs: 42 },
    { event: "Wallet parsing & normalization",  time: "12:34:56.165", durationMs: 18 },
    { event: "OFAC screening",                  time: "12:34:56.183", durationMs: 87 },
    { event: "PEP screening",                   time: "12:34:56.270", durationMs: 63 },
    { event: "Velocity analysis",               time: "12:34:56.333", durationMs: 94 },
    { event: "Blacklist & sanctions",           time: "12:34:56.427", durationMs: 71 },
    { event: "Risk scoring",                    time: "12:34:56.498", durationMs: 33 },
    { event: "Decision: LOW",                   time: "12:34:56.531", durationMs: 31 },
  ],
  totalTimeMs: 549,
};
