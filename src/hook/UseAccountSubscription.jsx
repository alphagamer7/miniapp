// hooks/useMultiAccountSubscription.js
import { useState, useEffect } from 'react';
import { decodePlayerData } from '@/types/PlayerDecoder';
import { decodeRoundData } from '@/types/RoundDecoder';
import { decodeGameData } from '@/types/GameDecoder';
import { Connection } from "@solana/web3.js";

// Define account types
const ACCOUNT_TYPES = {
  ROUND: 'round',
  GAME: 'game',
  PLAYER: 'player',
  PLAYER_TOKEN: 'player_token'
};

export const useMultiAccountSubscription = (accountsConfig, connection) => {
  const [subscriptions, setSubscriptions] = useState(new Map());
  const [accountsData, setAccountsData] = useState({
    rounds: {},
    game: null,
    player: null,
    playerToken: null
  });

  useEffect(() => {
    let ws = null;
    let nextSubId = 1;
    const subscriptionMap = new Map(); // Maps subscription IDs to account info

    const subscribeToAccount = async () => {
      try {
        if (!connection) return;

        const wsEndpoint = "wss://api.devnet.solana.com";
        ws = new WebSocket(wsEndpoint);

        ws.onopen = () => {
          console.log('WebSocket connected');
          const time = new Date();
          console.log(`Connecting websocket time ${time}`)
          
          // Subscribe to game PDA if provided
          if (accountsConfig.gamePDA) {
            const subId = nextSubId++;
            const subscribeMessage = createSubscribeMessage(subId, accountsConfig.gamePDA);
            subscriptionMap.set(subId, { 
              type: ACCOUNT_TYPES.GAME, 
              address: accountsConfig.gamePDA 
            });
            ws.send(JSON.stringify(subscribeMessage));
          }else if (accountsConfig.playerPDA) {
            const subId = nextSubId++;
            const subscribeMessage = createSubscribeMessage(subId, accountsConfig.playerPDA);
            subscriptionMap.set(subId, { 
              type: ACCOUNT_TYPES.PLAYER, 
              address: accountsConfig.playerPDA 
            });
            ws.send(JSON.stringify(subscribeMessage));
          }else if (accountsConfig.playerToken) {
         
            const subId = nextSubId++;
            console.log(`Player token pda ${subId}`)
            const subscribeMessage = createSubscribeMessage(subId, accountsConfig.playerToken);
            subscriptionMap.set(subId, { 
              type: ACCOUNT_TYPES.PLAYER_TOKEN, 
              address: accountsConfig.playerToken 
            });
            console.log(`Player token sub send message ${JSON.stringify(subscribeMessage)}`)
            ws.send(JSON.stringify(subscribeMessage));
          }else if (accountsConfig.roundPDAs && accountsConfig.roundPDAs.length > 0) {
            accountsConfig.roundPDAs.forEach(roundPDA => {
              const subId = nextSubId++;
              const subscribeMessage = createSubscribeMessage(subId, roundPDA);
              subscriptionMap.set(subId, { 
                type: ACCOUNT_TYPES.ROUND, 
                address: roundPDA 
              });
              ws.send(JSON.stringify(subscribeMessage));
            });
          }else{
            ws.close();
          }

          setSubscriptions(subscriptionMap);
        };

        ws.onmessage = (event) => {
          handleWebSocketMessage(event, subscriptionMap);
        };

        ws.onerror = (error) => {
          console.error('WebSocket error:', error);
        };

        ws.onclose = () => {
            const time = new Date();
            console.log(`WebSocket disconnected time ${time}`)
          console.log('WebSocket disconnected');
        };

      } catch (error) {
        console.error('Error setting up subscriptions:', error);
      }
    };

    const createSubscribeMessage = (id, pubkey) => ({
      jsonrpc: '2.0',
      id: id,
      method: 'accountSubscribe',
      params: [
        pubkey,
        {
          encoding: 'jsonParsed',
          commitment: 'confirmed'
        }
      ]
    });

    const handleWebSocketMessage = (event, subscriptionMap) => {
      const message = JSON.parse(event.data);
      console.log('WebSocket message:', message);

      // Handle subscription confirmation
      if (message.result !== undefined) {
        console.log(`Subscription confirmed for ID ${message.id}`);
        return;
      }

      // Handle account update notification
      if (message.method === 'accountNotification') {
        const subId = message.params.subscription;
        const accountInfo = message.params.result.value;
        const subInfo = subscriptionMap.get(subId);

        if (!subInfo || !accountInfo.data) return;

        const rawData = Buffer.from(accountInfo.data[0], 'base64');
        let decodedData;

        switch (subInfo.type) {
          case ACCOUNT_TYPES.ROUND:
            decodedData = decodeRoundData(rawData);
            setAccountsData(prev => ({
              ...prev,
              rounds: {
                ...prev.rounds,
                [subInfo.address]: decodedData
              }
            }));
            break;

          case ACCOUNT_TYPES.PLAYER:
            decodedData = decodePlayerData(rawData);
            setAccountsData(prev => ({
              ...prev,
              player: decodedData
            }));
            break;

          case ACCOUNT_TYPES.GAME:
            // Add game data decoder if needed
            decodedData = decodeGameData(rawData);
            setAccountsData(prev => ({
              ...prev,
              game: decodedData
            }));
            break;

          case ACCOUNT_TYPES.PLAYER_TOKEN:
            // Add token account decoder if needed
            setAccountsData(prev => ({
              ...prev,
              playerToken: decodedData
            }));
            break;
        }

        console.log(`Account updated for ${subInfo.type}:`, decodedData);
      }
    };

    subscribeToAccount();

    // Cleanup function
    return () => {
      if (ws && ws.readyState === WebSocket.OPEN) {
        // Unsubscribe from all subscriptions
        subscriptions.forEach((subInfo, subId) => {
          const unsubscribeMessage = {
            jsonrpc: '2.0',
            id: subId,
            method: 'accountUnsubscribe',
            params: [subId]
          };
          ws.send(JSON.stringify(unsubscribeMessage));
        });
        ws.close();
      }
    };
  }, [accountsConfig, connection]);

  return accountsData;
};