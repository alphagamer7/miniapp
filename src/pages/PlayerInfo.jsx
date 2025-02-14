
import WebApp from '@twa-dev/sdk';
import React, { useEffect, useState } from "react";
import { useGameData } from '@/provider/GameDataProvider';
import { decodeRoundData } from "@/types/RoundDecoder";
import { decodePlayerData } from "@/types/PlayerDecoder";
import { PublicKey,SystemProgram, Transaction, TransactionInstruction } from "@solana/web3.js";
import { TOKEN_PROGRAM_ID, getAssociatedTokenAddress } from '@solana/spl-token';
import { Buffer } from 'buffer';

export function PlayerInfoPage() {
    const [playerData, setPlayerData] = useState(null);
    const PROGRAM_ID = "3fNocwdPfKwywpS7E7GUGkPDBDhXJ9xsdDmNb4m7TKXr";
      const { gameData, connection } = useGameData();
    useEffect(() => {
        const loadPlayerData = async () => {
          if (!connection) return;
          
          const pubKeyStr = localStorage.getItem("publicKey");
          if (!pubKeyStr) return;
          
          const data = await fetchPlayerAccountInfo(pubKeyStr);
          setPlayerData(data);
        };
    
        loadPlayerData();
      }, [connection]);
        const derivePlayerPDA = async (playerPubkey, programId) => {
            try {
              console.log("Deriving Player PDA for:", playerPubkey.toString());
              const [playerPDA] = await PublicKey.findProgramAddress(
                [
                  Buffer.from("player"),
                  playerPubkey.toBytes()
                ],
                programId
              );
              console.log('Generated Player PDA:', playerPDA.toString());
              return [playerPDA];
            } catch (err) {
              console.error('Error deriving Player PDA:', err);
              throw err;
            }
          };
    const fetchPlayerAccountInfo = async (playerKey) => {
        try {
          console.log('Fetching player account info for:', playerKey);
          
          // Derive player PDA
          const programId = new PublicKey(PROGRAM_ID);
          const playerPubkey = new PublicKey(playerKey);
          const [playerPDA] = await derivePlayerPDA(playerPubkey, programId);
          
          console.log('Player PDA:', playerPDA.toString());
          
          // Fetch account info
          const accountInfo = await connection.getAccountInfo(playerPDA);
          
          if (!accountInfo) {
            console.log('No player account found');
            return null;
          }
          
          console.log('Account found! Data length:', accountInfo.data.length);
          
          // Decode the account data
          const decodedData = decodePlayerData(accountInfo.data);
          console.log('Decoded player data:', decodedData);
          console.log('Decoded player data:', JSON.stringify(decodedData));
          
          return decodedData;
          
        } catch (error) {
          console.error('Error fetching player account:', error);
          return null;
        }
      };
    const PlayerInfoCard = ({ playerData }) => {
        if (!playerData) return null;
        
        return (
          <div className="bg-white/10 rounded-lg p-4 mb-4">
            <h2 className="text-white text-lg font-semibold mb-2">Your Player Info</h2>
            
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-white/60">Wallet:</span>
                <span className="text-white truncate ml-2 w-32">{playerData.walletKey.slice(0, 4)}...{playerData.walletKey.slice(-4)}</span>
              </div>
              
              <div className="flex justify-between">
                <span className="text-white/60">Total Rounds:</span>
                <span className="text-white">{playerData.totalRounds}</span>
              </div>
              
              <div className="flex justify-between">
                <span className="text-white/60">Total Bet:</span>
                <span className="text-white">{playerData.totalBet}</span>
              </div>
              
              <div className="flex justify-between">
                <span className="text-white/60">Total Payout:</span>
                <span className="text-white">{playerData.totalPayout}</span>
              </div>
      
              {playerData.currentRounds.length > 0 && (
                <div className="mt-4">
                  <h3 className="text-white text-md font-semibold mb-2">Current Rounds</h3>
                  <div className="space-y-1">
                    {playerData.currentRounds.map((roundId, index) => (
                      <div key={index} className="text-white/80">Round #{roundId}</div>
                    ))}
                  </div>
                </div>
              )}
      
              {playerData.roundHistories.length > 0 && (
                <div className="mt-4">
                  <h3 className="text-white text-md font-semibold mb-2">Round History</h3>
                  <div className="space-y-2">
                    {playerData.roundHistories.map((history, index) => (
                      <div key={index} className="bg-white/5 p-2 rounded">
                        <div className="text-white/80">Round #{history.roundId}</div>
                        <div className="text-white/60 text-sm">Bet: {history.betAmt}</div>
                        <div className="text-white/60 text-sm">Payout: {history.payoutAmt}</div>
                        <div className="text-white/60 text-sm">Eliminated Turn: {history.eliminatedTurn}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        );
      };
    return (
      <div className="min-h-screen bg-purple-900">
     

     <PlayerInfoCard playerData={playerData} />
    </div>
    );
    
    
}

