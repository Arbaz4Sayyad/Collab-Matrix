import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuthStore } from '../store/auth-store';
import { motion, AnimatePresence, useScroll, useTransform } from 'framer-motion';
import { 
  Sparkles, Terminal, Shield, Zap, RefreshCw, Users, LayoutGrid, MessageSquare, 
  FileText, Play, Pause, Search, Send, CheckCircle2, AlertCircle, ArrowRight, 
  Loader2, Network, Database, Activity, Bell, Menu, X, Code
} from 'lucide-react';

export default function LandingPage() {
  const { isAuthenticated } = useAuthStore();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // --- Real-time Doc Editor Simulation States ---
  const [docContent, setDocContent] = useState('<h1>System Design Draft</h1><p>We are coordinating the new...</p>');
  const [docSaveStatus, setDocSaveStatus] = useState<'typing' | 'saving' | 'saved'>('saved');
  const [cursorPosition, setCursorPosition] = useState({ x: 220, y: 160 });
  const [activeCollaborator, setActiveCollaborator] = useState('Arbaz');

  // --- Live Chat Simulation States ---
  const [chatMessages, setChatMessages] = useState<Array<{ sender: string; text: string; time: string; avatar: string }>>([
    { sender: 'Lead Architect', text: 'Welcome to the CollabMatrix developer chat channel!', time: '10:08 AM', avatar: 'bg-purple-600' },
    { sender: 'DevOps Lead', text: 'WebSocket heartbeats look rock solid under Kafka broker pressure.', time: '10:12 AM', avatar: 'bg-blue-600' }
  ]);
  const [isTyping, setIsTyping] = useState(false);

  // --- Kanban Board Simulation States ---
  const [kanbanCards, setKanbanCards] = useState([
    { id: 'CME-102', title: 'Setup Kafka cluster triggers', lane: 'To Do', priority: 'HIGH', user: 'Sarah' },
    { id: 'CME-105', title: 'Implement optimistic lock handling', lane: 'In Progress', priority: 'MEDIUM', user: 'Tariq' },
    { id: 'CME-108', title: 'Configure Prom & Grafana configs', lane: 'Done', priority: 'LOW', user: 'Arbaz' }
  ]);

  // --- Activity Replay Timeline States ---
  const [isPlayingTimeline, setIsPlayingTimeline] = useState(true);
  const [timelineIndex, setTimelineIndex] = useState(0);
  const timelineEvents = [
    { type: 'task', text: 'Arbaz created task CME-102: Setup Kafka triggers', time: '12:00 PM', desc: 'Added into Backlog' },
    { type: 'doc', text: 'Tariq edited Document "CME High-Latency Transaction Outbox Specification"', time: '12:05 PM', desc: 'Modified Section 2: Database Poller' },
    { type: 'chat', text: 'Sarah sent message in #general: "Kafka event broker connected!"', time: '12:12 PM', desc: 'WebSocket Broadcast successfully completed' },
    { type: 'task', text: 'Arbaz moved task CME-105 to In Progress', time: '12:18 PM', desc: 'Updated with optimistic lock increment v1' },
    { type: 'sys', text: 'System triggered health check alert: STOMP active', time: '12:20 PM', desc: 'Roundtrip speed <40ms' }
  ];

  // --- Notification Center States ---
  const [notificationStack, setNotificationStack] = useState<Array<{ id: number; title: string; category: string; desc: string; urgent: boolean }>>([
    { id: 1, title: 'Tariq assigned you in CME-105', category: 'assignment', desc: 'Task: Implement optimistic lock handling', urgent: false },
    { id: 2, title: 'Arbaz mentioned you in Outbox Spec Document', category: 'mention', desc: '"Check section 2 database scheduler poll rules."', urgent: true },
    { id: 3, title: '3 teammates entered Docs Workspace', category: 'alert', desc: 'Live concurrent cursor presence synced', urgent: false }
  ]);

  // --- Command Palette Simulation States ---
  const [cmdSearch, setCmdSearch] = useState('');
  const [cmdActiveIndex, setCmdActiveIndex] = useState(0);
  const cmdOptions = [
    { label: 'Jump to #general', category: 'Channels' },
    { label: 'Open Outbox Specification Doc', category: 'Notion Docs' },
    { label: 'Create new agile task card', category: 'Quick Actions' },
    { label: 'View prometheus cluster metrics', category: 'Admin Panel' }
  ];

  // --- Animation Hooks for Scroll ---
  const { scrollY } = useScroll();
  const heroOpacity = useTransform(scrollY, [0, 400], [1, 0]);
  const heroScale = useTransform(scrollY, [0, 400], [1, 0.95]);

  // 1. Notion Editor Simulation Loop
  useEffect(() => {
    const mockTypingSteps = [
      { text: '<h1>System Design Draft</h1><p>We are coordinating the new PostgreSQL poller queues.</p>', collaborator: 'Arbaz', x: 260, y: 155 },
      { text: '<h1>System Design Draft</h1><p>We are coordinating the new PostgreSQL poller queues using SKIP LOCKED.</p>', collaborator: 'Tariq', x: 380, y: 155 },
      { text: '<h1>System Design Draft</h1><p>We are coordinating the new PostgreSQL poller queues using SKIP LOCKED to optimize speed.</p>', collaborator: 'Sarah', x: 490, y: 155 }
    ];
    let step = 0;

    const interval = setInterval(() => {
      setDocSaveStatus('typing');
      const targetStep = mockTypingSteps[step % mockTypingSteps.length];
      setActiveCollaborator(targetStep.collaborator);
      setCursorPosition({ x: targetStep.x, y: targetStep.y });

      setTimeout(() => {
        setDocContent(targetStep.text);
        setDocSaveStatus('saving');
        
        setTimeout(() => {
          setDocSaveStatus('saved');
        }, 800);
      }, 500);

      step++;
    }, 4500);

    return () => clearInterval(interval);
  }, []);

  // 2. Chat Simulation Loop
  useEffect(() => {
    const mockChatCycle = [
      { sender: 'Sarah', text: 'Kafka event broker successfully logged the Outbox transaction!', avatar: 'bg-emerald-600' },
      { sender: 'Arbaz', text: 'Agreed, and Redis heartbeat latency shows exactly 32ms.', avatar: 'bg-purple-600' }
    ];
    let cycle = 0;

    const chatInterval = setInterval(() => {
      setIsTyping(true);
      setTimeout(() => {
        setIsTyping(false);
        const nextMsg = mockChatCycle[cycle % mockChatCycle.length];
        setChatMessages(prev => [
          ...prev.slice(-3), // Keep list compact
          { sender: nextMsg.sender, text: nextMsg.text, time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }), avatar: nextMsg.avatar }
        ]);
        cycle++;
      }, 1500);
    }, 6000);

    return () => clearInterval(chatInterval);
  }, []);

  // 3. Kanban Simulation Loop
  useEffect(() => {
    const boardInterval = setInterval(() => {
      setKanbanCards(prev => {
        return prev.map((card, idx) => {
          if (idx === 0) {
            // Task CME-102 jumps lanes To Do -> In Progress -> Done
            const nextLane = card.lane === 'To Do' ? 'In Progress' : card.lane === 'In Progress' ? 'Done' : 'To Do';
            return { ...card, lane: nextLane };
          }
          if (idx === 1) {
            const nextLane = card.lane === 'In Progress' ? 'Done' : 'In Progress';
            return { ...card, lane: nextLane };
          }
          return card;
        });
      });
    }, 5000);

    return () => clearInterval(boardInterval);
  }, []);

  // 4. Activity Replay Timeline Loop
  useEffect(() => {
    if (!isPlayingTimeline) return;
    const timelineInterval = setInterval(() => {
      setTimelineIndex(prev => (prev + 1) % timelineEvents.length);
    }, 3000);
    return () => clearInterval(timelineInterval);
  }, [isPlayingTimeline]);

  // 5. Command Palette Typing Simulation
  useEffect(() => {
    const searchTexts = ['Jump', 'Outbox', 'prometheus', 'agile'];
    let idx = 0;
    const cmdInterval = setInterval(() => {
      const text = searchTexts[idx % searchTexts.length];
      let charIdx = 0;
      setCmdSearch('');

      const typingTimer = setInterval(() => {
        if (charIdx <= text.length) {
          setCmdSearch(text.substring(0, charIdx));
          charIdx++;
        } else {
          clearInterval(typingTimer);
        }
      }, 120);

      // Randomly change search active option
      setCmdActiveIndex(idx % 4);
      idx++;
    }, 4000);

    return () => clearInterval(cmdInterval);
  }, []);

  // 6. Notification Center Stacking Loop
  useEffect(() => {
    const notificationPool = [
      { title: 'Sarah completed CME-102: Setup Kafka triggers', category: 'task', desc: 'Approved in pull request #45', urgent: false },
      { title: 'Urgent system notification', category: 'alert', desc: 'Prometheus cluster target registered successfully.', urgent: true },
      { title: 'Tariq started a direct message thread', category: 'chat', desc: '"Hey, check the Redis cache configs."', urgent: false }
    ];
    let poolIdx = 0;

    const notifInterval = setInterval(() => {
      const nextNotif = notificationPool[poolIdx % notificationPool.length];
      setNotificationStack(prev => {
        const withNew = [...prev, { id: Date.now(), ...nextNotif }];
        return withNew.slice(-3); // Keep stack to 3
      });
      poolIdx++;
    }, 7000);

    return () => clearInterval(notifInterval);
  }, []);

  return (
    <div className="bg-[#030303] text-zinc-100 min-h-screen relative overflow-hidden font-sans select-none selection:bg-purple-500/20 selection:text-purple-300">
      
      {/* Cinematic Top Radial Glow Gradient */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-[1400px] h-[550px] bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-purple-950/25 via-purple-950/5 to-transparent pointer-events-none z-0" />
      <div className="absolute top-[800px] right-0 w-[400px] h-[400px] bg-indigo-950/10 rounded-full blur-[160px] pointer-events-none" />
      <div className="absolute top-[1600px] left-0 w-[400px] h-[400px] bg-purple-950/10 rounded-full blur-[160px] pointer-events-none" />

      {/* ====================================================
          CINEMATIC FIXED GLASS NAVIGATION NAVBAR
          ==================================================== */}
      <nav className="fixed top-4 left-1/2 -translate-x-1/2 z-50 w-[95%] max-w-6xl glass rounded-2xl px-6 py-3.5 flex justify-between items-center transition-all duration-300 shadow-premium">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-purple-600 to-indigo-500 flex items-center justify-center text-white font-black text-sm shadow-premium-glow">
            CM
          </div>
          <span className="text-base font-bold text-white tracking-tight">CollabMatrix</span>
          <span className="text-[9px] bg-purple-500/10 border border-purple-500/20 px-1.5 py-0.5 rounded text-purple-400 font-semibold tracking-wider uppercase">Beta</span>
        </div>

        {/* Navigation Middle Tabs */}
        <div className="hidden md:flex items-center gap-7 text-xs font-semibold text-zinc-400">
          <a href="#showcase" className="hover:text-white transition-colors">Workspace Tools</a>
          <a href="#architecture" className="hover:text-white transition-colors">Architecture</a>
          <a href="#features" className="hover:text-white transition-colors">Key Features</a>
          <a href="#performance" className="hover:text-white transition-colors">Performance</a>
        </div>

        {/* CTA Launch Session Triggers */}
        <div className="hidden md:flex items-center gap-3">
          {isAuthenticated ? (
            <Link 
              to="/dashboard" 
              className="px-4.5 py-2 rounded-xl bg-purple-500 hover:bg-purple-600 text-white text-xs font-bold transition-all shadow-premium-glow flex items-center gap-1.5 hover:scale-[1.02] active:scale-[0.98]"
            >
              <span>Go to Workspace</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          ) : (
            <>
              <Link to="/login" className="px-4 py-2 text-zinc-300 hover:text-white text-xs font-bold transition-colors">
                Sign In
              </Link>
              <Link 
                to="/register" 
                className="px-4 py-2 rounded-xl bg-white hover:bg-zinc-200 text-black text-xs font-bold transition-all hover:scale-[1.02] active:scale-[0.98] shadow-premium"
              >
                Launch Workspace
              </Link>
            </>
          )}
        </div>

        {/* Mobile toggle */}
        <button className="md:hidden text-zinc-400 hover:text-white" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
          {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </nav>

      {/* Mobile Drawer Menu */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-20 inset-x-4 z-40 bg-zinc-950/95 backdrop-blur-lg border border-zinc-800 p-6 rounded-2xl flex flex-col gap-4 md:hidden shadow-premium"
          >
            <a href="#showcase" className="text-zinc-300 text-sm font-semibold" onClick={() => setMobileMenuOpen(false)}>Workspace Tools</a>
            <a href="#architecture" className="text-zinc-300 text-sm font-semibold" onClick={() => setMobileMenuOpen(false)}>Architecture</a>
            <a href="#features" className="text-zinc-300 text-sm font-semibold" onClick={() => setMobileMenuOpen(false)}>Key Features</a>
            <a href="#performance" className="text-zinc-300 text-sm font-semibold" onClick={() => setMobileMenuOpen(false)}>Performance</a>
            <div className="h-px bg-zinc-800 my-2" />
            {isAuthenticated ? (
              <Link to="/dashboard" className="px-4 py-2 rounded-xl bg-purple-500 text-white text-center text-xs font-bold" onClick={() => setMobileMenuOpen(false)}>
                Go to Workspace
              </Link>
            ) : (
              <div className="flex flex-col gap-2">
                <Link to="/login" className="px-4 py-2 text-zinc-300 text-center text-xs font-bold" onClick={() => setMobileMenuOpen(false)}>Sign In</Link>
                <Link to="/register" className="px-4 py-2 rounded-xl bg-white text-black text-center text-xs font-bold" onClick={() => setMobileMenuOpen(false)}>Launch Workspace</Link>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ====================================================
          SECTION 1: HERO SECTION & AUTOMATED LIVE WORKSPACE
          ==================================================== */}
      <section className="relative pt-36 pb-24 px-6 max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 items-center min-h-[90vh]">
        <motion.div 
          style={{ opacity: heroOpacity, scale: heroScale }}
          className="lg:col-span-6 space-y-6 text-left"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-400 text-xs font-semibold">
            <Sparkles className="w-3.5 h-3.5 text-purple-400 animate-pulse" />
            <span>High-Latency Transaction Outbox Specification Ready</span>
          </div>

          <h1 className="text-4xl md:text-5xl lg:text-6xl font-black text-white leading-[1.08] tracking-tight">
            Collaborate at the <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-indigo-300 to-white">
              speed of thought.
            </span>
          </h1>

          <p className="text-sm md:text-base text-zinc-400 max-w-xl leading-relaxed">
            CollabMatrix unifies robust **Kanban workflow boards**, **Notion-style concurrent document canvases**, and **Slack-style channels** inside a modular monolith Spring Boot backend. Engineered with WebSockets, Redis presence brokers, and Kafka outboxes.
          </p>

          {/* Action CTAs */}
          <div className="flex flex-wrap items-center gap-4 pt-2">
            <Link 
              to="/register" 
              className="px-6 py-3 rounded-xl bg-purple-500 hover:bg-purple-600 text-white font-bold text-sm shadow-premium-glow hover:scale-[1.02] transition-all flex items-center gap-2"
            >
              <span>Explore Workspace Free</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
            <a 
              href="#architecture" 
              className="px-5 py-3 rounded-xl border border-zinc-800 hover:border-zinc-700 bg-zinc-900/30 text-zinc-300 hover:text-white font-bold text-sm transition-all"
            >
              System Architecture
            </a>
          </div>

          {/* Real-time details */}
          <div className="flex items-center gap-6 pt-4 border-t border-zinc-900/80 text-[11px] text-zinc-500 font-semibold uppercase tracking-widest">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>STOMP ACTIVE</span>
            </div>
            <div>•</div>
            <div>REDIS HEARTBEATS ACTIVE</div>
            <div>•</div>
            <div>KAFKA DURABLE QUEUES</div>
          </div>
        </motion.div>

        {/* RIGHT SIDE: Animated Live Preview Dashboard mock */}
        <motion.div 
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
          className="lg:col-span-6 relative w-full"
        >
          <div className="w-full glass rounded-2xl border border-zinc-800/80 overflow-hidden shadow-premium bg-zinc-950/40 p-4 space-y-4">
            
            {/* Mock Header Navigation bar */}
            <div className="flex justify-between items-center pb-3 border-b border-zinc-900">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-red-500/80" />
                <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
                <div className="w-3 h-3 rounded-full bg-green-500/80" />
                <span className="text-[10px] text-zinc-500 font-semibold ml-2">Google Collaboration Core</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[9px] bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full text-emerald-400 font-bold flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Sync Connected
                </span>
              </div>
            </div>

            {/* Simulated Live Action Window */}
            <div className="grid grid-cols-12 gap-3 h-[250px]">
              
              {/* Mini task column */}
              <div className="col-span-7 bg-zinc-900/30 border border-zinc-900 p-2.5 rounded-xl flex flex-col justify-between">
                <div className="flex justify-between items-center pb-2">
                  <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider">Sprint Column (In Progress)</span>
                  <span className="text-[9px] bg-zinc-800 text-zinc-400 px-1.5 rounded">2</span>
                </div>
                
                {/* Floating draggable card */}
                <motion.div 
                  animate={{ y: [0, -10, 0] }}
                  transition={{ repeat: Infinity, duration: 6, ease: "easeInOut" }}
                  className="bg-card border border-zinc-800 p-3 rounded-lg shadow-premium cursor-grab relative overflow-hidden group text-left"
                >
                  <div className="flex justify-between items-center mb-1.5">
                    <span className="text-[8px] bg-purple-500/10 border border-purple-500/20 text-purple-400 px-1 rounded uppercase font-bold tracking-wider">MEDIUM</span>
                    <span className="text-[8px] text-zinc-500 font-bold">CME-FC2F</span>
                  </div>
                  <h4 className="text-[11px] font-bold text-white mb-1">Implement CDC outbox thread replication</h4>
                  <p className="text-[9px] text-zinc-500">Must guarantee transactional delivery...</p>
                  
                  {/* Cursor trailing shadow */}
                  <div className="absolute right-2 bottom-2 flex items-center gap-1">
                    <div className="w-4.5 h-4.5 rounded-full bg-purple-600 flex items-center justify-center text-[7px] font-bold text-white uppercase">AH</div>
                  </div>
                </motion.div>

                {/* Second card */}
                <div className="bg-card/50 border border-zinc-900/80 p-2.5 rounded-lg text-left">
                  <h4 className="text-[10px] font-bold text-zinc-400">Configure Prom & Grafana configurations</h4>
                  <div className="flex justify-between items-center mt-1.5">
                    <span className="text-[8px] text-zinc-600 font-bold">CME-AB95</span>
                    <div className="w-4 h-4 rounded-full bg-blue-600 flex items-center justify-center text-[6px] font-bold text-white">SA</div>
                  </div>
                </div>
              </div>

              {/* Chat and websocket notification sidebars */}
              <div className="col-span-5 flex flex-col gap-3">
                
                {/* Chat popups */}
                <div className="flex-1 bg-zinc-900/20 border border-zinc-900 p-2 rounded-xl flex flex-col justify-end gap-2 text-left">
                  <div className="flex items-start gap-1.5">
                    <div className="w-4 h-4 rounded bg-purple-600 shrink-0 flex items-center justify-center text-[7px] font-bold text-white">LA</div>
                    <div className="space-y-0.5">
                      <h5 className="text-[8px] font-bold text-zinc-300">Lead Architect</h5>
                      <p className="text-[9px] text-zinc-400 bg-zinc-900/50 p-1.5 rounded-lg border border-zinc-800">WebSocket heartbeats are rock solid.</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-1.5">
                    <div className="w-4 h-4 rounded bg-emerald-600 shrink-0 flex items-center justify-center text-[7px] font-bold text-white">DL</div>
                    <div className="space-y-0.5">
                      <h5 className="text-[8px] font-bold text-zinc-300">DevOps Lead</h5>
                      <p className="text-[9px] text-zinc-400 bg-zinc-900/50 p-1.5 rounded-lg border border-zinc-800">Kafka outbox events propagated.</p>
                    </div>
                  </div>
                </div>

                {/* Active user status widget */}
                <div className="h-[75px] bg-zinc-900/40 border border-zinc-900 p-2 rounded-xl flex flex-col justify-between">
                  <div className="flex justify-between items-center text-[8px] text-zinc-500 font-bold uppercase tracking-wider">
                    <span>Presence Awareness</span>
                    <span className="text-emerald-400 flex items-center gap-0.5">
                      <span className="w-1 h-1 rounded-full bg-emerald-400" />
                      3 Online
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="flex -space-x-1.5">
                      <div className="w-5 h-5 rounded-full bg-purple-500 border border-zinc-950 flex items-center justify-center text-[7px] font-bold text-white">LA</div>
                      <div className="w-5 h-5 rounded-full bg-blue-500 border border-zinc-950 flex items-center justify-center text-[7px] font-bold text-white">DL</div>
                      <div className="w-5 h-5 rounded-full bg-emerald-500 border border-zinc-950 flex items-center justify-center text-[7px] font-bold text-white">TE</div>
                    </div>
                    <span className="text-[8px] text-zinc-400 font-medium">Tariq typing doc...</span>
                  </div>
                </div>

              </div>

            </div>

          </div>

          {/* Absolute Background Glowing blur shapes */}
          <div className="absolute -bottom-8 -left-8 w-44 h-44 bg-purple-600/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -top-8 -right-8 w-44 h-44 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />
        </motion.div>
      </section>

      {/* ====================================================
          SECTION 2: LIVE COLLABORATIVE DOCS ENGINE SHOWCASE
          ==================================================== */}
      <section id="showcase" className="relative py-24 px-6 border-t border-zinc-900 bg-zinc-950/20">
        <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          
          {/* Left Column: Interactive editor window */}
          <div className="lg:col-span-7 relative w-full order-last lg:order-first">
            <div className="w-full glass rounded-2xl border border-zinc-800 overflow-hidden shadow-premium bg-zinc-950/50 p-6 flex flex-col min-h-[350px]">
              
              {/* Header details */}
              <div className="flex justify-between items-center border-b border-zinc-900 pb-4 mb-4">
                <div className="flex items-center gap-2">
                  <div className="p-1 rounded bg-amber-500/10 border border-amber-500/25 text-amber-400">
                    <FileText className="w-4 h-4" />
                  </div>
                  <h3 className="text-xs font-bold text-white">CME High-Latency Transaction Outbox Specification</h3>
                </div>
                
                {/* Save status badge */}
                <div>
                  {docSaveStatus === 'typing' && (
                    <span className="text-[10px] text-amber-400 flex items-center gap-1.5 bg-amber-500/5 px-2.5 py-1 rounded-full border border-amber-500/20">
                      <AlertCircle className="w-3.5 h-3.5 animate-pulse" />
                      {activeCollaborator} editing...
                    </span>
                  )}
                  {docSaveStatus === 'saving' && (
                    <span className="text-[10px] text-purple-400 flex items-center gap-1.5 bg-purple-500/5 px-2.5 py-1 rounded-full border border-purple-500/20 animate-pulse">
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      Autosaving...
                    </span>
                  )}
                  {docSaveStatus === 'saved' && (
                    <span className="text-[10px] text-emerald-400 flex items-center gap-1.5 bg-emerald-500/5 px-2.5 py-1 rounded-full border border-emerald-500/20">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Synced to Cloud
                    </span>
                  )}
                </div>
              </div>

              {/* Editable canvas container */}
              <div className="flex-1 text-left relative min-h-[220px] p-2">
                <div 
                  dangerouslySetInnerHTML={{ __html: docContent }}
                  className="w-full text-zinc-300 text-xs leading-relaxed font-sans prose prose-invert max-w-none focus:outline-none"
                />

                {/* Simulated Cursors Overlay mapping */}
                <motion.div 
                  animate={{ x: cursorPosition.x, y: cursorPosition.y }}
                  transition={{ duration: 0.8, ease: 'easeInOut' }}
                  className="absolute pointer-events-none flex flex-col items-start"
                >
                  <div className="w-0.5 h-4 bg-purple-500" />
                  <div className="px-1.5 py-0.5 rounded bg-purple-500 text-white text-[8px] font-bold mt-0.5 shadow-premium">
                    {activeCollaborator}
                  </div>
                </motion.div>
              </div>

              <div className="border-t border-zinc-900 pt-3 flex justify-between items-center text-[9px] text-zinc-600 font-semibold uppercase">
                <span>Notion Docs Engine • Concurrent Writers Synced</span>
                <span>Websocket Channel Active</span>
              </div>
            </div>
          </div>

          {/* Right Column: Descriptions */}
          <div className="lg:col-span-5 space-y-6 text-left">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center">
              <FileText className="w-5 h-5" />
            </div>
            
            <h2 className="text-3xl font-black text-white leading-tight tracking-tight">
              Real-time Document Collaboration Canvas
            </h2>
            
            <p className="text-sm text-zinc-400 leading-relaxed">
              Experience zero-conflict cooperative drafting. Our Notion-style editor synchronizes concurrent formatting, cursor presence indexes, and text updates seamlessly.
            </p>

            <ul className="space-y-3.5 text-xs text-zinc-300 font-medium">
              <li className="flex items-center gap-2.5">
                <div className="w-1.5 h-1.5 rounded-full bg-purple-500" />
                <span>**Stateful Cursors Presence Overlay**</span>
              </li>
              <li className="flex items-center gap-2.5">
                <div className="w-1.5 h-1.5 rounded-full bg-purple-500" />
                <span>**1.2-second Debounced Auto-Saving** to Mongo DB</span>
              </li>
              <li className="flex items-center gap-2.5">
                <div className="w-1.5 h-1.5 rounded-full bg-purple-500" />
                <span>**SockJS fallback logic** to long-poll transparently</span>
              </li>
            </ul>
          </div>

        </div>
      </section>

      {/* ====================================================
          SECTION 3: PREMIUM JIRA / LINEAR KANBAN BOARD SHOWCASE
          ==================================================== */}
      <section className="relative py-24 px-6 border-t border-zinc-900 bg-zinc-950/10">
        <div className="max-w-6xl mx-auto space-y-12">
          
          <div className="max-w-xl text-left space-y-4">
            <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400 flex items-center justify-center">
              <LayoutGrid className="w-5 h-5" />
            </div>
            <h2 className="text-3xl font-black text-white leading-tight tracking-tight">
              Linear-Engine Kanban Sprint Tracker
            </h2>
            <p className="text-sm text-zinc-400 leading-relaxed">
              Agile workflows mapped with strict transaction safety. Cards undergo version tracking inside PostgreSQL databases to guarantee concurrent consistency across teams.
            </p>
          </div>

          {/* Interactive Kanban Board mock */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
            {['To Do', 'In Progress', 'Done'].map((lane) => {
              const laneCards = kanbanCards.filter(c => c.lane === lane);
              return (
                <div key={lane} className="glass rounded-2xl border border-zinc-800/80 p-4 space-y-4 min-h-[220px] flex flex-col">
                  
                  {/* Column Header */}
                  <div className="flex justify-between items-center border-b border-zinc-900 pb-2">
                    <div className="flex items-center gap-2">
                      <span className={`w-2 h-2 rounded-full ${
                        lane === 'To Do' ? 'bg-zinc-500' : lane === 'In Progress' ? 'bg-purple-500' : 'bg-emerald-500'
                      }`} />
                      <span className="text-xs font-bold text-zinc-300 uppercase tracking-wider">{lane}</span>
                    </div>
                    <span className="text-[10px] text-zinc-500 font-bold bg-zinc-900 px-2 py-0.5 rounded">{laneCards.length}</span>
                  </div>

                  {/* Lane Card listings */}
                  <div className="space-y-3.5 flex-1">
                    <AnimatePresence mode="popLayout">
                      {laneCards.length === 0 ? (
                        <motion.div 
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          className="h-full flex items-center justify-center text-xs text-zinc-600 italic py-8"
                        >
                          Empty Lane
                        </motion.div>
                      ) : (
                        laneCards.map((card) => (
                          <motion.div
                            layout
                            key={card.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            transition={{ duration: 0.4 }}
                            className="bg-card border border-zinc-850 hover:border-zinc-700 p-3.5 rounded-xl shadow-premium relative group cursor-pointer transition-all"
                          >
                            <div className="flex justify-between items-center mb-2">
                              <span className={`text-[8px] px-1.5 py-0.5 rounded font-bold uppercase tracking-wider ${
                                card.priority === 'HIGH' ? 'bg-red-500/10 border border-red-500/20 text-red-400' :
                                card.priority === 'MEDIUM' ? 'bg-purple-500/10 border border-purple-500/20 text-purple-400' :
                                'bg-zinc-850 text-zinc-500 border border-zinc-800'
                              }`}>
                                {card.priority}
                              </span>
                              <span className="text-[8px] text-zinc-500 font-semibold">{card.id}</span>
                            </div>
                            <h4 className="text-xs font-bold text-white mb-2">{card.title}</h4>
                            <div className="flex justify-between items-center text-[8px] text-zinc-500">
                              <span>v0 version marker</span>
                              <div className="w-5 h-5 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center text-[7px] font-bold text-zinc-400 uppercase">
                                {card.user.substring(0,2)}
                              </div>
                            </div>
                          </motion.div>
                        ))
                      )}
                    </AnimatePresence>
                  </div>
                </div>
              );
            })}
          </div>

        </div>
      </section>

      {/* ====================================================
          SECTION 4: SLACK-STYLE CHAT PREVIEW MODULE
          ==================================================== */}
      <section className="relative py-24 px-6 border-t border-zinc-900 bg-zinc-950/20">
        <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          
          {/* Left Column: Description */}
          <div className="lg:col-span-5 space-y-6 text-left">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center">
              <MessageSquare className="w-5 h-5" />
            </div>
            
            <h2 className="text-3xl font-black text-white leading-tight tracking-tight">
              Slack-Style Instant Messages & Threads
            </h2>
            
            <p className="text-sm text-zinc-400 leading-relaxed">
              Channels, Direct Messages, and real-time events decoupling. Message streams are indexed inside MongoDB for rapid pagination, backed by Redis triggers to broadcast notifications to users instantly.
            </p>

            <div className="space-y-4 pt-2">
              <div className="flex items-center gap-3">
                <div className="w-7 h-7 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center text-[10px] text-indigo-400 font-bold">#</div>
                <div className="text-left">
                  <h4 className="text-xs font-bold text-white">#general</h4>
                  <p className="text-[10px] text-zinc-500">Global discussion channel</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-7 h-7 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center text-[10px] text-zinc-500 font-bold font-mono">lock</div>
                <div className="text-left">
                  <h4 className="text-xs font-bold text-zinc-300">#prod-outbox-sync</h4>
                  <p className="text-[10px] text-zinc-500">Private architecture chat</p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Chat interface */}
          <div className="lg:col-span-7 relative w-full">
            <div className="w-full glass rounded-2xl border border-zinc-800 overflow-hidden shadow-premium bg-zinc-950/50 p-5 flex flex-col min-h-[320px] justify-between">
              
              {/* Chat Header */}
              <div className="flex justify-between items-center border-b border-zinc-900 pb-3 mb-3">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-white">#general</span>
                  <span className="text-[9px] text-zinc-500">Watercooler and build logs</span>
                </div>
                <div className="text-[9px] text-zinc-600 font-bold uppercase tracking-wider">
                  MongoDB time-series repository
                </div>
              </div>

              {/* Chat Message List */}
              <div className="flex-1 space-y-4 text-left overflow-y-auto max-h-[200px] mb-4 pr-1">
                {chatMessages.map((msg, i) => (
                  <div key={i} className="flex items-start gap-2.5">
                    <div className={`w-6 h-6 rounded ${msg.avatar} shrink-0 flex items-center justify-center text-[9px] font-bold text-white uppercase`}>
                      {msg.sender.substring(0,2)}
                    </div>
                    <div className="space-y-0.5">
                      <div className="flex items-baseline gap-2">
                        <span className="text-[10px] font-bold text-zinc-300">{msg.sender}</span>
                        <span className="text-[8px] text-zinc-600">{msg.time}</span>
                      </div>
                      <p className="text-xs text-zinc-400 bg-zinc-900/40 p-2 rounded-lg border border-zinc-850 max-w-lg leading-relaxed">
                        {msg.text}
                      </p>
                    </div>
                  </div>
                ))}

                {/* Animated Typing Indicator */}
                {isTyping && (
                  <div className="flex items-center gap-2 text-zinc-500 text-[10px] font-semibold italic">
                    <span className="flex gap-0.5 items-center">
                      <span className="w-1 h-1 bg-zinc-500 rounded-full animate-bounce" />
                      <span className="w-1 h-1 bg-zinc-500 rounded-full animate-bounce [animation-delay:0.2s]" />
                      <span className="w-1 h-1 bg-zinc-500 rounded-full animate-bounce [animation-delay:0.4s]" />
                    </span>
                    <span>Sarah composing...</span>
                  </div>
                )}
              </div>

              {/* Message box mock input */}
              <div className="relative">
                <input 
                  type="text" 
                  disabled
                  placeholder="Message #general..." 
                  className="w-full bg-zinc-900 border border-zinc-850 px-4 py-2.5 rounded-xl text-xs focus:outline-none pr-10 text-zinc-400 italic"
                />
                <button disabled className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-500">
                  <Send className="w-3.5 h-3.5" />
                </button>
              </div>

            </div>
          </div>

        </div>
      </section>

      {/* ====================================================
          SECTION 5: DETAILED ARCHITECTURE EVENT STREAM SHOWCASE
          ==================================================== */}
      <section id="architecture" className="relative py-24 px-6 border-t border-zinc-900 bg-[#030303]">
        <div className="max-w-6xl mx-auto space-y-12">
          
          <div className="max-w-xl mx-auto text-center space-y-4">
            <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400 flex items-center justify-center mx-auto">
              <Network className="w-5 h-5" />
            </div>
            <h2 className="text-3xl font-black text-white tracking-tight">
              Event-Driven Monolithic Architecture
            </h2>
            <p className="text-sm text-zinc-400 leading-relaxed">
              Explore how transactions flow asynchronously through our modular components, leveraging Apache Kafka to coordinate decoupled events and database commits.
            </p>
          </div>

          {/* Dynamic SVG / Framer architecture visual mapping */}
          <div className="w-full glass rounded-2xl border border-zinc-850 p-8 shadow-premium bg-zinc-950/40 relative overflow-hidden">
            <div className="grid grid-cols-1 md:grid-cols-5 gap-8 items-center text-center relative z-10">
              
              {/* Frontend Node */}
              <div className="bg-card border border-zinc-800 p-4.5 rounded-xl relative shadow-premium flex flex-col items-center">
                <div className="w-8 h-8 rounded-lg bg-blue-600/10 border border-blue-500/20 text-blue-400 flex items-center justify-center mb-3">
                  <Code className="w-4 h-4" />
                </div>
                <h4 className="text-xs font-bold text-white mb-1">React Frontend Client</h4>
                <p className="text-[9px] text-zinc-500">Vite + Tailwind SPA</p>
                <div className="absolute -right-4 top-1/2 -translate-y-1/2 hidden md:block text-zinc-700">➔</div>
              </div>

              {/* API/WS Layer Node */}
              <div className="bg-card border border-zinc-800 p-4.5 rounded-xl relative shadow-premium flex flex-col items-center">
                <div className="w-8 h-8 rounded-lg bg-purple-600/10 border border-purple-500/20 text-purple-400 flex items-center justify-center mb-3">
                  <Terminal className="w-4 h-4" />
                </div>
                <h4 className="text-xs font-bold text-white mb-1">STOMP WebSockets</h4>
                <p className="text-[9px] text-zinc-500">Spring SockJS Config</p>
                <div className="absolute -right-4 top-1/2 -translate-y-1/2 hidden md:block text-zinc-700">➔</div>
              </div>

              {/* Core Monolith Node */}
              <div className="bg-card border border-purple-500/30 p-4.5 rounded-xl relative shadow-premium-glow flex flex-col items-center ring-1 ring-purple-500/20">
                <div className="w-8 h-8 rounded-lg bg-purple-500/20 border border-purple-500/40 text-purple-400 flex items-center justify-center mb-3 animate-pulse">
                  <Activity className="w-4 h-4 animate-spin [animation-duration:10s]" />
                </div>
                <h4 className="text-xs font-bold text-white mb-1">collab-core Monolith</h4>
                <p className="text-[9px] text-purple-400 font-semibold">Spring Boot 3 + JDK 17</p>
                <div className="absolute -right-4 top-1/2 -translate-y-1/2 hidden md:block text-zinc-700">➔</div>
              </div>

              {/* Decoupling Event Bus */}
              <div className="bg-card border border-zinc-800 p-4.5 rounded-xl relative shadow-premium flex flex-col items-center">
                <div className="w-8 h-8 rounded-lg bg-emerald-600/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center mb-3">
                  <Database className="w-4 h-4" />
                </div>
                <h4 className="text-xs font-bold text-white mb-1">Apache Kafka Bus</h4>
                <p className="text-[9px] text-zinc-500">Outbox Transaction logs</p>
                <div className="absolute -right-4 top-1/2 -translate-y-1/2 hidden md:block text-zinc-700">➔</div>
              </div>

              {/* Polyglot DB Storage Nodes */}
              <div className="bg-card border border-zinc-800 p-4.5 rounded-xl shadow-premium flex flex-col items-center gap-2">
                <div className="w-full bg-zinc-900 border border-zinc-850 p-2 rounded flex items-center gap-2">
                  <Database className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                  <div className="text-left">
                    <h5 className="text-[9px] font-bold text-white">PostgreSQL</h5>
                    <p className="text-[7px] text-zinc-500">Workspaces & Tasks</p>
                  </div>
                </div>
                <div className="w-full bg-zinc-900 border border-zinc-850 p-2 rounded flex items-center gap-2">
                  <Database className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <div className="text-left">
                    <h5 className="text-[9px] font-bold text-white">MongoDB</h5>
                    <p className="text-[7px] text-zinc-500">Chat History & Docs</p>
                  </div>
                </div>
                <div className="w-full bg-zinc-900 border border-zinc-850 p-2 rounded flex items-center gap-2">
                  <Database className="w-3.5 h-3.5 text-red-400 shrink-0" />
                  <div className="text-left">
                    <h5 className="text-[9px] font-bold text-white">Redis</h5>
                    <p className="text-[7px] text-zinc-500">Websocket Presence</p>
                  </div>
                </div>
              </div>

            </div>

            {/* Simulated moving light lines overlay inside SVG backgrounds */}
            <div className="absolute inset-0 z-0 pointer-events-none opacity-20">
              <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
                <path d="M 100 150 L 1000 150" fill="none" stroke="url(#gradient)" strokeWidth="2" strokeDasharray="6 6" />
                <defs>
                  <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#8b5cf6" />
                    <stop offset="100%" stopColor="#3b82f6" />
                  </linearGradient>
                </defs>
              </svg>
            </div>

          </div>

        </div>
      </section>

      {/* ====================================================
          SECTION 6: TECHNICAL FEATURES GRID
          ==================================================== */}
      <section id="features" className="relative py-24 px-6 border-t border-zinc-900 bg-zinc-950/10">
        <div className="max-w-6xl mx-auto space-y-12">
          
          <div className="max-w-xl text-left space-y-4">
            <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400 flex items-center justify-center">
              <Zap className="w-5 h-5" />
            </div>
            <h2 className="text-3xl font-black text-white tracking-tight">
              Production-Grade Key Features
            </h2>
            <p className="text-sm text-zinc-400 leading-relaxed">
              Designed to simulate high-throughput production environments, utilizing enterprise caching, event persistence, and eventual consistency triggers.
            </p>
          </div>

          {/* Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 text-left">
            
            {/* Feature 1 */}
            <div className="glass-card p-6 rounded-2xl border border-zinc-850 hover:border-zinc-700/80 transition-all shadow-premium group">
              <div className="w-8 h-8 rounded-lg bg-purple-500/10 border border-purple-500/20 text-purple-400 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <Activity className="w-4 h-4" />
              </div>
              <h4 className="text-sm font-bold text-white mb-2">Real-Time Sync Engine</h4>
              <p className="text-xs text-zinc-500 leading-relaxed">
                SockJS WebSockets utilizing STOMP protocol, ensuring sub-second state dissemination across active workspace connections.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="glass-card p-6 rounded-2xl border border-zinc-850 hover:border-zinc-700/80 transition-all shadow-premium group">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <Database className="w-4 h-4" />
              </div>
              <h4 className="text-sm font-bold text-white mb-2">Kafka Outbox Decoupling</h4>
              <p className="text-xs text-zinc-500 leading-relaxed">
                Domain events committed directly to PostgreSQL transactional outbox logs and streamed to Apache Kafka to prevent event loss.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="glass-card p-6 rounded-2xl border border-zinc-850 hover:border-zinc-700/80 transition-all shadow-premium group">
              <div className="w-8 h-8 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <Users className="w-4 h-4" />
              </div>
              <h4 className="text-sm font-bold text-white mb-2">Redis Presence Tracking</h4>
              <p className="text-xs text-zinc-500 leading-relaxed">
                Sub-millisecond presence indicators using key expiration indices to trace live active accounts and cursors.
              </p>
            </div>

            {/* Feature 4 */}
            <div className="glass-card p-6 rounded-2xl border border-zinc-850 hover:border-zinc-700/80 transition-all shadow-premium group">
              <div className="w-8 h-8 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <RefreshCw className="w-4 h-4" />
              </div>
              <h4 className="text-sm font-bold text-white mb-2">CRDT Replicated Conflict resolution</h4>
              <p className="text-xs text-zinc-500 leading-relaxed">
                Yjs-style state vector updates, syncing document content diffs asynchronously without requiring heavy server merge loops.
              </p>
            </div>

            {/* Feature 5 */}
            <div className="glass-card p-6 rounded-2xl border border-zinc-850 hover:border-zinc-700/80 transition-all shadow-premium group">
              <div className="w-8 h-8 rounded-lg bg-yellow-500/10 border border-yellow-500/20 text-yellow-400 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <Shield className="w-4 h-4" />
              </div>
              <h4 className="text-sm font-bold text-white mb-2">JPA Optimistic version locking</h4>
              <p className="text-xs text-zinc-500 leading-relaxed">
                Relational tables integrated with Version attributes, intercepting concurrent card updates safely at the database boundary.
              </p>
            </div>

            {/* Feature 6 */}
            <div className="glass-card p-6 rounded-2xl border border-zinc-850 hover:border-zinc-700/80 transition-all shadow-premium group">
              <div className="w-8 h-8 rounded-lg bg-pink-500/10 border border-pink-500/20 text-pink-400 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <Terminal className="w-4 h-4" />
              </div>
              <h4 className="text-sm font-bold text-white mb-2">Offline Reconnection Buffer</h4>
              <p className="text-xs text-zinc-500 leading-relaxed">
                Automatic retry sockets buffering client edits locally during temporary disconnects, pushing backlogs upon recovery.
              </p>
            </div>

          </div>

        </div>
      </section>

      {/* ====================================================
          SECTION 7: REAL-TIME LATENCY & SCALABILITY DASHBOARD
          ==================================================== */}
      <section id="performance" className="relative py-24 px-6 border-t border-zinc-900 bg-zinc-950/20">
        <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          
          {/* Left Column: Latency indicators */}
          <div className="lg:col-span-7 relative w-full">
            <div className="w-full glass rounded-2xl border border-zinc-850 p-6 shadow-premium bg-zinc-950/40 grid grid-cols-2 gap-4 text-left">
              
              {/* Latency meter */}
              <div className="bg-card border border-zinc-900 p-4.5 rounded-xl flex flex-col justify-between h-[130px] relative overflow-hidden">
                <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">WebSocket Latency</span>
                <div>
                  <h3 className="text-3xl font-black text-purple-400 tracking-tight">32ms</h3>
                  <p className="text-[9px] text-zinc-500">Average roundtrip execution</p>
                </div>
                <div className="w-full h-1 bg-purple-950 rounded-full overflow-hidden">
                  <div className="w-[30%] h-full bg-purple-500 animate-pulse" />
                </div>
              </div>

              {/* Event throughput */}
              <div className="bg-card border border-zinc-900 p-4.5 rounded-xl flex flex-col justify-between h-[130px] relative overflow-hidden">
                <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">Kafka Throughput</span>
                <div>
                  <h3 className="text-3xl font-black text-indigo-400 tracking-tight">1.2M</h3>
                  <p className="text-[9px] text-zinc-500">Processed operations/sec</p>
                </div>
                <div className="w-full h-1 bg-indigo-950 rounded-full overflow-hidden">
                  <div className="w-[85%] h-full bg-indigo-500" />
                </div>
              </div>

              {/* Database speed */}
              <div className="bg-card border border-zinc-900 p-4.5 rounded-xl flex flex-col justify-between h-[130px] col-span-2">
                <div className="flex justify-between items-center text-[10px] text-zinc-500 font-bold uppercase tracking-wider">
                  <span>Commit Duration Benchmark</span>
                  <span className="text-emerald-400 font-semibold">Sub-millisecond</span>
                </div>
                <div className="flex items-end gap-2.5 h-[60px] pt-2">
                  <div className="w-full bg-zinc-900 border border-zinc-850 h-[30%] rounded" />
                  <div className="w-full bg-zinc-900 border border-zinc-850 h-[45%] rounded" />
                  <div className="w-full bg-zinc-900 border border-zinc-850 h-[20%] rounded" />
                  <div className="w-full bg-purple-500/20 border border-purple-500/30 h-[80%] rounded animate-pulse" />
                  <div className="w-full bg-zinc-900 border border-zinc-850 h-[35%] rounded" />
                </div>
              </div>

            </div>
          </div>

          {/* Right Column: Descriptions */}
          <div className="lg:col-span-5 space-y-6 text-left">
            <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400 flex items-center justify-center">
              <Activity className="w-5 h-5" />
            </div>
            
            <h2 className="text-3xl font-black text-white leading-tight tracking-tight">
              Enterprise Performance Monitoring
            </h2>
            
            <p className="text-sm text-zinc-400 leading-relaxed">
              Track platform health inside Prometheus metrics. Visualized using customized dashboards configured dynamically to fetch from JMX microservices containers.
            </p>

            <ul className="space-y-3.5 text-xs text-zinc-300 font-medium">
              <li className="flex items-center gap-2.5">
                <div className="w-1.5 h-1.5 rounded-full bg-purple-500" />
                <span>**Zero-Refresh Collaboration UI state** updates</span>
              </li>
              <li className="flex items-center gap-2.5">
                <div className="w-1.5 h-1.5 rounded-full bg-purple-500" />
                <span>**Heartbeat signals checked dynamically** every 4000ms</span>
              </li>
            </ul>
          </div>

        </div>
      </section>

      {/* ====================================================
          SECTION 8: GLOBAL CMD + K COMMAND PALETTE SHOWCASE
          ==================================================== */}
      <section className="relative py-24 px-6 border-t border-zinc-900 bg-[#030303]">
        <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          
          {/* Left Column: Description */}
          <div className="lg:col-span-5 space-y-6 text-left">
            <div className="w-10 h-10 rounded-xl bg-zinc-800 border border-zinc-700 text-zinc-400 flex items-center justify-center">
              <Terminal className="w-5 h-5" />
            </div>
            
            <h2 className="text-3xl font-black text-white leading-tight tracking-tight">
              Keyboard-First Command Palette Navigator
            </h2>
            
            <p className="text-sm text-zinc-400 leading-relaxed">
              Access the entire platform through short-keys. Tap `CMD + K` to deploy search bars index, navigating across directories, channels, and documents instantly.
            </p>

            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-zinc-900 border border-zinc-800 text-[10px] text-zinc-500 font-bold">
              <span>Press</span>
              <kbd className="px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-300 font-mono text-[9px] border border-zinc-700">Ctrl</kbd>
              <span>+</span>
              <kbd className="px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-300 font-mono text-[9px] border border-zinc-700">K</kbd>
              <span>to trigger</span>
            </div>
          </div>

          {/* Right Column: Interactive Command Modal mockup */}
          <div className="lg:col-span-7 relative w-full">
            <div className="w-full glass rounded-2xl border border-zinc-800 overflow-hidden shadow-premium bg-zinc-950/60 p-4.5 text-left space-y-3.5">
              
              {/* Search Bar Input */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                <input 
                  type="text" 
                  disabled
                  value={cmdSearch}
                  placeholder="Search workspace directories, channels, docs..." 
                  className="w-full bg-zinc-900/80 border border-zinc-850 px-9 py-2.5 rounded-xl text-xs focus:outline-none text-zinc-200"
                />
              </div>

              {/* Option List Mock */}
              <div className="space-y-1">
                {cmdOptions.map((opt, i) => {
                  const isActive = i === cmdActiveIndex;
                  return (
                    <div 
                      key={i} 
                      className={`px-3 py-2.5 rounded-xl flex justify-between items-center transition-all ${
                        isActive ? 'bg-purple-500/10 border border-purple-500/20 text-white' : 'text-zinc-500 border border-transparent'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <Terminal className={`w-3.5 h-3.5 ${isActive ? 'text-purple-400' : 'text-zinc-600'}`} />
                        <span className="text-xs font-semibold">{opt.label}</span>
                      </div>
                      <span className="text-[8px] bg-zinc-900 border border-zinc-850 px-2 py-0.5 rounded font-bold uppercase tracking-wider text-zinc-500">
                        {opt.category}
                      </span>
                    </div>
                  );
                })}
              </div>

            </div>
          </div>

        </div>
      </section>

      {/* ====================================================
          SECTION 9: ACTIVITY REPLAY TIMELINE (GIT-STYLE EVENT STREAM)
          ==================================================== */}
      <section className="relative py-24 px-6 border-t border-zinc-900 bg-zinc-950/20">
        <div className="max-w-6xl mx-auto space-y-12">
          
          <div className="max-w-xl mx-auto text-center space-y-4">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto">
              <Activity className="w-5 h-5" />
            </div>
            <h2 className="text-3xl font-black text-white tracking-tight">
              Activity Replay Event Timeline
            </h2>
            <p className="text-sm text-zinc-400 leading-relaxed">
              A premium Git-style activity feed that records and replays workspace occurrences dynamically, demonstrating backend event propagation over WebSockets.
            </p>

            {/* Playback Controls */}
            <div className="flex items-center justify-center gap-3 pt-2">
              <button 
                onClick={() => setIsPlayingTimeline(!isPlayingTimeline)}
                className="flex items-center gap-1.5 px-4.5 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-850 border border-zinc-800 text-zinc-300 text-xs font-bold transition-all shadow-premium"
              >
                {isPlayingTimeline ? (
                  <>
                    <Pause className="w-3.5 h-3.5 text-zinc-400" />
                    <span>Pause Replay</span>
                  </>
                ) : (
                  <>
                    <Play className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
                    <span>Resume Auto Play</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Interactive Replay Container */}
          <div className="w-full glass rounded-2xl border border-zinc-850 p-6 shadow-premium bg-zinc-950/50 text-left space-y-6">
            
            {/* Timeline track */}
            <div className="space-y-4 relative pl-8 border-l border-zinc-900">
              
              {/* Highlight active line overlay */}
              <div 
                className="absolute top-0 left-0 bg-purple-500 transition-all duration-500 shadow-premium-glow" 
                style={{ 
                  width: '2px', 
                  height: `${((timelineIndex + 1) / timelineEvents.length) * 100}%`,
                  left: '-1px'
                }} 
              />

              {timelineEvents.map((evt, i) => {
                const isSelected = i === timelineIndex;
                return (
                  <div 
                    key={i} 
                    onClick={() => {
                      setIsPlayingTimeline(false);
                      setTimelineIndex(i);
                    }}
                    className={`p-4 rounded-xl border transition-all cursor-pointer relative group flex justify-between items-center ${
                      isSelected 
                        ? 'bg-purple-500/5 border-purple-500/35 shadow-premium' 
                        : 'bg-zinc-900/10 border-zinc-900 hover:border-zinc-800'
                    }`}
                  >
                    {/* Node marker pin */}
                    <div className={`absolute w-3 h-3 rounded-full -left-[37px] border-2 transition-all ${
                      isSelected 
                        ? 'bg-purple-500 border-zinc-950 shadow-premium-glow animate-pulse' 
                        : 'bg-zinc-950 border-zinc-900 group-hover:bg-zinc-850'
                    }`} />

                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                        evt.type === 'task' ? 'bg-purple-500/10 text-purple-400' :
                        evt.type === 'doc' ? 'bg-amber-500/10 text-amber-400' :
                        evt.type === 'chat' ? 'bg-indigo-500/10 text-indigo-400' :
                        'bg-emerald-500/10 text-emerald-400'
                      }`}>
                        {evt.type === 'task' && <LayoutGrid className="w-4.5 h-4.5" />}
                        {evt.type === 'doc' && <FileText className="w-4.5 h-4.5" />}
                        {evt.type === 'chat' && <MessageSquare className="w-4.5 h-4.5" />}
                        {evt.type === 'sys' && <Activity className="w-4.5 h-4.5" />}
                      </div>
                      <div className="space-y-0.5">
                        <h4 className={`text-xs font-bold transition-all ${isSelected ? 'text-white' : 'text-zinc-400'}`}>
                          {evt.text}
                        </h4>
                        <p className="text-[10px] text-zinc-500">{evt.desc}</p>
                      </div>
                    </div>

                    <span className="text-[9px] text-zinc-500 font-semibold">{evt.time}</span>
                  </div>
                );
              })}

            </div>

            {/* Replay track progression */}
            <div className="border-t border-zinc-900 pt-4 flex justify-between items-center text-[9px] text-zinc-600 font-bold uppercase tracking-wider">
              <span>Timeline Events Synced</span>
              <span>Step {timelineIndex + 1} of {timelineEvents.length}</span>
            </div>

          </div>

        </div>
      </section>

      {/* ====================================================
          SECTION 10: SMART NOTIFICATION PRIORITIZATION STACK
          ==================================================== */}
      <section className="relative py-24 px-6 border-t border-zinc-900 bg-[#030303]">
        <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          
          {/* Left Column: descriptions */}
          <div className="lg:col-span-5 space-y-6 text-left">
            <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400 flex items-center justify-center">
              <Bell className="w-5 h-5 text-purple-400 animate-pulse" />
            </div>
            
            <h2 className="text-3xl font-black text-white leading-tight tracking-tight">
              Futuristic Intelligent Notification Center
            </h2>
            
            <p className="text-sm text-zinc-400 leading-relaxed">
              Mitigate notification overload. Alerts undergo real-time priority stacking and contextual grouping, ensuring critical tags (like SLA breaches and personal mentions) flash prominently.
            </p>

            <ul className="space-y-3.5 text-xs text-zinc-300 font-medium">
              <li className="flex items-center gap-2.5">
                <div className="w-1.5 h-1.5 rounded-full bg-purple-500" />
                <span>**Priority escalation glows** for critical breaches</span>
              </li>
              <li className="flex items-center gap-2.5">
                <div className="w-1.5 h-1.5 rounded-full bg-purple-500" />
                <span>**Intelligent toast stacking transitions**</span>
              </li>
            </ul>
          </div>

          {/* Right Column: Floating dynamic alerts stack */}
          <div className="lg:col-span-7 relative w-full">
            <div className="w-full glass rounded-2xl border border-zinc-850 p-6 shadow-premium bg-zinc-950/40 min-h-[260px] flex flex-col justify-end gap-3 text-left">
              
              <AnimatePresence mode="popLayout">
                {notificationStack.map((notif, idx) => {
                  const isTop = idx === notificationStack.length - 1;
                  return (
                    <motion.div
                      layout
                      key={notif.id}
                      initial={{ opacity: 0, scale: 0.9, y: 15 }}
                      animate={{ 
                        opacity: isTop ? 1 : 0.6, 
                        scale: isTop ? 1 : 0.95,
                        y: 0 
                      }}
                      exit={{ opacity: 0, scale: 0.9, y: -15 }}
                      className={`p-4 rounded-xl border relative shadow-premium transition-all ${
                        notif.urgent 
                          ? 'bg-red-500/5 border-red-500/30' 
                          : 'bg-zinc-900 border-zinc-850'
                      }`}
                    >
                      {/* Urgent glow boundary indicator */}
                      {notif.urgent && (
                        <div className="absolute inset-0 bg-red-500/5 rounded-xl border border-red-500/10 animate-pulse pointer-events-none" />
                      )}

                      <div className="flex justify-between items-start">
                        <div className="flex items-center gap-2">
                          {notif.urgent ? (
                            <AlertCircle className="w-4.5 h-4.5 text-red-400 shrink-0" />
                          ) : (
                            <Bell className="w-4.5 h-4.5 text-purple-400 shrink-0" />
                          )}
                          <h4 className="text-xs font-bold text-white">{notif.title}</h4>
                        </div>
                        <span className={`text-[8px] px-1.5 rounded uppercase font-bold tracking-wider ${
                          notif.urgent ? 'bg-red-500/10 text-red-400' : 'bg-zinc-800 text-zinc-500'
                        }`}>
                          {notif.category}
                        </span>
                      </div>
                      <p className="text-[10px] text-zinc-400 mt-1.5 leading-relaxed">{notif.desc}</p>
                    </motion.div>
                  );
                })}
              </AnimatePresence>

            </div>
          </div>

        </div>
      </section>

      {/* ====================================================
          SECTION 11: DEVELOPER FIRST ENGINEERING MATRIX
          ==================================================== */}
      <section className="relative py-24 px-6 border-t border-zinc-900 bg-zinc-950/10">
        <div className="max-w-6xl mx-auto space-y-12">
          
          <div className="max-w-xl mx-auto text-center space-y-4">
            <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400 flex items-center justify-center mx-auto">
              <Code className="w-5 h-5" />
            </div>
            <h2 className="text-3xl font-black text-white tracking-tight">
              Developer-First Core Tech Stack
            </h2>
            <p className="text-sm text-zinc-400 leading-relaxed">
              No compromises. Built using the most robust frameworks and high-performance databases available for modern distributed workspaces.
            </p>
          </div>

          {/* Elegant Tech stack layout grid cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            
            {/* Spring Boot */}
            <div className="bg-card border border-zinc-850 p-4.5 rounded-xl shadow-premium relative group hover:border-purple-500/30 transition-all">
              <div className="w-8 h-8 rounded-lg bg-green-500/10 border border-green-500/20 text-green-400 flex items-center justify-center mb-3 mx-auto">
                <Activity className="w-4 h-4" />
              </div>
              <h4 className="text-xs font-bold text-white">Spring Boot 3</h4>
              <p className="text-[9px] text-zinc-500 mt-0.5">Java Monolith core</p>
            </div>

            {/* React */}
            <div className="bg-card border border-zinc-850 p-4.5 rounded-xl shadow-premium relative group hover:border-purple-500/30 transition-all">
              <div className="w-8 h-8 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center mb-3 mx-auto">
                <Code className="w-4 h-4" />
              </div>
              <h4 className="text-xs font-bold text-white">React + Vite</h4>
              <p className="text-[9px] text-zinc-500 mt-0.5">TypeScript Client SPA</p>
            </div>

            {/* Kafka */}
            <div className="bg-card border border-zinc-850 p-4.5 rounded-xl shadow-premium relative group hover:border-purple-500/30 transition-all">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center mb-3 mx-auto">
                <Database className="w-4 h-4" />
              </div>
              <h4 className="text-xs font-bold text-white">Apache Kafka</h4>
              <p className="text-[9px] text-zinc-500 mt-0.5">Event Broker Decoupler</p>
            </div>

            {/* Redis */}
            <div className="bg-card border border-zinc-850 p-4.5 rounded-xl shadow-premium relative group hover:border-purple-500/30 transition-all">
              <div className="w-8 h-8 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 flex items-center justify-center mb-3 mx-auto">
                <Zap className="w-4 h-4" />
              </div>
              <h4 className="text-xs font-bold text-white">Redis Cache</h4>
              <p className="text-[9px] text-zinc-500 mt-0.5">Presence awareness</p>
            </div>

          </div>

        </div>
      </section>

      {/* ====================================================
          SECTION 12: CINEMATIC GRADIENT CTA FOOTER
          ==================================================== */}
      <section className="relative py-24 px-6 border-t border-zinc-900 bg-gradient-to-t from-purple-950/20 via-background to-background text-center">
        <div className="max-w-4xl mx-auto space-y-8 relative z-10">
          
          <h2 className="text-4xl md:text-5xl font-black text-white tracking-tight leading-tight">
            Ready to explore the future <br />
            of workspace collaboration?
          </h2>

          <p className="text-sm text-zinc-400 max-w-xl mx-auto leading-relaxed">
            Experience our microservices outbox streaming, optimistic version checks, and concurrent editing pipelines live. Start your trial session immediately.
          </p>

          <div className="flex flex-wrap justify-center items-center gap-4 pt-2">
            <Link 
              to="/register" 
              className="px-8 py-3.5 rounded-xl bg-purple-500 hover:bg-purple-600 text-white font-bold text-sm shadow-premium-glow hover:scale-[1.02] transition-all flex items-center gap-2"
            >
              <span>Get Started Immediately</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link 
              to="/login" 
              className="px-6 py-3.5 rounded-xl border border-zinc-800 hover:border-zinc-700 bg-zinc-900/30 text-zinc-300 hover:text-white font-bold text-sm transition-all"
            >
              Sign In to Workspace
            </Link>
          </div>

          {/* Signature badge */}
          <div className="pt-12 text-zinc-700 text-[10px] font-bold uppercase tracking-widest flex items-center justify-center gap-2">
            <span>COLUMNS</span>
            <span>•</span>
            <span>CHATS</span>
            <span>•</span>
            <span>DOCUMENTS</span>
            <span>•</span>
            <span>ALERTS</span>
          </div>

        </div>

        {/* Absolute Glowing radial overlays */}
        <div className="absolute -bottom-16 left-1/2 -translate-x-1/2 w-full max-w-[800px] h-[300px] bg-purple-500/10 rounded-full blur-[120px] pointer-events-none" />
      </section>

      {/* Main Footer credits bar */}
      <footer className="py-8 px-6 border-t border-zinc-900 bg-zinc-950/40 text-xs text-zinc-500 font-semibold">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-zinc-850 border border-zinc-800 flex items-center justify-center text-[10px] text-zinc-300 font-black">CM</div>
            <span>© 2026 CollabMatrix Platform Inc. All rights reserved.</span>
          </div>
          <div className="flex items-center gap-6">
            <a href="#showcase" className="hover:text-zinc-300 transition-colors">Workspace Tools</a>
            <a href="#architecture" className="hover:text-zinc-300 transition-colors">Architecture</a>
            <a href="https://github.com" className="hover:text-zinc-300 transition-colors flex items-center gap-1">
              <span>GitHub</span>
            </a>
          </div>
        </div>
      </footer>

    </div>
  );
}
