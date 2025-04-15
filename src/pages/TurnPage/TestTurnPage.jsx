import React, { useState, useEffect, useRef } from 'react';
import { AlertCircle, Trophy } from 'lucide-react';
import { useGameData } from '@/provider/GameDataProvider';
import WebApp from '@twa-dev/sdk';
import { useNavigate } from 'react-router-dom';
import { WALLET_CONFIG } from '@/config/wallet.config';

const TestTurnPage = () => {
  const navigate = useNavigate();
  
  // State
  const [currentRound, setCurrentRound] = useState(null);
  const [userPlayerIndex, setUserPlayerIndex] = useState(-1);
  const [userImage, setUserImage] = useState("");
  const [currentPage, setCurrentPage] = useState(0);
  const scrollContainerRef = useRef(null);

  useEffect(() => {
    // Set user player index (this would come from your game data in the real app)
    setUserPlayerIndex(22);
  }, []);

  // Get previously eliminated players (from turns before current turn)
  const getPreviouslyEliminatedPlayers = () => {
    if (!currentRound?.turnInfo) return [];
    
    let previouslyEliminated = [];
    currentRound.turnInfo.forEach(turn => {
      if (turn.index < currentRound.currentTurn && turn.eliminatedPlayerIndexes) {
        previouslyEliminated = [...previouslyEliminated, ...turn.eliminatedPlayerIndexes];
      }
    });
    return previouslyEliminated;
  };

  // Add this effect to track scroll position and update current page
  useEffect(() => {
    const scrollContainer = scrollContainerRef.current;
    if (!scrollContainer) return;

    const handleScroll = () => {
      const containerWidth = scrollContainer.clientWidth;
      const scrollPosition = scrollContainer.scrollLeft;
      
      // Calculate which page is currently visible based on scroll position
      const newPage = Math.round(scrollPosition / containerWidth);
      
      if (newPage !== currentPage) {
        setCurrentPage(newPage);
      }
    };

    scrollContainer.addEventListener('scroll', handleScroll);
    return () => scrollContainer.removeEventListener('scroll', handleScroll);
  }, [currentPage]);

  const calculateGridConfig = () => {
    // 7x7 grid with 49 total slots per page (user + 48 other players)
    return {
      totalSlots: 49,
      gridCols: 7
    };
  };

  const getAllPlayerIndexes = () => {
    return Array.from({ length: 200 }, (_, i) => i);
  };

  // Calculate which page the user should be on based on their player index
  const getUserPage = () => {
    return Math.floor(userPlayerIndex / 49);
  };

  // Reordering function to always place the current user as the first position on every page
  // followed by exactly 48 other players
  const getReorderedPlayersForPage = (pageIndex) => {
    const allPlayers = getAllPlayerIndexes();
    // Each page shows 48 regular players (plus the user player)
    const startIndex = pageIndex * 48;
    const endIndex = Math.min(startIndex + 48, allPlayers.length);
    
    // Always put the user first, followed by the other players for this page
    let pagePlayers = [];
    
    // First add the user
    pagePlayers.push(userPlayerIndex);
    
    // Then add exactly 48 other players for this page, skipping the user if they would be in this range
    let count = 0;
    let i = startIndex;
    
    while (count < 48 && i < allPlayers.length) {
      if (allPlayers[i] !== userPlayerIndex) {
        pagePlayers.push(allPlayers[i]);
        count++;
      }
      i++;
    }
    
    return pagePlayers;
  };
  

  const allPlayerIndexes = getAllPlayerIndexes();
  const totalPages = Math.ceil(allPlayerIndexes.length / 49);
  const userPage = getUserPage();
  const eliminatedPlayers = getPreviouslyEliminatedPlayers();
  const gridConfig = calculateGridConfig();
  
  // Function to handle page navigation to user's page
  const scrollToUserPage = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTo({
        left: userPage * scrollContainerRef.current.clientWidth,
        behavior: 'smooth'
      });
    }
  };

  // No need to scroll to user's page since user is now on every page
  
  return (
    <div className="min-h-screen w-full flex flex-col bg-[#4400CE] overflow-hidden">
      <br></br>

      {/* Game Grid */}
      <div className="px-4 flex-1">
        {/* Use the ref on the scroll container */}
        <div 
          ref={scrollContainerRef}
          className="overflow-x-auto hide-scrollbar" 
          style={{ scrollSnapType: 'x mandatory' }}
        >
          <div className="flex">
            {Array(totalPages).fill(null).map((_, pageIndex) => (
              <div 
                key={`page-${pageIndex}`} 
                className="min-w-full flex-shrink-0"
                style={{ scrollSnapAlign: 'start' }}
              >
                <div className={`grid grid-cols-${gridConfig.gridCols} gap-2`}>
                  {getReorderedPlayersForPage(pageIndex).map((playerIndex, gridIndex) => {
                    const isUserPosition = playerIndex === userPlayerIndex;
                    const isEliminated = eliminatedPlayers.includes(playerIndex);
                    
                    return (
                      <div key={`grid-${pageIndex}-${gridIndex}`} className="aspect-square flex flex-col">
                         

                         {isUserPosition ? (
                        <div className={`w-full h-full rounded-full overflow-hidden ${
                          1!=1 ? 'bg-yellow-400' : 
                          isEliminated ? 'bg-gray-400' : 'bg-yellow-500'
                        }`}>
                          <img 
                            src={userImage || "https://i1.sndcdn.com/avatars-000706728712-ol0h4p-t50x50.jpg"} 
                            alt="User"
                            className={`w-full h-full object-cover  ${isEliminated ? 'opacity-50' : ''}`}
                          />
                        </div>
                      ) : (
                        <div className={`w-full h-full rounded-full flex items-center justify-center text-xs overflow-hidden transition-colors duration-500 ${
                          isEliminated ? 'bg-gray-400' : 'bg-white/80'
                        }`}>
                          <span className={`transition-colors duration-500 ${isEliminated ? 'text-gray-600' : 'text-gray-800'}`}>
                            P{playerIndex + 1}
                          </span>
                        </div>
                      )}
                      </div>
                    );
                  })}
                  
                  {/* Add empty slots if we don't have 49 players for this page */}
                  {Array(Math.max(0, gridConfig.totalSlots - getReorderedPlayersForPage(pageIndex).length))
                    .fill(null)
                    .map((_, i) => (
                      <div key={`empty-${pageIndex}-${i}`} className="aspect-square" />
                    ))
                  }
                </div>
              </div>
            ))}
          </div>
        </div>
        
        {/* Page indicator dots */}
        {totalPages > 1 && (
          <div className="flex justify-center mt-3 space-x-1">
            {Array(totalPages).fill(null).map((_, i) => (
              <div 
                key={`dot-${i}`} 
                className={`h-2 w-2 rounded-full transition-colors duration-300 ${i === currentPage ? 'bg-white' : 'bg-white/40'}`}
                onClick={() => {
                  if (scrollContainerRef.current) {
                    scrollContainerRef.current.scrollTo({
                      left: i * scrollContainerRef.current.clientWidth,
                      behavior: 'smooth'
                    });
                  }
                }}
              />
            ))}
          </div>
        )}
      </div>

      {/* No need for Find Me button since user is on every page */}
    </div>
  );
};

// Add these styles at the top of your file, after the imports
const styles = `
  @keyframes borderGlow {
    0% {
      border-color: transparent;
    }
    100% {
      border-color: rgba(255, 255, 255, 0.2);
      border-radius: 0.5rem;
    }
  }

  @keyframes borderGlowWinner {
    0% {
      border-color: transparent;
    }
    100% {
      border-color: rgba(255, 215, 0, 0.4);
      border-radius: 0.5rem;
    }
  }

  @keyframes fadeIn {
    0% {
      opacity: 0;
    }
    100% {
      opacity: 1;
    }
  }

  @keyframes slideIn {
    0% {
      transform: translateY(20px);
    }
    100% {
      transform: translateY(0);
    }
  }

  /* Hide scrollbar but keep functionality */
  .hide-scrollbar {
    -ms-overflow-style: none;  /* IE and Edge */
    scrollbar-width: none;     /* Firefox */
  }
  
  .hide-scrollbar::-webkit-scrollbar {
    display: none;             /* Chrome, Safari, Opera */
  }
`;

// Add this right after the styles
const styleSheet = document.createElement("style");
styleSheet.innerText = styles;
document.head.appendChild(styleSheet);

export default TestTurnPage;