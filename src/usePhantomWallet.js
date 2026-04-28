import { useState, useEffect, useCallback } from "react";

/**
 * Phantom Wallet Hook (Stable Version)
 * - يعمل على Desktop + Mobile (Chrome)
 * - يعتمد على Wallet Standard (بدون deep link)
 * - يحل مشكلة: Phantom يفتح ويقفل
 */

export function usePhantomWallet() {
  const [publicKey, setPublicKey] = useState(null);
  const [connected, setConnected] = useState(false);
  const [connecting, setConnecting] = useState(false);

  // 🔍 Detect mobile
  const isMobile =
    typeof navigator !== "undefined" &&
    /android|iphone|ipad|ipod/i.test(navigator.userAgent);

  // 🔥 Restore session بعد الرجوع من Phantom
  useEffect(() => {
    const checkConnection = async () => {
      if (window.solana?.isPhantom) {
        try {
          if (window.solana.isConnected) {
            const key = window.solana.publicKey?.toString();
            if (key) {
              setPublicKey(key);
              setConnected(true);
              console.log("✅ Restored session:", key);
            }
          }
        } catch (err) {
          console.error("Restore error:", err);
        }
      }
    };

    checkConnection();
  }, []);

  // 🎧 Listen للأحداث
  useEffect(() => {
    if (!window.solana) return;

    const handleConnect = () => {
      const key = window.solana.publicKey?.toString();
      console.log("🟢 Connected event:", key);
      setPublicKey(key);
      setConnected(true);
    };

    const handleDisconnect = () => {
      console.log("🔴 Disconnected");
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

  // 🔗 Connect (Mobile + Desktop)
  const connect = useCallback(async () => {
    if (connecting) return;

    if (!window.solana?.isPhantom) {
      alert("❌ Phantom wallet not found. Install it first.");
      return;
    }

    try {
      console.log("🚀 Connecting...");

      setConnecting(true);

      // 🔥 أهم سطر (يحل مشكلة الموبايل)
      const resp = await window.solana.connect();

      const key = resp.publicKey.toString();

      setPublicKey(key);
      setConnected(true);

      console.log("✅ Connected:", key);
    } catch (err) {
      console.error("❌ Connection error:", err);

      if (err?.message?.includes("User rejected")) {
        console.log("⚠️ User rejected connection");
      }
    } finally {
      setConnecting(false);
    }
  }, [connecting]);

  // 🔌 Disconnect
  const disconnect = useCallback(async () => {
    try {
      await window.solana?.disconnect();
      setConnected(false);
      setPublicKey(null);
    } catch (err) {
      console.error("Disconnect error:", err);
    }
  }, []);

  return {
    publicKey,
    connected,
    connecting,
    isMobile,
    connect,
    disconnect,
  };
}