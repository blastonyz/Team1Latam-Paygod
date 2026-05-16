import { getDefaultConfig } from "@rainbow-me/rainbowkit";
import { avalancheFuji } from "wagmi/chains";

const walletConnectProjectId =
  process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || "demo-project-id";

const avaxRpcUrl =
  process.env.NEXT_PUBLIC_AVA_RPC_URL ||
  "https://api.avax-test.network/ext/bc/C/rpc";

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
