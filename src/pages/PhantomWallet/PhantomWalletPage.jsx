import React, { useState, useEffect } from 'react';
import WebApp from '@twa-dev/sdk';
import nacl from "tweetnacl";
import bs58 from "bs58";
// import { PublicKey } from '@solana/web3.js';

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
    // Check device type
    const checkMobile = () => {
      const userAgent = navigator.userAgent || navigator.vendor || window.opera;
      return /android|ios|iphone|ipad|ipod/i.test(userAgent.toLowerCase());
    };

    // Load saved wallet
    const loadSavedWallet = () => {
      const savedWallet = localStorage.getItem('phantomWallet');
      if (savedWallet) {
        try {
          const walletData = JSON.parse(savedWallet);
          setWalletAddress(walletData.wallet);
        } catch (e) {
          setWalletAddress(savedWallet);
        }
      }
    };

    setIsMobile(checkMobile());
    loadSavedWallet();
    checkPhantomReturn();
  }, []);

  // Function to decrypt Phantom data (copied from HTML file)
  const decryptPhantomData = (encryptedData, phantomPublicKey, nonce, secretKey) => {
    try {
      console.log("Starting decryption process...");
      
      // Decode the base58 strings
      console.log("Decoding phantom public key:", phantomPublicKey);
      const phantomPublicKeyBytes = bs58.decode(phantomPublicKey);
      console.log("Public key bytes:", Array.from(phantomPublicKeyBytes));
      
      console.log("Decoding nonce:", nonce);
      const nonceBytes = bs58.decode(nonce);
      console.log("Nonce bytes:", Array.from(nonceBytes));
      
      console.log("Decoding encrypted data (first 10 chars):", encryptedData.substring(0, 10) + "...");
      const ciphertextBytes = bs58.decode(encryptedData);
      console.log("Encrypted data length:", ciphertextBytes.length);
      
      // Create the shared secret
      console.log("Creating shared secret...");
      const sharedSecret = nacl.box.before(phantomPublicKeyBytes, secretKey);
      console.log("Shared secret created:", !!sharedSecret);
      
      // Decrypt the message
      console.log("Attempting to decrypt...");
      const decryptedBytes = nacl.box.open.after(ciphertextBytes, nonceBytes, sharedSecret);
      
      if (!decryptedBytes) {
        throw new Error('Failed to decrypt - invalid key or corrupted data');
      }
      
      console.log("Decryption successful!");
      
      // Convert decrypted bytes to UTF-8 string
      const decryptedString = new TextDecoder().decode(decryptedBytes);
      console.log("Decrypted string (first 50 chars):", decryptedString.substring(0, 50) + "...");

      // Parse the JSON string
      const result = JSON.parse(decryptedString);
      console.log("JSON parsed successfully:", result);
      return result;
    } catch (error) {
      console.error('Error decrypting Phantom data:', error);
      throw error;
    }
  };

  const checkPhantomReturn = async () => {
    // First check URL for startapp parameter
    const startParam = WebApp.initDataUnsafe.start_param || 
                      new URLSearchParams(window.location.search).get('startapp');
    
    console.log("Received startParam:", startParam);
    
    if (startParam && startParam.length > 0) {
      try {
        
        // If not the old format, try the new format: "[encrypted]_[pubkey]_[nonce]"
        const dataParts = startParam.split('_');
        if (dataParts.length === 3) {
          const encryptedData = dataParts[0];
          const publicKey = dataParts[1];
          const nonce = dataParts[2];
          
          console.log("Received encrypted data parts:");
          console.log("- Encrypted data:", encryptedData.substring(0, 20) + "...");
          console.log("- Public key:", publicKey);
          console.log("- Nonce:", nonce);
          
          // Store the data for later decryption or use
          localStorage.setItem('phantom_encrypted_data', encryptedData);
          localStorage.setItem('phantom_public_key', publicKey); 
          localStorage.setItem('phantom_nonce', nonce);
          
          // Try to decrypt if we have a secret key
          try {
            // Retrieve the secret key we stored during connection

            const secretKeyBase58 = localStorage.getItem('phantom_connection_secret_key');
            if (secretKeyBase58) {
              const secretKey = bs58.decode(secretKeyBase58);
              
              // Decrypt the data
              const decryptedData = decryptPhantomData(encryptedData, publicKey, nonce, secretKey);
              
              // Use the decrypted public key from the Phantom response
              if (decryptedData && decryptedData.public_key) {
                console.log("Successfully decrypted wallet data:", decryptedData);
                alert("Successfully decrypted wallet data: " + JSON.stringify(decryptedData));
                localStorage.setItem("publicKey", decryptedData.public_key);
                alert("session: " + decryptedData.session);
                localStorage.setItem("session", decryptedData.session || "");
                // handleWalletConnection(decryptedData.public_key, "decrypted", decryptedData.session || "");
                return;
              }
            } else {
              console.warn("No secret key found in session storage for decryption");
            }
          } catch (decryptError) {
            console.error("Failed to decrypt data:", decryptError);
            // Fall back to using the public key as the wallet address
          }
          
          // If decryption failed or wasn't possible, use the public key as the wallet address
          handleWalletConnection(publicKey, "from_encrypted", nonce);
          return;
        }
        
        // If we reached here, the format is unknown
        console.warn("Unknown startParam format:", startParam);
        setError("Received wallet data in an unknown format");
      } catch (err) {
        console.error("Error parsing startParam:", err);
        setError("Error parsing wallet connection data: " + err.message);
      }
    }
    
    // Check localStorage as fallback (in case the data was stored there)
    const encryptedData = localStorage.getItem('phantom_encrypted_data');
    const publicKey = localStorage.getItem('phantom_public_key');
    const nonce = localStorage.getItem('phantom_nonce');
    
    if (encryptedData && publicKey && nonce) {
      console.log("Using data from localStorage");
      
      // Try to decrypt if we have a secret key
      try {
        const secretKeyBase58 = sessionStorage.getItem('phantom_connection_secret_key');
        if (secretKeyBase58) {
          const secretKey = bs58.decode(secretKeyBase58);
          
          // Decrypt the data
          const decryptedData = decryptPhantomData(encryptedData, publicKey, nonce, secretKey);
          
          // Use the decrypted public key from the Phantom response
          if (decryptedData && decryptedData.public_key) {
            console.log("Successfully decrypted wallet data from localStorage:", decryptedData);
            handleWalletConnection(decryptedData.public_key, "decrypted_storage", decryptedData.session || "");
            return;
          }
        }
      } catch (decryptError) {
        console.error("Failed to decrypt localStorage data:", decryptError);
      }
      
      // Fallback to using stored public key if decryption fails
      handleWalletConnection(publicKey, "from_storage", nonce);
      return;
    }
    
    // Rest of your existing code for other connection methods
    // Check for phantom_response if no startapp param
    const urlParams = new URLSearchParams(window.location.search);
    const phantomResponse = urlParams.get('phantom_response');
    const state = urlParams.get('state');
  
    if (phantomResponse && state) {
      try {
        const response = JSON.parse(decodeURIComponent(phantomResponse));
        const decodedState = decodeURIComponent(state);
  
        // Verify state matches our telegram data
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
  
  // Helper function to handle wallet connection
  const handleWalletConnection = (walletAddress, userId, sessionId) => {
    setWalletAddress(walletAddress);
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
    
    // Create the redirect URL with proper parameters
    const redirectUrl = `${REDIRECT_BASE_URL}/phantom-callback.html`;
    const telegramData = encodeURIComponent(WebApp.initData);

    const secretKeyBase58 = bs58.encode(dappKeyPair.secretKey);
    localStorage.setItem('phantom_connection_secret_key', secretKeyBase58);
    // let phantom_connection_public_key = bs58.encode(dappKeyPair.publicKey);
    localStorage.setItem('phantom_connection_public_key', bs58.encode(dappKeyPair.publicKey));
    console.log('secretKeyBase58:', secretKeyBase58);
    console.log('public key:', bs58.encode(dappKeyPair.publicKey));
    alert('public key:' + bs58.encode(dappKeyPair.publicKey));
    
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
            bg-blue-500 hover:bg-blue-600 text-white 
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
            'Connect Phantom Wallet v7'
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