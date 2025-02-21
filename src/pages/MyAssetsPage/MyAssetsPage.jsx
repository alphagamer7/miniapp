import { Search } from 'lucide-react';
import WebApp from '@twa-dev/sdk';
import { List } from '@telegram-apps/telegram-ui';
import { DisplayData } from '@/components/DisplayData/DisplayData.jsx';
import React, { useEffect, useState } from "react";
import { useGameData } from '@/provider/GameDataProvider';
import { AccountDecoder } from '@/hook/UseMultiAccountSubscription'; // Add this import
import { PublicKey } from "@solana/web3.js";
import { Buffer } from 'buffer';
import { getTokenMetadata } from "@solana/spl-token";

export function MyAssetsPage() {
    const [userImage, setUserImage] = useState("");
    const [userNameAndSurname, setUserNameAndSurname] = useState("");
    const [myAssets, setMyAssets] = useState([]);
    const [error, setError] = useState(null);
    const [balance, setBalance] = useState(null);
    const { gameData, connection } = useGameData();
    const [tokenBalance, setTokenBalance] = useState({
        amount: '0',
        decimals: 0,
        uiAmount: 0
    });
    const [isLoading, setIsLoading] = useState(true);

    // Effect for token subscription
    useEffect(() => {
        let subscriptionId = null;

        const setupTokenSubscription = async () => {
            try {
                const publicKeyStr = localStorage.getItem("publicKey");
                if (!connection || !publicKeyStr) {
                    console.log("Missing connection or public key");
                    return;
                }

                // Set up subscription using AccountDecoder
                subscriptionId = await AccountDecoder.setupTokenSubscription(
                    connection,
                    publicKeyStr,
                    (newBalance) => {
                        console.log('Token balance updated:', newBalance);
                        setTokenBalance(newBalance);
                        // Update the specific token in myAssets when balance changes
                        setMyAssets(prevAssets => {
                            return prevAssets.map(asset => {
                                // Update only the specific token you want to monitor
                                if (asset.mintAddress === 'F6H8WjgWLp5drr9igSzDALNMjEXHCTeo8PhdUdbjiSfk') {
                                    return {
                                        ...asset,
                                        balance: newBalance.uiAmount
                                    };
                                }
                                return asset;
                            });
                        });
                    }
                );

                setIsLoading(false);
            } catch (error) {
                console.error('Error setting up token subscription:', error);
                setIsLoading(false);
            }
        };

        if (connection) {
            setupTokenSubscription();
        }

        // Cleanup subscription
        return () => {
            if (subscriptionId && connection) {
                console.log('Cleaning up token subscription');
                connection.removeAccountChangeListener(subscriptionId);
            }
        };
    }, [connection]);

    // Initial setup effect
    useEffect(() => {
        checkBalance();
        const initData = WebApp.initDataUnsafe;
        if (initData && initData.user) {
            setUserImage(initData.user.photo_url || "");
            const fullName = [
                initData.user.first_name,
                initData.user.last_name
            ].filter(Boolean).join(" ");
            setUserNameAndSurname(fullName);
        }
    }, []);

    const checkBalance = async () => {
        try {
            const pubKeyStr = localStorage.getItem("publicKey");
            if (!pubKeyStr) {
                console.log("No public key found in localStorage");
                return;
            }

            const publicKey = new PublicKey(pubKeyStr);
            console.log(`Pub key ${publicKey}`)

            // Get SOL balance
            const balanceInLamports = await connection.getBalance(publicKey);
            const balanceInSOL = balanceInLamports / 1000000000;
            setBalance(balanceInSOL);

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

            // Fetch metadata for all tokens
            const tokensWithMetadata = await Promise.all(
                metadataTokens.value.map(async (accountInfo) => {
                    const parsedAccountData = accountInfo.account.data.parsed;
                    const tokenBalance = parsedAccountData.info.tokenAmount;
                    const mintAddress = parsedAccountData.info.mint;

                    let tokenMetadata = null;
                    const metadata = await getTokenMetadata(connection, new PublicKey(mintAddress));
                    tokenMetadata = {
                        name: metadata.name,
                        symbol: metadata.symbol,
                        uri: metadata.uri,
                        image: metadata.uri,
                    };
                    return {
                        ...accountInfo,
                        metadata: tokenMetadata,
                        mintAddress,
                        balance: tokenBalance.uiAmount
                    };
                })
            );

            setMyAssets(tokensWithMetadata);

        } catch (err) {
            console.error("Detailed error in checkBalance:", err);
            setError("Failed to load assets");
        }
    };

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
            <div className="p-4">
                <div className="flex justify-between items-center mb-4">
                    <div>
                        <div className="text-white text-lg font-semibold">
                            Hi, {userNameAndSurname == "" ? "Pak Chau" : userNameAndSurname}
                        </div>
                        <div className="text-white/60 text-sm">Welcome Back</div>
                        {balance !== null && (
                            <button className="px-4 py-1 rounded-full text-sm bg-blue-400 text-white">
                                {`${balance} SOL`}
                            </button>
                        )}
                    </div>
                    <div className="bg-yellow-500 w-10 h-10 rounded-full">
                        <img 
                            src={userImage || "https://i1.sndcdn.com/avatars-000706728712-ol0h4p-t500x500.jpg"}
                            alt="User"
                            className="w-full h-full rounded-full object-cover"
                        />
                    </div>
                </div>

                <h1 className="text-3xl font-bold text-white mb-6">My Assets</h1>

                <div className="space-y-4">
                    {myAssets.map((asset, index) => {
                        const mintAddress = asset.mintAddress;
                        const shortMint = `${mintAddress.slice(0, 4)}...${mintAddress.slice(-4)}`;
                        const metadata = asset.metadata;

                        return (
                            <div key={index} className="bg-white/10 rounded-lg p-4">
                                <div className="flex justify-between items-center">
                                    <div className="flex items-center space-x-3">
                                        {metadata?.image && (
                                            <img
                                                src={metadata.image}
                                                alt={metadata.name || 'Token'}
                                                className="w-8 h-8 rounded-full"
                                            />
                                        )}
                                        <div>
                                            <div className="text-white text-sm">
                                                {metadata?.name || 'Unknown Token'}
                                            </div>
                                            <div className="text-white/60 text-xs">
                                                {metadata?.symbol ? `${metadata.symbol} • ` : ''}{shortMint}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="text-white font-semibold">
                                        {asset.balance}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}