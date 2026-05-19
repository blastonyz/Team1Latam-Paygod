import { spawn } from "node:child_process";

const args = process.argv.slice(2);
const nextCommand = args.find((arg) => !arg.startsWith("--")) || "dev";
const isLocalMode = args.includes("--local");

const env = {
  ...process.env,
  PAYGOD_RUNTIME_MODE: isLocalMode ? "local" : process.env.PAYGOD_RUNTIME_MODE || "production",
  FORCE_LOCAL_ZK:
    process.env.FORCE_LOCAL_ZK ||
    process.env.NEXT_PUBLIC_FORCE_LOCAL_ZK ||
    (isLocalMode ? "true" : "false"),
  NEXT_PUBLIC_FORCE_LOCAL_ZK:
    process.env.NEXT_PUBLIC_FORCE_LOCAL_ZK ||
    process.env.FORCE_LOCAL_ZK ||
    (isLocalMode ? "true" : "false"),
};

const child = spawn("npx", ["next", nextCommand], {
  stdio: "inherit",
  env,
  shell: process.platform === "win32",
});

child.on("close", (code) => {
  process.exit(code ?? 0);
});
