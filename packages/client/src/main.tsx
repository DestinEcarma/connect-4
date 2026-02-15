import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { RouterProvider, createBrowserRouter } from "react-router-dom";

import { ThemeProvider } from "@/provider/theme-provider";
import { TopBarProvider } from "@/provider/top-bar-provider.tsx";

import "./index.css";
import Home from "./routes/home";
import Queue from "./routes/queue";
import Room from "./routes/room";
import RootLayout from "./routes/root-layout";

const router = createBrowserRouter([
  {
    path: "/",
    element: <RootLayout />,
    children: [
      { index: true, element: <Home /> },
      { path: "queue", element: <Queue /> },
      { path: "room/:id", element: <Room /> }
    ]
  }
]);

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ThemeProvider>
      <TopBarProvider>
        <RouterProvider router={router} />
      </TopBarProvider>
    </ThemeProvider>
  </StrictMode>
);
