import React, { useEffect, useState } from "react";
import {
  getMint,
  Mint,
  createTransferCheckedInstruction,
} from "@solana/spl-token";
import { useWallet } from "@solana/wallet-adapter-react";
import { Transaction, PublicKey } from "@solana/web3.js";
import {
  getAssociatedTokenAddress,
  createAssociatedTokenAccountInstruction,
} from "@solana/spl-token";
import * as anchor from "@project-serum/anchor";

import {
  connection,
  getConstantSwapProgram,
  getProvider,
  programID,
  shortenAddress,
} from "../utils";

interface IProps {
  pool: any;
}

const PoolCard: React.FC<IProps> = ({ pool }) => {
  const [mintData, setMintData] = useState<Mint>();
  const [poolBalance, setPoolBalance] = useState<any>({});
  const [solAmount, setSolAmount] = useState("0");
  const [fundAmount, setFundAmount] = useState("0");
  const { publicKey, tokenMint, tokenAccount, solToTokenRate } = pool;

  const wallet = useWallet();

  const onSwap = async () => {
    if (wallet.publicKey) {
      const provider = getProvider(wallet);
      const program = getConstantSwapProgram(provider);

      const userTokenAccount: PublicKey = await getAssociatedTokenAddress(
        tokenMint,
        wallet.publicKey
      );
      const createAccountsInstructions = [];
      if (
        (await provider.connection.getAccountInfo(userTokenAccount)) === null
      ) {
        createAccountsInstructions.push(
          createAssociatedTokenAccountInstruction(
            wallet.publicKey,
            userTokenAccount,
            wallet.publicKey,
            tokenMint
          )
        );
      }

      const [poolSigner, bump] = anchor.web3.PublicKey.findProgramAddressSync(
        [publicKey.toBuffer()],
        programID
      );
      const accounts = {
        swapPool: publicKey,
        tokenAccount,
        poolSigner,
        userTokenAccount,
        user: wallet.publicKey,
      };
      const tx = await program.methods
        .swapSolForToken(
          new anchor.BN(parseFloat(solAmount) * Math.pow(10, 9)),
          bump
        )
        .accounts(accounts)
        .preInstructions(createAccountsInstructions)
        .rpc();
      console.log("Log ~ file: PoolCard.tsx:63 ~ onSwap ~ tx:", tx);
    }
  };

  const fundSwapPool = async () => {
    if (wallet.publicKey) {
      const userTokenAccount: PublicKey = await getAssociatedTokenAddress(
        tokenMint,
        wallet.publicKey
      );
      let tx = new Transaction();
      tx.add(
        createTransferCheckedInstruction(
          userTokenAccount, // from
          tokenMint, // mint
          tokenAccount, // to
          wallet.publicKey, // from's owner
          parseFloat(fundAmount) * Math.pow(10, mintData?.decimals || 0), // amount
          mintData?.decimals || 0 // decimals
        )
      );
      const result = await wallet.sendTransaction(tx, connection);
      console.log("response", result);
    }
  };

  useEffect(() => {
    const handleGetMint = async () => {
      if (tokenMint) {
        const data = await getMint(connection, tokenMint);
        setMintData(data);
      }
    };
    handleGetMint();
  }, [tokenMint]);

  useEffect(() => {
    const getPoolBalance = async () => {
      if (publicKey && tokenAccount) {
        const {
          value: { amount, decimals = 0 },
        } = await connection.getTokenAccountBalance(tokenAccount);
        const solBalance = await connection.getBalance(publicKey);
        const token = parseFloat(amount) / Math.pow(10, decimals);
        const sol = solBalance / Math.pow(10, 9);
        setPoolBalance({ token, sol });
      }
    };
    getPoolBalance();
  }, [publicKey, tokenAccount]);

  return (
    <div>
      <h5>Mint: {shortenAddress(tokenMint.toString())}</h5>
      <p>
        Price:{" "}
        {1 /
          (solToTokenRate.toNumber() /
            Math.pow(10, mintData?.decimals || 0))}{" "}
        SOL
      </p>
      <p>SOL balance: {poolBalance.sol} SOL</p>
      <p>Token balance: {poolBalance.token}</p>

      <div>
        <label
          htmlFor="tokenAmount"
          className="block text-sm font-medium leading-6 text-gray-900"
        >
          Fund pool with token:
        </label>
        <div className="mt-2">
          <input
            type="text"
            name="tokenAmount"
            id="tokenAmount"
            className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6 pl-2"
            placeholder="Token per SOL"
            value={fundAmount}
            onChange={(e) => setFundAmount(e.target.value)}
          />
        </div>
        <button
          onClick={fundSwapPool}
          className="rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
        >
          Fund
        </button>
      </div>

      <hr className="my-2" />

      <h3>Swap</h3>
      <div>
        <label
          htmlFor="solAmount"
          className="block text-sm font-medium leading-6 text-gray-900"
        >
          From (SOL):
        </label>
        <div className="mt-2">
          <input
            type="text"
            name="solAmount"
            id="solAmount"
            className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6 pl-2"
            placeholder="Token per SOL"
            value={solAmount}
            onChange={(e) => setSolAmount(e.target.value)}
          />
        </div>
      </div>

      <div>
        <div>To (Pool Token):</div>
        <div className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6 pl-2">
          {(parseFloat(solAmount) * solToTokenRate.toNumber()) /
            Math.pow(10, mintData?.decimals || 0)}
        </div>
      </div>

      <button
        onClick={onSwap}
        className="rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
      >
        Swap
      </button>
    </div>
  );
};

export default PoolCard;
