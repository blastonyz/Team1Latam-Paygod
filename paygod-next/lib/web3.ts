import { getDefaultConfig } from "@rainbow-me/rainbowkit";
import { avalancheFuji } from "wagmi/chains";

export const walletConnectProjectId =
  process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || "demo-project-id";

export const avaxRpcUrl =
  process.env.NEXT_PUBLIC_AVA_RPC_URL ||
  "https://api.avax-test.network/ext/bc/C/rpc";

export const encryptedErcAddress =
  (process.env.NEXT_PUBLIC_ENCRYPTED_ERC_ADDRESS ||
    "0x68eCE3bafEE50cEeae5Da816128b5633C7ed2fdB") as `0x${string}`;

export const genericTokenAddress =
  (process.env.NEXT_PUBLIC_GENERIC_TOKEN_ADDRESS ||
    "0x0000000000000000000000000000000000000000") as `0x${string}`;

export const wagmiConfig = getDefaultConfig({
  appName: "Paygod",
  projectId: walletConnectProjectId,
  chains: [
    {
      ...avalancheFuji,
      rpcUrls: {
        ...avalancheFuji.rpcUrls,
        default: { http: [avaxRpcUrl] },
        public: { http: [avaxRpcUrl] },
      },
    },
  ],
  ssr: true,
});
