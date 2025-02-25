import { useNavigate } from 'react-router-dom';

export const RoundCard = ({ players, time, isLive, isJoined, roundAmount, roundId }) => {
  const navigate = useNavigate();

  const handleClick = () => {
    navigate(`/round-detail/${roundId}`);
  };

  return (
    <div 
      onClick={handleClick}
      className="bg-transparent border border-black rounded-xl p-4 text-white cursor-pointer"
    >
      <div className="flex justify-between mb-1">
        <span>{players}</span>
        <span>{time}</span>
      </div>
      <div className="flex justify-center">
        {!isLive && !isJoined && (
          <span className="text-2xl font-medium">{roundAmount}$ELON</span>
        )}
        {isLive && (
          <div className="text-red-500 text-center text-xl font-bold">Live Now!</div>
        )}
        {isJoined && (
          <div className="text-green-400 text-center text-xl">Joined ({roundAmount}$ELON)</div>
        )}
      </div>
    </div>
  );
};