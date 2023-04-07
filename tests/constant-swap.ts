import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { Keypair, PublicKey } from "@solana/web3.js";
import {
  createMint,
  mintTo,
  getAssociatedTokenAddress,
  createAssociatedTokenAccountInstruction,
} from "@solana/spl-token";
import { assert } from "chai";

import { ConstantSwap } from "../target/types/constant_swap";
import keypair from "./test-keypair.json";

const utf8 = anchor.utils.bytes.utf8;
const TOKEN_DECIMAL = 3;
const SOL_TO_TOKEN_RATE = 10;

describe("constant-swap", () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const program = anchor.workspace.ConstantSwap as Program<ConstantSwap>;
  const wallet = Keypair.fromSecretKey(Uint8Array.from(keypair));

  let tokenMint: PublicKey;
  let swapPool: PublicKey;
  let tokenAccount: PublicKey;
  let poolSigner: PublicKey;
  let bump: number;

  before(async () => {
    tokenMint = await createMint(
      provider.connection,
      wallet,
      wallet.publicKey,
      wallet.publicKey,
      TOKEN_DECIMAL
    );
  });

  it("Initialize pool", async () => {
    const [_swapPool] = anchor.web3.PublicKey.findProgramAddressSync(
      [
        utf8.encode("swap_pool"),
        wallet.publicKey.toBuffer(),
        tokenMint.toBuffer(),
      ],
      program.programId
    );
    swapPool = _swapPool;
    const [_poolSigner, _bump] = anchor.web3.PublicKey.findProgramAddressSync(
      [swapPool.toBuffer()],
      program.programId
    );
    poolSigner = _poolSigner;
    bump = _bump;
    tokenAccount = await getAssociatedTokenAddress(
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
        new anchor.BN(SOL_TO_TOKEN_RATE * Math.pow(10, TOKEN_DECIMAL))
      )
      .accounts(accounts)
      .preInstructions(createAccountsInstructions)
      .signers([wallet])
      .rpc();
    console.log("Create pool tx:", tx);

    await mintTo(
      provider.connection,
      wallet,
      tokenMint,
      tokenAccount,
      wallet,
      1000 * Math.pow(10, TOKEN_DECIMAL)
    );

    const swapPoolAccount = await program.account.swapPool.fetch(swapPool);

    assert.equal(swapPoolAccount.solToTokenRate.toString(), "10000");
    assert.equal(
      swapPoolAccount.authority.toString(),
      wallet.publicKey.toString()
    );
    assert.equal(
      swapPoolAccount.tokenAccount.toString(),
      tokenAccount.toString()
    );
    assert.equal(swapPoolAccount.tokenMint.toString(), tokenMint.toString());
  });

  it("Swap SOL for token", async () => {
    const userTokenAccount: PublicKey = await getAssociatedTokenAddress(
      tokenMint,
      wallet.publicKey
    );
    const createAccountsInstructions = [
      createAssociatedTokenAccountInstruction(
        wallet.publicKey,
        userTokenAccount,
        wallet.publicKey,
        tokenMint
      ),
    ];

    const accounts = {
      swapPool,
      tokenAccount,
      poolSigner,
      userTokenAccount,
      user: wallet.publicKey,
    };

    const tx = await program.methods
      .swapSolForToken(new anchor.BN(0.1 * Math.pow(10, 9)), bump)
      .accounts(accounts)
      .preInstructions(createAccountsInstructions)
      .signers([wallet])
      .rpc();
    console.log("Swap tx:", tx);

    const newUserTokenBalance =
      await provider.connection.getTokenAccountBalance(userTokenAccount);

    assert.equal(
      parseFloat(newUserTokenBalance.value.amount),
      0.1 * SOL_TO_TOKEN_RATE * Math.pow(10, TOKEN_DECIMAL)
    );
  });
});
