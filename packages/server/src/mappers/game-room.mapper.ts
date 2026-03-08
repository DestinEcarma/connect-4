import { protocol } from "@connect-4/shared";

import { GameRoom, RoomEnd } from "../domain/game-room";

type EndMeta = {
    statusAt: number;
    cleanupAt: number;
    serverNow: number;
};

function toWaitPayload(room: GameRoom): protocol.WaitPayload {
    const snapshot = room.getSnapshot();

    return {
        players: [...snapshot.players],
        timersMs: [...snapshot.timers],
        serverNow: Date.now()
    };
}

function toStartPayload(room: GameRoom): protocol.StartInputPayload {
    const snapshot = room.getSnapshot();

    return {
        players: [...snapshot.players],
        timersMs: [...snapshot.timers],
        serverNow: Date.now(),
        activePlayerId: snapshot.players[snapshot.turnSlot],
        boards: [snapshot.boards[0].toString(), snapshot.boards[1].toString()],
        lastMove: snapshot.lastMove
    };
}

function toUpdatePayload(room: GameRoom): protocol.UpdateInputPayload {
    const snapshot = room.getSnapshot();

    return {
        activePlayerId: snapshot.players[snapshot.turnSlot],
        boards: [snapshot.boards[0].toString(), snapshot.boards[1].toString()],
        lastMove: snapshot.lastMove,
        timersMs: [...snapshot.timers],
        serverNow: Date.now()
    } as const;
}

function toEndPayload(room: GameRoom, end: RoomEnd, meta: EndMeta): protocol.EndInputPayload {
    const snapshot = room.getSnapshot();

    if (end.status === "win") {
        return {
            ...meta,
            status: "win",
            winner: snapshot.players[end.winnerSlot],
            winningMask: end.winningMask.toString(),
            reason: "Player won the game"
        } as const;
    }

    if (end.status === "draw") {
        return {
            ...meta,
            status: "draw",
            reason: "Game ended in a draw"
        } as const;
    }

    if (end.status === "resign") {
        return {
            ...meta,
            status: "resign",
            winner: snapshot.players[end.winnerSlot],
            reason: "Player left the game"
        } as const;
    }

    if (end.status === "timeout") {
        return {
            ...meta,
            status: "timeout",
            winner: snapshot.players[end.winnerSlot],
            reason: "Player run out of time"
        } as const;
    }

    return {
        ...meta,
        status: "end",
        reason: "Player left the game"
    };
}

export { toWaitPayload, toStartPayload, toUpdatePayload, toEndPayload };
