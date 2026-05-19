import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Columns, 
  MessageSquare, 
  FileText, 
  Users, 
  ArrowRight,
  TrendingUp,
  Activity,
  Plus,
  BarChart3,
  Calendar,
  Sparkles
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

// Data models for dynamic real-time SVG renderings
interface TimelineSession {
  user: string;
  doc: string;
  start: number;
  duration: number;
  color: string;
}

interface ChartDataSet {
  burndown: number[];
  velocity: number[];
  sessions: TimelineSession[];
}

const ANALYTICS_DATA: Record<'engineering' | 'product', Record<'enterprise' | 'developer', ChartDataSet>> = {
  engineering: {
    enterprise: {
      burndown: [18, 15, 11, 9, 6, 3, 0],
      velocity: [30, 85, 142, 98, 120, 50, 75],
      sessions: [
        { user: 'Staff Architect', doc: 'CDC Outbox spec outline', start: 10, duration: 45, color: 'from-purple-500 to-indigo-500' },
        { user: 'Lead Architect', doc: 'Kafka Event Broker design', start: 25, duration: 55, color: 'from-blue-500 to-indigo-600' },
        { user: 'DevOps Lead', doc: 'STOMP WebSockets heartbeat configuration', start: 50, duration: 35, color: 'from-emerald-500 to-teal-500' }
      ]
    },
    developer: {
      burndown: [18, 17, 16, 13, 11, 9, 8],
      velocity: [15, 42, 60, 49, 58, 22, 35],
      sessions: [
        { user: 'Staff Architect', doc: 'CDC Outbox spec outline', start: 15, duration: 30, color: 'from-purple-500 to-indigo-500' },
        { user: 'DevOps Lead', doc: 'STOMP WebSockets heartbeat configuration', start: 55, duration: 25, color: 'from-emerald-500 to-teal-500' }
      ]
    }
  },
  product: {
    enterprise: {
      burndown: [10, 8, 6, 5, 3, 2, 0],
      velocity: [45, 95, 115, 148, 85, 60, 90],
      sessions: [
        { user: 'Lead Product Designer', doc: 'Figma UI matrix framework v2', start: 5, duration: 60, color: 'from-pink-500 to-rose-500' },
        { user: 'Staff Architect', doc: 'Interactive UI Spec dashboard review', start: 35, duration: 40, color: 'from-purple-500 to-indigo-500' }
      ]
    },
    developer: {
      burndown: [10, 9, 9, 8, 7, 6, 5],
      velocity: [20, 35, 50, 42, 45, 20, 30],
      sessions: [
        { user: 'Lead Product Designer', doc: 'Figma UI matrix framework v2', start: 20, duration: 35, color: 'from-pink-500 to-rose-500' }
      ]
    }
  }
};

