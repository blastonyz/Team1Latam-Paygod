"use client";

import { useEffect, useState } from "react";
import { Copy, CheckCircle, XCircle, ExternalLink } from "lucide-react";
import { formatPrivKeyForBabyJub, poseidonDecrypt } from "maci-crypto";
import { mulPointEscalar } from "@zk-kit/baby-jubjub";
import { decodeEventLog, isAddress, parseAbi } from "viem";
import { useAccount, usePublicClient, useReadContract, useWaitForTransactionReceipt, useWriteContract } from "wagmi";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Input } from "@/components/ui/Input";
import { MOCK_INSTITUTION } from "@/lib/mockAuth";
import encryptedErcArtifact from "@/lib/abi/EncryptedERC.json";
import registrarArtifact from "@/lib/abi/Registrar.json";
import { useWeb3App } from "@/contexts/web3-app-context";

interface OpResult {
  ok?: boolean;
  error?: string;
  txHash?: string | null;
  event?: "PrivateBurn" | "PrivateMint" | "PrivateTransfer";
  from?: `0x${string}`;
  to?: `0x${string}`;
  user?: `0x${string}`;
  alreadyRegistered?: boolean;
  registeredAddress?: string;
  auditorAddress?: string;
  registrarAddress?: string | null;
  decrypted?: any;
  snowtraceUrl?: string | null;
  output?: string;
  proof?: {
    proofPoints: {
      a: [string, string];
      b: [[string, string], [string, string]];
      c: [string, string];
    };
    publicSignals: [string, string, string, string, string];
  } | null;
  registerMode?: string;
}

const privateEventsAbi = parseAbi([
  "event PrivateTransfer(address indexed from, address indexed to, uint256[7] auditorPCT, address indexed auditorAddress)",
  "event PrivateMint(address indexed user, uint256[7] auditorPCT, address indexed auditorAddress)",
  "event PrivateBurn(address indexed user, uint256[7] auditorPCT, address indexed auditorAddress)",
]);

const hexRegex = /^0x[0-9a-fA-F]+$/;
const viewKeyStoragePrefix = "paygod.viewkey";

function normalizeHex(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return "";
  return trimmed.startsWith("0x") ? trimmed : `0x${trimmed}`;
}

function decryptPct(pct: bigint[], privateKey: bigint) {
  const ciphertext = pct.slice(0, 4);
  const authKey = pct.slice(4, 6) as [bigint, bigint];
  const nonce = pct[6];
  const sharedKey = mulPointEscalar(authKey, formatPrivKeyForBabyJub(privateKey));
  const dec = poseidonDecrypt(ciphertext, sharedKey, nonce, 1);
  return { amountBaseUnits: dec[0].toString(), nonce: nonce.toString() };
}

