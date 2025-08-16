import { createBrowserRouter } from "react-router-dom";
import App from "./App";
import { LandingPage } from "./components/LandingPage";
import { RoomPage } from "./components/RoomPage";
import NotFound from "./components/NotFound";

const router = createBrowserRouter([
  {
    path: "/",
    element: <App />,
    errorElement: <NotFound />,
    children: [
      {
        index: true,
        element: <LandingPage />,
      },
      {
        path: "room/:roomId",
        element: <RoomPage />,
      },
    ],
  },
]);

export default router;
