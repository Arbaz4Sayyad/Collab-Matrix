import { useEffect, useState } from 'react';
import { taskApi } from '../services/task-api';
import type { Task } from '../services/task-api';
import { 
  Columns, 
  Plus, 
  Search, 
  Loader2, 
  Flag,
  Filter
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import TaskDetailDrawer from './task-detail-drawer';
import { useAuthStore } from '../../../store/auth-store';

type StatusType = 'TODO' | 'IN_PROGRESS' | 'DONE';

interface ColumnDef {
  id: StatusType;
  title: string;
  color: string;
  accentColor: string;
}

const COLUMNS: ColumnDef[] = [
  { id: 'TODO', title: 'To Do', color: 'bg-zinc-900 border-zinc-800', accentColor: 'text-zinc-400 bg-zinc-400/10 border-zinc-400/20' },
  { id: 'IN_PROGRESS', title: 'In Progress', color: 'bg-purple-950/10 border-purple-500/15', accentColor: 'text-primary bg-primary/10 border-primary/20' },
  { id: 'DONE', title: 'Done', color: 'bg-emerald-950/5 border-emerald-500/10', accentColor: 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20' }
];

export default function KanbanBoard() {
  const { user } = useAuthStore();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null);
  const [activeOverColumn, setActiveOverColumn] = useState<StatusType | null>(null);
  
  // Inline task creation state
  const [isAddingInCol, setIsAddingInCol] = useState<StatusType | null>(null);
  const [newTitle, setNewTitle] = useState('');

  // Celebrate on Done trigger state
  const [confettiActive, setConfettiActive] = useState(false);

  const activeProjectId = 'ed4b794b-f22e-4bcc-837a-5870bb0195d7'; // Mapped CME project id

  // Load tasks on mount
  const loadTasks = () => {
    setIsLoading(true);
    taskApi.getTasks(activeProjectId)
      .then(setTasks)
      .finally(() => setIsLoading(false));
  };

  useEffect(() => {
    loadTasks();
  }, []);

  const triggerConfetti = () => {
    setConfettiActive(true);
    setTimeout(() => setConfettiActive(false), 2200);
  };

  // HTML5 Drag and Drop Handlers
  const handleDragStart = (e: React.DragEvent, taskId: string) => {
    e.dataTransfer.setData('text/plain', taskId);
    setDraggedTaskId(taskId);
  };

  const handleDragOver = (e: React.DragEvent, columnId: StatusType) => {
    e.preventDefault();
    if (activeOverColumn !== columnId) {
      setActiveOverColumn(columnId);
    }
  };

  const handleDragLeave = () => {
    setActiveOverColumn(null);
  };

  const handleDrop = async (e: React.DragEvent, targetColumn: StatusType) => {
    e.preventDefault();
    setActiveOverColumn(null);
    const taskId = e.dataTransfer.getData('text/plain') || draggedTaskId;
    setDraggedTaskId(null);

    if (!taskId) return;

    // Find the task
    const task = tasks.find(t => t.id === taskId);
    if (!task || task.status === targetColumn) return;

    // Build automated state changes
    const updates: Partial<Task> = { status: targetColumn };
    
    if (targetColumn === 'IN_PROGRESS') {
      // Auto-assign to current user's profile UUID
      updates.assigneeId = user?.id || '3874f225-7e1f-4a24-ba45-0c21b1ee02df';
    }

    if (targetColumn === 'DONE') {
      // Trigger celebrate explosion
      triggerConfetti();
    }

    // Optimistic UI update on state
    const originalTasks = [...tasks];
    setTasks(prev => 
      prev.map(t => t.id === taskId ? { ...t, ...updates, version: t.version + 1 } : t)
    );

    try {
      await taskApi.updateTask(taskId, updates);
    } catch (err) {
      console.error('Optimistic state update collision resolved:', err);
      // Rollback to original if failure
      setTasks(originalTasks);
    }
  };

  // Create inline task submission
  const handleCreateTask = async (column: StatusType) => {
    if (!newTitle.trim()) return;

    const partialTask = {
      title: newTitle,
      description: 'Add details for this task.',
      status: column,
      priority: 'MEDIUM' as const,
      assigneeId: '3874f225-7e1f-4a24-ba45-0c21b1ee02df',
      projectId: activeProjectId
    };

    try {
      const created = await taskApi.createTask(activeProjectId, partialTask);
      setTasks(prev => [...prev, created]);
      setNewTitle('');
      setIsAddingInCol(null);
    } catch (err) {
      console.error('Create task failed:', err);
    }
  };

  // Filter tasks based on query
  const filteredTasks = tasks.filter(task => 
    task.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
    task.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getPriorityColor = (priority: 'LOW' | 'MEDIUM' | 'HIGH') => {
    switch (priority) {
      case 'HIGH': return 'text-red-400 bg-red-500/10 border-red-500/20';
      case 'MEDIUM': return 'text-amber-400 bg-amber-500/10 border-amber-500/20';
      case 'LOW': return 'text-zinc-400 bg-zinc-500/10 border-zinc-500/20';
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto flex flex-col h-full space-y-6 select-none font-sans text-left relative overflow-hidden">
      
      {/* Custom Styles Injection */}
      <style>{`
        @keyframes crimson-pulse {
          0%, 100% { box-shadow: 0 0 5px rgba(239, 68, 68, 0.25), inset 0 0 2px rgba(239, 68, 68, 0.15); border-color: rgba(239, 68, 68, 0.25); }
          50% { box-shadow: 0 0 16px rgba(239, 68, 68, 0.55), inset 0 0 6px rgba(239, 68, 68, 0.35); border-color: rgba(239, 68, 68, 0.65); }
        }
        .animate-crimson-pulse {
          animation: crimson-pulse 2s infinite ease-in-out;
        }
        @keyframes float-particle {
          0% { transform: translateY(0) scale(1) rotate(0deg); opacity: 1; }
          100% { transform: translate(var(--tx), var(--ty)) scale(0.65) rotate(var(--rot)); opacity: 0; }
        }
        .animate-particle {
          animation: float-particle 1.8s cubic-bezier(0.1, 0.85, 0.3, 1) forwards;
        }
      `}</style>

      {/* Confetti Explosion Overlay Container */}
      <AnimatePresence>
        {confettiActive && (
          <div className="absolute inset-0 pointer-events-none overflow-hidden z-40">
            {Array.from({ length: 45 }).map((_, i) => {
              const color = ['bg-purple-500', 'bg-blue-500', 'bg-pink-500', 'bg-emerald-500', 'bg-amber-500'][i % 5];
              const size = ['w-1.5 h-1.5', 'w-2 h-2', 'w-1 h-3'][i % 3];
              const left = Math.random() * 100;
              const delay = Math.random() * 0.45;
              const duration = 1.2 + Math.random() * 0.9;
              return (
                <div
                  key={i}
                  className={`absolute bottom-0 rounded-sm ${color} ${size} animate-particle`}
                  style={{
                    left: `${left}%`,
                    animationDelay: `${delay}s`,
                    animationDuration: `${duration}s`,
                    '--tx': `${(Math.random() - 0.5) * 260}px`,
                    '--ty': `-${380 + Math.random() * 220}px`,
                    '--rot': `${Math.random() * 360}deg`
                  } as any}
                />
              );
            })}
          </div>
        )}
      </AnimatePresence>

      {/* Search and Filters Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 shrink-0">
        <div className="space-y-1">
          <h1 className="text-3xl font-extrabold text-white tracking-tight flex items-center gap-2.5">
            <Columns className="w-7 h-7 text-primary" />
            CME Task Board
          </h1>
          <p className="text-xs text-muted-foreground">
            Project: CollabMatrix Engine (CME) • High-Priority SLA Indicators Active
          </p>
        </div>

        {/* Global Board Search */}
        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="relative w-full md:w-72">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-zinc-500">
              <Search className="w-4 h-4" />
            </div>
            <input
              type="text"
              placeholder="Search issues..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 rounded-lg bg-input border border-border text-white text-xs placeholder-zinc-500 focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-all"
            />
          </div>
          <button className="p-2 rounded-lg bg-zinc-950/20 border border-border text-zinc-400 hover:text-white transition-colors" title="Filters">
            <Filter className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Grid Kanban Columns */}
      {isLoading ? (
        <div className="flex-1 flex flex-col items-center justify-center min-h-[50vh] text-zinc-500 text-sm gap-2">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
          Loading Agile Task Columns...
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start flex-1">
          {COLUMNS.map((col) => {
            const colTasks = filteredTasks.filter(t => t.status === col.id);
            const isOver = activeOverColumn === col.id;

            return (
              <div 
                key={col.id}
                onDragOver={(e) => handleDragOver(e, col.id)}
                onDragLeave={handleDragLeave}
                onDrop={(e) => handleDrop(e, col.id)}
                className={`glass p-4 rounded-2xl border flex flex-col min-h-[500px] transition-all duration-300 ${
                  isOver 
                    ? 'border-primary/40 bg-purple-500/5 shadow-premium-glow shadow-purple-500/5 scale-[1.01]' 
                    : 'border-border bg-card/45'
                }`}
              >
                {/* Column Title Header */}
                <div className="flex justify-between items-center mb-4 pb-2 border-b border-border shrink-0">
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-0.5 rounded-full border text-[10px] font-bold ${col.accentColor}`}>
                      {col.title}
                    </span>
                    <span className="text-zinc-500 text-xs font-semibold">{colTasks.length}</span>
                  </div>
                  <button 
                    onClick={() => setIsAddingInCol(col.id)}
                    className="p-1 rounded hover:bg-zinc-800 text-zinc-400 hover:text-white transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>

                {/* Inline Card Creation Panel */}
                <AnimatePresence>
                  {isAddingInCol === col.id && (
                    <motion.div 
                      initial={{ opacity: 0, y: -5 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -5 }}
                      className="p-3 bg-zinc-950/30 border border-primary/20 rounded-xl mb-3 space-y-2 flex flex-col text-left"
                    >
                      <input 
                        type="text"
                        placeholder="What needs to be done?"
                        value={newTitle}
                        onChange={(e) => setNewTitle(e.target.value)}
                        className="w-full bg-input border border-border rounded px-2.5 py-1 text-xs text-white placeholder-zinc-500 focus:outline-none focus:ring-1 focus:ring-primary"
                        autoFocus
                        onKeyDown={(e) => { if (e.key === 'Enter') handleCreateTask(col.id); }}
                      />
                      <div className="flex gap-2 justify-end">
                        <button 
                          onClick={() => { setIsAddingInCol(null); setNewTitle(''); }}
                          className="px-2 py-1 rounded hover:bg-zinc-800 text-zinc-400 hover:text-white text-[10px] font-semibold"
                        >
                          Cancel
                        </button>
                        <button 
                          onClick={() => handleCreateTask(col.id)}
                          className="px-2.5 py-1 rounded bg-primary text-white text-[10px] font-semibold hover:bg-purple-600"
                        >
                          Add Card
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Tasks List */}
                <div className="flex-1 overflow-y-auto space-y-3 pr-1">
                  {colTasks.length === 0 ? (
                    <div className="text-zinc-600 text-xs text-center py-12 border border-dashed border-border rounded-xl">
                      Empty Lane
                    </div>
                  ) : (
                    colTasks.map((task) => {
                      const isHighSLA = task.priority === 'HIGH' && task.status === 'TODO';
                      return (
                        <div
                          key={task.id}
                          draggable
                          onDragStart={(e) => handleDragStart(e, task.id)}
                          onClick={() => setSelectedTask(task)}
                          className={`glass-card p-4 rounded-xl border transition-all shadow-premium cursor-grab active:cursor-grabbing hover:bg-zinc-950/20 group text-left relative overflow-hidden ${
                            isHighSLA 
                              ? 'animate-crimson-pulse border-red-500/40' 
                              : 'border-border/80 hover:border-primary/30'
                          }`}
                        >
                          {/* SLA Pulse Glowing Indicator badge */}
                          {isHighSLA && (
                            <div className="absolute top-0 right-0 left-0 h-0.5 bg-gradient-to-r from-red-500 via-rose-400 to-red-600 animate-pulse" />
                          )}

                          {/* Priority Banner Header */}
                          <div className="flex justify-between items-center mb-2.5">
                            <span className={`px-2 py-0.5 rounded border text-[9px] font-bold flex items-center gap-1 uppercase tracking-wider ${getPriorityColor(task.priority)}`}>
                              <Flag className="w-2.5 h-2.5" />
                              {task.priority}
                            </span>
                            <span className="text-[10px] text-zinc-650 font-bold uppercase tracking-wider">
                              {isHighSLA ? 'SLA Alert' : `v${task.version}`}
                            </span>
                          </div>

                          {/* Title & Description */}
                          <h3 className="text-sm font-semibold text-white tracking-tight leading-tight group-hover:text-primary transition-colors">
                            {task.title}
                          </h3>
                          <p className="text-[11px] text-zinc-500 leading-relaxed mt-1.5 line-clamp-2">
                            {task.description}
                          </p>

                          {/* Card footer details */}
                          <div className="mt-3.5 pt-2.5 border-t border-border flex justify-between items-center text-[10px] text-zinc-505 font-medium">
                            <span className="flex items-center gap-1 bg-zinc-800/40 px-2 py-0.5 rounded border border-border/30 text-zinc-400">
                              CME-{task.id.substring(0, 4).toUpperCase()}
                            </span>
                            
                            {/* Dynamically assigned user avatar */}
                            <div className="w-5.5 h-5.5 rounded-full bg-zinc-800 flex items-center justify-center text-zinc-300 font-extrabold border border-border text-[9px] uppercase tracking-wide">
                              {task.assigneeId === '3874f225-7e1f-4a24-ba45-0c21b1ee02df' ? 'SA' : (user?.username?.substring(0, 2).toUpperCase() || 'ME')}
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Task Drawer Display */}
      <AnimatePresence>
        {selectedTask && (
          <TaskDetailDrawer 
            task={selectedTask}
            onClose={() => setSelectedTask(null)}
            onUpdate={(updated) => {
              setTasks(prev => prev.map(t => t.id === updated.id ? updated : t));
              setSelectedTask(updated);
            }}
          />
        )}
      </AnimatePresence>

    </div>
  );
}
