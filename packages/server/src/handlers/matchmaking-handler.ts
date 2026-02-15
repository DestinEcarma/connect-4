import { nanoid } from "nanoid";
import { Server, Socket } from "socket.io";

import { logger } from "../lib/logger";
import { gameManager } from "../managers/game-manager";
import { matchmakingManager } from "../managers/matchmaking-manager";

function initMatchmakingHandler(io: Server) {
    matchmakingManager.onDrain = (p1: string, p2: string) => {
        const s1 = io.sockets.sockets.get(p1);
        const s2 = io.sockets.sockets.get(p2);

        if (!s1 || !s2) {
            if (s1) matchmakingManager.addToQueue(p1);
            if (s2) matchmakingManager.addToQueue(p2);
            return;
        }

        const roomId = gameManager.generateId();
        const t1 = nanoid();
        const t2 = nanoid();

        gameManager.reserveGame(roomId, [t1, t2]);

        logger.debug(`Match found. roomId=${roomId}, p1=${p1}, p2=${p2}`);
        s1.emit("matchmaking:found", { roomId, token: t1 });
        s2.emit("matchmaking:found", { roomId, token: t2 });
    };
}

function registerMatchmakingHandlers(io: Server, socket: Socket) {
    socket.on("matchmaking:join", () => {
        if (matchmakingManager.addToQueue(socket.id)) {
            logger.debug(`Player added to queue. socketId=${socket.id}`);
        }

        matchmakingManager.requestDrain();
    });

    socket.on("matchmaking:leave", () => {
        if (matchmakingManager.removeFromQueue(socket.id)) {
            logger.debug(`Player removed from queue. socketId=${socket.id}`);
        }
    });

    socket.on("disconnect", () => {
        if (matchmakingManager.removeFromQueue(socket.id)) {
            logger.debug(`Player removed from queue. socketId=${socket.id}`);
        }
    });
}

export { initMatchmakingHandler, registerMatchmakingHandlers };
