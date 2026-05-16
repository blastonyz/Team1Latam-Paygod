import { ethers } from "hardhat";

async function main() {
	const [deployer] = await ethers.getSigners();
	const tokenFactory = await ethers.getContractFactory("GenericTransferBurnToken");

	const name = "Generic Transfer Burn";
	const symbol = "GTB";
	const decimals = 18;
	const initialSupply = ethers.parseUnits("1000000", decimals);

	const token = await tokenFactory.deploy(
		name,
		symbol,
		decimals,
		initialSupply,
		deployer.address,
	);
	await token.waitForDeployment();

	const deployTx = token.deploymentTransaction();
	const deployTxHash = deployTx?.hash ?? "N/A";
	const addressUrl = `https://testnet.snowtrace.io/address/${token.target}`;
	const txUrl = deployTxHash !== "N/A"
		? `https://testnet.snowtrace.io/tx/${deployTxHash}`
		: "N/A";

	console.table({
		deployer: deployer.address,
		token: token.target,
		deployTxHash,
		name,
		symbol,
		decimals: decimals.toString(),
		initialSupply: initialSupply.toString(),
		addressUrl,
		txUrl,
	});
}

main().catch((error) => {
	console.error(error);
	process.exitCode = 1;
});
