// src/shared/components/auth/PrivateRoute.tsx

import React, { ReactNode, useEffect } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/auth/AuthContext";
import { PageLoader } from "@/shared/components/ui/PageLoader";

interface Props {
  children: ReactNode;
  adminRequired?: boolean;
  superAdminRequired?: boolean;
}

/**
 * PrivateRoute — Iron-wall route guard for all protected pages.
 *
 * Behaviors:
 * ─ While Firebase resolves initial auth state      → shows PageLoader (zero content flash)
 * ─ Unauthenticated → user route                   → saves intended URL, redirects to /auth/login
 * ─ Unauthenticated → admin/superadmin route        → saves intended URL, redirects to /admin/login
 * ─ Authenticated, no admin claim → admin route     → redirects to /dashboard
 * ─ Authenticated, correct role                     → renders children
 * ─ bfcache restore (browser Back after logout)     → re-checks auth, kicks out if session gone
 */
const PrivateRoute = ({
  children,
  adminRequired = false,
  superAdminRequired = false,
}: Props) => {
  const { user, isAdmin, isSuperAdmin, loading } = useAuth();
  const location = useLocation();

  // ── bfcache Guard ─────────────────────────────────────────────────────────
  // When users press Back after logout, the browser may restore the page from
  // the back-forward cache without re-running React. This listener detects
  // that case and forces a reload so the auth check runs again.
  useEffect(() => {
    const handlePageShow = (event: PageTransitionEvent) => {
      if (event.persisted) {
        // Page was restored from bfcache — re-validate by forcing a full check
        window.location.reload();
      }
    };
    window.addEventListener("pageshow", handlePageShow);
    return () => window.removeEventListener("pageshow", handlePageShow);
  }, []);

  // ── Wait for Firebase to resolve the initial auth session ─────────────────
  // This prevents a split-second render of protected content before auth is confirmed.
  if (loading) {
    return <PageLoader />;
  }

  // ── Not authenticated ─────────────────────────────────────────────────────
  if (!user) {
    // Save where the user intended to go so we can restore it after login
    const intendedPath = location.pathname + location.search;
    if (intendedPath !== "/" && intendedPath !== "/auth/login") {
      sessionStorage.setItem("auth_redirect", intendedPath);
    }

    if (adminRequired || superAdminRequired) {
      return <Navigate to="/admin/login" replace />;
    }
    return <Navigate to="/auth/login" replace />;
  }

  // ── Authenticated but insufficient privileges ─────────────────────────────
  if (superAdminRequired && !isSuperAdmin) {
    return <Navigate to="/dashboard" replace />;
  }
  if (adminRequired && !isAdmin) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
};

export default PrivateRoute;
