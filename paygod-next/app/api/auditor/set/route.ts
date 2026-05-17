import { NextRequest, NextResponse } from "next/server";
import { spawn } from "node:child_process";
import path from "node:path";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const txHashRegex = /(0x[a-fA-F0-9]{64})/;
const sanitizeUrlEnv = (value: string) => value.trim().replace(/^['\"]+|['\"]+$/g, "");
const zkBackendUrl = sanitizeUrlEnv(process.env.ZK_BACKEND_URL || process.env.NEXT_PUBLIC_ZK_BACKEND_URL || "");
const forceLocalZk =
  String(process.env.FORCE_LOCAL_ZK || process.env.NEXT_PUBLIC_FORCE_LOCAL_ZK || "false").toLowerCase() === "true";

function runSetAuditor(params: { auditorAddress: string; encryptedErcAddress?: string }) {
  const encryptedErcRoot = path.resolve(process.cwd(), "..", "EncryptedERC");

  return new Promise<{ stdout: string; stderr: string; code: number | null }>((resolve) => {
    const child = spawn("npx", ["hardhat", "run", "scripts/set-auditor.ts", "--network", "fuji"], {
      cwd: encryptedErcRoot,
      env: {
        ...process.env,
        AUDITOR_ADDRESS: params.auditorAddress,
        ENCRYPTED_ERC_ADDRESS: params.encryptedErcAddress || process.env.ENCRYPTED_ERC_ADDRESS || "",
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
    const auditorAddress = String(body?.auditorAddress || "").trim();
    const encryptedErcAddress = String(body?.encryptedErcAddress || "").trim();

    if (!auditorAddress) {
      return NextResponse.json({ ok: false, error: "auditorAddress is required" }, { status: 400 });
    }

    if (zkBackendUrl && !forceLocalZk) {
      const response = await fetch(`${zkBackendUrl.replace(/\/$/, "")}/api/auditor/set`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ auditorAddress, encryptedErcAddress }),
        cache: "no-store",
      });

      const payload = await response.json();
      return NextResponse.json(payload, { status: response.status });
    }

    const { stdout, stderr, code } = await runSetAuditor({ auditorAddress, encryptedErcAddress });

    if (code !== 0) {
      return NextResponse.json(
        {
          ok: false,
          error: "set auditor failed",
          details: stderr || stdout,
        },
        { status: 500 },
      );
    }

    const txHash = stdout.match(txHashRegex)?.[1] || null;

    return NextResponse.json({
      ok: true,
      auditorAddress,
      txHash,
      snowtraceUrl: txHash ? `https://testnet.snowtrace.io/tx/${txHash}` : null,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "unexpected error";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
