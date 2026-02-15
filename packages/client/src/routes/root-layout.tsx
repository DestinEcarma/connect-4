import { Outlet } from "react-router-dom";

import { ThemeMenu } from "@/components/theme-menu";
import { TopBarItem } from "@/components/top-bar-item";

function RootLayout() {
  return (
    <>
      <TopBarItem side="right" id="theme-menu">
        <ThemeMenu />
      </TopBarItem>

      <Outlet />
    </>
  );
}

export default RootLayout;
