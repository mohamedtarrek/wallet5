import { useState, useEffect, useCallback } from "react";
import { transact } from "@solana-mobile/mobile-wallet-adapter-protocol";

/**
 * Solana Wallet Hook (Mobile + Desktop)
 * - Mobile: transact from @solana-mobile/mobile-wallet-adapter-protocol
 * - Desktop: window.solana (Wallet Standard)
 */
export function useSolanaWallet() {
  const [publicKey, setPublicKey] = useState(null);
  const [connected, setConnected] = useState(false);
  const [connecting, setConnecting] = useState(false);

  const isMobile =
    typeof navigator !== "undefined" &&
    /android|iphone|ipad|ipod/i.test(navigator.userAgent);

  // Restore session after Phantom redirect (desktop)
  useEffect(() => {
    const checkConnection = async () => {
      try {
        if (window.solana?.isPhantom && window.solana.isConnected) {
          const key = window.solana.publicKey?.toString();
          if (key) {
            setPublicKey(key);
            setConnected(true);
            console.log("[WALLET] Session restored:", key);
          }
        }
      } catch (err) {
        console.error("[WALLET] Restore error:", err);
      }
    };
    checkConnection();
  }, []);

  // Listen to desktop connection events
  useEffect(() => {
    if (!window.solana?.on) return;

    const handleConnect = () => {
      const key = window.solana.publicKey?.toString();
      console.log("[WALLET] Connected:", key);
      setPublicKey(key);
      setConnected(true);
    };

    const handleDisconnect = () => {
      console.log("[WALLET] Disconnected");
      setPublicKey(null);
      setConnected(false);
    };

    window.solana.on("connect", handleConnect);
    window.solana.on("disconnect", handleDisconnect);

    return () => {
      window.solana.off("connect", handleConnect);
      window.solana.off("disconnect", handleDisconnect);
    };
  }, []);

  // Mobile connect using transact from protocol
  const connectMobile = useCallback(async () => {
    console.log("[WALLET] Mobile connect via transact...");

    try {
      await transact(async (wallet) => {
        console.log("[WALLET] Transact callback started");

        const accounts = await wallet.authorize({
          cluster: "devnet",
          identity: {
            name: "SOL Store",
            uri: window.location.origin,
          },
        });

        if (!accounts || accounts.length === 0) {
          throw new Error("No accounts returned");
        }

        const publicKeyStr = accounts[0].address.toString();

        console.log("[WALLET] Authorized:", publicKeyStr);

        setPublicKey(publicKeyStr);
        setConnected(true);
      });
    } catch (err) {
      console.error("[WALLET] Mobile connect error:", err);

      if (err?.message?.includes("User rejected") ||
          err?.message?.includes("cancelled") ||
          err?.message?.includes("cancelled")) {
        console.log("[WALLET] User rejected or cancelled");
      }
      throw err;
    }
  }, []);

  // Desktop connect via window.solana
  const connectDesktop = useCallback(async () => {
    if (!window.solana?.isPhantom) {
      alert("Phantom extension not found. Please install it from phantom.app");
      return;
    }

    console.log("[WALLET] Desktop connect via extension...");

    try {
      const resp = await window.solana.connect();
      const key = resp.publicKey.toString();

      setPublicKey(key);
      setConnected(true);

      console.log("[WALLET] Desktop connected:", key);
    } catch (err) {
      console.error("[WALLET] Desktop error:", err);
      throw err;
    }
  }, []);

  // Unified connect
  const connect = useCallback(async () => {
    if (connecting) {
      console.log("[WALLET] Already connecting...");
      return;
    }

    try {
      setConnecting(true);
      console.log("[WALLET] Connect requested", { isMobile });

      if (isMobile) {
        await connectMobile();
      } else {
        await connectDesktop();
      }
    } finally {
      setConnecting(false);
    }
  }, [connecting, isMobile, connectMobile, connectDesktop]);

  // Disconnect
  const disconnect = useCallback(async () => {
    try {
      if (isMobile) {
        await transact(async (wallet) => {
          await wallet.deauthorize();
        });
      } else {
        await window.solana?.disconnect();
      }
      setConnected(false);
      setPublicKey(null);
      console.log("[WALLET] Disconnected");
    } catch (err) {
      console.error("[WALLET] Disconnect error:", err);
    }
  }, [isMobile]);

  return {
    publicKey,
    connected,
    connecting,
    isMobile,
    connect,
    disconnect,
  };
}