# PayGod - Contracts Map

## Scope
This document maps the contracts under:
- contracts/EncryptedERC/contracts

It describes responsibilities, key dependencies, and how the protocol is wired.

## High-Level Architecture
The system is centered around EncryptedERC, which composes four modules via inheritance:
- Token tracking and mode control
- Encrypted balances storage and history
- Auditor key management
- Encrypted metadata/event messaging

Main inheritance chain:
- EncryptedERC
  - TokenTracker
  - EncryptedUserBalances
  - AuditorManager
  - EncryptedMetadata

Main external dependency:
- Registrar for user public key registration and lookup

ZK verification is delegated to dedicated verifier contracts (interfaces in interfaces/verifiers, implementations in verifiers or prod).

## Folder Map

### Core
- contracts/EncryptedERC/contracts/EncryptedERC.sol
  - Main protocol contract.
  - Supports two modes:
    - Standalone: privateMint, privateBurn, transfer.
    - Converter: deposit, withdraw, transfer.
  - Uses registrar + verifiers + inherited modules.

- contracts/EncryptedERC/contracts/Registrar.sol
  - User registration with zk proof.
  - Stores user public key (BabyJubJub point).
  - Enforces chain id, sender binding, registration hash uniqueness.

- contracts/EncryptedERC/contracts/EncryptedUserBalances.sol
  - Stores encrypted balances per user/tokenId.
  - Maintains nonce + transaction index + history hash list.
  - Adds/subtracts encrypted amounts using BabyJubJub point ops.

### Auditor
- contracts/EncryptedERC/contracts/auditor/AuditorManager.sol
  - Stores auditor address and auditor public key.
  - Guard modifier onlyIfAuditorSet.

### Metadata
- contracts/EncryptedERC/contracts/metadata/EncryptedMetadata.sol
  - Emits PrivateMessage with encrypted payload and metadata struct.
  - Internal helpers for operation metadata emission.

- contracts/EncryptedERC/contracts/metadata/IEncryptedMetadata.sol
  - Interface for sendEncryptedMetadata and PrivateMessage event.

### Token Registry and Mode Controls
- contracts/EncryptedERC/contracts/tokens/TokenTracker.sol
  - Ownable2Step-managed token registry and blacklist.
  - Converter/standalone mode guards.
  - tokenIds, tokenAddresses, nextTokenId, getTokens().

### Utility/Test Tokens
- contracts/EncryptedERC/contracts/tokens/SimpleERC20.sol
  - Simple mintable ERC20 with custom decimals.

- contracts/EncryptedERC/contracts/tokens/FeeERC20.sol
  - ERC20 test token with transferFrom fee logic.

### Cryptography and Data Types
- contracts/EncryptedERC/contracts/libraries/BabyJubJub.sol
  - EC math and encryption helpers used by balances and proofs.

- contracts/EncryptedERC/contracts/types/Types.sol
  - Shared structs: proofs, encrypted balance, metadata, constructor params.

- contracts/EncryptedERC/contracts/errors/Errors.sol
  - Shared custom errors used across modules.

### External Interfaces
- contracts/EncryptedERC/contracts/interfaces/IRegistrar.sol
  - getUserPublicKey, isUserRegistered.

- contracts/EncryptedERC/contracts/interfaces/IEncryptedERC.sol
  - setUserBalancePCT entrypoint.

- contracts/EncryptedERC/contracts/interfaces/verifiers/IBurnVerifier.sol
- contracts/EncryptedERC/contracts/interfaces/verifiers/IMintVerifier.sol
- contracts/EncryptedERC/contracts/interfaces/verifiers/IRegistrationVerifier.sol
- contracts/EncryptedERC/contracts/interfaces/verifiers/ITransferVerifier.sol
- contracts/EncryptedERC/contracts/interfaces/verifiers/IWithdrawVerifier.sol
  - Typed verifyProof interfaces by circuit/public input size.

### Verifier Implementations
- contracts/EncryptedERC/contracts/verifiers/BurnCircuitGroth16Verifier.sol
- contracts/EncryptedERC/contracts/verifiers/MintCircuitGroth16Verifier.sol
- contracts/EncryptedERC/contracts/verifiers/RegistrationCircuitGroth16Verifier.sol
- contracts/EncryptedERC/contracts/verifiers/TransferCircuitGroth16Verifier.sol
- contracts/EncryptedERC/contracts/verifiers/WithdrawCircuitGroth16Verifier.sol
  - Auto-generated verifier contracts (hardhat-zkit output).

