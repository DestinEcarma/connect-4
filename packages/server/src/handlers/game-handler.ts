import { Server, Socket } from "socket.io";

import { COLS, GameStatus } from "@connect-4/shared";

import { GameInstance } from "../instances/game-instance";
import { logger } from "../lib/logger";
import { gameManager } from "../managers/game-manager";
import { timeManager } from "../managers/time-manager";

const REMATCH_GRACE_PERIOD = 13000;
const DEPARTURE_GRACE_PERIOD = 10000;

function rematchGracePeriod(io: Server, roomId: string) {
    if (!gameManager.removeGame(roomId)) return;

    logger.debug(`Rematch period expired. roomId=${roomId}`);

    io.to(roomId).emit("game:terminate");
    io.socketsLeave(roomId);
}

function initGameHandler(io: Server) {
    timeManager.onTimeout = (game: GameInstance) => {
        io.to(game.roomId).emit("game:end", game.serialize_timeout());

        const roomId = game.roomId;
        game.rematchTimeout = setTimeout(() => rematchGracePeriod(io, roomId), REMATCH_GRACE_PERIOD);
    };

    timeManager.onTick = (game: GameInstance) => {
        io.to(game.roomId).emit("game:tick", { timers: game.timers });
    };

    gameManager.onReservationExpired = (roomId: string) => {
        io.to(roomId).emit("game:expire");
    };
}

function registerGameHandlers(io: Server, socket: Socket) {
    const onDeparture = (reason: "unmount" | "disconnect") => {
        const game = gameManager.removeSocketFromRoomId(socket.id);
        if (!game) return;

        const roomId = game.roomId;
        logger.debug(`Socket ${reason}. roomId=${roomId}, socketId=${socket.id}`);

        socket.to(roomId).emit(`game:${reason}`, { socketId: socket.id });
        socket.leave(roomId);

        if (game.departureTimeout) clearTimeout(game.departureTimeout);
        game.departureTimeout = setTimeout(() => {
            const game = gameManager.getGameByRoomId(roomId);
            if (!game) return;

            const playersLeft = game.readyPlayers.size;
            if (playersLeft >= 2) return (game.departureTimeout = null);

            const isPlaying = game.instance.getStatus() === GameStatus.Playing;

            if (playersLeft === 1) {
                io.to(roomId).emit("game:end", isPlaying ? game.serialize_resign(socket.id) : game.serialize_end());

                return gameManager.removeGame(roomId);
            } else {
                return gameManager.removeGame(roomId);
            }
        }, DEPARTURE_GRACE_PERIOD);
    };

    socket.on("game:join", ({ roomId, token }: { roomId: string; token: string }) => {
        if (!roomId || !token) return socket.emit("game:unauthorize");

        const game = gameManager.claimSlot(roomId, token, socket.id);
        if (!game) return socket.emit("game:unauthorize");

        logger.debug(`Socket joined a room. roomId=${roomId}, socketId=${socket.id}, token=${token}`);
        socket.join(roomId);

        if (game.started) {
            socket.to(roomId).emit("game:reconnect", { socketId: socket.id });
            return socket.emit("game:start", game.serialize_start());
        }

        if (game.readyPlayers.size === 2) {
            game.start();
            gameManager.removeReservationFromTimout(roomId);
            io.to(roomId).emit("game:start", game.serialize_start());
            timeManager.poke();
        } else {
            socket.emit("game:wait");
        }
    });

    socket.on("game:leave", () => {
        const game = gameManager.removeSocketFromRoomId(socket.id);
        if (!game) return;

        logger.debug(`Socket left the room. roomId=${game.roomId}, socketId=${socket.id}`);

        if (game.instance.getStatus() === GameStatus.Playing) {
            socket.to(game.roomId).emit("game:end", game.serialize_resign(socket.id));
        } else {
            socket.to(game.roomId).emit("game:leave", { socketId: socket.id });
        }

        io.socketsLeave(game.roomId);
        gameManager.removeGame(game.roomId);
    });

    socket.on("game:move", (column: number) => {
        if (column === undefined || column < 0 || column > COLS) return;

        const game = gameManager.getGameBySocketId(socket.id);
        if (!game) return;

        if (game.players[game.instance.getTurn()] !== socket.id) return;
        if (!game.instance.makeMove(column)) return;

        io.to(game.roomId).emit("game:update", game.serialize_update());

        const status = game.instance.getStatus();
        const roomId = game.roomId;

        if (status !== GameStatus.Playing) {
            io.to(game.roomId).emit("game:end", {
                ...(status === GameStatus.Won ? game.serialize_win() : game.serialize_draw()),
                rematchExpiry: Date.now() + REMATCH_GRACE_PERIOD
            });

            game.rematchTimeout = setTimeout(() => rematchGracePeriod(io, roomId), REMATCH_GRACE_PERIOD);
        }
    });

    socket.on("game:rematch", () => {
        const game = gameManager.getGameBySocketId(socket.id);
        if (!game || game.instance.getStatus() === GameStatus.Playing) return;

        game.rematchVotes.add(socket.id);

        if (game.rematchVotes.size === 2) {
            game.rematch();
            io.to(game.roomId).emit("game:start", game.serialize_start());
            timeManager.poke();
        } else {
            socket.to(game.roomId).emit("game:rematch");
        }
    });

    socket.on("game:unmount", () => onDeparture("unmount"));
    socket.on("disconnect", () => onDeparture("disconnect"));
}

export { initGameHandler, registerGameHandlers };
