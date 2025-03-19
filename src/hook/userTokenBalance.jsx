// hooks/useTokenBalance.js
import { useState, useEffect } from 'react';
import { PublicKey } from "@solana/web3.js";
import { useGameData } from '@/provider/GameDataProvider';
import { WALLET_CONFIG } from '@/config/wallet.config';
export const userTokenBalance = () => {
    const { gameData, connection } = useGameData();
    const [userToken, setUserToken] = useState({
        name: "Dogelon Mars",
        symbol: "ELON",
        image: "https://assets.coingecko.com/coins/images/14962/standard/6GxcPRo3_400x400.jpg?1696514622",
        amount: "0",
        uiAmount: 0,
        uiAmountString: "0",
        mint:""
    });

    const checkBalance = async () => {
        try {
            console.log("Check Balance Working...")
            const pubKeyStr = localStorage.getItem(WALLET_CONFIG.STORAGE_KEYS.USER_PUBLIC_KEY);
            if (!pubKeyStr) {
                console.log("No public key found in localStorage");
                return;
            }

            const publicKey = new PublicKey(pubKeyStr);

            const [standardTokens, metadataTokens] = await Promise.all([
                connection.getParsedTokenAccountsByOwner(
                    publicKey,
                    { programId: new PublicKey('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA') }
                ),
                connection.getParsedTokenAccountsByOwner(
                    publicKey,
                    { programId: new PublicKey('TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb') }
                )
            ]);
            const allTokens = [...standardTokens.value, ...metadataTokens.value];

            if (allTokens.length === 0) {
                console.log("No token accounts found");
                return;
            }

            if (!gameData?.tokenMint) {
                console.log("No token mint found in game data");
                return;
            }

            const token = allTokens.find(r => r.account.data.parsed.info.mint.toString() === gameData.tokenMint.toString());
            console.log(`Token ${JSON.stringify(token)}`);
            if (!token) {
                console.log("Token not found in accounts");
                return;
            }

            const tokenMetadata = {
                name: "Dogelon Mars",
                symbol: "ELON",
                image: "https://assets.coingecko.com/coins/images/14962/standard/6GxcPRo3_400x400.jpg?1696514622",
                amount: token.account.data.parsed.info.tokenAmount.amount,
                uiAmount: token.account.data.parsed.info.tokenAmount.uiAmount,
                uiAmountString: token.account.data.parsed.info.tokenAmount.uiAmountString,
                mint:token.account.data.parsed.info.mint,
            };
            console.log(`Token ${JSON.stringify(tokenMetadata)}`);
            setUserToken(tokenMetadata);
        } catch (err) {
            console.error("Detailed error in checkBalance:", err);
        }
    };

    useEffect(() => {
        if (gameData && connection) {
            checkBalance();
        }
    }, [connection, gameData]);

    return userToken;
};