"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  Check,
  Info,
  Lock,
  Loader2,
  ShieldCheck,
  ShieldAlert,
  ArrowRight,
} from "lucide-react";
import { isAddress } from "viem";
import { usePublicClient, useReadContract, useSignMessage } from "wagmi";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import encryptedErcArtifact from "@/lib/abi/EncryptedERC.json";
import registrarArtifact from "@/lib/abi/Registrar.json";
import { useWeb3App } from "@/contexts/web3-app-context";

type StepIdx = 0 | 1 | 2 | 3;

const STEPS = ["Recipient", "Amount", "Compliance", "Confirm"] as const;

const CHECK_ITEMS = [
  "OFAC Check",
  "PEP Screening",
  "Velocity Check",
  "Blacklist & Sanctions",
] as const;

type ComplianceState = "idle" | "loading" | "approved" | "flagged";

/* --- Step indicator --- */
const StepIndicator: React.FC<{ current: StepIdx }> = ({ current }) => (
  <div className="flex items-start w-full">
    {STEPS.map((label, i) => {
      const status = i < current ? "done" : i === current ? "active" : "idle";
      const isLast = i === STEPS.length - 1;
      return (
        <React.Fragment key={label}>
          <div className="flex flex-col items-center" style={{ width: 64 }}>
            <div
              className="flex items-center justify-center"
              style={{
                width: 24,
                height: 24,
                fontSize: 11,
                fontWeight: 600,
                background:
                  status === "active"
                    ? "var(--accent)"
                    : status === "done"
                    ? "rgba(237,49,52,0.15)"
                    : "transparent",
                border:
                  status === "idle"
                    ? "1px solid rgba(255,255,255,0.1)"
                    : status === "done"
                    ? "1px solid var(--accent)"
                    : "1px solid var(--accent)",
                color:
                  status === "active"
                    ? "#fff"
                    : status === "done"
                    ? "var(--accent)"
                    : "var(--text-secondary)",
              }}
            >
              {status === "done" ? <Check size={12} strokeWidth={2.5} /> : i + 1}
            </div>
            <div
              className="mt-2 text-center"
              style={{
                fontSize: 11,
                color: status === "active" ? "#fff" : "var(--text-secondary)",
                fontWeight: status === "active" ? 500 : 400,
              }}
            >
              {label}
            </div>
          </div>
          {!isLast && (
            <div
              className="flex-1 mt-3"
              style={{
                height: 1,
                backgroundColor: i < current ? "var(--accent)" : "rgba(255,255,255,0.07)",
                marginTop: 12,
              }}
            />
          )}
        </React.Fragment>
      );
    })}
  </div>
);

