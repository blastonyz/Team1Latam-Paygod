import { NextRequest, NextResponse } from "next/server";
import { spawn } from "node:child_process";
import path from "node:path";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const registerStatusRegex = /REGISTER_STATUS=(ALREADY_REGISTERED)/;
const registerProofRegex = /REGISTER_PROOF_JSON=(.+)/;
const registeredAddressRegex = /REGISTERED_ADDRESS=(0x[a-fA-F0-9]{40})/;

const sanitizeUrlEnv = (value: string) => value.trim().replace(/^['\"]+|['\"]+$/g, "");
const zkBackendUrl = sanitizeUrlEnv(process.env.ZK_BACKEND_URL || process.env.NEXT_PUBLIC_ZK_BACKEND_URL || "");
const backendApiToken = String(process.env.ZK_BACKEND_API_TOKEN || "").trim();
const forceLocalZk =
  String(process.env.FORCE_LOCAL_ZK || process.env.NEXT_PUBLIC_FORCE_LOCAL_ZK || "false").toLowerCase() === "true";

function buildRegisterProof(params: { address: string; registrarAddress?: string }) {
  const encryptedErcRoot = path.resolve(process.cwd(), "..", "EncryptedERC");

  return new Promise<{ stdout: string; stderr: string; code: number | null }>((resolve) => {
    const child = spawn("npx", ["hardhat", "run", "scripts/build-register-proof.ts", "--network", "fuji"], {
      cwd: encryptedErcRoot,
      env: {
        ...process.env,
        TARGET_ADDRESS: params.address,
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
    const registrarAddress = String(body?.registrarAddress || "").trim();

    if (!address) {
      return NextResponse.json({ ok: false, error: "address is required" }, { status: 400 });
    }

    if (zkBackendUrl && !forceLocalZk) {
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (backendApiToken) {
        headers["x-api-key"] = backendApiToken;
      }

      const response = await fetch(`${zkBackendUrl.replace(/\/$/, "")}/api/users/register`, {
        method: "POST",
        headers,
        body: JSON.stringify({ address, registrarAddress }),
        cache: "no-store",
      });

      const payload = await response.json();
      return NextResponse.json(payload, { status: response.status });
    }

    const { stdout, stderr, code } = await buildRegisterProof({ address, registrarAddress });

    if (code !== 0) {
      return NextResponse.json(
        {
          ok: false,
          error: "register proof generation failed",
          details: stderr || stdout,
        },
        { status: 500 },
      );
    }

    const statusMatch = stdout.match(registerStatusRegex);
    const proofMatch = stdout.match(registerProofRegex);
    const addressMatch = stdout.match(registeredAddressRegex);

    return NextResponse.json({
      ok: true,
      alreadyRegistered: statusMatch?.[1] === "ALREADY_REGISTERED",
      registeredAddress: addressMatch?.[1] || address || null,
      registrarAddress: registrarAddress || null,
      proof: proofMatch?.[1] ? JSON.parse(proofMatch[1]) : null,
      registerMode: "wallet",
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "unexpected error";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
