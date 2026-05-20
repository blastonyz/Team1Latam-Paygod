import { Base8, mulPointEscalar, subOrder } from "@zk-kit/baby-jubjub";
import { ethers, zkit } from "hardhat";
import { formatPrivKeyForBabyJub } from "maci-crypto";
import { poseidon } from "maci-crypto/build/ts/hashing";
import { processPoseidonDecryption, processPoseidonEncryption } from "../src";
import { encryptMessage } from "../src/jub/jub";
import type {
  CalldataMintCircuitGroth16,
  CalldataTransferCircuitGroth16,
  MintCircuit,
  TransferCircuit,
} from "../generated-types/zkit";
import type {
  EncryptedERC,
  MintProofStruct,
  TransferProofStruct,
} from "../typechain-types/contracts/EncryptedERC";
import type { Registrar } from "../typechain-types/contracts/Registrar";

const ENCRYPTED_ERC_ADDRESS = "0x68eCE3bafEE50cEeae5Da816128b5633C7ed2fdB";
const TOKEN_ID = 0n; // Standalone mode
const DEFAULT_MINT_AMOUNT = 10000n; // 100.00 tokens with decimals=2
const DEFAULT_TRANSFER_AMOUNT = 2500n; // 25.00 tokens with decimals=2

type BabyJubUser = {
  evmAddress: string;
  rawPrivateKey: bigint;
  formattedPrivateKey: bigint;
  publicKey: [bigint, bigint];
};

type RecipientTarget = {
  evmAddress: string;
  publicKey: [bigint, bigint];
};

type StandaloneBalance = {
  eGCT: {
    c1: [bigint, bigint];
    c2: [bigint, bigint];
  };
  amountPCTs: Array<{ pct: [bigint, bigint, bigint, bigint, bigint, bigint, bigint] }>;
  balancePCT: [bigint, bigint, bigint, bigint, bigint, bigint, bigint];
};

const normalizeHex = (value: string): string => (value.startsWith("0x") ? value : `0x${value}`);

const buildUserFromEnv = (evmAddress: string, envKey: string): BabyJubUser => {
  const raw = process.env[envKey] || "";
  if (!raw) {
    throw new Error(`Missing ${envKey} in .env`);
  }

  const rawPrivateKey = BigInt(normalizeHex(raw));
  const formattedPrivateKey = formatPrivKeyForBabyJub(rawPrivateKey) % subOrder;
  const point = mulPointEscalar(Base8, formattedPrivateKey);

  return {
    evmAddress,
    rawPrivateKey,
    formattedPrivateKey,
    publicKey: [BigInt(point[0]), BigInt(point[1])],
  };
};

const decryptPCT = (privateKey: bigint, pct: bigint[]): bigint[] => {
  const ciphertext = pct.slice(0, 4);
  const authKey = pct.slice(4, 6);
  const nonce = pct[6];
  return processPoseidonDecryption(ciphertext, authKey, nonce, privateKey, 1);
};

const getDecryptedBalanceFromPCT = (privateKey: bigint, balance: StandaloneBalance): bigint => {
  let total = 0n;

  const balancePCTArray = balance.balancePCT.map((v) => BigInt(v));
  if (balancePCTArray.some((v) => v !== 0n)) {
    total += BigInt(decryptPCT(privateKey, balancePCTArray)[0]);
  }

  for (const item of balance.amountPCTs) {
    const pct = item.pct.map((v) => BigInt(v));
    if (pct.some((v) => v !== 0n)) {
      total += BigInt(decryptPCT(privateKey, pct)[0]);
    }
  }

  return total;
};

const generateMintCalldata = async (
  amount: bigint,
  receiverPublicKey: bigint[],
  auditorPublicKey: bigint[],
): Promise<CalldataMintCircuitGroth16> => {
  const network = await ethers.provider.getNetwork();
  const chainId = network.chainId;

  const { cipher: encryptedAmount, random: encryptedAmountRandom } = encryptMessage(receiverPublicKey, amount);

  const {
    ciphertext: receiverCiphertext,
    nonce: receiverNonce,
    encRandom: receiverEncRandom,
    authKey: receiverAuthKey,
  } = processPoseidonEncryption([amount], receiverPublicKey);

  const {
    ciphertext: auditorCiphertext,
    nonce: auditorNonce,
    encRandom: auditorEncRandom,
    authKey: auditorAuthKey,
  } = processPoseidonEncryption([amount], auditorPublicKey);

  const nullifierHash = poseidon([chainId, ...auditorCiphertext]);

  const input = {
    ValueToMint: amount,
    ChainID: chainId,
    NullifierHash: nullifierHash,
    ReceiverPublicKey: receiverPublicKey,
    ReceiverVTTC1: encryptedAmount[0],
    ReceiverVTTC2: encryptedAmount[1],
    ReceiverVTTRandom: encryptedAmountRandom,
    ReceiverPCT: receiverCiphertext,
    ReceiverPCTAuthKey: receiverAuthKey,
    ReceiverPCTNonce: receiverNonce,
    ReceiverPCTRandom: receiverEncRandom,
    AuditorPublicKey: auditorPublicKey,
    AuditorPCT: auditorCiphertext,
    AuditorPCTAuthKey: auditorAuthKey,
    AuditorPCTNonce: auditorNonce,
    AuditorPCTRandom: auditorEncRandom,
  };

  const mintCircuit = (await zkit.getCircuit("MintCircuit")) as MintCircuit;
  const proof = await mintCircuit.generateProof(input);
  return (await mintCircuit.generateCalldata(proof)) as CalldataMintCircuitGroth16;
};

