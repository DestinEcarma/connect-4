import { EmitPort } from ".";
import { GameRoom } from "../domain/game-room";
import { toEndPayload, toStartPayload, toUpdatePayload, toWaitPayload } from "../mappers/game-room.mapper";
import { CLEANUP_GRACE_PERIOD, REMATCH_WINDOW, STATUS_DELAY } from "../miscs";
import { GameRoomRepo } from "../repo/game-room.repo";
import { RoomLifecycleService } from "./room-lifecycle.service";

class GameRoomService {
    constructor(
        private repo: GameRoomRepo,
        private roomLifecycleService: RoomLifecycleService,
        private emit: EmitPort
    ) {}

    join(roomId: string, token: string, socketId: string) {
        const room = this.repo.claimSlot(roomId, token, socketId);
        if (!room) return { ok: false, code: "UNAUTHORIZED" } as const;
        if (this.roomLifecycleService.has(room.roomId, "cleanup")) return { ok: false, code: "CLEANUP_IN_PROGRESS" };

        this.emit.joinRoom(socketId, roomId);

        if (room.phase === "playing") {
            room.chargeTime();

            this.emit.toOthers(roomId, socketId, "game:reconnect", { socketId });
            this.emit.toRoom(roomId, "game:start", toStartPayload(room));
            return { ok: true, status: "RECONNECTED" } as const;
        }

        if (room.canStart()) {
            room.start();

            this.roomLifecycleService.cancel(room.roomId, "reservation");
            this.emit.toRoom(roomId, "game:start", toStartPayload(room));
            return { ok: true, status: "STARTED" } as const;
        }

        this.emit.toRoom(roomId, "game:wait", toWaitPayload(room));
        return { ok: true, status: "WAIT" } as const;
    }

    leave(socketId: string) {
        const room = this.repo.getBySocketId(socketId);
        if (!room) return { ok: false, code: "NOT_IN_ROOM" } as const;

        const now = Date.now();
        const statusAt = now + STATUS_DELAY;
        const cleanupAt = statusAt + CLEANUP_GRACE_PERIOD;
        const ended = room.resign(socketId);

        this.emit.toOthers(
            room.roomId,
            socketId,
            "game:leave",
            toEndPayload(room, ended, { statusAt, cleanupAt, serverNow: now })
        );

        this.repo.removeSocket(socketId);
        this.roomLifecycleService.scheduleCleanup(room.roomId, cleanupAt - now);
        this.emit.socketLeave(socketId, room.roomId);

        return { ok: true, roomId: room.roomId } as const;
    }

    move(socketId: string, col: number) {
        const room = this.repo.getBySocketId(socketId);
        if (!room) return { ok: false, code: "NOT_IN_ROOM" } as const;

        const res = room.move(socketId, col);
        if (!res.ok) return res;

        this.emit.toRoom(room.roomId, "game:update", toUpdatePayload(room));

        if (res.ended) {
            const now = Date.now();
            const statusAt = now + STATUS_DELAY;
            const cleanupAt = statusAt + REMATCH_WINDOW;

            this.emit.toRoom(
                room.roomId,
                "game:end",
                toEndPayload(room, res.ended, { statusAt, cleanupAt, serverNow: now })
            );
            this.roomLifecycleService.scheduleRematchCleanup(room.roomId, cleanupAt - now);

            return { ok: true, ended: res.ended, roomId: room.roomId } as const;
        }

        this.scheduleTurnTimeout(room);

        return { ok: true, roomId: room.roomId } as const;
    }

    rematch(socketId: string) {
        const room = this.repo.getBySocketId(socketId);
        if (!room) return { ok: false, code: "NOT_IN_ROOM" } as const;

        const res = room.voteRematch(socketId);
        if (!res.ok) return res;

        if (res.ready) {
            this.roomLifecycleService.cancel(room.roomId, "rematchCleanup");

            room.rematch();

            this.emit.toRoom(room.roomId, "game:start", toStartPayload(room));
            return { ok: true, status: "RESTARTED", roomId: room.roomId } as const;
        }

        this.emit.toOthers(room.roomId, socketId, "game:rematch");
        return { ok: true, status: "VOTED", roomId: room.roomId } as const;
    }

    depart(socketId: string) {
        const room = this.repo.removeSocket(socketId);
        if (!room) return { ok: false, code: "NOT_IN_ROOM" } as const;
        if (room.removePlayer(socketId)) return { ok: false, code: "NOT_IN_ROOM" };

        this.emit.toOthers(room.roomId, socketId, "game:depart");
        this.emit.socketLeave(socketId, room.roomId);

        return { ok: true } as const;
    }

    private scheduleTurnTimeout(room: GameRoom) {
        if (this.roomLifecycleService.has(room.roomId, "turnTimeout")) {
            this.roomLifecycleService.cancel(room.roomId, "turnTimeout");
        }

        room.chargeTime();

        const turn = room.game.getTurn();
        const ms = room.timers[turn];

        this.roomLifecycleService.schedule(room.roomId, "turnTimeout", ms, () => {
            const latest = this.repo.getByRoomId(room.roomId);
            if (!latest) return;

            const now = Date.now();
            const statusAt = now + STATUS_DELAY;
            const cleanupAt = statusAt + REMATCH_WINDOW;

            latest.chargeTime(now);

            const ended = latest.timeout(turn);

            this.emit.toRoom(
                latest.roomId,
                "game:end",
                toEndPayload(room, ended, { statusAt, cleanupAt, serverNow: now })
            );
            this.roomLifecycleService.scheduleRematchCleanup(latest.roomId, cleanupAt - now);
        });
    }
}

export { GameRoomService };
