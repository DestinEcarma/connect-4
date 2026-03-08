import { Player } from "./miscs";

function other(turn: Player) {
    return turn ^ 1;
}

export { other };
