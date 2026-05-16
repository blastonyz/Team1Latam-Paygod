# ZK Transfer Roadmap

## Current demo mode (implemented)

- Fixed transfer scenario is supported with env flags in `zk-prover-backend`.
- Real circuit generation + real private transfer tx are executed through `EncryptedERC/scripts/private-transfer-fuji.ts`.
- Frontend receives and renders real tx hash.

## Constraints accepted for live demo

- Fixed recipient and fixed amount can be enforced (`DEMO_FIXED_MODE=true`).
- Backend executes hardhat script synchronously per request.
- No queue, retries, or background worker split yet.

## Next after demo

- Switch from fixed mode to dynamic request inputs.
- Add job queue + status endpoint.
- Separate API layer and prover worker.
- Add secrets in cloud secret manager and remove plaintext env usage.
- Add structured observability and failure recovery.
