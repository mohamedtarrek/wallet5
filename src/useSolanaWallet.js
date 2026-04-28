import { useState, useEffect, useCallback } from "react";
import { transact } from "@solana-mobile/mobile-wallet-adapter-protocol";

const STORAGE_KEY = "wallet_public_key";

/**
 * Solana Wallet Hook (Mobile + Desktop)
 * - Mobile: transact from @solana-mobile/mobile-wallet-adapter-protocol
 * - Desktop: window.solana (Wallet Standard)
 * - Verifies real Phantom connection before trusting localStorage
 */
export function useSolanaWallet() {
  const [publicKey, setPublicKey] = useState(null);
  const [connected, setConnected] = useState(false);
  const [connecting, setConnecting] = useState(false);

  const isMobile =
    typeof navigator !== "undefined" &&
    /android|iphone|ipad|ipod/i.test(navigator.userAgent);

  // Restore session on app load
  useEffect(() => {
    const verifyAndRestore = async () => {
      console.log("[WALLET] Verifying connection state...");

      // STEP 1: Check REAL Phantom connection (highest priority)
      if (window.solana?.isPhantom) {
        console.log("[WALLET] Phantom detected, checking connection status...");

        if (window.solana.isConnected && window.solana.publicKey) {
          const key = window.solana.publicKey.toString();

          if (key && key !== "null" && key !== "undefined") {
            console.log("[WALLET] ✅ REAL WALLET CONNECTED:", key);
            setPublicKey(key);
            setConnected(true);
            localStorage.setItem(STORAGE_KEY, key);
            console.log("[WALLET] ✅ RESTORED FROM PHANTOM");
            return;
          } else {
            console.log("[WALLET] Phantom connected but no publicKey yet");
          }
        } else {
          console.log("[WALLET] Phantom not connected or no publicKey");
        }
      } else {
        console.log("[WALLET] Phantom not installed");
      }

      // STEP 2: Fallback to localStorage (only if Phantom not connected)
      const storedKey = localStorage.getItem(STORAGE_KEY);

      if (storedKey) {
        console.log("[WALLET] Checking localStorage fallback...");

        // Verify stored key is valid
        if (storedKey && storedKey !== "null" && storedKey !== "undefined" && storedKey.length > 30) {
          console.log("[WALLET] 📦 RESTORED FROM STORAGE:", storedKey);
          setPublicKey(storedKey);
          setConnected(true);
        } else {
          console.log("[WALLET] Invalid stored key, clearing...");
          localStorage.removeItem(STORAGE_KEY);
        }
      } else {
        console.log("[WALLET] No stored session found");
      }
    };

    // Small delay to ensure Phantom is fully initialized
    setTimeout(verifyAndRestore, 100);
  }, []);

  // Persist helper
  const persistKey = useCallback((key) => {
    localStorage.setItem(STORAGE_KEY, key);
    setPublicKey(key);
    setConnected(true);
    console.log("[WALLET] Persisted:", key);
  }, []);

  const clearKey = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    setPublicKey(null);
    setConnected(false);
  }, []);

  // Mobile connect using transact
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

        console.log("[WALLET] ✅ MOBILE AUTHORIZED:", publicKeyStr);

        persistKey(publicKeyStr);
      });
    } catch (err) {
      console.error("[WALLET] Mobile connect error:", err);

      if (err?.message?.includes("User rejected") ||
          err?.message?.includes("cancelled")) {
        console.log("[WALLET] User rejected or cancelled");
      }
      throw err;
    }
  }, [persistKey]);

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
      localStorage.setItem(STORAGE_KEY, key);

      console.log("[WALLET] ✅ DESKTOP CONNECTED:", key);
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
      console.log("[WALLET] Disconnected");
    } catch (err) {
      console.error("[WALLET] Disconnect error:", err);
    } finally {
      clearKey();
    }
  }, [isMobile, clearKey]);

  return {
    publicKey,
    connected,
    connecting,
    isMobile,
    connect,
    disconnect,
  };
}