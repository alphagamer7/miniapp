import { TonConnectUIProvider } from '@tonconnect/ui-react';
import { useEffect, useMemo } from 'react';
import WebApp from '@twa-dev/sdk';

import { App } from '@/components/App.jsx';
import { ErrorBoundary } from '@/components/ErrorBoundary.jsx';
import { GameDataProvider } from '@/provider/GameDataProvider';
import { WALLET_CONFIG } from '@/config/wallet.config';

// Debug logs for Telegram WebApp initialization
console.log('Root.jsx loaded, WebApp available:', !!WebApp);
console.log('WebApp raw initData:', WebApp.initData);
console.log('WebApp initDataUnsafe:', WebApp.initDataUnsafe);
console.log('WebApp start_param:', WebApp.initDataUnsafe.start_param);

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
    // Get Telegram start parameter
    const startParam = WebApp.initDataUnsafe.start_param;
    console.log('Telegram start param:', startParam);
    
    if (startParam) {
      // Check if this looks like a base64url encoded string
      if (/^[A-Za-z0-9_-]+$/.test(startParam)) {
        try {
          // Convert base64url to regular base64
          const base64 = startParam.replace(/-/g, '+').replace(/_/g, '/');
          
          // Add padding if needed
          const padding = '='.repeat((4 - base64.length % 4) % 4);
          const paddedBase64 = base64 + padding;
          
          // Decode the base64 string
          const decodedString = atob(paddedBase64);
          console.log('Decoded parameter:', decodedString);
          
          // Check if the decoded string starts with game_
          if (decodedString.startsWith('game_')) {
            // Extract just the number part after "game_"
            const gameId = decodedString.substring(5);
            console.log('Game ID extracted:', gameId);
            alert("Game ID: " + gameId);
            GameParams.saveGameId(gameId);
          }
        } catch (error) {
          console.error('Error decoding base64:', error);
        }
      }
    }else{
      const gameId = GameParams.getGameId();
      if (!gameId) {
        GameParams.saveGameId(WALLET_CONFIG.DEFAULT_GAME_ID);     
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
