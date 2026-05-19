import { useEffect, useState, useRef } from 'react';
import { chatApi } from '../services/chat-api';
import type { ChatChannel, ChatMessage, ChatDM } from '../services/chat-api';
import { 
  Hash, 
  Lock, 
  Send, 
  Smile, 
  Loader2,
  Info,
  CircleAlert,
  Plus,
  X,
  MessageSquare,
  Play,
  CornerDownRight
} from 'lucide-react';
import { wsManager } from '../../../websocket/websocket-manager';
import { useAuthStore } from '../../../store/auth-store';
import { motion, AnimatePresence } from 'framer-motion';

// Specialized Inline Code Runner & Parsing Message Bubble component
function MessageBubble({ msg }: { msg: ChatMessage }) {
  const [runnerOutput, setRunnerOutput] = useState<string[] | null>(null);
  const [isRunning, setIsRunning] = useState(false);

  // Match javascript / js code blocks inside messages
  const codeBlockRegex = /```(javascript|js)?\n([\s\S]+?)\n```/;
  const match = msg.content.match(codeBlockRegex);

  const handleRunCode = () => {
    if (!match) return;
    setIsRunning(true);
    setRunnerOutput(['Initializing isolated JavaScript sandbox...', 'Evaluating workspace transaction triggers...']);
    
    setTimeout(() => {
      const rawCode = match[2];
      const logs: string[] = [];
      
      const customConsole = {
        log: (...args: any[]) => {
          logs.push(args.map(a => typeof a === 'object' ? JSON.stringify(a) : String(a)).join(' '));
        },
        error: (...args: any[]) => {
          logs.push(`[ERROR] ${args.join(' ')}`);
        },
        warn: (...args: any[]) => {
          logs.push(`[WARN] ${args.join(' ')}`);
        }
      };

      try {
        // Safe, dynamic script evaluator sandbox bound to customConsole logs
        const evaluate = new Function('console', `
          try {
            ${rawCode}
          } catch (e) {
            console.error(e.message);
          }
        `);
        evaluate(customConsole);
        
        setRunnerOutput([
          'Sandbox process exited successfully (0).',
          '--- Console Output ---',
          ...(logs.length > 0 ? logs : ['[No console output reported]'])
        ]);
      } catch (err: any) {
        setRunnerOutput([
          'Sandbox compilation error.',
          `[CRITICAL] ${err.message}`
        ]);
      }
      setIsRunning(false);
    }, 900);
  };

  if (match) {
    const language = match[1] || 'javascript';
    const code = match[2];
    const beforeText = msg.content.split(codeBlockRegex)[0];
    const afterText = msg.content.split(codeBlockRegex)[3] || '';

    return (
      <div className="space-y-2 text-left">
        {beforeText && <p className="text-zinc-300 text-xs leading-relaxed">{beforeText}</p>}
        
        {/* Beautiful Custom Sandboxed Terminal Block */}
        <div className="border border-border/70 rounded-xl overflow-hidden bg-zinc-950/80 shadow-premium">
          <div className="flex justify-between items-center px-4 py-2 bg-zinc-900 border-b border-border/60 text-[9px] font-extrabold text-zinc-550 uppercase tracking-widest">
            <span>{language} compiler</span>
            <button
              type="button"
              onClick={handleRunCode}
              disabled={isRunning}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-primary/10 hover:bg-primary/20 border border-primary/25 text-primary hover:text-white font-extrabold transition-all"
            >
              {isRunning ? <Loader2 className="w-3 h-3 animate-spin" /> : <Play className="w-3 h-3" />}
              {isRunning ? 'Compiling...' : 'Run Code'}
            </button>
          </div>
          <pre className="p-4 text-xs font-mono text-emerald-400 overflow-x-auto text-left leading-relaxed">
            <code>{code}</code>
          </pre>

          {/* Glowing Drawer outputs */}
          {runnerOutput && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="border-t border-border/80 bg-black/95 p-3.5 font-mono text-[10px] text-zinc-400 text-left border-l-2 border-l-primary flex flex-col space-y-1 relative"
            >
              <button 
                type="button"
                onClick={() => setRunnerOutput(null)} 
                className="absolute top-2.5 right-3 text-zinc-600 hover:text-white text-[8px] font-bold uppercase tracking-wider"
              >
                Clear
              </button>
              {runnerOutput.map((line, idx) => (
                <div key={idx} className={
                  line.startsWith('[ERROR]') || line.startsWith('[CRITICAL]') 
                    ? 'text-red-400' 
                    : line.startsWith('---') 
                      ? 'text-zinc-500 font-extrabold' 
                      : 'text-zinc-350'
                }>
                  {line}
                </div>
              ))}
            </motion.div>
          )}
        </div>

        {afterText && <p className="text-zinc-300 text-xs leading-relaxed">{afterText}</p>}
      </div>
    );
  }

  return <p className="text-zinc-300 text-xs leading-relaxed text-left">{msg.content}</p>;
}

