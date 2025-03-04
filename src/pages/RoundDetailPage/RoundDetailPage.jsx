import { ChevronLeft, MoreHorizontal } from "lucide-react";
import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useGameData } from "@/provider/GameDataProvider";
import { Header } from "@/components/Header";
import { UserProfileCard } from "@/components/UserProfileCard";
import { userTokenBalance } from "@/hook/userTokenBalance";
import { SolanaService } from "@/services/solanaService";
import { AccountDecoder } from "@/hook/UseMultiAccountSubscription";
import bs58 from "bs58";
import nacl from "tweetnacl";
import WebApp from '@twa-dev/sdk';
import { PublicKey } from "@solana/web3.js";

const RoundDetailPage = () => {
  const navigate = useNavigate();
  const { roundId } = useParams();
  const { roundsData, connection } = useGameData();
  const [currentRound, setCurrentRound] = useState(null);
  const [userPublicKey, setUserPublicKey] = useState("");
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [confirmedSlot, setConfirmedSlot] = useState(null);
  const [isJoining, setIsJoining] = useState(false);
  const userToken = userTokenBalance();
  const [dappKeyPair] = useState(() => {
    const savedKeyPair = localStorage.getItem("dapp_key_pair");
    if (savedKeyPair) {
      try {
        const parsed = JSON.parse(savedKeyPair);
        return {
          publicKey: new Uint8Array(Object.values(parsed.publicKey)),
          secretKey: new Uint8Array(Object.values(parsed.secretKey)),
        };
      } catch (e) {
        console.error("Failed to parse saved key pair", e);
        return nacl.box.keyPair();
      }
    } else {
      const newKeyPair = nacl.box.keyPair();
      localStorage.setItem(
        "dapp_key_pair",
        JSON.stringify({
          publicKey: Array.from(newKeyPair.publicKey),
          secretKey: Array.from(newKeyPair.secretKey),
        })
      );
      return newKeyPair;
    }
  });

  useEffect(() => {
    const pubKeyStr = localStorage.getItem("publicKey");
    if (pubKeyStr) {
      setUserPublicKey(pubKeyStr);
    }
  }, []);

  useEffect(() => {
    const round = roundsData.find((r) => r.id === roundId);
    if (round) {
      setCurrentRound(round);
     
    }
  }, [roundsData, roundId, navigate]);

  // Check for transaction result in URL parameters when page loads
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const transactionStatus = urlParams.get("tx_status");
    const signature = urlParams.get("signature");

    if (transactionStatus === "success" && signature) {
      setConfirmedSlot(Date.now()); // Use timestamp as placeholder for slot
      setShowConfirmation(false);
      setIsJoining(false);
      alert("Successfully joined round!");

      // Clear the URL parameters
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);

  const handleJoinClick = () => {
    setShowConfirmation(true);
  };

  const handleConfirmClick = async () => {
    try {
      setIsJoining(true);
      const pubKeyStr = localStorage.getItem("publicKey");
      if (!pubKeyStr) {
        alert("Please connect your wallet first");
        setIsJoining(false);
        return;
      }
    

      // Detect if we're running inside Telegram
      const isTelegram = window.Telegram && window.Telegram.WebApp;

      // Check if browser extension is available for direct connection
      const hasPhantomExtension = window.solana && window.solana.isPhantom;
      console.log(`Is Telegram ${isTelegram}`)
      console.log(`hasPhantomExtension ${!hasPhantomExtension}`)
      if (isTelegram && !hasPhantomExtension) {
        // If in Telegram OR no extension available, use deep link flow
        const sessionToken = localStorage.getItem("session");
        if (!sessionToken) {
          alert("No wallet session found. Please reconnect your wallet.");
          setIsJoining(false);
          return;
        }
        await handleMobileTransaction(pubKeyStr, sessionToken);
      } else {
        // Browser extension flow is only used when extension is detected
        await handleBrowserTransaction(pubKeyStr);
      }
    } catch (error) {
      console.error("Failed to join round:", error);
      if (error.message.includes("User rejected")) {
        alert("Transaction was rejected by the user");
      } else {
        alert("Failed to join round: " + error.message);
      }
      setIsJoining(false);
    }
  };

  const handlePhantomTransactionReturn = (startParam) => {
    try {
      if (!startParam) return { success: false, error: "No transaction data found" };
  
      // Check if it starts with tx_ prefix
      if (!startParam.startsWith('tx_')) {
        return { success: false, error: "Invalid transaction data format" };
      }
  
      // Remove tx_ prefix
      const transactionData = startParam.substring(3);
      
      // Check if this is a shortened "success" message
      if (transactionData.startsWith('success_')) {
        // This is a shortened success message
        // Try to retrieve full data from localStorage
        const encryptedData = localStorage.getItem('phantom_transaction_data');
        const nonce = localStorage.getItem('phantom_transaction_nonce');
        
        if (!encryptedData || !nonce) {
          return { 
            success: true, 
            shortFormat: true,
            error: "Transaction was successful but full data is not available"
          };
        }
        
        return {
          success: true,
          shortFormat: true,
          encryptedData,
          nonce
        };
      }
      
      // This should be the full format: encrypted_data_nonce
      const parts = transactionData.split('_');
      if (parts.length >= 2) {
        // Last part is the nonce, everything before the last _ is the encrypted data
        // (in case encrypted data itself contains underscores)
        const nonce = parts[parts.length - 1];
        const encryptedData = parts.slice(0, parts.length - 1).join('_');
        
        return {
          success: true,
          shortFormat: false,
          encryptedData,
          nonce
        };
      }
      
      return { success: false, error: "Invalid transaction data format" };
    } catch (error) {
      console.error("Error processing transaction return:", error);
      return { success: false, error: error.message };
    }
  };

  const decryptTransactionData = (encryptedData, nonce) => {
    try {
      // Get the necessary keys from localStorage
      const secretKeyBase58 = localStorage.getItem("phantom_connection_secret_key");
      if (!secretKeyBase58) {
        throw new Error("Secret key not found. Please reconnect your wallet.");
      }
      
      const phantomPublicKey = localStorage.getItem("phantom_public_key");
      if (!phantomPublicKey) {
        throw new Error("Phantom public key not found. Please reconnect your wallet.");
      }
      
      // Decode from base58
      const secretKey = bs58.decode(secretKeyBase58);
      const phantomPublicKeyBytes = bs58.decode(phantomPublicKey);
      const nonceBytes = bs58.decode(nonce);
      const encryptedDataBytes = bs58.decode(encryptedData);
      
      // Create shared secret
      const sharedSecret = nacl.box.before(phantomPublicKeyBytes, secretKey);
      
      // Decrypt the data
      const decryptedBytes = nacl.box.open.after(encryptedDataBytes, nonceBytes, sharedSecret);
      if (!decryptedBytes) {
        throw new Error("Failed to decrypt transaction data");
      }
      
      // Parse the JSON
      const decryptedString = new TextDecoder().decode(decryptedBytes);
      return JSON.parse(decryptedString);
    } catch (error) {
      console.error("Error decrypting transaction data:", error);
      throw error;
    }
  };

  useEffect(() => {
    // Get startapp parameter from Telegram WebApp
    const startParam = WebApp.initDataUnsafe.start_param || 
                      new URLSearchParams(window.location.search).get('startapp');
    alert("Start param: " + startParam);
    
    if (startParam && startParam.startsWith('tx_')) {
      try {
        const transactionData = handlePhantomTransactionReturn(startParam);
        
        if (transactionData.success) {
          if (transactionData.encryptedData && transactionData.nonce) {
            const decryptedData = decryptTransactionData(
              transactionData.encryptedData, 
              transactionData.nonce
            );
            
            // Handle successful transaction
            if (decryptedData.signature) {
              setConfirmedSlot(Date.now());
              setIsJoining(false);
              alert("Successfully joined round with signature: " + decryptedData.signature);
            }
          } else {
            // Handle success but no data case
            setConfirmedSlot(Date.now());
            setIsJoining(false);
            alert("Successfully joined round!");
          }
        }
      } catch (error) {
        console.error("Failed to process transaction return:", error);
        alert("Error processing transaction: " + error.message);
      }
    }
  }, []);

  const handleMobileTransaction = async (pubKeyStr, sessionToken) => {
    try {
  
      // Create the transaction
      const transaction = await SolanaService.createJoinRoundTransaction({
        connection,
        roundId,
        playerKey: pubKeyStr,
        tokenMint: userToken.mint,
      });
  
      // Serialize the transaction
      const serializedTxn = transaction.serialize({ requireAllSignatures: false });
      const serializedTransaction = bs58.encode(serializedTxn);
      
      // Create payload
      const payload = {
        session: sessionToken,
        transaction: serializedTransaction
      };
      
      // Get necessary items from localStorage for encryption
      const phantomPublicKey = localStorage.getItem("phantom_public_key");
      if (!phantomPublicKey) {
        throw new Error("Phantom public key not found. Please reconnect your wallet.");
      }
      
      const secretKeyBase58 = localStorage.getItem("phantom_connection_secret_key");
      if (!secretKeyBase58) {
        throw new Error("DApp secret key not found. Please reconnect your wallet.");
      }
      
      // Create shared secret on the fly, similar to the wallet connection flow
      const secretKey = bs58.decode(secretKeyBase58);
      const phantomPublicKeyBytes = bs58.decode(phantomPublicKey);
      const sharedSecret = nacl.box.before(phantomPublicKeyBytes, secretKey);
      
      // Encrypt payload
      const nonce = nacl.randomBytes(24);
      const messageBytes = Buffer.from(JSON.stringify(payload));
      const encryptedPayloadBytes = nacl.box.after(messageBytes, nonce, sharedSecret);
      
      // Get dapp public key
      const dappPublicKey = localStorage.getItem("phantom_connection_public_key");
      if (!dappPublicKey) {
        throw new Error("DApp public key not found. Please reconnect your wallet.");
      }
      
      // Prepare redirect URL
      const redirectUrl = "https://thealphanova.com/phantom-transaction.html";
      localStorage.setItem("current_round_id", roundId);
      
      // Construct deep link URL for Phantom
      const baseUrl = "https://phantom.app/ul/v1/signAndSendTransaction";
      const params = new URLSearchParams({
        dapp_encryption_public_key: dappPublicKey,
        nonce: bs58.encode(nonce),
        redirect_link: redirectUrl,
        payload: bs58.encode(encryptedPayloadBytes)
      });
      
      const phantomUrl = `${baseUrl}?${params.toString()}`;
      console.log("Opening Phantom URL:", phantomUrl);
      
      // Open in Telegram mini app browser
      WebApp.openLink(phantomUrl, {
        try_instant_view: false
      });
      navigate(`/waiting-turn-page/${roundId}`);
    } catch (error) {
      console.error("Mobile transaction error:", error);
      alert("Transaction error: " + error.message);
      throw error;
    }
  };

  // Handle transaction through Phantom browser extension
  const handleBrowserTransaction = async (pubKeyStr) => {
    try {
      setIsJoining(true);
  
      const pubKeyStr = localStorage.getItem("publicKey");
      if (!pubKeyStr) {
        alert('Please connect your wallet first');
        return;
      }
      if (!window.solana || !window.solana.isPhantom) {
        alert('Please install Phantom wallet');
        return;
      }

      if (!window.solana.isConnected) {
        try {
          await window.solana.connect();
        } catch (err) {
          console.error('Failed to connect wallet:', err);
          alert('Failed to connect wallet. Please try again.');
          return;
        }
      }

      const connectedPubKey = window.solana.publicKey.toString();
      if (connectedPubKey !== pubKeyStr) {
        alert('Connected wallet does not match stored wallet. Please reconnect.');
        return;
      }

      const transaction = await SolanaService.createJoinRoundTransaction({
        connection,
        roundId,
        playerKey: pubKeyStr,
        tokenMint: userToken.mint
      });

      await new Promise(resolve => setTimeout(resolve, 500));

      const signed = await window.solana.signTransaction(transaction);
      console.log(`Signed ${JSON.stringify(signed)}`)
      console.log(`Signed Serialize ${signed.serialize()}`)
      const signature = await connection.sendRawTransaction(signed.serialize());
      
      const confirmation = await connection.confirmTransaction(signature);
      if (confirmation.value.err) {
        throw new Error('Transaction failed: ' + JSON.stringify(confirmation.value.err));
      }

      const { slot } = await AccountDecoder.subscribeToSignature(connection, signature);
      setConfirmedSlot(slot);
      setShowConfirmation(false);
      alert('Successfully joined round!');
      navigate(`/waiting-turn-page/${roundId}`);
    } catch (error) {
      console.error('Failed to join round:', error);
      if (error.message.includes('User rejected')) {
        alert('Transaction was rejected by the user');
      } else {
        alert('Failed to join round: ' + error.message);
      }
    } finally {
      setIsJoining(false);
    }
  };

  const handleCancelClick = () => {
    setShowConfirmation(false);
  };

  if (!currentRound) {
    return (
      <div
        className="h-screen w-full flex items-center justify-center text-white"
        style={{ backgroundColor: "#4400CE" }}
      >
        Loading...
      </div>
    );
  }

  const renderJoinButton = () => {
    if (isJoining) {
      return (
        <button className="w-full bg-transparent border border-black rounded-xl p-4 text-white text-xl text-center">
          <div className="flex items-center justify-center gap-2">
            <span>Joining Round...</span>
            <div className="animate-spin rounded-full h-4 w-4 border-2 border-white"></div>
          </div>
        </button>
      );
    }

    if (confirmedSlot) {
      return (
        <div>
          <button className="w-full bg-transparent border border-black rounded-xl p-4 text-green-400 text-xl text-center">
            Joined ({currentRound.entryFees?.toString() || "0"} $ELON)
          </button>
          <div className="text-center text-white mt-2 text-sm">
            Confirmed at slot:{" "}
            {typeof confirmedSlot === "number" ? confirmedSlot : "Unknown"}
          </div>
        </div>
      );
    }

    if (showConfirmation) {
      return (
        <div className="flex gap-4">
          <button
            onClick={handleCancelClick}
            className="flex-1 bg-transparent border border-black rounded-xl p-4 text-white text-xl text-center"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirmClick}
            className="flex-1 bg-transparent border border-black rounded-xl p-4 text-white text-xl text-center"
          >
            Confirm
          </button>
        </div>
      );
    }

    return (
      <button
        onClick={handleJoinClick}
        className="w-full bg-transparent border border-black rounded-xl p-4 text-white text-xl text-center"
      >
        Join ({currentRound.entryFees?.toString() || "0"} $ELON)
      </button>
    );
  };

  return (
    <div
      className="h-screen w-full flex flex-col"
      style={{ backgroundColor: "#4400CE" }}
    >
      <Header />
      <div className="flex-1 p-4 space-y-4">
        <UserProfileCard />

        <div className="bg-transparent border border-black rounded-xl p-4 text-white">
          <div className="flex justify-between items-center mb-2">
            <span>{`${currentRound.players?.length || 0}/${
              currentRound.maxPlayers
            } Remaining`}</span>
            <span>in 25m10</span>
          </div>
          <div className="text-center text-2xl font-medium">Today 13:00:00</div>
        </div>

        <div className="bg-transparent border border-black rounded-xl p-4 text-white">
          {showConfirmation ? (
            <div className="text-center space-y-2">
              <div className="text-2xl font-medium">
                Are you sure do you want to join round?
              </div>
              <div className="text-xl">
                Entry Fee: {currentRound.entryFees?.toString() || "0"} $ELON
              </div>
              <div className="text-xl">
                Your Balance: {userToken.uiAmountString} ${userToken.symbol}
              </div>
              <div className="text-xl">Winner: 50,000 $ELON</div>
            </div>
          ) : (
            <div className="text-center space-y-2">
              <div className="text-2xl font-medium">5 Rounds</div>
              <div className="text-xl">Winner: 50,000 $ELON</div>
              <div className="text-xl">Round 4: 10,000 $ELON</div>
              <div className="text-xl">Round 3: 1,000 $ELON</div>
              <div className="text-xl">Round 2: 100 $ELON</div>
              <div className="text-xl">RTP: 100%</div>
            </div>
          )}
        </div>

        <div className="space-y-4">
          {renderJoinButton()}
          <button className="w-full bg-transparent border border-black rounded-xl p-4 text-white text-xl text-center">
            Set Reminder
          </button>
        </div>
      </div>
    </div>
  );
};

export default RoundDetailPage;
