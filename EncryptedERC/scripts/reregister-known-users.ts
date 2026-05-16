import { Base8, mulPointEscalar, subOrder } from "@zk-kit/baby-jubjub";
import { ethers, zkit } from "hardhat";
import { formatPrivKeyForBabyJub } from "maci-crypto";
import { poseidon3 } from "poseidon-lite";
import type { CalldataRegistrationCircuitGroth16, RegistrationCircuit } from "../generated-types/zkit";
import type { Registrar, RegisterProofStruct } from "../typechain-types/contracts";

const REGISTRAR_ADDRESS = "0xdc7a33eC510956b5eB42F58632906DAa6f53Cc81";
const ENV_KEYS = ["AVA_PK", "AVA_PK1", "AVA_PK2", "AVA_PK3"] as const;

type BabyJubUser = {
  evmAddress: string;
  rawPrivateKey: bigint;
  formattedPrivateKey: bigint;
  publicKey: [bigint, bigint];
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

const registerWithKnownKey = async (
  registrar: Registrar,
  registrationCircuit: RegistrationCircuit,
  user: BabyJubUser,
  signer: Awaited<ReturnType<typeof ethers.getSigner>>,
  chainId: bigint,
) => {
  const registrationHash = poseidon3([
    chainId,
    user.formattedPrivateKey,
    BigInt(user.evmAddress),
  ]);

  const current = await registrar.getUserPublicKey(user.evmAddress);
  const currentX = BigInt(current[0].toString());
  const currentY = BigInt(current[1].toString());

  if (currentX === user.publicKey[0] && currentY === user.publicKey[1]) {
    console.log(`User ${user.evmAddress} already has expected public key. Skipping.`);
    return;
  }

  const input = {
    SenderPrivateKey: user.formattedPrivateKey,
    SenderPublicKey: user.publicKey,
    SenderAddress: BigInt(user.evmAddress),
    ChainID: chainId,
    RegistrationHash: registrationHash,
  };

  const proof = await registrationCircuit.generateProof(input);
  const calldata = (await registrationCircuit.generateCalldata(proof)) as CalldataRegistrationCircuitGroth16;

  const tx = await registrar.connect(signer).register({
    proofPoints: calldata.proofPoints,
    publicSignals: calldata.publicSignals,
  } as RegisterProofStruct);
  const receipt = await tx.wait();

  console.log(`Registered ${user.evmAddress}`);
  console.table({
    txHash: tx.hash,
    gasUsed: receipt?.gasUsed.toString() || "",
    pubKeyX: user.publicKey[0].toString(),
    pubKeyY: user.publicKey[1].toString(),
  });
};

async function main() {
  const signers = await ethers.getSigners();
  const signerMap = new Map(signers.map((s) => [s.address.toLowerCase(), s]));

  const registrar = (await ethers.getContractAt("Registrar", REGISTRAR_ADDRESS)) as Registrar;
  const chainId = BigInt((await ethers.provider.getNetwork()).chainId);
  const registrationCircuit = (await zkit.getCircuit("RegistrationCircuit")) as RegistrationCircuit;

  const usersToRegister = ENV_KEYS
    .filter((envKey) => !!process.env[envKey])
    .map((envKey) => {
      const user = buildUserFromEnv("0x0", envKey);
      const wallet = new ethers.Wallet(normalizeHex(process.env[envKey] as string));
      const signer = signerMap.get(wallet.address.toLowerCase());
      if (!signer) {
        throw new Error(
          `Signer for ${envKey} (${wallet.address}) is not available in hardhat network config`,
        );
      }
      user.evmAddress = wallet.address;
      return { envKey, user, signer };
    });

  if (usersToRegister.length === 0) {
    throw new Error("No AVA_PK* env key found to register");
  }

  console.log("Re-registering users with deterministic BabyJub keys from .env private keys");
  console.table({
    users: usersToRegister.length,
    registrar: REGISTRAR_ADDRESS,
    chainId: chainId.toString(),
  });

  for (const item of usersToRegister) {
    console.log(`Processing ${item.envKey} -> ${item.user.evmAddress}`);
    await registerWithKnownKey(registrar, registrationCircuit, item.user, item.signer, chainId);
  }

  console.log("Done. Users now have deterministic keys based on AVA_PK/AVA_PK1/AVA_PK2/AVA_PK3.");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
