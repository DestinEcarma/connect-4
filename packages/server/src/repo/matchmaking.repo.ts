import { Queue } from "../lib/queue";

class MatchmakingRepo {
    private queue = new Queue<string>();

    addToQueue(socketId: string) {
        return this.queue.enqueue(socketId);
    }

    removeFromQueue(socketId: string) {
        return this.queue.remove(socketId);
    }

    dequeue() {
        return this.queue.dequeue();
    }

    queueSize() {
        return this.queue.size();
    }
}

export { MatchmakingRepo };
