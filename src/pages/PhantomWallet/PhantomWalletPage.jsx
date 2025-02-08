// PhantomWalletPage.jsx
import React, { useState } from 'react';

const PhantomWalletConnect = () => {
  const [walletAddress, setWalletAddress] = useState('');
  const [error, setError] = useState('');

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
    try {
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