import { Program, AnchorProvider, web3 } from "@project-serum/anchor";
import { SolanaHelloWorld } from "./types/solana_hello_world";
import {
  connection,
  commitmentLevel,
  helloWorldprogramId,
  helloWorldprogramInterface,
} from "./utils/constants";
import { AnchorWallet } from "@solana/wallet-adapter-react";

export default async function createMessage(
  inputtedMessage: string,
  wallet: AnchorWallet,
  messageAccount: web3.Keypair
) {
  const provider = new AnchorProvider(connection, wallet, {
    preflightCommitment: commitmentLevel,
    commitment: commitmentLevel,
  });

  if (!provider) return;

  const program = new Program(
    helloWorldprogramInterface,
    helloWorldprogramId,
    provider
  ) as Program<SolanaHelloWorld>;

  let retries = 3; // Retry logic

  while (retries > 0) {
    try {
      console.log("Attempting to send transaction...");

      const txn = await program.rpc.createMessage(inputtedMessage, {
        accounts: {
          message: messageAccount.publicKey,
          author: provider.wallet.publicKey,
          systemProgram: web3.SystemProgram.programId,
        },
        signers: [messageAccount],
      });

      console.log("Transaction sent. Signature:", txn);

      // Manually confirm transaction status
      const confirmation = await provider.connection.confirmTransaction(
        txn,
        commitmentLevel
      );

      if (confirmation.value.err) {
        throw new Error("Transaction failed.");
      }

      // Fetch the message account data
      const message = await program.account.message.fetch(
        messageAccount.publicKey
      );
      console.log("Message Account Data:", message);
      return message;

    } catch (err) {
      console.log("Transaction error:", err);
      retries--;

      if (retries === 0) {
        console.error("Transaction failed after retries.");
        return;
      }

      console.log(`Retrying transaction (${3 - retries} attempt(s) left)...`);
    }
  }
}
