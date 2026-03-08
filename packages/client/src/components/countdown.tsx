import { useEffect, useState } from "react";

import { formatDurationMs } from "@/lib/utils";

function Countdown({
  timeMs,
  relativeTime,
  start = true,
  format = "ss"
}: {
  timeMs: number;
  relativeTime: number;
  start?: boolean;
  format?: string;
}) {
  const [time, setTime] = useState(timeMs);

  useEffect(() => {
    if (!start) return;

    const interval = window.setInterval(() => {
      const elapsed = Date.now() - relativeTime;
      const remaining = Math.max(0, timeMs - elapsed);

      setTime(remaining);

      if (remaining <= 0) {
        window.clearInterval(interval);
      }
    }, 250);

    return () => window.clearInterval(interval);
  }, [start, timeMs, relativeTime]);

  return <>{formatDurationMs(time, format)}</>;
}

export { Countdown };
