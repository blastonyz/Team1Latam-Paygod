"use client";

import { useState } from "react";
import { useAccount, usePublicClient, useReadContract, useWaitForTransactionReceipt, useWriteContract } from "wagmi";
import { isAddress } from "viem";
import encryptedErcArtifact from "@/lib/abi/EncryptedERC.json";
import registrarArtifact from "@/lib/abi/Registrar.json";
import { useWeb3App } from "@/contexts/web3-app-context";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";

export function ContractFlowPanel() {
  const { encryptedErcAddress } = useWeb3App();
  const { address } = useAccount();
  const publicClient = usePublicClient();

  const [recipient, setRecipient] = useState("");
  const [recipientStatus, setRecipientStatus] = useState<string>("Enter an address to verify registration in Registrar.");

  const { data: registrarAddress } = useReadContract({
    address: encryptedErcAddress,
    abi: encryptedErcArtifact.abi,
    functionName: "registrar",
    query: { enabled: Boolean(encryptedErcAddress) },
  });

  const { data: auditorAddress, refetch: refetchAuditor } = useReadContract({
    address: encryptedErcAddress,
    abi: encryptedErcArtifact.abi,
    functionName: "auditor",
    query: { enabled: Boolean(encryptedErcAddress) },
  });

  const { writeContract, data: setAuditorHash, isPending: isSettingAuditor } = useWriteContract();
  const { isLoading: isWaitingAuditorTx } = useWaitForTransactionReceipt({
    hash: setAuditorHash,
    query: { enabled: Boolean(setAuditorHash) },
  });

  const checkRegistration = async () => {
    if (!registrarAddress || !publicClient) {
      setRecipientStatus("Registrar is not available yet.");
      return;
    }
    if (!isAddress(recipient)) {
      setRecipientStatus("Invalid recipient address.");
      return;
    }

    const isRegistered = await publicClient.readContract({
      address: registrarAddress as `0x${string}`,
      abi: registrarArtifact.abi,
      functionName: "isUserRegistered",
      args: [recipient as `0x${string}`],
    });

    setRecipientStatus(isRegistered ? "Recipient is registered in Registrar." : "Recipient is NOT registered in Registrar.");
  };

  const setWalletAsAuditor = () => {
    if (!address) return;
    writeContract(
      {
        address: encryptedErcAddress,
        abi: encryptedErcArtifact.abi,
        functionName: "setAuditorPublicKey",
        args: [address],
      },
      {
        onSuccess: () => refetchAuditor(),
      },
    );
  };

  return (
    <Card className="mt-6" padding={20}>
      <h2 className="text-white" style={{ fontSize: 14, fontWeight: 700, marginBottom: 10 }}>Web3 Contract Flow</h2>
      <p style={{ color: "var(--text-secondary)", fontSize: 12, marginBottom: 12 }}>
        Live reads and writes against EncryptedERC/Registrar on Fuji.
      </p>

      <div style={{ display: "grid", gap: 8, marginBottom: 12 }}>
        <div style={{ fontSize: 12, color: "var(--text-secondary)" }}>EncryptedERC: {encryptedErcAddress}</div>
        <div style={{ fontSize: 12, color: "var(--text-secondary)" }}>Registrar: {String(registrarAddress || "loading...")}</div>
        <div style={{ fontSize: 12, color: "var(--text-secondary)" }}>Auditor: {String(auditorAddress || "loading...")}</div>
      </div>

      <div style={{ display: "grid", gap: 8, marginBottom: 12 }}>
        <input
          value={recipient}
          onChange={(e) => setRecipient(e.target.value)}
          placeholder="0x recipient address"
          style={{ background: "#0f0f0f", border: "1px solid var(--border)", color: "white", height: 36, padding: "0 10px" }}
        />
        <Button variant="outline" size="sm" onClick={checkRegistration}>Check Recipient Registration</Button>
        <div style={{ fontSize: 12, color: "var(--text-secondary)" }}>{recipientStatus}</div>
      </div>

      <Button
        variant="primary"
        size="sm"
        onClick={setWalletAsAuditor}
        disabled={!address || isSettingAuditor || isWaitingAuditorTx}
      >
        {isSettingAuditor || isWaitingAuditorTx ? "Setting auditor..." : "Set Connected Wallet As Auditor"}
      </Button>

      {setAuditorHash ? (
        <div style={{ marginTop: 10, fontSize: 12, color: "var(--text-secondary)" }}>
          tx: https://testnet.snowtrace.io/tx/{setAuditorHash}
        </div>
      ) : null}
    </Card>
  );
}
