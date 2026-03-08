import { MatchmakingRepo } from "../repo/matchmaking.repo";

class MatchmakingService {
    onDrain?: (socketId1: string, socketId2: string, addToQueue: (socketId: string) => void) => void;

    private draining = false;

    constructor(private repo: MatchmakingRepo) {}

    join(socketId: string) {
        if (!this.repo.addToQueue(socketId)) return { ok: true, status: "ALREADY_QUEUED" } as const;
        this.requestDrain();
        return { ok: true, status: "JOINED_QUEUE" } as const;
    }

    leave(socketId: string) {
        if (this.repo.removeFromQueue(socketId)) return { ok: true, status: "LEFT_QUEUE" } as const;
        return { ok: true, status: "NOT_IN_QUEUE" } as const;
    }

    private requestDrain() {
        if (this.draining) return;
        this.draining = true;

        setImmediate(() => {
            try {
                this.drain();
            } finally {
                this.draining = false;
            }
        });
    }

    private drain() {
        while (this.repo.queueSize() >= 2) {
            const s1 = this.repo.dequeue();
            const s2 = this.repo.dequeue();

            if (!s1 || !s2) {
                if (s1) this.repo.addToQueue(s1);
                break;
            }

            this.onDrain?.(s1, s2, (socketId) => this.repo.addToQueue(socketId));
        }
    }
}

export { MatchmakingService };
