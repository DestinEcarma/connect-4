import { nanoid } from "nanoid";
import { Server, Socket } from "socket.io";

import { logger } from "../lib/logger";
import { Scheduler } from "../lib/scheduler";
import { CLEANUP_GRACE_PERIOD, RESERVATION_EXPIRY, ROOM_ID_LENGHT } from "../miscs";
import { GameRoomRepo } from "../repo/game-room.repo";
import { MatchmakingService } from "../services/matchmaking.service";
import { RoomLifecycleService } from "../services/room-lifecycle.service";

function initMatchmakingHandler(
    service: MatchmakingService,
    gameRoomRepo: GameRoomRepo,
    scheduler: Scheduler<string>,
    roomLifecycleService: RoomLifecycleService,
    io: Server
) {
    service.onDrain = (socketId1, socketId2, addToQueue) => {
        const s1 = io.sockets.sockets.get(socketId1);
        const s2 = io.sockets.sockets.get(socketId2);

        if (!s1 || !s2) {
            if (s1) addToQueue(socketId1);
            if (s2) addToQueue(socketId2);
            return;
        }

        const roomId = nanoid(ROOM_ID_LENGHT);
        const t1 = nanoid();
        const t2 = nanoid();

        gameRoomRepo.createRoom(roomId, [t1, t2]);

        scheduler.schedule(roomLifecycleService.keys.reservation(roomId), RESERVATION_EXPIRY, () => {
            if (!gameRoomRepo.has(roomId)) return;

            logger.debug(`Reservation expired. roomId=${roomId}`);

            const now = Date.now();
            const cleanupAt = now + CLEANUP_GRACE_PERIOD;
            io.to(roomId).emit("game:expire", { cleanupAt, serverNow: now });

            roomLifecycleService.scheduleCleanup(roomId, CLEANUP_GRACE_PERIOD);
        });

        logger.debug(`Match found. roomId=${roomId}, socketId1=${socketId1}, socketId2=${socketId2}`);
        s1.emit("matchmaking:found", { roomId, token: t1 });
        s2.emit("matchmaking:found", { roomId, token: t2 });
    };
}

function registerMatchmakingHandlers(service: MatchmakingService, io: Server, socket: Socket) {
    socket.on("matchmaking:join", () => {
        const res = service.join(socket.id);
        if (res.ok) logger.debug(`Socket added to queue. socketId=${socket.id}, status=${res.status}`);
    });

    socket.on("matchmaking:leave", () => {
        const res = service.leave(socket.id);
        if (res.ok) logger.debug(`Socket removed from queue. socketId=${socket.id}, status=${res.status}`);
    });

    socket.on("disconnect", () => {
        const res = service.leave(socket.id);
        if (res.ok) logger.debug(`Socket removed from queue. socketId=${socket.id}, status=${res.status}`);
    });
}

export { initMatchmakingHandler, registerMatchmakingHandlers };
