import { GameRoom } from "../domain/game-room";

class GameRoomRepo {
    private gameRoomsByRoomId = new Map<string, GameRoom>();
    private roomIdBySocketId = new Map<string, string>();

    has(roomId: string) {
        return this.gameRoomsByRoomId.has(roomId);
    }

    getActiveGames() {
        // NOTE:
        // * Doing it this way because DCISM's node version does not use ES6 or later,
        // * or am I missing something
        return Array.from(this.gameRoomsByRoomId.values()).filter((room) => room.phase === "playing");
    }

    getByRoomId(roomId: string): GameRoom | null {
        return this.gameRoomsByRoomId.get(roomId) ?? null;
    }

    getBySocketId(socketId: string): GameRoom | null {
        const roomId = this.roomIdBySocketId.get(socketId);
        return roomId ? this.getByRoomId(roomId) : null;
    }

    createRoom(roomId: string, tokens: [string, string]): GameRoom {
        const room = new GameRoom(roomId, tokens);
        this.gameRoomsByRoomId.set(roomId, room);
        return room;
    }

    claimSlot(roomId: string, token: string, socketId: string) {
        const room = this.getByRoomId(roomId);
        if (!room) return null;

        const slot = room.claimSlot(socketId, token);
        if (slot === null) return null;

        this.roomIdBySocketId.set(socketId, roomId);

        return room;
    }

    claimAnyOpenSlot(roomId: string, socketId: string) {
        const room = this.getByRoomId(roomId);
        if (!room) return null;

        const slot = room.claimAnyOpenSlot(socketId);
        if (slot === null) return null;

        this.roomIdBySocketId.set(socketId, roomId);

        return room;
    }

    removeSocket(socketId: string) {
        const roomId = this.roomIdBySocketId.get(socketId);
        if (!roomId) return null;

        const room = this.getByRoomId(roomId);

        if (!room) {
            this.roomIdBySocketId.delete(socketId);
            return null;
        }

        room.removePlayer(socketId);
        this.roomIdBySocketId.delete(socketId);

        return room;
    }

    removeGameRoom(roomId: string) {
        return this.gameRoomsByRoomId.delete(roomId);
    }
}

export { GameRoomRepo };
