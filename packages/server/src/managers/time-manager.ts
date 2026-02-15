import { Player } from "@connect-4/shared";

import { GameInstance } from "../instances/game-instance";
import { logger } from "../lib/logger";
import { gameManager } from "./game-manager";

class TimeManager {
    onTimeout?: (game: GameInstance) => void;
    onTick?: (game: GameInstance) => void;

    private interval: NodeJS.Timeout | null = null;

    poke() {
        if (this.interval) return;

        logger.debug("Starting global time drainer.");
        this.interval = setInterval(() => this.tick(), 1000);
    }

    private tick() {
        const games = gameManager.getActiveGames();

        if (games.length === 0) {
            logger.debug("No active games. Stopping global time drainer");

            if (this.interval) clearInterval(this.interval);
            this.interval = null;

            return;
        }

        for (const game of games) {
            if (game.tick()) {
                game.instance.forceWin(game.instance.getTurn() === Player.One ? Player.Two : Player.One);
                this.onTimeout?.(game);
            } else {
                this.onTick?.(game);
            }
        }
    }
}

const timeManager = new TimeManager();

export { timeManager };
