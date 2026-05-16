import { ethers } from "hardhat";

async function main() {
	const [deployer] = await ethers.getSigners();

	// Token desplegado en Fuji
	const tokenAddress = "0xe12903D475C30e854af5a4A76EcD3c33a14880bb";
	const recipientAddress = "0x90813c2C61EE01857c2fDfD003f5272b540a7AA7";

	// Cantidad a transferir: 100 GTB con 18 decimales
	const transferAmount = ethers.parseUnits("100", 18);

	const token = await ethers.getContractAt("GenericTransferBurnToken", tokenAddress);

	console.log("Transfer Details:");
	console.table({
		from: deployer.address,
		to: recipientAddress,
		token: tokenAddress,
		amount: transferAmount.toString(),
	});

	const tx = await token.transfer(recipientAddress, transferAmount);
	const receipt = await tx.wait();

	const txHash = tx.hash;
	const addressUrl = `https://testnet.snowtrace.io/address/${recipientAddress}`;
	const txUrl = `https://testnet.snowtrace.io/tx/${txHash}`;

	console.log("\nTransfer executed:");
	console.table({
		txHash,
		from: deployer.address,
		to: recipientAddress,
		amount: transferAmount.toString(),
		gasUsed: receipt?.gasUsed.toString(),
		gasPrice: receipt?.gasPrice.toString(),
		addressUrl,
		txUrl,
	});
}

main().catch((error) => {
	console.error(error);
	process.exitCode = 1;
});
