import React from "react";
import { usePhantomWallet } from "./usePhantomWallet";

export default function App() {
  const {
    publicKey,
    connected,
    connecting,
    isMobile,
    connect,
    disconnect,
  } = usePhantomWallet();

  const truncatedKey = publicKey
    ? `${publicKey.slice(0, 4)}...${publicKey.slice(-4)}`
    : null;

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "linear-gradient(135deg,#0f0c29,#302b63,#24243e)",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        color: "white",
        fontFamily: "system-ui, sans-serif",
      }}
    >
      <h1 style={{ fontSize: "2.5rem", marginBottom: "2rem" }}>SOL Store</h1>

      {/* Connection Status */}
      {connected && publicKey ? (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "1rem",
          }}
        >
          <div
            style={{
              padding: "0.75rem 1.5rem",
              background: "rgba(255,255,255,0.1)",
              borderRadius: "12px",
              fontFamily: "monospace",
            }}
          >
            {truncatedKey}
          </div>
          <button
            onClick={disconnect}
            style={{
              padding: "0.75rem 1.5rem",
              background: "#e53935",
              border: "none",
              borderRadius: "8px",
              color: "white",
              cursor: "pointer",
              fontSize: "1rem",
            }}
          >
            Disconnect
          </button>
        </div>
      ) : (
        <button
          onClick={connect}
          disabled={connecting}
          style={{
            padding: "1rem 2rem",
            background: connecting ? "#666" : "#5350d4",
            border: "none",
            borderRadius: "12px",
            color: "white",
            fontSize: "1.2rem",
            cursor: connecting ? "not-allowed" : "pointer",
            display: "flex",
            alignItems: "center",
            gap: "0.5rem",
          }}
        >
          {connecting ? (
            <>
              <span
                style={{
                  display: "inline-block",
                  width: "20px",
                  height: "20px",
                  border: "2px solid white",
                  borderTopColor: "transparent",
                  borderRadius: "50%",
                  animation: "spin 1s linear infinite",
                }}
              />
              Connecting...
            </>
          ) : (
            "Connect Wallet"
          )}
        </button>
      )}

      {/* Device indicator */}
      {connected && (
        <p style={{ marginTop: "1rem", opacity: 0.7, fontSize: "0.9rem" }}>
          {isMobile ? "Mobile" : "Desktop"} • Connected via Phantom
        </p>
      )}

      {!connected && (
        <p style={{ marginTop: "2rem", opacity: 0.7, textAlign: "center" }}>
          {isMobile
            ? "Opens Phantom app on mobile"
            : "Connects Phantom extension on desktop"}
        </p>
      )}

      {/* Spin animation */}
      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}