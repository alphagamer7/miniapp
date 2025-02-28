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
      if (round.state === "Playing") {
        console.log("Round is now playing, navigating to game board...");
        navigate(`/turn-page/${roundId}`);
      }
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

      const sessionToken = localStorage.getItem("session");
      if (!sessionToken) {
        alert("No wallet session found. Please reconnect your wallet.");
        setIsJoining(false);
        return;
      }

      // Detect if we're running inside Telegram
      const isTelegram = window.Telegram && window.Telegram.WebApp;

      // Check if browser extension is available for direct connection
      const hasPhantomExtension = window.solana && window.solana.isPhantom;

      if (isTelegram || !hasPhantomExtension) {
        // If in Telegram OR no extension available, use deep link flow
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

  const handleMobileTransaction = async (pubKeyStr, sessionToken) => {
    try {
      alert("Starting mobile transaction flow");
  
      // Create the transaction
      const transaction = await SolanaService.createJoinRoundTransaction({
        connection,
        roundId,
        playerKey: pubKeyStr,
        tokenMint: userToken.mint,
      });
  
      alert(
        `Transaction created:\nFeePayer: ${transaction.feePayer?.toBase58()}\nRecentBlockhash: ${
          transaction.recentBlockhash
        }\nInstructions: ${transaction.instructions.length}`
      );
  
      // Serialize the transaction
      const serializedTxn = transaction.serialize({ requireAllSignatures: false });
      alert("Transaction serialized. Please confirm in your wallet.");
      const serializedTransaction = bs58.encode(serializedTxn);
      alert("Serialized transaction: " + serializedTransaction);
  
      // Get stored values
      const dappEncryptionPublicKey = localStorage.getItem("phantom_connection_public_key");
      if (!dappEncryptionPublicKey) {
        throw new Error("DApp encryption public key not found. Please reconnect your wallet.");
      }
  
      const userPublicKey = localStorage.getItem("publicKey");
      if (!userPublicKey) {
        throw new Error("User public key not found. Please reconnect your wallet.");
      }
  
      const nonce = localStorage.getItem("phantom_nonce");
      if (!nonce) {
        throw new Error("Nonce not found. Please reconnect your wallet.");
      }
  
      const secretKeyBase58 = localStorage.getItem("phantom_connection_secret_key");
      if (!secretKeyBase58) {
        throw new Error("DApp secret key not found. Please reconnect your wallet.");
      }
  
      // Decode keys and nonce
      const secretKey = bs58.decode(secretKeyBase58);
      const nonceBytes = bs58.decode(nonce);
      const userPublicKeyBytes = bs58.decode(userPublicKey);
  
      // Validate lengths
      if (secretKey.length !== 32) {
        throw new Error(`Invalid secret key length: ${secretKey.length}, expected 32`);
      }
      if (userPublicKeyBytes.length !== 32) {
        throw new Error(`Invalid user public key length: ${userPublicKeyBytes.length}, expected 32`);
      }
      if (nonceBytes.length !== 24) {
        throw new Error(`Invalid nonce length: ${nonceBytes.length}, expected 24`);
      }
  
      alert(
        `Keys validated:\nDApp Public Key: ${dappEncryptionPublicKey}\nUser Public Key: ${userPublicKey}\nNonce: ${nonce}`
      );
  
      // Create payload
      const payload = {
        transaction: serializedTransaction,
        session: sessionToken,
      };
      const payloadString = JSON.stringify(payload);
      alert("Payload before encryption: " + payloadString);
  
      // Encrypt payload
      const messageBytes = new TextEncoder().encode(payloadString);
      const sharedSecret = nacl.box.before(userPublicKeyBytes, secretKey);
      const encryptedPayloadBytes = nacl.box.after(messageBytes, nonceBytes, sharedSecret);
  
      if (!encryptedPayloadBytes) {
        throw new Error(
          "Encryption failed. Check key pair or nonce.\n" +
            `Secret key length: ${secretKey.length}\nUser PK length: ${userPublicKeyBytes.length}\nNonce length: ${nonceBytes.length}`
        );
      }
      const encryptedPayload = bs58.encode(encryptedPayloadBytes);
      // alert("Encrypted payload: " + encryptedPayload);
  
      const redirectUrl = "https://thealphanova.com/phantom-transaction.html";
      localStorage.setItem("current_round_id", roundId);
  
      const baseUrl = "https://phantom.app/ul/v1/signAndSendTransaction";
      const params = new URLSearchParams({
        dapp_encryption_public_key: dappEncryptionPublicKey,
        nonce: nonce,
        redirect_link: redirectUrl,
        payload: payloadString,
      });
  
      const phantomUrl = `${baseUrl}?${params.toString()}`;
      // alert(`Generated Phantom URL (truncated): ${phantomUrl.substring(0, 100)}...`);
  
      // Open in Telegram
      // WebApp.openLink(phantomUrl);
       WebApp.openLink(phantomUrl, {
                try_instant_view: false
              });
    } catch (error) {
      console.error("Mobile transaction error:", error);
      alert("Transaction error: " + error.message);
      throw error;
    }
  };

  // Handle transaction through Phantom browser extension
  const handleBrowserTransaction = async (pubKeyStr) => {
    try {
      if (!window.solana || !window.solana.isPhantom) {
        alert("Please install Phantom wallet");
        setIsJoining(false);
        return;
      }

      if (!window.solana.isConnected) {
        try {
          await window.solana.connect();
        } catch (err) {
          console.error("Failed to connect wallet:", err);
          alert("Failed to connect wallet. Please try again.");
          setIsJoining(false);
          return;
        }
      }

      const connectedPubKey = window.solana.publicKey.toString();
      if (connectedPubKey !== pubKeyStr) {
        alert(
          "Connected wallet does not match stored wallet. Please reconnect."
        );
        setIsJoining(false);
        return;
      }

      const transaction = await SolanaService.createJoinRoundTransaction({
        connection,
        roundId,
        playerKey: pubKeyStr,
        tokenMint: userToken.mint,
      });

      await new Promise((resolve) => setTimeout(resolve, 500));

      const signed = await window.solana.signTransaction(transaction);
      const signature = await connection.sendRawTransaction(signed.serialize());

      const confirmation = await connection.confirmTransaction(signature);
      if (confirmation.value.err) {
        throw new Error(
          "Transaction failed: " + JSON.stringify(confirmation.value.err)
        );
      }

      const { slot } = await AccountDecoder.subscribeToSignature(
        connection,
        signature
      );
      setConfirmedSlot(slot);
      setShowConfirmation(false);
      setIsJoining(false);
      alert("Successfully joined round!");
    } catch (error) {
      console.error("Browser transaction error:", error);
      throw error;
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
