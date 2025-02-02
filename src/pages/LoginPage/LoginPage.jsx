import React, { useState, useEffect } from 'react';
import { Connection, PublicKey, clusterApiUrl } from '@solana/web3.js';
import { useNavigate } from 'react-router-dom';

const LoginScreen = () => {
  const [isConnected, setIsConnected] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // Check if already connected
    const connected = localStorage.getItem('connected');
    if (connected) {
      setIsConnected(true);
      navigate('/round-list');
    }
  }, [navigate]);

  const connectWallet = async () => {
    try {
      const provider = window.solana;

      if (provider && provider.isPhantom) {
        try {
          const response = await provider.connect();
          const pubKey = new PublicKey(response.publicKey.toString());
          
          localStorage.setItem('connected', 'true');
          localStorage.setItem('publicKey', pubKey.toString());
          setIsConnected(true);
          navigate('/round-list');
        } catch (err) {
          console.error('User rejected the request:', err);
        }
      } else {
        alert('Phantom wallet not found! Please install Phantom wallet.');
      }
    } catch (error) {
      console.error('Error connecting to wallet:', error);
    }
  };

  const disconnectWallet = async () => {
    try {
      const provider = window.solana;
      
      if (provider && provider.isPhantom) {
        await provider.disconnect();
        localStorage.removeItem('connected');
        localStorage.removeItem('publicKey');
        setIsConnected(false);
        navigate('/');
      }
    } catch (error) {
      console.error('Error disconnecting wallet:', error);
    }
  };

  return (
    <div className="min-h-screen bg-violet-700 p-6 flex flex-col justify-center items-center">
      {/* Logo */}
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold text-center bg-gradient-to-r from-yellow-300 to-yellow-500 text-transparent bg-clip-text" style={{ textShadow: '2px 2px 4px rgba(0,0,0,0.3)' }}>
          SETTLD
        </h1>
      </div>

      {/* Connect/Disconnect Wallet Button */}
      <button
        onClick={isConnected ? disconnectWallet : connectWallet}
        className="w-64 bg-gradient-to-r from-yellow-400 to-yellow-500 text-white font-semibold py-3 px-4 rounded-lg shadow-lg hover:opacity-90 transition-opacity"
      >
        {isConnected ? 'Disconnect Wallet' : 'Connect Wallet'}
      </button>
    </div>
  );
};

export default LoginScreen;