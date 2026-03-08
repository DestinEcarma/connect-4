import { Server as HttpServer } from "http";
import { Server } from "socket.io";

import { registerGameRoomHandlers } from "./handlers/game-room.handler";
import { initMatchmakingHandler, registerMatchmakingHandlers } from "./handlers/matchmaking.handler";
import { logger } from "./lib/logger";
import { Scheduler } from "./lib/scheduler";
import { GameRoomRepo } from "./repo/game-room.repo";
import { MatchmakingRepo } from "./repo/matchmaking.repo";
import { EmitPort } from "./services";
import { GameRoomService } from "./services/game-room.service";
import { MatchmakingService } from "./services/matchmaking.service";
import { RoomLifecycleService } from "./services/room-lifecycle.service";

function initSocket(httpServer: HttpServer) {
    const io = new Server(httpServer, {
        path: "/socket.io/",
        pingTimeout: 60000
    });

    const gameRoomRepo = new GameRoomRepo();
    const matchmakingRepo = new MatchmakingRepo();

    const scheduler = new Scheduler<string>();

    const emit: EmitPort = {
        toRoom: (roomId, event, payload) => io.to(roomId).emit(event, payload),
        toSocket: (socketId, event, payload) => io.to(socketId).emit(event, payload),
        toOthers: (roomId, socketId, event, payload) =>
            io.sockets.sockets.get(socketId)?.to(roomId).emit(event, payload),
        socketLeave: (socketId, roomId) => io.sockets.sockets.get(socketId)?.leave(roomId),
        socketsLeave: (roomId) => io.socketsLeave(roomId),
        joinRoom: (socketId, roomId) => io.sockets.sockets.get(socketId)?.join(roomId)
    };

    const roomLifecycleService = new RoomLifecycleService(gameRoomRepo, scheduler, emit);

    const matchmakingService = new MatchmakingService(matchmakingRepo);
    const gameRoomService = new GameRoomService(gameRoomRepo, roomLifecycleService, emit);

    initMatchmakingHandler(matchmakingService, gameRoomRepo, scheduler, roomLifecycleService, io);

    io.on("connection", (socket) => {
        logger.debug(`Socket connected. socketId=${socket.id}`);

        registerGameRoomHandlers(gameRoomService, io, socket);
        registerMatchmakingHandlers(matchmakingService, io, socket);

        socket.on("disconnect", () => {
            logger.debug(`Socket disconnected. socketId=${socket.id}`);
        });
    });

    return io;
}

export { initSocket };
