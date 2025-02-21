
import WebApp from '@twa-dev/sdk';
import React, { useEffect, useState } from "react";
import { useGameData } from '@/provider/GameDataProvider';
import { decodeRoundData } from "@/types/RoundDecoder";
import PhantomWalletConnect from '../PhantomWallet/PhantomWalletPage';
import { PublicKey,SystemProgram, Transaction, TransactionInstruction } from "@solana/web3.js";
import { TOKEN_PROGRAM_ID, getAssociatedTokenAddress } from '@solana/spl-token';
// import { Buffer } from 'buffer';
import { AccountDecoder } from '@/hook/UseMultiAccountSubscription';
import {SolanaService} from "@/services/solanaService";

export function RoundListPage() {
  const PROGRAM_ID = "3fNocwdPfKwywpS7E7GUGkPDBDhXJ9xsdDmNb4m7TKXr";

  const [userImage, setUserImage] = useState("");
  const [userNameAndSurname, setUserNameAndSurname] = useState("");
  const [userPublicKey, setUserPublicKey] = useState("");
  const [error, setError] = useState(null);
  const [balance, setBalance] = useState(null);
  const { gameData, connection,roundsData } = useGameData();

  // const accountsData = useMultiAccountSubscription(accountsConfig, connection);
  let datTimeList = ["10 FEB 2024 22:22", "12 FEB 12:00", "31 FEB 09:10", "02 MAR 23:00"];

  useEffect(() => {

      const initData = WebApp.initDataUnsafe;
      if (initData && initData.user) {
          setUserImage(initData.user.photo_url || "");
          const fullName = [initData.user.first_name, initData.user.last_name].filter(Boolean).join(" ");
          setUserNameAndSurname(fullName);
      }
  }, []);
  useEffect(() => {
    if (gameData && connection) {
        checkBalance();
    }
}, [connection, gameData]);
    const checkBalance = async () => {
      try {
        const pubKeyStr = localStorage.getItem("publicKey");
        if (!pubKeyStr) {
          console.log("No public key found in localStorage");
          return;
        }
 
        const publicKey = new PublicKey(pubKeyStr);
     
        const programPubkey = new PublicKey(PROGRAM_ID);
    
        const balanceInLamports = await connection.getBalance(publicKey);
     
        const balanceInSOL = balanceInLamports / 1000000000;
        console.log(`Balance Sol ${balanceInSOL}`);
        setBalance(balanceInSOL);
        setUserPublicKey(pubKeyStr)
       
      } catch (err) {
        console.error("Detailed error in checkBalance:", err);
      }
    };
    

    const handleJoinRound = async (roundId) => {
      try {
        console.log('Starting join round process for roundId:', roundId);
        
        const pubKeyStr = localStorage.getItem("publicKey");
        if (!pubKeyStr) {
          alert('Please connect your wallet first');
          return;
        }
    
        if (!window.solana) {
          alert('Solana wallet is not installed');
          return;
        }
    
        const transaction = await SolanaService.createJoinRoundTransaction({
          connection,
          roundId,
          playerKey: pubKeyStr,
          tokenMint: 'HheqA6fWoBHM8TNKNCqbwBah83S7bdtMCSq1KcZkJYaj'
        });
    
        console.log('Transaction created, requesting signature...');
        const signed = await window.solana.signTransaction(transaction);
        
        console.log('Transaction signed, sending to network...');
        const signature = await connection.sendRawTransaction(signed.serialize());
        
        console.log('Transaction sent, awaiting confirmation...');
        const confirmation = await connection.confirmTransaction(signature);
        
        if (confirmation.value.err) {
          throw new Error('Transaction failed: ' + JSON.stringify(confirmation.value.err));
        }
    
        console.log('Transaction confirmed:', signature);
        alert('Successfully joined round!');
      } catch (error) {
        console.error('Failed to join round:', error);
        if (error.message.includes('User rejected')) {
          alert('Transaction was rejected by the user');
        } else {
          alert('Failed to join round: ' + error.message);
        }
      }
    };
    
    const GameCard = ({ time, status, title, betAmount, joined ,roundId,roundStatus}) => (
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
          <div className="text-white/60 text-sm">{roundStatus}</div>
          <button
          onClick={()=>handleJoinRound(roundId)}
            className={`px-4 py-1 rounded-full text-sm ${
              joined ? 'bg-red-500 text-white' : 'bg-green-500 text-white'
            }`}
          >
            {joined ? 'JOINED' : 'JOIN'}
          </button>
        </div>
      </div>
    );

    if (error) {
      return (
        <div className="p-4">
          <h1 className="text-xl font-bold mb-4">Error</h1>
          <div className="text-red-500">{error}</div>
        </div>
      );
    }

    return (
      <div className="min-h-screen bg-purple-900 pb-20 overflow-y-auto">
      {/* Header */}
      <div className="p-4">
        <div className="flex justify-between items-center mb-4">
          <div>
            <div className="text-white text-lg font-semibold">Hi, {userNameAndSurname == ""?"Pak Chau":userNameAndSurname}</div>
            <div className="text-white/60 text-sm">Welcome Back</div>
            {balance !== null && (
              <button 
              className={`px-4 py-1 rounded-full text-sm   bg-blue-400 text-white`}
            >
              {`${balance} SOL`}
            </button>
            )}
          </div>
          <div>
            {/* <PhantomWalletConnect/> */}
          </div>
          <div className="bg-yellow-500 w-10 h-10 rounded-full">
            <img src={userImage || "https://i1.sndcdn.com/avatars-000706728712-ol0h4p-t500x500.jpg"}/>
          </div>
        </div>
        <h1 className="text-3xl font-bold text-white">
             Round List
           </h1>
        
      </div>
      
      {/* Game Cards */}
      <div className="px-4">
  
        {roundsData.map((round,index) => (

                  <GameCard
                  key={round.id}
                  roundId={round.id}
                  time={datTimeList[index] == null ? "22 MAR 15:00" : datTimeList[index]}
                  status={round.minPlayers + "/" + round.maxPlayers}
                  title="BATTLE ROYALE"
                  betAmount={round.entryFees}
                  joined={round.players.includes(userPublicKey)}
                  roundStatus={round.state}
                  />
              ))}
              
     
    
      </div>

    
    </div>
    );
    
}

