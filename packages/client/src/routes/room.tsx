import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import { Board } from "@/components/board";
import { Timer } from "@/components/timer";
import { TopBarItem } from "@/components/top-bar-item";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { useGameRoom } from "@/hooks/use-game-room";
import { socket } from "@/services/socket";

function Room() {
  const navigate = useNavigate();
  const { id } = useParams();

  const [unauthorized, setUnauthorized] = useState(false);
  const [isRematchRequested, setIsRematchRequested] = useState(false);
  const [gameOver, setGameOver] = useState(false);

  const {
    myRole,

    rematch,
    otherOnline,

    leaveSecondsLeft,
    expired,
    terminated,

    timers,
    boards,
    isTurn,
    lastMove,
    winner,
    winningMask
  } = useGameRoom({
    id: id ?? "",
    onStart: () => {
      setGameOver(false);
      setIsRematchRequested(false);
    },
    onUnauthorized: () => setUnauthorized(true)
  });

  useEffect(() => {
    if (winner !== undefined) {
      const id = setTimeout(() => setGameOver(true), 3000);
      return () => clearTimeout(id);
    }
  }, [winner]);

  useEffect(() => {
    if (!terminated) return;

    const id = setTimeout(() => navigate("/"), 1000);
    return () => clearTimeout(id);
  }, [terminated, navigate]);

  return (
    <>
      <TopBarItem side="center" id="title">
        <div className="flex w-full max-w-lg justify-between">
          <div className="flex items-center gap-2">
            <span data-is-light={myRole === 0} className="data-[is-light=true]:bg-light bg-dark size-8 rounded-full" />
            You
            <Timer time={timers[0]} />
          </div>
          <div className="flex items-center gap-2">
            <Timer time={timers[1]} />
            Other
            <span
              data-is-light={myRole === 0}
              className="data-[is-light=false]:bg-light bg-dark relative size-8 rounded-full"
            >
              <div
                data-online={otherOnline}
                className="data-[online=false]:bg-dark bg-light border-background absolute right-0 bottom-0 size-3 rounded-full border-2"
              />
            </span>
          </div>
        </div>
      </TopBarItem>
      {winner !== undefined ? (
        <h1 className="animate-expand mb-8 text-center text-2xl font-bold delay-500">
          {winner === socket.id ? "You won the game!" : "You lost the game!"}
        </h1>
      ) : null}
      {!gameOver && !expired ? (
        <div className="absolute top-1/2 left-1/2 flex w-full -translate-1/2 justify-center px-4">
          <Board
            boards={boards}
            isTurn={isTurn}
            lastMove={lastMove}
            winningMask={winningMask}
            onClick={(col) => socket.emit("game:move", col)}
          />
        </div>
      ) : (
        <div className="mx-auto flex w-fit flex-col space-y-2">
          {expired && <span className="text-destructive">Room expired! Player could not make it.</span>}
          {rematch && <span className="text-destructive">Player requested a rematch.</span>}
          {otherOnline && (
            <div className="flex justify-center">
              <Button
                className="font-bold"
                disabled={isRematchRequested}
                onClick={() => {
                  setIsRematchRequested(true);
                  socket.emit("game:rematch");
                }}
              >
                Play again!
              </Button>
            </div>
          )}
          <div className="flex justify-center">
            <Button variant="destructive" onClick={() => navigate("/")} className="font-bold">
              Leave room ({leaveSecondsLeft})
            </Button>
          </div>
        </div>
      )}
      <AlertDialog open={unauthorized}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>You do no belong here!</AlertDialogTitle>
            <AlertDialogDescription>You are not authorized to access this room.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction variant="destructive" onClick={() => navigate("/")}>
              Go Home
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

export default Room;
