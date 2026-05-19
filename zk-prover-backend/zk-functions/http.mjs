import { allowedOriginRaw } from "./config.mjs";

function normalizeOrigin(value) {
  return String(value || "").trim().replace(/\/+$/, "").toLowerCase();
}

const allowedOrigins = String(allowedOriginRaw || "")
  .split(/[;,]/)
  .map((item) => normalizeOrigin(item))
  .filter(Boolean);

export function isOriginAllowed(originHeader) {
  if (!originHeader) return true;
  if (allowedOrigins.includes("*")) return true;
  return allowedOrigins.includes(normalizeOrigin(originHeader));
}

export function responseOrigin(originHeader) {
  if (allowedOrigins.includes("*")) return "*";
  if (originHeader && allowedOrigins.includes(normalizeOrigin(originHeader))) {
    return String(originHeader).trim().replace(/\/+$/, "");
  }
  return allowedOrigins[0] || "null";
}

export function setCorsHeaders(res, originHeader) {
  res.setHeader("Access-Control-Allow-Origin", responseOrigin(originHeader));
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type,Authorization,x-api-key");
}
