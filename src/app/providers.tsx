"use client";

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'sonner';
import { useEffect, useState } from 'react';
import { useAuthStore } from '@/stores/authStore';
import { authAPI } from '@/api/auth';
import { useRouter, usePathname } from 'next/navigation';
import { ThemeProvider } from '@/components/theme-provider';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,
      gcTime: 1000 * 60 * 10,
      retry: 1,
    },
  },
});

export function Providers({ children }: { children: React.ReactNode }) {
  const setUser = useAuthStore((state) => state.setUser);
  const setIsLoading = useAuthStore((state) => state.setIsLoading);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const isLoading = useAuthStore((state) => state.isLoading);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const checkAuth = async () => {
      // Note: we can use token from cookies in SSR, but for compatibility we check API directly
      setIsLoading(true);
      try {
        const response = await authAPI.getMe();
        setUser(response.user);
      } catch (error) {
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, [setUser, setIsLoading]);

  useEffect(() => {
    if (!isLoading) {
      if (isAuthenticated && (pathname === '/' || pathname === '/login' || pathname === '/register')) {
        router.push('/home');
      } else if (!isAuthenticated && pathname !== '/' && pathname !== '/login' && pathname !== '/register') {
        router.push('/');
      }
    }
  }, [isLoading, isAuthenticated, pathname, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900 transition-colors duration-300">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary-600 dark:border-primary-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-600 dark:text-slate-400">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="system" storageKey="vite-ui-theme">
        {children}
        <Toaster richColors position="bottom-center" />
      </ThemeProvider>
    </QueryClientProvider>
  );
}
