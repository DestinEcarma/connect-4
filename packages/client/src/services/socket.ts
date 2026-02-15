import { io } from "socket.io-client";

const socket = io("/", {
    path: "/socket.io/",
    autoConnect: true,
    transports: ["websocket", "polling"],
    reconnectionAttempts: 5,
});

socket.on("connect_error", (err) => {
    console.error("Socket connect_error:", err);
});

socket.on("error", (err) => {
    console.error("Socket error:", err);
});

export { socket };
