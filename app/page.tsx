'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import ProtectedRoute from '@/lib/auth/protected-route';

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    router.push('/donor-queries');
  }, [router]);

  return (
    <ProtectedRoute>
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    </ProtectedRoute>
  );
}
