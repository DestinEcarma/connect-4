import { Server, Socket } from "socket.io";

import { protocol } from "@connect-4/shared";

import { logger } from "../lib/logger";
import { GameRoomService } from "../services/game-room.service";

function registerGameRoomHandlers(service: GameRoomService, io: Server, socket: Socket) {
    socket.on("game:join", (raw) => {
        const parsed = protocol.JoinSchema.safeParse(raw);
        if (!parsed.success) return socket.emit("game:unauthorize");

        const { roomId, token } = parsed.data;

        const res = service.join(roomId, token, socket.id);
        if (!res.ok) return socket.emit("game:unauthorize");

        logger.debug(`Socket joined game room. roomId=${roomId}, socketId=${socket.id}`);

        if (res.status === "STARTED") {
            logger.debug(`Game room started. roomId=${roomId}, socketId=${socket.id}`);
        } else if (res.status === "RECONNECTED") {
            logger.debug(`Socket reconnected to game room. roomId=${roomId}, socketId=${socket.id}`);
        }
    });

    socket.on("game:leave", () => {
        const res = service.leave(socket.id);
        if (!res.ok) return;

        logger.debug(`Socket left game room. roomId=${res.roomId}, socketId=${socket.id}`);
    });

    socket.on("game:move", (raw) => {
        const parsed = protocol.MoveSchema.safeParse(raw);
        if (!parsed.success) return;

        const { column } = parsed.data;

        const res = service.move(socket.id, column);
        if (!res.ok) return;

        logger.debug(`Socket moved. roomId=${res.roomId}, socketId=${socket.id}, column=${column}`);
    });

    socket.on("game:rematch", () => {
        const res = service.rematch(socket.id);
        if (!res.ok) return;

        if (res.status === "VOTED") {
            logger.debug(`Socket voted for rematch. roomId=${res.roomId}, socketId=${socket.id}`);
        } else if (res.status === "RESTARTED") {
            logger.debug(`Socket restarted game. roomId=${res.roomId}, socketId=${socket.id}`);
        }
    });

    socket.on("game:unmount", () => service.depart(socket.id));
    socket.on("disconnect", () => service.depart(socket.id));
}

export { registerGameRoomHandlers };
