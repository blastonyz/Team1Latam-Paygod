import { ethers } from "hardhat";
import { deployLibrary, deployVerifiers } from "../test/helpers";
import { EncryptedERC__factory, Registrar__factory } from "../typechain-types";
import { DECIMALS } from "./constants";

const main = async () => {
	const [deployer] = await ethers.getSigners();

	console.log("🚀 Deploying EncryptedERC stack on Fuji...");
	console.log(`Deployer: ${deployer.address}\n`);

	// Deploy verifiers
	console.log("📦 Deploying verifiers...");
	const { registrationVerifier, mintVerifier, withdrawVerifier, transferVerifier, burnVerifier } =
		await deployVerifiers(deployer);
	console.log(`✅ Verifiers deployed:
  - Registration: ${registrationVerifier}
  - Mint: ${mintVerifier}
  - Withdraw: ${withdrawVerifier}
  - Transfer: ${transferVerifier}
  - Burn: ${burnVerifier}\n`);

	// Deploy BabyJubJub library
	console.log("📦 Deploying BabyJubJub library...");
	const babyJubJub = await deployLibrary(deployer);
	console.log(`✅ BabyJubJub library: ${babyJubJub}\n`);

	// Deploy Registrar
	console.log("📦 Deploying Registrar...");
	const registrarFactory = new Registrar__factory(deployer);
	const registrar = await registrarFactory.deploy(registrationVerifier);
	await registrar.waitForDeployment();
	console.log(`✅ Registrar: ${registrar.target}\n`);

	// Deploy EncryptedERC (Standalone)
	console.log("📦 Deploying EncryptedERC (Standalone)...");
	const encryptedERCFactory = new EncryptedERC__factory({
		"contracts/libraries/BabyJubJub.sol:BabyJubJub": babyJubJub,
	});
	const encryptedERC = await encryptedERCFactory.connect(deployer).deploy({
		registrar: registrar.target,
		isConverter: false, // Standalone mode
		name: "EncryptedERC Test",
		symbol: "eERC",
		mintVerifier,
		withdrawVerifier,
		transferVerifier,
		burnVerifier,
		decimals: DECIMALS,
	});
	await encryptedERC.waitForDeployment();
	console.log(`✅ EncryptedERC: ${encryptedERC.target}\n`);

	// Display summary
	console.log("📋 Deployment Summary:");
	console.table({
		registrationVerifier,
		mintVerifier,
		withdrawVerifier,
		transferVerifier,
		burnVerifier,
		babyJubJub,
		registrar: registrar.target,
		encryptedERC: encryptedERC.target,
		decimals: DECIMALS,
	});

	// Display explorer links
	const baseUrl = "https://testnet.snowtrace.io";
	console.log("\n🔗 Explorer Links:");
	console.log(`  Registrar: ${baseUrl}/address/${registrar.target}`);
	console.log(`  EncryptedERC: ${baseUrl}/address/${encryptedERC.target}`);
};

main().catch((error) => {
	console.error(error);
	process.exitCode = 1;
});
