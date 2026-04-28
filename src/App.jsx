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

// 🔥 Mobile Wallet Adapter
import { SolanaMobileWalletAdapter } from "@solana-mobile/wallet-adapter-mobile";

import "@solana/wallet-adapter-react-ui/styles.css";

export default function App() {

  const network = "devnet";

  const endpoint = useMemo(
    () => clusterApiUrl(network),
    [network]
  );

  const wallets = useMemo(
    () => [
      new SolanaMobileWalletAdapter({
        appIdentity: {
          name: "SOL Store",
          uri: window.location.origin,
        },
        authorizationResultCache: undefined,
      })
    ],
    []
  );

  return (
    <ConnectionProvider endpoint={endpoint}>
      <WalletProvider wallets={wallets} autoConnect={true}>
        <WalletModalProvider>

          <div style={{
            minHeight: "100vh",
            background: "linear-gradient(135deg,#0f0c29,#302b63,#24243e)",
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            alignItems: "center",
            color: "white"
          }}>

            <h1>🦄 SOL Store</h1>

            {/* 🔥 زر الاتصال الذكي */}
            <WalletMultiButton />

            <p style={{ marginTop: 20 }}>
              متصل بمحفظة Solana عبر Mobile Wallet Adapter
            </p>

          </div>

        </WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  );
}