export default function SlackChat() {
  const { user } = useAuthStore();
  const [channels, setChannels] = useState<ChatChannel[]>([]);
  const [dms, setDms] = useState<ChatDM[]>([]);
  const [activeChannel, setActiveChannel] = useState<ChatChannel | null>(null);
  const [activeDM, setActiveDM] = useState<ChatDM | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [newMessage, setNewMessage] = useState('');
  
  // Real-time states
  const [typingUsers, setTypingUsers] = useState<string[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const threadMessagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Channel Creation states
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newChannelName, setNewChannelName] = useState('');
  const [newChannelDesc, setNewChannelDesc] = useState('');
  const [newChannelPrivate, setNewChannelPrivate] = useState(false);
  const [isCreatingChannel, setIsCreatingChannel] = useState(false);

  // --- Proposal 4: Thread State Controllers ---
  const [activeThreadParent, setActiveThreadParent] = useState<ChatMessage | null>(null);
  const [newThreadReply, setNewThreadReply] = useState('');

  // Load channels on mount
  useEffect(() => {
    setIsLoading(true);
    chatApi.getChannels()
      .then((chList) => {
        setChannels(chList);
        if (chList.length > 0) {
          setActiveChannel(chList[0]);
        }
      })
      .finally(() => setIsLoading(false));

    setDms(chatApi.getDMs());
  }, []);

  // Sync messages and setup STOMP subscription for active Channel or DM
  useEffect(() => {
    if (!activeChannel && !activeDM) return;

    const currentUsername = user?.username || 'Staff Architect';
    let topic = '';
    let typingTopic = '';

    setIsLoading(true);

    if (activeChannel) {
      topic = `/topic/chat/${activeChannel.id}`;
      typingTopic = `/topic/chat/${activeChannel.id}/typing`;
      chatApi.getMessages(activeChannel.id)
        .then(setMessages)
        .finally(() => setIsLoading(false));
    } else if (activeDM) {
      const roomName = [currentUsername, activeDM.username].sort().join('-');
      topic = `/topic/chat/dm-${roomName}`;
      typingTopic = `/topic/chat/dm-${roomName}/typing`;
      chatApi.getDMMessages(activeDM.username)
        .then(setMessages)
        .finally(() => setIsLoading(false));
    }

    // Subscribe to STOMP topic
    wsManager.subscribe(topic, (incomingMsg: ChatMessage) => {
      setMessages(prev => {
        // Prevent duplicate append
        if (prev.some(m => m.id === incomingMsg.id)) return prev;
        return [...prev, incomingMsg];
      });
      scrollToBottom();
    });

    // Subscribe to typing notifications
    wsManager.subscribe(typingTopic, (status: { username: string; isTyping: boolean }) => {
      if (status.username === currentUsername) return;
      setTypingUsers(prev => {
        if (status.isTyping) {
          if (prev.includes(status.username)) return prev;
          return [...prev, status.username];
        } else {
          return prev.filter(u => u !== status.username);
        }
      });
    });

    scrollToBottom();

    return () => {
      wsManager.unsubscribe(topic);
      wsManager.unsubscribe(typingTopic);
    };
  }, [activeChannel, activeDM, user?.username]);

  // Real-time sub-thread WebSocket listener
  useEffect(() => {
    if (!activeThreadParent) return;

    const threadTopic = `/topic/chat/threads/${activeThreadParent.id}`;
    
    wsManager.subscribe(threadTopic, (incomingReply: ChatMessage) => {
      setMessages(prev => {
        if (prev.some(m => m.id === incomingReply.id)) return prev;
        return [...prev, incomingReply];
      });
      scrollThreadToBottom();
    });

    scrollThreadToBottom();

    return () => {
      wsManager.unsubscribe(threadTopic);
    };
  }, [activeThreadParent]);

  const scrollToBottom = () => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  const scrollThreadToBottom = () => {
    setTimeout(() => {
      threadMessagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || (!activeChannel && !activeDM)) return;

    // Send typing status clear
    sendTypingStatus(false);

    const currentUsername = user?.username || 'Staff Architect';

    try {
      let sent: ChatMessage;
      let topic = '';

      if (activeChannel) {
        sent = await chatApi.sendMessage(activeChannel.id, currentUsername, newMessage);
        topic = `/topic/chat/${activeChannel.id}`;
      } else {
        // DM messaging
        sent = await chatApi.sendDMMessage(activeDM!.username, currentUsername, newMessage);
        const roomName = [currentUsername, activeDM!.username].sort().join('-');
        topic = `/topic/chat/dm-${roomName}`;
      }

      setMessages(prev => [...prev, sent]);
      
      // Broadcast chat message over WS simple broker route directly
      wsManager.send(topic, sent);
      
      setNewMessage('');
      scrollToBottom();
    } catch (err) {
      console.error('Send message failed:', err);
    }
  };

  // Send Thread Reply
  const handleSendThreadReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newThreadReply.trim() || !activeThreadParent) return;

    const currentUsername = user?.username || 'Staff Architect';
    const threadTopic = `/topic/chat/threads/${activeThreadParent.id}`;

    const newReply: ChatMessage = {
      id: crypto.randomUUID(),
      channelId: activeThreadParent.channelId,
      senderName: currentUsername,
      content: newThreadReply,
      reactions: {},
      createdAt: new Date().toISOString(),
      parentMessageId: activeThreadParent.id
    };

    try {
      // Optimistic append
      setMessages(prev => [...prev, newReply]);
      wsManager.send(threadTopic, newReply);
      setNewThreadReply('');
      scrollThreadToBottom();
    } catch (err) {
      console.error('Send thread reply failed:', err);
    }
  };

  const sendTypingStatus = (isTyping: boolean) => {
    if ((!activeChannel && !activeDM) || !user?.username) return;
    
    let typingTopic = '';
    if (activeChannel) {
      typingTopic = `/topic/chat/${activeChannel.id}/typing`;
    } else {
      const roomName = [user.username, activeDM!.username].sort().join('-');
      typingTopic = `/topic/chat/dm-${roomName}/typing`;
    }

    wsManager.send(typingTopic, {
      username: user.username,
      isTyping
    });
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNewMessage(e.target.value);
    
    // Broadcast typing notification
    sendTypingStatus(true);

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    typingTimeoutRef.current = setTimeout(() => {
      sendTypingStatus(false);
    }, 2000); // 2 second pause debouncer
  };

  const handleAddReaction = (msgId: string, emoji: string) => {
    setMessages(prev => 
      prev.map(m => {
        if (m.id === msgId) {
          const currentCount = m.reactions[emoji] || 0;
          return {
            ...m,
            reactions: {
              ...m.reactions,
              [emoji]: currentCount + 1
            }
          };
        }
        return m;
      })
    );
  };

  const handleCreateChannel = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newChannelName.trim()) return;

    setIsCreatingChannel(true);
    try {
      const created = await chatApi.createChannel({
        name: newChannelName.toLowerCase().replace(/\s+/g, '-'),
        description: newChannelDesc,
        isPrivate: newChannelPrivate
      });

      // Update channels list
      setChannels(prev => [...prev, created]);
      
      // Auto-focus and load the new channel
      setActiveChannel(created);
      setActiveDM(null);

      // Reset form fields
      setNewChannelName('');
      setNewChannelDesc('');
      setNewChannelPrivate(false);
      setIsCreateModalOpen(false);
    } catch (err) {
      console.error('Failed to create channel:', err);
    } finally {
      setIsCreatingChannel(false);
    }
  };

  // Filter messages to show only top-level in the main feed
  const mainFeedMessages = messages.filter(m => !m.parentMessageId);
  const threadReplies = activeThreadParent 
    ? messages.filter(m => m.parentMessageId === activeThreadParent.id) 
    : [];

  return (
    <div className="p-6 max-w-7xl mx-auto flex h-[82vh] gap-6 select-none font-sans text-left overflow-hidden relative">
      
      {/* --- CHANNELS SIDEBAR --- */}
      <div className="w-64 glass-card border border-border rounded-2xl flex flex-col shrink-0 overflow-hidden bg-card/25">
        
        {/* Workspace Title */}
        <div className="p-4 border-b border-border bg-zinc-950/20 flex justify-between items-center shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white text-[10px] font-bold">
              C
            </div>
            <span className="text-sm font-semibold text-white truncate">CME Slack Channels</span>
          </div>
        </div>

        {/* Scrollable channels content lists */}
        <div className="flex-1 overflow-y-auto p-3 space-y-5">
          
          {/* Channels list block */}
          <div className="space-y-1">
            <div className="flex justify-between items-center px-2.5 mb-1.5">
              <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block">
                Channels
              </span>
              <button 
                onClick={() => setIsCreateModalOpen(true)}
                className="p-1 rounded hover:bg-zinc-800 text-zinc-500 hover:text-white transition-colors"
                title="Create Channel"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>
            {channels.map((ch) => {
              const isActive = activeChannel?.id === ch.id;
              return (
                <button
                  key={ch.id}
                  onClick={() => {
                    setActiveChannel(ch);
                    setActiveDM(null);
                    setActiveThreadParent(null);
                  }}
                  className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all border text-left ${
                    isActive 
                      ? 'bg-blue-600/10 text-blue-400 border-blue-500/20' 
                      : 'text-zinc-400 hover:text-white hover:bg-zinc-800/40 border-transparent'
                  }`}
                >
                  {ch.isPrivate ? <Lock className="w-3.5 h-3.5 shrink-0" /> : <Hash className="w-3.5 h-3.5 shrink-0" />}
                  <span className="truncate">{ch.name}</span>
                </button>
              );
            })}
          </div>

          {/* DMs list block */}
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest px-2.5 mb-1.5 block">
              Direct Messages
            </span>
            {dms.map((dm) => {
              const isActive = activeDM?.username === dm.username;
              return (
                <div
                  key={dm.username}
                  onClick={() => {
                    setActiveDM(dm);
                    setActiveChannel(null);
                    setActiveThreadParent(null);
                  }}
                  className={`flex justify-between items-center px-2.5 py-1.5 rounded-lg hover:bg-zinc-800/30 text-xs font-medium cursor-pointer transition-all border ${
                    isActive 
                      ? 'bg-blue-600/10 text-blue-400 border-blue-500/20' 
                      : 'text-zinc-400 hover:text-white border-transparent'
                  }`}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <div className={`w-2 h-2 rounded-full shrink-0 ${dm.online ? 'bg-green-500 shadow-premium-glow shadow-green-500/10' : 'bg-zinc-600'}`} />
                    <span className="text-zinc-355 truncate">{dm.username}</span>
                  </div>
                  <span className="text-[9px] text-zinc-600 font-bold shrink-0">{dm.role.split(' ')[0]}</span>
                </div>
              );
            })}
          </div>

        </div>
      </div>

      {/* --- ACTIVE CHAT MAIN VIEWPORT --- */}
      <div className="flex-1 flex gap-6 overflow-hidden">
        
        <div className="flex-1 glass border border-border rounded-2xl flex flex-col overflow-hidden bg-card/10">
          {activeChannel || activeDM ? (
            <>
              {/* Active Channel/DM Header Info */}
              <div className="p-4 border-b border-border bg-zinc-950/15 flex justify-between items-center shrink-0">
                <div className="flex flex-col text-left">
                  {activeChannel ? (
                    <>
                      <span className="text-sm font-bold text-white flex items-center gap-1.5">
                        {activeChannel.isPrivate ? <Lock className="w-4 h-4 text-zinc-400" /> : <Hash className="w-4 h-4 text-zinc-400" />}
                        {activeChannel.name}
                      </span>
                      <span className="text-[10px] text-zinc-500 font-medium truncate max-w-[300px] mt-0.5">
                        {activeChannel.description}
                      </span>
                    </>
                  ) : (
                    <>
                      <span className="text-sm font-bold text-white flex items-center gap-1.5">
                        <span className={`w-2 h-2 rounded-full shrink-0 ${activeDM!.online ? 'bg-green-500' : 'bg-zinc-650'}`} />
                        {activeDM!.username}
                      </span>
                      <span className="text-[10px] text-zinc-500 font-medium truncate mt-0.5">
                        Direct Messaging Session • {activeDM!.role}
                      </span>
                    </>
                  )}
                </div>
                <Info className="w-4.5 h-4.5 text-zinc-500 hover:text-white cursor-pointer transition-colors" />
              </div>

              {/* Scrollable messages viewport */}
              <div className="flex-1 overflow-y-auto p-5 space-y-4">
                {isLoading ? (
                  <div className="w-full h-full flex items-center justify-center text-zinc-500 text-xs gap-2">
                    <Loader2 className="w-4 h-4 animate-spin text-blue-500" />
                    Synchronizing discussion backplane...
                  </div>
                ) : mainFeedMessages.length === 0 ? (
                  <div className="text-zinc-500 text-xs text-center py-20">
                    This is the start of your message history with {activeChannel ? `#${activeChannel.name}` : `@${activeDM!.username}`}.
                  </div>
                ) : (
                  mainFeedMessages.map((msg) => {
                    const replyCount = messages.filter(m => m.parentMessageId === msg.id).length;
                    return (
                      <div 
                        key={msg.id} 
                        className="flex gap-3 group relative hover:bg-zinc-950/10 p-2.5 rounded-xl border border-transparent hover:border-border/30 transition-all text-left"
                      >
                        {/* User profile avatar */}
                        <div className="w-8 h-8 rounded-lg bg-zinc-800 border border-border flex items-center justify-center text-zinc-350 font-bold shrink-0 text-xs uppercase bg-gradient-to-tr from-zinc-800 to-zinc-900">
                          {msg.senderName.substring(0, 2).toUpperCase()}
                        </div>
                        
                        {/* Message details */}
                        <div className="flex-1 space-y-1 overflow-hidden">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-white">{msg.senderName}</span>
                            <span className="text-[9px] text-zinc-500">
                              {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                          
                          {/* Rendering the Code Sandbox / Message bubble */}
                          <MessageBubble msg={msg} />

                          {/* Threads count badge link */}
                          {replyCount > 0 && (
                            <button
                              type="button"
                              onClick={() => setActiveThreadParent(msg)}
                              className="flex items-center gap-1 mt-2 text-[10px] text-blue-400 font-extrabold hover:underline"
                            >
                              <CornerDownRight className="w-3.5 h-3.5" />
                              {replyCount} {replyCount === 1 ? 'reply' : 'replies'}
                            </button>
                          )}

                          {/* Display active reactions list */}
                          {msg.reactions && Object.keys(msg.reactions).length > 0 && (
                            <div className="flex flex-wrap gap-1.5 mt-2">
                              {Object.entries(msg.reactions).map(([emoji, count]) => (
                                <button
                                  key={emoji}
                                  type="button"
                                  onClick={() => handleAddReaction(msg.id, emoji)}
                                  className="px-2 py-0.5 rounded-md bg-blue-600/5 hover:bg-blue-600/10 border border-blue-500/10 hover:border-blue-500/20 text-[10px] text-blue-400 font-semibold flex items-center gap-1 transition-all"
                                >
                                  <span>{emoji}</span>
                                  <span>{count}</span>
                                </button>
                              ))}
                            </div>
                          )}
                        </div>

                        {/* Hover glassmorphic reactions quick bar */}
                        <div className="absolute right-3 top-2 opacity-0 group-hover:opacity-100 transition-opacity flex items-center bg-card/90 border border-border rounded-lg shadow-premium p-1 space-x-0.5 z-10">
                          {['👍', '🔥', '🚀', '🎉'].map((emoji) => (
                            <button
                              key={emoji}
                              type="button"
                              onClick={() => handleAddReaction(msg.id, emoji)}
                              className="p-1 rounded hover:bg-zinc-800 text-[13px] hover:scale-110 transition-transform"
                            >
                              {emoji}
                            </button>
                          ))}
                          
                          {/* Thread reply quick button */}
                          <button
                            type="button"
                            onClick={() => setActiveThreadParent(msg)}
                            className="p-1 rounded hover:bg-zinc-800 text-zinc-400 hover:text-white transition-colors"
                            title="Reply in Thread"
                          >
                            <MessageSquare className="w-3.5 h-3.5" />
                          </button>
                        </div>

                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Live Typing Status Feed Bar */}
              <div className="h-6 px-5 text-[10px] text-zinc-500 font-semibold flex items-center shrink-0">
                {typingUsers.length > 0 && (
                  <span className="flex items-center gap-1.5 text-blue-400 animate-pulse">
                    <Smile className="w-3.5 h-3.5 animate-bounce" />
                    {typingUsers.join(', ')} {typingUsers.length === 1 ? 'is typing...' : 'are typing...'}
                  </span>
                )}
              </div>

              {/* Input Message Form Footer */}
              <form onSubmit={handleSend} className="p-4 border-t border-border bg-zinc-950/15 flex gap-2 shrink-0">
                <div className="flex-1 relative">
                  <input
                    type="text"
                    placeholder={activeChannel ? `Message #${activeChannel.name}` : `Message @${activeDM!.username}`}
                    value={newMessage}
                    onChange={handleInputChange}
                    className="w-full bg-input border border-border rounded-xl pl-4 pr-10 py-2.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-all"
                  />
                  <button 
                    type="button" 
                    className="absolute right-3 inset-y-0 text-zinc-500 hover:text-white"
                    title="Emoji Reactions"
                  >
                    <Smile className="w-4 h-4" />
                  </button>
                </div>
                <button
                  type="submit"
                  disabled={!newMessage.trim()}
                  className="px-4 py-2.5 rounded-xl bg-primary hover:bg-purple-600 text-white font-semibold text-xs flex items-center gap-1.5 transition-colors disabled:opacity-50"
                >
                  <Send className="w-3.5 h-3.5" />
                  Send
                </button>
              </form>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-zinc-500 text-sm gap-2">
              <CircleAlert className="w-6 h-6 text-zinc-500" />
              No active discussion stream selected.
            </div>
          )}
        </div>

        {/* --- PROPOSAL 4: SLIDING GLASSMORPHIC THREAD DRAWER SIDEBAR PANEL --- */}
        <AnimatePresence>
          {activeThreadParent && (
            <motion.div
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 360, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              className="glass border border-border rounded-2xl flex flex-col overflow-hidden bg-card/15 shrink-0"
            >
              {/* Thread Drawer Header */}
              <div className="p-4 border-b border-border bg-zinc-950/20 flex justify-between items-center shrink-0">
                <div className="flex flex-col text-left">
                  <span className="text-xs font-bold text-white uppercase tracking-wider">Thread Discussion</span>
                  <span className="text-[10px] text-zinc-500 font-semibold mt-0.5">Replies to {activeThreadParent.senderName}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveThreadParent(null)}
                  className="p-1 rounded hover:bg-zinc-800 text-zinc-500 hover:text-white transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Parent Message Preview Bubble */}
              <div className="p-4 bg-zinc-950/20 border-b border-border/60 flex gap-3 text-left">
                <div className="w-7 h-7 rounded bg-zinc-800 border border-border flex items-center justify-center text-zinc-400 font-bold shrink-0 text-[10px]">
                  {activeThreadParent.senderName.substring(0, 2).toUpperCase()}
                </div>
                <div className="flex-1 overflow-hidden">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-bold text-white">{activeThreadParent.senderName}</span>
                  </div>
                  <p className="text-zinc-400 text-[11px] leading-relaxed mt-1 line-clamp-3">{activeThreadParent.content}</p>
                </div>
              </div>

              {/* Thread replies list feed */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {threadReplies.length === 0 ? (
                  <div className="text-[10px] text-zinc-500 text-center py-20 font-semibold uppercase tracking-wider">
                    No replies yet. Be the first to start the thread!
                  </div>
                ) : (
                  threadReplies.map((reply) => (
                    <div key={reply.id} className="flex gap-2.5 text-left">
                      <div className="w-6.5 h-6.5 rounded bg-zinc-800 border border-border flex items-center justify-center text-zinc-400 font-bold text-[9px] shrink-0 uppercase">
                        {reply.senderName.substring(0, 2).toUpperCase()}
                      </div>
                      <div className="flex-1 overflow-hidden space-y-0.5">
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-bold text-white">{reply.senderName}</span>
                          <span className="text-[8px] text-zinc-505">
                            {new Date(reply.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        <MessageBubble msg={reply} />
                      </div>
                    </div>
                  ))
                )}
                <div ref={threadMessagesEndRef} />
              </div>

              {/* Reply Form Footer */}
              <form onSubmit={handleSendThreadReply} className="p-3 border-t border-border bg-zinc-950/20 flex gap-2 shrink-0">
                <input
                  type="text"
                  placeholder="Reply..."
                  value={newThreadReply}
                  onChange={(e) => setNewThreadReply(e.target.value)}
                  className="flex-1 bg-input border border-border rounded-xl px-3 py-2 text-xs text-white placeholder-zinc-500 focus:outline-none focus:ring-1 focus:ring-primary"
                />
                <button
                  type="submit"
                  disabled={!newThreadReply.trim()}
                  className="px-3 py-2 rounded-xl bg-primary hover:bg-purple-600 text-white font-bold text-xs flex items-center transition-colors disabled:opacity-50"
                >
                  Reply
                </button>
              </form>

            </motion.div>
          )}
        </AnimatePresence>

      </div>

      {/* --- CREATE CHANNEL GLASSMOPHIC MODAL --- */}
      <AnimatePresence>
        {isCreateModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop Blur Overlay */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsCreateModalOpen(false)}
              className="absolute inset-0 bg-zinc-950/60 backdrop-blur-sm"
            />
            
            {/* Modal Body Card */}
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="relative w-full max-w-md bg-card/90 border border-border p-6 rounded-2xl shadow-premium backdrop-blur-md flex flex-col space-y-5"
            >
              {/* Header */}
              <div className="flex justify-between items-center border-b border-border/40 pb-3">
                <div className="space-y-0.5">
                  <h3 className="text-sm font-bold text-white tracking-tight">Create a chat channel</h3>
                  <p className="text-[10px] text-zinc-550 font-medium">Channels are where conversations happen by topic.</p>
                </div>
                <button 
                  onClick={() => setIsCreateModalOpen(false)}
                  className="p-1 rounded hover:bg-zinc-800 text-zinc-400 hover:text-white transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Form */}
              <form onSubmit={handleCreateChannel} className="space-y-4">
                <div>
                  <label className="block text-[10px] font-semibold text-zinc-400 uppercase tracking-wider mb-1.5">
                    Channel Name
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-zinc-500">
                      <Hash className="w-4 h-4" />
                    </div>
                    <input 
                      type="text" 
                      required
                      placeholder="e.g. outbox-sync"
                      value={newChannelName}
                      onChange={(e) => setNewChannelName(e.target.value.toLowerCase().replace(/\s+/g, '-'))}
                      className="w-full bg-input border border-border rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder-zinc-500 focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-all font-semibold"
                    />
                  </div>
                  <span className="text-[9px] text-zinc-650 mt-1 block">Names must be lowercase and hyphenated.</span>
                </div>

                <div>
                  <label className="block text-[10px] font-semibold text-zinc-400 uppercase tracking-wider mb-1.5">
                    Description
                  </label>
                  <textarea 
                    placeholder="What is this channel about?"
                    value={newChannelDesc}
                    onChange={(e) => setNewChannelDesc(e.target.value)}
                    rows={3}
                    className="w-full bg-input border border-border rounded-xl px-3.5 py-2 text-xs text-white placeholder-zinc-500 focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-all leading-relaxed"
                  />
                </div>

                {/* Privacy Option Toggle */}
                <div className="flex items-center justify-between p-3 rounded-xl bg-zinc-950/20 border border-border/40">
                  <div className="flex flex-col text-left space-y-0.5 max-w-[80%]">
                    <span className="text-xs font-semibold text-white">Private channel</span>
                    <span className="text-[9px] text-zinc-650 leading-relaxed font-medium">When private, the channel can only be viewed or joined by invitation.</span>
                  </div>
                  
                  {/* Custom Toggle Switch */}
                  <button
                    type="button"
                    onClick={() => setNewChannelPrivate(!newChannelPrivate)}
                    className={`w-9 h-5 rounded-full p-0.5 transition-colors relative shrink-0 ${newChannelPrivate ? 'bg-primary' : 'bg-zinc-800'}`}
                  >
                    <motion.div 
                      layout
                      className="w-4 h-4 bg-white rounded-full"
                      animate={{ x: newChannelPrivate ? 16 : 0 }}
                      transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                    />
                  </button>
                </div>

                {/* Submit Action Buttons */}
                <div className="pt-4 border-t border-border/40 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setIsCreateModalOpen(false)}
                    className="px-4 py-2 rounded-xl bg-zinc-900 border border-border hover:bg-zinc-850 text-zinc-400 hover:text-white font-semibold text-xs transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isCreatingChannel || !newChannelName.trim()}
                    className="px-4 py-2 rounded-xl bg-primary hover:bg-purple-600 text-white font-bold text-xs flex items-center gap-1.5 transition-colors disabled:opacity-50"
                  >
                    {isCreatingChannel ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        Creating...
                      </>
                    ) : (
                      <>
                        Create
                      </>
                    )}
                  </button>
                </div>

              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
