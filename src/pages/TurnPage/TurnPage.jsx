import React, { useState, useEffect } from 'react';
import { AlertCircle, Trophy } from 'lucide-react';

const TurnPage = () => {
  // Function to get URL parameters
  const getUrlParameter = (name) => {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get(name);
  };
  
  // Get parameters from URL with defaults
  const totalPlayers = parseInt(getUrlParameter('players')) || 50;
  const maxTurns = parseInt(getUrlParameter('maxTurns')) || 5;
  const maxEliminated = parseInt(getUrlParameter('maxEliminated')) || 10;

  // Generate players based on URL parameter
  const generatePlayers = (count) => {
    return Array(count).fill(null).map((_, index) => `Player ${index}`);
  };

  // Set current player as middle player
  const currentUserId = `Player ${Math.floor(totalPlayers / 2)}`;
  
  const [roundData, setRoundData] = useState({
    id: '1',
    maxPlayers: totalPlayers,
    minPlayers: 1,
    state: 'Started',
    maxTurns: maxTurns,
    maxEliminated: maxEliminated,
    currentTurn: 0,
    players: generatePlayers(totalPlayers),
    turnInfo: [],
    bump: 255
  });

  const [showCountdown, setShowCountdown] = useState(true);

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

  const getRemainingPlayers = () => {
    const currentTurnInfo = roundData.turnInfo[roundData.currentTurn - 1];
    if (!currentTurnInfo) return roundData.players;
    return currentTurnInfo.survivedPlayers;
  };

  const isPlayerEliminated = () => {
    const allEliminatedPlayers = roundData.turnInfo.flatMap(turn => turn.eliminatedPlayers);
    return allEliminatedPlayers.includes(currentUserId);
  };

  const isPlayerWinner = () => {
    if (roundData.currentTurn !== roundData.maxTurns) return false;
    const remainingPlayers = getRemainingPlayers();
    return remainingPlayers.length === 1 && remainingPlayers[0] === currentUserId;
  };

  const getRandomEliminations = (players, count) => {
    const shuffled = [...players].sort(() => 0.5 - Math.random());
    const currentPlayerIndex = shuffled.indexOf(currentUserId);
    if (currentPlayerIndex !== -1 && currentPlayerIndex < count) {
      const temp = shuffled[count];
      shuffled[count] = currentUserId;
      shuffled[currentPlayerIndex] = temp;
    }
    return {
      eliminated: shuffled.slice(0, count),
      survived: shuffled.slice(count)
    };
  };

  useEffect(() => {
    if (showCountdown) {
      const timer = setTimeout(() => {
        setShowCountdown(false);
        
        if (roundData.currentTurn >= roundData.maxTurns) return;

        const remainingPlayers = getRemainingPlayers();
        const eliminationCount = roundData.currentTurn === roundData.maxTurns - 1 
          ? remainingPlayers.length - 1  // Leave one winner on final turn
          : Math.min(roundData.maxEliminated, remainingPlayers.length - 1);

        const { eliminated, survived } = getRandomEliminations(remainingPlayers, eliminationCount);

        setRoundData(prev => ({
          ...prev,
          currentTurn: prev.currentTurn + 1,
          turnInfo: [
            ...prev.turnInfo,
            {
              index: prev.currentTurn,
              survivedPlayers: survived,
              eliminatedPlayers: eliminated
            }
          ]
        }));

        // Start next turn countdown after a delay
        setTimeout(() => {
          setShowCountdown(true);
        }, 2000);
      }, 3000);

      return () => clearTimeout(timer);
    }
  }, [showCountdown]);

  const remainingPlayers = getRemainingPlayers();
  const gridConfig = calculateGridConfig(remainingPlayers.length);
  const currentUserPosition = Math.floor(gridConfig.totalSlots / 2);
  const playerEliminated = isPlayerEliminated();
  const playerWinner = isPlayerWinner();

  return (
    <div className="h-screen w-full flex flex-col bg-[#4400CE]">
      {/* Round Info */}
      <div className="p-4">
        <div className="bg-transparent border border-white/20 rounded-xl p-4 text-white">
          <div className="text-center text-2xl">
            Turn {roundData.currentTurn} / {roundData.maxTurns}
          </div>
          <div className="text-center text-xl">
            {remainingPlayers.length} Players Remaining
          </div>
        </div>
      </div>

      {/* Game Grid */}
      <div className="px-4">
        <div className="grid grid-cols-7 gap-2">
          {Array(gridConfig.totalSlots).fill(null).map((_, index) => (
            <div key={index} className="aspect-square">
              {index === currentUserPosition && remainingPlayers.includes(currentUserId) ? (
                <div className={`w-full h-full rounded-full overflow-hidden ${
                  playerEliminated ? 'bg-gray-500' :
                  playerWinner ? 'bg-yellow-400' : 'bg-yellow-500'
                }`}>
                  <img 
                    src="/api/placeholder/100/100"
                    alt="Player"
                    className="w-full h-full object-cover"
                  />
                </div>
              ) : (
                <div className="w-full h-full rounded-full bg-white/80" />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Bottom Section */}
      <div className="flex-1 flex items-end pb-8">
        <div className="w-full px-4">
          {showCountdown ? (
            <div className="bg-transparent border border-white/20 rounded-xl p-4">
              <div className="text-center text-white text-2xl font-bold">
                3... 2... 1... Turn {roundData.currentTurn + 1} Start!
              </div>
            </div>
          ) : playerEliminated ? (
            <div className="mx-4 p-4 bg-red-500 bg-opacity-20 border border-red-500 border-opacity-40 rounded-xl flex items-center justify-center gap-2">
              <AlertCircle className="w-6 h-6 text-white" />
              <span className="text-white text-lg font-medium">
                You've been eliminated!
              </span>
            </div>
          ) : playerWinner ? (
            <div className="mx-4 p-4 bg-yellow-500 border border-yellow-600 rounded-xl flex items-center justify-center gap-2">
              <Trophy className="w-6 h-6 text-white" />
              <span className="text-white text-lg font-medium">
                Congratulations! You're the winner!
              </span>
            </div>
          ) : (
            <div className="space-y-2">
              {roundData.turnInfo[roundData.currentTurn - 1]?.eliminatedPlayers.map((playerId, index) => (
                <div key={index} className="text-white text-center text-lg">
                  <span className="text-gray-300">{playerId}</span>
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