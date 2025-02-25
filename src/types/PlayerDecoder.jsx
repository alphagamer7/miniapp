// types/PlayerDecoder.js
// import { Buffer } from 'buffer';
import { PublicKey } from "@solana/web3.js";

// Constants matching Rust code
const MAX_ROUND_HISTORY_SIZE = 5;
const MAX_CURRENT_ROUNDS = 5;
const DISCRIMINATOR_SIZE = 8;
const PUBKEY_SIZE = 32;

const decodeRoundHistory = (buffer, offset) => {
    return {
        roundId: buffer.readBigUInt64LE(offset),
        betAmt: buffer.readBigUInt64LE(offset + 8),
        payoutAmt: buffer.readBigUInt64LE(offset + 16),
        eliminatedTurn: buffer.readUInt8(offset + 24)
    };
};

export const decodePlayerData = (data) => {
    try {
        const buffer = Buffer.from(data);
        let offset = 0;

        // Skip anchor's discriminator
        offset += DISCRIMINATOR_SIZE;

        // Decode wallet_key (Pubkey - 32 bytes)
        const walletKey = new PublicKey(buffer.slice(offset, offset + PUBKEY_SIZE));
        offset += PUBKEY_SIZE;

        // Decode total_rounds (u32 - 4 bytes)
        const totalRounds = buffer.readUInt32LE(offset);
        offset += 4;

        // Decode total_bet (u64 - 8 bytes)
        const totalBet = buffer.readBigUInt64LE(offset);
        offset += 8;

        // Decode total_payout (u64 - 8 bytes)
        const totalPayout = buffer.readBigUInt64LE(offset);
        offset += 8;

        // Decode current_rounds vector
        const currentRoundsLen = buffer.readUInt32LE(offset);
        offset += 4;
        const currentRounds = [];
        for (let i = 0; i < currentRoundsLen && i < MAX_CURRENT_ROUNDS; i++) {
            currentRounds.push(buffer.readBigUInt64LE(offset));
            offset += 8;
        }
        // Skip remaining slots in fixed-size array
        offset += 8 * (MAX_CURRENT_ROUNDS - currentRoundsLen);

        // Decode round_histories vector
        const roundHistoriesLen = buffer.readUInt32LE(offset);
        offset += 4;
        const roundHistories = [];
        for (let i = 0; i < roundHistoriesLen && i < MAX_ROUND_HISTORY_SIZE; i++) {
            roundHistories.push(decodeRoundHistory(buffer, offset));
            offset += 25; // Size of RoundHistory struct
        }
        // Skip remaining slots in fixed-size array
        offset += 25 * (MAX_ROUND_HISTORY_SIZE - roundHistoriesLen);

        // Decode bump (u8 - 1 byte)
        const bump = buffer.readUInt8(offset);

        return {
            walletKey: walletKey.toString(),
            totalRounds,
            totalBet: totalBet.toString(), // Convert BigInt to string for JSON
            totalPayout: totalPayout.toString(), // Convert BigInt to string for JSON
            currentRounds: currentRounds.map(n => n.toString()), // Convert BigInts to strings
            roundHistories: roundHistories.map(history => ({
                ...history,
                roundId: history.roundId.toString(),
                betAmt: history.betAmt.toString(),
                payoutAmt: history.payoutAmt.toString()
            })),
            bump
        };
    } catch (error) {
        console.error('Error decoding player data:', error);
        throw error;
    }
};