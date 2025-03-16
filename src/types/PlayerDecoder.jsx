// types/PlayerDecoder.js
import { PublicKey } from "@solana/web3.js";

// Constants matching Rust code
const MAX_ROUND_HISTORY_SIZE = 30; // Updated to match Rust constant
const MAX_CURRENT_ROUNDS = 5;      // Updated to match Rust constant
const DISCRIMINATOR_SIZE = 8;
const PUBKEY_SIZE = 32;

// Decode a single RoundHistory struct
const decodeRoundHistory = (buffer, offset) => {
    return {
        roundId: buffer.readUInt32LE(offset),         // u32 (4 bytes)
        betAmt: buffer.readBigUInt64LE(offset + 4),   // u64 (8 bytes)
        payoutAmt: buffer.readBigUInt64LE(offset + 12), // u64 (8 bytes)
        eliminatedTurn: buffer.readUInt8(offset + 20), // u8 (1 byte)
        isWinner: Boolean(buffer.readUInt8(offset + 21)) // bool (1 byte)
    };
};

// Calculate size of a RoundHistory entry
const ROUND_HISTORY_SIZE = 22; // 4 + 8 + 8 + 1 + 1 bytes

export const decodePlayerData = (data) => {
    try {
        const buffer = Buffer.from(data);
        let offset = 0;

        // Skip anchor's discriminator
        offset += DISCRIMINATOR_SIZE;

        // Decode version (u8 - 1 byte) - NEW FIELD
        const version = buffer.readUInt8(offset);
        offset += 1;

        // Decode wallet_key (Pubkey - 32 bytes)
        const walletKey = new PublicKey(buffer.slice(offset, offset + PUBKEY_SIZE));
        offset += PUBKEY_SIZE;

        // Decode game_id (u64 - 8 bytes) - NEW FIELD
        const gameId = buffer.readBigUInt64LE(offset);
        offset += 8;

        // Decode total_rounds (u32 - 4 bytes)
        const totalRounds = buffer.readUInt32LE(offset);
        offset += 4;

        // Decode total_bet (u64 - 8 bytes)
        const totalBet = buffer.readBigUInt64LE(offset);
        offset += 8;

        // Decode total_payout (u64 - 8 bytes)
        const totalPayout = buffer.readBigUInt64LE(offset);
        offset += 8;

        // Decode current_rounds vector (Vec<u32>)
        const currentRoundsLen = buffer.readUInt32LE(offset);
        offset += 4;
        const currentRounds = [];
        for (let i = 0; i < currentRoundsLen && i < MAX_CURRENT_ROUNDS; i++) {
            currentRounds.push(buffer.readUInt32LE(offset)); // u32 (4 bytes each)
            offset += 4;
        }

        // Decode round_histories vector
        const roundHistoriesLen = buffer.readUInt32LE(offset);
        offset += 4;
        const roundHistories = [];
        for (let i = 0; i < roundHistoriesLen && i < MAX_ROUND_HISTORY_SIZE; i++) {
            roundHistories.push(decodeRoundHistory(buffer, offset));
            offset += ROUND_HISTORY_SIZE;
        }

        // Decode bump (u8 - 1 byte)
        const bump = buffer.readUInt8(offset);
        offset += 1;

        // Skip reserved field (32 bytes)
        const reserved = buffer.slice(offset, offset + 32);
        // offset += 32; // Uncomment if you need to continue parsing after this

        return {
            version,
            walletKey: walletKey.toString(),
            gameId: gameId.toString(),
            totalRounds,
            totalBet: totalBet.toString(),
            totalPayout: totalPayout.toString(),
            currentRounds: currentRounds.map(n => n.toString()),
            roundHistories: roundHistories.map(history => ({
                ...history,
                roundId: history.roundId.toString(),
                betAmt: history.betAmt.toString(),
                payoutAmt: history.payoutAmt.toString()
            })),
            bump,
            reserved: Array.from(reserved)
        };
    } catch (error) {
        console.error('Error decoding player data:', error);
        throw error;
    }
};