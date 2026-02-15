import { createContext } from "react";

type Side = "left" | "center" | "right";

interface Item {
    id: string;
    node: React.ReactNode;
    order: number;
    sequence: number;
}

interface TopBarProviderState {
    register: (side: Side, item: Omit<Item, "sequence">) => void;
    unregister: (side: Side, id: string) => void;
}

const TopBarContext = createContext<TopBarProviderState | null>(null);

export { TopBarContext, type TopBarProviderState, type Item, type Side };
