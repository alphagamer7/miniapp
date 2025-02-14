// GameDataContext.js
import React, { createContext, useState, useContext, useEffect } from "react";
import { Connection, PublicKey,clusterApiUrl } from "@solana/web3.js";
import { decodeGameData } from "@/types/GameDecoder";
import {AccountDecoder} from "@/hook/UseMultiAccountSubscription"

// Creating a context object.
const GameDataContext = createContext(null);

// Custom hook to use the context.
export const useGameData = () => useContext(GameDataContext);

// Provider component that encapsulates logic for fetching game data and handling the connection.
export const GameDataProvider = ({ children }) => {
  const [gameData, setGameData] = useState(null); // State to store the game data.
  const [error, setError] = useState(null); // State to handle any errors.
  const [connection, setConnection] = useState(null); // State to manage the Solana connection.

  // const NETWORK_URL = "https://api.devnet.solana.com"; // Network URL for Solana connection.
  const NETWORK_URL = "https://api.devnet.solana.com"; // Network URL for Solana connection.
  const PROGRAM_ID = "3fNocwdPfKwywpS7E7GUGkPDBDhXJ9xsdDmNb4m7TKXr"; // Public key of the deployed Solana program.

  const GAME_ID = "1738688341478"; // Identifier for the game.
  const GAME_SEED_PREFIX = "game"; // Prefix used to derive the PDA.

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
  useEffect(() => {
    let subscriptionId = null;

    const setupGameSubscription = async () => {
      if (!connection) return;

      try {
        // Get the game PDA
        const pda = await deriveGamePDA();
       

        // Use AccountDecoder to set up subscription
        subscriptionId = await AccountDecoder.setupGameSubscription(
          connection,
          pda,
          (decodedData) => {
            console.log("Game data updated:", decodedData);
            setGameData(decodedData);
          }
        );

        console.log('Game subscription established with ID:', subscriptionId);
      } catch (err) {
        console.error('Error setting up game subscription:', err);
        setError('Failed to subscribe to game updates');
      }
    };

    setupGameSubscription();

    // Cleanup subscription
    return () => {
      if (subscriptionId && connection) {
        console.log('Cleaning up game subscription');
        connection.removeAccountChangeListener(subscriptionId);
      }
    };
  }, [connection]);


  // Providing the context value to children components.
  return (
    <GameDataContext.Provider value={{ gameData, error, connection }}>
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
