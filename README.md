# Team1Latam Hackathon - Paygod + EncryptedERC

Paygod is an institutional payments demo on Avalanche Fuji that executes privacy-preserving transfers using EncryptedERC (zk-SNARK + encrypted balances), with a Next.js frontend and a dedicated ZK backend.

This README is the operational guide for:
- contracts and protocol components
- deployment and interaction scripts
- frontend and backend setup
- Cloud Run deployment
- live demo checklist and troubleshooting

---

## 🎯 **LIVE DEMO - TEST WALLET REGISTRATION**

> **To register and test a new wallet:**
> 1. Go to https://team1-latam-paygod.vercel.app/app/settings
> 2. Scroll down to **"Live Demo Ops"** section
> 3. Fill in:
>    - **Wallet address**: your test address
>    - **Wallet private key**: corresponding private key
> 4. Click **"Register Wallet"** and wait for confirmation
> 
> **Pre-registered test wallets** (already on Fuji):
> - `0x0571235134DC15a00f02916987C2c16b5fC52E2A`
> - `0x90813c2C61EE01857c2fDfD003f5272b540a7AA7`
>
> Use these to test transfers and auditor operations.

---

## 1) Monorepo Overview

Top-level modules:
- `EncryptedERC/`: contracts, circuits, Hardhat scripts, and protocol utilities
- `paygod-next/`: Next.js app (wallet UX + transfer flow)
- `zk-prover-backend/`: HTTP service that runs real private-transfer script and returns on-chain tx hash

Useful supporting files:
- `EncryptedERC/DEPLOYMENT_STATUS.md`: current Fuji contract addresses and deployment status
- `EncryptedERC/CONTRACTS.md`: deep contract map and dependencies
- `cloudbuild.team1latam.yaml`: Cloud Build config to build backend image from monorepo root
- `.gcloudignore`: excludes heavy folders (node_modules, .next, dist) from Cloud Build upload

## 2) Architecture

### High-level flow
1. User submits transfer from `paygod-next`.
2. Frontend calls `POST /api/transfers/private`.
3. API route behavior:
   - if `NEXT_PUBLIC_ZK_BACKEND_URL` (or `ZK_BACKEND_URL`) exists and local forcing is disabled, it proxies to `zk-prover-backend`
   - otherwise it runs local Hardhat script in `EncryptedERC`
4. `zk-prover-backend` runs `scripts/private-transfer-fuji.ts`.
5. Script generates zk proof, calls EncryptedERC on Fuji, and prints `PRIVATE_TRANSFER_TX_HASH`.
6. Backend responds with `txHash` and Snowtrace link.

### Contracts and main components
- `EncryptedERC` (core protocol contract)
- `Registrar` (user registration + public key association)
- `BabyJubJub` library (curve operations)
- Groth16 verifier contracts:
  - Registration
  - Mint
  - Transfer
  - Withdraw
  - Burn

See `EncryptedERC/CONTRACTS.md` for a full dependency map.

## 3) Current Fuji deployment references

See `EncryptedERC/DEPLOYMENT_STATUS.md` for latest values.
Known deployed contract (used by frontend env):
- EncryptedERC: `0x68eCE3bafEE50cEeae5Da816128b5633C7ed2fdB`

## 4) Prerequisites

- Node.js >= 20
- npm
- gcloud CLI (for Cloud Run deployment)
- Access to Fuji RPC and funded test wallets

Recommended:
- run from PowerShell in Windows
- keep private keys only in local env/secrets (never commit)

## 5) EncryptedERC - Setup and scripts

From `EncryptedERC/`:

```bash
npm install
npx hardhat compile
npx hardhat zkit make --force
npx hardhat zkit verifiers
```

Important npm scripts (from `EncryptedERC/package.json`):

### Deployment
- `npm run deploy:encrypted:fuji`
  - Deploys EncryptedERC stack on Fuji
- `npm run deploy:generic:fuji`
  - Deploy generic transfer/burn token path

### Registration and auditor
- `npm run register:users:fuji`
  - Register known users
- `npm run register:recipient:fuji`
  - Register recipient account
- `npm run reregister:known:fuji`
  - Re-register known users when needed
- `npm run set:auditor:fuji`
  - Set auditor public key

### Private transfer and inspection
- `npm run transfer:private:fuji`
  - Execute private transfer flow on Fuji
- `npm run decrypt:private:tx:fuji`
  - Decrypt transaction data for inspection/audit
- `npm run index:balances:fuji`
  - Index encrypted balances

### Generic/smoke
- `npm run transfer:generic:fuji`
- `npm run smoke:generic`

## 6) Frontend (paygod-next)

From `paygod-next/`:

```bash
npm install
npm run dev
```

Core scripts:
- `npm run dev`
- `npm run build`
- `npm run start`
- `npm run lint`
- `npm run sync:abis`

ABI sync:
- `npm run sync:abis` copies ABI artifacts from `EncryptedERC/artifacts/contracts` into `paygod-next/lib/abi`

