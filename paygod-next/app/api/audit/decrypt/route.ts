import { NextRequest, NextResponse } from "next/server";
import { ethers } from "ethers";
import { formatPrivKeyForBabyJub, poseidonDecrypt } from "maci-crypto";
import { mulPointEscalar } from "@zk-kit/baby-jubjub";

const ENCRYPTED_ERC_ADDRESS =
  process.env.ENCRYPTED_ERC_ADDRESS ||
  "0x68eCE3bafEE50cEeae5Da816128b5633C7ed2fdB";

const zkBackendUrl = process.env.ZK_BACKEND_URL || process.env.NEXT_PUBLIC_ZK_BACKEND_URL || "";
const forceLocalZk =
  String(process.env.FORCE_LOCAL_ZK || process.env.NEXT_PUBLIC_FORCE_LOCAL_ZK || "false").toLowerCase() === "true";

const abi = [
  "event PrivateTransfer(address indexed from, address indexed to, uint256[7] auditorPCT, address indexed auditorAddress)",
  "event PrivateMint(address indexed user, uint256[7] auditorPCT, address indexed auditorAddress)",
  "event PrivateBurn(address indexed user, uint256[7] auditorPCT, address indexed auditorAddress)",
];

const normalizeHex = (value: string) => (value.startsWith("0x") ? value : `0x${value}`);

const getAuditorPrivateKey = (auditorAddress: string): bigint | null => {
  const pairs = ["AVA_PK", "AVA_PK1", "AVA_PK2", "AVA_PK3"] as const;
  for (const key of pairs) {
    const raw = process.env[key];
    if (!raw) continue;
    const wallet = new ethers.Wallet(normalizeHex(raw));
    if (wallet.address.toLowerCase() === auditorAddress.toLowerCase()) {
      return BigInt(normalizeHex(raw));
    }
  }
  return null;
};

const decryptPct = (pct: bigint[], privateKey: bigint) => {
  const ciphertext = pct.slice(0, 4);
  const authKey = pct.slice(4, 6);
  const nonce = pct[6];
  const sharedKey = mulPointEscalar(authKey as [bigint, bigint], formatPrivKeyForBabyJub(privateKey));
  const dec = poseidonDecrypt(ciphertext, sharedKey, nonce, 1);
  return { amountBaseUnits: dec[0].toString(), nonce: nonce.toString() };
};

export async function POST(request: NextRequest) {
  const { txHash } = await request.json();
  if (!txHash) return NextResponse.json({ ok: false, error: "txHash is required" }, { status: 400 });

  if (zkBackendUrl && !forceLocalZk) {
    const response = await fetch(`${zkBackendUrl.replace(/\/$/, "")}/api/tx/decrypt`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ txHash, encryptedErcAddress: ENCRYPTED_ERC_ADDRESS }),
      cache: "no-store",
    });

    const payload = await response.json();
    return NextResponse.json(payload, { status: response.status });
  }

  const provider = new ethers.JsonRpcProvider(
    process.env.AVA_RPC_URL || process.env.NEXT_PUBLIC_AVA_RPC_URL || "https://api.avax-test.network/ext/bc/C/rpc",
  );

  const receipt = await provider.getTransactionReceipt(txHash);
  if (!receipt) return NextResponse.json({ ok: false, error: "tx not found" }, { status: 404 });

  const iface = new ethers.Interface(abi);

  for (const log of receipt.logs) {
    if (log.address.toLowerCase() !== ENCRYPTED_ERC_ADDRESS.toLowerCase()) continue;
    let parsed: ethers.LogDescription | null = null;
    try {
      parsed = iface.parseLog(log);
    } catch {
      continue;
    }
    if (!parsed) continue;

    const auditorAddress = String(parsed.args.auditorAddress);
    const privateKey = getAuditorPrivateKey(auditorAddress);
    if (!privateKey) {
      return NextResponse.json({ ok: false, error: `No private key configured for auditor ${auditorAddress}` }, { status: 400 });
    }

    const pct = (parsed.args.auditorPCT as bigint[]).map((x) => BigInt(x));
    const decrypted = decryptPct(pct, privateKey);

    return NextResponse.json({
      ok: true,
      txHash,
      event: parsed.name,
      auditorAddress,
      decrypted,
      from: parsed.name === "PrivateTransfer" ? String(parsed.args.from) : undefined,
      to: parsed.name === "PrivateTransfer" ? String(parsed.args.to) : undefined,
      user: parsed.name !== "PrivateTransfer" ? String(parsed.args.user) : undefined,
    });
  }

  return NextResponse.json({ ok: false, error: "No private event found" }, { status: 404 });
}
