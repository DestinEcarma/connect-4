import { Queue } from "../lib/queue";

class MatchmakingManager {
    onDrain?: (p1: string, p2: string) => void;

    private draining = false;
    private queue = new Queue<string>();

    getInQueue() {
        return this.queue.getQueued();
    }

    addToQueue(socketId: string) {
        return this.queue.enqueue(socketId);
    }

    removeFromQueue(socketId: string) {
        return this.queue.remove(socketId);
    }

    requestDrain() {
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
        while (this.queue.size() >= 2) {
            const p1 = this.queue.dequeue();
            const p2 = this.queue.dequeue();

            if (!p1 || !p2) {
                if (p1) this.queue.enqueue(p1);
                break;
            }

            this.onDrain?.(p1, p2);
        }
    }
}

const matchmakingManager = new MatchmakingManager();

export { matchmakingManager };
