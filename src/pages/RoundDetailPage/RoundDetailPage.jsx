import { ChevronLeft, MoreHorizontal } from 'lucide-react';
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useGameData } from '@/provider/GameDataProvider';
import { Header } from '@/components/Header';
import {UserProfileCard} from '@/components/UserProfileCard';
import { userTokenBalance } from '@/hook/userTokenBalance';
import {SolanaService} from "@/services/solanaService";
import { AccountDecoder } from "@/hook/UseMultiAccountSubscription";

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

  useEffect(() => {
    const pubKeyStr = localStorage.getItem("publicKey");
    if (pubKeyStr) {
      setUserPublicKey(pubKeyStr);
    }
  }, []);

  useEffect(() => {
    const round = roundsData.find(r => r.id === roundId);
    if (round) {
      setCurrentRound(round);
      if (round.state === "Playing") {
        console.log("Round is now playing, navigating to game board...");
        navigate(`/turn-page/${roundId}`);
      }
    }
  }, [roundsData, roundId, navigate]);

  const handleJoinClick = () => {
    setShowConfirmation(true);
  };

  const handleConfirmClick = async () => {
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
      const signature = await connection.sendRawTransaction(signed.serialize());
      
      const confirmation = await connection.confirmTransaction(signature);
      if (confirmation.value.err) {
        throw new Error('Transaction failed: ' + JSON.stringify(confirmation.value.err));
      }

      const { slot } = await AccountDecoder.subscribeToSignature(connection, signature);
      setConfirmedSlot(slot);
      setShowConfirmation(false);
      alert('Successfully joined round!');
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
      <div className="h-screen w-full flex items-center justify-center text-white" 
          style={{ backgroundColor: '#4400CE' }}>
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
            Confirmed at slot: {confirmedSlot}
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
    <div className="h-screen w-full flex flex-col" style={{ backgroundColor: '#4400CE' }}>
      <Header/>
      <div className="flex-1 p-4 space-y-4">
        <UserProfileCard />

        <div className="bg-transparent border border-black rounded-xl p-4 text-white">
          <div className="flex justify-between items-center mb-2">
            <span>{`${currentRound.players?.length || 0}/${currentRound.maxPlayers} Remaining`}</span>
            <span>in 25m10</span>
          </div>
          <div className="text-center text-2xl font-medium">
            Today 13:00:00
          </div>
        </div>

        <div className="bg-transparent border border-black rounded-xl p-4 text-white">
          {showConfirmation ? (
            <div className="text-center space-y-2">
              <div className="text-2xl font-medium">Are you sure do you want to join round ?</div>
              <div className="text-xl">Entry Fee : {currentRound.entryFees.toString() || "0"} $ELON</div>
              <div className="text-xl">Your Balance: {userToken.uiAmountString} ${userToken.symbol}</div>
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