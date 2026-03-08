import express from "express";
import { createServer } from "http";
import path from "path";
import { fileURLToPath } from "url";

import { logger } from "./lib/logger";
import { initSocket } from "./socket";

const PORT = process.env.PORT || 3000;

const app = express();

const httpServer = createServer(app);
const io = initSocket(httpServer);

const clientRoot = path.join(path.dirname(fileURLToPath(import.meta.url)), "../public");

app.use(express.static(clientRoot));
app.get("/health", (_, res) => res.status(200).send("OK"));

if (process.env.NODE_ENV !== "production") {
    // TODO: add raw data for debug, checking for memory leaks
}

app.get(/.*/, (_, res) => res.sendFile(path.join(clientRoot, "index.html")));

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
