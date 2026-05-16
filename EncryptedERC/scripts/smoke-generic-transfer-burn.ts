import { ethers } from "hardhat";

async function main() {
	const [deployer, receiver] = await ethers.getSigners();
	const tokenFactory = await ethers.getContractFactory("GenericTransferBurnToken");

	const decimals = 18;
	const initialSupply = ethers.parseUnits("1000", decimals);
	const transferAmount = ethers.parseUnits("100", decimals);
	const burnAmount = ethers.parseUnits("25", decimals);

	const token = await tokenFactory.deploy(
		"Generic Transfer Burn",
		"GTB",
		decimals,
		initialSupply,
		deployer.address,
	);
	await token.waitForDeployment();

	const tx1 = await token.transfer(receiver.address, transferAmount);
	await tx1.wait();

	const beforeBurn = await token.balanceOf(receiver.address);
	const tx2 = await token.connect(receiver).burn(burnAmount);
	await tx2.wait();
	const afterBurn = await token.balanceOf(receiver.address);

	const expectedAfterBurn = beforeBurn - burnAmount;
	if (afterBurn !== expectedAfterBurn) {
		throw new Error(
			`Unexpected receiver balance after burn. Expected ${expectedAfterBurn}, got ${afterBurn}`,
		);
	}

	console.table({
		token: token.target,
		deployer: deployer.address,
		receiver: receiver.address,
		transferred: transferAmount.toString(),
		burned: burnAmount.toString(),
		receiverBalanceAfterBurn: afterBurn.toString(),
		totalSupplyAfterBurn: (await token.totalSupply()).toString(),
	});
}

main().catch((error) => {
	console.error(error);
	process.exitCode = 1;
});
