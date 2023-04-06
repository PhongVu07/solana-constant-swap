import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { Keypair, PublicKey, Connection } from "@solana/web3.js";
import {
  createMint,
  createAccount,
  getAccount,
  getOrCreateAssociatedTokenAccount,
  transfer,
  mintTo,
  TOKEN_PROGRAM_ID,
  ASSOCIATED_TOKEN_PROGRAM_ID,
  NATIVE_MINT,
  getAssociatedTokenAddress,
  createAssociatedTokenAccountInstruction,
} from "@solana/spl-token";
import { assert } from "chai";

import { ConstantSwap } from "../target/types/constant_swap";
import keypair from "./test-keypair.json";

const utf8 = anchor.utils.bytes.utf8;
const TOKEN_B_DECIMAL = 3

describe("constant-swap", () => {
  const provider =  anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const program = anchor.workspace.ConstantSwap as Program<ConstantSwap>;
  const wallet = Keypair.fromSecretKey(Uint8Array.from(keypair));

  // let tokenAMint: PublicKey = NATIVE_MINT;
  let tokenBMint: PublicKey;

  before(async () => {
    tokenBMint = await createMint(
      provider.connection,
      wallet,
      wallet.publicKey,
      wallet.publicKey,
      TOKEN_B_DECIMAL
    );
  });

  it("Initialize pool", async () => {
    const [swapPool] = anchor.web3.PublicKey.findProgramAddressSync(
      [
        utf8.encode("swap_pool"),
        wallet.publicKey.toBuffer(),
        // tokenAMint.toBuffer(),
        tokenBMint.toBuffer(),
      ],
      program.programId
    );
    // const tokenAAccount = await getAssociatedTokenAddress(tokenAMint, swapPool, true);
    const tokenBAccount = await getAssociatedTokenAddress(tokenBMint, swapPool, true);

    const accounts = {
      swapPool,
      authority: wallet.publicKey,
      // tokenAMint,
      tokenBMint,
      // tokenAAccount,
      tokenBAccount,
    };

    const createAccountsInstructions = [
      // createAssociatedTokenAccountInstruction(
      //   wallet.publicKey,
      //   tokenAAccount,
      //   swapPool,
      //   tokenAMint
      // ),
      createAssociatedTokenAccountInstruction(
        wallet.publicKey,
        tokenBAccount,
        swapPool,
        tokenBMint
      ),
    ];
    const tx = await program.methods
      .initializePool(new anchor.BN(0.1 * Math.pow(10, TOKEN_B_DECIMAL)))
      .accounts(accounts)
      .preInstructions(createAccountsInstructions)
      .signers([wallet])
      .rpc();
    console.log("tx:", tx)

    await mintTo(provider.connection, wallet, tokenBMint, tokenBAccount, wallet, 1000 * Math.pow(10, TOKEN_B_DECIMAL))

    const swapPoolAccount = await program.account.swapPool.fetch(swapPool)

    assert.equal(swapPoolAccount.tokenBPrice.toString(), "100")
    assert.equal(swapPoolAccount.authority.toString(), wallet.publicKey.toString())
    // assert.equal(swapPoolAccount.tokenAAccount.toString(), tokenAAccount.toString())
    assert.equal(swapPoolAccount.tokenBAccount.toString(), tokenBAccount.toString())
    // assert.equal(swapPoolAccount.tokenAMint.toString(), tokenAMint.toString())
    assert.equal(swapPoolAccount.tokenBMint.toString(), tokenBMint.toString())

  });
});
