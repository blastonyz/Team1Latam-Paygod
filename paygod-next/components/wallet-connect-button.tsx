"use client";

import { ConnectButton } from "@rainbow-me/rainbowkit";

export function WalletConnectButton() {
  return (
    <ConnectButton.Custom>
      {({ account, chain, openAccountModal, openChainModal, openConnectModal, mounted }) => {
        const ready = mounted;
        const connected = ready && account && chain;

        if (!connected) {
          return (
            <button
              onClick={openConnectModal}
              type="button"
              style={{ border: "1px solid rgba(255,255,255,0.2)", padding: "8px 12px", background: "transparent", color: "white", fontSize: 12 }}
            >
              Connect Wallet
            </button>
          );
        }

        if (chain.unsupported) {
          return (
            <button onClick={openChainModal} type="button" style={{ border: "1px solid #ED3134", padding: "8px 12px", background: "transparent", color: "#ED3134", fontSize: 12 }}>
              Wrong Network
            </button>
          );
        }

        return (
          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={openChainModal} type="button" style={{ border: "1px solid rgba(255,255,255,0.15)", padding: "8px 10px", background: "transparent", color: "#aaa", fontSize: 11 }}>
              {chain.name}
            </button>
            <button onClick={openAccountModal} type="button" style={{ border: "1px solid rgba(255,255,255,0.25)", padding: "8px 12px", background: "transparent", color: "white", fontSize: 12 }}>
              {account.displayName}
            </button>
          </div>
        );
      }}
    </ConnectButton.Custom>
  );
}