const generateTransferCalldata = async (
  sender: BabyJubUser,
  senderBalance: bigint,
  receiverPublicKey: bigint[],
  transferAmount: bigint,
  senderEncryptedBalance: bigint[],
  auditorPublicKey: bigint[],
): Promise<{ proof: CalldataTransferCircuitGroth16; senderBalancePCT: bigint[] }> => {
  const senderNewBalance = senderBalance - transferAmount;

  const { cipher: encryptedAmountSender } = encryptMessage(sender.publicKey, transferAmount);
  const {
    cipher: encryptedAmountReceiver,
    random: encryptedAmountReceiverRandom,
  } = encryptMessage(receiverPublicKey, transferAmount);

  const {
    ciphertext: receiverCiphertext,
    nonce: receiverNonce,
    authKey: receiverAuthKey,
    encRandom: receiverEncRandom,
  } = processPoseidonEncryption([transferAmount], receiverPublicKey);

  const {
    ciphertext: auditorCiphertext,
    nonce: auditorNonce,
    authKey: auditorAuthKey,
    encRandom: auditorEncRandom,
  } = processPoseidonEncryption([transferAmount], auditorPublicKey);

  const {
    ciphertext: senderCiphertext,
    nonce: senderNonce,
    authKey: senderAuthKey,
  } = processPoseidonEncryption([senderNewBalance], sender.publicKey);

  const input = {
    ValueToTransfer: transferAmount,
    SenderPrivateKey: sender.formattedPrivateKey,
    SenderPublicKey: sender.publicKey,
    SenderBalance: senderBalance,
    SenderBalanceC1: senderEncryptedBalance.slice(0, 2),
    SenderBalanceC2: senderEncryptedBalance.slice(2, 4),
    SenderVTTC1: encryptedAmountSender[0],
    SenderVTTC2: encryptedAmountSender[1],
    ReceiverPublicKey: receiverPublicKey,
    ReceiverVTTC1: encryptedAmountReceiver[0],
    ReceiverVTTC2: encryptedAmountReceiver[1],
    ReceiverVTTRandom: encryptedAmountReceiverRandom,
    ReceiverPCT: receiverCiphertext,
    ReceiverPCTAuthKey: receiverAuthKey,
    ReceiverPCTNonce: receiverNonce,
    ReceiverPCTRandom: receiverEncRandom,
    AuditorPublicKey: auditorPublicKey,
    AuditorPCT: auditorCiphertext,
    AuditorPCTAuthKey: auditorAuthKey,
    AuditorPCTNonce: auditorNonce,
    AuditorPCTRandom: auditorEncRandom,
  };

  const transferCircuit = (await zkit.getCircuit("TransferCircuit")) as TransferCircuit;
  const proof = await transferCircuit.generateProof(input);
  const calldata = (await transferCircuit.generateCalldata(proof)) as CalldataTransferCircuitGroth16;

  return {
    proof: calldata,
    senderBalancePCT: [...senderCiphertext, ...senderAuthKey, senderNonce],
  };
};

