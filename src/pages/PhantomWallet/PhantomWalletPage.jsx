// PhantomWalletPage.jsx
import React, { useState, useEffect } from 'react';

const PhantomWalletConnect = () => {
  const [walletAddress, setWalletAddress] = useState('');
  const [error, setError] = useState('');
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    // Check if user is on mobile
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
    // Base URL for universal links (recommended)
    const baseUrl = 'https://phantom.app/ul/v1';
    
    // Your app's URL that Phantom will redirect back to
    const redirect = encodeURIComponent('https://t.me/testalphabot44123411bot');
    
    // Construct the connect URL
    const connectUrl = `${baseUrl}/connect?app_url=${redirect}&dapp_encryption_public_key=test}`;
    
    return connectUrl;
  };

  const connectWallet = async () => {
    try {
      if (isMobile) {
        // Use deeplink for mobile
        const connectUrl = buildConnectURL();
        window.location.href = connectUrl;
        return;
      }

      // Desktop flow
      const provider = getProvider();
      if (!provider) {
        window.open('https://phantom.app/', '_blank');
        return;
      }

      const resp = await provider.connect();
      setWalletAddress(resp.publicKey.toString());
      setError('');
    } catch (err) {
      setError('Failed to connect wallet: ' + err.message);
    }
  };

  const disconnectWallet = async () => {
    try {
      if (isMobile) {
        // Handle mobile disconnect
        setWalletAddress('');
        return;
      }

      const provider = getProvider();
      if (provider) {
        await provider.disconnect();
        setWalletAddress('');
        setError('');
      }
    } catch (err) {
      setError('Failed to disconnect: ' + err.message);
    }
  };

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
          Connect Wallet
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