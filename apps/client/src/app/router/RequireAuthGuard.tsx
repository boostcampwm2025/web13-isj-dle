import { useEffect } from "react";
import { Navigate, Outlet } from "react-router-dom";

import { authApi, useAuthStore } from "@entities/auth";
import { ROUTE_PATHS } from "@shared/config";

const RequireAuthGuard = () => {
  const isLoading = useAuthStore((state) => state.isLoading);
  const isAuthenticated = useAuthStore((state) => !!state.authUser);
  const setAuthUser = useAuthStore((state) => state.setAuthUser);
  const setLoading = useAuthStore((state) => state.setLoading);

  useEffect(() => {
    let alive = true;

    (async () => {
      try {
        const response = await authApi.getMe();
        if (!response.ok) throw new Error("Failed to fetch user");

        const data = await response.json();
        if (!data.user) throw new Error("No user data" + JSON.stringify(data));

        if (!alive) return;
        setAuthUser(data.user);
      } catch (error) {
        console.error(error);
        setAuthUser(null);
      } finally {
        if (alive) setLoading(false);
      }
    })();

    return () => {
      alive = false;
    };
  }, [setAuthUser, setLoading]);

  if (isLoading) return <div>Loading...</div>;
  if (!isAuthenticated) return <Navigate to={ROUTE_PATHS.LOGIN} replace />;
  return <Outlet />;
};

export default RequireAuthGuard;
