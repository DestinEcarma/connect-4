import { useEffect, useMemo, useReducer } from "react";

import type { protocol } from "@connect-4/shared";

import * as gameRoomClient from "@/services/game-room.client";
import { socket } from "@/services/socket";

type Role = 0 | 1;

type LastMove = { column: number; row: number };

type State =
    | {
          tag: "joining";
          roomId: string;
      }
    | {
          tag: "waiting";
          myRole: Role;
          timersMs: readonly [number, number];
          serverNow: number;
          otherOnline: boolean;
      }
    | {
          tag: "playing";
          myRole: Role;
          otherOnline: boolean;
          activePlayerId: string | null;
          timersMs: readonly [number, number];
          serverNow: number;
          boards: readonly [bigint, bigint];
          lastMove?: LastMove;
      }
    | {
          tag: "ended" | "rematch";
          myRole: Role;
          otherOnline: boolean;
          activePlayerId: string | null;
          timersMs: readonly [number, number];
          serverNow: number;
          boards: readonly [bigint, bigint];
          lastMove?: LastMove;
          end: protocol.EndPayload;
      }
    | { tag: "unauthorized" }
    | {
          tag: "expired";
          myRole: Role;
          timersMs: readonly [number, number];
          otherOnline: boolean;
          cleanupAt: number;
          serverNow: number;
      }
    | { tag: "cleanup" };

type Action =
    | { type: "WAIT"; payload: protocol.WaitPayload }
    | { type: "START"; payload: protocol.StartPayload }
    | { type: "UPDATE"; payload: protocol.UpdatePayload }
    | { type: "REMATCH" }
    | { type: "OTHER_ONLINE"; online: boolean }
    | { type: "END"; payload: protocol.EndPayload }
    | { type: "UNAUTHORIZE" }
    | { type: "EXPIRE"; payload: protocol.ExpirePayload }
    | { type: "CLEAN_UP" };

function deriveMyRole(players: readonly (string | null)[], mySocketId: string): Role | undefined {
    const idx = players.indexOf(mySocketId);
    if (idx === 0 || idx === 1) return idx;
    return undefined;
}

function reducer(state: State, action: Action): State {
    switch (action.type) {
        case "WAIT": {
            if (state.tag === "unauthorized" || state.tag === "cleanup") return state;

            const myRole = deriveMyRole(action.payload.players, socket.id ?? "");
            if (myRole === undefined) return { tag: "unauthorized" };

            return {
                tag: "waiting",
                myRole,
                timersMs: action.payload.timersMs,
                serverNow: action.payload.serverNow,
                otherOnline: false
            };
        }

        case "START": {
            if (state.tag === "unauthorized" || state.tag === "cleanup") return state;

            const myRole = deriveMyRole(action.payload.players, socket.id ?? "");
            if (myRole === undefined) return { tag: "unauthorized" };

            return {
                tag: "playing",
                myRole,
                otherOnline: true,
                activePlayerId: action.payload.activePlayerId,
                timersMs: action.payload.timersMs,
                serverNow: action.payload.serverNow,
                boards: action.payload.boards as [bigint, bigint],
                lastMove: action.payload.lastMove
            };
        }

        case "UPDATE": {
            if (state.tag !== "playing") return state;

            return {
                ...state,
                activePlayerId: action.payload.activePlayerId,
                timersMs: action.payload.timersMs,
                serverNow: action.payload.serverNow,
                boards: action.payload.boards as [bigint, bigint],
                lastMove: action.payload.lastMove
            };
        }

        case "REMATCH": {
            if (state.tag !== "ended") return state;

            return {
                ...state,
                tag: "rematch"
            };
        }

        case "END": {
            if (state.tag !== "playing" && state.tag !== "ended") return state;

            const end =
                state.tag === "ended"
                    ? {
                          ...action.payload,
                          statusAt: state.end.statusAt,
                          cleanupAt: state.end.cleanupAt
                      }
                    : action.payload;

            return {
                tag: "ended",
                myRole: state.myRole,
                otherOnline:
                    action.payload.status === "resign" || action.payload.status === "end" ? false : state.otherOnline,
                activePlayerId: state.activePlayerId,
                timersMs: state.timersMs,
                serverNow: state.serverNow,
                boards: state.boards,
                lastMove: state.lastMove,
                end
            };
        }

        case "OTHER_ONLINE": {
            if (state.tag === "waiting" || state.tag === "playing" || state.tag === "ended" || state.tag === "rematch")
                return { ...state, otherOnline: action.online };

            return state;
        }

        case "UNAUTHORIZE":
            return { tag: "unauthorized" };

        case "EXPIRE":
            if (state.tag !== "waiting") return state;

            return {
                tag: "expired",
                myRole: state.myRole,
                timersMs: state.timersMs,
                otherOnline: state.otherOnline,
                cleanupAt: action.payload.cleanupAt,
                serverNow: action.payload.serverNow
            };

        case "CLEAN_UP":
            return { tag: "cleanup" };

        default:
            return state;
    }
}

function useGameRoom(params: { roomId: string; token: string | null }) {
    const { roomId, token } = params;

    const [state, dispatch] = useReducer(reducer, { tag: "joining", roomId } as State);

    useEffect(() => {
        if (!roomId) return;

        const unsubscribe = gameRoomClient.subscribe({
            onWait: (payload) => dispatch({ type: "WAIT", payload }),
            onStart: (payload) => dispatch({ type: "START", payload }),
            onRematch: () => dispatch({ type: "REMATCH" }),

            onUpdate: (payload) => dispatch({ type: "UPDATE", payload }),
            onOtherOnline: (online) => dispatch({ type: "OTHER_ONLINE", online }),

            onEnd: (payload) => dispatch({ type: "END", payload }),

            onExpire: (payload) => dispatch({ type: "EXPIRE", payload }),
            onUnauthorize: () => dispatch({ type: "UNAUTHORIZE" }),
            onCleanup: () => dispatch({ type: "CLEAN_UP" })
        });

        gameRoomClient.join(roomId, token);

        return () => {
            unsubscribe();
            gameRoomClient.leave(true);
        };
    }, [roomId, token]);

    const actions = {
        move: gameRoomClient.move,
        rematch: gameRoomClient.rematch,
        leave: gameRoomClient.leave
    };

    const view = useMemo(() => {
        if (state.tag !== "playing" && state.tag !== "ended" && state.tag !== "rematch") return null;

        const myRole = state.myRole;
        const timers = [state.timersMs[myRole], state.timersMs[myRole ^ 1]] as const;
        const isTurn = state.activePlayerId === socket.id;

        return {
            myRole,
            otherOnline: state.otherOnline,
            timers,
            boards: state.boards,
            lastMove: state.lastMove,
            isTurn,
            turn: (isTurn ? myRole : myRole ^ 1) as Role,
            ended: state.tag !== "playing" ? { isWinner: state.end.winner === socket.id, ...state.end } : undefined
        } as const;
    }, [state]);

    return { state, view, actions };
}

export { useGameRoom, type Role };
