import { COLS, ROWS, STRIDE, ctzU64, getColMask, getWinningMask, hasWon, toLocation } from "./bitboard";
import { GameStatus, MoveError, Player } from "./miscs";
import { other } from "./utils";

type MoveResult =
    | {
          ok: true;
          status: GameStatus;
          lastMove: { readonly row: number; readonly column: number };
          winner?: Player;
          winningMask?: bigint;
      }
    | { ok: false; error: MoveError };

class Game {
    private lastMove?: { row: number; column: number };

    private boards = [0n, 0n];
    private status = GameStatus.Playing;
    private turn: Player;
    private winner?: Player;
    private winningMask?: bigint;

    private moveCount = 0;

    constructor(startingTurn?: Player) {
        this.turn = startingTurn ?? Math.round(Math.random());
    }

    getLastMove() {
        return this.lastMove ? ({ column: this.lastMove.column, row: this.lastMove.row } as const) : undefined;
    }

    getWinningMask() {
        return this.winningMask;
    }

    getBoards() {
        return [this.boards[Player.One], this.boards[Player.Two]] as const;
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
            boards: this.getBoards(),
            status: this.status,
            turn: this.turn,
            winner: this.winner
        } as const;
    }

    forceWin(player: Player) {
        this.status = GameStatus.Won;
        this.winner = player;
    }

    makeMove(col: number): MoveResult {
        if (this.status !== GameStatus.Playing) return { ok: false, error: MoveError.NotPlaying };
        if (col < 0 || col >= COLS) return { ok: false, error: MoveError.OutOfRange };

        const mask = this.occupied();

        const bottomMask = 1n << BigInt(col * STRIDE);
        const bit = (mask + bottomMask) & getColMask(col);

        const sentinelRowBit = 1n << BigInt(col * STRIDE + ROWS);

        if (bit === 0n || (bit & sentinelRowBit) !== 0n) return { ok: false, error: MoveError.ColumnFull };

        this.boards[this.turn] |= bit;
        this.lastMove = toLocation(ctzU64(bit));
        this.moveCount++;

        if (hasWon(this.boards[this.turn])) {
            this.status = GameStatus.Won;
            this.winningMask = getWinningMask(this.boards[this.turn]);
            this.winner = this.turn;
        } else if (this.moveCount === ROWS * COLS) {
            this.status = GameStatus.Draw;
        } else {
            this.turn = other(this.turn);
        }

        return {
            ok: true,
            status: this.status,
            lastMove: this.getLastMove()!,
            winner: this.winner,
            winningMask: this.winningMask
        };
    }

    private occupied() {
        return this.boards[Player.One] | this.boards[Player.Two];
    }
}

export { Game };
