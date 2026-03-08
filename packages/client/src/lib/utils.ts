import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

function pad(value: number, length = 2) {
    return String(value).padStart(length, "0");
}

function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

function formatDurationMs(ms: number, format = "mm:ss") {
    const safeMs = Math.max(0, ms);

    const hours = Math.floor(safeMs / 3_600_000);
    const minutes = Math.floor((safeMs % 3_600_000) / 60_000);
    const seconds = Math.floor((safeMs % 60_000) / 1_000);
    const milliseconds = safeMs % 1_000;

    return format
        .replace(/HH/g, pad(hours))
        .replace(/mm/g, pad(minutes))
        .replace(/ss/g, pad(seconds))
        .replace(/SSS/g, pad(milliseconds, 3));
}

export { cn, formatDurationMs };
