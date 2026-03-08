import type { Role } from "@/hooks/use-game-room";

import { Countdown } from "./countdown";
import { TopBarItem } from "./top-bar-item";

function TopBarRoomStatus({
  myRole,
  timersMs,
  relativeTime,
  otherOnline,
  turn
}: {
  myRole: Role;
  timersMs: readonly [number, number];
  relativeTime: number;
  otherOnline: boolean;
  turn?: Role;
}) {
  return (
    <TopBarItem side="center" id="room-status">
      <div className="flex w-full max-w-lg justify-between">
        <div className="flex items-center gap-2">
          <span data-is-light={myRole === 0} className="data-[is-light=true]:bg-light bg-dark size-8 rounded-full" />
          You
          <span className="font-bold">
            <Countdown
              timeMs={timersMs[myRole]}
              relativeTime={relativeTime}
              start={turn !== undefined && turn === myRole}
              format="mm:ss"
            />
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="font-bold">
            <Countdown
              timeMs={timersMs[myRole ^ 1]}
              relativeTime={relativeTime}
              start={turn !== undefined && turn !== myRole}
              format="mm:ss"
            />
          </span>
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
  );
}

export { TopBarRoomStatus };
