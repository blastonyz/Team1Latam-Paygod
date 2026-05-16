import http from "node:http";
import path from "node:path";
import { spawn } from "node:child_process";

const PORT = Number(process.env.PORT || 8080);
const HOST = "0.0.0.0";
const transferHashRegex = /PRIVATE_TRANSFER_TX_HASH=(0x[a-fA-F0-9]{64})/;

const fixedMode = String(process.env.DEMO_FIXED_MODE || "true").toLowerCase() === "true";
const allowedOrigin = process.env.ALLOWED_ORIGIN || "*";

function jsonResponse(res, status, data, origin = "*") {
  res.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  });
  res.end(JSON.stringify(data));
}

function normalizeAddress(value) {
  return String(value || "").trim();
}

function toBaseUnits(amount) {
  const normalized = String(amount || "0").trim().replace(",", ".");
  if (!/^\d+(\.\d{1,2})?$/.test(normalized)) {
    throw new Error("amount must have up to 2 decimals");
  }
  const [intPart, decimalPart = ""] = normalized.split(".");
  const padded = (decimalPart + "00").slice(0, 2);
  return `${BigInt(intPart) * 100n + BigInt(padded)}`;
}

function resolveConfig(body) {
  const bodyRecipient = normalizeAddress(body?.recipient);
  const bodyAmount = String(body?.amount || "0").trim();

  const recipient = fixedMode
    ? normalizeAddress(process.env.DEMO_RECIPIENT_ADDRESS)
    : bodyRecipient;

  if (!recipient) {
    throw new Error("recipient is required");
  }

  const transferAmountBaseUnits = fixedMode
    ? String(process.env.DEMO_TRANSFER_AMOUNT_BASE_UNITS || "2500")
    : toBaseUnits(bodyAmount || "0");

  const mintAmountBaseUnits = String(process.env.DEMO_MINT_AMOUNT_BASE_UNITS || "10000");
  const encryptedErcRoot = path.resolve(
    process.cwd(),
    process.env.ENCRYPTED_ERC_ROOT || "../EncryptedERC",
  );

  return {
    recipient,
    transferAmountBaseUnits,
    mintAmountBaseUnits,
    encryptedErcRoot,
  };
}

function runPrivateTransfer({ recipient, transferAmountBaseUnits, mintAmountBaseUnits, encryptedErcRoot }) {
  return new Promise((resolve) => {
    const child = spawn(
      "npx",
      ["hardhat", "run", "scripts/private-transfer-fuji.ts", "--network", "fuji"],
      {
        cwd: encryptedErcRoot,
        env: {
          ...process.env,
          RECIPIENT_ADDRESS: recipient,
          TRANSFER_AMOUNT_BASE_UNITS: transferAmountBaseUnits,
          MINT_AMOUNT_BASE_UNITS: mintAmountBaseUnits,
        },
        shell: process.platform === "win32",
      },
    );

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

function parseBody(req) {
  return new Promise((resolve, reject) => {
    let raw = "";
    req.on("data", (chunk) => {
      raw += chunk.toString();
      if (raw.length > 1_000_000) {
        reject(new Error("payload too large"));
      }
    });
    req.on("end", () => {
      if (!raw) return resolve({});
      try {
        resolve(JSON.parse(raw));
      } catch {
        reject(new Error("invalid json"));
      }
    });
  });
}

const server = http.createServer(async (req, res) => {
  const origin = req.headers.origin || allowedOrigin;

  if (req.method === "OPTIONS") {
    return jsonResponse(res, 204, {}, origin);
  }

  if (req.method === "GET" && req.url === "/health") {
    return jsonResponse(
      res,
      200,
      {
        ok: true,
        service: "zk-prover-backend",
        fixedMode,
      },
      origin,
    );
  }

  if (req.method === "POST" && req.url === "/api/transfers/private") {
    try {
      const body = await parseBody(req);
      const config = resolveConfig(body);
      const result = await runPrivateTransfer(config);

      if (result.code !== 0) {
        return jsonResponse(
          res,
          500,
          {
            ok: false,
            error: "private transfer script failed",
            details: result.stderr || result.stdout,
          },
          origin,
        );
      }

      const match = result.stdout.match(transferHashRegex);
      if (!match) {
        return jsonResponse(
          res,
          500,
          {
            ok: false,
            error: "tx hash not found in script output",
            details: result.stdout,
          },
          origin,
        );
      }

      return jsonResponse(
        res,
        200,
        {
          ok: true,
          fixedMode,
          zkEngine: "hardhat-zkit-groth16",
          verification: "onchain-in-encryptederc-transfer",
          txHash: match[1],
          snowtraceUrl: `https://testnet.snowtrace.io/tx/${match[1]}`,
        },
        origin,
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : "unexpected error";
      return jsonResponse(res, 500, { ok: false, error: message }, origin);
    }
  }

  return jsonResponse(res, 404, { ok: false, error: "not found" }, origin);
});

server.listen(PORT, HOST, () => {
  console.log(`zk-prover-backend listening on http://${HOST}:${PORT}`);
});
