import { useEffect, useState } from 'react';
import { Navigate, Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/auth-store';
import { wsManager, useWebSocketStore } from '../websocket/websocket-manager';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  LayoutDashboard, 
  Columns, 
  MessageSquare, 
  FileText, 
  Bell, 
  LogOut, 
  Menu, 
  X, 
  Wifi, 
  WifiOff, 
  ChevronDown,
  User,
  Users
} from 'lucide-react';
import NotificationTray from '../features/notifications/components/notification-tray';

export default function DashboardLayout() {
  const { user, token, logout, isAuthenticated } = useAuthStore();
  const isWsConnected = useWebSocketStore((state) => state.isConnected);
  const navigate = useNavigate();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isUserDropdownOpen, setIsUserDropdownOpen] = useState(false);
  const [isNotificationTrayOpen, setIsNotificationTrayOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  const workspaces = [
    { id: '1', name: 'Google Collaboration Core', tier: 'Free Tier', initial: 'G', color: 'from-purple-600 to-indigo-600' },
    { id: '2', name: 'CollabMatrix HQ', tier: 'Enterprise Plan', initial: 'C', color: 'from-fuchsia-600 to-pink-600' },
    { id: '3', name: 'Personal Sandbox', tier: 'Developer Free', initial: 'P', color: 'from-emerald-600 to-teal-600' },
  ];

  const [activeWorkspace, setActiveWorkspace] = useState(workspaces[0]);
  const [isWorkspaceDropdownOpen, setIsWorkspaceDropdownOpen] = useState(false);

  // Establish WebSocket session on mount, clear on unmount
  useEffect(() => {
    if (isAuthenticated && token) {
      wsManager.connect(token).catch((err) => {
        console.error('[WebSocket] Init failed:', err);
      });

      return () => {
        wsManager.disconnect();
      };
    }
  }, [isAuthenticated, token]);

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navItems = [
    { to: '/dashboard', label: 'Overview', icon: LayoutDashboard },
    { to: '/tasks', label: 'Kanban Board', icon: Columns },
    { to: '/chat', label: 'Slack Chat', icon: MessageSquare },
    { to: '/docs', label: 'Notion Docs', icon: FileText },
    { to: '/notifications', label: 'Alerts', icon: Bell },
  ];

  return (
    <div className="min-h-screen w-full bg-background text-foreground flex overflow-hidden font-sans">
      
      {/* --- SIDEBAR --- */}
      <aside 
        className={`fixed md:relative z-30 h-full w-[260px] bg-card border-r border-border flex flex-col transition-transform duration-300 md:transform-none ${
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Workspace Selector Dropdown */}
        <div className="relative">
          <div 
            onClick={() => setIsWorkspaceDropdownOpen(!isWorkspaceDropdownOpen)}
            className="p-4 border-b border-border flex items-center justify-between cursor-pointer hover:bg-zinc-800/20 transition-colors select-none"
          >
            <div className="flex items-center gap-2 overflow-hidden">
              <div className={`w-7 h-7 rounded bg-gradient-to-tr ${activeWorkspace.color} flex items-center justify-center shrink-0 shadow-sm`}>
                <span className="text-white text-xs font-extrabold font-sans">{activeWorkspace.initial}</span>
              </div>
              <div className="flex flex-col text-left overflow-hidden">
                <span className="text-sm font-semibold text-white truncate">{activeWorkspace.name}</span>
                <span className="text-[10px] text-zinc-500 font-medium">{activeWorkspace.tier}</span>
              </div>
            </div>
            <ChevronDown className={`w-4 h-4 text-zinc-400 shrink-0 transition-transform duration-200 ${isWorkspaceDropdownOpen ? 'rotate-180' : ''}`} />
          </div>

          <AnimatePresence>
            {isWorkspaceDropdownOpen && (
              <>
                <div 
                  className="fixed inset-0 z-40"
                  onClick={() => setIsWorkspaceDropdownOpen(false)}
                />
                <motion.div 
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.15 }}
                  className="absolute left-4 right-4 top-16 z-50 bg-card border border-border rounded-xl shadow-premium p-1.5 flex flex-col space-y-0.5"
                >
                  <div className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest px-2.5 py-1.5">
                    Switch Workspace
                  </div>
                  {workspaces.map((ws) => (
                    <button
                      key={ws.id}
                      onClick={() => {
                        setActiveWorkspace(ws);
                        setIsWorkspaceDropdownOpen(false);
                      }}
                      className={`flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-sm transition-all text-left w-full ${
                        activeWorkspace.id === ws.id
                          ? 'bg-purple-600/10 text-primary border border-purple-500/10 font-medium'
                          : 'text-zinc-300 hover:bg-zinc-800/60 hover:text-white border border-transparent'
                      }`}
                    >
                      <div className={`w-6 h-6 rounded bg-gradient-to-tr ${ws.color} flex items-center justify-center shrink-0`}>
                        <span className="text-white text-[10px] font-black">{ws.initial}</span>
                      </div>
                      <div className="flex flex-col overflow-hidden">
                        <span className="text-xs font-semibold text-white truncate">{ws.name}</span>
                        <span className="text-[8px] text-zinc-500 font-medium">{ws.tier}</span>
                      </div>
                    </button>
                  ))}
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 p-4 space-y-1.5 overflow-y-auto">
          <div className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider px-3 mb-2">
            Workspace
          </div>
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                  isActive 
                    ? 'bg-purple-600/10 text-primary border border-purple-500/20' 
                    : 'text-zinc-400 hover:text-white hover:bg-zinc-800/40 border border-transparent'
                }`
              }
            >
              <item.icon className="w-4 h-4 shrink-0" />
              {item.label}
            </NavLink>
          ))}
        </nav>

        {/* User Banner Bottom */}
        <div className="p-4 border-t border-border flex items-center justify-between bg-zinc-950/20 relative">
          <div 
            className="flex items-center gap-2.5 cursor-pointer overflow-hidden max-w-[80%]"
            onClick={() => setIsUserDropdownOpen(!isUserDropdownOpen)}
          >
            <div className="w-8 h-8 rounded-full bg-zinc-800 border border-border flex items-center justify-center text-white shrink-0 font-medium">
              {user?.username?.substring(0, 2).toUpperCase()}
            </div>
            <div className="flex flex-col text-left overflow-hidden">
              <span className="text-sm font-medium text-white truncate">{user?.username}</span>
              <span className="text-[10px] text-zinc-500 truncate">{user?.email}</span>
            </div>
          </div>
          <button 
            onClick={handleLogout} 
            className="p-1.5 rounded-lg hover:bg-zinc-800 text-zinc-400 hover:text-red-400 transition-colors"
            title="Sign out"
          >
            <LogOut className="w-4 h-4" />
          </button>

          {/* User Dropdown Overlay */}
          <AnimatePresence>
            {isUserDropdownOpen && (
              <>
                <div 
                  className="fixed inset-0 z-10" 
                  onClick={() => setIsUserDropdownOpen(false)}
                />
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  className="absolute bottom-16 left-4 right-4 z-20 bg-card border border-border rounded-xl shadow-premium p-1.5 flex flex-col space-y-0.5"
                >
                  <button 
                    onClick={() => { setIsUserDropdownOpen(false); navigate('/profile'); }}
                    className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-zinc-300 hover:bg-zinc-800/60 hover:text-white text-left"
                  >
                    <User className="w-4 h-4" />
                    Profile Settings
                  </button>
                  <button 
                    onClick={() => { setIsUserDropdownOpen(false); navigate('/members'); }}
                    className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-zinc-300 hover:bg-zinc-800/60 hover:text-white text-left"
                  >
                    <Users className="w-4 h-4" />
                    Members List
                  </button>
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>
      </aside>

      {/* --- MAIN PAGE SLOTS CONTAINER --- */}
      <div className="flex-1 flex flex-col overflow-hidden">
        
        {/* Top Header Bar */}
        <header className="h-[60px] border-b border-border bg-card/60 backdrop-blur-md px-6 flex items-center justify-between shrink-0 z-20">
          
          <div className="flex items-center gap-4">
            {/* Sidebar toggle button (Mobile) */}
            <button 
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="md:hidden p-1.5 rounded-lg hover:bg-zinc-800 text-zinc-400 hover:text-white transition-colors"
            >
              {isSidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
            <div className="hidden md:flex items-center gap-2 text-zinc-500 text-xs font-medium">
              <span>Workspaces</span>
              <span>/</span>
              <span className="text-zinc-300">{activeWorkspace.name}</span>
            </div>
          </div>

          {/* Active Connection Health Widget & Notification Bell */}
          <div className="flex items-center gap-3">
            
            {/* Bell Icon Trigger with Pulse Badge */}
            <button
              onClick={() => setIsNotificationTrayOpen(true)}
              className="p-1.5 rounded-lg hover:bg-zinc-800 text-zinc-400 hover:text-white transition-colors relative"
              title="Open Notifications"
            >
              <Bell className="w-5 h-5" />
              {unreadCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-primary text-white text-[9px] font-bold rounded-full flex items-center justify-center border border-card animate-pulse shadow-premium-glow shadow-primary/35">
                  {unreadCount}
                </span>
              )}
            </button>

            <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[11px] font-medium transition-all ${
              isWsConnected 
                ? 'bg-green-500/5 border-green-500/20 text-green-400' 
                : 'bg-red-500/5 border-red-500/20 text-red-400'
            }`}>
              {isWsConnected ? (
                <>
                  <Wifi className="w-3.5 h-3.5" />
                  <span>Sync Connected</span>
                </>
              ) : (
                <>
                  <WifiOff className="w-3.5 h-3.5 animate-pulse" />
                  <span>Sync Disconnected</span>
                </>
              )}
            </div>
          </div>

        </header>

        {/* Scrollable Page Slot Viewport */}
        <main className="flex-1 overflow-y-auto bg-background/50 relative">
          <Outlet />
        </main>
      </div>

      {/* Notification Slide Drawer Panel */}
      <AnimatePresence>
        {isNotificationTrayOpen && (
          <NotificationTray 
            onClose={() => setIsNotificationTrayOpen(false)} 
            onUnreadCountChange={setUnreadCount}
          />
        )}
      </AnimatePresence>

    </div>
  );
}
