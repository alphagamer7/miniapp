import { PublicKey } from "@solana/web3.js";



// export const decodeRoundData = (data) => {
//   // Create a DataView from the buffer
//   const dataView = new DataView(data.buffer, data.byteOffset, data.length);
//   let offset = 8; // Skip the 8-byte discriminator
//   const decoder = new TextDecoder("utf-8"); // Create a TextDecoder instance for UTF-8 encoding

//   // Helper function to read PublicKey
//   const readPubkey = () => {
//     const pubkey = new PublicKey(data.slice(offset, offset + 32));
//     offset += 32;
//     return pubkey;
//   };

//   try {
//     // ID (26 bytes)
//     const id = decoder.decode(data.slice(offset, offset + 26));
//     offset += 26;

//     // Game PublicKey (32 bytes)
//     const game = readPubkey();

//     // Operator PublicKey (32 bytes)
//     const operator = readPubkey();

//     // Max players (u16)
//     const maxPlayers = dataView.getUint16(offset, true);
//     offset += 2;

//     // Min players (u16)
//     const minPlayers = dataView.getUint16(offset, true);
//     offset += 2;

//     // Entry fees (u64) - Convert BigInt to string
//     const entryFees = dataView.getBigUint64(offset, true).toString();
//     offset += 8;

//     // Total turns (u8)
//     const totalTurns = dataView.getUint8(offset);
//     offset += 1;

//     // State (u8, as an Enum)
//     const stateValue = dataView.getUint8(offset);
//     const state = ['Published', 'Started', 'Playing', 'Resulted', 'Closed'][stateValue];
//     offset += 1;

//     // Players vector
//     const playersLength = dataView.getUint32(offset, true);
//     offset += 4;
    
//     const players = [];
//     for (let i = 0; i < playersLength; i++) {
//       const player = readPubkey();
//       players.push(player);
//     }

//     // Token Mint PublicKey (32 bytes)
//     const tokenMint = readPubkey();

//     // Round Vault PublicKey (32 bytes)
//     const roundVault = readPubkey();

//     // Bump (u8)
//     const bump = dataView.getUint8(offset);

//     return {
//       id,
//       game: game.toBase58(),
//       operator: operator.toBase58(),
//       maxPlayers,
//       minPlayers,
//       entryFees,  // Now returns as string instead of BigInt
//       totalTurns,
//       state,
//       players: players.map(p => p.toBase58()),
//       tokenMint: tokenMint.toBase58(),
//       roundVault: roundVault.toBase58(),
//       bump
//     };
//   } catch (error) {
//     throw new Error(`Failed to decode round data: ${error.message}`);
//   }
// };


// *********************************************************************************************


// pub enum RoundState {
//     Published,
//     Started,
//     Playing,
//     Resulted,
//     Closed
// }


// pub struct TurnInfo {
//     pub index: u8,     
//     pub survival_player_indexes: Vec<u16>,  // Player indexes of survivors
//     pub eliminated_player_indexes: Vec<u16>,  // Player indexes of eliminated players
// }

// pub struct Round {
//     pub id: u64,
//     pub game: Pubkey,
//     pub operator: Pubkey,
//     pub token_mint: Pubkey,
//     pub round_vault: Pubkey,

//     pub max_players: u16,
//     pub min_players: u16,
//     pub entry_fees: u64,
//     pub state: RoundState,  

//     pub max_turns: u8,
//     pub max_eliminated: u16,
//     pub current_turn: u8,

//     pub players: Vec<Pubkey>,
//     pub turn_info: Vec<TurnInfo>,

//     pub bump: u8,
// }

export const decodeRoundData = (data) => {
  const dataView = new DataView(data.buffer, data.byteOffset, data.length);
  let offset = 8; // Skip discriminator

  // Helper function to read PublicKey
  const readPubkey = () => {
    const pubkey = new PublicKey(data.slice(offset, offset + 32));
    offset += 32;
    return pubkey;
  };

  try {
    // ID (u64)
    const id = dataView.getBigUint64(offset, true).toString();
    offset += 8;

    // Game PublicKey
    const game = readPubkey();

    // Operator PublicKey
    const operator = readPubkey();

    // Token Mint PublicKey
    const tokenMint = readPubkey();

    // Round Vault PublicKey
    const roundVault = readPubkey();

    // Max players (u16)
    const maxPlayers = dataView.getUint16(offset, true);
    offset += 2;

    // Min players (u16)
    const minPlayers = dataView.getUint16(offset, true);
    offset += 2;

    // Entry fees (u64)
    const entryFees = dataView.getBigUint64(offset, true).toString();
    offset += 8;

    // State (u8, as an Enum)
    const stateValue = dataView.getUint8(offset);
    const state = ['Published', 'Started', 'Playing', 'Resulted', 'Closed'][stateValue];
    offset += 1;

    // Max turns (u8)
    const maxTurns = dataView.getUint8(offset);
    offset += 1;

    // Max eliminated (u16)
    const maxEliminated = dataView.getUint16(offset, true);
    offset += 2;

    // Current turn (u8)
    const currentTurn = dataView.getUint8(offset);
    offset += 1;

    // Players vector
    const playersLength = dataView.getUint32(offset, true);
    offset += 4;
    const players = [];
    for (let i = 0; i < playersLength; i++) {
      const player = readPubkey();
      players.push(player);
    }

    // Turn info vector
    const turnInfoLength = dataView.getUint32(offset, true);
    offset += 4;
    const turnInfo = [];
    for (let i = 0; i < turnInfoLength; i++) {
      // Read TurnInfo struct
      const index = dataView.getUint8(offset);
      offset += 1;

      // Survival player indexes
      const survivalLength = dataView.getUint32(offset, true);
      offset += 4;
      const survivalPlayerIndexes = [];
      for (let j = 0; j < survivalLength; j++) {
        survivalPlayerIndexes.push(dataView.getUint16(offset, true));
        offset += 2;
      }

      // Eliminated player indexes
      const eliminatedLength = dataView.getUint32(offset, true);
      offset += 4;
      const eliminatedPlayerIndexes = [];
      for (let j = 0; j < eliminatedLength; j++) {
        eliminatedPlayerIndexes.push(dataView.getUint16(offset, true));
        offset += 2;
      }

      turnInfo.push({
        index,
        survivalPlayerIndexes,
        eliminatedPlayerIndexes,
      });
    }

    // Bump (u8)
    const bump = dataView.getUint8(offset);

    return {
      id,
      game: game.toBase58(),
      operator: operator.toBase58(),
      tokenMint: tokenMint.toBase58(),
      roundVault: roundVault.toBase58(),
      maxPlayers,
      minPlayers,
      entryFees,
      state,
      maxTurns,
      maxEliminated,
      currentTurn,
      players: players.map(p => p.toBase58()),
      turnInfo,
      bump
    };
  } catch (error) {
    throw new Error(`Failed to decode round data: ${error.message}`);
  }
};

