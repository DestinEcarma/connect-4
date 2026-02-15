import { Server as HttpServer } from "http";
import { Server } from "socket.io";

import { initGameHandler, registerGameHandlers } from "./handlers/game-handler";
import { initMatchmakingHandler, registerMatchmakingHandlers } from "./handlers/matchmaking-handler";
import { logger } from "./lib/logger";

function initSocket(httpServer: HttpServer) {
    const io = new Server(httpServer, {
        path: "/socket.io/",
        pingTimeout: 60000
    });

    initGameHandler(io);
    initMatchmakingHandler(io);

    io.on("connection", (socket) => {
        logger.debug(`Socket connected. socketId=${socket.id}`);

        registerGameHandlers(io, socket);
        registerMatchmakingHandlers(io, socket);

        socket.on("disconnect", () => {
            logger.debug(`Socket disconnected. socketId=${socket.id}`);
        });
    });

    return io;
}

export { initSocket };
