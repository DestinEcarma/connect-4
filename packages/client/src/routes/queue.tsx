import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

import { TopBarItem } from "@/components/top-bar-item";
import { Button } from "@/components/ui/button";
import { socket } from "@/services/socket";

function Queue() {
  const navigate = useNavigate();

  useEffect(() => {
    const onMatchFound = ({ roomId, token }: { roomId: string; token: string }) => {
      sessionStorage.clear();
      sessionStorage.setItem(`token_${roomId}`, token);
      navigate(`/room/${roomId}`, { replace: true });
    };

    socket.on("matchmaking:found", onMatchFound);
    socket.emit("matchmaking:join");

    return () => {
      socket.off("matchmaking:found", onMatchFound);
      socket.emit("matchmaking:leave");
    };
  }, [navigate]);

  return (
    <div className="absolute top-1/2 left-1/2 flex w-full -translate-1/2 flex-col gap-4">
      <TopBarItem side="center" id="title">
        <h1 className="font-bold">Queue</h1>
      </TopBarItem>
      <h1 className="after:animate-dotty text-center text-4xl font-bold">Finding a random player</h1>
      <Button variant="destructive" onClick={() => navigate("/", { replace: true })} className="mx-auto block">
        Cancel
      </Button>
    </div>
  );
}

export default Queue;
