import React, { useState, useEffect } from 'react';
import { AlertCircle, Trophy } from 'lucide-react';
import { useGameData } from '@/provider/GameDataProvider';
import WebApp from '@twa-dev/sdk';
import { useNavigate } from 'react-router-dom';

const TurnPage = () => {
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
    if (round) {
      setCurrentRound(round);
    }
  }, [roundId, roundsData]);

  // Find user index when currentRound or userPubKey changes
  useEffect(() => {
    if (currentRound && userPubKey) {
      const userIndex = currentRound.players.findIndex(playerKey => playerKey === userPubKey);
      setUserPlayerIndex(userIndex);
    }
  }, [currentRound, userPubKey]);

  // Handle turn countdown and player grid transitions
  useEffect(() => {
    if (showCountdown && currentRound) {
      const timer = setTimeout(() => {
        setShowCountdown(false);
        
        // Automatically show next turn countdown after a delay if not on final turn
        if (currentRound.currentTurn < currentRound.totalTurns) {
          setTimeout(() => {
            setShowCountdown(true);
          }, 3000);
        }
      }, 3000);

      return () => clearTimeout(timer);
    }
  }, [showCountdown, currentRound]);

  // Return loading state if round data not available yet
  if (!currentRound) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-[#4400CE]">
        <div className="text-white text-xl">Loading game data...</div>
      </div>
    );
  }

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

  const getEliminatedPlayerIndexes = () => {
    if (!currentRound.turnInfo || currentRound.turnInfo.length === 0) {
      return [];
    }
    
    // Combine all eliminated players from all turns
    let eliminatedIndexes = [];
    for (const turn of currentRound.turnInfo) {
      if (turn.eliminatedPlayerIndexes) {
        eliminatedIndexes = [...eliminatedIndexes, ...turn.eliminatedPlayerIndexes];
      }
    }
    return eliminatedIndexes;
  };

  const getSurvivingPlayerIndexes = () => {
    const allPlayers = getAllPlayerIndexes();
    const eliminatedPlayers = getEliminatedPlayerIndexes();
    
    // Return all players that are not in the eliminated list
    return allPlayers.filter(playerIndex => !eliminatedPlayers.includes(playerIndex));
  };

  const isPlayerEliminated = () => {
    if (userPlayerIndex === -1) return false;
    
    // Check if player is eliminated in ANY turn
    return getEliminatedPlayerIndexes().includes(userPlayerIndex);
  };

  const isPlayerWinner = () => {
    if (userPlayerIndex === -1) return false;
    
    const survivingIndexes = getSurvivingPlayerIndexes();
    return currentRound.currentTurn === currentRound.totalTurns && 
      survivingIndexes.length === 1 && 
      survivingIndexes[0] === userPlayerIndex;
  };

  // Always use all player indexes for the grid, but mark eliminated ones
  const displayPlayerIndexes = getAllPlayerIndexes();
  const eliminatedPlayers = getEliminatedPlayerIndexes();
  const gridConfig = calculateGridConfig(displayPlayerIndexes.length);
  
  // Player states
  const playerEliminated = isPlayerEliminated();
  const playerWinner = isPlayerWinner();

  // Format addresses for display
  const shortenAddress = (address) => {
    if (!address) return "";
    return address.slice(0, 4) + "..." + address.slice(-4);
  };

  // Get most recent eliminated players for the current turn display
  const getMostRecentEliminatedPlayers = () => {
    if (!currentRound.turnInfo || currentRound.turnInfo.length === 0) {
      return [];
    }
    
    // Get the most recent turn's eliminated players
    return currentRound.turnInfo[currentRound.turnInfo.length - 1].eliminatedPlayerIndexes || [];
  };

  return (
    <div className="h-screen w-full flex flex-col bg-[#4400CE]">
      {/* Round Info */}
      <div className="p-4">
        <div className="bg-transparent border border-white/20 rounded-xl p-4 text-white">
          <div className="text-center text-2xl text-white">
            Current Player: Player {userPlayerIndex + 1}
          </div>
          <div className="text-center text-2xl">
            Turn {currentRound.currentTurn} / {currentRound.totalTurns}
          </div>
          <div className="text-center text-xl">
            {getSurvivingPlayerIndexes().length} Players Remaining
          </div>
        </div>
      </div>

      {/* Game Grid */}
      <div className="px-4">
        <div className="grid grid-cols-7 gap-2">
          {Array(gridConfig.totalSlots).fill(null).map((_, gridIndex) => {
            // If we have fewer players than grid slots, only show slots up to player count
            if (gridIndex >= displayPlayerIndexes.length) {
              return <div key={gridIndex} className="aspect-square" />;
            }
            
            // Get the actual player index for this grid position
            const playerIndex = displayPlayerIndexes[gridIndex];
            
            // Check if this is the current user
            const isUserPosition = playerIndex === userPlayerIndex && 
              getSurvivingPlayerIndexes().includes(userPlayerIndex) && !playerEliminated;
            
            return (
              <div key={gridIndex} className="aspect-square">
                {isUserPosition ? (
                  <div className={`w-full h-full rounded-full overflow-hidden ${
                    playerWinner ? 'bg-yellow-400' : 'bg-yellow-500'
                  }`}>
                    <img 
                      src={userImage || "https://i1.sndcdn.com/avatars-000706728712-ol0h4p-t500x500.jpg"} 
                      alt="User"
                      className="w-full h-full object-cover"
                    />
                  </div>
                ) : (
                  <div className={`w-full h-full rounded-full flex items-center justify-center text-xs overflow-hidden ${
                    eliminatedPlayers.includes(playerIndex) ? 'bg-gray-400' : 'bg-white/80'
                  }`}>
                    <span className={`${eliminatedPlayers.includes(playerIndex) ? 'text-gray-600' : 'text-gray-800'}`}>
                      P{playerIndex + 1}
                    </span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Bottom Section */}
      <div className="flex-1 flex items-end pb-8">
        <div className="w-full px-4">
          {showCountdown ? (
            <div className="bg-transparent border border-white/20 rounded-xl p-4">
              <div className="text-center text-white text-2xl font-bold">
                3... 2... 1... Turn {currentRound.currentTurn} {currentRound.currentTurn === 1 ? "Start!" : "Continues!"}
              </div>
            </div>
          ) : playerEliminated ? (
            <div className="mx-4 p-4 bg-red-500 bg-opacity-20 border border-red-500 border-opacity-40 rounded-xl flex flex-col items-center justify-center gap-2">
              <div className="flex items-center justify-center gap-2">
                <AlertCircle className="w-6 h-6 text-white" />
                <span className="text-white text-lg font-medium">
                  You've been eliminated!
                </span>
              </div>
              <button 
                onClick={() => navigate('/round-list1')} 
                className="mt-4 px-6 py-2 bg-white/20 hover:bg-white/30 rounded-lg text-white font-medium transition-colors"
              >
                Continue to Round List
              </button>
            </div>
          ) : playerWinner ? (
            <div className="mx-4 p-4 bg-yellow-500 border border-yellow-600 rounded-xl flex items-center justify-center gap-2">
              <Trophy className="w-6 h-6 text-white" />
              <span className="text-white text-lg font-medium">
                Congratulations! You're the winner!
              </span>
              <button 
                onClick={() => navigate('/round-list1')} 
                className="mt-4 px-6 py-2 bg-white/20 hover:bg-white/30 rounded-lg text-white font-medium transition-colors"
              >
                Continue to Round List
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              {getMostRecentEliminatedPlayers().map((playerIndex, index) => (
                <div key={index} className="text-white text-center text-lg">
                  <span className="text-gray-300">Player {playerIndex + 1}</span>
                  <span className="text-white"> eliminated</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TurnPage;