export default function DashboardPage() {
  const navigate = useNavigate();

  // Interactive UI configurations
  const [activeTab, setActiveTab] = useState<'burndown' | 'velocity' | 'sessions'>('burndown');
  const [activeOrg, setActiveOrg] = useState<'engineering' | 'product'>('engineering');
  const [activeTier, setActiveTier] = useState<'enterprise' | 'developer'>('enterprise');
  
  // Interactive tooltips state
  const [hoveredPoint, setHoveredPoint] = useState<{ x: number; y: number; val: string | number; label: string } | null>(null);

  const stats = [
    { label: 'Total Projects', value: '4', change: '+12%', icon: TrendingUp, color: 'text-purple-400 bg-purple-500/10' },
    { label: 'Active Kanban Tasks', value: '18', change: '8 in progress', icon: Columns, color: 'text-emerald-400 bg-emerald-500/10' },
    { label: 'Workspace Channels', value: '6', change: '12 active users', icon: MessageSquare, color: 'text-blue-400 bg-blue-500/10' },
    { label: 'Shared Documents', value: '12', change: '4 updated today', icon: FileText, color: 'text-amber-400 bg-amber-500/10' },
  ];

  const quickActions = [
    { title: 'Task Board', desc: 'Manage issues, sprints, and priorities', link: '/tasks', icon: Columns, color: 'from-purple-600 to-indigo-600' },
    { title: 'Slack Channels', desc: 'Chat and communicate with your team', link: '/chat', icon: MessageSquare, color: 'from-blue-600 to-cyan-600' },
    { title: 'Notion Documents', desc: 'Co-edit guidelines and document logs', link: '/docs', icon: FileText, color: 'from-amber-500 to-orange-600' },
  ];

  const activities = [
    { id: 1, user: 'Staff Architect', action: 'completed task', target: 'Configure Spring WebSockets STOMP layer', time: '10 mins ago', type: 'task' },
    { id: 2, user: 'Lead Architect', action: 'updated documentation', target: 'System Deployment Blueprints', time: '45 mins ago', type: 'doc' },
    { id: 3, user: 'Staff Architect', action: 'created channel', target: '#prod-outbox-sync', time: '2 hours ago', type: 'chat' },
    { id: 4, user: 'DevOps Lead', action: 'resolved incident', target: 'Zookeeper cluster memory leaks', time: '5 hours ago', type: 'system' },
  ];

  // Resolve current active dataset
  const activeDataset = ANALYTICS_DATA[activeOrg][activeTier];

  // --- SVG Path Builders ---
  
  // Sprint Burndown Path Builder
  const getBurndownPath = () => {
    const data = activeDataset.burndown;
    const maxVal = 18;
    return data.map((val, idx) => {
      const x = 30 + (idx * 70);
      const y = 170 - (val / maxVal) * 140;
      return `${idx === 0 ? 'M' : 'L'} ${x} ${y}`;
    }).join(' ');
  };

  // Message Velocity Curve & Area Path Builder
  const getVelocityPaths = () => {
    const data = activeDataset.velocity;
    const maxVal = 160;
    
    // Build curve line path
    const points = data.map((val, idx) => {
      const x = 30 + (idx * 70);
      const y = 170 - (val / maxVal) * 140;
      return { x, y };
    });

    let linePath = '';
    let areaPath = '';

    if (points.length > 0) {
      linePath = `M ${points[0].x} ${points[0].y}`;
      areaPath = `M ${points[0].x} 170 L ${points[0].x} ${points[0].y}`;
      
      for (let i = 0; i < points.length - 1; i++) {
        const xc = (points[i].x + points[i + 1].x) / 2;
        const yc = (points[i].y + points[i + 1].y) / 2;
        linePath += ` Q ${points[i].x} ${points[i].y}, ${xc} ${yc}`;
        areaPath += ` Q ${points[i].x} ${points[i].y}, ${xc} ${yc}`;
      }
      
      const last = points[points.length - 1];
      linePath += ` L ${last.x} ${last.y}`;
      areaPath += ` L ${last.x} ${last.y} L ${last.x} 170 Z`;
    }

    return { linePath, areaPath };
  };

  const velocityPaths = getVelocityPaths();

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="p-8 max-w-7xl mx-auto space-y-8 select-none font-sans text-left"
    >
      {/* Welcome Banner */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="space-y-1">
          <h1 className="text-3xl font-extrabold text-white tracking-tight flex items-center gap-2">
            Workspace Overview
            <Sparkles className="w-5 h-5 text-purple-400 animate-pulse" />
          </h1>
          <p className="text-sm text-muted-foreground">
            Real-time status updates, vector collaboration graphs, and activity timelines.
          </p>
        </div>
        <button 
          onClick={() => navigate('/tasks')} 
          className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-primary hover:bg-purple-600 text-white font-semibold text-sm transition-all shadow-premium hover:shadow-premium-glow hover:scale-[1.02]"
        >
          <Plus className="w-4 h-4" />
          Create New Task
        </button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, idx) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.05 }}
            className="glass-card p-6 rounded-xl relative overflow-hidden bg-card/45 border-border hover:border-purple-500/20 transition-colors"
          >
            <div className="flex justify-between items-start">
              <div className="space-y-2">
                <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">{stat.label}</span>
                <div className="text-3xl font-bold text-white tracking-tight">{stat.value}</div>
              </div>
              <div className={`p-2.5 rounded-lg ${stat.color} shrink-0`}>
                <stat.icon className="w-5 h-5 animate-pulse" />
              </div>
            </div>
            <div className="mt-4 flex items-center gap-1.5 text-xs text-zinc-400 font-medium">
              <span className="text-emerald-400 font-bold">{stat.change}</span>
            </div>
          </motion.div>
        ))}
      </div>

      {/* --- PROPOSAL 2: DYNAMIC PROJECT ANALYTICS INTERACTIVE HUB --- */}
      <motion.div 
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card rounded-2xl border border-border p-6 bg-card/20 flex flex-col space-y-6"
      >
        {/* Header Block with Toggles */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 border-b border-border pb-4">
          
          {/* Left Chart Tabs Switcher */}
          <div className="flex bg-zinc-950/40 p-1 rounded-xl border border-border/60">
            {[
              { id: 'burndown', label: 'Sprint Burndown', icon: BarChart3 },
              { id: 'velocity', label: 'Message Velocity', icon: Activity },
              { id: 'sessions', label: 'Document Sessions', icon: Calendar }
            ].map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => { setActiveTab(tab.id as any); setHoveredPoint(null); }}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                    isActive 
                      ? 'bg-purple-600/10 text-primary border border-purple-500/20 shadow-premium-glow' 
                      : 'text-zinc-400 hover:text-white hover:bg-zinc-900/40 border border-transparent'
                  }`}
                >
                  <tab.icon className="w-3.5 h-3.5" />
                  {tab.label}
                </button>
              );
            })}
          </div>

          {/* Right Filters Segment */}
          <div className="flex flex-wrap items-center gap-3">
            
            {/* Org Switcher Toggle */}
            <div className="flex bg-zinc-950/20 p-1 rounded-lg border border-border/30 text-xs">
              <button 
                onClick={() => { setActiveOrg('engineering'); setHoveredPoint(null); }}
                className={`px-3 py-1 rounded-md font-semibold transition-all ${activeOrg === 'engineering' ? 'bg-zinc-800 text-white font-bold' : 'text-zinc-500 hover:text-zinc-350'}`}
              >
                Engineering Core
              </button>
              <button 
                onClick={() => { setActiveOrg('product'); setHoveredPoint(null); }}
                className={`px-3 py-1 rounded-md font-semibold transition-all ${activeOrg === 'product' ? 'bg-zinc-800 text-white font-bold' : 'text-zinc-500 hover:text-zinc-350'}`}
              >
                Product & Design
              </button>
            </div>

            {/* Tier Switcher Toggle */}
            <div className="flex bg-zinc-950/20 p-1 rounded-lg border border-border/30 text-xs">
              <button 
                onClick={() => { setActiveTier('enterprise'); setHoveredPoint(null); }}
                className={`px-3 py-1 rounded-md font-semibold transition-all ${activeTier === 'enterprise' ? 'bg-purple-600/10 text-primary border border-purple-500/15' : 'text-zinc-500 hover:text-zinc-350'}`}
              >
                Enterprise Plan
              </button>
              <button 
                onClick={() => { setActiveTier('developer'); setHoveredPoint(null); }}
                className={`px-3 py-1 rounded-md font-semibold transition-all ${activeTier === 'developer' ? 'bg-zinc-800 text-white border border-transparent' : 'text-zinc-500 hover:text-zinc-350'}`}
              >
                Developer Free
              </button>
            </div>

          </div>

        </div>

        {/* Dynamic Vector SVG Canvas Area */}
        <div className="relative w-full h-[260px] bg-zinc-950/15 rounded-xl border border-border/30 p-4 flex items-center justify-center overflow-hidden">
          
          <AnimatePresence mode="wait">
            
            {/* 1. Sprint Burndown Chart */}
            {activeTab === 'burndown' && (
              <motion.svg 
                key="burndown"
                initial={{ opacity: 0, scale: 0.99 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.99 }}
                viewBox="0 0 500 200" 
                className="w-full h-full text-left"
              >
                {/* Horizontal Guidelines */}
                {[0, 1, 2, 3].map((tick) => (
                  <line 
                    key={tick} 
                    x1="20" y1={30 + (tick * 46.6)} 
                    x2="480" y2={30 + (tick * 46.6)} 
                    className="stroke-border/20" 
                    strokeWidth="1"
                    strokeDasharray="4 4"
                  />
                ))}

                {/* Target Burndown Ideal Line */}
                <line 
                  x1="30" y1="30" 
                  x2="450" y2="170" 
                  className="stroke-zinc-700/60" 
                  strokeWidth="1.5" 
                  strokeDasharray="5 5"
                />

                {/* Actual Sprint Burndown Glowing Vector Path */}
                <motion.path 
                  initial={{ pathLength: 0 }}
                  animate={{ pathLength: 1 }}
                  transition={{ duration: 0.8, ease: 'easeOut' }}
                  d={getBurndownPath()} 
                  fill="none" 
                  className="stroke-purple-500" 
                  strokeWidth="2.5"
                  style={{ filter: 'drop-shadow(0 0 6px rgba(168, 85, 247, 0.45))' }}
                />

                {/* Active Data Nodes */}
                {activeDataset.burndown.map((val, idx) => {
                  const x = 30 + (idx * 70);
                  const y = 170 - (val / 18) * 140;
                  return (
                    <g key={idx} className="cursor-pointer group">
                      <circle 
                        cx={x} cy={y} r="5" 
                        className="fill-purple-900 stroke-purple-400" 
                        strokeWidth="2"
                        onMouseEnter={() => {
                          setHoveredPoint({
                            x: x,
                            y: y - 10,
                            val: `${val} Issues`,
                            label: `Day ${idx + 1}`
                          });
                        }}
                        onMouseLeave={() => setHoveredPoint(null)}
                      />
                      <circle cx={x} cy={y} r="10" className="fill-purple-500/0 group-hover:fill-purple-500/10 transition-colors" />
                    </g>
                  );
                })}

                {/* Vector Grid Axis Labels */}
                <text x="30" y="190" className="fill-zinc-600 font-bold text-[8px]">Day 1</text>
                <text x="170" y="190" className="fill-zinc-600 font-bold text-[8px]">Day 3</text>
                <text x="310" y="190" className="fill-zinc-600 font-bold text-[8px]">Day 5</text>
                <text x="450" y="190" className="fill-zinc-600 font-bold text-[8px]">Day 7</text>
              </motion.svg>
            )}

            {/* 2. Message Velocity Gradient Area Chart */}
            {activeTab === 'velocity' && (
              <motion.svg 
                key="velocity"
                initial={{ opacity: 0, scale: 0.99 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.99 }}
                viewBox="0 0 500 200" 
                className="w-full h-full text-left"
              >
                <defs>
                  <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="rgb(59, 130, 246)" stopOpacity="0.25" />
                    <stop offset="100%" stopColor="rgb(59, 130, 246)" stopOpacity="0.00" />
                  </linearGradient>
                </defs>

                {/* Horizontal gridlines */}
                {[0, 1, 2, 3].map((tick) => (
                  <line 
                    key={tick} 
                    x1="20" y1={30 + (tick * 46.6)} 
                    x2="480" y2={30 + (tick * 46.6)} 
                    className="stroke-border/20" 
                    strokeWidth="1"
                  />
                ))}

                {/* Shaded Area Path */}
                <motion.path
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.6 }}
                  d={velocityPaths.areaPath}
                  fill="url(#areaGrad)"
                />

                {/* Glowing Curvature Path */}
                <motion.path 
                  initial={{ pathLength: 0 }}
                  animate={{ pathLength: 1 }}
                  transition={{ duration: 0.8, ease: 'easeOut' }}
                  d={velocityPaths.linePath} 
                  fill="none" 
                  className="stroke-blue-500" 
                  strokeWidth="2.5"
                  style={{ filter: 'drop-shadow(0 0 5px rgba(59, 130, 246, 0.4))' }}
                />

                {/* Data Points */}
                {activeDataset.velocity.map((val, idx) => {
                  const x = 30 + (idx * 70);
                  const y = 170 - (val / 160) * 140;
                  const labelTimes = ['9 AM', '11 AM', '1 PM', '3 PM', '5 PM', '7 PM', '9 PM'];
                  return (
                    <g key={idx} className="cursor-pointer group">
                      <circle 
                        cx={x} cy={y} r="5" 
                        className="fill-blue-950 stroke-blue-400" 
                        strokeWidth="2"
                        onMouseEnter={() => {
                          setHoveredPoint({
                            x: x,
                            y: y - 10,
                            val: `${val} Chat MSGs`,
                            label: labelTimes[idx]
                          });
                        }}
                        onMouseLeave={() => setHoveredPoint(null)}
                      />
                      <circle cx={x} cy={y} r="10" className="fill-blue-500/0 group-hover:fill-blue-500/10 transition-colors" />
                    </g>
                  );
                })}

                {/* Axis Labels */}
                <text x="30" y="190" className="fill-zinc-600 font-bold text-[8px]">9 AM</text>
                <text x="170" y="190" className="fill-zinc-600 font-bold text-[8px]">1 PM</text>
                <text x="310" y="190" className="fill-zinc-600 font-bold text-[8px]">5 PM</text>
                <text x="450" y="190" className="fill-zinc-600 font-bold text-[8px]">9 PM</text>
              </motion.svg>
            )}

            {/* 3. Document Session Gantt Lanes */}
            {activeTab === 'sessions' && (
              <motion.div 
                key="sessions"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="w-full h-full flex flex-col justify-center space-y-3.5 px-4"
              >
                {activeDataset.sessions.map((session, idx) => (
                  <div key={idx} className="flex items-center gap-4 text-xs">
                    
                    {/* User Profile avatar initials */}
                    <div className="w-24 text-left font-bold text-white flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-zinc-800 border border-border flex items-center justify-center text-[9px] uppercase tracking-wider text-zinc-400">
                        {session.user.substring(0, 2).toUpperCase()}
                      </div>
                      <span className="truncate">{session.user.split(' ')[0]}</span>
                    </div>

                    {/* Timeline Track bar */}
                    <div className="flex-1 bg-zinc-950/40 rounded-full h-7 relative border border-border/20 overflow-hidden group">
                      
                      {/* Active Co-edit Pill bar segment */}
                      <motion.div
                        initial={{ width: 0, left: 0 }}
                        animate={{ width: `${session.duration}%`, left: `${session.start}%` }}
                        transition={{ type: 'spring', stiffness: 80, damping: 15 }}
                        className={`absolute top-1 bottom-1 rounded-full bg-gradient-to-r ${session.color} border border-white/10 flex items-center px-3 shadow-premium-glow cursor-pointer`}
                        onMouseEnter={() => {
                          setHoveredPoint({
                            x: 200,
                            y: 80 + idx * 35,
                            val: `Co-editing: "${session.doc}"`,
                            label: `Duration: ${Math.floor(session.duration * 2.5)} min`
                          });
                        }}
                        onMouseLeave={() => setHoveredPoint(null)}
                      >
                        {/* Shimmer pulse inline badge */}
                        <div className="w-1.5 h-1.5 rounded-full bg-white animate-ping mr-1.5 shrink-0" />
                        <span className="text-[9px] text-white font-extrabold truncate select-none tracking-wide uppercase">
                          {session.doc}
                        </span>
                      </motion.div>
                    </div>

                  </div>
                ))}
              </motion.div>
            )}

          </AnimatePresence>

          {/* Interactive Chart Node Floating Hover Tooltip overlay */}
          <AnimatePresence>
            {hoveredPoint && (
              <motion.div
                initial={{ opacity: 0, y: 5, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                style={{ 
                  left: hoveredPoint.x + 10, 
                  top: hoveredPoint.y - 15 
                }}
                className="absolute z-30 bg-zinc-950/95 border border-purple-500/30 rounded-xl p-2.5 shadow-premium text-[10px] pointer-events-none backdrop-blur-md flex flex-col space-y-0.5 border-l-2 border-l-purple-500"
              >
                <span className="text-zinc-500 font-bold uppercase tracking-wider">{hoveredPoint.label}</span>
                <span className="text-white font-extrabold tracking-tight text-[11px]">{hoveredPoint.val}</span>
              </motion.div>
            )}
          </AnimatePresence>

        </div>
      </motion.div>

      {/* Quick Launch Cards */}
      <div className="space-y-4">
        <h2 className="text-xl font-bold text-white tracking-tight">Quick Features Launch</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {quickActions.map((action, idx) => (
            <motion.div
              key={action.title}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
              whileHover={{ y: -4 }}
              className="glass-card p-6 rounded-xl hover:border-purple-500/30 transition-all cursor-pointer group flex flex-col justify-between h-[180px] bg-card/45 border-border"
              onClick={() => navigate(action.link)}
            >
              <div className="space-y-3">
                <div className={`w-10 h-10 rounded-lg bg-gradient-to-tr ${action.color} flex items-center justify-center shadow-premium-glow text-white`}>
                  <action.icon className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-semibold text-white group-hover:text-primary transition-colors">{action.title}</h3>
                  <p className="text-xs text-zinc-500 mt-1 line-clamp-2">{action.desc}</p>
                </div>
              </div>
              <div className="flex items-center gap-1 text-xs text-primary font-semibold self-start group-hover:underline">
                Open Workspace
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Activities and Members section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Recent Activity */}
        <div className="lg:col-span-2 glass-card p-6 rounded-xl space-y-4 flex flex-col justify-between bg-card/45 border-border">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Activity className="w-5 h-5 text-zinc-400" />
              <h2 className="text-lg font-bold text-white tracking-tight">Recent Activity Stream</h2>
            </div>
            <div className="space-y-4">
              {activities.map((act) => (
                <div key={act.id} className="flex justify-between items-start py-3 border-b border-border last:border-0">
                  <div className="flex gap-3 items-start overflow-hidden pr-4">
                    <div className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center text-zinc-300 font-medium shrink-0 text-xs">
                      {act.user.substring(0, 2).toUpperCase()}
                    </div>
                    <div className="text-sm text-left overflow-hidden">
                      <span className="font-semibold text-white">{act.user}</span>{' '}
                      <span className="text-zinc-400">{act.action}</span>{' '}
                      <span className="font-medium text-primary block truncate max-w-[280px] md:max-w-[450px]">
                        {act.target}
                      </span>
                    </div>
                  </div>
                  <span className="text-[11px] text-zinc-500 shrink-0 mt-0.5">{act.time}</span>
                </div>
              ))}
            </div>
          </div>
          <button 
            onClick={() => navigate('/notifications')}
            className="w-full text-center py-2 text-xs font-semibold text-zinc-400 hover:text-white hover:bg-zinc-800/40 rounded-lg transition-colors border border-border mt-4"
          >
            View all notification logs
          </button>
        </div>

        {/* Member Overview Panel */}
        <div className="glass-card p-6 rounded-xl space-y-4 bg-card/45 border-border">
          <div className="flex items-center gap-2 mb-2">
            <Users className="w-5 h-5 text-zinc-400" />
            <h2 className="text-lg font-bold text-white tracking-tight">Workspace Members</h2>
          </div>
          <div className="space-y-4">
            <div className="flex justify-between items-center py-2.5 border-b border-border">
              <div className="flex gap-3 items-center">
                <div className="w-8 h-8 rounded-full bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-primary font-bold text-xs shrink-0">
                  SA
                </div>
                <div className="text-sm text-left">
                  <div className="font-semibold text-white">Staff Architect</div>
                  <div className="text-xs text-zinc-500">architect@collabmatrix.io</div>
                </div>
              </div>
              <span className="px-2 py-0.5 rounded bg-purple-500/10 border border-purple-500/20 text-[10px] text-primary font-semibold uppercase">Owner</span>
            </div>
            <div className="flex justify-between items-center py-2.5">
              <div className="flex gap-3 items-center">
                <div className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center text-zinc-300 font-medium text-xs shrink-0">
                  TU
                </div>
                <div className="text-sm text-left">
                  <div className="font-semibold text-white">Test User</div>
                  <div className="text-xs text-zinc-500">test@collabmatrix.io</div>
                </div>
              </div>
              <span className="px-2 py-0.5 rounded bg-zinc-800 border border-border text-[10px] text-zinc-400 font-semibold uppercase">Member</span>
            </div>
          </div>
        </div>

      </div>
    </motion.div>
  );
}
