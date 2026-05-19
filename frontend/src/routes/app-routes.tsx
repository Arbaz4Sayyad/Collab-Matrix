import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import AuthLayout from '../layouts/auth-layout';
import DashboardLayout from '../layouts/dashboard-layout';
import LoginPage from '../pages/login-page';
import RegisterPage from '../pages/register-page';
import DashboardPage from '../pages/dashboard-page';
import LandingPage from '../pages/landing-page';

// Lazy load feature components to optimize bundles
const TasksPage = lazy(() => import('../pages/placeholder-tasks'));
const ChatPage = lazy(() => import('../pages/placeholder-chat'));
const DocsPage = lazy(() => import('../pages/placeholder-docs'));
const NotificationsPage = lazy(() => import('../pages/placeholder-notifications'));
const ProfilePage = lazy(() => import('../pages/placeholder-profile'));

const PageLoaderSkeleton = () => (
  <div className="w-full h-full min-h-[85vh] flex flex-col p-8 space-y-6 animate-pulse font-sans">
    
    {/* Title Header Shimmer */}
    <div className="flex justify-between items-center pb-4 border-b border-border/30">
      <div className="space-y-2.5">
        <div className="h-7 w-56 bg-zinc-800/60 rounded-lg border border-border/10 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-zinc-700/25 to-transparent -translate-x-full animate-[shimmer_1.5s_infinite]" />
        </div>
        <div className="h-3.5 w-72 bg-zinc-800/40 rounded border border-border/5 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-zinc-700/20 to-transparent -translate-x-full animate-[shimmer_1.5s_infinite]" />
        </div>
      </div>
      <div className="h-9 w-32 bg-zinc-850 rounded-lg border border-border/20 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-zinc-700/30 to-transparent -translate-x-full animate-[shimmer_1.5s_infinite]" />
      </div>
    </div>

    {/* Metric Grid Shimmer */}
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="glass-card h-28 rounded-xl border border-border/40 relative overflow-hidden flex flex-col p-4 justify-between bg-zinc-950/5">
          <div className="h-3 w-16 bg-zinc-800/50 rounded" />
          <div className="h-6 w-24 bg-zinc-800/70 rounded-lg" />
          <div className="h-2.5 w-32 bg-zinc-800/40 rounded" />
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-zinc-700/10 to-transparent -translate-x-full animate-[shimmer_1.8s_infinite]" />
        </div>
      ))}
    </div>

    {/* Content Canvas Shimmer */}
    <div className="glass-card flex-1 min-h-[350px] rounded-xl border border-border/50 relative overflow-hidden p-6 space-y-4 bg-zinc-950/5">
      <div className="h-4 w-40 bg-zinc-800/60 rounded" />
      <div className="space-y-2.5 pt-2">
        <div className="h-3 w-full bg-zinc-850 rounded" />
        <div className="h-3 w-[95%] bg-zinc-850 rounded" />
        <div className="h-3 w-[88%] bg-zinc-850 rounded" />
        <div className="h-3 w-[92%] bg-zinc-850 rounded" />
      </div>
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-zinc-750/10 to-transparent -translate-x-full animate-[shimmer_2s_infinite]" />
    </div>

  </div>
);

export default function AppRoutes() {
  console.log('[AppRoutes] Rendering AppRoutes...');
  return (
    <BrowserRouter>
      <Routes>
        
        {/* --- Public Landing Page --- */}
        <Route path="/" element={<LandingPage />} />
        
        {/* --- Public Auth Flow --- */}
        <Route element={<AuthLayout />}>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
        </Route>

        {/* --- Protected Dashboard Flow --- */}
        <Route element={<DashboardLayout />}>
          <Route path="/dashboard" element={<DashboardPage />} />
          
          <Route 
            path="/tasks" 
            element={
              <Suspense fallback={<PageLoaderSkeleton />}>
                <TasksPage />
              </Suspense>
            } 
          />
          <Route 
            path="/chat" 
            element={
              <Suspense fallback={<PageLoaderSkeleton />}>
                <ChatPage />
              </Suspense>
            } 
          />
          <Route 
            path="/docs" 
            element={
              <Suspense fallback={<PageLoaderSkeleton />}>
                <DocsPage />
              </Suspense>
            } 
          />
          <Route 
            path="/notifications" 
            element={
              <Suspense fallback={<PageLoaderSkeleton />}>
                <NotificationsPage />
              </Suspense>
            } 
          />
          <Route 
            path="/profile" 
            element={
              <Suspense fallback={<PageLoaderSkeleton />}>
                <ProfilePage />
              </Suspense>
            } 
          />
        </Route>

        {/* Catch-All Fallback Redirect */}
        <Route path="*" element={<Navigate to="/dashboard" replace />} />

      </Routes>
    </BrowserRouter>
  );
}
