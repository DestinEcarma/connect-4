import { Navigate, useNavigate, useParams } from "react-router-dom";

import { ShieldOff } from "lucide-react";

import { Board } from "@/components/board";
import { Countdown } from "@/components/countdown";
import { SingleClickButton } from "@/components/once-button";
import { TopBarItem } from "@/components/top-bar-item";
import { TopBarRoomStatus } from "@/components/top-bar-room-status";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { useGameRoom } from "@/hooks/use-game-room";
import { usePassedTime } from "@/hooks/use-passed-time";

function Room() {
  const navigate = useNavigate();
  const { id } = useParams();

  const { view, state, actions } = useGameRoom({
    roomId: id ?? "",
    token: sessionStorage.getItem(`token_${id}`)
  });

  const hideBoard = usePassedTime(view?.ended?.statusAt);

  if (state.tag === "cleanup") {
    return <Navigate to="/" replace />;
  }

  if (state.tag === "joining") {
    return (
      <div className="absolute top-1/2 left-1/2 flex -translate-1/2 flex-col items-center gap-4">
        <Spinner className="size-20" />
        <span className="after:animate-dotty">Joining room</span>
      </div>
    );
  }

  if (state.tag === "unauthorized") {
    return (
      <div className="absolute top-1/2 left-1/2 flex -translate-1/2 flex-col items-center gap-4">
        <ShieldOff className="size-20" />
        <span>You are not allowed to join this room.</span>
        <Button onClick={() => navigate("/", { replace: true })}>Home</Button>
      </div>
    );
  }

  if (state.tag === "waiting") {
    return (
      <div className="absolute top-1/2 left-1/2 flex -translate-1/2 flex-col items-center gap-4">
        <TopBarRoomStatus
          myRole={state.myRole}
          timersMs={state.timersMs}
          relativeTime={state.serverNow}
          otherOnline={state.otherOnline}
        />
        <Spinner className="size-20" />
        <span className="after:animate-dotty">Waiting for opponent</span>
      </div>
    );
  }

  if (state.tag === "expired") {
    return (
      <div className="absolute top-1/2 left-1/2 flex -translate-1/2 flex-col items-center gap-4">
        <TopBarRoomStatus
          myRole={state.myRole}
          timersMs={state.timersMs}
          relativeTime={state.serverNow}
          otherOnline={state.otherOnline}
        />
        <ShieldOff className="size-20" />
        The room has expired.
        <Button variant="destructive" onClick={() => navigate("/", { replace: true })}>
          Leave (<Countdown timeMs={state.cleanupAt - state.serverNow} relativeTime={state.serverNow} />)
        </Button>
      </div>
    );
  }

  if (!view) {
    return (
      <div className="absolute top-1/2 left-1/2 flex -translate-1/2 flex-col items-center gap-4">
        <TopBarRoomStatus
          myRole={state.myRole}
          timersMs={state.timersMs}
          relativeTime={state.serverNow}
          otherOnline={state.otherOnline}
        />
        <Spinner className="size-20" />
        <span className="after:animate-dotty">Loading game</span>
      </div>
    );
  }

  return (
    <>
      <TopBarRoomStatus
        myRole={state.myRole}
        timersMs={state.timersMs}
        relativeTime={state.serverNow}
        otherOnline={state.otherOnline}
        turn={view.turn}
      />
      {view.ended && view.ended && (
        <h1 className="animate-expand mb-8 text-center text-2xl font-bold delay-500">
          {view.ended.status === "draw"
            ? "Game ended in a draw!"
            : view.ended.isWinner
              ? "You won the game!"
              : "You lost the game!"}
        </h1>
      )}
      {hideBoard && view.ended ? (
        <div className="absolute top-1/2 left-1/2 flex -translate-1/2 flex-col items-center gap-4">
          {state.tag === "rematch" && <span className="text-destructive">Player requested a rematch.</span>}
          {!(view.ended.status === "win" || view.ended.status === "draw") && (
            <span className="text-destructive">{view.ended.reason}</span>
          )}
          {view.otherOnline && (
            <SingleClickButton onClick={() => actions.rematch()} className="font-bold">
              Play again!
            </SingleClickButton>
          )}
          <Button
            variant="destructive"
            onClick={() => {
              actions.leave();
              navigate("/", { replace: true });
            }}
            className="font-bold"
          >
            Leave room (
            <Countdown timeMs={view.ended.cleanupAt - view.ended.serverNow} relativeTime={view.ended?.serverNow} />)
          </Button>
        </div>
      ) : (
        <>
          <TopBarItem side="left" id="leave">
            <Button
              variant="destructive"
              onClick={() => {
                actions.leave();
                navigate("/", { replace: true });
              }}
            >
              Leave
            </Button>
          </TopBarItem>
          <div className="absolute top-1/2 left-1/2 flex w-full -translate-1/2 justify-center px-4">
            <Board
              boards={view.boards}
              isTurn={view.isTurn}
              lastMove={view.lastMove}
              winningMask={view.ended?.winningMask}
              onClick={(col) => actions.move(col)}
            />
          </div>
        </>
      )}
    </>
  );
}

export default Room;
