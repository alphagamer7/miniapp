// src/types/pda/playerAccount.js
/**
 * @typedef {Object} RoundHistory
 * @property {string} roundId - ID of the round
 * @property {number} betAmount - Amount bet in the round
 * @property {number} payoutAmount - Amount paid out from the round
 * @property {number} eliminatedTurn - Turn number when eliminated
 * @property {number} win - Win status (0 or 1)
 */

/**
 * @typedef {Object} PlayerAccount
 * @property {string} walletKey - Player's wallet public key
 * @property {number} totalPayout - Total amount paid out to player
 * @property {number} totalRounds - Total number of rounds played
 * @property {number} totalBet - Total amount bet
 * @property {string} currentRound - Current round ID
 * @property {RoundHistory[]} roundHistories - Array of round history
 * @property {number} maxRoundHistories - Maximum number of round histories to store
 * @property {number} bump - The PDA bump seed
 */

/**
 * Creates a new PlayerAccount object with default values
 * @returns {PlayerAccount}
 */
export function createPlayerAccount() {
    return {
        walletKey: '',
        totalPayout: 0,
        totalRounds: 0,
        totalBet: 0,
        currentRound: '',
        roundHistories: [],
        maxRoundHistories: 0,
        bump: 0
    };
}