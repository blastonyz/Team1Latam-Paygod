# zk-prover-backend

Minimal backend service that runs the real EncryptedERC private transfer script and returns the on-chain tx hash.

## Local run

1. Copy `.env.example` to `.env` and complete `AVA_PK` and `AVA_PK2`.
2. Make sure `EncryptedERC` dependencies are installed.
3. Start service:

```bash
npm start
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

## Cloud Run deploy

From `Team1Latam-Hackathon` root:

```bash
gcloud builds submit --tag gcr.io/<PROJECT_ID>/zk-prover-backend -f zk-prover-backend/Dockerfile .

gcloud run deploy zk-prover-backend \
  --image gcr.io/<PROJECT_ID>/zk-prover-backend \
  --region us-central1 \
  --platform managed \
  --allow-unauthenticated \
  --port 8080 \
  --memory 4Gi \
  --cpu 2 \
  --timeout 900 \
  --concurrency 1 \
  --set-env-vars DEMO_FIXED_MODE=true,DEMO_RECIPIENT_ADDRESS=0x90813c2C61EE01857c2fDfD003f5272b540a7AA7,DEMO_TRANSFER_AMOUNT_BASE_UNITS=2500,DEMO_MINT_AMOUNT_BASE_UNITS=10000,AVA_RPC_URL=https://api.avax-test.network/ext/bc/C/rpc \
  --set-env-vars AVA_PK=<TEST_PRIVATE_KEY_1>,AVA_PK2=<TEST_PRIVATE_KEY_2>
```

Then use your Cloud Run URL in frontend env: `NEXT_PUBLIC_ZK_BACKEND_URL=https://<service-url>`.
