"use client";

import "@rainbow-me/rainbowkit/styles.css";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { RainbowKitProvider, darkTheme } from "@rainbow-me/rainbowkit";
import { WagmiProvider } from "wagmi";
import { useState } from "react";
import { wagmiConfig } from "@/lib/web3";
import { Web3AppProvider } from "@/contexts/web3-app-context";

export default function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient());

  return (
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        <Web3AppProvider>
          <RainbowKitProvider
            theme={darkTheme({
              accentColor: "#ED3134",
              accentColorForeground: "#ffffff",
              borderRadius: "none",
            })}
          >
            {children}
          </RainbowKitProvider>
        </Web3AppProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
