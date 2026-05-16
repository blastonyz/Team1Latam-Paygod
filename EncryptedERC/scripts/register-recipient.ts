import { Base8, mulPointEscalar, subOrder } from "@zk-kit/baby-jubjub";
import { ethers, zkit } from "hardhat";
import { formatPrivKeyForBabyJub, genPrivKey } from "maci-crypto";
import { poseidon3 } from "poseidon-lite";
import type { CalldataRegistrationCircuitGroth16 } from "../generated-types/zkit";
import type { RegisterProofStruct, Registrar } from "../typechain-types/contracts";

// Configuration
const REGISTRAR_ADDRESS = "0xdc7a33eC510956b5eB42F58632906DAa6f53Cc81";
const RECIPIENT_ADDRESS = "0x90813c2C61EE01857c2fDfD003f5272b540a7AA7";

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
		const formattedPrivateKey = formatPrivKeyForBabyJub(privateKey) % subOrder;
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

	async registerUser(registrar: Registrar, userAddress: string, signer: any) {
		console.log(`📝 Registering user: ${userAddress}`);

		const { proof, userData } = await this.generateProof(userAddress);

		const proofStruct: RegisterProofStruct = {
			proofPoints: proof.proofPoints,
			publicSignals: proof.publicSignals,
		};

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
	const manager = new RegistrationManager();
	await manager.initialize();

	// Get registrar contract
	const registrar = (await ethers.getContractAt("Registrar", REGISTRAR_ADDRESS)) as Registrar;

	console.log(`📍 Registrar: ${REGISTRAR_ADDRESS}`);
	console.log(`📍 User to register: ${RECIPIENT_ADDRESS}\n`);
	console.log("🚀 Starting user registration...\n");

	// Get signer (should be the RECIPIENT_ADDRESS or have access to it)
	const signers = await ethers.getSigners();
	let signer = signers.find((s) => s.address.toLowerCase() === RECIPIENT_ADDRESS.toLowerCase());

	if (!signer) {
		console.error(
			`❌ Error: No signer found for ${RECIPIENT_ADDRESS}`,
		);
		console.error("   Available signers:");
		signers.forEach((s) => console.error(`   - ${s.address}`));
		process.exit(1);
	}

	// Register the recipient
	await manager.registerUser(registrar, RECIPIENT_ADDRESS, signer);

	console.log("✨ User registration successful!");
};

main().catch((error) => {
	console.error("❌ Error:", error);
	process.exitCode = 1;
});
