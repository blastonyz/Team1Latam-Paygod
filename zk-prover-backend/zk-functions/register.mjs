import { getEncryptedErcRoot, runHardhatScript } from "./hardhat.mjs";

const registerStatusRegex = /REGISTER_STATUS=(ALREADY_REGISTERED)/;
const registerProofRegex = /REGISTER_PROOF_JSON=(.+)/;
const registeredAddressRegex = /REGISTERED_ADDRESS=(0x[a-fA-F0-9]{40})/;
const addressRegex = /(0x[a-fA-F0-9]{40})/;

function normalizeAddress(value) {
  return String(value || "").trim();
}

export async function buildRegisterProof(body) {
  const encryptedErcRoot = getEncryptedErcRoot();
  const targetAddress = normalizeAddress(body?.address || "");
  const registrarAddress = normalizeAddress(body?.registrarAddress || process.env.REGISTRAR_ADDRESS || "");

  if (!targetAddress) {
    return { status: 400, payload: { ok: false, error: "address is required for wallet registration" } };
  }

  const result = await runHardhatScript({
    encryptedErcRoot,
    scriptFile: "build-register-proof.ts",
    extraEnv: {
      TARGET_ADDRESS: targetAddress,
      REGISTRAR_ADDRESS: registrarAddress,
    },
  });

  if (result.code !== 0) {
    return {
      status: 500,
      payload: {
        ok: false,
        error: "wallet registration failed",
        details: result.stderr || result.stdout,
      },
    };
  }

  const statusMatch = String(result.stdout).match(registerStatusRegex);
  const proofMatch = String(result.stdout).match(registerProofRegex);
  const alreadyRegistered = statusMatch?.[1] === "ALREADY_REGISTERED";
  const registeredAddress =
    String(result.stdout).match(registeredAddressRegex)?.[1] ||
    targetAddress ||
    (String(result.stdout).match(addressRegex)?.[1] ?? "");

  return {
    status: 200,
    payload: {
      ok: true,
      alreadyRegistered,
      registeredAddress,
      registrarAddress: registrarAddress || process.env.REGISTRAR_ADDRESS || null,
      proof: proofMatch?.[1] ? JSON.parse(proofMatch[1]) : null,
      registerMode: "wallet",
    },
  };
}
