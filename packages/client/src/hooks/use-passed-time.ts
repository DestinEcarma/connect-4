import { useEffect, useState } from "react";

function usePassedTime(targetTime?: number) {
    const [passed, setPassed] = useState(() => targetTime !== undefined && Date.now() >= targetTime);

    useEffect(() => {
        if (targetTime === undefined) return;
        const timeout = window.setTimeout(() => setPassed(true), Math.max(targetTime - Date.now(), 0));
        return () => window.clearTimeout(timeout);
    }, [targetTime]);

    return passed;
}

export { usePassedTime };
