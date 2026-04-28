import { useState, useEffect, useCallback, useRef } from "react";
import { transact } from "@solana-mobile/mobile-wallet-adapter-protocol";
import { Connection } from "@solana/web3.js";

const STORAGE_KEY = "wallet_public_key";
const DEVNET_ENDPOINT = "https://api.devnet.solana.com";

/**
 * Solana Wallet Hook (Mobile + Desktop)
 * - Mobile: transact from @solana-mobile/mobile-wallet-adapter-protocol
 * - Desktop: window.solana (Wallet Standard)
 * - Uses event-based sync + session verification
 * - WebSocket connection for on-chain state monitoring (balance tracking)
 */
export function useSolanaWallet() {
  const [publicKey, setPublicKey] = useState(null);
  const [connected, setConnected] = useState(false);
  const [connecting, setConnecting] = useState(false);

  // WebSocket connection for on-chain state (balance changes)
  const connectionRef = useRef(null);

  const isMobile =
    typeof navigator !== "undefined" &&
    /android|iphone|ipad|ipod/i.test(navigator.userAgent);

  // Initialize WebSocket connection for on-chain monitoring
  useEffect(() => {
    if (!publicKey) return;

    // Create connection with WebSocket for real-time updates
    const connection = new Connection(DEVNET_ENDPOINT, {
      commitment: "confirmed",
      wsEndpoint: DEVNET_ENDPOINT.replace("https", "wss"),
    });

    connectionRef.current = connection;

    console.log("[WALLET] WebSocket connection established for", publicKey);

    // Subscribe to account changes (balance, token updates)
    const subscriptionId = connection.onAccountChange(
      publicKey,
      (accountInfo) => {
        console.log("[WALLET] 🔄 On-chain account update received");
        // Balance/data changed - can trigger UI update if needed
        // This is for blockchain data, NOT connection state
      },
      "confirmed"
    );

    return () => {
      connection.removeAccountChangeListener(subscriptionId);
      connectionRef.current = null;
    };
  }, [publicKey]);

  // Restore session on app load
  useEffect(() => {
    const verifySession = async () => {
      console.log("[WALLET] Verifying session...");

      // STEP 1: Check real Phantom (desktop only)
      if (window.solana?.isPhantom) {
        if (window.solana.isConnected && window.solana.publicKey) {
          const key = window.solana.publicKey.toString();
          if (key && key !== "null") {
            console.log("[WALLET] ✅ REAL WALLET CONNECTED:", key);
            setPublicKey(key);
            setConnected(true);
            localStorage.setItem(STORAGE_KEY, key);
            return;
          }
        }
      }

      // STEP 2: Verify stored session against Phantom
      const storedKey = localStorage.getItem(STORAGE_KEY);
      if (storedKey && storedKey !== "null" && storedKey.length > 30) {
        // For mobile, stored key is valid after transact() succeeded
        console.log("[WALLET] ✅ RESTORED FROM STORAGE:", storedKey);
        setPublicKey(storedKey);
        setConnected(true);
      }
    };

    // Small delay for Phantom to initialize
    setTimeout(verifySession, 150);
  }, []);

  // Sync with Phantom events (desktop)
  useEffect(() => {
    if (!window.solana?.on) return;

    const handleConnect = () => {
      const key = window.solana.publicKey?.toString();
      if (key) {
        console.log("[WALLET] 🟢 Phantom connected:", key);
        setPublicKey(key);
        setConnected(true);
        localStorage.setItem(STORAGE_KEY, key);
      }
    };

    const handleDisconnect = () => {
      console.log("[WALLET] 🔴 Phantom disconnected");
      localStorage.removeItem(STORAGE_KEY);
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

  // Quick session verification (non-polling)
  const verifySession = useCallback(async () => {
    if (!window.solana?.isPhantom) return false;

    try {
      // Use onlyIfTrusted to check without showing popup
      const resp = await window.solana.connect({ onlyIfTrusted: true });
      if (resp?.publicKey) {
        const key = resp.publicKey.toString();
        setPublicKey(key);
        setConnected(true);
        return true;
      }
    } catch (e) {
      // No trusted session exists
    }
    return false;
  }, []);

  // Persist helper
  const persistKey = useCallback((key) => {
    localStorage.setItem(STORAGE_KEY, key);
    setPublicKey(key);
    setConnected(true);
    console.log("[WALLET] 💾 Persisted:", key);
  }, []);

  const clearKey = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    setPublicKey(null);
    setConnected(false);
  }, []);

  // Mobile connect via transact
  const connectMobile = useCallback(async () => {
    console.log("[WALLET] 📱 Mobile connect initiated...");

    try {
      await transact(async (wallet) => {
        console.log("[WALLET] Transact callback executing...");

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
      console.error("[WALLET] Mobile error:", err);

      if (err?.message?.includes("User rejected") ||
          err?.message?.includes("cancelled")) {
        console.log("[WALLET] User cancelled");
      }
      throw err;
    }
  }, [persistKey]);

  // Desktop connect
  const connectDesktop = useCallback(async () => {
    if (!window.solana?.isPhantom) {
      alert("Install Phantom from phantom.app");
      return;
    }

    console.log("[WALLET] 💻 Desktop connect...");

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
    if (connecting) return;

    try {
      setConnecting(true);
      console.log("[WALLET] Connect request", { isMobile });

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
    verifySession, // Expose for manual verification if needed
  };
}