import React, { useState } from "react";
import { Connection, PublicKey } from "@solana/web3.js";
import { useWallet } from "@solana/wallet-adapter-react";
import * as anchor from "@project-serum/anchor";
import {
  getAssociatedTokenAddress,
  createAssociatedTokenAccountInstruction,
} from "@solana/spl-token";
import { getMint } from "@solana/spl-token";

import { getConstantSwapProgram, getProvider, connection } from "../utils";

interface IProps {
  handleGetPools: () => void
}

const utf8 = anchor.utils.bytes.utf8;

const CreatePoolForm: React.FC<IProps> = ({handleGetPools}) => {
  const [token, setToken] = useState("");
  const [price, setPrice] = useState(0);
  const wallet = useWallet();

  const onSubmit = async (e: any) => {
    e.preventDefault()
    if (token && wallet.publicKey) {
      const tokenMint = new PublicKey(token);
      const mint = await getMint(connection, tokenMint);

      const provider = getProvider(wallet);
      const program = getConstantSwapProgram(provider);

      const [swapPool] = anchor.web3.PublicKey.findProgramAddressSync(
        [
          utf8.encode("swap_pool"),
          wallet.publicKey.toBuffer(),
          tokenMint.toBuffer(),
        ],
        program.programId
      );
      const [poolSigner, bump] = anchor.web3.PublicKey.findProgramAddressSync(
        [swapPool.toBuffer()],
        program.programId
      );
      const tokenAccount = await getAssociatedTokenAddress(
        tokenMint,
        poolSigner,
        true
      );
      const accounts = {
        swapPool,
        authority: wallet.publicKey,
        tokenMint,
        tokenAccount,
      };
      const createAccountsInstructions = [
        createAssociatedTokenAccountInstruction(
          wallet.publicKey,
          tokenAccount,
          poolSigner,
          tokenMint
        ),
      ];
      const tx = await program.methods
        .initializePool(
          new anchor.BN((price * Math.pow(10, mint.decimals)))
        )
        .accounts(accounts)
        .preInstructions(createAccountsInstructions)
        .rpc();
      console.log("Log ~ file: CreatePoolForm.tsx:68 ~ onSubmit ~ tx:", tx);
      handleGetPools()
    }
  };

  return (
    <form>
      <div>
        <label
          htmlFor="price"
          className="block text-sm font-medium leading-6 text-gray-900"
        >
          Swap rate (SOL/token)
        </label>
        <div className="mt-2">
          <input
            type="text"
            name="price"
            id="price"
            className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6 pl-2"
            placeholder="Token per SOL"
            onChange={(e) => setPrice(parseFloat(e.target.value))}
          />
        </div>
      </div>
      <div>
        <label
          htmlFor="tokenAddress"
          className="block text-sm font-medium leading-6 text-gray-900"
        >
          Token
        </label>
        <div className="mt-2">
          <input
            type="tokenAddress"
            name="tokenAddress"
            id="tokenAddress"
            className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6 pl-2"
            placeholder="Token mint"
            onChange={(e) => setToken(e.target.value)}
          />
        </div>
      </div>
      <button
        onClick={onSubmit}
        className="rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
      >
        Create Pool
      </button>
    </form>
  );
};
export default CreatePoolForm;
