import React, { useEffect, useState } from "react";
import { PublicKey} from "@solana/web3.js";
import { useGameData } from '@/provider/GameDataProvider';
import WebApp from '@twa-dev/sdk';
import { userTokenBalance } from '@/hook/userTokenBalance';
export const UserProfileCard = ({  }) => {
    const [userImage, setUserImage] = useState("");
    const [userNameAndSurname, setUserNameAndSurname] = useState("");
    const { gameData, connection } = useGameData();
    const [balance, setBalance] = useState(null);
    const userToken = userTokenBalance();
   
      useEffect(() => {
    
          const initData = WebApp.initDataUnsafe;
          if (initData && initData.user) {
              setUserImage(initData.user.photo_url || "");
              const fullName = [initData.user.first_name, initData.user.last_name].filter(Boolean).join(" ");
              setUserNameAndSurname(fullName);
          }
      }, []);
      
  return (
    <div className="bg-transparent border border-black rounded-xl p-4 text-white">
      <div className="flex items-start gap-4">
        {/* Left Column - Image */}
        <div className="flex-shrink-0">
          <div className="w-16 h-16 rounded-full bg-yellow-500 overflow-hidden">
            <img 
              src={userImage || "https://i1.sndcdn.com/avatars-000706728712-ol0h4p-t500x500.jpg"} 
              alt="User"
              className="w-full h-full object-cover"
            />
          </div>
        </div>

        {/* Right Column - Name and Balance */}
        <div className="flex flex-col justify-center">
          <div className="text-xl font-semibold mb-1">Hi, {userNameAndSurname || "Pak Chau"}</div>
          <div className="flex items-center gap-2">
            <span className="text-lg font-semibold">{userToken.uiAmountString || "152,300"}</span>
            <span className="text-xl">${userToken.symbol}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
