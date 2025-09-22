"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "./AuthContext";
import { Loader2 } from "lucide-react";

interface AuthGuardProps {
  children: React.ReactNode;
  requireAuth?: boolean;
  redirectTo?: string;
}

const LoadingSpinner = () => (
  <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
    <div className="text-center">
      <Loader2 className="w-12 h-12 animate-spin text-purple-400 mx-auto mb-4" />
      <p className="text-white text-lg">Loading...</p>
    </div>
  </div>
);

export const AuthGuard: React.FC<AuthGuardProps> = ({
  children,
  requireAuth = true,
  redirectTo,
}) => {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [hasRedirected, setHasRedirected] = useState(false);

  useEffect(() => {
    const checkAuthWithDelay = setTimeout(() => {
      if (!loading && !hasRedirected) {
        if (requireAuth && !user) {
          console.log("AuthGuard: Redirecting to login - no user");
          setHasRedirected(true);
          router.replace(redirectTo || "/login");
          return;
        }
      }
    }, 100); // 100ms delay

    return () => clearTimeout(checkAuthWithDelay);
  }, [user, loading, requireAuth, router, redirectTo, hasRedirected]);

  if (loading || hasRedirected) {
    return <LoadingSpinner />;
  }

  if (requireAuth && !user) {
    return <LoadingSpinner />;
  }

  return <>{children}</>;
};

export const withAuth = <P extends object>(
  WrappedComponent: React.ComponentType<P>,
  options: { requireAuth?: boolean; redirectTo?: string } = {}
) => {
  const { requireAuth = true, redirectTo } = options;

  const AuthenticatedComponent = (props: P) => {
    return (
      <AuthGuard requireAuth={requireAuth} redirectTo={redirectTo}>
        <WrappedComponent {...props} />
      </AuthGuard>
    );
  };

  AuthenticatedComponent.displayName = `withAuth(${
    WrappedComponent.displayName || WrappedComponent.name
  })`;

  return AuthenticatedComponent;
};
