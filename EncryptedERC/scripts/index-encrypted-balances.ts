import { ethers } from "hardhat";
import fs from "node:fs";
import path from "node:path";

const ENCRYPTED_ERC_ADDRESS =
        process.env.ENCRYPTED_ERC_ADDRESS ||
        "0x68eCE3bafEE50cEeae5Da816128b5633C7ed2fdB";
const DEPLOY_BLOCK = Number(process.env.INDEX_FROM_BLOCK || "55414000");
const TO_BLOCK_RAW = process.env.INDEX_TO_BLOCK || "latest";
const TO_BLOCK = TO_BLOCK_RAW === "latest" ? "latest" : Number(TO_BLOCK_RAW);
const CHUNK_SIZE = Number(process.env.INDEX_CHUNK_SIZE || "10");
const OUTPUT_FILE =
        process.env.INDEX_OUTPUT_FILE ||
        path.join(process.cwd(), "data", "encrypted-balance-index.json");
const WATCHED_ADDRESSES = (process.env.WATCHED_ADDRESSES || "")
        .split(",")
        .map((value) => value.trim())
        .filter(Boolean);

const EVENT_ABI = [
        "event PrivateMint(address indexed user, uint256[7] auditorPCT, address indexed auditorAddress)",
        "event PrivateBurn(address indexed user, uint256[7] auditorPCT, address indexed auditorAddress)",
        "event PrivateTransfer(address indexed from, address indexed to, uint256[7] auditorPCT, address indexed auditorAddress)",
        "event Withdraw(address indexed user, uint256 amount, uint256 tokenId, uint256[7] auditorPCT, address indexed auditorAddress)",
];

type IndexedEvent = {
        blockNumber: number;
        blockHash: string;
        txHash: string;
        logIndex: number;
        event: string;
        contract: string;
        from?: string;
        to?: string;
        user?: string;
        tokenId?: string;
        amount?: string;
        auditorAddress: string;
        auditorPCT: string[];
        privatePayloadOnly: true;
};

type BalanceSnapshot = {
        address: string;
        tokenId: string;
        nonce: string;
        transactionIndex: string;
        eGCT: {
                c1: [string, string];
                c2: [string, string];
        };
        balancePCT: [string, string, string, string, string, string, string];
        amountPCTs: Array<{
                pct: [string, string, string, string, string, string, string];
                index: string;
        }>;
        observedAtBlock: number;
};

type IndexFile = {
        contract: string;
        fromBlock: number;
        toBlock: number | string;
        network: string;
        generatedAt: string;
        events: IndexedEvent[];
        balanceSnapshots: BalanceSnapshot[];
};

const normalize = (value: string): string => (value.startsWith("0x") ? value : `0x${value}`);

const toStringArray = (values: readonly bigint[] | readonly string[] | ArrayLike<bigint | string>) =>
        Array.from(values, (value) => value.toString());

async function main() {
        const provider = ethers.provider;
        const network = await provider.getNetwork();
        const latestBlock = await provider.getBlockNumber();
        const iface = new ethers.Interface(EVENT_ABI);
        const contract = ENCRYPTED_ERC_ADDRESS;

        const events: IndexedEvent[] = [];
        const endBlock = TO_BLOCK === "latest" ? latestBlock : TO_BLOCK;

        console.log(`Scanning from ${DEPLOY_BLOCK} to ${endBlock} in chunks of ${CHUNK_SIZE}...`);

        for (let startBlock = DEPLOY_BLOCK; startBlock <= endBlock; startBlock += CHUNK_SIZE) {
                const chunkEnd = Math.min(startBlock + CHUNK_SIZE - 1, endBlock);
                const logs = await provider.getLogs({
                        address: contract,
                        fromBlock: startBlock,
                        toBlock: chunkEnd,
                });

                for (const log of logs) {
                        let parsed: ethers.LogDescription | null = null;
                        try {
                                parsed = iface.parseLog(log);
                        } catch {
                                continue;
                        }

                        if (!parsed) continue;

                        const event: IndexedEvent = {
                                blockNumber: log.blockNumber,
                                blockHash: log.blockHash || "",
                                txHash: log.transactionHash,
                                logIndex: log.index,
                                event: parsed.name,
                                contract,
                                auditorAddress: String(parsed.args.auditorAddress || ""),
                                auditorPCT: toStringArray(parsed.args.auditorPCT || []).map((v) => v.toString()),
                                privatePayloadOnly: true,
                        };

                        if (parsed.name === "PrivateTransfer") {
                                event.from = String(parsed.args.from);
                                event.to = String(parsed.args.to);
                        }
                        if (parsed.name === "PrivateMint" || parsed.name === "PrivateBurn") {
                                event.user = String(parsed.args.user);
                        }
                        if (parsed.name === "Withdraw") {
                                event.user = String(parsed.args.user);
                                event.tokenId = BigInt(parsed.args.tokenId).toString();
                                event.amount = BigInt(parsed.args.amount).toString();
                        }

                        events.push(event);
                }
        }

        const encryptedERC = await ethers.getContractAt("EncryptedERC", contract);
        const balanceSnapshots: BalanceSnapshot[] = [];

        console.log(`Getting snapshots for ${WATCHED_ADDRESSES.length} addresses...`);

        for (const address of WATCHED_ADDRESSES) {
                const balance = await encryptedERC.balanceOfStandalone(address);
                balanceSnapshots.push({
                        address,
                        tokenId: "0",
                        nonce: balance.nonce.toString(),
                        transactionIndex: balance.transactionIndex.toString(),
                        eGCT: {
                                c1: [balance.eGCT.c1.x.toString(), balance.eGCT.c1.y.toString()],
                                c2: [balance.eGCT.c2.x.toString(), balance.eGCT.c2.y.toString()],
                        },
                        balancePCT: balance.balancePCT.map((value: bigint) => value.toString()) as [
                                string,
                                string,
                                string,
                                string,
                                string,
                                string,
                                string,
                        ],
                        amountPCTs: balance.amountPCTs.map((item: { pct: bigint[]; index: bigint }) => ({
                                pct: item.pct.map((value: bigint) => value.toString()) as [
                                        string,
                                        string,
                                        string,
                                        string,
                                        string,
                                        string,
                                        string,
                                ],
                                index: item.index.toString(),
                        })),
                        observedAtBlock: latestBlock,
                });
        }

        const output: IndexFile = {
                contract,
                fromBlock: DEPLOY_BLOCK,
                toBlock: TO_BLOCK,
                network: `chainId:${network.chainId.toString()}`,
                generatedAt: new Date().toISOString(),
                events,
                balanceSnapshots,
        };

        fs.mkdirSync(path.dirname(OUTPUT_FILE), { recursive: true });
        fs.writeFileSync(OUTPUT_FILE, `${JSON.stringify(output, null, 2)}\n`, "utf8");

        console.table({
                contract,
                fromBlock: DEPLOY_BLOCK,
                toBlock: TO_BLOCK,
                events: events.length,
                watchedAddresses: WATCHED_ADDRESSES.length,
                output: OUTPUT_FILE,
        });
}

main().catch((error) => {
        console.error(error);
        process.exitCode = 1;
});
