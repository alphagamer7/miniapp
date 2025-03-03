// GameDataContext.js
import React, { createContext, useState, useContext, useEffect } from "react";
import { Connection, PublicKey,clusterApiUrl } from "@solana/web3.js";
import { decodeGameData } from "@/types/GameDecoder";
import {AccountDecoder} from "@/hook/UseMultiAccountSubscription"
import { decodeRoundData } from "@/types/RoundDecoder";

// Creating a context object.
const GameDataContext = createContext(null);

// Custom hook to use the context.
export const useGameData = () => useContext(GameDataContext);

// Provider component that encapsulates logic for fetching game data and handling the connection.
export const GameDataProvider = ({ children }) => {
  const [gameData, setGameData] = useState(null); // State to store the game data.
  const [error, setError] = useState(null); // State to handle any errors.
  const [connection, setConnection] = useState(null); // State to manage the Solana connection.
  const [roundsData, setRoundsData] = useState([]);
  const [subscriptions, setSubscriptions] = useState(new Map());

  // const NETWORK_URL = "https://api.devnet.solana.com"; // Network URL for Solana connection.
  const NETWORK_URL = "https://api.devnet.solana.com"; // Network URL for Solana connection.
  const PROGRAM_ID = "5UX9tzoZ5Tg7AbHvNbUuDhapAPFSJijREKjJpRQR8wof"; // Public key of the deployed Solana program.

  const GAME_ID = "1740528038057"; // Identifier for the game.
  // const GAME_ID = "1738688341478"; // Identifier for the game.
  // const GAME_ID = "1740356349542"; // Identifier for the game.
  const GAME_SEED_PREFIX = "game"; // Prefix used to derive the PDA.
  const ROUND_SEED_PREFIX = "round";

// Function to derive the Program Derived Address (PDA) based on game ID and program.
const deriveGamePDA = async () => {

  const programId = new PublicKey(PROGRAM_ID);
  const gameIdBytes = numberToLeBytes(GAME_ID);
  const gameSeedBytes = new TextEncoder().encode(GAME_SEED_PREFIX);
  const [gamePDA] = await PublicKey.findProgramAddress(
    [gameSeedBytes, gameIdBytes],
    programId
  );
  return gamePDA;
};
const deriveRoundPDA = async (roundId) => {
  // Convert gameId (uint64) and roundId (uint32) to byte arrays in little-endian format
  const gameIdBytes = new ArrayBuffer(8); // 8 bytes for a 64-bit number
  const view64 = new DataView(gameIdBytes);
  view64.setBigUint64(0, BigInt(GAME_ID), true); // true for little-endian

  const roundIdBytes = new ArrayBuffer(4); // 4 bytes for a 32-bit number
  const view32 = new DataView(roundIdBytes);
  view32.setUint32(0, roundId, true); // true for little-endian

  // Combine the seeds for the PDA derivation
  const seeds = [
    new TextEncoder().encode("round"), // Prefix as a byte array
    new Uint8Array(gameIdBytes),       // Game ID as a byte array
    new Uint8Array(roundIdBytes),      // Round ID as a byte array
  ];

  // Find the Program Derived Address using the provided seeds and the program ID
  try {
    const [roundPDA] = await PublicKey.findProgramAddress(seeds, new PublicKey(PROGRAM_ID));
    return { roundPDA };
  } catch (error) {
    console.error("Error deriving Round PDA:", error);
    throw error;
  }
};
const fetchRoundData = async (roundId) => {
  try {
    const roundPDA = await deriveRoundPDA(roundId);
    console.log(`Round PDA ${JSON.stringify(roundPDA)}`);

    const accountInfo = await connection.getAccountInfo(roundPDA.roundPDA);
    
    if (!accountInfo) {
      console.error(`No account found for round ${roundId}`);
      return null;
    }

    // Decode the initial data
    const decodedData = decodeRoundData(accountInfo.data);
    
    // Set up subscription for updates
    if (!subscriptions.has(roundId)) {
      const subscriptionId = connection.onAccountChange(
        roundPDA.roundPDA,
        (updatedAccountInfo) => {
          console.log(`Round Data Updated`);
          const updatedDecodedData = decodeRoundData(updatedAccountInfo.data);
          console.log(`Round Data Updated ${JSON.stringify(updatedDecodedData)}`);
          
          setRoundsData(prevRounds => {
            return prevRounds.map(round => {
              if (round.id === roundId) {
                return { ...updatedDecodedData, id: roundId };
              }
              return round;
            });
          });
        },
        'confirmed'
      );

      if (subscriptionId) {
        setSubscriptions(prev => new Map(prev).set(roundId, subscriptionId));
      }
    }

    // Return the initially decoded data
    return {
      ...decodedData,
      id: roundId
    };
  } catch (err) {
    console.error(`Error fetching round ${roundId} data:`, err);
    return null;
  }
};

const numberToLeBytes = (num) => {
  const arr = new ArrayBuffer(8); // 8 bytes for a 64-bit number
  const view = new DataView(arr);
  view.setBigInt64(0, BigInt(num), true); // true for little-endian
  return new Uint8Array(arr);
};

  // const GAME_ID = "01JJTNB117QN0TYB0RQPX2V0N6"; // Identifier for the game.
  // Effect to establish the connection once on component mount.
  useEffect(() => {
    console.log("WORKING")
    try {

      // Add configuration for better reliability
      const config = {
        commitment: 'confirmed',
        confirmTransactionInitialTimeout: 60000,
        wsEndpoint: 'wss://api.devnet.solana.com/',
      };
      
      const newConnection = new Connection(clusterApiUrl("devnet"), "confirmed");
      
      setConnection(newConnection);

      // Verify connection
      newConnection.getVersion().then(version => {
        console.log("Connected to Solana network:", version);
      }).catch(err => {
        console.error("Failed to verify connection:", err);
      });

    } catch (error) {
      console.error('Failed to create connection:', error);
      setError('Failed to connect to the network.');
    }
  }, [NETWORK_URL]);
    // Set up game data subscription
    useEffect(() => {
      let gameSubscriptionId = null;
  
      const setupGameSubscription = async () => {
        if (!connection) return;
  
        try {
          const pda = await deriveGamePDA();
          gameSubscriptionId = await AccountDecoder.setupGameSubscription(
            connection,
            pda,
            async (decodedGameData) => {
              console.log("Game data updated:", decodedGameData);
              setGameData(decodedGameData);
              
              // Fetch rounds data when game data updates
              if (decodedGameData.activeRounds) {
                const allRoundsData = await Promise.all(
                  decodedGameData.activeRounds.map(roundId => fetchRoundData(roundId))
                );
                const validRoundsData = allRoundsData.filter(data => data !== null);
                setRoundsData(validRoundsData);
              }
            }
          );
        } catch (err) {
          console.error('Error setting up game subscription:', err);
          setError('Failed to subscribe to game updates');
        }
      };
  
      setupGameSubscription();
  
      return () => {
        // Cleanup all subscriptions on unmount
        if (connection) {
          if (gameSubscriptionId) {
            connection.removeAccountChangeListener(gameSubscriptionId);
          }
          subscriptions.forEach((subscriptionId) => {
            connection.removeAccountChangeListener(subscriptionId);
          });
        }
      };
    }, [connection]);


  // Providing the context value to children components.
  return (
    <GameDataContext.Provider value={{ gameData,  roundsData,  error, connection ,  refreshRounds: async () => {
      if (gameData?.activeRounds) {
        const allRoundsData = await Promise.all(
          gameData.activeRounds.map(roundId => fetchRoundData(roundId))
        );
        const validRoundsData = allRoundsData.filter(data => data !== null);
        setRoundsData(validRoundsData);
      }
    }}}>
      {children}
    </GameDataContext.Provider>
  );
};


  // Effect to fetch game data whenever the connection is established or changed.
  // useEffect(() => {
  //   const fetchGameData = async () => {
  //     if (!connection) return; // Guard clause to exit if there's no connection.

  //     try {
  //       const gamePDA = await deriveGamePDA(); // Derive the PDA for the game.
        
  //       const accountInfo = await connection.getAccountInfo(gamePDA); // Fetch the account information.
        
  //       if (!accountInfo) throw new Error("Game account not found"); // Error handling if account is not found.
  //       console.log(`Decoding game Data...`)
  //       const decodedData = decodeGameData(accountInfo.data); // Decode the fetched game data.
  //       console.log(`Game DAta ${decodedData}`)
  //       setGameData(decodedData); // Set the game data in state.
  //     } catch (err) {
  //       console.error('Fetching game data failed:', err);
  //       setError(err.message); // Set error in state if fetching fails.
  //     }
  //   };

    

  //   fetchGameData();
  // }, [connection, PROGRAM_ID, GAME_SEED_PREFIX, GAME_ID]); 
