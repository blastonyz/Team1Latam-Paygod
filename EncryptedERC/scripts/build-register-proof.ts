import { Base8, mulPointEscalar, subOrder } from "@zk-kit/baby-jubjub";
import { ethers, zkit } from "hardhat";
import { formatPrivKeyForBabyJub, genPrivKey } from "maci-crypto";
import { poseidon3 } from "poseidon-lite";
import type { CalldataRegistrationCircuitGroth16 } from "../generated-types/zkit";
import type { Registrar } from "../typechain-types/contracts";

const REGISTRAR_ADDRESS =
  process.env.REGISTRAR_ADDRESS || "0xdc7a33eC510956b5eB42F58632906DAa6f53Cc81";

const TARGET_ADDRESS_ENV = process.env.TARGET_ADDRESS || "";

const normalizeAddress = (value: string): string => String(value || "").trim();

const stringifyBigInts = (value: unknown): unknown => {
  if (typeof value === "bigint") {
    return value.toString();
  }
  if (Array.isArray(value)) {
    return value.map((item) => stringifyBigInts(item));
  }
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value).map(([key, item]) => [key, stringifyBigInts(item)]),
    );
  }
  return value;
};

async function main() {
  const targetAddress = normalizeAddress(TARGET_ADDRESS_ENV);

  if (!targetAddress || !ethers.isAddress(targetAddress)) {
    throw new Error("TARGET_ADDRESS env var is required and must be a valid address");
  }

  const network = await ethers.provider.getNetwork();
  const chainId = BigInt(network.chainId);
  const registrar = (await ethers.getContractAt("Registrar", REGISTRAR_ADDRESS)) as Registrar;

  if (await registrar.isUserRegistered(targetAddress)) {
    console.log(`REGISTER_STATUS=ALREADY_REGISTERED`);
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

  const circuit = await zkit.getCircuit("RegistrationCircuit");

  const input = {
    SenderPrivateKey: formattedPrivateKey,
    SenderPublicKey: senderPublicKey,
    SenderAddress: BigInt(targetAddress),
    ChainID: chainId,
    RegistrationHash: registrationHash,
  };

  const proof = await circuit.generateProof(input);
  const calldata = (await circuit.generateCalldata(proof)) as CalldataRegistrationCircuitGroth16;

  console.log(`REGISTERED_ADDRESS=${targetAddress}`);
  console.log(`REGISTRAR_ADDRESS=${REGISTRAR_ADDRESS}`);
  console.log(`REGISTER_PROOF_JSON=${JSON.stringify(stringifyBigInts({
    proofPoints: calldata.proofPoints,
    publicSignals: calldata.publicSignals,
  }))}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});