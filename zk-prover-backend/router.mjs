import { Router } from "express";
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
    const originHeader = String(req.headers.origin || "");

    if (!isOriginAllowed(originHeader)) {
      setCorsHeaders(res, originHeader);
      return res.status(403).json({ ok: false, error: "origin not allowed" });
    }

    setCorsHeaders(res, originHeader);

    if (req.method === "OPTIONS") {
      return res.status(204).end();
    }

    if (req.method === "POST") {
      if (!endpointEnabled(req.path)) {
        return res.status(403).json({ ok: false, error: "endpoint disabled" });
      }

      if (!checkRateLimit(req)) {
        return res.status(429).json({ ok: false, error: "rate limit exceeded" });
      }

      if (endpointRequiresAuth(req.path) && !hasValidApiAuth(req)) {
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
      const { status, payload } = await buildPrivateTransfer(req.body || {});
      return res.status(status).json(payload);
    } catch (error) {
      const message = error instanceof Error ? error.message : "unexpected error";
      return res.status(500).json({ ok: false, error: message });
    }
  });

  router.use((_req, res) => {
    return res.status(404).json({ ok: false, error: "not found" });
  });

  return router;
}
