
import WebApp from '@twa-dev/sdk';
import React, { useEffect, useState } from "react";
import { useGameData } from '@/provider/GameDataProvider';
import { decodeRoundData } from "@/types/RoundDecoder";
import PhantomWalletConnect from '../PhantomWallet/PhantomWalletPage';
import { PublicKey,SystemProgram, Transaction, TransactionInstruction } from "@solana/web3.js";
import { TOKEN_PROGRAM_ID, getAssociatedTokenAddress } from '@solana/spl-token';
import { Buffer } from 'buffer';

export function RoundListPage() {
  const ROUND_SEED_PREFIX = "round";
  const PROGRAM_ID = "3fNocwdPfKwywpS7E7GUGkPDBDhXJ9xsdDmNb4m7TKXr";

  const [userImage, setUserImage] = useState("");
  const [userNameAndSurname, setUserNameAndSurname] = useState("");
  const [roundsData, setRoundsData] = useState([]);
  const [error, setError] = useState(null);
  const [balance, setBalance] = useState(null);
  const { gameData, connection } = useGameData();
  // const accountsData = useMultiAccountSubscription(accountsConfig, connection);
  let datTimeList = ["10 FEB 2024 22:22", "12 FEB 12:00", "31 FEB 09:10", "02 MAR 23:00"];

  const numberToLeBytes = (num) => {
      const arr = new ArrayBuffer(8);
      const view = new DataView(arr);
      view.setBigInt64(0, BigInt(num), true);
      return new Uint8Array(arr);
  };
  const getDiscriminator = (name) => {
    const input = new TextEncoder().encode(`global:${name}`);
    return crypto.subtle.digest('SHA-256', input)
      .then(hash => new Uint8Array(hash).slice(0, 8));
  };

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
        fetchAllRoundsData();
        checkBalance();
    }
}, [connection, gameData]);



 const fetchRoundData = async (roundId) => {
  try {

      const roundPDA = await deriveRoundPDA(roundId);
      
    
      const accountInfo = await connection.getAccountInfo(roundPDA);
      
      
      if (!accountInfo) {
          console.error(`No account found for round ${roundId} at address ${roundPDA.toString()}`);
          return null;
      }


      
      const decodedData = decodeRoundData(accountInfo.data);


      return {
          ...decodedData,
          id: roundId
      };

  } catch (err) {
      console.error(`Error fetching round ${roundId} data:`, err);
      return null;
  }
  };
    // Effect to set up account config


 

    const fetchAllRoundsData = async () => {
    if (!connection || !gameData?.activeRounds) {
        console.log('No connection or no active rounds available');
        return;
    }

    try {
        console.log('Active rounds to fetch:', gameData.activeRounds);
        
        const allRoundsData = await Promise.all(
            gameData.activeRounds.map(roundId => fetchRoundData(roundId))
        );

        const validRoundsData = allRoundsData.filter(data => data !== null);
        console.log('Valid rounds data fetched:', validRoundsData.length);
        
        setRoundsData(validRoundsData);

    } catch (err) {
        console.error('Error in fetchAllRoundsData:', err);
        setError(err.message);
    }
    };
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
       
       
      } catch (err) {
        console.error("Detailed error in checkBalance:", err);
      }
    };
    const deriveRoundPDA = async (roundId) => {
      try {
          const programId = new PublicKey(PROGRAM_ID);
          // Convert roundId to number and then to bytes
          const roundIdNumber = parseInt(roundId, 10);
          const roundIdBytes = numberToLeBytes(roundIdNumber);
          const roundBytes = new TextEncoder().encode(ROUND_SEED_PREFIX);


          const [roundPDA] = await PublicKey.findProgramAddress(
              [roundBytes, roundIdBytes],
              programId
          );

       
          return roundPDA;

      } catch (err) {
          console.error('Error deriving Round PDA:', err);
          throw err;
      }
    };
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
    const deriveRoundVaultPDA = async (roundPDA, programId) => {
      return await PublicKey.findProgramAddress(
        [
          Buffer.from("round_vault"),
          roundPDA.toBytes()
        ],
        programId
      );
    };
    
    const joinRound = async ({
      connection,
      roundId,
      playerKey,
      tokenMint,
      programId
    }) => {
      try {
        console.log('Starting joinRound with roundId:', roundId);
        
        // Convert string public keys to PublicKey objects
        const programPubkey = new PublicKey(programId);
        const playerPubkey = new PublicKey(playerKey);
        const tokenMintPubkey = new PublicKey(tokenMint);
    
        // Get latest blockhash
        const { blockhash } = await connection.getLatestBlockhash();
    
        // Derive necessary PDAs
        console.log('Deriving PDAs...');
        const roundPDA = await deriveRoundPDA(roundId);
        console.log('Round PDA:', roundPDA.toString());
        
        const [playerPDA] = await derivePlayerPDA(playerPubkey, programPubkey);
        console.log('Player PDA:', playerPDA.toString());
        
        const [roundVault] = await deriveRoundVaultPDA(roundPDA, programPubkey);
        console.log('Round Vault PDA:', roundVault.toString());
    
        // Get player's Associated Token Account
        const playerATA = await getAssociatedTokenAddress(
          tokenMintPubkey,
          playerPubkey
        );
        console.log('Player ATA:', playerATA.toString());
    
        // Get instruction discriminator and await it
        console.log('Getting instruction discriminator...');
        const discriminator = await getDiscriminator('join_round');
        console.log('Discriminator:', Array.from(discriminator));
    
        // Create instruction data buffer
        const data = Buffer.from(discriminator);
        
        console.log('Creating instruction...');
        // Create the instruction
        const instruction = new TransactionInstruction({
          keys: [
            { pubkey: roundPDA, isSigner: false, isWritable: true },
            { pubkey: playerPDA, isSigner: false, isWritable: true },
            { pubkey: playerPubkey, isSigner: true, isWritable: true },
            { pubkey: playerATA, isSigner: false, isWritable: true },
            { pubkey: roundVault, isSigner: false, isWritable: true },
            { pubkey: tokenMintPubkey, isSigner: false, isWritable: false },
            { pubkey: TOKEN_PROGRAM_ID, isSigner: false, isWritable: false },
            { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
          ],
          programId: programPubkey,
          data: data,
        });
    
        console.log('Creating transaction...');
        // Create transaction
        const transaction = new Transaction().add(instruction);
        transaction.recentBlockhash = blockhash;
        transaction.feePayer = playerPubkey;
    
        return transaction;
    
      } catch (error) {
        console.error('Error in joinRound:', error);
        throw error;
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
    
        console.log('Creating transaction...');
        const transaction = await joinRound({
          connection,
          roundId,
          playerKey: pubKeyStr,
          tokenMint: 'HheqA6fWoBHM8TNKNCqbwBah83S7bdtMCSq1KcZkJYaj',
          programId: PROGRAM_ID
        });
    
        console.log('Requesting signature...');
        const signed = await window.solana.signTransaction(transaction);
        
        console.log('Sending transaction...');
        const signature = await connection.sendRawTransaction(
          signed.serialize()
        );
    
        console.log('Awaiting confirmation...');
        const confirmation = await connection.confirmTransaction(signature);
        
        if (confirmation.value.err) {
          throw new Error('Transaction failed: ' + JSON.stringify(confirmation.value.err));
        }
    
        console.log('Successfully joined round:', signature);
        alert('Successfully joined round!');
        
        // Refresh the rounds data
        await fetchAllRoundsData();
    
      } catch (error) {
        console.error('Failed to join round:', error);
        alert('Failed to join round: ' + error.message);
      }
    };
    
    const GameCard = ({ time, status, title, betAmount, joined ,roundId}) => (
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
      <div className="min-h-screen bg-purple-900">
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
            <PhantomWalletConnect/>
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