Environment file:
- copy `paygod-next/.env.example` to `.env.local`

Key env vars:
- `NEXT_PUBLIC_ZK_BACKEND_URL=`
  - when set, frontend route proxies to external backend
- `FORCE_LOCAL_ZK=false`
  - when true, forces local Hardhat execution path
- `NEXT_PUBLIC_AVA_RPC_URL=`
- `NEXT_PUBLIC_ENCRYPTED_ERC_ADDRESS=`
- `NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=`

## 7) ZK backend (zk-prover-backend)

From `zk-prover-backend/`:

```bash
npm install
npm run start:local
```

Scripts:
- `npm start`
  - cloud/runtime mode (expects env injected externally)
- `npm run start:local`
  - local mode loading `.env`

Endpoints:
- `GET /health`
- `POST /api/transfers/private`

Sample request:

```bash
curl -X POST http://localhost:8080/api/transfers/private \
  -H "Content-Type: application/json" \
  -d '{"recipient":"0x90813c2C61EE01857c2fDfD003f5272b540a7AA7","amount":"25.00"}'
```

## 8) Cloud Run deployment (backend)

### Build image from monorepo root

From `Team1Latam-Hackathon/`:

```bash
gcloud config set project zk-prover-backend
gcloud builds submit . --config cloudbuild.team1latam.yaml
```

Expected image:
- `gcr.io/zk-prover-backend/team1latam-paygod-zk`

### Deploy to existing service

```bash
gcloud run deploy team1latam-paygod \
  --image gcr.io/zk-prover-backend/team1latam-paygod-zk \
  --region southamerica-east1 \
  --allow-unauthenticated \
  --ingress all \
  --port 8080 \
  --memory 4Gi \
  --cpu 2 \
  --timeout 900 \
  --concurrency 1 \
  --update-env-vars "ENCRYPTED_ERC_ROOT=/app/EncryptedERC,DEMO_FIXED_MODE=true,DEMO_RECIPIENT_ADDRESS=<RECIPIENT>,DEMO_TRANSFER_AMOUNT_BASE_UNITS=2500,DEMO_MINT_AMOUNT_BASE_UNITS=10000,AVA_RPC_URL=<RPC_URL>,AVA_PK=<PK1>,AVA_PK2=<PK2>,ALLOWED_ORIGIN=*"
```

Important:
- keep env vars in one comma-separated string for `--update-env-vars`
- do not use spaces as separators
- avoid committing secrets to repo

### Validate deployment

```bash
URL=$(gcloud run services describe team1latam-paygod --region southamerica-east1 --format="value(status.url)")
curl -k "$URL/health"
```

Expected health response:

```json
{"ok":true,"service":"zk-prover-backend","fixedMode":true}
```

## 9) Live demo runbook (quick)

1. Confirm backend is healthy:
   - `GET /health` returns `ok: true`
2. Confirm frontend points to backend:
   - `NEXT_PUBLIC_ZK_BACKEND_URL` set to Cloud Run URL
3. Open app and connect wallet.
4. Execute one private transfer from UI.
5. Verify returned tx hash in Snowtrace.
6. Optional: run decrypt/index scripts for post-transfer validation.

## 10) Known issues and troubleshooting

### A) Cloud Run returns HTML 404 on all routes
Likely cause:
- service deployed with placeholder image `gcr.io/cloudrun/placeholder`
Fix:
- redeploy with `gcr.io/zk-prover-backend/team1latam-paygod-zk`

### B) Revision fails startup with `.env not found`
Likely cause:
- backend start command used `node --env-file=.env` in cloud
Fix already applied:
- `zk-prover-backend/package.json` uses `npm start -> node ./server.mjs`
- use `start:local` only for local dev

### C) `recipient is required` in backend despite sending data
Likely cause:
- misconfigured Cloud Run env vars (concatenated values)
Fix:
- redeploy with proper comma-separated `--update-env-vars`
- verify env via:
  - `gcloud run services describe team1latam-paygod --region southamerica-east1 --format="yaml(spec.template.spec.containers[0].env)"`

### D) `gcloud builds submit` crashes with long Windows paths
Likely cause:
- node_modules included in upload context
Fix:
- keep `.gcloudignore` with:
  - `.git`
  - `**/node_modules`
  - `**/.next`
  - `**/dist`

### E) PowerShell curl differences
- `curl` maps to `Invoke-WebRequest` in PowerShell
- for classic curl flags, use `curl.exe`

## 11) Security checklist

- Never commit private keys (`AVA_PK`, `AVA_PK2`, etc.)
- Prefer Secret Manager for Cloud Run secrets
- Keep `.env` files local only
- Rotate demo keys after public demos/hackathon deliveries

## 12) Suggested next steps after demo

- Add wallet self-registration flow in UI (calling registration script/service)
- Add recipient pre-check (registered/unregistered) before transfer
- Move PKs to Secret Manager and use `--set-secrets`
- Add integration tests for backend endpoint with fixed-mode and non-fixed-mode

---

