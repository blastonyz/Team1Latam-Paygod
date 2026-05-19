import express from "express";
import { createRouter } from "./router.mjs";
import { HOST, PORT } from "./zk-functions/config.mjs";

const app = express();

app.use(express.json());
app.use(createRouter());

app.use((error, _req, res, _next) => {
  if (error instanceof SyntaxError && "body" in error) {
    return res.status(400).json({ ok: false, error: "invalid json" });
  }
  return res.status(500).json({ ok: false, error: "unexpected error" });
});

app.listen(PORT, HOST, () => {
  console.log(`zk-prover-backend listening on http://${HOST}:${PORT}`);
});
