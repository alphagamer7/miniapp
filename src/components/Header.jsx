import React, { useState } from 'react';
import { ChevronLeft, MoreHorizontal } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
export const Header = () => {
    const navigate = useNavigate();
    const [showMenu, setShowMenu] = useState(false);
  
    return (
      <>
        {/* Header */}
        <div className="bg-gray-100 px-4 py-2 flex justify-between items-center">
          <div 
            className="flex items-center gap-2 cursor-pointer"
            onClick={() => navigate(-1)}
          >
            <ChevronLeft className="w-5 h-5" />
            <span className="text-black">Back</span>
          </div>
          <div className="flex flex-col items-center -ml-8">
            <span className="text-black font-medium">Settld Royale</span>
            <span className="text-gray-500 text-xs">mini-app</span>
          </div>
          <button onClick={() => setShowMenu(!showMenu)}>
            <MoreHorizontal className="w-5 h-5 text-black" />
          </button>
        </div>
  
        {/* Dropdown Menu */}
        {showMenu && (
          <div className="absolute right-2 top-15 bg-gray-800 rounded-lg shadow-lg py-1 w-48">
            <button className="w-full px-4 py-2 text-white text-left hover:bg-gray-700">
              Balance & History
            </button>
            <button className="w-full px-4 py-2 text-white text-left hover:bg-gray-700">
              Get Power-Ups
            </button>
            <button className="w-full px-4 py-2 text-white text-left hover:bg-gray-700">
              Game Rules
            </button>
            <button className="w-full px-4 py-2 text-white text-left hover:bg-gray-700">
              Terms & Conditions
            </button>
            <button className="w-full px-4 py-2 text-white text-left hover:bg-gray-700">
              Privacy
            </button>
          </div>
        )}
      </>
    );
  };