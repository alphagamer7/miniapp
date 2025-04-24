import React, { useState, useEffect, useRef } from 'react';
import { AlertCircle, Trophy } from 'lucide-react';
import { useGameData } from '@/provider/GameDataProvider';
import WebApp from '@twa-dev/sdk';
import { useNavigate } from 'react-router-dom';
import Lottie from 'lottie-react';
import animationData from '@/assets/WaitingClock.json'
import { WALLET_CONFIG } from '@/config/wallet.config';

const WaitingTurnPage = () => {
  const navigate = useNavigate();
  // Get round ID from URL
  const roundId = window.location.pathname.split('/').pop();
  
  // State
  const [currentRound, setCurrentRound] = useState(null);
  const [showCountdown, setShowCountdown] = useState(true);
  const [userPubKey, setUserPubKey] = useState("");
  const [userPlayerIndex, setUserPlayerIndex] = useState(-1);
  const [userImage, setUserImage] = useState("");
  const [showAllPlayers, setShowAllPlayers] = useState(true);
  const [timeRemaining, setTimeRemaining] = useState('');
  
  // Pagination and scroll state
  const [currentPage, setCurrentPage] = useState(0);
  const scrollContainerRef = useRef(null);
  
  // Touch handling state
  const [touchStart, setTouchStart] = useState(null);
  const [touchEnd, setTouchEnd] = useState(null);

  // Get game data from context
  const { roundsData, connection } = useGameData();
  
  // Swipe handling functions
  const handleTouchStart = (e) => {
    setTouchEnd(null); // Reset touchEnd
    setTouchStart(e.targetTouches[0].clientX);
  };

  const handleTouchMove = (e) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const handleTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > 50; // min distance for swipe
    const isRightSwipe = distance < -50;
    
    // Calculate total pages
    const totalPlayers = currentRound?.players?.length || 0;
    const totalPages = Math.ceil(totalPlayers / 49);
    
    if (isLeftSwipe && currentPage < totalPages - 1) {
      // Swipe left - go to next page
      setCurrentPage(prevPage => {
        const newPage = Math.min(prevPage + 1, totalPages - 1);
        scrollToPage(newPage);
        return newPage;
      });
    } else if (isRightSwipe && currentPage > 0) {
      // Swipe right - go to previous page
      setCurrentPage(prevPage => {
        const newPage = Math.max(prevPage - 1, 0);
        scrollToPage(newPage);
        return newPage;
      });
    }
    
    // Reset values
    setTouchStart(null);
    setTouchEnd(null);
  };

  // Function to scroll to specific page
  const scrollToPage = (pageIndex) => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTo({
        left: pageIndex * scrollContainerRef.current.clientWidth,
        behavior: 'smooth'
      });
    }
  };

  // Setup back button for Telegram
  const handleBackButtonClick = () => {
    try {
      setTimeout(() => {
        navigate('/');
      }, 0);
      return false;
    } catch (e) {
      console.error("Navigation error:", e);
    }
  };

  const setupBackButton = () => {
    const tg = window.Telegram?.WebApp;
    
    if (!tg) {
      console.error("Telegram WebApp not available");
      return;
    }
    
    try {
      tg.BackButton.show();
      tg.BackButton.offClick();
      tg.BackButton.onClick(handleBackButtonClick);
    } catch (e) {
      console.error("Error in setupBackButton:", e);
    }
  };

  // Add effect to track scroll position and update current page
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

  // Load user public key and image from Telegram
  useEffect(() => {
    const pubKeyStr = localStorage.getItem(WALLET_CONFIG.STORAGE_KEYS.USER_PUBLIC_KEY);
    const initData = WebApp.initDataUnsafe;
    if (initData && initData.user) {
      setUserImage(initData.user.photo_url || "");
    }
    setUserPubKey(pubKeyStr || "");
  }, []);

  // Load round data when roundsData or roundId changes
  useEffect(() => {
    const round = roundsData.find(r => r.id === roundId);
    console.log(`Round ${JSON.stringify(round)}`)
    if (round) {
      setCurrentRound(round);
      if (round.state === "Playing" || round.state === "Resulted") {
        console.log("Round is now playing, navigating to game board...");
        navigate(`/turn-page/${roundId}`);
      }
    }
  }, [roundId, roundsData]);

  // Find user index when currentRound or userPubKey changes
  useEffect(() => {
    if (currentRound && userPubKey) {
      const userIndex = currentRound.players.findIndex(playerKey => playerKey === userPubKey);
      setUserPlayerIndex(userIndex);
    }
  }, [currentRound, userPubKey]);

  // Setup back button
  useEffect(() => {
    const tg = window.Telegram?.WebApp;
    setupBackButton();
    
    return () => {
      if (tg && tg.BackButton && typeof tg.BackButton.offClick === 'function') {
        tg.BackButton.offClick();
      }
    };
  }, []);

  useEffect(() => {
    // Only create this effect once currentRound is available
    if (!currentRound || !currentRound.scheduleStartTime) {
      // Set a default value when data isn't available yet
      setTimeRemaining('Waiting for data...');
      return;
    }
    
    // Function that updates the countdown
    function updateCountdown() {
      try {
        const currentTime = Math.floor(Date.now() / 1000);
        const targetTime = parseInt(currentRound.scheduleStartTime);
        
        // Calculate time difference in seconds
        let diff = targetTime - currentTime;
        
        // Handle countdown complete
        if (diff <= 0) {
          setTimeRemaining('Countdown finished');
          return;
        }
        
        // Calculate days, hours, minutes, seconds
        const days = Math.floor(diff / (24 * 60 * 60));
        diff -= days * 24 * 60 * 60;
        
        const hours = Math.floor(diff / (60 * 60));
        diff -= hours * 60 * 60;
        
        const minutes = Math.floor(diff / 60);
        diff -= minutes * 60;
        
        const seconds = diff;
        
        // Format the countdown string
        let countdownStr = '';
        if (days > 0) countdownStr += `${days} day${days !== 1 ? 's' : ''} `;
        if (hours > 0 || days > 0) countdownStr += `${hours} hour${hours !== 1 ? 's' : ''} `;
        if (minutes > 0 || hours > 0 || days > 0) countdownStr += `${minutes} minute${minutes !== 1 ? 's' : ''} `;
        countdownStr += `${seconds} second${seconds !== 1 ? 's' : ''}`;
        
        setTimeRemaining(countdownStr);
      } catch (error) {
        console.error("Error updating countdown:", error);
        setTimeRemaining("Error calculating time");
      }
    }
    
    // Do initial update
    updateCountdown();
    
    // Set up interval - store reference for cleanup
    const timer = setInterval(updateCountdown, 1000);
    
    // Return cleanup function
    return () => {
      clearInterval(timer);
    };
  }, [currentRound?.scheduleStartTime]); // Only depend on this specific property

  // Return loading state if round data not available yet
  if (!currentRound) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-[#4400CE]">
        <div className="text-white text-xl">Loading game data...</div>
      </div>
    );
  }
  
  const LottieAnimation = () => {
    return (
      <div className="lottie-container w-full h-64 flex items-center justify-center">
        <Lottie 
          animationData={animationData} 
          loop={true}
          autoplay={true}
          style={{ width: '200px', height: '200px' }}
          rendererSettings={{
            preserveAspectRatio: 'xMidYMid meet'
          }}
          speed={1}
        />
      </div>
    );
  };

  const calculateGridConfig = (totalPlayers) => {
    // Default grid config
    const defaultConfig = {
      totalSlots: 49,
      playersPerSlot: 1,
      gridCols: 7
    };
    
    // Calculate total pages needed
    const totalPages = Math.ceil(totalPlayers / 49);
    
    return {
      ...defaultConfig,
      totalPages,
    };
  };

  const getAllPlayerIndexes = () => {
    return Array.from({ length: currentRound.players.length }, (_, i) => i);
  };
  
  // Get player indexes for the current page
  const getPlayersForPage = (pageIndex) => {
    const allPlayers = getAllPlayerIndexes();
    const startIndex = pageIndex * 49;
    const endIndex = Math.min(startIndex + 49, allPlayers.length);
    
    // Get players for this page, with the current user highlighted
    return allPlayers.slice(startIndex, endIndex);
  };
  
  function formatTimestamp(timestamp) {
    const date = new Date(parseInt(timestamp) * 1000);
    
    // Array of month names
    const months = [
      'January', 'February', 'March', 'April', 'May', 'June', 
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
    
    const day = date.getDate();
    const month = months[date.getMonth()];
    const year = date.getFullYear();
    
    // Format time with leading zeros where needed
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    const seconds = date.getSeconds().toString().padStart(2, '0');
    
    return `${day} ${month} ${year} ${hours}:${minutes}:${seconds}`;
  }

  // Always use all player indexes for the grid, but mark eliminated ones
  const displayPlayerIndexes = getAllPlayerIndexes();
  const gridConfig = calculateGridConfig(displayPlayerIndexes.length);
  const totalPages = gridConfig.totalPages;

  return (
    <div className="min-h-screen w-full flex flex-col bg-[#4400CE] overflow-hidden">
      {/* Round Info */}
      <div className="p-4">
        <div className="bg-transparent border border-white/20 rounded-xl p-4 text-white">
          <div className="text-center text-2xl text-white">
            Current Player: Player {userPlayerIndex + 1}
          </div>
          <div className="text-center text-2xl text-white">
            Total: {currentRound.players.length} Players
          </div>
        </div>
      </div>

      {/* Game Grid with Swipe Functionality - UPDATED FOR CONSISTENT SIZING */}
      <div className="flex-1 overflow-hidden">
        <div 
          ref={scrollContainerRef}
          className="w-full h-full overflow-x-auto hide-scrollbar" 
          style={{ scrollSnapType: 'x mandatory', WebkitOverflowScrolling: 'touch' }}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          <div className="flex h-full" style={{ width: '100%' }}>
            {Array(totalPages).fill(null).map((_, pageIndex) => (
              <div 
                key={`page-${pageIndex}`} 
                className="min-w-full flex-shrink-0 px-4 flex items-center justify-center"
                style={{ scrollSnapAlign: 'start', scrollSnapStop: 'always' }}
              >
                {/* Fixed size container for the grid to maintain consistent player circle sizes */}
                <div className="w-full max-w-md">
                  <div className={`grid grid-cols-7 gap-1 w-full`}>
                    {getPlayersForPage(pageIndex).map((playerIndex) => {
                      // Check if this is the current user
                      const isUserPosition = playerIndex === userPlayerIndex;
                      
                      return (
                        <div key={`player-${playerIndex}`} className="aspect-square">
                          {isUserPosition ? (
                            <div className="w-full h-full rounded-full bg-yellow-500 overflow-hidden">
                              <img 
                                src={userImage || "https://i1.sndcdn.com/avatars-000706728712-ol0h4p-t50x50.jpg"} 
                                alt="User"
                                className="w-full h-full object-cover"
                              />
                            </div>
                          ) : (
                            <div className="w-full h-full rounded-full flex items-center justify-center text-xs overflow-hidden bg-white/80">
                              <span className="text-gray-800">
                                P{playerIndex + 1}
                              </span>
                            </div>
                          )}
                        </div>
                      );
                    })}
                    
                    {/* Add empty slots if needed to fill the grid */}
                    {Array(Math.max(0, 49 - getPlayersForPage(pageIndex).length))
                      .fill(null)
                      .map((_, i) => (
                        <div key={`empty-${pageIndex}-${i}`} className="aspect-square" />
                      ))
                    }
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
        
        {/* Page indicator dots */}
        {totalPages > 1 && (
          <div className="flex justify-center my-3 space-x-1">
            {Array(totalPages).fill(null).map((_, i) => (
              <div 
                key={`dot-${i}`} 
                className={`h-2 w-2 rounded-full transition-colors duration-100 ${i === currentPage ? 'bg-white' : 'bg-white/40'}`}
                onClick={() => {
                  // Add click functionality to navigate to page
                  setCurrentPage(i);
                  scrollToPage(i);
                }}
              />
            ))}
          </div>
        )}
      </div>
      
      {currentRound.state !== "Started" && (
        <div className="w-full">
          <LottieAnimation/>
        </div>
      )}
      
      {/* Bottom Section */}
      <div className="mt-auto px-4 pb-8">
        <div className="w-full">
            <div className="bg-transparent border border-white/20 rounded-xl p-4">
            <div className="text-center text-white text-xl font-bold">
                {currentRound.state === "Started" ? (
                  "Turn is starting please wait..."
                ) : (
                  <>
                    Game Will Start
                    <br></br>{currentRound?.scheduleStartTime ? formatTimestamp(currentRound.scheduleStartTime) : "Loading..."}
                    <br></br>{timeRemaining || "Calculating..."}
                  </>
                )}
            </div>
            </div>
        </div>
      </div>
    </div>
  );
};

// Add these styles for the component
const styles = `
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

export default WaitingTurnPage;