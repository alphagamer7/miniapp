import React, { useState,useEffect } from 'react';
import { ChevronLeft, MoreHorizontal } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useGameData } from '@/provider/GameDataProvider';
import {RoundCard} from '@/components/RoundCard';
import {UserProfileCard} from '@/components/UserProfileCard';
import {UserProfileCard1} from '@/components/UserProfileCard1';
import {Header} from '@/components/Header';
const HomePage = () => {
  const navigate = useNavigate();
  const [showMenu, setShowMenu] = useState(false);
  const { gameData, connection,roundsData } = useGameData();
  const [firstTwoRounds, setfirstTwoRounds] = useState([]);
    const [userPublicKey, setUserPublicKey] = useState("");
  useEffect(() => {
    const pubKeyStr = localStorage.getItem("publicKey");
    if (!pubKeyStr) {
      console.log("No public key found in localStorage");
      return;
    }
    setUserPublicKey(pubKeyStr)
    if (roundsData && roundsData.length > 0) {
      setfirstTwoRounds(roundsData.slice(0, 2));
    }
  }, [roundsData]);
  return (
    <div className="h-screen w-full flex flex-col" style={{ backgroundColor: '#4400CE' }}>
    

    <Header />

      <div className="p-4">
          <UserProfileCard />
      </div>

     

      {/* Spacer to push content to bottom */}
      <div className="flex-1"></div>

      {/* Bottom Content */}
      <div className="p-4 space-y-4 mb-4">
      
         {firstTwoRounds.map((round, index) => (
            <RoundCard
              key={round.id}
              roundId={round.id}
              players={`${round.players?.length || 0}/${round.maxPlayers} Remaining`}
              time="in 54m10s"
              roundAmount={round.entryFees?.toString() || "0"}
              isJoined={round.players.includes(userPublicKey)}
            />
          ))}

        {/* View More Button */}
        <button 
           onClick={() => navigate('/round-list1')}
        className="w-full bg-transparent border border-black rounded-xl p-4 text-white text-center">
          View More...
        </button>
      </div>
    </div>
  );
};

export default HomePage;