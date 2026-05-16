# EncryptedERC Fuji Testnet Deployment Status

## 🎯 Current State

**Deployment Date:** May 16, 2026  
**Network:** Avalanche Fuji (Chain ID: 43113)

### ✅ Completed

1. **Smart Contract Stack Deployed:**
   - ✅ EncryptedERC: `0x68eCE3bafEE50cEeae5Da816128b5633C7ed2fdB`
   - ✅ Registrar: `0xdc7a33eC510956b5eB42F58632906DAa6f53Cc81`
   - ✅ BabyJubJub Library: `0xea71C6aaEA05c63fead341857563CAc9cbfeFA25`

2. **Verifier Contracts (Groth16):**
   - ✅ Registration Verifier: `0xe5268dc20DA2aE0B824a718004B7cB130c97B01A`
   - ✅ Mint Verifier: `0x8e65577160d345150dC555fA009d05d7913c411D`
   - ✅ Transfer Verifier: `0xFE666394c810Ab48aD51ABD7273547FA6D57ec3b`
   - ✅ Withdraw Verifier: `0x6D0eeb06217700d98092b4BA425236bc4555E0f9`
   - ✅ Burn Verifier: `0xC4cdfA62E25c5ef033a91A81CE5d8f191732A309`

3. **User Registration (with Zero-Knowledge Proofs):**
   - ✅ Deployer `0x0571...` - **REGISTERED**
     - Public Key (BabyJubJub): 
       - X: `6452296584390181441625869403131264170041533156729979198130419958348021926155`
       - Y: `604777630723588566261552733853939638759343352004422690284798438436538322558`
     - Registration Tx: `0x49e407970a1e847861f3eff0dc3da2f4712d91c26121bc0b86eb7bad4df43c7f`
     - Gas Used: 322,115 gas

   - ❌ Recipient `0x9081...` - **NOT YET REGISTERED** (needs own private key access)

### 🔧 Configuration Details

**Token Configuration:**
```
Name: EncryptedERC Test
Symbol: eERC
Decimals: 2  (e.g., 1 token = 100 units, like $1 = 100 cents)
Mode: Standalone (not Converter mode)
```

**Key Contracts:**
- `EncryptedERC`: Main protocol contract for encrypted transfers
- `Registrar`: Manages user registration and stores BabyJubJub public keys
- Verifiers: Validate zero-knowledge proofs for each operation type

### 📝 Next Steps

1. **Register Recipient** (if private key available):
   ```bash
   npm run register:recipient:fuji
   ```
   This requires the recipient address to have a signer available.

2. **Create Encrypted Transfer Script**:
   - Generate TransferCircuit zero-knowledge proof off-chain
   - Submit proof to EncryptedERC.transfer() with encrypted balance data
   - Verifies transfer without revealing amount to auditors

3. **Setup Auditor** (optional):
   - Set auditor public key for compliance tracking
   - Auditor can see all transactions but encrypted amounts

### 🔐 Security Notes

- **Private Keys:** Each user needs their private key to generate ZK proofs
- **Public Keys:** Stored on-chain in Registrar (BabyJubJub curve)
- **Zero-Knowledge:** Amounts are encrypted, not visible on-chain
- **Auditor:** Can decrypt with auditor secret key (role-based)

### 🎓 Understanding Decimals

The token uses **2 decimals** (DECIMALS = 2):
- Internal unit: smallest divisible amount
- 1 Token = 100 internal units
- Example: transfer(150) = 1.50 tokens

### 📊 Current User Status

| Address | Status | Public Key | Tx Hash |
|---------|--------|-----------|---------|
| 0x0571... | ✅ Registered | Stored on-chain | 0x49e4... |
| 0x9081... | ❌ Pending | Not stored | - |

### 🚀 Deployment Scripts

- `deploy:encrypted:fuji` - Deploy entire stack
- `register:users:fuji` - Register deployer + available users
- `register:recipient:fuji` - Register specific recipient (requires signer)
- `transfer:generic:fuji` - Simple ERC20 transfer test (no encryption)

### 📋 Explorer Links

- [EncryptedERC](https://testnet.snowtrace.io/address/0x68eCE3bafEE50cEeae5Da816128b5633C7ed2fdB)
- [Registrar](https://testnet.snowtrace.io/address/0xdc7a33eC510956b5eB42F58632906DAa6f53Cc81)
- [BabyJubJub](https://testnet.snowtrace.io/address/0xea71C6aaEA05c63fead341857563CAc9cbfeFA25)

### 🔄 Protocol Flow

```
User Registration:
  1. Generate ZK proof proving knowledge of private key
  2. Submit proof to Registrar.register()
  3. Public key stored on-chain (encrypted balances use this)
  
Encrypted Transfer:
  1. Generate TransferCircuit proof (off-chain)
  2. Encrypt sender's new balance with recipient's public key
  3. Call EncryptedERC.transfer(proof, encryptedData)
  4. Contract verifies proof + updates encrypted balances
  5. Auditor sees transaction but not amount
```

### ⚠️ Known Limitations

1. **Recipient Registration:** Requires private key access to sign transactions
2. **Auditor Setup:** Not yet configured
3. **No Converter Mode:** Currently standalone, cannot deposit existing ERC20 tokens
4. **Testing Only:** This is a testnet deployment for evaluation
