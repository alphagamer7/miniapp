// PhantomWalletPage.jsx
import React, { useState, useEffect } from 'react';
import WebApp from '@twa-dev/sdk';

const PhantomWalletConnect = () => {
  const [walletAddress, setWalletAddress] = useState('');
  const [error, setError] = useState('');
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      const userAgent = navigator.userAgent || navigator.vendor || window.opera;
      return /android|ios|iphone|ipad|ipod/i.test(userAgent.toLowerCase());
    };
    setIsMobile(checkMobile());
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
    
    // Use your actual bot username and handle
    const redirect = encodeURIComponent('https://t.me/testalphabot44123411bot/wallet');
    
    // For testing purposes we're using a placeholder key
    // In production, you should use a proper encryption key
    const dappKey = 'placeholder_key';
    
    // Add cluster parameter for Solana network
    const cluster = 'mainnet';
    
    return `${baseUrl}/connect?app_url=${redirect}&dapp_encryption_public_key=${dappKey}&cluster=${cluster}`;
  };

  const connectWallet = async () => {
    try {
      if (isMobile) {
        const connectUrl = buildConnectURL();
        // Use Telegram's WebApp.openLink instead of window.location
        WebApp.openLink(connectUrl);
        return;
      }

      // Desktop flow
      const provider = getProvider();
      if (!provider) {
        // Use Telegram's WebApp.openLink for external links
        WebApp.openLink('https://phantom.app/');
        return;
      }

      const resp = await provider.connect();
      setWalletAddress(resp.publicKey.toString());
      
      // Optionally save the wallet address
      localStorage.setItem('phantomWallet', resp.publicKey.toString());
      
      setError('');
    } catch (err) {
      setError('Failed to connect wallet: ' + err.message);
    }
  };

  const disconnectWallet = async () => {
    try {
      if (isMobile) {
        setWalletAddress('');
        localStorage.removeItem('phantomWallet');
        return;
      }

      const provider = getProvider();
      if (provider) {
        await provider.disconnect();
        setWalletAddress('');
        localStorage.removeItem('phantomWallet');
        setError('');
      }
    } catch (err) {
      setError('Failed to disconnect: ' + err.message);
    }
  };

  // Load saved wallet address on component mount
  useEffect(() => {
    const savedWallet = localStorage.getItem('phantomWallet');
    if (savedWallet) {
      setWalletAddress(savedWallet);
    }
  }, []);

  return (
    <div>
      {error && (
        <div className="text-red-500 text-xs mb-2">
          {error}
        </div>
      )}
      
      {!walletAddress ? (
        <button 
          onClick={connectWallet}
          className="bg-purple-500 hover:bg-purple-600 text-white text-sm py-1 px-3 rounded-full"
        >
          Connect Wallet 1
        </button>
      ) : (
        <div className="flex flex-col items-end gap-1">
          <p className="text-white text-xs">
            {walletAddress.slice(0, 4)}...{walletAddress.slice(-4)}
          </p>
          <button 
            onClick={disconnectWallet}
            className="bg-red-500 hover:bg-red-600 text-white text-xs py-1 px-3 rounded-full"
          >
            Disconnect
          </button>
        </div>
      )}
    </div>
  );
};

export default PhantomWalletConnect;