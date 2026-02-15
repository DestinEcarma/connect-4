import { useContext } from "react";

import { TopBarContext } from "@/context/top-bar-context";

function useTopBar() {
    const context = useContext(TopBarContext);

    if (context == undefined) throw new Error("useTopBar must be used within a TopBarProvider");

    return context;
}

export { useTopBar };
