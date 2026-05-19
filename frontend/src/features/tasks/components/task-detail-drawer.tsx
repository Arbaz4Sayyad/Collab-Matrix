import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { 
  X, 
  Tag, 
  AlertCircle, 
  User, 
  MessageSquarePlus, 
  Loader2,
  Clock
} from 'lucide-react';
import { taskApi } from '../services/task-api';
import type { Task, Comment } from '../services/task-api';
import { useAuthStore } from '../../../store/auth-store';

interface TaskDetailDrawerProps {
  task: Task;
  onClose: () => void;
  onUpdate: (updatedTask: Task) => void;
}

export default function TaskDetailDrawer({ task, onClose, onUpdate }: TaskDetailDrawerProps) {
  const { user } = useAuthStore();
  const [title, setTitle] = useState(task.title);
  const [description, setDescription] = useState(task.description);
  const [priority, setPriority] = useState(task.priority);
  const [status, setStatus] = useState(task.status);
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);
  const [isCommentsLoading, setIsCommentsLoading] = useState(false);

  // Load comments on mount
  useEffect(() => {
    setIsCommentsLoading(true);
    taskApi.getComments(task.id)
      .then(setComments)
      .finally(() => setIsCommentsLoading(false));
  }, [task.id]);

  const handleSaveDetails = async () => {
    setIsUpdating(true);
    try {
      const updated = await taskApi.updateTask(task.id, {
        title,
        description,
        priority,
        status
      });
      onUpdate(updated);
    } catch (err) {
      console.error('Update task error:', err);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    try {
      const added = await taskApi.addComment(task.id, user?.username || 'Staff Architect', newComment);
      setComments((prev) => [...prev, added]);
      setNewComment('');
    } catch (err) {
      console.error('Add comment error:', err);
    }
  };

  return (
    <>
      {/* Backdrop overlay */}
      <div 
        className="fixed inset-0 bg-background/60 backdrop-blur-sm z-40 transition-all duration-300"
        onClick={onClose}
      />

      {/* Right Drawer Panel */}
      <motion.div
        initial={{ x: '100%' }}
        animate={{ x: 0 }}
        exit={{ x: '100%' }}
        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
        className="fixed top-0 right-0 h-full w-full md:w-[500px] bg-card border-l border-border z-50 flex flex-col shadow-premium font-sans"
      >
        {/* Drawer Header */}
        <div className="p-5 border-b border-border flex items-center justify-between shrink-0 bg-zinc-950/20">
          <div className="flex flex-col text-left">
            <span className="text-[10px] text-zinc-500 font-bold tracking-widest uppercase">Task Details</span>
            <span className="text-xs text-primary font-medium mt-0.5">{task.id}</span>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-zinc-800 text-zinc-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Form Viewport */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 text-left">
          
          {/* Title Input */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Title</label>
            <input 
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onBlur={handleSaveDetails}
              className="w-full bg-input border border-border rounded-lg px-3 py-2 text-white text-base focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>

          {/* Grid Metadata */}
          <div className="grid grid-cols-2 gap-4 bg-zinc-950/15 p-4 rounded-xl border border-border">
            
            {/* Status Option */}
            <div className="space-y-1.5">
              <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest flex items-center gap-1.5">
                <Tag className="w-3.5 h-3.5" />
                Status
              </span>
              <select 
                value={status}
                onChange={(e) => { setStatus(e.target.value as any); setTimeout(handleSaveDetails, 100); }}
                className="w-full bg-zinc-900 border border-border rounded-lg px-2 py-1.5 text-xs text-white focus:outline-none"
              >
                <option value="TODO">To Do</option>
                <option value="IN_PROGRESS">In Progress</option>
                <option value="DONE">Done</option>
              </select>
            </div>

            {/* Priority Option */}
            <div className="space-y-1.5">
              <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest flex items-center gap-1.5">
                <AlertCircle className="w-3.5 h-3.5" />
                Priority
              </span>
              <select 
                value={priority}
                onChange={(e) => { setPriority(e.target.value as any); setTimeout(handleSaveDetails, 100); }}
                className="w-full bg-zinc-900 border border-border rounded-lg px-2 py-1.5 text-xs text-white focus:outline-none"
              >
                <option value="LOW">Low</option>
                <option value="MEDIUM">Medium</option>
                <option value="HIGH">High</option>
              </select>
            </div>

          </div>

          {/* Description Block */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Description</label>
            <textarea 
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              onBlur={handleSaveDetails}
              className="w-full bg-input border border-border rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-1 focus:ring-primary resize-none"
              placeholder="Add details for this task..."
            />
          </div>

          {/* System metadata */}
          <div className="flex items-center gap-6 text-zinc-500 text-[11px] font-medium py-2 border-b border-border">
            <span className="flex items-center gap-1">
              <User className="w-3.5 h-3.5" />
              Assignee: <span className="text-zinc-300 ml-1">Staff Architect</span>
            </span>
            <span className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" />
              Ver: <span className="text-zinc-300 ml-1">{task.version}</span>
            </span>
          </div>

          {/* Comments Panel */}
          <div className="space-y-4">
            <div className="text-sm font-semibold text-white tracking-tight flex items-center gap-2">
              <MessageSquarePlus className="w-4.5 h-4.5 text-zinc-400" />
              Discussion Feed
            </div>

            {/* Comment Form */}
            <form onSubmit={handleAddComment} className="flex gap-2">
              <input 
                type="text"
                placeholder="Write a comment..."
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                className="flex-1 bg-input border border-border rounded-lg px-3 py-1.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:ring-1 focus:ring-primary"
              />
              <button 
                type="submit"
                disabled={!newComment.trim()}
                className="px-3 py-1.5 rounded-lg bg-primary hover:bg-purple-600 text-white font-semibold text-xs transition-colors disabled:opacity-50"
              >
                Send
              </button>
            </form>

            {/* Comments List */}
            <div className="space-y-3.5 mt-2">
              {isCommentsLoading ? (
                <div className="flex items-center gap-2 text-zinc-500 text-xs py-4 justify-center">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Loading discussion thread...
                </div>
              ) : comments.length === 0 ? (
                <div className="text-zinc-500 text-xs text-center py-4">
                  No comments yet. Start the conversation!
                </div>
              ) : (
                comments.map((comment) => (
                  <div key={comment.id} className="p-3 bg-zinc-950/15 border border-border rounded-xl space-y-1 text-xs">
                    <div className="flex justify-between items-center text-zinc-500">
                      <span className="font-semibold text-white">{comment.authorName}</span>
                      <span className="text-[10px]">{new Date(comment.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                    <p className="text-zinc-300 text-[13px] leading-relaxed mt-1 text-left">{comment.content}</p>
                  </div>
                ))
              )}
            </div>
          </div>

        </div>

        {/* Drawer footer details */}
        {isUpdating && (
          <div className="p-3 bg-primary/10 border-t border-primary/20 text-primary text-[10px] font-semibold text-center flex items-center justify-center gap-2">
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
            Optimistic UI Syncing with PostgreSQL Backplane...
          </div>
        )}
      </motion.div>
    </>
  );
}
