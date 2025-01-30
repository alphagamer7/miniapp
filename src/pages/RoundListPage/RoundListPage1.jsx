import WebApp from '@twa-dev/sdk';
import { List } from '@telegram-apps/telegram-ui';

import { DisplayData } from '@/components/DisplayData/DisplayData.jsx';
import React, { useEffect, useState } from "react";
import { useGameData } from '@/provider/GameDataProvider';
import { decodeRoundData } from "@/types/RoundDecoder";
import { Connection, PublicKey } from "@solana/web3.js";

export function RoundListPage1() {
    const ROUND_SEED_PREFIX = "round";
    const PROGRAM_ID = "4bBkyHda9na1mhWG6iHBShoNZtfyx9ZGYbvcFBjrqwGX";
    const GAME_ID = "01JJQKQTNZ6P9F7E7TJCGSBKPS";
  
    const [roundsData, setRoundsData] = useState([]);
    const [error, setError] = useState(null);
    const { gameData, connection } = useGameData();
  
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
          console.log('Round PDA:', roundPDA.toBase58());
          
          const accountInfo = await connection.getAccountInfo(roundPDA);
          
          console.log('Account Info:', accountInfo);
          
          if (!accountInfo) {
            console.error('Round account not found');
            return null;
          }
  
          console.log('Account data length:', accountInfo.data.length);
          console.log('Raw account data:', accountInfo.data);
          
          const decodedData = decodeRoundData(accountInfo.data);
          console.log('Decoded data:', decodedData);
          
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
      <div className="p-4">
        <h1 className="text-xl font-bold mb-4">Game Query</h1>
      
        {gameData ? (
          <div className="space-y-4">
            <div className="bg-gray-100 p-4 rounded">
              <h2 className="font-semibold mb-2">Game Data:</h2>
              <pre className="whitespace-pre-wrap">{JSON.stringify(gameData, null, 2)}</pre>
            </div>
            
          
            
            {roundsData.length > 0 && (
               
              <div className="bg-gray-100 p-4 rounded">
                <h2 className="font-semibold mb-2">All Rounds:</h2>
                <pre className="whitespace-pre-wrap">{JSON.stringify(roundsData, null, 2)}</pre>
              </div>
            )}
          </div>
        ) : (
          <div className="animate-pulse">Loading...</div>
        )}
      </div>
    );
}
