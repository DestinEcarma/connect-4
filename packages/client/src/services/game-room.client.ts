import { protocol } from "@connect-4/shared";

import { socket } from "./socket";

type Unsubscribe = () => void;

interface Handlers {
    onWait: (pyaload: protocol.WaitPayload) => void;
    onStart: (payload: protocol.StartPayload) => void;
    onRematch: () => void;

    onUpdate: (payload: protocol.UpdatePayload) => void;
    onOtherOnline: (online: boolean) => void;

    onEnd: (payload: protocol.EndPayload) => void;

    onExpire: (payload: protocol.ExpirePayload) => void;
    onUnauthorize: () => void;
    onCleanup: () => void;
}

const id = socket.id;

function join(roomId: string, token: string | null) {
    socket.emit("game:join", { roomId, token });
}

function leave(unmount = false) {
    if (unmount) {
        socket.emit("game:unmount");
    } else {
        socket.emit("game:leave");
    }
}

function move(column: number) {
    socket.emit("game:move", { column });
}

function rematch() {
    socket.emit("game:rematch");
}

function subscribe(handlers: Handlers): Unsubscribe {
    const onStart = (payload: protocol.StartInputPayload) => {
        const parsed = protocol.StartSchema.safeParse(payload);
        if (parsed.success) return handlers.onStart(parsed.data);
        console.error("Something went wrong while parsing StartPayload: ", parsed.error);
    };

    const onUpdate = (payload: protocol.UpdateInputPayload) => {
        const parsed = protocol.UpdateSchema.safeParse(payload);
        if (parsed.success) return handlers.onUpdate(parsed.data);
        console.error("Something went wrong while parsing UpdatePayload: ", parsed.error);
    };

    const onEnd = (payload: protocol.EndInputPayload) => {
        const parsed = protocol.EndSchema.safeParse(payload);
        if (parsed.success) return handlers.onEnd(parsed.data);
        console.error("Something went wrong while parsing EndSchema: ", parsed.error);
    };

    const onReconnect = () => handlers.onOtherOnline(true);
    const onDepart = () => handlers.onOtherOnline(false);

    socket.on("game:wait", handlers.onWait);
    socket.on("game:start", onStart);
    socket.on("game:rematch", handlers.onRematch);

    socket.on("game:update", onUpdate);

    socket.on("game:reconnect", onReconnect);
    socket.on("game:depart", onDepart);

    socket.on("game:end", onEnd);
    socket.on("game:leave", onEnd);
    socket.on("game:unauthorize", handlers.onUnauthorize);
    socket.on("game:expire", handlers.onExpire);
    socket.on("game:cleanup", handlers.onCleanup);

    return () => {
        socket.off("game:wait", handlers.onWait);
        socket.off("game:start", onStart);
        socket.off("game:rematch", handlers.onRematch);

        socket.off("game:update", onUpdate);

        socket.off("game:reconnect", onReconnect);
        socket.off("game:depart", onDepart);

        socket.off("game:end", onEnd);
        socket.off("game:leave", onEnd);
        socket.off("game:unauthorize", handlers.onUnauthorize);
        socket.off("game:expire", handlers.onExpire);
        socket.off("game:cleanup", handlers.onCleanup);
    };
}

export { id, join, leave, move, rematch, subscribe };
