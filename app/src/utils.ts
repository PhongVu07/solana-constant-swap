import { Connection, PublicKey } from "@solana/web3.js";
import * as anchor from "@project-serum/anchor";
import { WalletContextState } from "@solana/wallet-adapter-react";
import bs58 from 'bs58';

import idl from "./constant-swap/constant_swap.json";

//@ts-ignore
export const programID = new PublicKey(idl.metadata.address);

const network =
  "https://solana-devnet.g.alchemy.com/v2/IsZi0UBPx_0W2aCi9fB6WStIimc5qfut";
export const connection = new Connection(network, "processed");

export const getProvider = (wallet: WalletContextState) => {
  const provider = new anchor.AnchorProvider(connection, wallet as any, {
    preflightCommitment: "processed",
  });
  return provider;
};

export const getConstantSwapProgram = (provider: anchor.AnchorProvider) =>
  new anchor.Program(idl as anchor.Idl, programID, provider);

// const SwapPoolLayout = BufferLayout.struct([
//     BufferLayout.OffsetLayout(8),
//     BufferLayout.blob(32, "authority"),
//     BufferLayout.blob(32, "token_account"),
//     BufferLayout.blob(32, "token_mint"),
//     BufferLayout.nu64("sol_to_token_rate"),
//   ]);
export const fetchPools = async (wallet: WalletContextState) => {
  const filters: any[] = [
    {
      memcmp: {
        offset: 8,
        bytes: wallet.publicKey?.toBase58(),
      },
    },
    {
      dataSize: 32 * 3 + 8 + 8,
    },
  ];
  const poolAccounts = await connection.getProgramAccounts(programID, {
    filters,
  });

  const provider = getProvider(wallet)
  const program = getConstantSwapProgram(provider)
  const poolPromises = poolAccounts.map(account => getVestingAccount(program, account))
  const pools = await Promise.all(poolPromises)
  console.log("Log ~ file: utils.ts:53 ~ fetchPools ~ pools:", pools)
  return pools
};

const getVestingAccount = async (program: any, account: any) => {
  const accountDetail = await program.account.swapPool.fetch(new PublicKey(account.pubkey))
  return {
    ...accountDetail,
    publicKey: new PublicKey(account.pubkey),
  }
}

export const shortenAddress = (address: string = "00000", chars = 6): string => {
  return `${address.slice(0, chars)}...${address.slice(-chars)}`;
}