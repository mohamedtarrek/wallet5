import { useWallet, useConnection } from "@solana/wallet-adapter-react";
import { SystemProgram, Transaction, PublicKey } from "@solana/web3.js";

export default function PayButton() {
  const { publicKey, sendTransaction } = useWallet();
  const { connection } = useConnection();

  const pay = async () => {
    if (!publicKey) return alert("Connect wallet first");

    const tx = new Transaction().add(
      SystemProgram.transfer({
        fromPubkey: publicKey,
        toPubkey: new PublicKey("DjDZfRk6rNpkgVMyjWQab6dbXo5BVpLvQmzMvM7tP7u"),
        lamports: 0.05 * 1e9,
      })
    );

    try {
      const sig = await sendTransaction(tx, connection);
      await connection.confirmTransaction(sig, "confirmed");
      alert("Payment successful: " + sig);
    } catch (err) {
      console.error("Transaction failed:", err);
      alert("Transaction failed: " + err.message);
    }
  };

  return (
    <button
      onClick={pay}
      style={{
        padding: "12px 20px",
        marginTop: 20,
        borderRadius: 20,
        border: "none",
        background: "#14F195",
        color: "#000",
        fontWeight: "bold",
        cursor: "pointer",
      }}
    >
      Pay 0.05 SOL
    </button>
  );
}
