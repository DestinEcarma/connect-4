import { Player } from "./miscs";

const ROWS = 6;
const COLS = 7;
const STRIDE = ROWS + 1;

const DIRECTIONS = [1n, 7n, 8n, 6n];

const U64_MASK = (1n << 64n) - 1n;

function ctzU64(x: bigint) {
    x &= U64_MASK;
    if (x === 0n) return 64;

    let n = 0;

    if ((x & 0xffffffffn) === 0n) {
        n += 32;
        x >>= 32n;
    }

    while ((x & 1n) === 0n) {
        n++;
        x >>= 1n;
    }

    return n;
}

function fromLocation(row: number, col: number) {
    return BigInt(col * STRIDE + row);
}

function toLocation(lsb: number) {
    return { row: lsb % STRIDE, column: Math.floor(lsb / STRIDE) };
}

function getColMask(col: number) {
    return 0b111111n << BigInt(col * STRIDE);
}

function hasWon(board: bigint) {
    for (const shift of DIRECTIONS) {
        const m = board & (board >> shift);

        if ((m & (m >> (2n * shift))) !== 0n) {
            return true;
        }
    }

    return false;
}

function getWinningMask(board: bigint): bigint {
    let winningMask = 0n;

    for (const shift of DIRECTIONS) {
        const m = board & (board >> shift);
        const head = m & (m >> (2n * shift));

        if (head !== 0n) {
            winningMask |= head | (head << shift) | (head << (2n * shift)) | (head << (3n * shift));
        }
    }

    return winningMask;
}

function bitboardToGrid(player1: bigint, player2: bigint): (Player | null)[][] {
    const grid = Array.from({ length: ROWS }, () => Array(COLS).fill(null));

    for (let row = 0; row < ROWS; row++) {
        for (let col = 0; col < COLS; col++) {
            const bit = 1n << fromLocation(row, col);

            if ((player1 & bit) !== 0n) grid[ROWS - 1 - row][col] = Player.One;
            if ((player2 & bit) !== 0n) grid[ROWS - 1 - row][col] = Player.Two;
        }
    }

    return grid;
}

function printBitBoard(board: bigint) {
    let strBoard = "";

    for (let row = ROWS - 1; row >= 0; row--) {
        for (let col = 0; col < COLS; col++) {
            const bit = 1n << fromLocation(row, col);

            strBoard += `${(board & bit) !== 0n ? 1 : 0} `;
        }

        strBoard += "\n";
    }

    return strBoard;
}

export {
    ROWS,
    COLS,
    STRIDE,
    ctzU64,
    fromLocation,
    toLocation,
    getColMask,
    hasWon,
    getWinningMask,
    bitboardToGrid,
    printBitBoard
};