async function main() {
  const signers = await ethers.getSigners();
  if (signers.length < 1) {
    throw new Error("Need at least one configured signer (AVA_PK)");
  }

  const owner = signers[0];
  const recipientAddress = process.env.RECIPIENT_ADDRESS?.trim() || signers[1]?.address || "";

  if (!recipientAddress) {
    throw new Error("Recipient address is required. Set RECIPIENT_ADDRESS or configure a second signer for local tests.");
  }

  const mintAmount = BigInt(process.env.MINT_AMOUNT_BASE_UNITS || DEFAULT_MINT_AMOUNT.toString());
  const transferAmount = BigInt(process.env.TRANSFER_AMOUNT_BASE_UNITS || DEFAULT_TRANSFER_AMOUNT.toString());

  const sender = buildUserFromEnv(owner.address, "AVA_PK");

  const encryptedERC = (await ethers.getContractAt("EncryptedERC", ENCRYPTED_ERC_ADDRESS)) as EncryptedERC;
  const registrarAddress = await encryptedERC.registrar();
  const registrar = (await ethers.getContractAt("Registrar", registrarAddress)) as Registrar;

  const recipientKeyOnChain = await registrar.getUserPublicKey(recipientAddress);
  const recipientPublicKey: [bigint, bigint] = [
    BigInt(recipientKeyOnChain[0].toString()),
    BigInt(recipientKeyOnChain[1].toString()),
  ];

  if (recipientPublicKey[0] === 0n && recipientPublicKey[1] === 0n) {
    throw new Error(`Recipient ${recipientAddress} is not registered in Registrar.`);
  }

  const recipient: RecipientTarget = {
    evmAddress: recipientAddress,
    publicKey: recipientPublicKey,
  };

  console.table({
    encryptedERC: ENCRYPTED_ERC_ADDRESS,
    registrar: registrarAddress,
    owner: owner.address,
    recipient: recipient.evmAddress,
    tokenId: TOKEN_ID.toString(),
    mintAmountBaseUnits: mintAmount.toString(),
    transferAmountBaseUnits: transferAmount.toString(),
  });

  const senderKeyOnChain = await registrar.getUserPublicKey(owner.address);

  if (BigInt(senderKeyOnChain[0].toString()) !== sender.publicKey[0] || BigInt(senderKeyOnChain[1].toString()) !== sender.publicKey[1]) {
    throw new Error("Sender on-chain public key does not match key derived from AVA_PK. Run reregister-known-users first.");
  }

  const auditor = await encryptedERC.auditor();
  if (auditor.toLowerCase() !== owner.address.toLowerCase()) {
    const setAuditorTx = await encryptedERC.connect(owner).setAuditorPublicKey(owner.address);
    await setAuditorTx.wait();
    console.log(`Auditor set to owner. tx=${setAuditorTx.hash}`);
  }

  const auditorKeyStruct = await encryptedERC.auditorPublicKey();
  const auditorPublicKey = [BigInt(auditorKeyStruct.x.toString()), BigInt(auditorKeyStruct.y.toString())];

  const mintCalldata = await generateMintCalldata(mintAmount, sender.publicKey, auditorPublicKey);
  const privateMintTx = await encryptedERC
    .connect(owner)
    ["privateMint(address,((uint256[2],uint256[2][2],uint256[2]),uint256[24]))"](owner.address, {
      proofPoints: mintCalldata.proofPoints,
      publicSignals: mintCalldata.publicSignals,
    } as MintProofStruct);
  await privateMintTx.wait();
  console.log(`Private mint tx: ${privateMintTx.hash}`);

  const senderBalanceBeforeRaw = (await encryptedERC.balanceOfStandalone(owner.address)) as unknown as StandaloneBalance;
  const senderBalanceBefore = getDecryptedBalanceFromPCT(sender.rawPrivateKey, senderBalanceBeforeRaw);

  const senderEncryptedBalance = [
    BigInt(senderBalanceBeforeRaw.eGCT.c1[0]),
    BigInt(senderBalanceBeforeRaw.eGCT.c1[1]),
    BigInt(senderBalanceBeforeRaw.eGCT.c2[0]),
    BigInt(senderBalanceBeforeRaw.eGCT.c2[1]),
  ];

  const { proof, senderBalancePCT } = await generateTransferCalldata(
    sender,
    senderBalanceBefore,
    recipient.publicKey,
    transferAmount,
    senderEncryptedBalance,
    auditorPublicKey,
  );

  const privateTransferTx = await encryptedERC
    .connect(owner)
    ["transfer(address,uint256,((uint256[2],uint256[2][2],uint256[2]),uint256[32]),uint256[7])"](
      recipient.evmAddress,
      TOKEN_ID,
      proof as TransferProofStruct,
      senderBalancePCT as [bigint, bigint, bigint, bigint, bigint, bigint, bigint],
    );
  await privateTransferTx.wait();

  const senderBalanceAfterRaw = (await encryptedERC.balanceOfStandalone(owner.address)) as unknown as StandaloneBalance;

  const senderAfter = getDecryptedBalanceFromPCT(sender.rawPrivateKey, senderBalanceAfterRaw);

  console.table({
    privateTransferTx: privateTransferTx.hash,
    senderBefore: senderBalanceBefore.toString(),
    senderAfter: senderAfter.toString(),
    recipient: recipient.evmAddress,
    expectedSenderAfter: (senderBalanceBefore - transferAmount).toString(),
    expectedRecipientIncrease: transferAmount.toString(),
    snowtraceTx: `https://testnet.snowtrace.io/tx/${privateTransferTx.hash}`,
  });
  console.log(`PRIVATE_TRANSFER_TX_HASH=${privateTransferTx.hash}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
