import React, { useState,useEffect } from 'react';
import { ChevronLeft, MoreHorizontal } from 'lucide-react';
import { BrowserRouter, Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import {Header} from '@/components/Header';
import {UserProfileCard} from '@/components/UserProfileCard';
import { useGameData } from '@/provider/GameDataProvider';
import {RoundCard} from '@/components/RoundCard';
const RoundList = () => {
    const [showMenu, setShowMenu] = useState(false);
    const navigate = useNavigate();
    const { gameData, connection,roundsData } = useGameData();
    const [userPublicKey, setUserPublicKey] = useState("");
    useEffect(() => {
       const pubKeyStr = localStorage.getItem("publicKey");
       if (!pubKeyStr) {
         console.log("No public key found in localStorage");
         return;
       }
       setUserPublicKey(pubKeyStr)
       
     }, [roundsData]);
  
    return (
      <div className="h-screen w-full flex flex-col" style={{ backgroundColor: '#4400CE' }}>
        
          <Header />
       
  
        {/* Game Cards */}
        <div className="flex-1 p-4 space-y-4 overflow-y-auto">
          {/* Balance Card */}
                <UserProfileCard />
  
            {roundsData.map((round, index) => (
                      <RoundCard
                        key={round.id}
                        roundId={round.id}
                        players={`${round.players?.length || 0}/${round.maxPlayers} Remaining`}
                        time="in 54m10s"
                        roundAmount={round.entryFees?.toString() || "0"}
                        isJoined={round.players.includes(userPublicKey)}
                        isLive={round.state==="Playing"}
                      />
                    ))}
        </div>
      </div>
    );
  };
  export default RoundList;