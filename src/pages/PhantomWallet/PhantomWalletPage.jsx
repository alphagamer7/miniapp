import React, { useState, useEffect } from 'react';
import WebApp from '@twa-dev/sdk';
import nacl from "tweetnacl";
import bs58 from "bs58";

const PhantomWalletConnect = () => {
  const [walletState, setWalletState] = useState({
    address: '',
    isConnected: false,
    session: '',
    userId: ''
  });
  const [error, setError] = useState('');
  const [isMobile, setIsMobile] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [dappKeyPair] = useState(nacl.box.keyPair());

  // Constants
  const TELEGRAM_BOT_URL = 'https://t.me/testalphabot44123411bot';
  const REDIRECT_BASE_URL = 'https://thealphanova.com';

  // Load saved wallet and check device type on component mount
  useEffect(() => {
    setIsMobile(checkDeviceType());
    loadSavedWalletData();
    checkPhantomReturn();
  }, []);

  // Check if device is mobile
  const checkDeviceType = () => {
    const userAgent = navigator.userAgent || navigator.vendor || window.opera;
    return /android|ios|iphone|ipad|ipod/i.test(userAgent.toLowerCase());
  };

  // Load wallet data from localStorage
  const loadSavedWalletData = () => {
    const savedWallet = localStorage.getItem('phantomWallet');
    if (savedWallet) {
      try {
        const walletData = JSON.parse(savedWallet);
        setWalletState({
          address: walletData.wallet,
          isConnected: !!walletData.wallet,
          session: walletData.session || '',
          userId: walletData.userId || ''
        });
      } catch (e) {
        // Fallback for old format where only address was stored
        setWalletState({
          address: savedWallet,
          isConnected: !!savedWallet,
          session: '',
          userId: ''
        });
      }
    }
  };

  // Decrypt data received from Phantom
  const decryptPhantomData = (encryptedData, phantomPublicKey, nonce, secretKey) => {
    try {
      const phantomPublicKeyBytes = bs58.decode(phantomPublicKey);
      const nonceBytes = bs58.decode(nonce);
      const ciphertextBytes = bs58.decode(encryptedData);
      
      const sharedSecret = nacl.box.before(phantomPublicKeyBytes, secretKey);
      
      const decryptedBytes = nacl.box.open.after(ciphertextBytes, nonceBytes, sharedSecret);
      
      if (!decryptedBytes) {
        throw new Error('Failed to decrypt - invalid key or corrupted data');
      }
      
      const decryptedString = new TextDecoder().decode(decryptedBytes);
      return JSON.parse(decryptedString);
    } catch (error) {
      console.error('Error decrypting Phantom data:', error);
      throw error;
    }
  };

  // Check if returning from Phantom wallet connection
  const checkPhantomReturn = async () => {
    const startParam = WebApp.initDataUnsafe.start_param || 
                      new URLSearchParams(window.location.search).get('startapp');
    
    if (startParam && startParam.length > 0) {
      try {
        const dataParts = startParam.split('_');
        if (dataParts.length === 3) {
          const [encryptedData, publicKey, nonce] = dataParts;
          
          localStorage.setItem('phantom_encrypted_data', encryptedData);
          localStorage.setItem('phantom_public_key', publicKey); 
          localStorage.setItem('phantom_nonce', nonce);
          
          const secretKeyBase58 = localStorage.getItem('phantom_connection_secret_key');
          if (secretKeyBase58) {
            try {
              const secretKey = bs58.decode(secretKeyBase58);
              const decryptedData = decryptPhantomData(encryptedData, publicKey, nonce, secretKey);
              
              if (decryptedData && decryptedData.public_key) {
                console.log("Successfully decrypted wallet data:", decryptedData);
                localStorage.setItem("publicKey", decryptedData.public_key);
                localStorage.setItem("session", decryptedData.session || "");
                
                handleWalletConnection(
                  decryptedData.public_key, 
                  "decrypted", 
                  decryptedData.session || ""
                );
                return;
              }
            } catch (decryptError) {
              console.error("Failed to decrypt data:", decryptError);
            }
          }
          
          handleWalletConnection(publicKey, "from_encrypted", nonce);
          return;
        }
        
        console.warn("Unknown startParam format:", startParam);
        setError("Received wallet data in an unknown format");
      } catch (err) {
        console.error("Error parsing startParam:", err);
        setError("Error parsing wallet connection data: " + err.message);
      }
    }
    
    const encryptedData = localStorage.getItem('phantom_encrypted_data');
    const publicKey = localStorage.getItem('phantom_public_key');
    const nonce = localStorage.getItem('phantom_nonce');
    
    if (encryptedData && publicKey && nonce) {
      try {
        const secretKeyBase58 = localStorage.getItem('phantom_connection_secret_key');
        if (secretKeyBase58) {
          const secretKey = bs58.decode(secretKeyBase58);
          const decryptedData = decryptPhantomData(encryptedData, publicKey, nonce, secretKey);
          
          if (decryptedData && decryptedData.public_key) {
            handleWalletConnection(
              decryptedData.public_key, 
              "decrypted_storage", 
              decryptedData.session || ""
            );
            return;
          }
        }
      } catch (decryptError) {
        console.error("Failed to decrypt localStorage data:", decryptError);
      }
      
      handleWalletConnection(publicKey, "from_storage", nonce);
      return;
    }
    
    const urlParams = new URLSearchParams(window.location.search);
    const phantomResponse = urlParams.get('phantom_response');
    const state = urlParams.get('state');
  
    if (phantomResponse && state) {
      try {
        const response = JSON.parse(decodeURIComponent(phantomResponse));
        const decodedState = decodeURIComponent(state);
  
        if (decodedState === WebApp.initData) {
          if (response.public_key) {
            handleWalletConnection(response.public_key, "direct_connect", "");
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
  
  const handleWalletConnection = (walletAddress, userId, sessionId) => {
    setWalletState({
      address: walletAddress,
      isConnected: true,
      session: sessionId,
      userId: userId
    });
    
    localStorage.setItem('phantomWallet', JSON.stringify({
      wallet: walletAddress,
      userId: userId,
      session: sessionId
    }));
    
    WebApp.sendData(JSON.stringify({
      type: 'wallet_connected',
      wallet: walletAddress
    }));
    
    console.log("Wallet connected:", walletAddress);
  };

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
    const redirectUrl = `${REDIRECT_BASE_URL}/phantom-callback.html`;
    const telegramData = encodeURIComponent(WebApp.initData);

    const secretKeyBase58 = bs58.encode(dappKeyPair.secretKey);
    localStorage.setItem('phantom_connection_secret_key', secretKeyBase58);
    localStorage.setItem('phantom_connection_public_key', bs58.encode(dappKeyPair.publicKey));
    
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

      const provider = getProvider();
      if (!provider) {
        WebApp.openLink('https://phantom.app/');
        return;
      }

      const resp = await provider.connect();
      const publicKey = resp.publicKey.toString();
      
      handleWalletConnection(publicKey, "desktop_connect", "");
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
        resetWalletState();
        return;
      }

      const provider = getProvider();
      if (provider) {
        await provider.disconnect();
        resetWalletState();
      }
    } catch (err) {
      setError('Failed to disconnect: ' + err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const resetWalletState = () => {
    setWalletState({
      address: '',
      isConnected: false,
      session: '',
      userId: ''
    });
    
    localStorage.removeItem('phantomWallet');
    localStorage.removeItem('publicKey');
    localStorage.removeItem('phantom_encrypted_data');
    localStorage.removeItem('phantom_public_key');
    localStorage.removeItem('phantom_nonce');
    setError('');
    
    WebApp.sendData(JSON.stringify({
      type: 'wallet_disconnected'
    }));
  };

  return (
    <div className="p-6">
      <div className="w-full flex flex-col items-center">
        {error && (
          <div className="text-red-500 text-xs mb-2 px-4 py-2 bg-red-100 rounded-lg w-full">
            {error}
          </div>
        )}
        
        {!walletState.isConnected ? (
          <div className="space-y-4 w-full">
            <button 
              onClick={connectWallet}
              disabled={isLoading}
              className="w-full bg-transparent border border-black rounded-xl p-4 text-white text-xl text-center"
            >
              {isLoading ? 'Connecting...' : 'Connect Wallet'}
            </button>
          </div>
        ) : (
          <div className="w-full flex flex-col gap-2">
            <div className="w-full border border-black rounded-xl p-4 text-white text-xl text-center">
              Connected: {walletState.address.slice(0, 4)}...{walletState.address.slice(-4)}
            </div>
            <button 
              onClick={disconnectWallet}
              disabled={isLoading}
              className="w-full bg-transparent border border-red-500 text-red-500 rounded-xl p-3 text-center mt-2"
            >
              {isLoading ? 'Processing...' : 'Disconnect Wallet'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default PhantomWalletConnect;