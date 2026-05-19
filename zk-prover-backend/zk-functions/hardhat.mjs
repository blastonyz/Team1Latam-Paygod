import path from "node:path";
import { spawn } from "node:child_process";

export function getEncryptedErcRoot() {
  return path.resolve(process.cwd(), process.env.ENCRYPTED_ERC_ROOT || "../EncryptedERC");
}

export function runHardhatScript({ encryptedErcRoot, scriptFile, extraEnv = {} }) {
  return new Promise((resolve) => {
    const child = spawn(
      "npx",
      ["hardhat", "run", `scripts/${scriptFile}`, "--network", "fuji"],
      {
        cwd: encryptedErcRoot,
        env: {
          ...process.env,
          ...extraEnv,
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
