import { Router } from "express";
import crypto from "node:crypto";
import { isLocalMode } from "./zk-functions/config.mjs";
import { isOriginAllowed, setCorsHeaders } from "./zk-functions/http.mjs";
import {
  checkRateLimit,
  endpointEnabled,
  endpointRequiresAuth,
  getSecuritySnapshot,
  hasValidApiAuth,
} from "./zk-functions/security.mjs";
import { buildRegisterProof } from "./zk-functions/register.mjs";
import { buildPrivateTransfer } from "./zk-functions/transfer.mjs";

export function createRouter() {
  const router = Router();

  router.use((req, res, next) => {
    req.requestId = String(req.headers["x-request-id"] || crypto.randomUUID());
    const originHeader = String(req.headers.origin || "");

    console.info("[router] request", {
      requestId: req.requestId,
      method: req.method,
      path: req.path,
      origin: originHeader || null,
    });

    if (!isOriginAllowed(originHeader)) {
      setCorsHeaders(res, originHeader);
      console.error("[router] origin-not-allowed", { requestId: req.requestId, origin: originHeader || null });
      return res.status(403).json({ ok: false, error: "origin not allowed" });
    }

    setCorsHeaders(res, originHeader);

    if (req.method === "OPTIONS") {
      return res.status(204).end();
    }

    if (req.method === "POST") {
      if (!endpointEnabled(req.path)) {
        console.error("[router] endpoint-disabled", { requestId: req.requestId, path: req.path });
        return res.status(403).json({ ok: false, error: "endpoint disabled" });
      }

      if (!checkRateLimit(req)) {
        console.error("[router] rate-limit", { requestId: req.requestId, path: req.path });
        return res.status(429).json({ ok: false, error: "rate limit exceeded" });
      }

      if (endpointRequiresAuth(req.path) && !hasValidApiAuth(req)) {
        console.error("[router] unauthorized", { requestId: req.requestId, path: req.path });
        return res.status(401).json({ ok: false, error: "unauthorized" });
      }
    }

    return next();
  });

  router.get("/health", (_req, res) => {
    return res.status(200).json({
      ok: true,
      service: "zk-prover-backend",
      runtimeMode: isLocalMode ? "local" : "production",
      security: getSecuritySnapshot(),
    });
  });

  router.post("/api/users/register", async (req, res) => {
    try {
      const { status, payload } = await buildRegisterProof(req.body || {});
      return res.status(status).json(payload);
    } catch (error) {
      const message = error instanceof Error ? error.message : "unexpected error";
      return res.status(500).json({ ok: false, error: message });
    }
  });

  router.post("/api/transfers/private", async (req, res) => {
    try {
      const { status, payload } = await buildPrivateTransfer(req.body || {}, { requestId: req.requestId });
      console.info("[router] transfer-response", { requestId: req.requestId, status, ok: payload?.ok ?? false });
      return res.status(status).json(payload);
    } catch (error) {
      const message = error instanceof Error ? error.message : "unexpected error";
      console.error("[router] transfer-exception", { requestId: req.requestId, message });
      return res.status(500).json({ ok: false, error: message });
    }
  });

  router.use((_req, res) => {
    return res.status(404).json({ ok: false, error: "not found" });
  });

  return router;
}
