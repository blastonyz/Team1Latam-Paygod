import { ConnectButton } from "@rainbow-me/rainbowkit";

export function WalletConnectButton() {
  return (
    <ConnectButton.Custom>
      {({
        account,
        chain,
        openAccountModal,
        openChainModal,
        openConnectModal,
        mounted,
      }) => {
        const ready = mounted;
        const connected = ready && account && chain;

        if (!connected) {
          return (
            <button
              onClick={openConnectModal}
              type="button"
              className="inline-flex items-center justify-center border px-3 py-1.5 text-xs font-medium uppercase tracking-[0.08em]"
              style={{ borderColor: "var(--border-strong)", color: "#fff" }}
            >
              Connect Wallet
            </button>
          );
        }

        if (chain.unsupported) {
          return (
            <button
              onClick={openChainModal}
              type="button"
              className="inline-flex items-center justify-center border px-3 py-1.5 text-xs font-medium uppercase tracking-[0.08em]"
              style={{ borderColor: "var(--danger)", color: "var(--danger)" }}
            >
              Wrong Network
            </button>
          );
        }

        return (
          <div className="flex items-center gap-2">
            <button
              onClick={openChainModal}
              type="button"
              className="inline-flex items-center justify-center border px-2.5 py-1 text-[11px] font-medium uppercase tracking-[0.08em]"
              style={{ borderColor: "var(--border)", color: "#aaa" }}
            >
              {chain.name}
            </button>
            <button
              onClick={openAccountModal}
              type="button"
              className="inline-flex items-center justify-center border px-3 py-1.5 text-xs font-medium"
              style={{ borderColor: "var(--border-strong)", color: "#fff" }}
            >
              {account.displayName}
            </button>
          </div>
        );
      }}
    </ConnectButton.Custom>
  );
}
