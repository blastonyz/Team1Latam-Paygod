import { NextRequest, NextResponse } from "next/server";
import { spawn } from "node:child_process";
import path from "node:path";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const registerHashRegex = /REGISTER_WALLET_TX_HASH=(ALREADY_REGISTERED|0x[a-fA-F0-9]{64})/;
const registeredAddressRegex = /REGISTERED_ADDRESS=(0x[a-fA-F0-9]{40})/;

const zkBackendUrl = process.env.ZK_BACKEND_URL || process.env.NEXT_PUBLIC_ZK_BACKEND_URL || "";
const forceLocalZk =
  String(process.env.FORCE_LOCAL_ZK || process.env.NEXT_PUBLIC_FORCE_LOCAL_ZK || "false").toLowerCase() === "true";

function runRegisterWallet(params: { address?: string; privateKey: string; registrarAddress?: string }) {
  const encryptedErcRoot = path.resolve(process.cwd(), "..", "EncryptedERC");

  return new Promise<{ stdout: string; stderr: string; code: number | null }>((resolve) => {
    const child = spawn("npx", ["hardhat", "run", "scripts/register-wallet.ts", "--network", "fuji"], {
      cwd: encryptedErcRoot,
      env: {
        ...process.env,
        TARGET_ADDRESS: params.address || "",
        RECIPIENT_PRIVATE_KEY: params.privateKey,
        REGISTRAR_ADDRESS: params.registrarAddress || "",
      },
      shell: process.platform === "win32",
    });

    let stdout = "";
    let stderr = "";

    child.stdout.on("data", (chunk) => {
      stdout += chunk.toString();
    });

    child.stderr.on("data", (chunk) => {
      stderr += chunk.toString();
    });

    child.on("close", (code) => {
      resolve({ stdout, stderr, code });
    });
  });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const address = String(body?.address || "").trim();
    const privateKey = String(body?.privateKey || "").trim();
    const registrarAddress = String(body?.registrarAddress || "").trim();

    if (!privateKey) {
      return NextResponse.json({ ok: false, error: "privateKey is required" }, { status: 400 });
    }

    if (zkBackendUrl && !forceLocalZk) {
      const response = await fetch(`${zkBackendUrl.replace(/\/$/, "")}/api/users/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ address, privateKey, registrarAddress }),
        cache: "no-store",
      });

      const payload = await response.json();
      return NextResponse.json(payload, { status: response.status });
    }

    const { stdout, stderr, code } = await runRegisterWallet({ address, privateKey, registrarAddress });

    if (code !== 0) {
      return NextResponse.json(
        {
          ok: false,
          error: "wallet registration failed",
          details: stderr || stdout,
        },
        { status: 500 },
      );
    }

    const txMatch = stdout.match(registerHashRegex);
    const addressMatch = stdout.match(registeredAddressRegex);
    const txHash = txMatch?.[1] || null;

    return NextResponse.json({
      ok: true,
      txHash: txHash === "ALREADY_REGISTERED" ? null : txHash,
      alreadyRegistered: txHash === "ALREADY_REGISTERED",
      registeredAddress: addressMatch?.[1] || address || null,
      snowtraceUrl:
        txHash && txHash !== "ALREADY_REGISTERED" ? `https://testnet.snowtrace.io/tx/${txHash}` : null,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "unexpected error";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
