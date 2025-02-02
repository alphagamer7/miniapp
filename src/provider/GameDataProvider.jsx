// GameDataContext.js
import React, { createContext, useState, useContext, useEffect } from "react";
import { Connection, PublicKey } from "@solana/web3.js";
import { decodeGameData } from "@/types/GameDecoder";

// Creating a context object.
const GameDataContext = createContext(null);

// Custom hook to use the context.
export const useGameData = () => useContext(GameDataContext);

// Provider component that encapsulates logic for fetching game data and handling the connection.
export const GameDataProvider = ({ children }) => {
  const [gameData, setGameData] = useState(null); // State to store the game data.
  const [error, setError] = useState(null); // State to handle any errors.
  const [connection, setConnection] = useState(null); // State to manage the Solana connection.

  const NETWORK_URL = "https://api.devnet.solana.com"; // Network URL for Solana connection.
  const PROGRAM_ID = "3fNocwdPfKwywpS7E7GUGkPDBDhXJ9xsdDmNb4m7TKXr"; // Public key of the deployed Solana program.

  const GAME_ID = "01JJTNB117QN0TYB0RQPX2V0N6"; // Identifier for the game.
  const GAME_SEED_PREFIX = "game"; // Prefix used to derive the PDA.
  // Effect to establish the connection once on component mount.
  useEffect(() => {
    try {
      const newConnection = new Connection(NETWORK_URL);
      setConnection(newConnection);
    } catch (error) {
      console.error('Failed to create connection:', error);
      setError('Failed to connect to the network.');
    }
  }, [NETWORK_URL]); // Dependency array with NETWORK_URL to re-establish connection if URL changes.

  // Effect to fetch game data whenever the connection is established or changed.
  useEffect(() => {
    const fetchGameData = async () => {
      if (!connection) return; // Guard clause to exit if there's no connection.

      try {
        const gamePDA = await deriveGamePDA(); // Derive the PDA for the game.
        const accountInfo = await connection.getAccountInfo(gamePDA); // Fetch the account information.
        if (!accountInfo) throw new Error("Game account not found"); // Error handling if account is not found.

        const decodedData = decodeGameData(accountInfo.data); // Decode the fetched game data.
  
        setGameData(decodedData); // Set the game data in state.
      } catch (err) {
        console.error('Fetching game data failed:', err);
        setError(err.message); // Set error in state if fetching fails.
      }
    };

    // Function to derive the Program Derived Address (PDA) based on game ID and program.
    const deriveGamePDA = async () => {
        const programId = new PublicKey(PROGRAM_ID);
        const gameIdBytes = new TextEncoder().encode(GAME_ID);
        const gameSeedBytes = new TextEncoder().encode(GAME_SEED_PREFIX);
        const [gamePDA] = await PublicKey.findProgramAddress(
          [gameSeedBytes, gameIdBytes],
          programId
        );
        return gamePDA;
      };

    fetchGameData();
  }, [connection, PROGRAM_ID, GAME_SEED_PREFIX, GAME_ID]); // Dependency array to re-fetch data when these values change.

  // Providing the context value to children components.
  return (
    <GameDataContext.Provider value={{ gameData, error, connection }}>
      {children}
    </GameDataContext.Provider>
  );
};
