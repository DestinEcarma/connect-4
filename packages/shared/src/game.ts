import { COLS, ROWS, STRIDE, ctzU64, getColMask, getWinningMask, toLocation } from "./bitboard";
import { GameStatus, Player } from "./miscs";

class Game {
    private lastMove?: { row: number; column: number };
    private winningMask?: bigint;

    private boards = [0n, 0n];
    private moveCount = 0;
    private status = GameStatus.Playing;
    private turn: Player;
    private winner?: Player;

    constructor(startingTurn?: Player) {
        this.turn = startingTurn ?? (Math.random() < 0.5 ? Player.One : Player.Two);
    }

    getLastMove() {
        return this.lastMove;
    }

    getWinningMask() {
        return this.winningMask;
    }

    getBoards() {
        return this.boards;
    }

    getStatus() {
        return this.status;
    }

    getTurn() {
        return this.turn;
    }

    getWinner() {
        return this.winner;
    }

    getState() {
        return {
            boards: this.boards,
            moveCount: this.moveCount,
            status: this.status,
            turn: this.turn,
            winner: this.winner
        };
    }

    mask() {
        return this.boards[Player.One] | this.boards[Player.Two];
    }

    forceWin(player: Player) {
        this.status = GameStatus.Won;
        this.winner = player;
    }

    makeMove(col: number): boolean {
        if (this.status !== GameStatus.Playing || col < 0 || col >= COLS) return false;

        const mask = this.mask();

        const bottomMask = 1n << BigInt(col * STRIDE);
        const bit = (mask + bottomMask) & getColMask(col);

        const sentinelRowBit = 1n << BigInt(col * STRIDE + ROWS);

        if (bit === 0n || (bit & sentinelRowBit) !== 0n) {
            return false;
        }

        this.boards[this.turn] |= bit;
        this.lastMove = toLocation(ctzU64(bit));
        this.moveCount++;

        const winningMask = getWinningMask(this.boards[this.turn]);

        if (winningMask !== 0n) {
            this.status = GameStatus.Won;
            this.winningMask = winningMask;
            this.winner = this.turn;
        } else if (this.moveCount === ROWS * COLS) {
            this.status = GameStatus.Draw;
        } else {
            this.turn = this.turn === Player.One ? Player.Two : Player.One;
        }

        return true;
    }
}

export { Game };
