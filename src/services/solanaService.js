// src/services/solanaService.js
import { PublicKey, SystemProgram, Transaction, TransactionInstruction } from "@solana/web3.js";
import { TOKEN_PROGRAM_ID, getAssociatedTokenAddress } from '@solana/spl-token';
import { Buffer } from "buffer";

export class SolanaService {
  static PROGRAM_ID = "5UX9tzoZ5Tg7AbHvNbUuDhapAPFSJijREKjJpRQR8wof";
  static GAME_ID = "1740528038057";

  static PDA_PREFIXES = {
    GAME: "game",
    ROUND: "round",
    PLAYER: "player",
    ROUND_VAULT: "round_vault"
  };

  static numberToLeBytes(num) {
    const arr = new ArrayBuffer(8);
    const view = new DataView(arr);
    view.setBigInt64(0, BigInt(num), true);
    return new Uint8Array(arr);
  }

  static async getDiscriminator(name) {
    const input = new TextEncoder().encode(`global:${name}`);
    return crypto.subtle.digest('SHA-256', input)
      .then(hash => new Uint8Array(hash).slice(0, 8));
  }

  static async derivePDA(seedPrefix, additionalSeeds) {
    try {
      const programId = new PublicKey(this.PROGRAM_ID);
      const prefixBuffer = new TextEncoder().encode(seedPrefix);
      
      // Create seeds array starting with the prefix
      const seeds = [prefixBuffer];
      
      // Add any additional seeds if they exist
      if (additionalSeeds && Array.isArray(additionalSeeds)) {
        seeds.push(...additionalSeeds);
      }

      const [pda] = await PublicKey.findProgramAddress(seeds, programId);
      return pda;
    } catch (err) {
      console.error(`Error deriving ${seedPrefix} PDA:`, err);
      throw err;
    }
  }

  static async deriveGamePDA() {
    const gameIdBytes = this.numberToLeBytes(this.GAME_ID);
    return this.derivePDA(this.PDA_PREFIXES.GAME, [gameIdBytes]);
  }

  static async deriveRoundPDA(roundId) {
    const roundIdBytes = this.numberToLeBytes(parseInt(roundId, 10));
    return this.derivePDA(this.PDA_PREFIXES.ROUND, [roundIdBytes]);
  }

  static async derivePlayerPDA(playerPubkey) {
    const pubkey = new PublicKey(playerPubkey);
    return this.derivePDA(this.PDA_PREFIXES.PLAYER, [pubkey.toBytes()]);
  }

  static async deriveRoundVaultPDA(roundPDA) {
    return this.derivePDA(this.PDA_PREFIXES.ROUND_VAULT, [roundPDA.toBytes()]);
  }

  static async createJoinRoundTransaction({
    connection,
    roundId,
    playerKey,
    tokenMint
  }) {
    try {
      console.log('Creating join round transaction with:', { roundId, playerKey, tokenMint });
      
      const programPubkey = new PublicKey(this.PROGRAM_ID);
      const playerPubkey = new PublicKey(playerKey);
      const tokenMintPubkey = new PublicKey(tokenMint);
      
      const { blockhash } = await connection.getLatestBlockhash();
      
      console.log('Deriving PDAs...');
      const roundPDA = await this.deriveRoundPDA(roundId);
      console.log('Round PDA:', roundPDA.toString());
      
      const playerPDA = await this.derivePlayerPDA(playerPubkey);
      console.log('Player PDA:', playerPDA.toString());
      
      const roundVault = await this.deriveRoundVaultPDA(roundPDA);
      console.log('Round Vault PDA:', roundVault.toString());
      
      const playerATA = await getAssociatedTokenAddress(
        tokenMintPubkey,
        playerPubkey
      );
      console.log('Player ATA:', playerATA.toString());
      
      console.log('Getting instruction discriminator...');
      const discriminator = await this.getDiscriminator('join_round');
      const data = Buffer.from(discriminator);
      
      console.log('Creating instruction...');
      const instruction = new TransactionInstruction({
        keys: [
          { pubkey: roundPDA, isSigner: false, isWritable: true },
          { pubkey: playerPDA, isSigner: false, isWritable: true },
          { pubkey: playerPubkey, isSigner: true, isWritable: true },
          { pubkey: playerATA, isSigner: false, isWritable: true },
          { pubkey: roundVault, isSigner: false, isWritable: true },
          { pubkey: tokenMintPubkey, isSigner: false, isWritable: false },
          { pubkey: TOKEN_PROGRAM_ID, isSigner: false, isWritable: false },
          { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
        ],
        programId: programPubkey,
        data: data,
      });

      console.log('Creating transaction...');
      const transaction = new Transaction().add(instruction);
      transaction.recentBlockhash = blockhash;
      transaction.feePayer = playerPubkey;

      return transaction;
    } catch (error) {
      console.error('Error creating join round transaction:', error);
      throw error;
    }
  }
}