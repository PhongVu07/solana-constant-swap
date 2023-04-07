import React, { useEffect, useState } from "react";
import { Connection, PublicKey } from "@solana/web3.js";
import { Program, Provider, web3 } from "@project-serum/anchor";
import { PhantomWalletAdapter } from "@solana/wallet-adapter-wallets";
import {
  useWallet,
  WalletProvider,
  ConnectionProvider,
} from "@solana/wallet-adapter-react";
import {
  WalletModalProvider,
  WalletMultiButton,
} from "@solana/wallet-adapter-react-ui";

import idl from "./constant-swap/constant_swap.json";
import { fetchPools } from "./utils";
import CreatePoolForm from "./components/CreatePoolForm";
import PoolCard from "./components/PoolCard";

require("@solana/wallet-adapter-react-ui/styles.css");

const wallets = [new PhantomWalletAdapter()];
const { SystemProgram, Keypair } = web3;

function App() {
  const [pools, setPools] = useState<any[]>([]);
  const wallet = useWallet();

  const handleGetPools = async () => {
    if (wallet.connected) {
      const poolsData = await fetchPools(wallet);
      setPools(poolsData);
    }
  };

  useEffect(() => {
    handleGetPools();
  }, [wallet]);

  if (!wallet.connected) {
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          marginTop: "100px",
        }}
      >
        <WalletMultiButton />
      </div>
    );
  } else {
    return (
      <div className="App">
        <div className="grid grid-cols-3 gap-4">
          <div className="border-2 border-gray-400 rounded-sm p-2">
            <CreatePoolForm handleGetPools={handleGetPools}/>
          </div>
          {Array.isArray(pools) &&
            pools.map((pool) => (
              <div
                key={pool.publicKey}
                className="border-2 border-gray-400 rounded-sm p-2"
              >
                <PoolCard pool={pool} />
              </div>
            ))}
        </div>
      </div>
    );
  }
}

const AppWithProvider = () => (
  <ConnectionProvider endpoint="https://solana-devnet.g.alchemy.com/v2/IsZi0UBPx_0W2aCi9fB6WStIimc5qfut">
    <WalletProvider wallets={wallets} autoConnect>
      <WalletModalProvider>
        <App />
      </WalletModalProvider>
    </WalletProvider>
  </ConnectionProvider>
);

export default AppWithProvider;
