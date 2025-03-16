import { useState, useEffect } from 'react';
import WebApp from '@twa-dev/sdk';
import nacl from "tweetnacl";
import bs58 from "bs58";
import { WALLET_CONFIG } from '@/config/wallet.config';

const usePhantomWallet = () => {
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

  useEffect(() => {
    setIsMobile(checkDeviceType());
    loadSavedWalletData();
    checkPhantomReturn();
  }, []);

  const checkDeviceType = () => {
    const userAgent = navigator.userAgent || navigator.vendor || window.opera;
    return /android|ios|iphone|ipad|ipod/i.test(userAgent.toLowerCase());
  };

  const loadSavedWalletData = () => {
    const savedWallet = localStorage.getItem(WALLET_CONFIG.STORAGE_KEYS.WALLET);
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
        setWalletState({
          address: savedWallet,
          isConnected: !!savedWallet,
          session: '',
          userId: ''
        });
      }
    }
  };

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

  const handleWalletConnection = (walletAddress, userId, sessionId) => {
    setWalletState({
      address: walletAddress,
      isConnected: true,
      session: sessionId,
      userId: userId
    });
    
    localStorage.setItem(WALLET_CONFIG.STORAGE_KEYS.WALLET, JSON.stringify({
      wallet: walletAddress,
      userId: userId,
      session: sessionId
    }));
    
    WebApp.sendData(JSON.stringify({
      type: 'wallet_connected',
      wallet: walletAddress
    }));
  };

  const checkPhantomReturn = async () => {
    const startParam = WebApp.initDataUnsafe.start_param || 
                      new URLSearchParams(window.location.search).get('startapp');
    
    if (startParam?.length > 0) {
      try {
        const [encryptedData, publicKey, nonce] = startParam.split('_');
        if (encryptedData && publicKey && nonce) {
          localStorage.setItem(WALLET_CONFIG.STORAGE_KEYS.ENCRYPTED_DATA, encryptedData);
          localStorage.setItem(WALLET_CONFIG.STORAGE_KEYS.PUBLIC_KEY, publicKey); 
          localStorage.setItem(WALLET_CONFIG.STORAGE_KEYS.NONCE, nonce);
          
          const secretKeyBase58 = localStorage.getItem(WALLET_CONFIG.STORAGE_KEYS.CONNECTION_SECRET_KEY);
          if (secretKeyBase58) {
            try {
              const secretKey = bs58.decode(secretKeyBase58);
              const decryptedData = decryptPhantomData(encryptedData, publicKey, nonce, secretKey);
              
              if (decryptedData?.public_key) {
                localStorage.setItem("publicKey", decryptedData.public_key);
                localStorage.setItem("session", decryptedData.session || "");
                handleWalletConnection(decryptedData.public_key, "decrypted", decryptedData.session || "");
                return;
              }
            } catch (decryptError) {
              console.error("Failed to decrypt data:", decryptError);
            }
          }
          handleWalletConnection(publicKey, "from_encrypted", nonce);
          return;
        }
      } catch (err) {
        setError("Error parsing wallet connection data: " + err.message);
      }
    }
    
    // Check localStorage for existing connection
    const encryptedData = localStorage.getItem(WALLET_CONFIG.STORAGE_KEYS.ENCRYPTED_DATA);
    const publicKey = localStorage.getItem(WALLET_CONFIG.STORAGE_KEYS.PUBLIC_KEY);
    const nonce = localStorage.getItem(WALLET_CONFIG.STORAGE_KEYS.NONCE);
    
    if (encryptedData && publicKey && nonce) {
      const secretKeyBase58 = localStorage.getItem(WALLET_CONFIG.STORAGE_KEYS.CONNECTION_SECRET_KEY);
      if (secretKeyBase58) {
        try {
          const secretKey = bs58.decode(secretKeyBase58);
          const decryptedData = decryptPhantomData(encryptedData, publicKey, nonce, secretKey);
          
          if (decryptedData?.public_key) {
            handleWalletConnection(decryptedData.public_key, "decrypted_storage", decryptedData.session || "");
            return;
          }
        } catch (decryptError) {
          console.error("Failed to decrypt localStorage data:", decryptError);
        }
      }
      handleWalletConnection(publicKey, "from_storage", nonce);
    }
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
    const redirectUrl = `${WALLET_CONFIG.REDIRECT_BASE_URL}/phantom-callback.html`;
    const telegramData = encodeURIComponent(WebApp.initData);

    const secretKeyBase58 = bs58.encode(dappKeyPair.secretKey);
    localStorage.setItem(WALLET_CONFIG.STORAGE_KEYS.CONNECTION_SECRET_KEY, secretKeyBase58);
    localStorage.setItem(WALLET_CONFIG.STORAGE_KEYS.CONNECTION_PUBLIC_KEY, bs58.encode(dappKeyPair.publicKey));
    
    const params = new URLSearchParams({
      app_url: WALLET_CONFIG.APP_URL,
      dapp_encryption_public_key: bs58.encode(dappKeyPair.publicKey),
      redirect_link: `${redirectUrl}?tg_data=${telegramData}`,
      cluster: WALLET_CONFIG.CLUSTER,
    });

    return `${WALLET_CONFIG.PHANTOM_CONNECT_URL}/connect?${params.toString()}`;
  };

  const connectWallet = async () => {
    setIsLoading(true);
    setError('');
    
    try {
      if (isMobile) {
        const connectUrl = buildConnectURL();
        WebApp.openLink(connectUrl, { try_instant_view: false });
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
    localStorage.clear();
    setError('');
    
    WebApp.sendData(JSON.stringify({
      type: 'wallet_disconnected'
    }));
  };

  return {
    walletState,
    error,
    isLoading,
    isMobile,
    connectWallet,
    disconnectWallet
  };
};

export default usePhantomWallet; 