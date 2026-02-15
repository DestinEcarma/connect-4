import { cloneElement, useCallback, useMemo, useRef, useState } from "react";

import { type Item, TopBarContext, type TopBarProviderState } from "@/context/top-bar-context";

function TopBarProvider({ children }: React.PropsWithChildren) {
  const [left, setLeft] = useState<Map<string, Item>>(() => new Map());
  const [center, setCenter] = useState<Map<string, Item>>(() => new Map());
  const [right, setRight] = useState<Map<string, Item>>(() => new Map());
  const seqRef = useRef(0);

  const register = useCallback<TopBarProviderState["register"]>((side, { id, node, order = 0 }) => {
    const setMap = side === "left" ? setLeft : side === "center" ? setCenter : setRight;

    setMap((prev) => {
      const next = new Map(prev);
      const existing = next.get(id);

      if (existing) {
        next.set(id, { ...existing, node, order });
      } else {
        next.set(id, { id, node, order, sequence: seqRef.current++ });
      }

      return next;
    });
  }, []);

  const unregister = useCallback<TopBarProviderState["unregister"]>((side, id) => {
    const setMap = side === "left" ? setLeft : side === "center" ? setCenter : setRight;

    setMap((prev) => {
      if (!prev.has(id)) return prev;

      const next = new Map(prev);
      next.delete(id);

      return next;
    });
  }, []);

  const value = useMemo(() => ({ register, unregister }), [register, unregister]);

  const renderSide = (map: Map<string, Item>) =>
    Array.from(map.values())
      .sort((a, b) => a.order - b.order || a.sequence - b.sequence)
      .map((item) => cloneElement(item.node as React.ReactElement, { key: item.id }));

  return (
    <TopBarContext.Provider value={value}>
      <div className="flex h-dvh flex-col">
        <header className="flex w-full items-center justify-between p-4">
          <div className="flex space-x-4">{renderSide(left)}</div>
          <div className="flex w-full justify-center space-x-4 px-4">{renderSide(center)}</div>
          <div className="flex space-x-4">{renderSide(right)}</div>
        </header>
        <div className="h-full">{children}</div>
      </div>
    </TopBarContext.Provider>
  );
}

export { TopBarProvider };
