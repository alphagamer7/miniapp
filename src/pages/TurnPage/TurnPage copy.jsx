import React, { useState, useEffect } from 'react';
import { Header } from '@/components/Header';
import { useNavigate, useParams } from 'react-router-dom';
const TurnPage1 = () => {
    const navigate = useNavigate();
    const { roundId } = useParams();
  // Create a 6x6 grid (36 slots)
  const slots = Array(49).fill(null);
  const playerPosition = 24; // Position where player avatar should appear
    const [currentRound, setCurrentRound] = useState(null);
  const [showCountdown, setShowCountdown] = useState(true);
  const [eliminatedPlayers,setEliminatedPlayers] = useState([]);

 
  useEffect(() => {
    const round = roundsData.find(r => r.id === roundId);
    if (round) {
      setCurrentRound(round);
      
    
    }
    const timer = setTimeout(() => {
      setShowCountdown(false);
      setEliminatedPlayers([
        { eliminated: 'mt666xxxxx', by: 'iamikixxxx' },
        { eliminated: 'mt666xxxxx', by: 'iamikixxxx' },
        { eliminated: 'mt666xxxxx', by: 'iamikixxxx' },
      ])
      
    }, 3000); // 3 seconds

    return () => clearTimeout(timer);
  }, []);
  return (
    <div className="h-screen w-full flex flex-col" style={{ backgroundColor: '#4400CE' }}>
      <Header />

      {/* Round Info */}
      <div className="p-4">
        <div className="bg-transparent border border-black rounded-xl p-4 text-white">
          <div className="text-center text-2xl">
            Round 1 / 5
          </div>
          <div className="text-center text-xl">
            80 Players
          </div>
        </div>
      </div>

      {/* Game Grid */}
      <div className="px-4">
        <div className="grid grid-cols-7 gap-2">
          {slots.map((_, index) => (
            <div key={index} className="aspect-square">
              {index === playerPosition ? (
                <div className="w-full h-full rounded-full bg-yellow-500 overflow-hidden">
                  <img 
                    src="https://i1.sndcdn.com/avatars-000706728712-ol0h4p-t500x500.jpg"
                    alt="Player"
                    className="w-full h-full object-cover"
                  />
                </div>
              ) : (
                <div className="w-full h-full rounded-full bg-white bg-opacity-80" />
              )}
            </div>
          ))}
        </div>
      </div>

    {/* Bottom Section */}
    <div className="flex-1 flex items-end pb-8">
        <div className="w-full px-4">
          {showCountdown ? (
            <div className="bg-transparent border border-black rounded-xl p-4">
              <div className="text-center text-white text-2xl font-bold">
                3... 2... 1... Round Start!
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              {eliminatedPlayers.map((player, index) => (
                <div key={index} className="text-white text-center text-lg">
                  <span className="text-gray-300">{player.eliminated}</span>
                  <span className="text-white"> eliminated by </span>
                  <span className="text-gray-300">{player.by}</span>
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