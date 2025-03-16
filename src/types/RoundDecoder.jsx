import { PublicKey } from "@solana/web3.js";

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
    // Version (u8)
    const version = dataView.getUint8(offset);
    offset += 1;

    // ID (u32)
    const id = dataView.getUint32(offset, true);
    offset += 4;

    // Game ID (u64)
    const gameId = dataView.getBigUint64(offset, true).toString();
    offset += 8;

    // Operator PublicKey
    const operator = readPubkey();

    // Players vector
    const playersLength = dataView.getUint32(offset, true);
    offset += 4;
    const players = [];
    for (let i = 0; i < playersLength; i++) {
      players.push(readPubkey().toBase58());
    }

    // Max players (u8)
    const maxPlayers = dataView.getUint8(offset);
    offset += 1;

    // Min players (u8)
    const minPlayers = dataView.getUint8(offset);
    offset += 1;

    // Entry fees (u64)
    const entryFees = dataView.getBigUint64(offset, true).toString();
    offset += 8;

    // State (u8, as an Enum)
    const stateValue = dataView.getUint8(offset);
    const state = ['Published', 'Started', 'Playing', 'Resulted', 'Closed'][stateValue];
    offset += 1;

    // Total turns (u8)
    const totalTurns = dataView.getUint8(offset);
    offset += 1;

    // Current turn (u8)
    const currentTurn = dataView.getUint8(offset);
    offset += 1;

    // Turn info vector
    const turnInfoLength = dataView.getUint32(offset, true);
    offset += 4;
    const turnInfo = [];
    for (let i = 0; i < turnInfoLength; i++) {
      // Read TurnInfo struct
      const index = dataView.getUint8(offset);
      offset += 1;

      // Eliminated player indexes
      const eliminatedLength = dataView.getUint32(offset, true);
      offset += 4;
      const eliminatedPlayerIndexes = [];
      for (let j = 0; j < eliminatedLength; j++) {
        eliminatedPlayerIndexes.push(dataView.getUint8(offset));
        offset += 1;
      }

      // Turn ended at (i64)
      const turnEndedAt = dataView.getBigInt64(offset, true);
      offset += 8;

      turnInfo.push({
        index,
        eliminatedPlayerIndexes,
        turnEndedAt: turnEndedAt.toString()
      });
    }

    // Schedule start time (i64)
    const scheduleStartTime = dataView.getBigInt64(offset, true).toString();
    offset += 8;

    // Turn interval seconds (u16)
    const turnIntervalSeconds = dataView.getUint16(offset, true);
    offset += 2;

    // Started at (i64)
    const startedAt = dataView.getBigInt64(offset, true).toString();
    offset += 8;

    // Ended at (i64)
    const endedAt = dataView.getBigInt64(offset, true).toString();
    offset += 8;

    // Round vault bump (u8)
    const roundVaultBump = dataView.getUint8(offset);
    offset += 1;

    // Bump (u8)
    const bump = dataView.getUint8(offset);
    offset += 1;

    // Reserved (32 bytes)
    const reserved = Array.from(data.slice(offset, offset + 32));
    offset += 32;

    return {
      version,
      id,
      gameId,
      operator: operator.toBase58(),
      players,
      maxPlayers,
      minPlayers,
      entryFees,
      state,
      totalTurns,
      currentTurn,
      turnInfo,
      scheduleStartTime,
      turnIntervalSeconds,
      startedAt,
      endedAt,
      roundVaultBump,
      bump,
      reserved: reserved.map(byte => byte.toString(16).padStart(2, '0')).join('')
    };
  } catch (error) {
    throw new Error(`Failed to decode round data: ${error.message}`);
  }
};