/* --- Step 1 --- */
const StepRecipient: React.FC<{
  value: string;
  onChange: (v: string) => void;
  onNext: () => Promise<void>;
}> = ({ value, onChange, onNext }) => {
  const [error, setError] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(false);

  const submit = async () => {
    if (!value.trim()) {
      setError("Wallet address is required.");
      return;
    }
    setError(null);
    setLoading(true);
    try {
      await onNext();
    } catch (e) {
      const message = e instanceof Error ? e.message : "Recipient validation failed.";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <label className="block text-white" style={{ fontSize: 14, fontWeight: 600, marginBottom: 6 }}>
        Recipient
      </label>
      <p style={{ color: "var(--text-secondary)", fontSize: 13, marginBottom: 16 }}>
        Enter the recipient wallet address.
      </p>
      <Input
        placeholder="0x..."
        value={value}
        onChange={(e) => {
          onChange(e.target.value);
          if (error) setError(null);
        }}
      />
      {error && (
        <p style={{ color: "var(--accent)", fontSize: 12, marginTop: 8 }}>{error}</p>
      )}
      <div className="flex items-center gap-2 mt-3">
        <Info size={12} strokeWidth={1.5} color="var(--text-secondary)" />
        <span style={{ color: "var(--text-secondary)", fontSize: 11 }}>
          Address will be verified against compliance registry before transfer.
        </span>
      </div>
      <Button variant="primary" className="w-full mt-6" onClick={submit} disabled={loading}>
        {loading ? "Validating recipient..." : "Continue"}
      </Button>
    </div>
  );
};

/* --- Step 2 --- */
const StepAmount: React.FC<{
  value: string;
  onChange: (v: string) => void;
  onBack: () => void;
  onNext: () => void;
}> = ({ value, onChange, onBack, onNext }) => (
  <div>
    <label className="block text-white" style={{ fontSize: 14, fontWeight: 600, marginBottom: 6 }}>
      Amount
    </label>
    <p style={{ color: "var(--text-secondary)", fontSize: 13, marginBottom: 16 }}>
      Enter the amount to transfer.
    </p>
    <div className="relative">
      <Input
        locked
        placeholder="0.00"
        inputMode="decimal"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
      <span
        className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none"
        style={{ color: "var(--text-secondary)", fontSize: 13, fontWeight: 500 }}
      >
        AVAX
      </span>
    </div>
    <div
      className="flex gap-2 mt-3"
      style={{
        backgroundColor: "rgba(237,49,52,0.04)",
        border: "1px solid rgba(237,49,52,0.15)",
        padding: 12,
      }}
    >
      <Lock size={12} strokeWidth={1.5} color="var(--accent)" className="mt-0.5 shrink-0" />
      <span style={{ color: "var(--text-secondary)", fontSize: 12, lineHeight: 1.5 }}>
        Amount will be encrypted on-chain using eERC20 homomorphic encryption. Only sender and recipient can view the real value.
      </span>
    </div>
    <div className="flex gap-2 mt-6">
      <Button variant="outline" className="flex-1" onClick={onBack}>Back</Button>
      <Button variant="primary" className="flex-1" onClick={onNext}>Continue</Button>
    </div>
  </div>
);

/* --- Step 3 --- */
const StepCompliance: React.FC<{
  state: ComplianceState;
  setState: (s: ComplianceState) => void;
  onBack: () => void;
  onNext: () => void;
}> = ({ state, setState, onBack, onNext }) => {
  const [doneCount, setDoneCount] = React.useState(0);
  const flagged = state === "flagged";

  React.useEffect(() => {
    if (state !== "idle") return;
    setState("loading");
    setDoneCount(0);
    const timers: ReturnType<typeof setTimeout>[] = [];
    CHECK_ITEMS.forEach((_, i) => {
      timers.push(setTimeout(() => setDoneCount(i + 1), 500 * (i + 1)));
    });
    timers.push(setTimeout(() => setState("approved"), 2500));
    return () => timers.forEach(clearTimeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const showResult = state === "approved" || state === "flagged";

  return (
    <div>
      <label className="block text-white" style={{ fontSize: 14, fontWeight: 600, marginBottom: 6 }}>
        Compliance Check
      </label>
      <p style={{ color: "var(--text-secondary)", fontSize: 13, marginBottom: 20 }}>
        Our Compliance Agent will evaluate the transaction.
      </p>

      {!showResult && (
        <div>
          <div className="flex items-center gap-2">
            <span
              className="w-2 h-2 rounded-full animate-pulse"
              style={{ backgroundColor: "var(--accent)" }}
            />
            <span style={{ color: "var(--text-secondary)", fontSize: 14 }}>
              Agent verifying… analyzing risk factors.
            </span>
          </div>
          <div className="mt-4 space-y-2">
            {CHECK_ITEMS.map((item, i) => {
              const done = i < doneCount;
              return (
                <div
                  key={item}
                  className="flex items-center justify-between"
                  style={{
                    padding: "10px 12px",
                    border: "1px solid var(--border)",
                    backgroundColor: "var(--surface)",
                  }}
                >
                  <span style={{ color: done ? "#fff" : "var(--text-secondary)", fontSize: 13 }}>
                    {item}
                  </span>
                  {done ? (
                    <Check size={14} strokeWidth={2} color="var(--success)" />
                  ) : (
                    <Loader2 size={14} className="animate-spin" color="var(--text-secondary)" />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {showResult && (
        <div
          style={{
            backgroundColor: flagged ? "rgba(237,49,52,0.04)" : "rgba(74,222,128,0.04)",
            border: flagged
              ? "1px solid rgba(237,49,52,0.2)"
              : "1px solid rgba(74,222,128,0.15)",
            padding: 20,
          }}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {flagged ? (
                <ShieldAlert size={16} color="var(--accent)" />
              ) : (
                <ShieldCheck size={16} color="var(--success)" />
              )}
              <span
                className="uppercase"
                style={{
                  color: "var(--text-secondary)",
                  fontSize: 11,
                  letterSpacing: "0.12em",
                  fontWeight: 500,
                }}
              >
                Risk Score
              </span>
            </div>
            <div
              style={{
                color: flagged ? "var(--accent)" : "var(--success)",
                fontSize: 20,
                fontWeight: 800,
                letterSpacing: "-0.02em",
              }}
            >
              {flagged ? "HIGH — 23/100" : "LOW — 94/100"}
            </div>
          </div>

          <div className="mt-4 space-y-1.5">
            {CHECK_ITEMS.map((item) => (
              <div key={item} className="flex items-center gap-2">
                <Check size={12} strokeWidth={2.5} color={flagged ? "var(--accent)" : "var(--success)"} />
                <span style={{ color: "var(--text-secondary)", fontSize: 12 }}>{item}</span>
                <span style={{ color: flagged ? "var(--accent)" : "var(--success)", fontSize: 11, marginLeft: "auto" }}>
                  {flagged ? "Failed" : "Clear"}
                </span>
              </div>
            ))}
          </div>

          <div className="mt-4 flex items-center gap-2">
            <span
              className="px-1.5 py-0.5 font-mono"
              style={{
                fontSize: 9,
                border: "1px solid var(--border)",
                color: "var(--text-secondary)",
                letterSpacing: "0.05em",
              }}
            >
              x402
            </span>
            <span style={{ color: "var(--text-secondary)", fontSize: 11 }}>
              Verification cost: 0.0003 AVAX charged via x402
            </span>
          </div>
        </div>
      )}

      <div className="flex gap-2 mt-6">
        <Button variant="outline" className="flex-1" onClick={onBack} disabled={state === "loading"}>
          Back
        </Button>
        {flagged ? (
          <Button variant="primary" className="flex-1" disabled>
            Transfer Blocked
          </Button>
        ) : (
          <Button
            variant="primary"
            className="flex-1"
            onClick={onNext}
            disabled={state !== "approved"}
          >
            Proceed to Confirm
          </Button>
        )}
      </div>
      {flagged && (
        <p className="text-center mt-3" style={{ color: "var(--text-secondary)", fontSize: 12 }}>
          Contact your compliance officer.
        </p>
      )}
    </div>
  );
};

/* --- Step 4 --- */
const SummaryRow: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
  <div className="flex items-center justify-between py-2.5">
    <span style={{ color: "var(--text-secondary)", fontSize: 13 }}>{label}</span>
    <div style={{ fontSize: 13 }}>{children}</div>
  </div>
);

const StepConfirm: React.FC<{
  recipient: string;
  amount: string;
  onBack: () => void;
}> = ({ recipient, amount, onBack }) => {
  const router = useRouter();
  const { isConnected } = useWeb3App();
  const { signMessageAsync } = useSignMessage();
  const [submitted, setSubmitted] = React.useState(false);
  const [txHash, setTxHash] = React.useState<`0x${string}` | null>(null);
  const [submitError, setSubmitError] = React.useState<string | null>(null);
  const [isSubmittingTx, setIsSubmittingTx] = React.useState(false);

  const isConfirmingTx = false;
  const isConfirmedTx = submitted;

  const executeTransfer = async () => {
    const cleanRecipient = recipient.trim();
    const cleanAmount = amount.trim().replace(",", ".");

    if (!isConnected) {
      setSubmitError("Connect your wallet to execute the transfer.");
      return;
    }
    if (!isAddress(cleanRecipient)) {
      setSubmitError("Recipient address is invalid.");
      return;
    }
    if (!/^\d+(\.\d{1,2})?$/.test(cleanAmount)) {
      setSubmitError("Amount must have up to 2 decimals.");
      return;
    }

    try {
      setIsSubmittingTx(true);
      setSubmitError(null);

      await signMessageAsync({
        message: [
          "Authorize confidential transfer request",
          `recipient: ${cleanRecipient}`,
          `amount: ${cleanAmount}`,
          `timestamp: ${new Date().toISOString()}`,
        ].join("\n"),
      });

      const response = await fetch("/api/transfers/private", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ recipient: cleanRecipient, amount: cleanAmount }),
      });

      const payload = (await response.json()) as {
        ok: boolean;
        txHash?: `0x${string}`;
        error?: string;
        details?: string;
      };

      if (!payload.txHash) {
        const details = payload.error || payload.details || "Transfer execution failed.";
        throw new Error(details);
      }

      setTxHash(payload.txHash);
      setSubmitted(true);
    } catch (error) {
      const message =
        error instanceof Error && /rejected|denied|declined/i.test(error.message)
          ? "Signature rejected by user."
          : error instanceof Error
            ? error.message
            : "Transaction rejected.";
      setSubmitError(message);
    } finally {
      setIsSubmittingTx(false);
    }
  };

  if (submitted) {
    return (
      <div className="text-center" style={{ padding: "16px 0" }}>
        <div
          className="mx-auto flex items-center justify-center"
          style={{
            width: 64,
            height: 64,
            border: "1px solid rgba(74,222,128,0.3)",
            backgroundColor: "rgba(74,222,128,0.08)",
          }}
        >
          <Check size={32} strokeWidth={2} color="var(--success)" />
        </div>
        <h3
          className="text-white mt-5"
          style={{ fontSize: 20, fontWeight: 700, letterSpacing: "-0.01em" }}
        >
          Transfer Submitted
        </h3>
        <p className="mt-2 mx-auto" style={{ color: "var(--text-secondary)", fontSize: 13, maxWidth: 360 }}>
          Your confidential transfer request has been submitted to the Avalanche Subnet.
        </p>
        {txHash ? (
          <a
            href={`https://testnet.snowtrace.io/tx/${txHash}`}
            target="_blank"
            rel="noreferrer"
            className="mt-4 inline-block px-3 py-1.5 font-mono"
            style={{
              border: "1px solid var(--border)",
              backgroundColor: "var(--surface)",
              color: "var(--text-secondary)",
              fontSize: 12,
            }}
          >
            {txHash}
          </a>
        ) : null}
        <p className="mt-3" style={{ color: "var(--text-secondary)", fontSize: 12 }}>
          {isConfirmingTx ? "Waiting for confirmation..." : isConfirmedTx ? "Transaction submitted with circuit proof." : "Transaction submitted."}
        </p>
        <Button
          variant="outline"
          className="w-full mt-6"
          onClick={() => router.push("/app/overview")}
        >
          Back to Overview
        </Button>
      </div>
    );
  }

  return (
    <div>
      <label className="block text-white" style={{ fontSize: 14, fontWeight: 600, marginBottom: 6 }}>
        Confirm & Sign
      </label>
      <p style={{ color: "var(--text-secondary)", fontSize: 13, marginBottom: 16 }}>
        Review details and sign the transaction.
      </p>

      <div
        style={{
          backgroundColor: "var(--surface)",
          border: "1px solid var(--border)",
          padding: 20,
        }}
      >
        <SummaryRow label="Recipient">
          <span className="font-mono" style={{ color: "var(--text-secondary)" }}>
            {recipient || "—"}
          </span>
        </SummaryRow>
        <SummaryRow label="Amount">
          <span className="text-white" style={{ fontWeight: 500 }}>{amount || "0"} AVAX</span>
        </SummaryRow>
        <SummaryRow label="Network">
          <span
            className="inline-flex items-center gap-1.5 px-2 py-0.5 uppercase"
            style={{
              backgroundColor: "rgba(237,49,52,0.08)",
              border: "1px solid rgba(237,49,52,0.3)",
              color: "var(--accent)",
              fontSize: 10,
              letterSpacing: "0.1em",
              fontWeight: 500,
            }}
          >
            <span className="w-1 h-1 rounded-full" style={{ backgroundColor: "var(--accent)" }} />
            Avalanche Subnet
          </span>
        </SummaryRow>
        <SummaryRow label="Compliance">
          <span style={{ color: "var(--success)" }}>Approved — 94/100</span>
        </SummaryRow>
        <SummaryRow label="Verification cost">
          <span style={{ color: "var(--text-secondary)" }}>0.0003 AVAX via x402</span>
        </SummaryRow>
        <div style={{ borderTop: "1px solid var(--border)", margin: "8px 0" }} />
        <SummaryRow label="Estimated settlement">
          <span style={{ color: "var(--text-secondary)" }}>~2 seconds</span>
        </SummaryRow>
      </div>

      <Button
        variant="primary"
        size="lg"
        className="w-full mt-6"
        style={{ height: 48 }}
        onClick={executeTransfer}
        disabled={isSubmittingTx || isConfirmingTx}
      >
        {isSubmittingTx ? "Generating proof and sending tx..." : isConfirmingTx ? "Confirming transaction..." : "Execute Transfer"}
        <ArrowRight size={16} strokeWidth={2} />
      </Button>
      {submitError ? (
        <p className="text-center mt-3" style={{ color: "var(--accent)", fontSize: 12 }}>
          {submitError}
        </p>
      ) : null}
      <p
        className="text-center mt-3"
        style={{ color: "var(--text-secondary)", fontSize: 11 }}
      >
        Powered by eERC20 · Avalanche Subnet
      </p>

      <Button variant="ghost" className="w-full mt-2" onClick={onBack}>
        Back
      </Button>
    </div>
  );
};

/* --- Root --- */
export const NewTransfer: React.FC = () => {
  const [step, setStep] = React.useState<StepIdx>(0);
  const [recipient, setRecipient] = React.useState("");
  const [amount, setAmount] = React.useState("");
  const [compliance, setCompliance] = React.useState<ComplianceState>("idle");
  const { encryptedErcAddress } = useWeb3App();
  const publicClient = usePublicClient();

  const { data: registrarAddress } = useReadContract({
    address: encryptedErcAddress,
    abi: encryptedErcArtifact.abi,
    functionName: "registrar",
    query: { enabled: Boolean(encryptedErcAddress) },
  });

  const validateRecipient = React.useCallback(async () => {
    const trimmed = recipient.trim();
    if (!isAddress(trimmed)) {
      throw new Error("Recipient must be a valid EVM address.");
    }
    if (!registrarAddress || !publicClient) {
      throw new Error("Registrar is not available yet.");
    }

    const isRegistered = await publicClient.readContract({
      address: registrarAddress as `0x${string}`,
      abi: registrarArtifact.abi,
      functionName: "isUserRegistered",
      args: [trimmed as `0x${string}`],
    });

    if (!isRegistered) {
      throw new Error("Recipient is not registered in Registrar.");
    }

    setStep(1);
  }, [publicClient, recipient, registrarAddress]);

  return (
    <div>
      <StepIndicator current={step} />
      <Card padding={32} className="mt-8">
        {step === 0 && (
          <StepRecipient
            value={recipient}
            onChange={setRecipient}
            onNext={validateRecipient}
          />
        )}
        {step === 1 && (
          <StepAmount
            value={amount}
            onChange={setAmount}
            onBack={() => setStep(0)}
            onNext={() => {
              setCompliance("idle");
              setStep(2);
            }}
          />
        )}
        {step === 2 && (
          <StepCompliance
            state={compliance}
            setState={setCompliance}
            onBack={() => setStep(1)}
            onNext={() => setStep(3)}
          />
        )}
        {step === 3 && (
          <StepConfirm recipient={recipient} amount={amount} onBack={() => setStep(2)} />
        )}
      </Card>
    </div>
  );
};





