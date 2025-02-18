/**
 * @typedef {Object} GameAccount
 * @property {number} maxActiveRounds - Maximum number of active rounds allowed
 * @property {number} minCompletedRounds - Minimum number of completed rounds required
 * @property {string[]} activeRounds - Array of active round IDs
 * @property {string[]} completedRounds - Array of completed round IDs
 * @property {string} operator - The operator's public key
 * @property {number} bump - The PDA bump seed
 */

/**
 * Creates a new GameAccount object with default values
 * @returns {GameAccount}
 */
export function createGameAccount() {
    return {
        maxActiveRounds: 0,
        minCompletedRounds: 0,
        activeRounds: [],
        completedRounds: [],
        operator: '',
        bump: 0
    };
}