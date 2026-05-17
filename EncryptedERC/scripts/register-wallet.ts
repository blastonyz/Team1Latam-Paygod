import { Base8, mulPointEscalar, subOrder } from "@zk-kit/baby-jubjub";
import { ethers, zkit } from "hardhat";
import { formatPrivKeyForBabyJub, genPrivKey } from "maci-crypto";
import { poseidon3 } from "poseidon-lite";
import type { CalldataRegistrationCircuitGroth16 } from "../generated-types/zkit";
import type { RegisterProofStruct, Registrar } from "../typechain-types/contracts";

const REGISTRAR_ADDRESS =
  process.env.REGISTRAR_ADDRESS || "0xdc7a33eC510956b5eB42F58632906DAa6f53Cc81";

const TARGET_PRIVATE_KEY =
  process.env.RECIPIENT_PRIVATE_KEY ||
  process.env.TARGET_PRIVATE_KEY ||
  "";

const TARGET_ADDRESS_ENV = process.env.TARGET_ADDRESS || "";

const normalizePrivateKey = (value: string): string => {
  const trimmed = String(value || "").trim();
  if (!trimmed) return "";
  return trimmed.startsWith("0x") ? trimmed : `0x${trimmed}`;
};

const normalizeAddress = (value: string): string => String(value || "").trim();

async function main() {
  if (!TARGET_PRIVATE_KEY) {
    throw new Error("RECIPIENT_PRIVATE_KEY or TARGET_PRIVATE_KEY env var is required");
  }

  const network = await ethers.provider.getNetwork();
  const chainId = BigInt(network.chainId);

  const signer = new ethers.Wallet(normalizePrivateKey(TARGET_PRIVATE_KEY), ethers.provider);
  const targetAddress = normalizeAddress(TARGET_ADDRESS_ENV) || signer.address;

  if (targetAddress.toLowerCase() !== signer.address.toLowerCase()) {
    throw new Error(
      `TARGET_ADDRESS (${targetAddress}) must match the private key address (${signer.address})`,
    );
  }

  const registrar = (await ethers.getContractAt("Registrar", REGISTRAR_ADDRESS)) as Registrar;

  const alreadyRegistered = await registrar.isUserRegistered(targetAddress);
  if (alreadyRegistered) {
    console.log(`REGISTER_WALLET_TX_HASH=ALREADY_REGISTERED`);
    console.log(`REGISTERED_ADDRESS=${targetAddress}`);
    console.log(`REGISTRAR_ADDRESS=${REGISTRAR_ADDRESS}`);
    return;
  }

  const privateKey = genPrivKey();
  const formattedPrivateKey = formatPrivKeyForBabyJub(privateKey) % subOrder;
  const publicKeyPoint = mulPointEscalar(Base8, formattedPrivateKey);
  const senderPublicKey: [bigint, bigint] = [
    BigInt(publicKeyPoint[0]),
    BigInt(publicKeyPoint[1]),
  ];

  const registrationHash = poseidon3([
    chainId,
    formattedPrivateKey,
    BigInt(targetAddress),
  ]);

  const circuit = (await zkit.getCircuit("RegistrationCircuit")) as any;

  const input = {
    SenderPrivateKey: formattedPrivateKey,
    SenderPublicKey: senderPublicKey,
    SenderAddress: BigInt(targetAddress),
    ChainID: chainId,
    RegistrationHash: registrationHash,
  };

  const proof = await circuit.generateProof(input);
  const calldata = (await circuit.generateCalldata(proof)) as CalldataRegistrationCircuitGroth16;

  const proofStruct: RegisterProofStruct = {
    proofPoints: calldata.proofPoints,
    publicSignals: calldata.publicSignals,
  };

  const tx = await registrar.connect(signer).register(proofStruct);
  await tx.wait();

  console.log(`REGISTER_WALLET_TX_HASH=${tx.hash}`);
  console.log(`REGISTERED_ADDRESS=${targetAddress}`);
  console.log(`REGISTRAR_ADDRESS=${REGISTRAR_ADDRESS}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
