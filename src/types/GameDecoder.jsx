import { PublicKey } from "@solana/web3.js";
//   pub struct Game {
//     pub id: [u8; 26],
//     pub max_active_rounds: u8,
//     pub max_completed_rounds: u8,
//     pub active_rounds: Vec<[u8; 26]>,      // storage ulid  
//     pub completed_rounds: Vec<[u8; 26]>,
//     pub operator: Pubkey,
//     pub token_mint: Pubkey,
//     pub bump: u8,         
// }

// data: Buffer


export const decodeGameData = (data) => {
    console.log(`Data ${data}`)
    let offset = 8;
    const id = new TextDecoder().decode(data.slice(offset, 26)); // ULID (26 bytes)
    offset += 26;
    const maxActiveRounds = data[offset]; // u8
    offset += 1;
    const maxCompletedRounds = data[offset]; // u8

    // Active rounds
    offset += 1
    const activeRoundsLength = new DataView(data.buffer).getUint32(offset, true); // u32 length prefix
    offset += 4; // Start after length prefix
    const activeRounds = [];
    for (let i = 0; i < activeRoundsLength; i++) {
      const roundId = new TextDecoder().decode(data.slice(offset, offset + 26));
      activeRounds.push(roundId);
      offset += 26; // Move to next round
    }

    // Completed rounds
    const completedRoundsLength = new DataView(data.buffer).getUint32(offset, true); // u32 length prefix
    offset += 4;
    const completedRounds = [];
    for (let i = 0; i < completedRoundsLength; i++) {
      const roundId = new TextDecoder().decode(data.slice(offset, offset + 26));
      completedRounds.push(roundId);
      offset += 26; // Move to next round
    }

    // Operator (32 bytes)
    const operator = new PublicKey(data.slice(offset, offset + 32)).toBase58();
    offset += 32;

    // Token Mint (32 bytes)
    const tokenMint = new PublicKey(data.slice(offset, offset + 32)).toBase58();
    offset += 32;

    // Bump (u8)
    const bump = data[offset];

    return {
      id,
      maxActiveRounds,
      maxCompletedRounds,
      activeRounds,
      completedRounds,
      operator,
      tokenMint,
      bump,
    };
  };
