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
  const [turnPhase, setTurnPhase] = useState('countdown'); // 'countdown', 'players', 'eliminated'
  const [userPubKey, setUserPubKey] = useState("");
  const [userPlayerIndex, setUserPlayerIndex] = useState(-1);
  const [userImage, setUserImage] = useState("");
  const [lastProcessedTurn, setLastProcessedTurn] = useState(0);
  const [animatedEliminatedPlayers, setAnimatedEliminatedPlayers] = useState([]);

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

  // Get previously eliminated players (from turns before current turn)
  const getPreviouslyEliminatedPlayers = () => {
    if (!currentRound?.turnInfo) return [];
    
    let previouslyEliminated = [];
    currentRound.turnInfo.forEach(turn => {
      if (turn.index < currentRound.currentTurn && turn.eliminatedPlayerIndexes) {
        previouslyEliminated = [...previouslyEliminated, ...turn.eliminatedPlayerIndexes];
      }
    });
    return previouslyEliminated;
  };

  // Load round data when roundsData or roundId changes
  useEffect(() => {
    const round = roundsData.find(r => r.id === roundId);
    if (round) {
      // Check if we have new turn data
      const hasNewTurnData = round.turnInfo && round.turnInfo.some(turn => turn.index === round.currentTurn);
      const needsToRestartSequence = round.currentTurn > lastProcessedTurn && hasNewTurnData;
      
      setCurrentRound(round);
      
      // If this is the first load or we have a new turn with data, start the sequence
      if (needsToRestartSequence) {
        // Initialize with previously eliminated players
        const previouslyEliminated = round.turnInfo
          ? round.turnInfo
              .filter(turn => turn.index < round.currentTurn)
              .flatMap(turn => turn.eliminatedPlayerIndexes || [])
          : [];
        
        setAnimatedEliminatedPlayers(previouslyEliminated);
        setTurnPhase('countdown');
        setLastProcessedTurn(round.currentTurn);
      }
    }
  }, [roundId, roundsData, lastProcessedTurn]);

  // Find user index when currentRound or userPubKey changes
  useEffect(() => {
    if (currentRound && userPubKey) {
      const userIndex = currentRound.players.findIndex(playerKey => playerKey === userPubKey);
      setUserPlayerIndex(userIndex);
    }
  }, [currentRound, userPubKey]);

  // Handle turn phase transitions
  useEffect(() => {
    if (!currentRound) return;
    
    if (turnPhase === 'countdown') {
      // After countdown, show players with eliminated ones
      const timer = setTimeout(() => {
        setTurnPhase('eliminated');
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [turnPhase, currentRound]);

  // Effect to handle elimination animations
  useEffect(() => {
    if (turnPhase === 'eliminated' && getCurrentTurnEliminatedPlayers().length > 0) {
      // Start with previously eliminated players
      const previouslyEliminated = getPreviouslyEliminatedPlayers();
      setAnimatedEliminatedPlayers(previouslyEliminated);
      
      // Then add current turn eliminations one by one
      getCurrentTurnEliminatedPlayers().forEach((playerIndex, index) => {
        const timer = setTimeout(() => {
          setAnimatedEliminatedPlayers(prev => [...prev, playerIndex]);
        }, index * 1500);
        return () => clearTimeout(timer);
      });
    }
  }, [turnPhase]);

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

  const getCurrentTurnEliminatedPlayers = () => {
    if (!currentRound.turnInfo || currentRound.turnInfo.length === 0) {
      return [];
    }
    
    // Get the current turn's eliminated players
    const currentTurnInfo = currentRound.turnInfo.find(
      turn => turn.index === currentRound.currentTurn
    );
    
    return currentTurnInfo?.eliminatedPlayerIndexes || [];
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
    
    // Check if we're in the final turn
    const isLastTurn = currentRound.currentTurn === currentRound.totalTurns;
    
    // Check if turnInfo array has the same length as totalTurns
    const hasAllTurnData = currentRound.turnInfo && currentRound.turnInfo.length === currentRound.totalTurns;
    
    if (isLastTurn && hasAllTurnData) {
      // Get the last turn info
      const lastTurnInfo = currentRound.turnInfo.find(turn => turn.index === currentRound.totalTurns);
      
      // In the last turn, the first player in eliminatedPlayerIndexes is the winner
      if (lastTurnInfo && lastTurnInfo.eliminatedPlayerIndexes && lastTurnInfo.eliminatedPlayerIndexes.length > 0) {
        const winnerIndex = lastTurnInfo.eliminatedPlayerIndexes[0];
        return userPlayerIndex === winnerIndex;
      }
    }
    return false;
  };

  // Always use all player indexes for the grid, but mark eliminated ones based on phase
  const displayPlayerIndexes = getAllPlayerIndexes();
  
  // Determine which players to show as eliminated based on the current phase
  let eliminatedPlayers = [];
  if (turnPhase === 'countdown') {
    // During countdown, show all players eliminated in previous turns
    eliminatedPlayers = getPreviouslyEliminatedPlayers();
  } else {
    // After countdown, show previously eliminated plus animated current turn eliminations
    eliminatedPlayers = animatedEliminatedPlayers;
  }
  
  const gridConfig = calculateGridConfig(displayPlayerIndexes.length);
  
  // Player states
  const playerEliminated = isPlayerEliminated();
  const playerWinner = isPlayerWinner();

 

  return (
    <div className="min-h-screen w-full flex flex-col bg-[#4400CE] overflow-auto">
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
      <div className="px-4 flex-1">
        <div className="grid grid-cols-7 gap-2">
          {Array(gridConfig.totalSlots).fill(null).map((_, gridIndex) => {
            // If we have fewer players than grid slots, only show slots up to player count
            if (gridIndex >= displayPlayerIndexes.length) {
              return <div key={gridIndex} className="aspect-square" />;
            }
            
            // Get the actual player index for this grid position
            const playerIndex = displayPlayerIndexes[gridIndex];
            
            // Check if this is the current user
            const isUserPosition = playerIndex === userPlayerIndex;
            const isUserEliminated = eliminatedPlayers.includes(userPlayerIndex);
            const shouldHighlightUser = isUserPosition && !isUserEliminated;
            
            return (
              <div key={gridIndex} className="aspect-square">
                {isUserPosition ? (
                  <div className={`w-full h-full rounded-full overflow-hidden ${
                    playerWinner ? 'bg-yellow-400' : 
                    eliminatedPlayers.includes(userPlayerIndex) ? 'bg-gray-400' : 'bg-yellow-500'
                  }`}>
                    <img 
                      src={userImage || "https://i1.sndcdn.com/avatars-000706728712-ol0h4p-t500x500.jpg"} 
                      alt="User"
                      className={`w-full h-full object-cover ${eliminatedPlayers.includes(userPlayerIndex) ? 'opacity-50' : ''}`}
                    />
                  </div>
                ) : (
                  <div className={`w-full h-full rounded-full flex items-center justify-center text-xs overflow-hidden transition-colors duration-500 ${
                    eliminatedPlayers.includes(playerIndex) ? 'bg-gray-400' : 'bg-white/80'
                  }`}>
                    <span className={`transition-colors duration-500 ${eliminatedPlayers.includes(playerIndex) ? 'text-gray-600' : 'text-gray-800'}`}>
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
          {turnPhase === 'countdown' ? (
            <div className="bg-transparent border border-white/20 rounded-xl p-4">
              <div className="text-center text-white text-2xl font-bold">
                3... 2... 1... Turn {currentRound.currentTurn} {currentRound.currentTurn === 1 ? "Start!" : "Continues!"}
              </div>
            </div>
          ) : 
          playerWinner ? (
            <div className="mx-4 p-4 bg-yellow-500 border border-yellow-600 rounded-xl flex flex-col items-center justify-center gap-2">
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
          ): playerEliminated ? (
            <div className="space-y-4">
              {/* Elimination animations */}
              <div className="space-y-2">
                {getCurrentTurnEliminatedPlayers().length > 0 ? (
                  getCurrentTurnEliminatedPlayers().map((playerIndex, index) => {
                    // Check if this is the winner (first player in last turn)
                    const isLastTurn = currentRound.currentTurn === currentRound.totalTurns;
                    const isFirstPlayer = index === 0;
                    const isWinner = isLastTurn && isFirstPlayer;

                    return (
                      <div 
                        key={index} 
                        className={`text-white text-center text-lg relative border border-transparent ${
                          isWinner ? 'animate-border-glow-winner' : 'animate-border-glow'
                        }`}
                        style={{
                          animation: `${isWinner ? 'borderGlowWinner' : 'borderGlow'} 0.5s ease-out ${index * 1.5}s forwards, 
                                    fadeIn 0.5s ease-out ${index * 1.5}s forwards`,
                          opacity: 0,
                        }}
                      >
                        <div 
                          className="py-2 px-4"
                          style={{
                            animation: `slideIn 0.5s ease-out ${index * 1.5}s forwards`,
                            transform: 'translateY(20px)',
                          }}
                        >
                          <span className={isWinner ? "text-yellow-300" : "text-gray-300"}>
                            Player {playerIndex + 1}
                          </span>
                          <span className={isWinner ? "text-yellow-300" : "text-white"}>
                            {isWinner ? " winner!" : " eliminated"}
                          </span>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="text-white text-center text-lg">
                    Waiting for elimination results...
                  </div>
                )}
              </div>

              {/* Elimination message */}
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
            </div>
          ) : (
            <div className="space-y-2">
              {getCurrentTurnEliminatedPlayers().length > 0 ? (
                getCurrentTurnEliminatedPlayers().map((playerIndex, index) => {
                  // Check if this is the winner (first player in last turn)
                  const isLastTurn = currentRound.currentTurn === currentRound.totalTurns;
                  const isFirstPlayer = index === 0;
                  const isWinner = isLastTurn && isFirstPlayer;

                  return (
                    <div 
                      key={index} 
                      className={`text-white text-center text-lg relative border border-transparent ${
                        isWinner ? 'animate-border-glow-winner' : 'animate-border-glow'
                      }`}
                      style={{
                        animation: `${isWinner ? 'borderGlowWinner' : 'borderGlow'} 0.5s ease-out ${index * 1.5}s forwards, 
                                  fadeIn 0.5s ease-out ${index * 1.5}s forwards`,
                        opacity: 0,
                      }}
                    >
                      <div 
                        className="py-2 px-4"
                        style={{
                          animation: `slideIn 0.5s ease-out ${index * 1.5}s forwards`,
                          transform: 'translateY(20px)',
                        }}
                      >
                        <span className={isWinner ? "text-yellow-300" : "text-gray-300"}>
                          Player {playerIndex + 1}
                        </span>
                        <span className={isWinner ? "text-yellow-300" : "text-white"}>
                          {isWinner ? " winner!" : " eliminated"}
                        </span>
                      </div>
                    </div>
                  );
                })
              ) : currentRound.currentTurn > 0 ? (
                <div className="text-white text-center text-lg">
                  Waiting for elimination results...
                </div>
              ) : (
                <div className="text-white text-center text-lg">
                  Round about to start
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Add these styles at the top of your file, after the imports
const styles = `
  @keyframes borderGlow {
    0% {
      border-color: transparent;
    }
    100% {
      border-color: rgba(255, 255, 255, 0.2);
      border-radius: 0.5rem;
    }
  }

  @keyframes borderGlowWinner {
    0% {
      border-color: transparent;
    }
    100% {
      border-color: rgba(255, 215, 0, 0.4);
      border-radius: 0.5rem;
    }
  }

  @keyframes fadeIn {
    0% {
      opacity: 0;
    }
    100% {
      opacity: 1;
    }
  }

  @keyframes slideIn {
    0% {
      transform: translateY(20px);
    }
    100% {
      transform: translateY(0);
    }
  }
`;

// Add this right after the styles
const styleSheet = document.createElement("style");
styleSheet.innerText = styles;
document.head.appendChild(styleSheet);

export default TurnPage;