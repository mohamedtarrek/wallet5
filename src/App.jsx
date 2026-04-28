import React, { useMemo } from "react";

import {
  ConnectionProvider,
  WalletProvider
} from "@solana/wallet-adapter-react";

import {
  WalletModalProvider,
  WalletMultiButton
} from "@solana/wallet-adapter-react-ui";

import { clusterApiUrl } from "@solana/web3.js";

// Wallet Standard - handles Phantom desktop extension + mobile deep linking
import {
  PhantomWalletAdapter,
  SolflareWalletAdapter,
} from "@solana/wallet-adapter-wallets";

// Wallet Standard uses event emitter (t.on) pattern - compatible with 2026 wallets
import { useWalletModal } from "@solana/wallet-adapter-react-ui";

import "@solana/wallet-adapter-react-ui/styles.css";

export default function App() {
  const network = "devnet";
  const endpoint = useMemo(() => clusterApiUrl(network), [network]);

  // Wallet Standard adapters - no deprecated event emitter conflicts
  const wallets = useMemo(
    () => [
      new PhantomWalletAdapter(),
      new SolflareWalletAdapter(),
    ],
    []
  );

  return (
    <ConnectionProvider endpoint={endpoint}>
      <WalletProvider wallets={wallets} autoConnect={false}>
        <WalletModalProvider>
          <div
            style={{
              minHeight: "100vh",
              background: "linear-gradient(135deg,#0f0c29,#302b63,#24243e)",
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
              alignItems: "center",
              color: "white",
            }}
          >
            <h1>SOL Store</h1>
            <WalletMultiButton />
            <p style={{ marginTop: 20 }}>
              Connect your Solana wallet
            </p>
          </div>
        </WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  );
}
