import { Connection, PublicKey } from '@solana/web3.js';
import {decodeRoundData} from '@/types/RoundDecoder';
import {decodeGameData} from '@/types/GameDecoder';
import {decodePlayerData} from '@/types/PlayerDecoder';
export class AccountDecoder {
  // Static token account subscription
  static async setupTokenSubscription(connection, publicKeyStr, setTokenBalance) {
    try {
      if (!publicKeyStr) {
        console.log('No public key found');
        return null;
      }
      
      const walletPubkey = new PublicKey(publicKeyStr);
      const tokenMint = new PublicKey('F6H8WjgWLp5drr9igSzDALNMjEXHCTeo8PhdUdbjiSfk');
      
      const tokenAccounts = await connection.getParsedTokenAccountsByOwner(
        walletPubkey,
        { mint: tokenMint }
      );
      
      if (tokenAccounts.value.length === 0) {
        console.log('No token accounts found');
        return null;
      }

      const tokenAccount = tokenAccounts.value[0].pubkey;
      
      const subscriptionId = connection.onAccountChange(
        tokenAccount,
        async (updatedAccountInfo, context) => {
          const response = await connection.getParsedAccountInfo(tokenAccount);
          if (response.value?.data.parsed) {
            const parsedData = response.value.data.parsed;
            
            if (parsedData.info.tokenAmount) {
              setTokenBalance({
                amount: parsedData.info.tokenAmount.amount,
                decimals: parsedData.info.tokenAmount.decimals,
                uiAmount: parsedData.info.tokenAmount.uiAmount
              });
            }
          }
        },
        'finalized'
      );

      // Set initial balance
      const initialAccountData = tokenAccounts.value[0].account.data.parsed.info;
      if (initialAccountData.tokenAmount) {
        setTokenBalance({
          amount: initialAccountData.tokenAmount.amount,
          decimals: initialAccountData.tokenAmount.decimals,
          uiAmount: initialAccountData.tokenAmount.uiAmount
        });
      }

      return subscriptionId;
    } catch (error) {
      console.error('Error in setupTokenSubscription:', error);
      return null;
    }
  }

  // Round account subscription
  static async setupRoundSubscription(connection, roundPubKey, onRoundUpdate) {
    try {
      const roundAccount = new PublicKey(roundPubKey);
      
      const subscriptionId = connection.onAccountChange(
        roundAccount,
        async (updatedAccountInfo) => {
          const decodedData = decodeRoundData(updatedAccountInfo.data);

         
          onRoundUpdate(decodedData);
        },
        'finalized'
      );

      // Get initial state
      const initialAccount = await connection.getAccountInfo(roundAccount);
      if (initialAccount) {
        const decodedData = decodeRoundData(initialAccount.data);
        onRoundUpdate(decodedData);
      }

      return subscriptionId;
    } catch (error) {
      console.error('Error in setupRoundSubscription:', error);
      return null;
    }
  }

  // Game account subscription
  static async setupGameSubscription(connection, gamePubKey, onGameUpdate) {
    try {
      const gameAccount = new PublicKey(gamePubKey);
      
      const subscriptionId = connection.onAccountChange(
        gameAccount,
        async (updatedAccountInfo) => {
          const decodedData = decodeGameData(updatedAccountInfo.data);
          onGameUpdate(decodedData);
        },
        'finalized'
      );

      // Get initial state
      const initialAccount = await connection.getAccountInfo(gameAccount);
      if (initialAccount) {
        const decodedData = decodeGameData(initialAccount.data);
        onGameUpdate(decodedData);
      }

      return subscriptionId;
    } catch (error) {
      console.error('Error in setupGameSubscription:', error);
      return null;
    }
  }

  // Player account subscription
  static async setupPlayerSubscription(connection, playerPubKey, onPlayerUpdate) {
    try {
      const playerAccount = new PublicKey(playerPubKey);
      
      const subscriptionId = connection.onAccountChange(
        playerAccount,
        async (updatedAccountInfo) => {
          const decodedData = decodePlayerData(updatedAccountInfo.data);
          onPlayerUpdate(decodedData);
        },
        'finalized'
      );

      // Get initial state
      const initialAccount = await connection.getAccountInfo(playerAccount);
      if (initialAccount) {
        const decodedData = decodePlayerData(initialAccount.data);
        onPlayerUpdate(decodedData);
      }

      return subscriptionId;
    } catch (error) {
      console.error('Error in setupPlayerSubscription:', error);
      return null;
    }
  }
}

// const setupTokenSubscription = async (connection) => {
//   try {
//     const pubKeyStr = localStorage.getItem("publicKey");
//     if (!pubKeyStr) {
//       console.log('No public key found');
//       return;
//     }
    
//     const walletPubkey = new PublicKey(pubKeyStr);
//     const tokenMint = new PublicKey('F6H8WjgWLp5drr9igSzDALNMjEXHCTeo8PhdUdbjiSfk');
    
//     // Get all token accounts for this wallet/mint
//     const tokenAccounts = await connection.getParsedTokenAccountsByOwner(
//       walletPubkey,
//       { mint: tokenMint }
//     );
    
//     console.log('Found token accounts:', tokenAccounts.value.map(acc => ({
//       pubkey: acc.pubkey.toString(),
//       data: acc.account.data.parsed.info
//     })));

//     if (tokenAccounts.value.length === 0) {
//       console.log('No token accounts found');
//       return;
//     }

//     // Get the actual token account we want to monitor
//     const tokenAccount = tokenAccounts.value[0].pubkey;
//     console.log('Monitoring token account:', tokenAccount.toString());

//     // Set up subscription for the token account
//     const subscriptionId = connection.onAccountChange(
//       tokenAccount,
//       async (updatedAccountInfo, context) => {
//         console.log('Account update received:', {
//           slot: context.slot,
//           dataLength: updatedAccountInfo.data.length,
//           owner: updatedAccountInfo.owner.toString()
//         });

//         // Fetch fresh parsed data
//         const response = await connection.getParsedAccountInfo(tokenAccount);
//         if (response.value?.data.parsed) {
//           const parsedData = response.value.data.parsed;
//           console.log('Updated token data:', parsedData);
          
//           if (parsedData.info.tokenAmount) {
//             const { amount, decimals, uiAmount } = parsedData.info.tokenAmount;
//             console.log('New token amount:', {
//               raw: amount,
//               decimals,
//               ui: uiAmount
//             });
            
//             setTokenBalance({
//               amount,
//               decimals,
//               uiAmount
//             });
//           }
//         }
//       },
//       'confirmed'
//     );

//     console.log('Subscription established with ID:', subscriptionId);

//     // Set initial balance
//     const initialAccountData = tokenAccounts.value[0].account.data.parsed.info;
//     if (initialAccountData.tokenAmount) {
//       setTokenBalance({
//         amount: initialAccountData.tokenAmount.amount,
//         decimals: initialAccountData.tokenAmount.decimals,
//         uiAmount: initialAccountData.tokenAmount.uiAmount
//       });
//     }

//     // Return cleanup function
//     return () => {
//       if (subscriptionId) {
//         console.log('Cleaning up subscription:', subscriptionId);
//         connection.removeAccountChangeListener(subscriptionId);
//       }
//     };

//   } catch (error) {
//     console.error('Error in setupTokenSubscription:', error);
//   }
// };