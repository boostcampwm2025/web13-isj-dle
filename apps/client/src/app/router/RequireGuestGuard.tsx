import { useEffect } from "react";
import { Navigate, Outlet } from "react-router-dom";

import { authApi, useAuthStore } from "@entities/auth";
import { ROUTE_PATHS } from "@shared/config";

const RequireGuestGuard = () => {
  const isLoading = useAuthStore((state) => state.isLoading);
  const isAuthenticated = useAuthStore((state) => !!state.authUser);
  const setAuthUser = useAuthStore((state) => state.setAuthUser);
  const setLoading = useAuthStore((state) => state.setLoading);

  useEffect(() => {
    let alive = true;

    (async () => {
      try {
        const authUserResponse = await authApi.getMe();
        if (!authUserResponse.user) throw new Error(`No user data: ${authUserResponse.error}`);

        if (!alive) return;
        setAuthUser(authUserResponse.user);
      } catch (error) {
        console.warn(error);
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
  if (isAuthenticated) return <Navigate to={ROUTE_PATHS.HOME} replace />;
  return <Outlet />;
};

export default RequireGuestGuard;
