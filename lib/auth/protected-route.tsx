'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from './auth-context';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireSuperAdmin?: boolean;
}

export default function ProtectedRoute({ 
  children, 
  requireSuperAdmin = false 
}: ProtectedRouteProps) {
  const { isAuthenticated, isLoading, isSuperAdmin } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading) {
      if (!isAuthenticated) {
        router.push('/login');
      } else if (requireSuperAdmin && !isSuperAdmin) {
        router.push('/'); // Redirect to home if not super admin
      }
    }
  }, [isAuthenticated, isLoading, isSuperAdmin, requireSuperAdmin, router]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null; // Will redirect in the useEffect
  }

  if (requireSuperAdmin && !isSuperAdmin) {
    return null; // Will redirect in the useEffect
  }

  return <>{children}</>;
} 