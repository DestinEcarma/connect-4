import { pino } from "pino";

const logger = pino({
    transport: {
        target: "pino-pretty",
        options: {
            colorize: true,
            translate: "HH:MM:ss Z",
            ignore: "pid,hostname"
        }
    },

    level: process.env.NODE_ENV === "production" ? "info" : "debug"
});

export { logger };
