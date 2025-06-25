'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from './AuthContext';
import { Loader2 } from 'lucide-react';

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
  redirectTo 
}) => {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      if (requireAuth && !user) {
        // User is not authenticated but auth is required
        router.replace(redirectTo || '/login');
        return;
      }
      
      if (!requireAuth && user) {
        // User is authenticated but trying to access public route (login/register)
        router.replace('/dashboard');
        return;
      }
    }
  }, [user, loading, requireAuth, router, redirectTo]);

  // Show loading spinner while checking authentication
  if (loading) {
    return <LoadingSpinner />;
  }

  // Render content based on auth requirements
  if (requireAuth && !user) {
    return <LoadingSpinner />; // Will redirect, but show loading meanwhile
  }
  
  if (!requireAuth && user) {
    return <LoadingSpinner />; // Will redirect, but show loading meanwhile
  }

  return <>{children}</>;
};

// Higher-order component for protecting pages
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

  AuthenticatedComponent.displayName = `withAuth(${WrappedComponent.displayName || WrappedComponent.name})`;
  
  return AuthenticatedComponent;
};