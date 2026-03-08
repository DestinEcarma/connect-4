import { connect4 } from "@connect-4/shared";

const TIME_LIMIT = 240_000;

type Slot = 0 | 1;
type RoomPhase = "lobby" | "playing" | "ended";

type RoomEnd =
    | { status: "win"; winnerSlot: Slot; winningMask: bigint }
    | { status: "draw" }
    | { status: "resign"; winnerSlot: Slot }
    | { status: "timeout"; winnerSlot: Slot }
    | { status: "end" };

class GameRoom {
    public phase: RoomPhase = "lobby";
    public game: connect4.Game;
    public players: [string | null, string | null] = [null, null];
    public timers: [number, number] = [TIME_LIMIT, TIME_LIMIT];

    private rematchVotes = new Set<string>();

    private lastUpdatedMs = Date.now();

    constructor(
        public readonly roomId: string,
        public readonly slotTokens: readonly [string, string]
    ) {
        this.game = new connect4.Game();
    }

    getSnapshot() {
        return {
            roomId: this.roomId,
            phase: this.phase,
            players: [...this.players],
            timers: [...this.timers],
            turnSlot: this.game.getTurn() as Slot,
            status: this.game.getStatus(),
            boards: this.game.getBoards(),
            lastMove: this.game.getLastMove(),
            winner: this.game.getWinner(),
            winningMask: this.game.getWinningMask(),
            rematchVotes: this.rematchVotes.size
        } as const;
    }

    claimSlot(socketId: string, token: string) {
        const slot = this.slotTokens.indexOf(token) as Slot | -1;
        if (slot === -1) return null;

        const existing = this.players[slot];
        if (existing && existing !== socketId) return null;

        this.players[slot] = socketId;
        return slot;
    }

    claimAnyOpenSlot(socketId: string) {
        const slot = this.players.indexOf(null) as Slot | -1;
        if (slot === -1) return null;

        this.players[slot] = socketId;
        return slot;
    }

    removePlayer(socketId: string) {
        const slot = this.players.indexOf(socketId) as Slot | -1;
        if (slot === -1) return false;

        this.players[slot] = null;
        return true;
    }

    getSlotOf(socketId: string) {
        const idx = this.players.indexOf(socketId);
        return idx === -1 ? null : (idx as Slot);
    }

    readyCount(): number {
        return (this.players[0] !== null ? 1 : 0) + (this.players[1] !== null ? 1 : 0);
    }

    canStart(): boolean {
        return this.phase === "lobby" && this.readyCount() === 2;
    }

    start(now = Date.now()): void {
        if (!this.canStart()) return;

        this.phase = "playing";
        this.lastUpdatedMs = now;
        this.rematchVotes.clear();
    }

    chargeTime(now = Date.now()) {
        const elapsed = now - this.lastUpdatedMs;
        const turnSlot = this.game.getTurn();

        this.timers[turnSlot] = Math.max(0, this.timers[turnSlot] - elapsed);
        this.lastUpdatedMs = now;

        return { turn: turnSlot, remaining: this.timers[turnSlot] };
    }

    move(socketId: string, col: number) {
        if (this.phase !== "playing") return { ok: false, code: "NOT_PLAYING" } as const;

        const slot = this.getSlotOf(socketId);
        if (slot === null) return { ok: false, code: "NOT_IN_ROOM" } as const;

        const turnSlot = this.game.getTurn() as Slot;
        if (slot !== turnSlot) return { ok: false, code: "NOT_YOUR_TURN" } as const;

        const ok = this.game.makeMove(col);
        if (!ok) return { ok: false, code: "ILLEGAL_MOVE" } as const;

        const status = this.game.getStatus();
        if (status === connect4.GameStatus.Won) {
            this.phase = "ended";

            return {
                ok: true,
                ended: {
                    status: "win",
                    winnerSlot: slot,
                    winningMask: this.game.getWinningMask() ?? 0n
                } as RoomEnd
            } as const;
        }

        if (status === connect4.GameStatus.Draw) {
            this.phase = "ended";

            return {
                ok: true,
                ended: { status: "draw" } as RoomEnd
            } as const;
        }

        return { ok: true } as const;
    }

    resign(socketId: string): RoomEnd {
        const slot = this.getSlotOf(socketId);
        if (slot === null || this.phase === "ended") return { status: "end" } as const;

        this.phase = "ended";

        const winnerSlot = connect4.other(slot) as Slot;
        return { status: "resign", winnerSlot } as const;
    }

    timeout(timedOutSlot: Slot): RoomEnd {
        this.phase = "ended";

        const winnerSlot = connect4.other(timedOutSlot) as Slot;
        return { status: "timeout", winnerSlot } as const;
    }

    voteRematch(socketId: string) {
        if (this.phase !== "ended") return { ok: false, code: "NOT_ENDED" } as const;
        if (this.getSlotOf(socketId) === null) return { ok: false, code: "NOT_IN_ROOM" } as const;

        this.rematchVotes.add(socketId);

        return { ok: true, ready: this.rematchVotes.size === 2 } as const;
    }

    rematch() {
        const nextTurn = connect4.other(this.game.getTurn());

        this.game = new connect4.Game(nextTurn);
        this.timers = [TIME_LIMIT, TIME_LIMIT];
        this.lastUpdatedMs = Date.now();
        this.rematchVotes.clear();
        this.phase = this.readyCount() === 2 ? "playing" : "lobby";
    }
}

export { GameRoom, type Slot, type RoomPhase, type RoomEnd };
