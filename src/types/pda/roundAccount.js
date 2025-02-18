// src/types/pda/roundAccount.js
/**
 * @typedef {Object} TurnInfo
 * @property {number} index - Turn index
 * @property {number[]} survivalPlayers - Array of surviving player indices
 * @property {number[]} eliminatedPlayers - Array of eliminated player indices
 */

/**
 * @typedef {Object} RoundAccount
 * @property {number} totalTurns - Total number of turns in the round
 * @property {number} state - Current state of the round
 * @property {string[]} players - Array of player public keys
 * @property {TurnInfo[]} turnInfo - Array of turn information
 * @property {number[]} winners - Array of winner indices
 * @property {string} tokenName - Name of the token used
 * @property {number} bump - The PDA bump seed
 * @property {number} minPlayers - Minimum number of players required
 * @property {number} maxPlayers - Maximum number of players allowed
 * @property {number} entryFees - Entry fee amount
 */

/**
 * Creates a new RoundAccount object with default values
 * @returns {RoundAccount}
 */
export function createRoundAccount() {
    return {
        totalTurns: 0,
        state: 0,
        players: [],
        turnInfo: [],
        winners: [],
        tokenName: '',
        bump: 0,
        minPlayers: 0,
        maxPlayers: 0,
        entryFees: 0
    };
}