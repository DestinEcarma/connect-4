import { useEffect, useEffectEvent, useState } from "react";

function usePassedTime(targetTime?: number) {
    const [passed, setPassed] = useState(() => targetTime !== undefined && Date.now() >= targetTime);
    const setPassedEvent = useEffectEvent((value: boolean) => setPassed(value));

    useEffect(() => {
        if (targetTime === undefined) {
            setPassedEvent(false);
            return;
        }

        const timeout = window.setTimeout(() => setPassedEvent(true), Math.max(targetTime - Date.now(), 0));
        return () => window.clearTimeout(timeout);
    }, [targetTime]);

    return passed;
}

export { usePassedTime };
