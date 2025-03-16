import { PublicKey } from "@solana/web3.js";






/// STRUCT
// pub struct Game {
//   pub id: u64,
//   pub max_active_rounds: u8,
//   pub max_completed_rounds: u8,
//   pub active_rounds: Vec<u64>,      // storage ulid  
//   pub completed_rounds: Vec<u64>,
//   pub operator: Pubkey,
//   pub token_mint: Pubkey,
//   pub bump: u8,         
// }

export const decodeGameData = (data) => {
  try {
    let offset = 8; // Skip discriminator

    // Version (u8 = 1 byte)
    const version = data[offset];
    offset += 1;

    // ID (u64 = 8 bytes)
    const id = new DataView(data.buffer).getBigInt64(offset, true);
    offset += 8;

    // Max Active & Completed Rounds (u8)
    const maxActiveRounds = data[offset];
    offset += 1;
    const maxCompletedRounds = data[offset];
    offset += 1;

    // Current Round Number (u32 = 4 bytes)
    const currentRoundNumber = new DataView(data.buffer).getUint32(offset, true);
    offset += 4;

    // Active rounds (Vec<u32>)
    const activeRoundsLength = new DataView(data.buffer).getUint32(offset, true);
    offset += 4;
    const activeRounds = [];
    for (let i = 0; i < activeRoundsLength; i++) {
        const roundId = new DataView(data.buffer).getUint32(offset, true);
        activeRounds.push(roundId.toString()); // Convert to string for easier handling
        offset += 4; // u32 is 4 bytes
    }

    // Completed rounds (Vec<u32>)
    const completedRoundsLength = new DataView(data.buffer).getUint32(offset, true);
    offset += 4;
    const completedRounds = [];
    for (let i = 0; i < completedRoundsLength; i++) {
        const roundId = new DataView(data.buffer).getUint32(offset, true);
        completedRounds.push(roundId.toString()); // Convert to string for easier handling
        offset += 4; // u32 is 4 bytes
    }

    // Operator pubkey (32 bytes)
    const operator = new PublicKey(data.slice(offset, offset + 32)).toBase58();
    offset += 32;

    // Token mint pubkey (32 bytes)
    const tokenMint = new PublicKey(data.slice(offset, offset + 32)).toBase58();
    offset += 32;

    // Bump (u8)
    const bump = data[offset];
    offset += 1;

    // Reserved (32 bytes)
    const reserved = Array.from(data.slice(offset, offset + 32));
    offset += 32;

    return {
        version,
        id: id.toString(), // Convert BigInt to string
        maxActiveRounds,
        maxCompletedRounds,
        currentRoundNumber,
        activeRounds,
        completedRounds,
        operator,
        tokenMint,
        bump,
        reserved: reserved.map(byte => byte.toString(16).padStart(2, '0')).join(''), // Convert bytes to hex string
    };
  } catch (e) {
    console.error(`Failed to decode game data: ${e.message}`);
    throw new Error(`Failed to decode game data: ${e.message}`);
  }
};