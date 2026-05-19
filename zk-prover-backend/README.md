# zk-prover-backend

Backend service that executes EncryptedERC Hardhat scripts and exposes non-custodial HTTP endpoints for:
- wallet registration proof generation (`POST /api/users/register`)
- health/status (`GET /health`)

## Security-first production mode

Recommended when service is public:
- keep only `POST /api/users/register` enabled
- set a strict `ALLOWED_ORIGIN` (no `*`)
- enable backend API token if you choose to protect register behind server-to-server calls
- keep Cloud Run unauthenticated only if your endpoint-level controls are active

## Local run

1. Copy `.env.example` to `.env`.
2. Make sure `EncryptedERC` dependencies are installed.
3. Start service:

```bash
npm run start:local
```

Health check:

```bash
curl http://localhost:8080/health
```

Register wallet endpoint:

```bash
curl -X POST http://localhost:8080/api/users/register \
  -H "Content-Type: application/json" \
  -d '{"address":"0x90813c2C61EE01857c2fDfD003f5272b540a7AA7"}'
```

Notes:
- `api/users/register` returns a registration proof and does not require wallet private keys.
- On-chain `register()` must be signed by the connected wallet in the frontend.
- Custodial endpoints were removed by design (no backend private-key signing/decryption).

## Cloud Run deploy

From `Team1Latam-Hackathon` root:

```bash
gcloud builds submit . --config cloudbuild.team1latam.yaml

gcloud run deploy team1latam-paygod \
  --image gcr.io/<PROJECT_ID>/team1latam-paygod-zk \
  --region southamerica-east1 \
  --allow-unauthenticated \
  --port 8080 \
  --memory 4Gi \
  --cpu 2 \
  --timeout 900 \
  --concurrency 1 \
  --set-env-vars "ENCRYPTED_ERC_ROOT=/app/EncryptedERC,PAYGOD_RUNTIME_MODE=production,ALLOWED_ORIGIN=https://team1-latam-paygod.vercel.app,REQUIRE_API_AUTH=false,ENABLE_REGISTER_ENDPOINT=true,RATE_LIMIT_WINDOW_MS=60000,RATE_LIMIT_MAX_REQUESTS=20"
```

Then use your Cloud Run URL in frontend env: `NEXT_PUBLIC_ZK_BACKEND_URL=https://<service-url>`.
If backend auth is enabled, also set frontend server env: `ZK_BACKEND_API_TOKEN=<STRONG_TOKEN>`.
