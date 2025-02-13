import React, { useState, useEffect } from 'react';

const PhantomWalletConnect = () => {
  const [walletAddress, setWalletAddress] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    // Check for return from Phantom connection
    const checkPhantomReturn = () => {
      const urlParams = new URLSearchParams(window.location.search);
      const startParam = urlParams.get('startapp');
      
      if (startParam) {
        // Parse the wallet info from startapp parameter
        const parts = startParam.split('_');
        if (parts[0] === 'w' && parts[1]) {
          setWalletAddress(parts[1]);
          localStorage.setItem('phantomWallet', JSON.stringify({
            wallet: parts[1],
            timestamp: Date.now()
          }));
        }
      }
    };

    // Check if mobile device
    const checkMobile = () => {
      const userAgent = navigator.userAgent || navigator.vendor || window.opera;
      return /android|ios|iphone|ipad|ipod/i.test(userAgent.toLowerCase());
    };

    // Load any existing wallet connection
    const loadSavedWallet = () => {
      try {
        const savedData = localStorage.getItem('phantomWallet');
        if (savedData) {
          const walletData = JSON.parse(savedData);
          if (walletData.wallet) {
            setWalletAddress(walletData.wallet);
          }
        }
      } catch (err) {
        console.error('Error loading saved wallet:', err);
      }
    };

    setIsMobile(checkMobile());
    checkPhantomReturn();
    loadSavedWallet();
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

  const connectWallet = async () => {
    setIsLoading(true);
    setError('');

    try {
      if (isMobile) {
        // Mobile flow: Open Phantom wallet connection page
        const redirectUrl = `${window.location.origin}/phantom-callback.html`;
        const baseUrl = 'https://phantom.app/ul/v1/connect';
        const params = new URLSearchParams({
          app_url: window.location.origin,
          redirect_link: redirectUrl,
          cluster: 'devnet'
        });
        const connectUrl = `${baseUrl}?${params.toString()}`;
        window.location.href = connectUrl;
        return;
      }

      // Desktop flow
      const provider = getProvider();
      if (!provider) {
        window.open('https://phantom.app/', '_blank');
        setError('Please install Phantom wallet');
        return;
      }

      const resp = await provider.connect();
      const publicKey = resp.publicKey.toString();
      
      setWalletAddress(publicKey);
      localStorage.setItem('phantomWallet', JSON.stringify({
        wallet: publicKey,
        timestamp: Date.now()
      }));

      // Notify parent component or handle connection success
      if (window.Telegram?.WebApp) {
        window.Telegram.WebApp.sendData(JSON.stringify({
          type: 'wallet_connected',
          wallet: publicKey
        }));
      }
    } catch (err) {
      setError(err.message);
      console.error('Wallet connection error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const disconnectWallet = async () => {
    setIsLoading(true);
    try {
      const provider = getProvider();
      if (provider) {
        await provider.disconnect();
      }
      setWalletAddress('');
      localStorage.removeItem('phantomWallet');
      
      if (window.Telegram?.WebApp) {
        window.Telegram.WebApp.sendData(JSON.stringify({
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
    <div className="w-full max-w-md p-4 bg-white rounded-lg shadow-md">
      <div className="flex flex-col items-center gap-4">
        {error && (
          <div className="w-full p-3 text-sm text-red-500 bg-red-100 rounded-lg">
            {error}
          </div>
        )}
        
        {!walletAddress ? (
          <button 
            onClick={connectWallet}
            disabled={isLoading}
            className={`
              w-full bg-purple-600 hover:bg-purple-700 text-white 
              font-medium py-2 px-4 rounded-lg
              flex items-center justify-center gap-2
              ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}
            `}
          >
            {isLoading ? (
              <>
                <span className="animate-spin">⟳</span>
                Connecting...
              </>
            ) : (
              'Connect Phantom Wallet'
            )}
          </button>
        ) : (
          <div className="flex flex-col items-center gap-3 w-full">
            <p className="px-3 py-1 bg-gray-100 rounded-lg text-sm font-mono">
              {walletAddress.slice(0, 6)}...{walletAddress.slice(-4)}
            </p>
            <button 
              onClick={disconnectWallet}
              disabled={isLoading}
              className={`
                w-full bg-red-500 hover:bg-red-600 text-white 
                font-medium py-2 px-4 rounded-lg
                flex items-center justify-center gap-2
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
    </div>
  );
};

export default PhantomWalletConnect;