import { Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '../store/auth-store';
import { motion } from 'framer-motion';

export default function AuthLayout() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  // Redirect to dashboard if user is already logged in
  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="relative min-h-screen w-full flex items-center justify-center bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-purple-950/20 via-background to-background overflow-hidden p-4">
      {/* Premium blurred accent elements */}
      <div className="absolute top-1/4 left-1/4 -translate-x-1/2 -translate-y-1/2 w-[350px] h-[350px] rounded-full bg-purple-600/10 blur-[80px]" />
      <div className="absolute bottom-1/4 right-1/4 translate-x-1/2 translate-y-1/2 w-[400px] h-[400px] rounded-full bg-indigo-600/10 blur-[100px]" />

      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="w-full max-w-[440px] z-10"
      >
        <div className="glass p-8 rounded-2xl shadow-premium border border-border flex flex-col">
          <div className="flex items-center gap-2 mb-8 justify-center">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-purple-600 to-indigo-600 flex items-center justify-center shadow-premium-glow">
              <span className="text-white font-bold text-sm">C</span>
            </div>
            <span className="text-xl font-bold tracking-tight text-white">CollabMatrix</span>
          </div>
          
          <Outlet />
        </div>
      </motion.div>
    </div>
  );
}
