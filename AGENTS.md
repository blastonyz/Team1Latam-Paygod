# AGENTS.md

## Scope
This file defines how coding agents should work in `Team1Latam-Hackathon`.
Prioritize this folder over other workspace roots.

## Project Focus
This repo mixes two main tracks:
- RTGS private Avalanche L1 setup and operations (`run/`, `BOOTSTRAP_PLAYBOOK_WSL.md`)
- ERC3643 / T-REX permissioned-token domain references (`rwa-1/`)

## Read First
Use links instead of copying large docs into chat responses:
- Architecture: [run/RTGS-ARCHITECTURE.md](run/RTGS-ARCHITECTURE.md)
- Genesis and precompile settings: [run/GENESIS-CONFIG-GUIDE.md](run/GENESIS-CONFIG-GUIDE.md)
- WSL bootstrap flow: [BOOTSTRAP_PLAYBOOK_WSL.md](BOOTSTRAP_PLAYBOOK_WSL.md)
- WSL troubleshooting: [run/WSL-TROUBLESHOOTING.md](run/WSL-TROUBLESHOOTING.md)
- ERC3643 reference: [rwa-1/TREX_ERC3643_Agent_Reference.md](rwa-1/TREX_ERC3643_Agent_Reference.md)
- Avalanche custom EVM notes: [skills/CUSTOM-EVM.md](skills/CUSTOM-EVM.md)
- Precompile notes: [skills/PRECOMPILES.md](skills/PRECOMPILES.md)

## Environment Assumptions
- Main execution environment is WSL.
- Use Linux-style paths for Avalanche CLI and plugin binaries.
- Prefer running from native WSL paths, not `/mnt/c/...`.

## Verified Command Set
Use these commands as baseline when asked to run or debug local L1 flow:

```bash
cd ~/precompile-evm
./scripts/build.sh

pkill -f avalanchego || true
rm -rf ~/.avalanche-cli/runs/network_*
avalanche network start

avalanche blockchain create rtgs-l1 \
  --force \
  --genesis ./run/genesis-rtgs-l1.json

AVALANCHE_CLI_NETWORK_TIMEOUT=20m avalanche blockchain deploy rtgs-l1 --local
```

For VM factory mismatch, use the documented VMID copy workaround from [BOOTSTRAP_PLAYBOOK_WSL.md](BOOTSTRAP_PLAYBOOK_WSL.md).

## Known Pitfalls
- `run/DEPLOYMENT-GUIDE.md` references `deploy-rtgs-l1.sh` and `validate-rtgs-l1.sh`, but these scripts are not present in this repository.
- CLI behavior can be version-specific; chain creation may require wizard-driven `Custom VM` selection.
- Common WSL failures: DNS, IPv6, MTU, busy ports, and VMID/plugin path mismatch.

## Agent Behavior Rules
- Keep changes minimal and local to the user request.
- Do not duplicate long documentation content when a file link is enough.
- When discussing ERC3643 flows, keep contract names consistent with the reference doc (`IR`, `IRS`, `TIR`, `CTR`, `Modular Compliance`, `ONCHAINID`).
- If local deployment is blocked, suggest using the already documented remote L1 path from [run/l1-custom1.txt](run/l1-custom1.txt) as an MVP fallback.

## What To Validate After Infra Changes
- `avalanche blockchain list --deployed`
- `avalanche blockchain describe rtgs-l1`
- RPC connectivity on the expected chain endpoint
- Basic JSON-RPC methods: `eth_chainId`, `eth_blockNumber`, `eth_gasPrice`
