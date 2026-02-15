import { useEffect, useState } from "react";

import { useEffectEvent } from "radix-ui/internal";

import { socket } from "@/services/socket";

type EndData =
    | { status: "end"; reason: string }
    | { status: "timeout" | "resign"; winner: string; reason: string }
    | { status: "win"; winner: string; winningMask: string; rematchExpiry: number }
    | { status: "draw"; reason: string; rematchExpiry: number };

interface UseGameRoomProps {
    id: string;

    onStart: () => void;
    onUnauthorized: () => void;
}

const EXPIRED_GRACE_PERIOD = 10000;
const LEAVE_GRACE_PERIOD = 13000;

function useGameRoom({ id, onStart: onStartCallback, onUnauthorized: onUnauthorizedCallback }: UseGameRoomProps) {
    const [playing, setPlaying] = useState(false);

    const [myRole, setMyRole] = useState<number>();

    const [waiting, setWaiting] = useState(false);
    const [rematch, setRematch] = useState(false);
    const [otherOnline, setOtherOnline] = useState(false);

    const [timeLeave, setTimeLeave] = useState<number>();
    const [leaveSecondsLeft, setLeaveSecondsLeft] = useState(0);

    const [expired, setExpired] = useState(false);
    const [terminated, setTerminated] = useState(false);

    const [timers, setTimers] = useState([0, 0]);
    const [boards, setBoards] = useState([0n, 0n]);
    const [isTurn, setIsTurn] = useState(false);
    const [lastMove, setLastMove] = useState<{ column: number; row: number }>();
    const [winner, setWinner] = useState<string>();
    const [winningMask, setWinningMask] = useState<bigint>();

    const onTick = useEffectEvent(({ timers }) => setTimers(timers));
    const onRematch = useEffectEvent(() => setRematch(true));

    const onLeave = useEffectEvent(() => setOtherOnline(false));
    const onReconnect = useEffectEvent(() => setOtherOnline(true));
    const onDeparture = useEffectEvent(() => setOtherOnline(false));

    const onTerminate = useEffectEvent(() => setTerminated(true));
    const onUnauthorize = useEffectEvent(() => onUnauthorizedCallback());

    const onExpire = useEffectEvent(() => {
        setExpired(true);
        setTimeLeave(Date.now() + EXPIRED_GRACE_PERIOD);
    });

    const onWait = useEffectEvent(() => {
        setWaiting(true);
        setOtherOnline(false);
    });

    const onStart = useEffectEvent(({ boards: [p1, p2], players, timers, activePlayerId, lastMove }) => {
        setPlaying(true);

        setMyRole(players.indexOf(socket.id));

        setWaiting(false);
        setRematch(false);
        setOtherOnline(true);

        setWinner(undefined);
        setWinningMask(undefined);

        setTimers(timers);
        setBoards([BigInt(p1), BigInt(p2)]);
        setIsTurn(activePlayerId === socket.id);
        setLastMove(lastMove);

        onStartCallback();
    });

    const onEnd = useEffectEvent((data: EndData) => {
        setPlaying(false);
        setIsTurn(false);

        if ("rematchExpiry" in data) setTimeLeave(data.rematchExpiry);
        if ("winner" in data) setWinner(data.winner);
        if ("winningMask" in data) setWinningMask(BigInt(data.winningMask));

        if (data.status === "end" || data.status === "resign") setTimeLeave(Date.now() + LEAVE_GRACE_PERIOD);
    });

    const onUpdate = useEffectEvent(({ boards: [p1, p2], activePlayerId, lastMove }) => {
        setBoards([BigInt(p1), BigInt(p2)]);
        setIsTurn(activePlayerId === socket.id);
        setLastMove(lastMove);
    });

    useEffect(() => {
        socket.on("game:wait", onWait);
        socket.on("game:start", onStart);
        socket.on("game:rematch", onRematch);

        socket.on("game:tick", onTick);
        socket.on("game:update", onUpdate);

        socket.on("game:reconnect", onReconnect);
        socket.on("game:unmount", onDeparture);
        socket.on("game:disconnect", onDeparture);

        socket.on("game:end", onEnd);
        socket.on("game:leave", onLeave);
        socket.on("game:expire", onExpire);
        socket.on("game:terminate", onTerminate);
        socket.on("game:unauthorize", onUnauthorize);

        socket.emit("game:join", { roomId: id, token: sessionStorage.getItem(`token_${id}`) });

        return () => {
            socket.emit("game:unmount");

            socket.off("game:wait", onWait);
            socket.off("game:start", onStart);
            socket.off("game:rematch", onRematch);

            socket.off("game:tick", onTick);
            socket.off("game:update", onUpdate);

            socket.off("game:reconnect", onReconnect);
            socket.off("game:unmount", onDeparture);
            socket.off("game:disconnect", onDeparture);

            socket.off("game:end", onEnd);
            socket.off("game:leave", onLeave);
            socket.off("game:expire", onExpire);
            socket.off("game:terminate", onTerminate);
            socket.off("game:unauthorize", onUnauthorize);
        };
    }, [id]);

    useEffect(() => {
        if (timeLeave === undefined) {
            setLeaveSecondsLeft(0);
            return;
        }

        const id = setInterval(() => {
            const remaining = Math.max(0, Math.floor((timeLeave - Date.now()) / 1000));
            setLeaveSecondsLeft(remaining);

            if (remaining === 0) {
                clearInterval(id);

                setTimeLeave(undefined);

                if (!playing) setTerminated(true);
            }
        }, 1000);

        return () => clearTimeout(id);
    }, [timeLeave, playing]);

    return {
        myRole,

        waiting,
        rematch,
        otherOnline,

        leaveSecondsLeft,
        expired,
        terminated,

        timers: myRole !== undefined ? [timers[myRole], timers[1 - myRole]] : timers,
        boards,
        isTurn,
        lastMove,
        winner,
        winningMask,
    };
}

export { useGameRoom };
