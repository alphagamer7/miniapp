import React, { useState, useEffect } from 'react';
import { Connection, PublicKey, clusterApiUrl } from '@solana/web3.js';
import { useNavigate } from 'react-router-dom';
const LoginScreen = () => {
  const [isConnected, setIsConnected] = useState(false);
  const [balance, setBalance] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [pubkeyInput, setPubkeyInput] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    // Check if already connected
    const connected = localStorage.getItem('connected');
    if (connected) {
      setIsConnected(true);
      navigate('/round-list');
    }
  }, [navigate]);

  const checkBalance = async () => {
    setError('');
    setBalance(null);
    setLoading(true);

    try {
      // Validate public key format
      const publicKey = new PublicKey(pubkeyInput);
      
      // Connect to devnet
      const connection = new Connection(clusterApiUrl('devnet'), 'confirmed');
      
      // Get balance
      const balanceInLamports = await connection.getBalance(publicKey);
      const balanceInSOL = balanceInLamports / 1000000000; // Convert lamports to SOL
      
      setBalance(balanceInSOL);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };
  const connectWalletWithInput = async () => {

    try {
       // Validate public key format
       const publicKey = new PublicKey(pubkeyInput);
      
       // Connect to devnet
       const connection = new Connection(clusterApiUrl('devnet'), 'confirmed');
  
      localStorage.setItem('connected', 'true');
      localStorage.setItem('publicKey', publicKey.toString());
      setIsConnected(true);
      navigate('/home');
    } catch (error) {
      console.error('Error connecting to wallet:', error);
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
      <div>
          <input
            type="text"
            value={pubkeyInput}
            onChange={(e) => setPubkeyInput(e.target.value)}
            placeholder="Public Key"
            className="w-full px-4 py-3 my-4 rounded-lg bg-white/10 text-white placeholder-white/60 border border-white/20 focus:outline-none focus:border-white/40"
          />
        </div>

        <button
        onClick={ connectWalletWithInput}
        className="w-64 bg-gradient-to-r from-yellow-400 to-yellow-500 text-white font-semibold py-3 px-4 rounded-lg shadow-lg hover:opacity-90 transition-opacity"
      >
        Connect Wallet
      </button>

        {/* <button
       onClick={checkBalance}
        className="w-64 bg-gradient-to-r from-yellow-400 to-yellow-500 text-white font-semibold py-3 px-4 rounded-lg shadow-lg hover:opacity-90 transition-opacity"
      >
        Check Balance
      </button>
      {balance !== null && !error && (
        <div className="mt-4">
          <div className="bg-white/10 rounded-lg p-4">
            <div className="text-white/60 text-sm mb-1">Balance:</div>
            <div className="text-white text-xl font-semibold">
              {balance.toFixed(4)} SOL
            </div>
          </div>
        </div>
      )} */}
      {/* Connect/Disconnect Wallet Button */}
      {/* <button
        onClick={isConnected ? disconnectWallet : connectWallet}
        className="w-64 bg-gradient-to-r from-yellow-400 to-yellow-500 text-white font-semibold py-3 px-4 rounded-lg shadow-lg hover:opacity-90 transition-opacity"
      >
        {isConnected ? 'Disconnect Wallet' : 'Connect Wallet'}
      </button> */}
    </div>
  );
};

const connectWallet = async () => {

  try {
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    
    if (isMobile) {
      // Phantom deep link for mobile
      const dappUrl = "https://admin.parker.no/pages/address/address-list";
      const phantomDeepLink = `https://phantom.app/ul/v1/connect?app_url=${dappUrl}&cluster=devnet`;
       
      window.location.href = phantomDeepLink; // Redirect to Phantom
      return;
    }

    // Normal desktop connection
    const provider = window.solana;
    if (provider && provider.isPhantom) {
      const response = await provider.connect();
      const pubKey = new PublicKey(response.publicKey.toString());
      console.log(`Pub Key: ${pubKey}`);
      
      localStorage.setItem('connected', 'true');
      localStorage.setItem('publicKey', pubKey.toString());
      setIsConnected(true);
      navigate('/round-list');
    } else {
      window.open('https://phantom.app/', '_blank');
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

export default LoginScreen;