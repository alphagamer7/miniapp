import { PublicKey } from "@solana/web3.js";

export const decodeRoundData = (data) => {
  // Create a DataView from the buffer
  const dataView = new DataView(data.buffer, data.byteOffset, data.length);
  let offset = 8; // Skip the 8-byte discriminator
  const decoder = new TextDecoder("utf-8"); // Create a TextDecoder instance for UTF-8 encoding

  // Helper function to read PublicKey
  const readPubkey = () => {
    const pubkey = new PublicKey(data.slice(offset, offset + 32));
    offset += 32;
    return pubkey;
  };

  try {
    // ID (26 bytes)
    const id = decoder.decode(data.slice(offset, offset + 26));
    offset += 26;

    // Game PublicKey (32 bytes)
    const game = readPubkey();

    // Operator PublicKey (32 bytes)
    const operator = readPubkey();

    // Max players (u16)
    const maxPlayers = dataView.getUint16(offset, true);
    offset += 2;

    // Min players (u16)
    const minPlayers = dataView.getUint16(offset, true);
    offset += 2;

    // Entry fees (u64) - Convert BigInt to string
    const entryFees = dataView.getBigUint64(offset, true).toString();
    offset += 8;

    // Total turns (u8)
    const totalTurns = dataView.getUint8(offset);
    offset += 1;

    // State (u8, as an Enum)
    const stateValue = dataView.getUint8(offset);
    const state = ['Published', 'Started', 'Playing', 'Resulted', 'Closed'][stateValue];
    offset += 1;

    // Players vector
    const playersLength = dataView.getUint32(offset, true);
    offset += 4;
    
    const players = [];
    for (let i = 0; i < playersLength; i++) {
      const player = readPubkey();
      players.push(player);
    }

    // Token Mint PublicKey (32 bytes)
    const tokenMint = readPubkey();

    // Round Vault PublicKey (32 bytes)
    const roundVault = readPubkey();

    // Bump (u8)
    const bump = dataView.getUint8(offset);

    return {
      id,
      game: game.toBase58(),
      operator: operator.toBase58(),
      maxPlayers,
      minPlayers,
      entryFees,  // Now returns as string instead of BigInt
      totalTurns,
      state,
      players: players.map(p => p.toBase58()),
      tokenMint: tokenMint.toBase58(),
      roundVault: roundVault.toBase58(),
      bump
    };
  } catch (error) {
    throw new Error(`Failed to decode round data: ${error.message}`);
  }
};
