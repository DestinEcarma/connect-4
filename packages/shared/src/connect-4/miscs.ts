enum Player {
    One,
    Two
}

enum GameStatus {
    Playing = "Playing",
    Won = "Won",
    Draw = "Draw"
}

enum MoveError {
    NotPlaying = "NotPlaying",
    OutOfRange = "OutOfRange",
    ColumnFull = "ColumnFull"
}

export { Player, GameStatus, MoveError };
