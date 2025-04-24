import { useNavigate } from 'react-router-dom';

export const RoundCard = ({ players, time, isLive, isJoined, roundAmount, roundId,roundState }) => {
  const navigate = useNavigate();

  if (roundState === "Closed") {
    return null;
  }

  const handleClick = () => {
    navigate(`/round-detail/${roundId}`);
  };
  const naviagateTurnPage = () => {
    console.log("Cliked navigate to turn page")
    navigate(`/waiting-turn-page/${roundId}`);
  };
  

  return (
    <div 
      onClick={isJoined?naviagateTurnPage:isLive?naviagateTurnPage:handleClick}
      className="bg-transparent border border-black rounded-xl p-4 text-white cursor-pointer"
    >
      <div className="flex justify-between mb-1">
        <span>{players}</span>
        <span>{roundState==="Published" ?time:""}</span>
      </div>
      <div className="flex justify-center">
        {!isLive && !isJoined && roundState!=="Resulted" && (
          <span className="text-2xl font-medium">{roundAmount}$ELON</span>
        )}
        {isLive && (
          <div className="text-red-500 text-center text-xl font-bold">Live Now!</div>
        )}
        {isJoined && roundState!=="Resulted" && roundState!=="Closed" &&(
          <div className="text-green-400 text-center text-xl">Joined ({roundAmount}$ELON)</div>
        )}
        {roundState==="Resulted" && (
          <div className="text-blue-400 text-center text-xl">Resulted</div>
        )}
        {roundState==="Closed" && (
          <div className="text-red-400 text-center text-xl">Closed</div>
        )}
      </div>
      <div className="flex justify-center">
      <span className="text-2xl font-medium">{roundId}</span>
      </div>
    </div>
  );
};