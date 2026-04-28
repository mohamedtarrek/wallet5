import { useState, useEffect, useCallback } from "react";

/**
 * Custom Phantom wallet hook - avoids wallet-adapter conflicts
 * Mobile: Uses Phantom deep link → app → redirect back
 * Desktop: Uses window.solana directly
 */
export function usePhantomWallet() {
  const [publicKey, setPublicKey] = useState(null);
  const [connected, setConnected] = useState(false);
  const [connecting, setConnecting] = useState(false);

  // Check if Phantom is available
  const isPhantomInstalled = typeof window !== "undefined" && window.solana?.isPhantom;

  // Detect mobile device
  const isMobile = /android|iphone|ipad|ipod/i.test(navigator.userAgent);

  // Restore connection on page load (handles redirect back)
  useEffect(() => {
    const checkConnection = async () => {
      if (window.solana?.isPhantom && window.solana.isConnected) {
        setConnected(true);
        setPublicKey(window.solana.publicKey.toString());
        console.log("Wallet restored:", window.solana.publicKey.toString());
      }
    };

    checkConnection();
  }, []);

  // Listen for connection changes
  useEffect(() => {
    if (window.solana?.on) {
      const handleConnect = () => {
        setConnected(true);
        setPublicKey(window.solana.publicKey?.toString() || null);
      };

      const handleDisconnect = () => {
        setConnected(false);
        setPublicKey(null);
      };

      window.solana.on("connect", handleConnect);
      window.solana.on("disconnect", handleDisconnect);

      return () => {
        window.solana.off("connect", handleConnect);
        window.solana.off("disconnect", handleDisconnect);
      };
    }
  }, []);

  // Mobile: Open Phantom app via deep link
  const connectMobile = useCallback(() => {
    const appUrl = encodeURIComponent(window.location.href);
    const redirectUrl = encodeURIComponent(window.location.href);

    const deepLink =
      `https://phantom.app/ul/v1/connect?app_url=${appUrl}&redirect_link=${redirectUrl}`;

    window.location.href = deepLink;
  }, []);

  // Desktop: Connect via Phantom extension
  const connectDesktop = useCallback(async () => {
    if (!window.solana?.isPhantom) {
      alert("Phantom extension not found. Please install it from phantom.app");
      return;
    }

    try {
      setConnecting(true);
      const resp = await window.solana.connect();
      setPublicKey(resp.publicKey.toString());
      setConnected(true);
      console.log("Connected:", resp.publicKey.toString());
    } catch (err) {
      console.error("Connection error:", err);
      if (err.message?.includes("User rejected")) {
        console.log("User rejected connection");
      }
    } finally {
      setConnecting(false);
    }
  }, []);

  // Disconnect
  const disconnect = useCallback(async () => {
    if (window.solana?.disconnect) {
      await window.solana.disconnect();
      setConnected(false);
      setPublicKey(null);
    }
  }, []);

  // Auto-connect based on device type
  const connect = useCallback(async () => {
    if (isMobile) {
      connectMobile();
    } else {
      await connectDesktop();
    }
  }, [isMobile, connectMobile, connectDesktop]);

  return {
    publicKey,
    connected,
    connecting,
    isPhantomInstalled,
    isMobile,
    connect,
    disconnect,
  };
}