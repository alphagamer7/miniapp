import { TonConnectUIProvider } from '@tonconnect/ui-react';
import { useEffect, useMemo } from 'react';
import WebApp from '@twa-dev/sdk';

import { App } from '@/components/App.jsx';
import { ErrorBoundary } from '@/components/ErrorBoundary.jsx';
import { GameDataProvider } from '@/provider/GameDataProvider';
import { WALLET_CONFIG } from '@/config/wallet.config';

// Utility functions for game parameters
export const GameParams = {
  // Store the game ID in localStorage
  saveGameId: (gameId) => {
    if (gameId) {
      localStorage.setItem(WALLET_CONFIG.STORAGE_KEYS.GAME_ID, gameId);
      console.log(`Game ID saved: ${gameId}`);
    }
  },
  
  // Get the stored game ID from localStorage
  getGameId: () => {
    return localStorage.getItem(WALLET_CONFIG.STORAGE_KEYS.GAME_ID);
  },
  
  // Clear the stored game ID
  clearGameId: () => {
    localStorage.removeItem(WALLET_CONFIG.STORAGE_KEYS.GAME_ID);
  }
};

/**
 * @param {unknown} error
 * @returns {JSX.Element}
 */
function ErrorBoundaryError({ error }) {
  return (
    <div>
      <p>An unhandled error occurred:</p>
      <blockquote>
        <code>
          {error instanceof Error
            ? error.message
            : typeof error === 'string'
              ? error
              : JSON.stringify(error)}
        </code>
      </blockquote>
    </div>
  );
}

/**
 * @returns {JSX.Element}
 */
export function Inner() {
  const debug = WebApp.initDataUnsafe.start_param === 'debug';
  const manifestUrl = useMemo(() => {
    return new URL('tonconnect-manifest.json', window.location.href).toString();
  }, []);

  // Process URL parameters and Telegram start parameters to extract and store the GAME_ID
  useEffect(() => {
    try {
      // First check URL parameters
      const urlParams = new URLSearchParams(window.location.search);
      let gameId = urlParams.get('gameId') || urlParams.get('game_id') || urlParams.get('game');
      
      if (gameId) {
        console.log('Game ID found in URL parameters:', gameId);
        GameParams.saveGameId(gameId);
        return; // If we found a gameId in the URL, no need to check Telegram params
      }
      
      // Next check URL hash (for SPA routing with hash)
      if (window.location.hash) {
        const hashParams = new URLSearchParams(window.location.hash.substring(1));
        gameId = hashParams.get('gameId') || hashParams.get('game_id') || hashParams.get('game');
        
        if (gameId) {
          console.log('Game ID found in URL hash:', gameId);
          GameParams.saveGameId(gameId);
          return;
        }
      }
      
      // If no gameId in URL, check Telegram start parameters
      const startParam = WebApp.initDataUnsafe.start_param;
      console.log('Telegram start param:', startParam);
      
      if (startParam) {
        // Parse the start_param which could be in different formats:
        // - "GAME_123" directly as the start_param
        // - "game=GAME_123" as a key-value pair
        // - "param1=value1&game=GAME_123&param3=value3" as part of query params
        
        if (startParam.includes('_')) {
          // This appears to be a query string or key-value format
          const params = new URLSearchParams(startParam.replace(/&amp;/g, '&'));
          gameId = params.get('game');
          
          // If not found with 'game' key, try other potential keys
          if (!gameId) {
            gameId = params.get('game_id') || params.get('gameId') || params.get('id');
          }
        } else if (startParam.match(/^(GAME_|game_)\d+$/i)) {
          // This appears to be just the game ID directly
          gameId = startParam;
        }
        
        // If we found a game ID, store it
        if (gameId) {
          console.log('Game ID found in Telegram start parameters:', gameId);
          GameParams.saveGameId(gameId);
        }
      }
    } catch (error) {
      console.error('Error processing start parameters:', error);
    }
  }, []);

  // Enable debug mode to see all the methods sent and events received.
  useEffect(() => {
    if (debug) {
      import('eruda').then((lib) => lib.default.init());
    }
  }, [debug]);

  return (
    <TonConnectUIProvider manifestUrl={manifestUrl}>
      <GameDataProvider>
        <App/>
      </GameDataProvider>
    </TonConnectUIProvider>
  );
}

/**
 * @returns {JSX.Element}
 */
export function Root() {
  return (
    <ErrorBoundary fallback={ErrorBoundaryError}>
      <Inner/>
    </ErrorBoundary>
  );
}
