import { useWallet } from "@solana/wallet-adapter-react";
import { Connection, SystemProgram, Transaction, PublicKey } from "@solana/web3.js";

export default function PayButton() {

    const { publicKey, sendTransaction } = useWallet();

    const pay = async () => {

        if (!publicKey) return alert("Connect wallet first");

        const connection = new Connection("https://api.devnet.solana.com");

        const tx = new Transaction().add(
            SystemProgram.transfer({
                fromPubkey: publicKey,
                toPubkey: new PublicKey("DjDZfRk6rNpkgVMyjWjQab6dbXo5BVpLvQmzMvM7tP7u"),
                lamports: 0.05 * 1e9
            })
        );

        const sig = await sendTransaction(tx, connection);

        await connection.confirmTransaction(sig, "confirmed");

        alert("Payment successful: " + sig);
    };

    return (
        <button onClick={pay} style={{
            padding: "12px 20px",
            marginTop: 20,
            borderRadius: 20,
            border: "none",
            background: "#14F195",
            color: "#000",
            fontWeight: "bold"
        }}>
            💸 Pay 0.05 SOL
        </button>
    );
}