function getViewKeyStorageKey(walletAddress: string) {
  return `${viewKeyStoragePrefix}.${walletAddress.toLowerCase()}`;
}

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
  const { address, isConnected } = useAccount();
  const { encryptedErcAddress, rpcUrl } = useWeb3App();
  const publicClient = usePublicClient();
  const [agent, setAgent] = useState(true);
  const [autoBlock, setAutoBlock] = useState(true);
  const [registerAddress, setRegisterAddress] = useState("");
  const [auditorAddress, setAuditorAddress] = useState("0x90813c2C61EE01857c2fDfD003f5272b540a7AA7");
  const [decryptTxHash, setDecryptTxHash] = useState("0xa15ebfdd2e2e917b2ca51fcf3a1a35536da97e5e3a5707d8aa904ff38cfe52bb");
  const [decryptPrivateKey, setDecryptPrivateKey] = useState("");
  const [hasStoredViewKey, setHasStoredViewKey] = useState(false);
  const [registerLoading, setRegisterLoading] = useState(false);
  const [auditorLoading, setAuditorLoading] = useState(false);
  const [decryptLoading, setDecryptLoading] = useState(false);
  const [registerResult, setRegisterResult] = useState<OpResult | null>(null);
  const [auditorResult, setAuditorResult] = useState<OpResult | null>(null);
  const [decryptResult, setDecryptResult] = useState<OpResult | null>(null);

  const { data: registrarAddress } = useReadContract({
    address: encryptedErcAddress,
    abi: encryptedErcArtifact.abi,
    functionName: "registrar",
    query: { enabled: Boolean(encryptedErcAddress) },
  });

  const { writeContractAsync, data: registerTxHash, isPending: isSubmittingRegisterTx } = useWriteContract();
  const { isLoading: isWaitingRegisterTx } = useWaitForTransactionReceipt({
    hash: registerTxHash,
    query: { enabled: Boolean(registerTxHash) },
  });

  useEffect(() => {
    if (address) {
      setRegisterAddress(address);
    }
  }, [address]);

  useEffect(() => {
    if (!address || typeof window === "undefined") {
      setHasStoredViewKey(false);
      return;
    }
    const stored = window.localStorage.getItem(getViewKeyStorageKey(address));
    setHasStoredViewKey(Boolean(stored));
  }, [address]);

  const copy = () => {
    navigator.clipboard?.writeText(MOCK_INSTITUTION.wallet).catch(() => {});
  };

  const parseRegisterProof = (proof: NonNullable<OpResult["proof"]>) => ({
    proofPoints: {
      a: proof.proofPoints.a.map((value) => BigInt(value)) as [bigint, bigint],
      b: proof.proofPoints.b.map((pair) => pair.map((value) => BigInt(value)) as [bigint, bigint]) as [[bigint, bigint], [bigint, bigint]],
      c: proof.proofPoints.c.map((value) => BigInt(value)) as [bigint, bigint],
    },
    publicSignals: proof.publicSignals.map((value) => BigInt(value)) as [bigint, bigint, bigint, bigint, bigint],
  });

  const ResultDisplay = ({ result }: { result: OpResult | null }) => {
    if (!result) return null;
    const isSuccess = result.ok === true;
    return (
      <div
        style={{
          border: `1px solid ${ isSuccess ? 'rgba(74,222,128,0.3)' : 'rgba(239,68,68,0.3)'}`,
          backgroundColor: isSuccess ? 'rgba(74,222,128,0.05)' : 'rgba(239,68,68,0.05)',
          borderRadius: 4,
          padding: 12,
          marginTop: 8,
        }}
      >
        <div className="flex items-start gap-2">
          {isSuccess ? (
            <CheckCircle size={16} style={{ color: '#4ADE80', marginTop: 2, flexShrink: 0 }} />
          ) : (
            <XCircle size={16} style={{ color: '#EF4444', marginTop: 2, flexShrink: 0 }} />
          )}
          <div className="flex-1" style={{ fontSize: 12 }}>
            {result.error ? (
              <div style={{ color: '#EF4444', fontWeight: 500 }}>{result.error}</div>
            ) : (
              <div>
                {result.alreadyRegistered && (
                  <div style={{ color: '#FFA500', fontWeight: 500, marginBottom: 6 }}>Already Registered</div>
                )}
                {result.registeredAddress && (
                  <div style={{ color: '#B9B9B9', marginBottom: 4 }}>
                    <span style={{ color: '#888' }}>Address: </span>
                    <span className="font-mono" style={{ color: '#FFF' }}>{result.registeredAddress.slice(0, 8)}...{result.registeredAddress.slice(-6)}</span>
                  </div>
                )}
                {result.auditorAddress && (
                  <div style={{ color: '#B9B9B9', marginBottom: 4 }}>
                    <span style={{ color: '#888' }}>Auditor: </span>
                    <span className="font-mono" style={{ color: '#FFF' }}>{result.auditorAddress.slice(0, 8)}...{result.auditorAddress.slice(-6)}</span>
                  </div>
                )}
                {result.txHash && result.txHash !== 'ALREADY_REGISTERED' && (
                  <div style={{ color: '#B9B9B9', marginBottom: 4 }}>
                    <span style={{ color: '#888' }}>Tx: </span>
                    <span className="font-mono" style={{ color: '#FFF' }}>{result.txHash.slice(0, 12)}...{result.txHash.slice(-8)}</span>
                  </div>
                )}
                {result.decrypted && (
                  <div style={{ color: '#B9B9B9' }}>
                    <span style={{ color: '#888' }}>Amount: </span>
                    <span style={{ color: '#FFF' }}>{BigInt(result.decrypted.amountBaseUnits || 0) / 100n} AVAX</span>
                  </div>
                )}
              </div>
            )}
          </div>
          {result.snowtraceUrl && (
            <a
              href={result.snowtraceUrl}
              target="_blank"
              rel="noreferrer"
              className="text-[#ED3134] hover:text-[#C42528] transition-colors flex-shrink-0"
              title="View on Snowtrace"
            >
              <ExternalLink size={14} />
            </a>
          )}
        </div>
      </div>
    );
  };

  const runRegister = async () => {
    try {
      if (!address || !isConnected) {
        setRegisterResult({ ok: false, error: "Connect the wallet you want to register first." });
        return;
      }

      if (!registrarAddress) {
        setRegisterResult({ ok: false, error: "Registrar is not available yet." });
        return;
      }

      if (registerAddress.trim().toLowerCase() !== address.toLowerCase()) {
        setRegisterResult({ ok: false, error: "Registration must use the connected wallet address." });
        return;
      }

      setRegisterLoading(true);
      setRegisterResult(null);
      const response = await fetch("/api/users/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          address: registerAddress.trim(),
          registrarAddress,
        }),
      });
      const payload = await response.json();

      if (!response.ok) {
        setRegisterResult(payload);
        return;
      }

      if (payload.alreadyRegistered) {
        setRegisterResult(payload);
        return;
      }

      if (!payload.proof) {
        setRegisterResult({ ok: false, error: "Register proof was not returned by the backend." });
        return;
      }

      const txHash = await writeContractAsync({
        address: (payload.registrarAddress || registrarAddress) as `0x${string}`,
        abi: registrarArtifact.abi,
        functionName: "register",
        args: [parseRegisterProof(payload.proof)],
      });

      setRegisterResult({
        ...payload,
        ok: true,
        txHash,
        snowtraceUrl: `https://testnet.snowtrace.io/tx/${txHash}`,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "unexpected error";
      setRegisterResult({ ok: false, error: message });
    } finally {
      setRegisterLoading(false);
    }
  };

  const runSetAuditor = async () => {
    try {
      setAuditorLoading(true);
      setAuditorResult(null);
      const response = await fetch("/api/auditor/set", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ auditorAddress: auditorAddress.trim() }),
      });
      const payload = await response.json();
      setAuditorResult(payload);
    } catch (error) {
      const message = error instanceof Error ? error.message : "unexpected error";
      setAuditorResult({ ok: false, error: message });
    } finally {
      setAuditorLoading(false);
    }
  };

  const runDecrypt = async () => {
    try {
      setDecryptLoading(true);
      setDecryptResult(null);

      const txHash = decryptTxHash.trim();
      if (!/^0x[0-9a-fA-F]{64}$/.test(txHash)) {
        setDecryptResult({ ok: false, error: "Invalid tx hash." });
        return;
      }

      if (rpcUrl.includes("YOUR_ALCHEMY_KEY")) {
        setDecryptResult({
          ok: false,
          error: "Invalid RPC URL: NEXT_PUBLIC_AVA_RPC_URL still has YOUR_ALCHEMY_KEY.",
        });
        return;
      }

      if (!publicClient) {
        setDecryptResult({ ok: false, error: "RPC client is not available yet." });
        return;
      }

      if (!isAddress(encryptedErcAddress || "")) {
        setDecryptResult({ ok: false, error: "EncryptedERC address is not configured." });
        return;
      }

      const walletStoredKey =
        address && typeof window !== "undefined"
          ? window.localStorage.getItem(getViewKeyStorageKey(address)) || ""
          : "";

      const normalizedPrivateKey = normalizeHex(decryptPrivateKey || walletStoredKey);

      if (!normalizedPrivateKey) {
        setDecryptResult({
          ok: false,
          error: "No local view key for this wallet. Save it once and decrypt will run client-side.",
        });
        return;
      }

      if (!hexRegex.test(normalizedPrivateKey)) {
        setDecryptResult({ ok: false, error: "Private key must be valid hex." });
        return;
      }

      const receipt = await publicClient.getTransactionReceipt({ hash: txHash as `0x${string}` });

      for (const log of receipt.logs) {
        if (log.address.toLowerCase() !== String(encryptedErcAddress).toLowerCase()) {
          continue;
        }

        try {
          const parsed = decodeEventLog({
            abi: privateEventsAbi,
            data: log.data,
            topics: log.topics,
            strict: false,
          });

          const args = parsed.args as {
            from?: `0x${string}`;
            to?: `0x${string}`;
            user?: `0x${string}`;
            auditorAddress?: `0x${string}`;
            auditorPCT?: readonly bigint[];
          };

          if (!args.auditorPCT || args.auditorPCT.length !== 7) {
            continue;
          }

          const decrypted = decryptPct([...args.auditorPCT], BigInt(normalizedPrivateKey));

          setDecryptResult({
            ok: true,
            txHash,
            event: parsed.eventName,
            auditorAddress: args.auditorAddress,
            decrypted,
            from: args.from,
            to: args.to,
            user: args.user,
            output: "Decrypted in browser using wallet-scoped local key. No backend call.",
            snowtraceUrl: `https://testnet.snowtrace.io/tx/${txHash}`,
          });
          return;
        } catch {
          // Ignore non-private logs and keep scanning.
        }
      }

      setDecryptResult({ ok: false, error: "No private event found in this tx." });
    } catch (error) {
      const message = error instanceof Error ? error.message : "unexpected error";
      setDecryptResult({ ok: false, error: message });
    } finally {
      setDecryptLoading(false);
    }
  };

  const saveViewKeyForWallet = () => {
    if (!address) {
      setDecryptResult({ ok: false, error: "Connect wallet first to bind a local view key." });
      return;
    }

    const normalizedPrivateKey = normalizeHex(decryptPrivateKey);
    if (!normalizedPrivateKey || !hexRegex.test(normalizedPrivateKey)) {
      setDecryptResult({ ok: false, error: "Enter a valid private key before saving." });
      return;
    }

    if (typeof window === "undefined") return;
    window.localStorage.setItem(getViewKeyStorageKey(address), normalizedPrivateKey);
    setHasStoredViewKey(true);
    setDecryptResult({ ok: true, output: "View key saved locally for connected wallet." });
  };

  const clearViewKeyForWallet = () => {
    if (!address || typeof window === "undefined") return;
    window.localStorage.removeItem(getViewKeyStorageKey(address));
    setHasStoredViewKey(false);
    setDecryptResult({ ok: true, output: "Local view key cleared for connected wallet." });
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

        <Card highlight>
          <Label>Live Demo Ops</Label>

          <div className="text-[12px] text-[#888] mb-2">Register Wallet</div>
          <div className="grid gap-2">
            <Input
              value={registerAddress}
              onChange={(e) => setRegisterAddress(e.target.value)}
              placeholder="Connected wallet address"
              readOnly={Boolean(address)}
            />
            <div className="text-[11px] text-[#888]">
              Registration proof is generated server-side, but the connected wallet signs the on-chain register transaction.
            </div>
            <Button variant="primary" size="sm" onClick={runRegister} loading={registerLoading || isSubmittingRegisterTx || isWaitingRegisterTx}>
              {isSubmittingRegisterTx || isWaitingRegisterTx ? "Submitting Register Tx" : "Register Connected Wallet"}
            </Button>
            <ResultDisplay result={registerResult} />
          </div>

          <div className="text-[12px] text-[#888] mb-2 mt-5">Set Auditor</div>
          <div className="grid gap-2">
            <Input
              value={auditorAddress}
              onChange={(e) => setAuditorAddress(e.target.value)}
              placeholder="Auditor address"
            />
            <Button variant="primary" size="sm" onClick={runSetAuditor} loading={auditorLoading}>
              Set Auditor
            </Button>
            <ResultDisplay result={auditorResult} />
          </div>

          <div className="text-[12px] text-[#888] mb-2 mt-5">Decrypt Private Tx</div>
          <div className="grid gap-2">
            <Input
              value={decryptTxHash}
              onChange={(e) => setDecryptTxHash(e.target.value)}
              placeholder="Private transfer tx hash"
            />
            <Input
              type="password"
              value={decryptPrivateKey}
              onChange={(e) => setDecryptPrivateKey(e.target.value)}
              placeholder="View key (one-time bind to connected wallet)"
            />
            <div className="text-[11px] text-[#888]">
              Decrypt is browser-only. Save the key once for this wallet, then you can decrypt without pasting again.
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={saveViewKeyForWallet}>
                Save View Key for Wallet
              </Button>
              <Button variant="ghost" size="sm" onClick={clearViewKeyForWallet}>
                Clear Saved Key
              </Button>
            </div>
            <div className="text-[11px] text-[#888]">
              Saved key status: {hasStoredViewKey ? "available for connected wallet" : "not saved"}
            </div>
            <Button variant="primary" size="sm" onClick={runDecrypt} loading={decryptLoading}>
              Decrypt Transaction
            </Button>
            <ResultDisplay result={decryptResult} />
          </div>
        </Card>
      </div>

      <p className="mt-10 text-center text-[11px] text-[#888]">Paygod v1.2.3 · Built on Avalanche · Powered by eERC20</p>
    </div>
  );
}
