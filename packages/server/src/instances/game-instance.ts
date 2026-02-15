import { Game, GameStatus, Player } from "@connect-4/shared";

const TIME_LIMIT = 240000;

class GameInstance {
    started = false;
    players: (string | null)[] = [null, null];
    readyPlayers = new Set<string>();
    rematchVotes = new Set<string>();

    rematchTimeout: NodeJS.Timeout | null = null;
    departureTimeout: NodeJS.Timeout | null = null;

    timers = [TIME_LIMIT, TIME_LIMIT];
    lastUpdated = Date.now();

    constructor(
        public roomId: string,
        public instance: Game,
        public tokens: [string, string]
    ) {}

    start() {
        this.started = true;
        this.lastUpdated = Date.now();
    }

    tick() {
        if (!this.started || this.instance.getStatus() !== GameStatus.Playing) return false;

        const now = Date.now();
        const elapsed = now - this.lastUpdated;

        const turn = this.instance.getTurn();
        this.timers[turn] = Math.max(0, this.timers[turn] - elapsed);
        this.lastUpdated = now;

        return this.timers[turn] === 0;
    }

    rematch() {
        this.instance = new Game(this.instance.getTurn() === Player.One ? Player.Two : Player.One);
        this.timers = [TIME_LIMIT, TIME_LIMIT];
        this.lastUpdated = Date.now();
        this.rematchVotes.clear();

        if (this.rematchTimeout) clearTimeout(this.rematchTimeout);
    }

    serialize_start() {
        return {
            roomId: this.roomId,
            timers: this.timers,
            players: this.players,
            activePlayerId: this.players[this.instance.getTurn()],
            boards: this.instance.getBoards().map((b) => b.toString()),
            lastMove: this.instance.getLastMove()
        };
    }

    serialize_win() {
        return {
            winner: this.players[this.instance.getWinner()!],
            winningMask: this.instance.getWinningMask()!.toString(),
            status: "win",
            reason: "Player won the game"
        };
    }

    serialize_draw() {
        return {
            status: "draw",
            reason: "Game ended in a draw"
        };
    }

    serialize_update() {
        return {
            activePlayerId: this.players[this.instance.getTurn()],
            boards: this.instance.getBoards().map((b) => b.toString()),
            lastMove: this.instance.getLastMove()
        };
    }

    serialize_resign(playerId: string) {
        return {
            winner: this.players.find((id) => id !== null && id !== playerId),
            status: "resign",
            reason: "Player disconnected"
        };
    }

    serialize_timeout() {
        return {
            winner: this.players[this.instance.getWinner()!],
            status: "timeout",
            reason: "Player ran out of time"
        };
    }

    serialize_end() {
        return {
            status: "end",
            reason: "Opponent left the lobby"
        };
    }
}

export { GameInstance };
