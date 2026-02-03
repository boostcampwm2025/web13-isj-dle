import { useEffect } from "react";
import { Navigate, Outlet } from "react-router-dom";

import { authApi, useAuthStore } from "@entities/auth";
import { ROUTE_PATHS } from "@shared/config";

const RequireGuestGuard = () => {
  const { setAuthUser, setLoading, isLoading, isAuthenticated } = useAuthStore();

  useEffect(() => {
    let alive = true;

    (async () => {
      try {
        const user = await authApi.getMe();
        if (!alive) return;
        setAuthUser(user);
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
