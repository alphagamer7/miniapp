import React, { useState, useEffect } from 'react';
import { ChevronLeft, MoreHorizontal } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useGameData } from '@/provider/GameDataProvider';
import {RoundCard} from '@/components/RoundCard';
import {UserProfileCard} from '@/components/UserProfileCard';
import {UserProfileCard1} from '@/components/UserProfileCard1';
import {Header} from '@/components/Header';
import PhantomWalletConnect from '../PhantomWallet/PhantomWalletPage';
import WebApp from '@twa-dev/sdk';
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

const HomePage = () => {
  const navigate = useNavigate();
  const [showMenu, setShowMenu] = useState(false);
  const { gameData, connection, roundsData } = useGameData();
  const [isMobile, setIsMobile] = useState(false);
  const [firstTwoRounds, setfirstTwoRounds] = useState([]);
  const [userPublicKey, setUserPublicKey] = useState("");
  const [timeRemaining, setTimeRemaining] = useState({});
  const [walletState, setWalletState] = useState({
    address: '',
    isConnected: false,
    session: '',
    userId: ''
  });
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const pubKeyStr = localStorage.getItem("publicKey");
    setIsMobile(checkDeviceType());
    if (!pubKeyStr) {
      console.log("No public key found in localStorage");
      return;
    }
    setUserPublicKey(pubKeyStr);
    if (roundsData && roundsData.length > 0) {
      setfirstTwoRounds(roundsData.slice(0, 2));
    }
  }, [roundsData]);

  // Update countdown timer every second
  useEffect(() => {
    const timer = setInterval(() => {
      const now = Math.floor(Date.now() / 1000);
      const newTimeRemaining = {};
      
      firstTwoRounds.forEach(round => {
        if (round.scheduleStartTime) {
          const timeLeft = round.scheduleStartTime - now;
          newTimeRemaining[round.id] = timeLeft > 0 ? timeLeft : 0;
        }
      });
      
      setTimeRemaining(newTimeRemaining);
    }, 1000);

    return () => clearInterval(timer);
  }, [firstTwoRounds]);

  const checkDeviceType = () => {
    const userAgent = navigator.userAgent || navigator.vendor || window.opera;
    return /android|ios|iphone|ipad|ipod/i.test(userAgent.toLowerCase());
  };

  const handleWalletStateChange = (newWalletState) => {
    setWalletState(newWalletState);
    if (newWalletState.address) {
      setUserPublicKey(newWalletState.address);
    }
  };
  const disconnectWallet = async () => {
    setIsLoading(true);
    try {
      if (isMobile) {
        resetWalletState();
        return;
      }

      const provider = getProvider();
      if (provider) {
        await provider.disconnect();
        resetWalletState();
      }
    } catch (err) {
      alert('Failed to disconnect: ' + err.message);
     
    } finally {
      setIsLoading(false);
    }
  };
  const resetWalletState = () => {
    setWalletState({
      address: '',
      isConnected: false,
      session: '',
      userId: ''
    });
    alert(`Disconnected ${walletState.isConnected}`);
    localStorage.clear()
    // localStorage.removeItem('phantomWallet');
    // localStorage.removeItem('publicKey');
    // localStorage.removeItem('phantom_encrypted_data');
    // localStorage.removeItem('phantom_public_key');
    // localStorage.removeItem('phantom_nonce');
 
    
    WebApp.sendData(JSON.stringify({
      type: 'wallet_disconnected'
    }));
  };
  const getProvider = () => {
    if ('phantom' in window) {
      const provider = window.phantom?.solana;
      if (provider?.isPhantom) {
        return provider;
      }
    }
    return null;
  };

  return (
    <div className="h-screen w-full flex flex-col" style={{ backgroundColor: '#4400CE' }}>
      <Header />

      <div className="p-4">
        {walletState.isConnected ? (
          <div>
           <UserProfileCard />
           <button 
              onClick={disconnectWallet}
              disabled={isLoading}
              className="w-full bg-transparent border border-red-500 text-red-500 rounded-xl p-3 text-center mt-2"
            >
              {isLoading ? 'Processing...' : 'Disconnect Wallet'}
            </button>
          </div>
          
        ) : (
          <PhantomWalletConnect onWalletStateChange={handleWalletStateChange} />
        )}
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
            time={"in " + formatTimeRemaining(timeRemaining[round.id] || 0)}
            roundAmount={round.entryFees?.toString() || "0"}
            isJoined={round.players.includes(userPublicKey)}
            isLive={round.state==="Playing"}
            roundState={round.state}
          />
        ))}

        {/* View More Button */}
        <button 
          onClick={() => navigate('/round-list1')}
          className="w-full bg-transparent border border-black rounded-xl p-4 text-white text-center"
        >
          View More...
        </button>
      </div>
    </div>
  );
};

export default HomePage;