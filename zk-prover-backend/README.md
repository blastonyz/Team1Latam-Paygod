# zk-prover-backend

Backend service that executes EncryptedERC Hardhat scripts and exposes demo-friendly HTTP endpoints for:
- private transfer execution
- wallet registration
- auditor setup
- private tx decryption

## Local run

1. Copy `.env.example` to `.env` and complete `AVA_PK` and `AVA_PK2`.
2. Make sure `EncryptedERC` dependencies are installed.
3. Start service:

```bash
npm run start:local
```

Health check:

```bash
curl http://localhost:8080/health
```

Transfer endpoint:

```bash
curl -X POST http://localhost:8080/api/transfers/private \
  -H "Content-Type: application/json" \
  -d '{"recipient":"0x90813c2C61EE01857c2fDfD003f5272b540a7AA7","amount":"25.00"}'
```

If `DEMO_FIXED_MODE=true`, request recipient/amount are ignored and fixed env values are used.

Register wallet endpoint:

```bash
curl -X POST http://localhost:8080/api/users/register \
  -H "Content-Type: application/json" \
  -d '{"privateKey":"<WALLET_PRIVATE_KEY_HEX>","address":"0x90813c2C61EE01857c2fDfD003f5272b540a7AA7"}'
```

Set auditor endpoint:

```bash
curl -X POST http://localhost:8080/api/auditor/set \
  -H "Content-Type: application/json" \
  -d '{"auditorAddress":"0x90813c2C61EE01857c2fDfD003f5272b540a7AA7"}'
```

Decrypt tx endpoint:

```bash
curl -X POST http://localhost:8080/api/tx/decrypt \
  -H "Content-Type: application/json" \
  -d '{"txHash":"0x<PRIVATE_TX_HASH>"}'
```

Notes:
- `api/users/register` requires the wallet private key used to sign the registration tx.
- `api/auditor/set` requires the auditor to be previously registered.
- `api/tx/decrypt` uses local auditor private keys (`AVA_PK`, `AVA_PK1`, `AVA_PK2`, `AVA_PK3`) to decrypt.

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
  --update-env-vars "ENCRYPTED_ERC_ROOT=/app/EncryptedERC,DEMO_FIXED_MODE=true,DEMO_RECIPIENT_ADDRESS=0x90813c2C61EE01857c2fDfD003f5272b540a7AA7,DEMO_TRANSFER_AMOUNT_BASE_UNITS=2500,DEMO_MINT_AMOUNT_BASE_UNITS=10000,AVA_RPC_URL=https://api.avax-test.network/ext/bc/C/rpc,AVA_PK=<TEST_PRIVATE_KEY_1>,AVA_PK2=<TEST_PRIVATE_KEY_2>,ALLOWED_ORIGIN=*"
```

Then use your Cloud Run URL in frontend env: `NEXT_PUBLIC_ZK_BACKEND_URL=https://<service-url>`.
