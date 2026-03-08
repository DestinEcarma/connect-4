import { EmitPort } from ".";
import { Scheduler } from "../lib/scheduler";
import { GameRoomRepo } from "../repo/game-room.repo";

class RoomLifecycleService {
    keys = {
        reservation: (roomId: string) => `reservation:${roomId}`,
        cleanup: (roomId: string) => `cleanup:${roomId}`,
        turnTimeout: (roomId: string) => `turn-timeout:${roomId}`,
        rematchCleanup: (roomId: string) => `rematch-cleanup:${roomId}`
    } as const;

    constructor(
        private repo: GameRoomRepo,
        private scheduler: Scheduler<string>,
        private emit: EmitPort
    ) {}

    has(roomId: string, type: keyof typeof this.keys) {
        return this.scheduler.has(this.keys[type](roomId));
    }

    schedule(roomId: string, type: keyof typeof this.keys, delayMs: number, callback: () => void) {
        this.scheduler.schedule(this.keys[type](roomId), delayMs, callback);
    }

    scheduleCleanup(roomId: string, delayMs: number, payload?: unknown) {
        this.scheduler.schedule(this.keys.cleanup(roomId), delayMs, () => this.cleanup(roomId, payload));
    }

    scheduleRematchCleanup(roomId: string, delayMs: number, payload?: unknown) {
        this.scheduler.schedule(this.keys.rematchCleanup(roomId), delayMs, () => this.cleanup(roomId, payload));
    }

    cancel(roomId: string, type: keyof typeof this.keys) {
        this.scheduler.cancel(this.keys[type](roomId));
    }

    cancelAll(roomId: string) {
        this.scheduler.cancel(this.keys.reservation(roomId));
        this.scheduler.cancel(this.keys.cleanup(roomId));
        this.scheduler.cancel(this.keys.turnTimeout(roomId));
        this.scheduler.cancel(this.keys.rematchCleanup(roomId));
    }

    private cleanup(roomId: string, payload?: unknown) {
        if (!this.repo.has(roomId)) return;

        this.emit.toRoom(roomId, "game:cleanup", payload);
        this.emit.socketsLeave(roomId);
        this.repo.removeGameRoom(roomId);

        this.cancelAll(roomId);
    }
}

export { RoomLifecycleService };
