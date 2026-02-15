import { nanoid } from "nanoid";

import { Game, GameStatus } from "@connect-4/shared";

import { GameInstance } from "../instances/game-instance";
import { logger } from "../lib/logger";

const ID_LENGTH = 7;
const RESERVATION_EXPIRY = 30000;

class GameManager {
    onReservationExpired?: (roomId: string) => void;

    private roomIdsToGame = new Map<string, GameInstance>();
    private socketsToRoomId = new Map<string, string>();
    private reservedRoomIdsToTimout = new Map<string, NodeJS.Timeout>();

    getActiveRoomIds() {
        return Array.from(this.roomIdsToGame.keys());
    }

    getActiveGames() {
        return Array.from(
            this.roomIdsToGame
                .values()
                .filter((game) => game.started && game.instance.getStatus() === GameStatus.Playing),
        );
    }

    getSocketsToRoomId() {
        const raw = new Map<string, string[]>();

        for (const [socketId, roomId] of this.socketsToRoomId) {
            raw.set(roomId, raw.get(roomId) || []);
            raw.get(roomId)?.push(socketId);
        }

        return Array.from(raw);
    }

    generateId() {
        let id: string;

        do {
            id = nanoid(ID_LENGTH);
        } while (this.roomIdsToGame.has(id));

        return id;
    }

    reserveGame(roomId: string, tokens: [string, string]) {
        const game = new GameInstance(roomId, new Game(), tokens);

        this.roomIdsToGame.set(roomId, game);

        this.reservedRoomIdsToTimout.set(
            roomId,
            setTimeout(() => {
                const game = this.roomIdsToGame.get(roomId);
                if (!game) return logger.debug(`Game not found. roomId=${roomId}`);

                if (game.readyPlayers.size < 2) {
                    logger.warn(`Reservation expired, roomId=${roomId}, readyPlayersSize=${game.readyPlayers.size}`);

                    this.onReservationExpired?.(roomId);
                    this.removeGame(roomId);
                }

                this.reservedRoomIdsToTimout.delete(roomId);
            }, RESERVATION_EXPIRY),
        );

        return game;
    }

    claimSlot(roomId: string, token: string, socketId: string) {
        const game = this.roomIdsToGame.get(roomId);
        if (!game) return null;

        const playerIdx = game.tokens.indexOf(token);
        if (playerIdx === -1) return null;

        const oldSocketId = game.players[playerIdx];
        if (oldSocketId && oldSocketId !== socketId) {
            game.readyPlayers.delete(oldSocketId);
            this.socketsToRoomId.delete(oldSocketId);
        }

        game.players[playerIdx] = socketId;
        game.readyPlayers.add(socketId);
        this.socketsToRoomId.set(socketId, roomId);

        return game;
    }

    getGameByRoomId(roomId: string) {
        return this.roomIdsToGame.get(roomId);
    }

    getGameBySocketId(socketId: string) {
        const roomId = this.socketsToRoomId.get(socketId);
        return roomId ? this.roomIdsToGame.get(roomId) : undefined;
    }

    removeGame(roomId: string) {
        const game = this.roomIdsToGame.get(roomId);
        if (!game) return false;

        const reservationTimeout = this.reservedRoomIdsToTimout.get(roomId);

        if (reservationTimeout) clearTimeout(reservationTimeout);
        if (game.rematchTimeout) clearTimeout(game.rematchTimeout);
        if (game.departureTimeout) clearTimeout(game.departureTimeout);

        for (const pid of game.players) if (pid) this.socketsToRoomId.delete(pid);
        this.roomIdsToGame.delete(roomId);

        return true;
    }

    removeSocketFromRoomId(socketId: string) {
        const roomId = this.socketsToRoomId.get(socketId);
        if (!roomId) return null;

        const game = this.roomIdsToGame.get(roomId);
        if (!game) return null;

        const playerIdx = game.players.indexOf(socketId);
        if (playerIdx === -1) return null;

        game.players[playerIdx] = null;
        game.readyPlayers.delete(socketId);

        this.socketsToRoomId.delete(socketId);

        return game;
    }

    removeReservationFromTimout(roomId: string) {
        const timeout = this.reservedRoomIdsToTimout.get(roomId);
        if (!timeout) return false;

        clearTimeout(timeout);
        this.reservedRoomIdsToTimout.delete(roomId);

        return true;
    }
}

const gameManager = new GameManager();

export { gameManager };
