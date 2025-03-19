import React, { useState, useEffect } from 'react';
import { ChevronLeft, MoreHorizontal } from 'lucide-react';
import { BrowserRouter, Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import {Header} from '@/components/Header';
import {UserProfileCard} from '@/components/UserProfileCard';
import { useGameData } from '@/provider/GameDataProvider';
import {RoundCard} from '@/components/RoundCard';
import { WALLET_CONFIG } from '@/config/wallet.config';

const formatTimeRemaining = (timeInSeconds) => {
  if (timeInSeconds <= 0) return "Starting...";
  
  const hours = Math.floor(timeInSeconds / 3600);
  const minutes = Math.floor((timeInSeconds % 3600) / 60);
  const seconds = Math.floor(timeInSeconds % 60);
  
  let timeString = "";
  if (hours > 0) timeString += `${hours}h`;
  if (minutes > 0) timeString += `${minutes}m`;
  timeString += `${seconds}s`;
  
  return timeString;
};

const RoundList = () => {
    const [showMenu, setShowMenu] = useState(false);
    const navigate = useNavigate();
    const { gameData, connection, roundsData } = useGameData();
    const [userPublicKey, setUserPublicKey] = useState("");
    const [timeRemaining, setTimeRemaining] = useState({});

    useEffect(() => {
      const pubKeyStr = localStorage.getItem(WALLET_CONFIG.STORAGE_KEYS.USER_PUBLIC_KEY);
      if (!pubKeyStr) {
        console.log("No public key found in localStorage");
        return;
      }
      setUserPublicKey(pubKeyStr);
    }, [roundsData]);

    // Update countdown timer every second
    useEffect(() => {
      const timer = setInterval(() => {
        const now = Math.floor(Date.now() / 1000); // Current time in seconds
        const newTimeRemaining = {};
        
        roundsData.forEach(round => {
          if (round.scheduleStartTime) {
            const timeLeft = round.scheduleStartTime - now;
            newTimeRemaining[round.id] = timeLeft > 0 ? timeLeft : 0;
          }
        });
        
        setTimeRemaining(newTimeRemaining);
      }, 1000);

      return () => clearInterval(timer);
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
              time={"in "+formatTimeRemaining(timeRemaining[round.id] || 0)}
              roundAmount={round.entryFees?.toString() || "0"}
              isJoined={round.players.includes(userPublicKey)}
              isLive={round.state==="Playing"}
              roundState={round.state}
            />
          ))}
        </div>
      </div>
    );
};

export default RoundList;