class Scheduler<K> {
    schedules = new Map<K, NodeJS.Timeout>();

    schedule(key: K, delay: number, callback: () => void) {
        const timeout = setTimeout(() => {
            this.schedules.delete(key);
            callback();
        }, delay);

        this.schedules.set(key, timeout);
    }

    cancel(key: K) {
        const timeout = this.schedules.get(key);

        if (timeout !== undefined) {
            clearTimeout(timeout);
            this.schedules.delete(key);
        }
    }

    has(key: K): boolean {
        return this.schedules.has(key);
    }

    clear() {
        this.schedules.forEach((timeout) => clearTimeout(timeout));
        this.schedules.clear();
    }
}

export { Scheduler };
