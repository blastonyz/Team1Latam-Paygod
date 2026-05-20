import { NextRequest, NextResponse } from "next/server";
import { spawn } from "node:child_process";
import crypto from "node:crypto";
import path from "node:path";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const transferHashRegex = /PRIVATE_TRANSFER_TX_HASH=(0x[a-fA-F0-9]{64})/;
const evmAddressRegex = /^0x[a-fA-F0-9]{40}$/;
const sanitizeUrlEnv = (value: string) => value.trim().replace(/^['\"]+|['\"]+$/g, "");
const zkBackendUrl = sanitizeUrlEnv(process.env.ZK_BACKEND_URL || process.env.NEXT_PUBLIC_ZK_BACKEND_URL || "");
const backendApiToken = String(process.env.ZK_BACKEND_API_TOKEN || "").trim();
const forceLocalZk =
  String(process.env.FORCE_LOCAL_ZK || process.env.NEXT_PUBLIC_FORCE_LOCAL_ZK || "false").toLowerCase() === "true";

function normalizeRecipient(value: unknown) {
  return String(value || "").trim();
}

function normalizeAmount(value: unknown) {
  return String(value || "").trim().replace(",", ".");
}

function isSyntaxError(error: unknown): error is SyntaxError {
  return error instanceof SyntaxError;
}

async function parseJsonSafely(response: Response) {
  const raw = await response.text();
  if (!raw) return {};
  try {
    return JSON.parse(raw);
  } catch {
    return { ok: false, error: "invalid backend response", details: raw };
  }
}

function summarizeForLog(value: string, limit = 500) {
  const normalized = value.replace(/\s+/g, " ").trim();
  return normalized.length > limit ? `${normalized.slice(0, limit)}...` : normalized;
}

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
  const requestId = crypto.randomUUID();

  try {
    let body: unknown;
    try {
      body = await request.json();
    } catch (error) {
      if (isSyntaxError(error)) {
        console.error("[transfer-api] invalid-json", { requestId });
        return NextResponse.json({ ok: false, error: "invalid json payload" }, { status: 400 });
      }
      throw error;
    }

    const recipient = normalizeRecipient((body as { recipient?: unknown } | null)?.recipient);
    const amount = normalizeAmount((body as { amount?: unknown } | null)?.amount);

    console.info("[transfer-api] request", { requestId, recipient, amount, mode: zkBackendUrl && !forceLocalZk ? "remote" : "local" });

    if (!evmAddressRegex.test(recipient)) {
      console.error("[transfer-api] invalid-recipient", { requestId, recipient });
      return NextResponse.json({ ok: false, error: "recipient is required and must be a valid address" }, { status: 400 });
    }

    if (!/^\d+(\.\d{1,2})?$/.test(amount || "0")) {
      console.error("[transfer-api] invalid-amount", { requestId, amount });
      return NextResponse.json({ ok: false, error: "amount must have up to 2 decimals" }, { status: 400 });
    }

    if (zkBackendUrl && !forceLocalZk) {
      const headers: Record<string, string> = { "Content-Type": "application/json", "x-request-id": requestId };
      if (backendApiToken) {
        headers["x-api-key"] = backendApiToken;
      }

      const response = await fetch(`${zkBackendUrl.replace(/\/$/, "")}/api/transfers/private`, {
        method: "POST",
        headers,
        body: JSON.stringify({ recipient, amount }),
        cache: "no-store",
      });

      const payload = await parseJsonSafely(response);
      console.info("[transfer-api] upstream-response", {
        requestId,
        status: response.status,
        ok: response.ok,
        payload: summarizeForLog(JSON.stringify(payload)),
      });
      return NextResponse.json(payload, { status: response.status });
    }

    const transferAmountBaseUnits = toBaseUnits(amount || "0");

    const { stdout, stderr, code } = await runPrivateTransfer(recipient, transferAmountBaseUnits);

    console.info("[transfer-api] local-script-result", {
      requestId,
      code,
      stdout: summarizeForLog(stdout),
      stderr: summarizeForLog(stderr),
    });

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
    console.error("[transfer-api] unexpected-error", { requestId, message });
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
