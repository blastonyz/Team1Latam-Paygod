import { Base8, mulPointEscalar, subOrder } from "@zk-kit/baby-jubjub";
import { ethers, zkit } from "hardhat";
import { formatPrivKeyForBabyJub, genPrivKey } from "maci-crypto";
import { poseidon3 } from "poseidon-lite";
import type { CalldataRegistrationCircuitGroth16 } from "../generated-types/zkit";
import type { RegisterProofStruct, Registrar } from "../typechain-types/contracts";

// User addresses to register
// NOTE: Only addresses whose private keys are available in Hardhat can be registered
// The deployer can register themselves. Other addresses must run this script with their own signer.
const USERS_TO_REGISTER = [
	"0x0571235134DC15a00f02916987C2c16b5fC52E2A", // Deployer - HAS PRIVATE KEY
	// "0x90813c2C61EE01857c2fDfD003f5272b540a7AA7", // Recipient - must register via separate script with own key
];

// Registrar address (deploy output)
const REGISTRAR_ADDRESS = "0xdc7a33eC510956b5eB42F58632906DAa6f53Cc81";

interface UserData {
	address: string;
	privateKey: bigint;
	formattedPrivateKey: bigint;
	publicKey: [bigint, bigint];
	registrationHash: bigint;
}

class RegistrationManager {
	private userData: Map<string, UserData> = new Map();
	private chainId: bigint = 0n;

	async initialize() {
		const network = await ethers.provider.getNetwork();
		this.chainId = BigInt(network.chainId);
		console.log(`Network Chain ID: ${this.chainId}\n`);
	}

	generateUserData(userAddress: string): UserData {
		const privateKey = genPrivKey();
		const formattedPrivateKey = (formatPrivKeyForBabyJub(privateKey) % subOrder);
		const pubKeyPoint = mulPointEscalar(Base8, formattedPrivateKey);
		const publicKey: [bigint, bigint] = [
			BigInt(pubKeyPoint[0]),
			BigInt(pubKeyPoint[1]),
		];

		const registrationHash = poseidon3([
			this.chainId,
			formattedPrivateKey,
			BigInt(userAddress),
		]);

		const userData: UserData = {
			address: userAddress,
			privateKey,
			formattedPrivateKey,
			publicKey,
			registrationHash,
		};

		this.userData.set(userAddress, userData);
		return userData;
	}

	async generateProof(
		userAddress: string,
	): Promise<{ proof: CalldataRegistrationCircuitGroth16; userData: UserData }> {
		let userData = this.userData.get(userAddress);
		if (!userData) {
			userData = this.generateUserData(userAddress);
		}

		const circuit = (await zkit.getCircuit("RegistrationCircuit")) as any;

		const input = {
			SenderPrivateKey: userData.formattedPrivateKey,
			SenderPublicKey: userData.publicKey,
			SenderAddress: BigInt(userData.address),
			ChainID: this.chainId,
			RegistrationHash: userData.registrationHash,
		};

		const proof = await circuit.generateProof(input);
		const calldata = await circuit.generateCalldata(proof);

		return { proof: calldata as CalldataRegistrationCircuitGroth16, userData };
	}

	async registerUser(registrar: Registrar, userAddress: string, signerAddress: string) {
		console.log(`📝 Registering user: ${userAddress}`);

		const { proof, userData } = await this.generateProof(userAddress);

		const proofStruct: RegisterProofStruct = {
			proofPoints: proof.proofPoints,
			publicSignals: proof.publicSignals,
		};

		// Get signer for the user (must be the user's account)
		const signer = await ethers.getSigner(signerAddress);

		const tx = await registrar.connect(signer).register(proofStruct);
		const receipt = await tx.wait();

		console.log(`✅ User registered:`);
		console.table({
			address: userData.address,
			publicKey: [`${userData.publicKey[0]}`, `${userData.publicKey[1]}`],
			registrationHash: userData.registrationHash.toString(),
			txHash: tx.hash,
			gasUsed: receipt?.gasUsed.toString(),
		});

		// Verify registration
		const isRegistered = await registrar.isUserRegistered(userData.address);
		const storedPubKey = await registrar.getUserPublicKey(userData.address);

		console.log(`✨ Verification:`);
		console.table({
			isRegistered,
			storedPubKeyX: storedPubKey[0].toString(),
			storedPubKeyY: storedPubKey[1].toString(),
		});

		console.log("");
		return userData;
	}
}

const main = async () => {
	if (REGISTRAR_ADDRESS === "0x0000000000000000000000000000000000000000") {
		console.error(
			"❌ Error: REGISTRAR_ADDRESS not set. Please run deploy-encrypted-erc.ts first.",
		);
		process.exit(1);
	}

	const manager = new RegistrationManager();
	await manager.initialize();

	// Get registrar contract
	const registrar = (await ethers.getContractAt("Registrar", REGISTRAR_ADDRESS)) as Registrar;

	console.log(`📍 Registrar: ${REGISTRAR_ADDRESS}\n`);
	console.log("🚀 Starting user registration...\n");

	// Register each user
	for (const userAddress of USERS_TO_REGISTER) {
		await manager.registerUser(registrar, userAddress, userAddress);
	}

	console.log("✨ All users registered successfully!");
};

main().catch((error) => {
	console.error("❌ Error:", error);
	process.exitCode = 1;
});
