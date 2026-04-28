import { useState, useEffect, useCallback } from "react";

/**
 * Phantom Wallet Hook (Mobile + Desktop)
 * - Desktop: window.solana
 * - Mobile: Phantom deep link (fallback)
 */

export function usePhantomWallet() {
  const [publicKey, setPublicKey] = useState(null);
  const [connected, setConnected] = useState(false);
  const [connecting, setConnecting] = useState(false);

  // 📱 Detect mobile
  const isMobile =
    typeof navigator !== "undefined" &&
    /android|iphone|ipad|ipod/i.test(navigator.userAgent);

  // 🔍 Check if Phantom exists (desktop only)
  const isPhantomInstalled =
    typeof window !== "undefined" && window.solana?.isPhantom;

  // 🔥 Restore session after returning from Phantom
  useEffect(() => {
    const checkConnection = async () => {
      try {
        if (window.solana?.isPhantom && window.solana.isConnected) {
          const key = window.solana.publicKey?.toString();

          if (key) {
            setPublicKey(key);
            setConnected(true);
            console.log("✅ Restored session:", key);
          }
        } else {
          console.log("ℹ️ No active session");
        }
      } catch (err) {
        console.error("❌ Restore error:", err);
      }
    };

    checkConnection();
  }, []);

  // 🎧 Listen to events (desktop only)
  useEffect(() => {
    if (!window.solana?.on) return;

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

  // 📱 Mobile deep link
  const openPhantomMobile = () => {
    const url = window.location.href;

    const deepLink =
      `https://phantom.app/ul/v1/connect?app_url=${encodeURIComponent(
        url
      )}&redirect_link=${encodeURIComponent(url)}`;

    console.log("📱 Opening Phantom:", deepLink);

    window.location.href = deepLink;
  };

  // 🔗 Connect
  const connect = useCallback(async () => {
    if (connecting) {
      console.log("⛔ Already connecting...");
      return;
    }

    try {
      setConnecting(true);

      // 📱 Mobile (no window.solana)
      if (isMobile && !window.solana) {
        console.log("📱 Mobile detected → using deep link");
        openPhantomMobile();
        return;
      }

      // 💻 Desktop
      if (!window.solana?.isPhantom) {
        alert("❌ Phantom extension not found. Install it first.");
        return;
      }

      console.log("🚀 Connecting via extension...");

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
  }, [connecting, isMobile]);

  // 🔌 Disconnect
  const disconnect = useCallback(async () => {
    try {
      await window.solana?.disconnect();
      setConnected(false);
      setPublicKey(null);
      console.log("🔴 Disconnected");
    } catch (err) {
      console.error("Disconnect error:", err);
    }
  }, []);

  return {
    publicKey,
    connected,
    connecting,
    isMobile,
    isPhantomInstalled,
    connect,
    disconnect,
  };
}