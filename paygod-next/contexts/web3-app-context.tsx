"use client";

import { createContext, useContext, useMemo } from "react";
import { useAccount, useChainId } from "wagmi";
import { avaxRpcUrl, encryptedErcAddress, genericTokenAddress, walletConnectProjectId } from "@/lib/web3";

type Web3AppContextValue = {
  walletConnectProjectId: string;
  rpcUrl: string;
  encryptedErcAddress: `0x${string}`;
  genericTokenAddress: `0x${string}`;
  chainId: number;
  connectedAddress?: `0x${string}`;
  isConnected: boolean;
};

const Web3AppContext = createContext<Web3AppContextValue | null>(null);

export function Web3AppProvider({ children }: { children: React.ReactNode }) {
  const { address, isConnected } = useAccount();
  const activeChainId = useChainId();

  const value = useMemo<Web3AppContextValue>(
    () => ({
      walletConnectProjectId,
      rpcUrl: avaxRpcUrl,
      encryptedErcAddress,
      genericTokenAddress,
      chainId: activeChainId,
      connectedAddress: address,
      isConnected,
    }),
    [activeChainId, address, isConnected],
  );

  return <Web3AppContext.Provider value={value}>{children}</Web3AppContext.Provider>;
}

export function useWeb3App() {
  const context = useContext(Web3AppContext);
  if (!context) throw new Error("useWeb3App must be used inside Web3AppProvider");
  return context;
}
