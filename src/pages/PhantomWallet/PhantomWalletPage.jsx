import React, { useState, useEffect } from 'react';
import WebApp from '@twa-dev/sdk';
import nacl from "tweetnacl";
import bs58 from "bs58";

const PhantomWalletConnect = () => {
  const [walletAddress, setWalletAddress] = useState('');
  const [error, setError] = useState('');
  const [isMobile, setIsMobile] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [dappKeyPair] = useState(nacl.box.keyPair());

  // Constants
  const TELEGRAM_BOT_URL = 'https://t.me/testalphabot44123411bot';
  const REDIRECT_BASE_URL = 'https://thealphanova.com';

  useEffect(() => {
    // Check if returning from Phantom connection
    const checkPhantomReturn = async () => {
      // First check URL for startapp parameter
      const startParam = WebApp.initDataUnsafe.start_param || 
                        new URLSearchParams(window.location.search).get('startapp');
      alert(startParam)
      if (startParam && /^[\w-]{0,512}$/.test(startParam)) {
        const parts = startParam.split('_');
        if (parts[0] === 'w' && parts[1] && parts[2] === 'u' && parts[4] === 's') {
          const walletAddress = parts[1];
          const userId = parts[3];
          const sessionId = parts[5];
          const provider = getProvider();
          if (provider) {
            try {
              await provider.connect();
              setWalletAddress(walletAddress);
              localStorage.setItem('phantomWallet', JSON.stringify({
                wallet: walletAddress,
                userId: userId,
                session: sessionId
              }));
              
              WebApp.sendData(JSON.stringify({
                type: 'wallet_connected',
                wallet: parts[1]
              }));
              return;
            } catch (err) {
              console.error('Error connecting to Phantom:', err);
            }
          }
        }
      }

      // Check for phantom_response if no startapp param
      const phantomResponse = urlParams.get('phantom_response');
      const state = urlParams.get('state');

      if (phantomResponse && state) {
        try {
          const response = JSON.parse(decodeURIComponent(phantomResponse));
          const decodedState = decodeURIComponent(state);

          // Verify state matches our telegram data
          if (decodedState === WebApp.initData) {
            if (response.public_key) {
              setWalletAddress(response.public_key);
              localStorage.setItem('phantomWallet', response.public_key);
              
              // Notify the Telegram Mini App
              WebApp.sendData(JSON.stringify({
                type: 'wallet_connected',
                wallet: response.public_key
              }));
            }
          }
        } catch (error) {
          setError('Error processing wallet connection');
          WebApp.sendData(JSON.stringify({
            type: 'wallet_connection_error',
            error: error.message
          }));
        }
      }
    };

    // Check device type
    const checkMobile = () => {
      const userAgent = navigator.userAgent || navigator.vendor || window.opera;
      return /android|ios|iphone|ipad|ipod/i.test(userAgent.toLowerCase());
    };

    // Load saved wallet
    const loadSavedWallet = () => {
      const savedWallet = localStorage.getItem('phantomWallet');
      if (savedWallet) {
        setWalletAddress(savedWallet);
      }
    };

    setIsMobile(checkMobile());
    loadSavedWallet();
    checkPhantomReturn();
  }, []);

  const getProvider = () => {
    if ('phantom' in window) {
      const provider = window.phantom?.solana;
      if (provider?.isPhantom) {
        return provider;
      }
    }
    return null;
  };

  const buildConnectURL = () => {
    const baseUrl = 'https://phantom.app/ul/v1';
    
    // Create the redirect URL with proper parameters
    const redirectUrl = `${REDIRECT_BASE_URL}/phantom-callback.html`;
    const telegramData = encodeURIComponent(WebApp.initData);
    
    const params = new URLSearchParams({
      app_url: 'https://thealphanova.com/',
      dapp_encryption_public_key: bs58.encode(dappKeyPair.publicKey),
      redirect_link: `${redirectUrl}?tg_data=${telegramData}`,
      cluster: 'devnet',
    });

    return `${baseUrl}/connect?${params.toString()}`;
  };

  const connectWallet = async () => {
    setIsLoading(true);
    setError('');
    
    try {
      if (isMobile) {
        const connectUrl = buildConnectURL();
        WebApp.openLink(connectUrl, {
          try_instant_view: false
        });
        return;
      }

      // Desktop flow
      const provider = getProvider();
      if (!provider) {
        WebApp.openLink('https://phantom.app/');
        return;
      }

      const resp = await provider.connect();
      const publicKey = resp.publicKey.toString();
      
      setWalletAddress(publicKey);
      localStorage.setItem('phantomWallet', publicKey);
      
      // Notify the Telegram Mini App
      WebApp.sendData(JSON.stringify({
        type: 'wallet_connected',
        wallet: publicKey
      }));
    } catch (err) {
      setError('Failed to connect wallet: ' + err.message);
      WebApp.sendData(JSON.stringify({
        type: 'wallet_connection_error',
        error: err.message
      }));
    } finally {
      setIsLoading(false);
    }
  };

  const disconnectWallet = async () => {
    setIsLoading(true);
    try {
      if (isMobile) {
        setWalletAddress('');
        localStorage.removeItem('phantomWallet');
        WebApp.sendData(JSON.stringify({
          type: 'wallet_disconnected'
        }));
        return;
      }

      const provider = getProvider();
      if (provider) {
        await provider.disconnect();
        setWalletAddress('');
        localStorage.removeItem('phantomWallet');
        setError('');
        WebApp.sendData(JSON.stringify({
          type: 'wallet_disconnected'
        }));
      }
    } catch (err) {
      setError('Failed to disconnect: ' + err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center gap-2">
      {error && (
        <div className="text-red-500 text-xs mb-2 px-4 py-2 bg-red-100 rounded-lg">
          {error}
        </div>
      )}
      
      {!walletAddress ? (
        <button 
          onClick={connectWallet}
          disabled={isLoading}
          className={`
            bg-purple-500 hover:bg-purple-600 text-white 
            text-sm py-2 px-4 rounded-lg
            flex items-center gap-2
            ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}
          `}
        >
          {isLoading ? (
            <>
              <span className="animate-spin">⟳</span>
              Connecting...
            </>
          ) : (
            'Connect Phantom Wallet 11'
          )}
        </button>
      ) : (
        <div className="flex flex-col items-center gap-2">
          <p className="text-white text-sm bg-gray-800 px-3 py-1 rounded-lg">
            {walletAddress.slice(0, 6)}...{walletAddress.slice(-4)}
          </p>
          <button 
            onClick={disconnectWallet}
            disabled={isLoading}
            className={`
              bg-red-500 hover:bg-red-600 text-white 
              text-sm py-2 px-4 rounded-lg
              flex items-center gap-2
              ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}
            `}
          >
            {isLoading ? (
              <>
                <span className="animate-spin">⟳</span>
                Disconnecting...
              </>
            ) : (
              'Disconnect Wallet'
            )}
          </button>
        </div>
      )}
    </div>
  );
};

export default PhantomWalletConnect;