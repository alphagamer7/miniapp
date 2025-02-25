import React from 'react';

export const UserProfileCard1 = () => {
  return (
   <div className="bg-transparent border border-black rounded-xl p-4 text-white">
              <div className="flex justify-between items-center">
                <span className="text-4xl font-semibold">152,300</span>
                <span className="text-xl">$ELON</span>
              </div>
              <div className="flex gap-4 mt-2">
                <div className="flex items-center gap-1">
                  <span>1x</span>
                  <div className="w-4 h-4 rounded-full bg-white"></div>
                </div>
                <div className="flex items-center gap-1">
                  <span>2x</span>
                  <div className="w-4 h-4 rounded-full bg-white"></div>
                </div>
                <div className="flex items-center gap-1">
                  <span>0x</span>
                  <div className="w-4 h-4 rounded-full bg-white"></div>
                </div>
              </div>
            </div>
  );
};
