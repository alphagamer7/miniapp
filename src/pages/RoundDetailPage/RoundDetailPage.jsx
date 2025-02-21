import { ChevronLeft, MoreHorizontal } from 'lucide-react';
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useGameData } from '@/provider/GameDataProvider';
import { Header } from '@/components/Header';
import {UserProfileCard} from '@/components/UserProfileCard';
import { userTokenBalance } from '@/hook/userTokenBalance';
import {SolanaService} from "@/services/solanaService";
const RoundDetailPage = () => {
      const navigate = useNavigate();
  const { roundId } = useParams();
  const { roundsData,connection } = useGameData();
  const [currentRound, setCurrentRound] = useState(null);
  const [userPublicKey, setUserPublicKey] = useState("");
  const [showConfirmation, setShowConfirmation] = useState(false);
  const userToken = userTokenBalance(); 

  useEffect(() => {
    const pubKeyStr = localStorage.getItem("publicKey");
    if (pubKeyStr) {
      setUserPublicKey(pubKeyStr);
    }
  }, []);

  // Update currentRound whenever roundsData changes
  useEffect(() => {
    const round = roundsData.find(r => r.id === roundId);
    if (round) {
      setCurrentRound(round);
      
      // Check if round state is "Playing" and navigate
      if (round.state === "Playing") {
        console.log("Round is now playing, navigating to game board...");
        navigate(`/turn-page/${roundId}`);
      }
    }
  }, [roundsData, roundId, navigate]);
  if (!currentRound) {
    return <div className="h-screen w-full flex items-center justify-center text-white" 
                style={{ backgroundColor: '#4400CE' }}>
      Loading...
    </div>;
  }
 
  const handleJoinClick = () => {
    setShowConfirmation(true);
  };

  const handleConfirmClick = async () => {
    console.log('Confirmed joining round:', roundId);
   
    try {
      console.log('Starting join round process for roundId:', roundId);
      
      const pubKeyStr = localStorage.getItem("publicKey");
      if (!pubKeyStr) {
        alert('Please connect your wallet first');
        return;
      }
  
      if (!window.solana) {
        alert('Solana wallet is not installed');
        return;
      }
  
      const transaction = await SolanaService.createJoinRoundTransaction({
        connection,
        roundId,
        playerKey: pubKeyStr,
        tokenMint: userToken.mint
      });
  
      console.log('Transaction created, requesting signature...');
      const signed = await window.solana.signTransaction(transaction);
      
      console.log('Transaction signed, sending to network...');
      const signature = await connection.sendRawTransaction(signed.serialize());
      
      console.log('Transaction sent, awaiting confirmation...');
      const confirmation = await connection.confirmTransaction(signature);
      
      if (confirmation.value.err) {
        throw new Error('Transaction failed: ' + JSON.stringify(confirmation.value.err));
      }
  
      console.log('Transaction confirmed:', signature);
      setShowConfirmation(false);
      alert('Successfully joined round!');
    } catch (error) {
      console.error('Failed to join round:', error);
      if (error.message.includes('User rejected')) {
        alert('Transaction was rejected by the user');
      } else {
        alert('Failed to join round: ' + error.message);
      }
    }
  };

   
  const handleCancelClick = () => {
    setShowConfirmation(false);
  };
  return (
    <div className="h-screen w-full flex flex-col" style={{ backgroundColor: '#4400CE' }}>
    
      {/* Header */}
      <Header/>

      {/* Content */}
      <div className="flex-1 p-4 space-y-4">
        {/* Balance Card */}
        <UserProfileCard />

        {/* Game Status Card */}
        <div className="bg-transparent border border-black rounded-xl p-4 text-white">
          <div className="flex justify-between items-center mb-2">
            <span>{`${currentRound.players?.length || 0}/${currentRound.maxPlayers} Remaining`}</span>
            <span>in 25m10</span>
          </div>
          <div className="text-center text-2xl font-medium">
            Today 13:00:00
          </div>
        </div>

        {/* Prize Distribution Card */}
        <div className="bg-transparent border border-black rounded-xl p-4 text-white">
          {showConfirmation ? (
            <div className="text-center space-y-2">
            <div className="text-2xl font-medium">Are you sure do you want to join round ?</div>
            <div className="text-xl">Entry Fee : {currentRound.entryFees.toString() || "0"} $ELON</div>
            <div className="text-xl">Your Balance: {userToken.uiAmountString} ${userToken.symbol}</div>
            <div className="text-xl">Winner: 50,000 $ELON</div>
          </div>
          ):(
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

        {/* Action Buttons */}
        <div className="space-y-4">
        {currentRound.players.includes(userPublicKey) ? (
            <button className="w-full bg-transparent border border-black rounded-xl p-4 text-green-400 text-xl text-center">
              Joined ({currentRound.entryFees?.toString() || "0"} $ELON)
            </button>
          ) : (
            showConfirmation ? (
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
            ) : (
              <button 
                onClick={handleJoinClick}
                className="w-full bg-transparent border border-black rounded-xl p-4 text-white text-xl text-center"
              >
                Join ({currentRound.entryFees?.toString() || "0"} $ELON)
              </button>
            )
          )}
       
          <button className="w-full bg-transparent border border-black rounded-xl p-4 text-white text-xl text-center">
            Set Reminder
          </button>
        </div>
      </div>
    </div>
  );
};

export default RoundDetailPage;