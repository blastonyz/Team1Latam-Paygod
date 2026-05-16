import { ethers } from "hardhat";
import type { EncryptedERC } from "../typechain-types/contracts/EncryptedERC";
import type { Registrar } from "../typechain-types/contracts/Registrar";

const ENCRYPTED_ERC_ADDRESS =
	process.env.ENCRYPTED_ERC_ADDRESS ||
	"0x68eCE3bafEE50cEeae5Da816128b5633C7ed2fdB";

const AUDITOR_ADDRESS =
	process.env.AUDITOR_ADDRESS ||
	"0x90813c2C61EE01857c2fDfD003f5272b540a7AA7";

async function main() {
	const [owner] = await ethers.getSigners();

	const encryptedERC = (await ethers.getContractAt(
		"EncryptedERC",
		ENCRYPTED_ERC_ADDRESS,
	)) as EncryptedERC;

	const registrarAddress = await encryptedERC.registrar();
	const registrar = (await ethers.getContractAt(
		"Registrar",
		registrarAddress,
	)) as Registrar;

	const isRegistered = await registrar.isUserRegistered(AUDITOR_ADDRESS);
	if (!isRegistered) {
		throw new Error(
			`Auditor candidate ${AUDITOR_ADDRESS} is not registered in Registrar ${registrarAddress}`,
		);
	}

	const currentAuditor = await encryptedERC.auditor();
	const tx = await encryptedERC.connect(owner).setAuditorPublicKey(AUDITOR_ADDRESS);
	const receipt = await tx.wait();
	const newAuditor = await encryptedERC.auditor();
	const auditorKey = await encryptedERC.auditorPublicKey();

	console.table({
		owner: owner.address,
		encryptedERC: ENCRYPTED_ERC_ADDRESS,
		registrar: registrarAddress,
		previousAuditor: currentAuditor,
		newAuditor,
		auditorPubKeyX: auditorKey.x.toString(),
		auditorPubKeyY: auditorKey.y.toString(),
		txHash: tx.hash,
		gasUsed: receipt?.gasUsed.toString(),
		txUrl: `https://testnet.snowtrace.io/tx/${tx.hash}`,
	});
}

main().catch((error) => {
	console.error(error);
	process.exitCode = 1;
});
