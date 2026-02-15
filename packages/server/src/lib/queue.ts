import { logger } from "./logger";

const THRESHOLD = 50;

class Queue<T> {
    private queue: T[] = [];
    private queued = new Set<T>();
    private head = 0;

    getQueued() {
        return Array.from(this.queued);
    }

    enqueue(item: T) {
        if (this.queued.has(item)) return false;
        this.queue.push(item);
        this.queued.add(item);
        return true;
    }

    dequeue() {
        while (this.head < this.queue.length) {
            const item = this.queue[this.head++]!;
            if (this.queued.delete(item)) {
                this.maybeCompact();
                return item;
            }
        }

        this.queue.length = 0;
        this.head = 0;

        return undefined;
    }

    remove(item: T) {
        const removed = this.queued.delete(item);
        if (removed) this.maybeCompact();
        return removed;
    }

    size() {
        return this.queued.size;
    }

    private maybeCompact() {
        const isHeadFar = this.head > THRESHOLD && this.head > this.queue.length / 2;
        const isBloated = this.queue.length > THRESHOLD && this.queue.length > this.queued.size * 2;

        if (isHeadFar || isBloated) {
            this.compact();
        }
    }

    private compact() {
        logger.debug(`Compacting queue. size=${this.queue.length}`);

        const live: T[] = [];

        for (let i = this.head; i < this.queue.length; i++) {
            const item = this.queue[i];
            if (this.queued.has(item)) live.push(item);
        }

        this.queue = live;
        this.head = 0;
    }
}

export { Queue };
