const WalletButton = ({ isConnected, address, isLoading, onConnect, onDisconnect }) => {
  if (!isConnected) {
    return (
      <button 
        onClick={onConnect}
        disabled={isLoading}
        className="w-full bg-transparent border border-black rounded-xl p-4 text-white text-xl text-center"
      >
        {isLoading ? 'Connecting' : 'Connect Wallet'}
      </button>
    );
  }

  return (
    <div className="w-full flex flex-col gap-2">
      <div className="w-full border border-black rounded-xl p-4 text-white text-xl text-center">
        Connected: {address.slice(0, 4)}...{address.slice(-4)}
      </div>
      <button 
        onClick={onDisconnect}
        disabled={isLoading}
        className="w-full bg-transparent border border-red-500 text-red-500 rounded-xl p-3 text-center mt-2"
      >
        {isLoading ? 'Processing...' : 'Disconnect Wallet'}
      </button>
    </div>
  );
};

export default WalletButton; 