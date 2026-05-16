import { NextRequest, NextResponse } from "next/server";
import { createPublicClient, http, parseAbiItem } from "viem";
import { avalancheFuji } from "viem/chains";

const ENCRYPTED_ERC_ADDRESS =
  (process.env.ENCRYPTED_ERC_ADDRESS ||
    "0x68eCE3bafEE50cEeae5Da816128b5633C7ed2fdB") as `0x${string}`;

const rpcUrl =
  process.env.NEXT_PUBLIC_AVA_RPC_URL ||
  process.env.AVA_RPC_URL ||
  "https://api.avax-test.network/ext/bc/C/rpc";

const publicClient = createPublicClient({
  chain: avalancheFuji,
  transport: http(rpcUrl),
});

const privateTransferEvent = parseAbiItem(
  "event PrivateTransfer(address indexed from, address indexed to, uint256[7] auditorPCT, address indexed auditorAddress)",
);

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}));
  const fromBlock = BigInt(body.fromBlock ?? 0);
  const toBlock = body.toBlock === "latest" || body.toBlock == null ? "latest" : BigInt(body.toBlock);

  const logs = await publicClient.getLogs({
    address: ENCRYPTED_ERC_ADDRESS,
    event: privateTransferEvent,
    fromBlock,
    toBlock,
  });

  return NextResponse.json({
    ok: true,
    count: logs.length,
    sample: logs.slice(0, 5).map((l) => ({ txHash: l.transactionHash, blockNumber: l.blockNumber?.toString() })),
  });
}
