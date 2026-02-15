import express from "express";
import { createServer } from "http";

import { logger } from "./lib/logger";
import { gameManager } from "./managers/game-manager";
import { matchmakingManager } from "./managers/matchmaking-manager";
import { initSocket } from "./socket";

const PORT = process.env.PORT || 3000;

const app = express();

const httpServer = createServer(app);
const io = initSocket(httpServer);

app.get("/health", (_, res) => res.status(200).send("OK"));

if (process.env.NODE_ENV !== "production") {
    app.get("/api/in-queue", (_, res) => res.status(200).send(matchmakingManager.getInQueue()));
    app.get("/api/active-games", (_, res) => res.status(200).send(gameManager.getActiveRoomIds()));
    app.get("/api/sockets-to-room-id", (_, res) => res.status(200).send(gameManager.getSocketsToRoomId()));
}

const server = httpServer.listen(PORT, () => {
    logger.info(`Server running at http://localhost:${PORT}`);
});

process.on("SIGTERM", () => {
    logger.info("SIGTERM signal received: closing HTTP server");

    io.close(() => {
        server.close(() => {
            logger.info("HTTP server closed");
            process.exit(0);
        });
    });
});

process.on("uncaughtException", (err) => {
    logger.error({ err }, "Uncaught exception");
    process.exit(1);
});

process.on("unhandledRejection", (reason) => {
    logger.error({ reason }, "Unhandled promise rejection");
});
