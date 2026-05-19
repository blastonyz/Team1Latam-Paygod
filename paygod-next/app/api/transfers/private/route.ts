import { NextRequest, NextResponse } from "next/server";
import { spawn } from "node:child_process";
import path from "node:path";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const transferHashRegex = /PRIVATE_TRANSFER_TX_HASH=(0x[a-fA-F0-9]{64})/;
const sanitizeUrlEnv = (value: string) => value.trim().replace(/^['\"]+|['\"]+$/g, "");
const zkBackendUrl = sanitizeUrlEnv(process.env.ZK_BACKEND_URL || process.env.NEXT_PUBLIC_ZK_BACKEND_URL || "");
const backendApiToken = String(process.env.ZK_BACKEND_API_TOKEN || "").trim();
const forceLocalZk =
  String(process.env.FORCE_LOCAL_ZK || process.env.NEXT_PUBLIC_FORCE_LOCAL_ZK || "false").toLowerCase() === "true";

function runPrivateTransfer(recipient: string, transferAmountBaseUnits: string) {
  const encryptedErcRoot = path.resolve(process.cwd(), "..", "EncryptedERC");

  return new Promise<{ stdout: string; stderr: string; code: number | null }>((resolve) => {
    const child = spawn("npx", ["hardhat", "run", "scripts/private-transfer-fuji.ts", "--network", "fuji"], {
      cwd: encryptedErcRoot,
      env: {
        ...process.env,
        RECIPIENT_ADDRESS: recipient,
        TRANSFER_AMOUNT_BASE_UNITS: transferAmountBaseUnits,
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

function toBaseUnits(amount: string) {
  const normalized = amount.trim().replace(",", ".");
  if (!/^\d+(\.\d{1,2})?$/.test(normalized)) {
    throw new Error("Amount must have up to 2 decimals.");
  }

  const [intPart, decimalPart = ""] = normalized.split(".");
  const padded = (decimalPart + "00").slice(0, 2);
  return `${BigInt(intPart) * 100n + BigInt(padded)}`;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const recipient = String(body?.recipient || "").trim();
    const amount = String(body?.amount || "").trim();

    if (!recipient) {
      return NextResponse.json({ ok: false, error: "recipient is required" }, { status: 400 });
    }

    if (zkBackendUrl && !forceLocalZk) {
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (backendApiToken) {
        headers["x-api-key"] = backendApiToken;
      }

      const response = await fetch(`${zkBackendUrl.replace(/\/$/, "")}/api/transfers/private`, {
        method: "POST",
        headers,
        body: JSON.stringify({ recipient, amount }),
        cache: "no-store",
      });

      const payload = await response.json();
      return NextResponse.json(payload, { status: response.status });
    }

    const transferAmountBaseUnits = toBaseUnits(amount || "0");

    const { stdout, stderr, code } = await runPrivateTransfer(recipient, transferAmountBaseUnits);

    if (code !== 0) {
      return NextResponse.json(
        {
          ok: false,
          error: "private transfer script failed",
          details: stderr || stdout,
        },
        { status: 500 },
      );
    }

    const match = stdout.match(transferHashRegex);
    if (!match) {
      return NextResponse.json(
        {
          ok: false,
          error: "tx hash not found in script output",
          details: stdout,
        },
        { status: 500 },
      );
    }

    return NextResponse.json({
      ok: true,
      txHash: match[1],
      snowtraceUrl: `https://testnet.snowtrace.io/tx/${match[1]}`,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "unexpected error";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
