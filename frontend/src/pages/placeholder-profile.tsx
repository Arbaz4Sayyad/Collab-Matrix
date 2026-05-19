import { useState } from 'react';
import { useAuthStore } from '../store/auth-store';
import { motion } from 'framer-motion';
import { User, Mail, Shield, CheckCircle2, Save, Sparkles } from 'lucide-react';

export default function PlaceholderProfile() {
  const { user, login, token } = useAuthStore();
  const [username, setUsername] = useState(user?.username || 'Staff Architect');
  const [email, setEmail] = useState(user?.email || 'staff_architect_test@collabmatrix.io');
  const [isSaving, setIsSaving] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setShowSuccess(false);

    setTimeout(() => {
      if (user && token) {
        // Update the user details inside Zustand store
        const updatedUser = {
          ...user,
          username,
          email,
        };
        login(updatedUser, token);
      }
      setIsSaving(false);
      setShowSuccess(true);
      
      // Auto-hide the success notification
      setTimeout(() => {
        setShowSuccess(false);
      }, 3000);
    }, 1000);
  };

  // Get first letter of username for standard fallback avatar
  const avatarInitials = username.substring(0, 1).toUpperCase();

  return (
    <div className="p-8 max-w-4xl mx-auto flex flex-col space-y-8 font-sans text-left min-h-[80vh]">
      
      {/* Page Header */}
      <div className="flex justify-between items-center border-b border-border pb-5 shrink-0">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-purple-500/10 border border-purple-500/20 text-primary">
              <Sparkles className="w-5 h-5" />
            </div>
            <h1 className="text-xl font-bold text-white tracking-tight">Profile Settings</h1>
          </div>
          <p className="text-[10px] text-zinc-500 font-medium uppercase tracking-wider">
            Manage your developer workspace credentials and visual identity
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        
        {/* Left Column: Visual Avatar Card */}
        <motion.div 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card p-6 rounded-2xl border border-border flex flex-col items-center text-center space-y-5 bg-card/20 h-fit"
        >
          <div className="relative group">
            {/* Glowing active outline */}
            <div className="absolute -inset-1 bg-gradient-to-tr from-purple-600 to-indigo-600 rounded-full blur opacity-45 group-hover:opacity-75 transition duration-500 animate-pulse" />
            
            {/* Avatar Bubble */}
            <div className="relative w-24 h-24 rounded-full bg-gradient-to-tr from-purple-600 to-indigo-600 flex items-center justify-center text-white text-4xl font-extrabold shadow-premium border-2 border-border/40 select-none">
              {avatarInitials}
            </div>
          </div>

          <div className="space-y-1">
            <h2 className="text-base font-bold text-white">{username}</h2>
            <p className="text-[10px] text-zinc-500 truncate max-w-[200px]">{email}</p>
          </div>

          <div className="w-full pt-4 border-t border-border/50 flex flex-col items-center space-y-2">
            <span className="px-2.5 py-1 rounded-full bg-purple-600/15 border border-purple-500/20 text-[10px] text-primary font-bold tracking-wider uppercase flex items-center gap-1.5">
              <Shield className="w-3.5 h-3.5" />
              {user?.role || 'MEMBER'}
            </span>
            <span className="text-[9px] text-zinc-500 font-medium">Workspace Organizer</span>
          </div>
        </motion.div>

        {/* Right Column: Editable Credentials Form */}
        <motion.div 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="glass-card md:col-span-2 p-8 rounded-2xl border border-border bg-card/10 space-y-6"
        >
          <h2 className="text-base font-bold text-white tracking-tight border-b border-border/30 pb-3">
            Account Information
          </h2>

          {showSuccess && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold flex items-center gap-2"
            >
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
              Profile details successfully updated and synchronized!
            </motion.div>
          )}

          <form onSubmit={handleSave} className="space-y-5">
            <div>
              <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">
                Username
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-zinc-500">
                  <User className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-input border border-border text-white text-xs placeholder-zinc-500 focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">
                Email Address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-zinc-500">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-input border border-border text-white text-xs placeholder-zinc-500 focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">
                System Role & Privileges
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-zinc-500">
                  <Shield className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  disabled
                  value={user?.role || 'MEMBER'}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-zinc-800/40 border border-border/40 text-zinc-500 text-xs cursor-not-allowed select-none"
                />
              </div>
              <p className="text-[10px] text-zinc-650 mt-1.5 font-medium leading-relaxed">
                Roles are pre-assigned during invite sequences. Contact your workspace administrator to update authorization tiers.
              </p>
            </div>

            <div className="pt-4 border-t border-border/30 flex justify-end">
              <button
                type="submit"
                disabled={isSaving}
                className="px-5 py-2.5 rounded-xl bg-primary hover:bg-purple-600 text-white font-bold text-xs flex items-center gap-2 shadow-premium hover:shadow-premium-glow transition-all disabled:opacity-50"
              >
                {isSaving ? (
                  <>
                    <motion.div 
                      animate={{ rotate: 360 }}
                      transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
                      className="w-4 h-4 border-2 border-white border-t-transparent rounded-full"
                    />
                    Saving changes...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    Save Changes
                  </>
                )}
              </button>
            </div>
          </form>
        </motion.div>

      </div>

    </div>
  );
}
