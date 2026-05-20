import { getEncryptedErcRoot, runHardhatScript } from "./hardhat.mjs";

const transferHashRegex = /PRIVATE_TRANSFER_TX_HASH=(0x[a-fA-F0-9]{64})/;
const addressRegex = /^0x[a-fA-F0-9]{40}$/;

function summarizeForLog(value, limit = 500) {
  const normalized = String(value || "").replace(/\s+/g, " ").trim();
  return normalized.length > limit ? `${normalized.slice(0, limit)}...` : normalized;
}

function toBaseUnits(amount) {
  const normalized = String(amount || "").trim().replace(",", ".");
  if (!/^\d+(\.\d{1,2})?$/.test(normalized)) {
    throw new Error("amount must have up to 2 decimals");
  }

  const [intPart, decimalPart = ""] = normalized.split(".");
  const padded = (decimalPart + "00").slice(0, 2);
  return `${BigInt(intPart) * 100n + BigInt(padded)}`;
}

export async function buildPrivateTransfer(body, context = {}) {
  const requestId = String(context.requestId || "unknown");
  const recipient = String(body?.recipient || "").trim();
  const amount = String(body?.amount || "").trim();

  console.info("[zk-transfer] request", { requestId, recipient, amount });

  if (!addressRegex.test(recipient)) {
    console.error("[zk-transfer] invalid-recipient", { requestId, recipient });
    return { status: 400, payload: { ok: false, error: "recipient is required and must be a valid address" } };
  }

  let transferAmountBaseUnits;
  try {
    transferAmountBaseUnits = toBaseUnits(amount || "0");
  } catch (error) {
    const message = error instanceof Error ? error.message : "invalid amount";
    console.error("[zk-transfer] invalid-amount", { requestId, amount, message });
    return { status: 400, payload: { ok: false, error: message } };
  }

  const encryptedErcRoot = getEncryptedErcRoot();
  const result = await runHardhatScript({
    encryptedErcRoot,
    scriptFile: "private-transfer-fuji.ts",
    extraEnv: {
      RECIPIENT_ADDRESS: recipient,
      TRANSFER_AMOUNT_BASE_UNITS: transferAmountBaseUnits,
    },
  });

  const stdout = String(result.stdout || "");
  const stderr = String(result.stderr || "");
  const combinedOutput = `${stdout}\n${stderr}`;
  const match = combinedOutput.match(transferHashRegex);

  console.info("[zk-transfer] script-result", {
    requestId,
    code: result.code,
    txHash: match?.[1] || null,
    stdout: summarizeForLog(stdout),
    stderr: summarizeForLog(stderr),
  });

  // If the tx hash is present, treat as success even if post-processing in script failed.
  if (match) {
    return {
      status: 200,
      payload: {
        ok: true,
        txHash: match[1],
        snowtraceUrl: `https://testnet.snowtrace.io/tx/${match[1]}`,
      },
    };
  }

  if (result.code !== 0) {
    console.error("[zk-transfer] transfer-failed", { requestId, code: result.code });
    return {
      status: 500,
      payload: {
        ok: false,
        error: "private transfer failed",
        details: stderr || stdout,
      },
    };
  }

  if (!match) {
    console.error("[zk-transfer] missing-tx-hash", { requestId });
    return {
      status: 500,
      payload: {
        ok: false,
        error: "tx hash not found in script output",
        details: stdout,
      },
    };
  }

  return {
    status: 200,
    payload: {
      ok: true,
      txHash: match[1],
      snowtraceUrl: `https://testnet.snowtrace.io/tx/${match[1]}`,
    },
  };
}
