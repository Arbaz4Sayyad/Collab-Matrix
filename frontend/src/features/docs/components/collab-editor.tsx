import { useEffect, useState, useRef } from 'react';
import { docApi } from '../services/doc-api';
import type { Document, DocumentUser } from '../services/doc-api';
import { 
  FileText, 
  Bold, 
  Italic, 
  Heading1, 
  Heading2, 
  Code, 
  List, 
  Loader2, 
  Users,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { wsManager } from '../../../websocket/websocket-manager';

export default function CollabEditor() {
  const [document, setDocument] = useState<Document | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'typing'>('saved');
  const [collaborators] = useState<DocumentUser[]>([
    { username: 'Lead Architect', color: 'bg-purple-500 border-purple-400', cursorIndex: 120 },
    { username: 'DevOps Lead', color: 'bg-blue-500 border-blue-400', cursorIndex: 280 }
  ]);
  const [showCollaborators, setShowCollaborators] = useState(false);
  const editorRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const docId = 'cme-spec-doc-2026';

  // Load document on mount and subscribe to WebSockets
  useEffect(() => {
    setIsLoading(true);
    docApi.getDocument(docId)
      .then((doc) => {
        setDocument(doc);
        if (editorRef.current) {
          editorRef.current.innerHTML = doc.content;
        }
      })
      .finally(() => setIsLoading(false));

    // Connect to WebSocket updates topic
    wsManager.subscribe(`/topic/documents/${docId}`, (updatedDoc: Document) => {
      setDocument(updatedDoc);
      // Synchronize editor window content if not actively typing
      if (editorRef.current && saveStatus === 'saved') {
        const selection = window.getSelection();
        const range = selection && selection.rangeCount > 0 ? selection.getRangeAt(0) : null;
        const currentCursorOffset = range ? range.startOffset : 0;
        
        editorRef.current.innerHTML = updatedDoc.content;

        // Restore cursor position if possible
        if (range && selection) {
          try {
            const newRange = window.document.createRange();
            newRange?.setStart(editorRef.current.firstChild || editorRef.current, Math.min(currentCursorOffset, editorRef.current.innerText.length));
            newRange?.collapse(true);
            selection.removeAllRanges();
            selection.addRange(newRange!);
          } catch {
            // Safe fallback
          }
        }
      }
    });

    return () => {
      wsManager.unsubscribe(`/topic/documents/${docId}`);
    };
  }, [docId, saveStatus]);

  // Handle rich text formatting actions
  const executeCommand = (command: string, value: string = '') => {
    window.document.execCommand(command, false, value);
    handleContentChange();
  };

  const handleContentChange = () => {
    setSaveStatus('typing');
    
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    typingTimeoutRef.current = setTimeout(async () => {
      if (!editorRef.current) return;
      setSaveStatus('saving');
      
      const newContent = editorRef.current.innerHTML;
      
      try {
        const updated = await docApi.saveDocument(docId, {
          content: newContent
        });
        setDocument(updated);

        // Broadcast content updates over WS backplane
        wsManager.send(`/topic/documents/${docId}`, updated);
        
        setSaveStatus('saved');
      } catch (err) {
        console.error('Document sync failed:', err);
        setSaveStatus('saved');
      }
    }, 1200); // Autosave debounce period
  };

  return (
    <div className="p-8 max-w-5xl mx-auto flex flex-col h-full space-y-6 font-sans text-left">
      
      {/* Editor Header Navigation */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 shrink-0 border-b border-border pb-5">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400">
              <FileText className="w-5 h-5" />
            </div>
            <h1 className="text-xl font-bold text-white tracking-tight">
              {document?.title || 'Loading Notion Document...'}
            </h1>
          </div>
          <p className="text-[10px] text-zinc-500 font-medium">
            Notion Docs • Concurrent Writers Session Enabled
          </p>
        </div>

        {/* Sync Status Indicators */}
        <div className="flex items-center gap-4 w-full md:w-auto self-end md:self-center justify-between md:justify-end">
          
          {/* Active users awareness badge */}
          <div className="relative">
            <button 
              onClick={() => setShowCollaborators(!showCollaborators)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-zinc-950/20 border border-border text-zinc-400 hover:text-white text-xs font-semibold transition-colors"
            >
              <Users className="w-4 h-4" />
              <span>{collaborators.length + 1} Online</span>
            </button>

            {/* Collaborators list popover */}
            <AnimatePresence>
              {showCollaborators && (
                <>
                  <div className="fixed inset-0 z-15" onClick={() => setShowCollaborators(false)} />
                  <motion.div 
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 5 }}
                    className="absolute right-0 mt-2 z-20 w-56 bg-card border border-border rounded-xl shadow-premium p-2 space-y-1"
                  >
                    <div className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest px-2.5 py-1.5 border-b border-border">
                      Active Collaborators
                    </div>
                    <div className="flex justify-between items-center px-2.5 py-2 hover:bg-zinc-800/40 rounded-lg">
                      <div className="flex items-center gap-2">
                        <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 shrink-0" />
                        <span className="text-xs text-white font-medium">Staff Architect (You)</span>
                      </div>
                      <span className="text-[9px] text-zinc-500 font-bold">Owner</span>
                    </div>
                    {collaborators.map((c) => (
                      <div key={c.username} className="flex justify-between items-center px-2.5 py-2 hover:bg-zinc-800/40 rounded-lg">
                        <div className="flex items-center gap-2">
                          <div className={`w-2.5 h-2.5 rounded-full ${c.color.split(' ')[0]} shrink-0`} />
                          <span className="text-xs text-zinc-300 font-medium">{c.username}</span>
                        </div>
                        <span className="text-[9px] text-zinc-500 font-bold">Writer</span>
                      </div>
                    ))}
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>

          {/* Sync Saving Banner */}
          <div className="text-xs font-semibold shrink-0">
            {saveStatus === 'saved' && (
              <span className="text-emerald-400 flex items-center gap-1.5 bg-emerald-500/5 px-2.5 py-1 rounded-full border border-emerald-500/20">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Synced to Cloud
              </span>
            )}
            {saveStatus === 'saving' && (
              <span className="text-primary flex items-center gap-1.5 bg-purple-500/5 px-2.5 py-1 rounded-full border border-primary/20 animate-pulse">
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                Autosaving...
              </span>
            )}
            {saveStatus === 'typing' && (
              <span className="text-amber-400 flex items-center gap-1.5 bg-amber-500/5 px-2.5 py-1 rounded-full border border-amber-500/20">
                <AlertCircle className="w-3.5 h-3.5 animate-pulse" />
                Typing...
              </span>
            )}
          </div>

        </div>
      </div>

      {/* Editor Content Area */}
      {isLoading ? (
        <div className="flex-1 flex flex-col items-center justify-center min-h-[40vh] text-zinc-500 text-sm gap-2">
          <Loader2 className="w-6 h-6 animate-spin text-amber-500" />
          Synchronizing document session...
        </div>
      ) : (
        <div className="glass rounded-2xl border border-border flex flex-col overflow-hidden bg-card/30 flex-1 min-h-[450px]">
          
          {/* Format Control Toolbar */}
          <div className="p-3 bg-zinc-950/20 border-b border-border flex flex-wrap gap-1 items-center shrink-0">
            <button 
              onClick={() => executeCommand('bold')}
              className="p-1.5 rounded hover:bg-zinc-800 text-zinc-400 hover:text-white transition-colors"
              title="Bold"
            >
              <Bold className="w-4 h-4" />
            </button>
            <button 
              onClick={() => executeCommand('italic')}
              className="p-1.5 rounded hover:bg-zinc-800 text-zinc-400 hover:text-white transition-colors"
              title="Italic"
            >
              <Italic className="w-4 h-4" />
            </button>
            <div className="w-px h-4 bg-border mx-1" />
            <button 
              onClick={() => executeCommand('formatBlock', '<h1>')}
              className="p-1.5 rounded hover:bg-zinc-800 text-zinc-400 hover:text-white transition-colors text-xs font-bold"
              title="Heading 1"
            >
              <Heading1 className="w-4 h-4" />
            </button>
            <button 
              onClick={() => executeCommand('formatBlock', '<h2>')}
              className="p-1.5 rounded hover:bg-zinc-800 text-zinc-400 hover:text-white transition-colors text-xs font-bold"
              title="Heading 2"
            >
              <Heading2 className="w-4 h-4" />
            </button>
            <div className="w-px h-4 bg-border mx-1" />
            <button 
              onClick={() => executeCommand('insertUnorderedList')}
              className="p-1.5 rounded hover:bg-zinc-800 text-zinc-400 hover:text-white transition-colors"
              title="Bullet List"
            >
              <List className="w-4 h-4" />
            </button>
            <button 
              onClick={() => executeCommand('formatBlock', '<pre>')}
              className="p-1.5 rounded hover:bg-zinc-800 text-zinc-400 hover:text-white transition-colors"
              title="Code Block"
            >
              <Code className="w-4 h-4" />
            </button>
          </div>

          {/* Editable Canvas Block */}
          <div className="flex-1 p-8 relative overflow-y-auto min-h-[350px]">
            <div 
              ref={editorRef}
              contentEditable
              onInput={handleContentChange}
              className="w-full h-full text-zinc-200 text-sm leading-relaxed focus:outline-none prose prose-invert max-w-none prose-headings:text-white prose-h1:text-2xl prose-h2:text-xl prose-p:my-2 prose-pre:bg-zinc-950 prose-pre:border prose-pre:border-border prose-pre:p-4 prose-pre:rounded-xl"
              style={{ minHeight: '300px' }}
            />

            {/* High-Fidelity Floating Awareness Cursors (Dynamic Mock Cursors Overlay) */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden">
              {/* Lead Architect Cursor Bubble */}
              <div 
                className="absolute top-[215px] left-[320px] flex flex-col items-start transition-all duration-500"
              >
                {/* Simulated cursor mark line */}
                <div className="w-0.5 h-4.5 bg-purple-500 animate-pulse" />
                {/* Floating user tag */}
                <div className="px-1.5 py-0.5 rounded bg-purple-500 text-white text-[9px] font-semibold mt-0.5 shadow-premium">
                  Lead Architect
                </div>
              </div>

              {/* DevOps Lead Cursor Bubble */}
              <div 
                className="absolute top-[380px] left-[480px] flex flex-col items-start transition-all duration-500"
              >
                <div className="w-0.5 h-4.5 bg-blue-500 animate-pulse" />
                <div className="px-1.5 py-0.5 rounded bg-blue-500 text-white text-[9px] font-semibold mt-0.5 shadow-premium">
                  DevOps Lead
                </div>
              </div>
            </div>

          </div>

        </div>
      )}

      {/* Editor Page footer details */}
      <div className="text-zinc-600 text-[11px] font-medium flex justify-between items-center px-2">
        <span>Last edit: {document ? new Date(document.updatedAt).toLocaleTimeString() : 'Unknown'}</span>
        <span>Secured Connection over STOMP Channel</span>
      </div>

    </div>
  );
}
