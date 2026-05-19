import {
  apiAuthToken,
  enableRegister,
  isLocalMode,
  rateLimitMaxRequests,
  rateLimitWindowMs,
  requireApiAuth,
} from "./config.mjs";

const rateLimitStore = new Map();

function getClientKey(req) {
  const forwarded = String(req.headers["x-forwarded-for"] || "").split(",")[0].trim();
  if (forwarded) return forwarded;
  return req.socket?.remoteAddress || "unknown";
}

export function checkRateLimit(req) {
  const now = Date.now();
  const key = getClientKey(req);
  const current = rateLimitStore.get(key);

  if (!current || now >= current.resetAt) {
    rateLimitStore.set(key, { count: 1, resetAt: now + rateLimitWindowMs });
    return true;
  }

  if (current.count >= rateLimitMaxRequests) {
    return false;
  }

  current.count += 1;
  return true;
}

export function endpointEnabled(pathname) {
  if (pathname === "/api/users/register") return enableRegister;
  return false;
}

export function endpointRequiresAuth(pathname) {
  return pathname !== "/api/users/register";
}

export function hasValidApiAuth(req) {
  if (!requireApiAuth) return true;
  if (!apiAuthToken) return false;

  const bearer = String(req.headers.authorization || "").replace(/^Bearer\s+/i, "").trim();
  const xApiKey = String(req.headers["x-api-key"] || "").trim();
  return bearer === apiAuthToken || xApiKey === apiAuthToken;
}

export function getSecuritySnapshot() {
  return {
    requireApiAuth,
    enableRegister,
    rateLimitWindowMs,
    rateLimitMaxRequests,
    runtimeMode: isLocalMode ? "local" : "production",
  };
}
