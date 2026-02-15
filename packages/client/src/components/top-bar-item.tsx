import { useEffect } from "react";

import type { Side } from "@/context/top-bar-context";
import { useTopBar } from "@/hooks/use-top-bar";

function TopBarItem({
  side = "left",
  id,
  order = 0,
  children,
}: React.PropsWithChildren<{
  side?: Side;
  id: string;
  order?: number;
}>) {
  const { register, unregister } = useTopBar();

  useEffect(() => {
    register(side, { id, node: children, order });
    return () => unregister(side, id);
  }, [register, unregister, side, id, order, children]);

  return null;
}

export { TopBarItem };
