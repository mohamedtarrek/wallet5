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

// Phantom wallet adapter for desktop
import { PhantomWalletAdapter } from "@solana/wallet-adapter-phantom";

// Mobile wallet adapter for mobile dApp browsing
import { SolanaMobileWalletAdapter } from "@solana-mobile/wallet-adapter-mobile";

import "@solana/wallet-adapter-react-ui/styles.css";

export default function App() {
  const network = "devnet";

  const endpoint = useMemo(() => clusterApiUrl(network), [network]);

  // Must have at least one wallet adapter — Phantom for desktop, Mobile for in-app browsers
  const wallets = useMemo(
    () => [
      new PhantomWalletAdapter(),
      SolanaMobileWalletAdapter,
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