- contracts/EncryptedERC/contracts/prod/BurnVerifier.sol
- contracts/EncryptedERC/contracts/prod/MintVerifier.sol
- contracts/EncryptedERC/contracts/prod/RegistrationVerifier.sol
- contracts/EncryptedERC/contracts/prod/TransferVerifier.sol
- contracts/EncryptedERC/contracts/prod/WithdrawVerifier.sol
  - Production verifier set (snarkjs-generated verifier contracts with embedded VK constants).

## Dependency Wiring

### EncryptedERC imports
- Internal protocol modules:
  - TokenTracker
  - EncryptedUserBalances
  - AuditorManager
  - EncryptedMetadata
- Crypto and token helpers:
  - BabyJubJub
  - OpenZeppelin IERC20, IERC20Metadata, SafeERC20
- Types and Errors:
  - Types.sol
  - Errors.sol
- External protocol endpoints:
  - IRegistrar
  - IMintVerifier / IWithdrawVerifier / ITransferVerifier / IBurnVerifier

### Registrar imports
- Types RegisterProof/Point
- IRegistrationVerifier
- Errors
- BabyJubJub constants/checks

### Cross-cutting
- Types.sol and Errors.sol are shared by almost every core module.
- BabyJubJub.sol is the central cryptographic helper for registration and encrypted balance operations.

## Operational Flows

### 1) Registration
1. User submits RegisterProof to Registrar.register.
2. Registrar checks sender, chain id, registration hash, and proof validity.
3. User public key is persisted for later encrypted operations.

### 2) Standalone mode
1. Owner can privateMint to registered users (with valid proof + nullifier checks).
2. Users can privateBurn and transfer privately (with proof verification).
3. No wrapping/unwrapping of external ERC20 is used.

### 3) Converter mode
1. User deposits supported ERC20 into EncryptedERC (token tracked in TokenTracker).
2. Encrypted balance is credited.
3. User withdraws by proving validity and receives clear ERC20 back.

### 4) Metadata channel
- sendEncryptedMetadata emits PrivateMessage event with encrypted payload for off-chain consumption/decryption by recipient.

## SnarkJS Verification Mapping
The current local zkit build used:
- C:/Users/Blas/.zkit/ptau/powers-of-tau-15.ptau

Because zkit generated all local zkeys using that ptau, verify all local zkeys with the same ptau file:

- Burn
  - snarkjs zkey verify zkit/artifacts/circom/burn.circom/BurnCircuit.r1cs C:/Users/Blas/.zkit/ptau/powers-of-tau-15.ptau zkit/artifacts/circom/burn.circom/BurnCircuit.groth16.zkey
- Mint
  - snarkjs zkey verify zkit/artifacts/circom/mint.circom/MintCircuit.r1cs C:/Users/Blas/.zkit/ptau/powers-of-tau-15.ptau zkit/artifacts/circom/mint.circom/MintCircuit.groth16.zkey
- Registration
  - snarkjs zkey verify zkit/artifacts/circom/registration.circom/RegistrationCircuit.r1cs C:/Users/Blas/.zkit/ptau/powers-of-tau-15.ptau zkit/artifacts/circom/registration.circom/RegistrationCircuit.groth16.zkey
- Transfer
  - snarkjs zkey verify zkit/artifacts/circom/transfer.circom/TransferCircuit.r1cs C:/Users/Blas/.zkit/ptau/powers-of-tau-15.ptau zkit/artifacts/circom/transfer.circom/TransferCircuit.groth16.zkey
- Withdraw
  - snarkjs zkey verify zkit/artifacts/circom/withdraw.circom/WithdrawCircuit.r1cs C:/Users/Blas/.zkit/ptau/powers-of-tau-15.ptau zkit/artifacts/circom/withdraw.circom/WithdrawCircuit.groth16.zkey

## Notes
- There are two verifier sets in the repo:
  - contracts/verifiers: generated by hardhat-zkit workflow.
  - contracts/prod: production verifier contracts.
- Ensure deployment scripts consistently pick one verifier set per environment.
