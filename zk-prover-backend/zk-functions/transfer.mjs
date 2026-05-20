import { getEncryptedErcRoot, runHardhatScript } from "./hardhat.mjs";

const transferHashRegex = /PRIVATE_TRANSFER_TX_HASH=(0x[a-fA-F0-9]{64})/;
const addressRegex = /^0x[a-fA-F0-9]{40}$/;

function toBaseUnits(amount) {
  const normalized = String(amount || "").trim().replace(",", ".");
  if (!/^\d+(\.\d{1,2})?$/.test(normalized)) {
    throw new Error("amount must have up to 2 decimals");
  }

  const [intPart, decimalPart = ""] = normalized.split(".");
  const padded = (decimalPart + "00").slice(0, 2);
  return `${BigInt(intPart) * 100n + BigInt(padded)}`;
}

export async function buildPrivateTransfer(body) {
  const recipient = String(body?.recipient || "").trim();
  const amount = String(body?.amount || "").trim();

  if (!addressRegex.test(recipient)) {
    return { status: 400, payload: { ok: false, error: "recipient is required and must be a valid address" } };
  }

  let transferAmountBaseUnits;
  try {
    transferAmountBaseUnits = toBaseUnits(amount || "0");
  } catch (error) {
    const message = error instanceof Error ? error.message : "invalid amount";
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
