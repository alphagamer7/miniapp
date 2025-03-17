import React, { useState, useEffect } from 'react';
import { Header } from '@/components/Header';
import { UserProfileCard } from '@/components/UserProfileCard';
import { useGameData } from '@/provider/GameDataProvider';
import { decodePlayerData } from "@/types/PlayerDecoder";
import { PublicKey } from "@solana/web3.js";
import { useGameId } from '@/hooks/useGameId';
const BalanceAndHistory = () => {
  const [playerData, setPlayerData] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [balance, setBalance] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  const PROGRAM_ID = "5UX9tzoZ5Tg7AbHvNbUuDhapAPFSJijREKjJpRQR8wof";

  const { gameData, connection, roundsData,completedRounds } = useGameData();
  const { gameId } = useGameId();
  const GAME_ID = gameId || "1741655861356"; 


  
  useEffect(() => {
    const loadPlayerData = async () => {
      if (!connection) return;
      
      const pubKeyStr = localStorage.getItem("publicKey");
      if (!pubKeyStr) return;
      
      try {
        setIsLoading(true);
        const data = await fetchPlayerAccountInfo(pubKeyStr);
        
        if (data) {
          console.log(`Data ${JSON.stringify(data)}`)
          setPlayerData(data);
          // Update balance from totalPayout - totalBet
          const totalBet = BigInt(data.totalBet);
          const totalPayout = BigInt(data.totalPayout);
          setBalance(Number(totalPayout - totalBet));
          
          // Generate transactions from round data
          if (roundsData) {
            generateTransactionHistory(data, roundsData);
          }
        }
      } catch (error) {
        console.error("Error loading player data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadPlayerData();
  }, [connection, roundsData]);

  const generateTransactionHistory = (playerData, roundsData) => {
    const txHistory = [];
  
    // Format current date with time for active games
    const date = new Date().toLocaleDateString(undefined, {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    }) + ' ' + new Date().toLocaleTimeString(undefined, {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });
    
    // Add current rounds (active games)
    
    if (playerData.currentRounds && playerData.currentRounds.length > 0) {

      playerData.currentRounds.forEach(roundIdStr => {
        const roundId = parseInt(roundIdStr);

      
        const roundInfo = roundsData.find(r => parseInt(r.id) === roundId);
  
        if (roundInfo) {
     
          txHistory.push({
            date:date,
            type: `Joined #${roundId}`,
            amount: -Number(roundInfo.entryFees || 100), // Default to 100 if not available
            roundId
          });
        }
      });
    }
    
    // Add round histories (completed games)

    if (playerData.roundHistories && playerData.roundHistories.length > 0) {
      playerData.roundHistories.forEach(history => {
        const roundId = parseInt(history.roundId);
   

       
        const roundInfo = completedRounds.find(r => parseInt(r.id) === roundId);
        

        if(roundInfo && roundInfo.state==="Closed"){
  

          const turnEndedAt = parseInt(roundInfo.turnInfo[roundInfo.turnInfo.length - 1].turnEndedAt)
        const dateObj = new Date(parseInt(turnEndedAt) * 1000);
        const date = dateObj.toLocaleDateString(undefined, {
          day: 'numeric',
          month: 'short',
          year: 'numeric',
        }) + ' ' + dateObj.toLocaleTimeString(undefined, {
          hour: '2-digit',
          minute: '2-digit',
          hour12: false
        });
  
        if (history.isWinner) {
          txHistory.push({
            date,
            type: `Prize #${roundId}`,
            amount: Number(history.payoutAmt),
            roundId
          });
        } else {
          txHistory.push({
            date,
            type: `Lost #${roundId}`,
            amount: -Number(history.betAmt),
            roundId
          });
        }
        }
      
      });
    }
    
    // Sort by roundId (newest first)
    txHistory.sort((a, b) => b.roundId - a.roundId);

    setTransactions(txHistory);
  };

  const derivePlayerPDA = async (playerPubkey) => {
    const pubkey = new PublicKey(playerPubkey);

    // Convert gameId to bytes
    const gameIdBytes = new ArrayBuffer(8);
    const view = new DataView(gameIdBytes);
    view.setBigUint64(0, BigInt(GAME_ID), true);
    
    // Use the same seed pattern as in the Rust code
    const seeds = [
      new TextEncoder().encode("player"),
      pubkey.toBytes(),
      new Uint8Array(gameIdBytes)
    ];
    
    const [playerPDA] = await PublicKey.findProgramAddress(
      seeds,
      new PublicKey(PROGRAM_ID)
    );
    
 
    return playerPDA;
  };

  const fetchPlayerAccountInfo = async (playerKey) => {
    try {
   
      
      // Derive player PDA
      const programId = new PublicKey(PROGRAM_ID);
      const playerPubkey = new PublicKey(playerKey);
      const playerPDA = await derivePlayerPDA(playerPubkey);
      

      
      // Fetch account info
      const accountInfo = await connection.getAccountInfo(playerPDA);
      
      if (!accountInfo) {
        console.log('No player account found');
        return null;
      }

      
      // Decode the account data
      const decodedData = decodePlayerData(accountInfo.data);

      
      return decodedData;
      
    } catch (error) {
      console.error('Error fetching player account:', error);
      return null;
    }
  };

  // Render loading state if data isn't ready
  if (isLoading || !playerData) {
    return (
      <div className="flex flex-col min-h-screen bg-[#4400CE]">
        <Header />
        <div className="flex items-center justify-center h-full">
          <p className="text-white text-xl">Loading data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-[#4400CE] overflow-hidden">
      <Header className="flex-shrink-0" />
   
      <div className="overflow-y-auto flex-1 pb-6">
        <div className="p-4">
          <UserProfileCard />
        </div>

        {/* Action Buttons */}
        <div className="mx-4 mt-4 flex gap-4">
          <div className="flex-1 text-white text-xl font-semibold py-4 rounded-xl text-center border border-black">
            Withdraw
          </div>
          <div className="flex-1 text-white text-xl font-semibold py-4 rounded-xl text-center border border-black">
            Add
          </div>
        </div>

        {/* Player Stats */}
        <div className="mx-4 mt-4 flex gap-4">
          <div className="flex-1 text-white text-xl font-semibold py-4 rounded-xl text-center border border-black">
            Rounds
            <br/>{playerData.totalRounds}
          </div>
          <div className="flex-1 text-white text-xl font-semibold py-4 rounded-xl text-center border border-black">
            Bets
            <br/>{playerData.totalBet} $ELON
          </div>
          <div className="flex-1 text-white text-xl font-semibold py-4 rounded-xl text-center border border-black">
            Payout
            <br/>{playerData.totalPayout} $ELON
          </div>
        </div>

        {/* Transaction History */}
        <div className="mx-4 mt-4 mb-6 flex flex-col gap-2">
          <h2 className="text-white text-xl font-semibold mb-2">Transaction History</h2>
          {transactions.length > 0 ? (
            transactions.map((transaction, index) => (
              <div 
                key={index} 
                className="flex justify-between text-white py-2 px-4 rounded-lg border border-black"
              >
                <div className="text-sm text-white">{transaction.date}</div>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-white min-w-[80px] text-right">{transaction.type}</span>
                  <span className={transaction.amount > 0 ? 'text-green-400' : 'text-red-400'}>
                    {transaction.amount > 0 ? '+' : ''}{transaction.amount.toLocaleString()} $ELON
                  </span>
                </div>
              </div>
            ))
          ) : (
            <div className="text-white text-center py-4">
              No transaction history found
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default BalanceAndHistory;