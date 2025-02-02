import {  Search } from 'lucide-react';
import WebApp from '@twa-dev/sdk';
import { List } from '@telegram-apps/telegram-ui';

import { DisplayData } from '@/components/DisplayData/DisplayData.jsx';
import React, { useEffect, useState } from "react";
import { useGameData } from '@/provider/GameDataProvider';
import { decodeRoundData } from "@/types/RoundDecoder";
import { Connection, PublicKey } from "@solana/web3.js";
export function RoundListPage() {
    const ROUND_SEED_PREFIX = "round";
    const PROGRAM_ID = "3fNocwdPfKwywpS7E7GUGkPDBDhXJ9xsdDmNb4m7TKXr"; // Public key of the deployed Solana program.

    const GAME_ID = "01JJTNB117QN0TYB0RQPX2V0N6"; // Identifier for the game.
    // const GAME_ID = "01JJQKQTNZ6P9F7E7TJCGSBKPS";

    const [userImage, setUserImage] = useState("");
    const [userNameAndSurname, setUserNameAndSurname] = useState("");
    const [roundsData, setRoundsData] = useState([]);
    const [error, setError] = useState(null);
    const { gameData, connection } = useGameData();
    let datTimeList=["10 FEB 2024 22:22","12 FEB 12:00","31 FEB 09:10","02 MAR 23:00"]
  
    useEffect(() => {
      const initData = WebApp.initDataUnsafe;
      if (initData && initData.user) {
        setUserImage(initData.user.photo_url || "");
          // Combine first_name and last_name
          const fullName = [
              initData.user.first_name,
              initData.user.last_name
          ].filter(Boolean).join(" ");
          setUserNameAndSurname(fullName);
      }
  }, []);

    useEffect(() => {
       
      const deriveRoundPDA = async (roundId) => {
        try {
          const programId = new PublicKey(PROGRAM_ID);
          const roundIdBytes = new TextEncoder().encode(roundId);
          const roundBytes = new TextEncoder().encode(ROUND_SEED_PREFIX);
          const [roundPDA] = await PublicKey.findProgramAddress(
            [roundBytes, roundIdBytes],
            programId
          );
          return roundPDA;
        } catch (err) {
          console.error('Error deriving PDA:', err);
          throw err;
        }
      };
  
      const fetchRoundData = async (roundId) => {
        try {
          console.log('Fetching data for round:', roundId);
          
          const roundPDA = await deriveRoundPDA(roundId);
     
          
          const accountInfo = await connection.getAccountInfo(roundPDA);
          
         
          
          if (!accountInfo) {
            console.error('Round account not found');
            return null;
          }
          
  
        
          
          const decodedData = decodeRoundData(accountInfo.data);
          console.log('Round data:', decodedData);
          
          return decodedData;
        } catch (err) {
          console.error('Error fetching round data:', err);
          setError(err.message);
          return null;
        }
      };
  
      const fetchAllRoundsData = async () => {
        if (!connection) {
          console.error('No connection available');
          return;
        }
  
        try {
          
  
          // When single round works, uncomment to fetch all rounds
          
          if (gameData?.activeRounds) {
            const allRoundsData = await Promise.all(
              gameData.activeRounds.map(roundId => fetchRoundData(roundId))
            );
            setRoundsData(allRoundsData.filter(data => data !== null));
          }
          
        } catch (err) {
          console.error('Error in fetchAllRoundsData:', err);
          setError(err.message);
        }
      };
  
      fetchAllRoundsData();
    }, [connection, gameData]);
  
    if (error) {
      return (
        <div className="p-4">
          <h1 className="text-xl font-bold mb-4">Error</h1>
          <div className="text-red-500">{error}</div>
        </div>
      );
    }
  
    return (
      <div className="min-h-screen bg-purple-900">
      {/* Header */}
      <div className="p-4">
        <div className="flex justify-between items-center mb-4">
          <div>
            <div className="text-white text-lg font-semibold">Hi, {userNameAndSurname == ""?"Pak Chau":userNameAndSurname}</div>
            <div className="text-white/60 text-sm">Welcome Back</div>
          </div>
          <div className="bg-yellow-500 w-10 h-10 rounded-full">
            <img src={userImage || "https://i1.sndcdn.com/avatars-000706728712-ol0h4p-t500x500.jpg"}/>
          </div>
        </div>
        <h1 class="text-3xl font-bold text-white">
             Round List
           </h1>
        {/* Search Bar */}
        {/* <div className="relative mb-6">
          <Search className="absolute left-3 top-2.5 text-gray-400 w-5 h-5" />
          <input 
            type="text"
            placeholder="Search game..."
            className="w-full bg-white rounded-full py-2 pl-10 pr-4"
          />
        </div> */}
      </div>

      {/* Game Cards */}
      <div className="px-4">
  
        {roundsData.map((round,index) => (

            <GameCard
            key={round.id} 
            time={datTimeList[index] == null ? "22 MAR 15:00":datTimeList[index]}
            status={round.minPlayers+`/`+round.maxPlayers}
            title="BATTLE ROYALE"
            betAmount={round.entryFees}
            joined={index==0?true:false}
          />
              ))}
              
     
    
      </div>

    
    </div>
    );
}

const GameCard = ({ time, status, title, betAmount, joined }) => (
  <div className="bg-white/10 rounded-lg p-4 mb-4">
    <div className="flex justify-between mb-2">
      <div className="bg-white/20 rounded-full px-3 py-1 text-xs text-white">
        {time}
      </div>
      <div className="bg-white/20 rounded-full px-3 py-1 text-xs text-white">
        {status}
      </div>
    </div>
    <div className="text-white mb-2">{title}</div>
    <div className="flex justify-between items-center">
      <div className="text-white/60 text-sm">${betAmount} BETS</div>
      <button 
        className={`px-4 py-1 rounded-full text-sm ${
          joined ? 'bg-red-500 text-white' : 'bg-green-500 text-white'
        }`}
      >
        {joined ? 'JOINED' : 'JOIN'}
      </button>
    </div>
  </div>
);