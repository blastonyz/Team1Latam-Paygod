import { ethers } from "hardhat";
import { processPoseidonDecryption } from "../src";

const ENCRYPTED_ERC_ADDRESS =
	process.env.ENCRYPTED_ERC_ADDRESS ||
	"0x68eCE3bafEE50cEeae5Da816128b5633C7ed2fdB";

const TX_HASH = process.env.TX_HASH || "";

const EVENT_ABI = [
	"event PrivateMint(address indexed user, uint256[7] auditorPCT, address indexed auditorAddress)",
	"event PrivateBurn(address indexed user, uint256[7] auditorPCT, address indexed auditorAddress)",
	"event PrivateTransfer(address indexed from, address indexed to, uint256[7] auditorPCT, address indexed auditorAddress)",
	"event Withdraw(address indexed user, uint256 amount, uint256 tokenId, uint256[7] auditorPCT, address indexed auditorAddress)",
];

const normalizeHex = (value: string): string => (value.startsWith("0x") ? value : `0x${value}`);

const keyEntries = ["AVA_PK", "AVA_PK1", "AVA_PK2", "AVA_PK3"] as const;

const buildAuditorKeyMap = (): Map<string, bigint> => {
	const m = new Map<string, bigint>();
	for (const k of keyEntries) {
		const raw = process.env[k];
		if (!raw) continue;
		const wallet = new ethers.Wallet(normalizeHex(raw));
		m.set(wallet.address.toLowerCase(), BigInt(normalizeHex(raw)));
	}
	return m;
};

const decryptAuditorPct = (auditorPCT: bigint[], auditorPrivateKey: bigint) => {
	const ciphertext = auditorPCT.slice(0, 4);
	const authKey = auditorPCT.slice(4, 6);
	const nonce = auditorPCT[6];
	const decrypted = processPoseidonDecryption(ciphertext, authKey, nonce, auditorPrivateKey, 1);
	return {
		amountBaseUnits: decrypted[0],
		nonce,
	};
};

async function main() {
	if (!TX_HASH) {
		throw new Error("Missing TX_HASH env var. Example: TX_HASH=0x... npm run decrypt:private:tx:fuji");
	}

	const provider = ethers.provider;
	const receipt = await provider.getTransactionReceipt(TX_HASH);
	if (!receipt) {
		throw new Error(`Transaction receipt not found for ${TX_HASH}`);
	}

	const iface = new ethers.Interface(EVENT_ABI);
	const auditorKeyMap = buildAuditorKeyMap();

	let found = false;
	for (const log of receipt.logs) {
		if (log.address.toLowerCase() !== ENCRYPTED_ERC_ADDRESS.toLowerCase()) continue;

		let parsed: ethers.LogDescription;
		try {
			parsed = iface.parseLog(log);
		} catch {
			continue;
		}

		if (!parsed.args.auditorAddress || !parsed.args.auditorPCT) continue;

		const auditorAddress = String(parsed.args.auditorAddress);
		const auditorPk = auditorKeyMap.get(auditorAddress.toLowerCase());
		if (!auditorPk) {
			console.log(`No local private key found for auditor ${auditorAddress}.`);
			continue;
		}

		const auditorPCT = (parsed.args.auditorPCT as bigint[]).map((x) => BigInt(x));
		const decrypted = decryptAuditorPct(auditorPCT, auditorPk);

		const output: Record<string, string> = {
			txHash: TX_HASH,
			event: parsed.name,
			auditorAddress,
			amountBaseUnits: decrypted.amountBaseUnits.toString(),
			decryptedNonce: decrypted.nonce.toString(),
			encryptedERC: ENCRYPTED_ERC_ADDRESS,
			txUrl: `https://testnet.snowtrace.io/tx/${TX_HASH}`,
		};

		if (parsed.name === "PrivateTransfer") {
			output.from = String(parsed.args.from);
			output.to = String(parsed.args.to);
		}
		if (parsed.name === "PrivateMint" || parsed.name === "PrivateBurn") {
			output.user = String(parsed.args.user);
		}
		if (parsed.name === "Withdraw") {
			output.user = String(parsed.args.user);
			output.tokenId = BigInt(parsed.args.tokenId).toString();
			output.withdrawAmountEvent = BigInt(parsed.args.amount).toString();
		}

		console.table(output);
		found = true;
	}

	if (!found) {
		throw new Error(
			`No decryptable private event found in ${TX_HASH} for contract ${ENCRYPTED_ERC_ADDRESS}`,
		);
	}
}

main().catch((error) => {
	console.error(error);
	process.exitCode = 1;
});
