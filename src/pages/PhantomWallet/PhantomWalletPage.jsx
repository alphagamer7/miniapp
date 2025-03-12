import React from 'react';

import WalletButton from '@/components/WalletButton';
import usePhantomWallet from '@/hook/usePhantomWallet';
const PhantomWalletPage = () => {
  const {
    walletState,
    error,
    isLoading,
    connectWallet,
    disconnectWallet
  } = usePhantomWallet();

  return (
    <div className="p-6">
      <div className="w-full flex flex-col items-center">
        {error && (
          <div className="text-red-500 text-xs mb-2 px-4 py-2 bg-red-100 rounded-lg w-full">
            {error}
          </div>
        )}
        
        <WalletButton
          isConnected={walletState.isConnected}
          address={walletState.address}
          isLoading={isLoading}
          onConnect={connectWallet}
          onDisconnect={disconnectWallet}
        />
      </div>
    </div>
  );
};

export default PhantomWalletPage;