type EmitPort = {
    toRoom(roomId: string, event: string, payload?: unknown): void;
    toSocket(socketId: string, event: string, payload?: unknown): void;
    toOthers(roomId: string, socketId: string, event: string, payload?: unknown): void;
    socketLeave(socketId: string, roomId: string): void;
    socketsLeave(roomId: string): void;
    joinRoom(socketId: string, roomId: string): void;
};

export { type EmitPort };
