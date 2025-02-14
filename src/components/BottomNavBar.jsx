import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Home, Crown, Diamond,BetweenHorizontalEnd } from 'lucide-react';

export const  BottomNavBar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const currentPath = location.pathname;

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-purple-800 flex justify-around py-3">
      <button 
        // onClick={() => navigate('/')}
        onClick={() => navigate('/round-list')}
        className={`p-2 rounded-lg ${currentPath === '/' ? 'bg-purple-700' : ''}`}
      >
        <Home className={`w-6 h-6 ${currentPath === '/' ? 'text-white' : 'text-gray-400'}`} />
      </button>
      <button 
        onClick={() => navigate('/player-info')}
        className={`p-2 rounded-lg ${currentPath === '/player-info' ? 'bg-purple-700' : ''}`}
      >
        <Diamond className={`w-6 h-6 ${currentPath === '/player-info' ? 'text-white' : 'text-gray-400'}`} />
      </button>
      <button 
        onClick={() => navigate('/my-assets')}
        className={`p-2 rounded-lg ${currentPath === '/my-assets' ? 'bg-purple-700' : ''}`}
      >
        <Crown className={`w-6 h-6 ${currentPath === '/my-assets' ? 'text-white' : 'text-gray-400'}`} />
      </button>
      <button 
        onClick={() => navigate('/user-data')}
        className={`p-2 rounded-lg ${currentPath === '/user-data' ? 'bg-purple-700' : ''}`}
      >
        <BetweenHorizontalEnd className={`w-6 h-6 ${currentPath === '/user-data' ? 'text-white' : 'text-gray-400'}`} />
      </button>
      {/* <button 
        onClick={() => navigate('/round-list1')}
        className={`p-2 rounded-lg ${currentPath === '/round-list1' ? 'bg-purple-700' : ''}`}
      >
        <Crown className={`w-6 h-6 ${currentPath === '/round-list1' ? 'text-white' : 'text-gray-400'}`} />
      </button>
      <button 
        onClick={() => navigate('/rewards')}
        className={`p-2 rounded-lg ${currentPath === '/rewards' ? 'bg-purple-700' : ''}`}
      >
        <Diamond className={`w-6 h-6 ${currentPath === '/rewards' ? 'text-white' : 'text-gray-400'}`} />
      </button> */}
    </div>
  );
};



