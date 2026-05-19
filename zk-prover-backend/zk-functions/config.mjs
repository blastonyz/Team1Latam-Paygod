export const PORT = Number(process.env.PORT || 8080);
export const HOST = "0.0.0.0";

export const runtimeMode = String(process.env.PAYGOD_RUNTIME_MODE || "production").trim().toLowerCase();
export const cliLocalMode = process.argv.includes("--local");
export const isLocalMode = cliLocalMode || runtimeMode === "local";

export const allowedOriginRaw =
  process.env.ALLOWED_ORIGIN || "https://team1-latam-paygod.vercel.app,http://localhost:3000";
export const apiAuthToken = String(process.env.BACKEND_API_TOKEN || "").trim();
export const requireApiAuth =
  String(process.env.REQUIRE_API_AUTH || (isLocalMode ? "false" : "true")).toLowerCase() === "true";

export const enableRegister =
  String(process.env.ENABLE_REGISTER_ENDPOINT || "true").toLowerCase() === "true";

export const rateLimitWindowMs = Number(process.env.RATE_LIMIT_WINDOW_MS || 60_000);
export const rateLimitMaxRequests = Number(process.env.RATE_LIMIT_MAX_REQUESTS || (isLocalMode ? 1000 : 300));
