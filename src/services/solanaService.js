// src/services/solanaService.js
import { PublicKey, SystemProgram, Transaction, TransactionInstruction } from "@solana/web3.js";
import { TOKEN_PROGRAM_ID, getAssociatedTokenAddress } from '@solana/spl-token';
import { Buffer } from "buffer";
import { WALLET_CONFIG } from '@/config/wallet.config';

export class SolanaService {
  static PROGRAM_ID = "5UX9tzoZ5Tg7AbHvNbUuDhapAPFSJijREKjJpRQR8wof";
  
  // Get the game ID dynamically from localStorage
  static getGameId() {
    // Get the game ID from localStorage with fallback
    const storedGameId = localStorage.getItem(WALLET_CONFIG.STORAGE_KEYS.GAME_ID);
    return storedGameId || WALLET_CONFIG.DEFAULT_GAME_ID; // Use fallback value if not found
  }

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
    // Use dynamic game ID
    const gameId = this.getGameId();
    console.log('Using Game ID for deriveGamePDA:', gameId);
    
    const gameIdBytes = this.numberToLeBytes(gameId);
    return this.derivePDA(this.PDA_PREFIXES.GAME, [gameIdBytes]);
  }

  static deriveRoundPDA = async (roundId) => {
    // Use dynamic game ID
    const gameId = this.getGameId();
    console.log('Using Game ID for deriveRoundPDA:', gameId);
    
    // Convert gameId (uint64) and roundId (uint32) to byte arrays in little-endian format
    const gameIdBytes = new ArrayBuffer(8); // 8 bytes for a 64-bit number
    const view64 = new DataView(gameIdBytes);
    view64.setBigUint64(0, BigInt(gameId), true); // true for little-endian
  
    const roundIdBytes = new ArrayBuffer(4); // 4 bytes for a 32-bit number
    const view32 = new DataView(roundIdBytes);
    view32.setUint32(0, roundId, true); // true for little-endian
  
    // Combine the seeds for the PDA derivation
    const seeds = [
      new TextEncoder().encode("round"), // Prefix as a byte array
      new Uint8Array(gameIdBytes),       // Game ID as a byte array
      new Uint8Array(roundIdBytes),      // Round ID as a byte array
    ];
  
    // Find the Program Derived Address using the provided seeds and the program ID
    try {
      const [roundPDA] = await PublicKey.findProgramAddress(seeds, new PublicKey(this.PROGRAM_ID));
      return { roundPDA };
    } catch (error) {
      console.error("Error deriving Round PDA:", error);
      throw error;
    }
  };

  static async derivePlayerPDA(playerPubkey) {
    const pubkey = new PublicKey(playerPubkey);
    
    // Use dynamic game ID
    const gameId = this.getGameId();
    console.log('Using Game ID for derivePlayerPDA:', gameId);
    
    // Convert gameId to bytes
    const gameIdBytes = new ArrayBuffer(8);
    const view = new DataView(gameIdBytes);
    view.setBigUint64(0, BigInt(gameId), true);
    
    // Use the same seed pattern as in the Rust code
    const seeds = [
      new TextEncoder().encode(this.PDA_PREFIXES.PLAYER),
      pubkey.toBytes(),
      new Uint8Array(gameIdBytes)
    ];
    
    const [playerPDA] = await PublicKey.findProgramAddress(
      seeds,
      new PublicKey(this.PROGRAM_ID)
    );
    
    console.log('Derived player PDA:', playerPDA.toString());
    return playerPDA;
  }

  static async deriveRoundVaultPDA(roundPDA, roundId) {
    // Use dynamic game ID
    const gameId = this.getGameId();
    console.log('Using Game ID for deriveRoundVaultPDA:', gameId);
    
    // Convert gameId to bytes
    const gameIdBytes = new ArrayBuffer(8);
    const view64 = new DataView(gameIdBytes);
    view64.setBigUint64(0, BigInt(gameId), true);
    
    // Convert roundId to bytes
    const roundIdBytes = new ArrayBuffer(4);
    const view32 = new DataView(roundIdBytes);
    view32.setUint32(0, parseInt(roundId), true);
    
    // Use the same seed pattern as in the Rust code
    const seeds = [
      new TextEncoder().encode(this.PDA_PREFIXES.ROUND_VAULT),
      new Uint8Array(gameIdBytes),
      new Uint8Array(roundIdBytes)
    ];
    
    // Find the PDA
    const [vaultPDA] = await PublicKey.findProgramAddress(
      seeds,
      new PublicKey(this.PROGRAM_ID)
    );
    
    console.log('Derived vault PDA:', vaultPDA.toString());
    return vaultPDA;
  }

  static async createJoinRoundTransaction({
    connection,
    roundId,
    playerKey,
    tokenMint
  }) {
    try {
      // Use dynamic game ID
      const gameId = this.getGameId();
      console.log('Using Game ID for createJoinRoundTransaction:', gameId);
      
      console.log('Creating join round transaction with:', { gameId, roundId, playerKey, tokenMint });
      
      const programPubkey = new PublicKey(this.PROGRAM_ID);
      const playerPubkey = new PublicKey(playerKey);
      const tokenMintPubkey = new PublicKey(tokenMint);
      
      const { blockhash } = await connection.getLatestBlockhash();
      
      console.log('Deriving PDAs...');
      const roundPDA = await this.deriveRoundPDA(roundId);
      console.log('Round PDA:', roundPDA.roundPDA.toString());
      
      const playerPDA = await this.derivePlayerPDA(playerPubkey);
      console.log('Player PDA:', playerPDA.toString());
      
      const roundVault = await this.deriveRoundVaultPDA(roundPDA,roundId);
      console.log('Round Vault PDA:', roundVault.toString());
      
      const playerATA = await getAssociatedTokenAddress(
        tokenMintPubkey,
        playerPubkey
      );
      console.log('Player ATA:', playerATA.toString());
      
      console.log('Getting instruction discriminator...');
      const discriminator = await this.getDiscriminator('join_round');
      
      // Create a buffer to hold the discriminator and instruction arguments
      const gameIdBytes = new ArrayBuffer(8);
      const gameIdView = new DataView(gameIdBytes);
      gameIdView.setBigUint64(0, BigInt(gameId), true); // Set game_id argument
      
      const roundIdBytes = new ArrayBuffer(4);
      const roundIdView = new DataView(roundIdBytes);
      roundIdView.setUint32(0, parseInt(roundId), true); // Set round_id argument
      
      // Combine all bytes into one data buffer
      const data = Buffer.concat([
        Buffer.from(discriminator),
        Buffer.from(new Uint8Array(gameIdBytes)),
        Buffer.from(new Uint8Array(roundIdBytes))
      ]);
      
      console.log('Creating instruction...');
      const instruction = new TransactionInstruction({
        keys: [
          { pubkey: roundPDA.roundPDA, isSigner: false, isWritable: true },
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