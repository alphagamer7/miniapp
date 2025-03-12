import React, { useState, useEffect } from 'react';
import { AlertCircle, Trophy } from 'lucide-react';
import { useGameData } from '@/provider/GameDataProvider';
import WebApp from '@twa-dev/sdk';
import { useNavigate } from 'react-router-dom';
import Lottie from 'lottie-react';
import animationData from '@/assets/WaitingClock.json'

const WaitingTurnPage = () => {
  const navigate = useNavigate();
  // Get round ID from URL
  const roundId = window.location.pathname.split('/').pop();
  
  // State
  const [currentRound, setCurrentRound] = useState(null);
  const [showCountdown, setShowCountdown] = useState(true);
  const [userPubKey, setUserPubKey] = useState("");
  const [userPlayerIndex, setUserPlayerIndex] = useState(-1);
  const [userImage, setUserImage] = useState("");
  const [showAllPlayers, setShowAllPlayers] = useState(true);
  const [timeRemaining, setTimeRemaining] = useState('');


  // Get game data from context
  const { roundsData, connection } = useGameData();

  // Load user public key and image from Telegram
  useEffect(() => {
    const pubKeyStr = localStorage.getItem("publicKey");
    const initData = WebApp.initDataUnsafe;
    if (initData && initData.user) {
      setUserImage(initData.user.photo_url || "");
    }
    setUserPubKey(pubKeyStr || "");
  }, []);

  // Load round data when roundsData or roundId changes
  useEffect(() => {
    const round = roundsData.find(r => r.id === roundId);
    console.log(`Round ${JSON.stringify(round)}`)
    if (round) {
      setCurrentRound(round);
      if (round.state === "Playing" || round.state === "Resulted") {
        console.log("Round is now playing, navigating to game board...");
        navigate(`/turn-page/${roundId}`);
      }
    }
  }, [roundId, roundsData]);

  // Find user index when currentRound or userPubKey changes
  useEffect(() => {
    if (currentRound && userPubKey) {
      const userIndex = currentRound.players.findIndex(playerKey => playerKey === userPubKey);
      setUserPlayerIndex(userIndex);
    }
  }, [currentRound, userPubKey]);


 
  useEffect(() => {
    // Only create this effect once currentRound is available
    if (!currentRound || !currentRound.scheduleStartTime) {
      // Set a default value when data isn't available yet
      setTimeRemaining('Waiting for data...');
      return;
    }
    
    // Function that updates the countdown
    function updateCountdown() {
      try {
        const currentTime = Math.floor(Date.now() / 1000);
        const targetTime = parseInt(currentRound.scheduleStartTime);
        
        // Calculate time difference in seconds
        let diff = targetTime - currentTime;
        
        // Handle countdown complete
        if (diff <= 0) {
          setTimeRemaining('Countdown finished');
          return;
        }
        
        // Calculate days, hours, minutes, seconds
        const days = Math.floor(diff / (24 * 60 * 60));
        diff -= days * 24 * 60 * 60;
        
        const hours = Math.floor(diff / (60 * 60));
        diff -= hours * 60 * 60;
        
        const minutes = Math.floor(diff / 60);
        diff -= minutes * 60;
        
        const seconds = diff;
        
        // Format the countdown string
        let countdownStr = '';
        if (days > 0) countdownStr += `${days} day${days !== 1 ? 's' : ''} `;
        if (hours > 0 || days > 0) countdownStr += `${hours} hour${hours !== 1 ? 's' : ''} `;
        if (minutes > 0 || hours > 0 || days > 0) countdownStr += `${minutes} minute${minutes !== 1 ? 's' : ''} `;
        countdownStr += `${seconds} second${seconds !== 1 ? 's' : ''}`;
        
        setTimeRemaining(countdownStr);
      } catch (error) {
        console.error("Error updating countdown:", error);
        setTimeRemaining("Error calculating time");
      }
    }
    
    // Do initial update
    updateCountdown();
    
    // Set up interval - store reference for cleanup
    const timer = setInterval(updateCountdown, 1000);
    
    // Return cleanup function
    return () => {
      clearInterval(timer);
    };
  }, [currentRound?.scheduleStartTime]); // Only depend on this specific property

  // Return loading state if round data not available yet
  if (!currentRound) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-[#4400CE]">
        <div className="text-white text-xl">Loading game data...</div>
      </div>
    );
  }
  const LottieAnimation = () => {
    return (
      <div className="lottie-container w-full h-64 flex items-center justify-center">
        <Lottie 
          animationData={animationData} 
          loop={true}
          autoplay={true}
          style={{ width: '200px', height: '200px' }}
          rendererSettings={{
            preserveAspectRatio: 'xMidYMid meet'
          }}
          speed={1}
        />
      </div>
    );
  };

  const calculateGridConfig = (totalPlayers) => {
    if (totalPlayers <= 49) {
      return {
        totalSlots: totalPlayers,
        playersPerSlot: 1,
        gridCols: Math.min(7, Math.ceil(Math.sqrt(totalPlayers)))
      };
    }
    
    return {
      totalSlots: 49,
      playersPerSlot: Math.ceil(totalPlayers / 49),
      gridCols: 7
    };
  };

  const getAllPlayerIndexes = () => {
    return Array.from({ length: currentRound.players.length }, (_, i) => i);
  };
  function formatTimestamp(timestamp) {
    const date = new Date(parseInt(timestamp) * 1000);
    
    // Array of month names
    const months = [
      'January', 'February', 'March', 'April', 'May', 'June', 
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
    
    const day = date.getDate();
    const month = months[date.getMonth()];
    const year = date.getFullYear();
    
    // Format time with leading zeros where needed
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    const seconds = date.getSeconds().toString().padStart(2, '0');
    
    return `${day} ${month} ${year} ${hours}:${minutes}:${seconds}`;
  }

  // Always use all player indexes for the grid, but mark eliminated ones
  const displayPlayerIndexes = getAllPlayerIndexes();
  const gridConfig = calculateGridConfig(displayPlayerIndexes.length);
  


  return (
    <div className="min-h-screen w-full flex flex-col bg-[#4400CE] overflow-auto">
      {/* Round Info */}
      <div className="p-4">
        <div className="bg-transparent border border-white/20 rounded-xl p-4 text-white">
          <div className="text-center text-2xl text-white">
            Current Player: Player {userPlayerIndex + 1}
          </div>
          <div className="text-center text-2xl text-white">
            Total: {currentRound.players.length} Players
          </div>
        </div>
      </div>

      {/* Game Grid */}
      <div className="px-4 flex-1">
        <div className="grid grid-cols-7 gap-2 mb-4">
          {Array(gridConfig.totalSlots).fill(null).map((_, gridIndex) => {
            // If we have fewer players than grid slots, only show slots up to player count
            if (gridIndex >= displayPlayerIndexes.length) {
              return <div key={gridIndex} className="aspect-square" />;
            }
            
            // Get the actual player index for this grid position
            const playerIndex = displayPlayerIndexes[gridIndex];
            
            // Check if this is the current user
            const isUserPosition = playerIndex === userPlayerIndex ;
            
            return (
              <div key={gridIndex} className="aspect-square">
                {isUserPosition ? (
                  <div className={`w-full h-full rounded-full overflow-hidden ${
                   'bg-yellow-500'
                  }`}>
                    <img 
                      src={userImage || "https://i1.sndcdn.com/avatars-000706728712-ol0h4p-t500x500.jpg"} 
                      alt="User"
                      className="w-full h-full object-cover"
                    />
                  </div>
                ) : (
                  <div className={`w-full h-full rounded-full flex items-center justify-center text-xs overflow-hidden bg-white/80`}>
                    <span className={`text-gray-800`}>
                      P{playerIndex + 1}
                    </span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
      {currentRound.state !== "Started" && (
        <div className="w-full">
          <LottieAnimation/>
        </div>
      )}
      {/* Bottom Section */}
      <div className="w-full px-4 pb-8">
        <div className="w-full">
            <div className="bg-transparent border border-white/20 rounded-xl p-4">
            <div className="text-center text-white text-xl font-bold">
                {currentRound.state === "Started" ? (
                  "Turn is starting please wait..."
                ) : (
                  <>
                    Game Will Start
                    <br></br>{currentRound?.scheduleStartTime ? formatTimestamp(currentRound.scheduleStartTime) : "Loading..."}
                    <br></br>{timeRemaining || "Calculating..."}
                  </>
                )}
            </div>
            </div>
        </div>
      </div>
    </div>
  );
};

export default WaitingTurnPage;