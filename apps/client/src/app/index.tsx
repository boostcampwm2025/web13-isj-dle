import Providers from "./providers";
import RequireAuthGuard from "./router/RequireAuthGuard";
import RequireGuestGuard from "./router/RequireGuestGuard";
import "./styles/index.css";

import { Navigate, RouterProvider, createBrowserRouter } from "react-router-dom";

import { HomePage } from "@pages/home";
import { LoginPage } from "@pages/login";
import { ROUTE_PATHS } from "@shared/config";
import { Toast } from "@shared/ui";

const App = () => {
  const router = createBrowserRouter([
    {
      element: <RequireGuestGuard />,
      children: [{ path: ROUTE_PATHS.LOGIN, element: <LoginPage /> }],
    },
    {
      element: <RequireAuthGuard />,
      children: [{ path: ROUTE_PATHS.HOME, element: <HomePage /> }],
    },
    { path: "*", element: <Navigate to={ROUTE_PATHS.LOGIN} replace /> },
  ]);

  return (
    <Providers>
      <Toast />
      <RouterProvider router={router} />
    </Providers>
  );
};

export default App;
