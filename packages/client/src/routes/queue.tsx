import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

import { TopBarItem } from "@/components/top-bar-item";
import { socket } from "@/services/socket";

function Queue() {
  const navigate = useNavigate();

  useEffect(() => {
    socket.emit("matchmaking:join");

    return () => {
      socket.emit("matchmaking:leave");
    };
  }, []);

  useEffect(() => {
    const onMatchFound = ({ roomId, token }: { roomId: string; token: string }) => {
      sessionStorage.setItem(`token_${roomId}`, token);
      navigate(`/room/${roomId}`, { replace: true });
    };

    socket.on("matchmaking:found", onMatchFound);

    return () => {
      socket.off("matchmaking:found", onMatchFound);
    };
  }, [navigate]);

  return (
    <div>
      <TopBarItem side="center" id="title">
        <h1 className="font-bold">Queue</h1>
      </TopBarItem>
    </div>
  );
}

export default Queue;
