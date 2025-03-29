import { useState, useEffect } from 'react';
import { GameParams } from '@/components/Root.jsx';
import { WALLET_CONFIG } from '@/config/wallet.config';

/**
 * Hook to access and manage the game ID stored in local storage
 * @param {Object} options - Hook configuration options
 * @param {boolean} options.subscribe - Whether to listen for changes to the game ID
 * @returns {Object} - Game ID and related functions
 */
export function useGameId({ subscribe = false } = {}) {
  const [gameId, setGameId] = useState(() => GameParams.getGameId());

  // Set up a listener for storage changes if subscribe is true
  useEffect(() => {
    if (!subscribe) return;

    const handleStorageChange = (e) => {
      if (e.key === WALLET_CONFIG.STORAGE_KEYS.GAME_ID) {
        setGameId(e.newValue);
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [subscribe]);

  /**
   * Update the game ID in local storage and state
   * @param {string} newGameId - The new game ID to set
   */
  const updateGameId = (newGameId) => {
    GameParams.saveGameId(newGameId);
    setGameId(newGameId);
    localStorage.setItem(WALLET_CONFIG.STORAGE_KEYS.GAME_ID, newGameId);
  };

  /**
   * Clear the game ID from local storage and state
   */
  const clearGameId = () => {
    GameParams.clearGameId();
    setGameId(null);
  };

  return {
    gameId,
    updateGameId,
    clearGameId,
    isLoaded: gameId !== null && gameId !== undefined,
  };
} 