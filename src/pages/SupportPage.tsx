import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { MessageSquare, Send, ChevronRight, AlertCircle, Headphones, ArrowLeft } from 'lucide-react';
import { useAuthStore } from '../stores/authStore';
import { supportRepository } from '../repositories/supportRepository';
import type { SupportTicket, SupportMessage } from '../schemas/support.schema';
import { useToastStore } from '../stores/toastStore';
import { formatDateTime } from '../utils/datetime';

export default function SupportPage() {
  const { user } = useAuthStore();
  const { addToast } = useToastStore();

  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);
  const [messages, setMessages] = useState<SupportMessage[]>([]);
  const [loadingTickets, setLoadingTickets] = useState(true);

  // Form State
  const [subject, setSubject] = useState('');
  const [category, setCategory] = useState<'portfolio' | 'billing' | 'technical' | 'advisory' | 'general'>('general');
  const [priority, setPriority] = useState<'low' | 'medium' | 'high' | 'urgent'>('medium');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Reply State
  const [replyText, setReplyText] = useState('');
  const [isSendingReply, setIsSendingReply] = useState(false);

  // Subscribe to user tickets
  useEffect(() => {
    if (!user?.uid) return;
    setLoadingTickets(true);
    const unsubscribe = supportRepository.subscribeToUserTickets(user.uid, (data) => {
      setTickets(data);
      setLoadingTickets(false);
      if (selectedTicket) {
        const updated = data.find(t => t.id === selectedTicket.id);
        if (updated) setSelectedTicket(updated);
      }
    });

    return () => unsubscribe();
  }, [user?.uid]);

  // Subscribe to messages when ticket is selected
  useEffect(() => {
    if (!selectedTicket) {
      setMessages([]);
      return;
    }
    const unsubscribe = supportRepository.subscribeToTicketMessages(selectedTicket.id, (msgs) => {
      setMessages(msgs);
    });

    return () => unsubscribe();
  }, [selectedTicket?.id]);

  const handleCreateTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (!subject.trim() || !message.trim()) {
      addToast('Please provide both a subject and details for your ticket.', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      const ticketId = await supportRepository.createTicket({
        userId: user.uid,
        userEmail: user.email || 'investor@arth.app',
        userName: user.displayName || 'Investor',
        subject: subject.trim(),
        category,
        priority,
        message: message.trim()
      });

      // Dispatch Support Ticket Logged Email
      if (user.email) {
        import('../services/emailService').then(({ emailService }) => {
          emailService.sendTicketLoggedEmail(user.email!, {
            userName: user.displayName || 'Investor',
            ticketId: ticketId.slice(0, 8).toUpperCase(),
            subject: subject.trim(),
            category: category.toUpperCase(),
            priority: (priority.toUpperCase() as any) || 'MEDIUM',
            messageSnippet: message.trim(),
            ticketUrl: window.location.origin + '/support'
          }).catch(e => console.warn('[SupportPage] Ticket logged email error:', e));
        });
      }

      addToast('Support ticket dispatched to advisory desk.', 'success');
      setSubject('');
      setMessage('');
      setCategory('general');
      setPriority('medium');

      const newTicket: SupportTicket = {
        id: ticketId,
        userId: user.uid,
        userEmail: user.email || 'investor@arth.app',
        userName: user.displayName || 'Investor',
        subject: subject.trim(),
        category,
        priority,
        status: 'open',
        lastMessageSnippet: message.trim().slice(0, 100),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      setSelectedTicket(newTicket);
    } catch (err: any) {
      console.error('Failed to create ticket:', err);
      addToast(err.message || 'Failed to submit ticket.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSendReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !selectedTicket || !replyText.trim()) return;

    setIsSendingReply(true);
    try {
      await supportRepository.sendMessage({
        ticketId: selectedTicket.id,
        senderId: user.uid,
        senderName: user.displayName || 'Investor',
        senderRole: 'user',
        message: replyText.trim()
      });
      setReplyText('');
    } catch (err: any) {
      console.error('Failed to send reply:', err);
      addToast(err.message || 'Failed to send reply', 'error');
    } finally {
      setIsSendingReply(false);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="pb-4 border-b border-border">
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-mono uppercase tracking-wider text-primary bg-primary/10 px-2 py-0.5 rounded border border-primary/20">
            Advisory Desk
          </span>
        </div>
        <h1 className="text-xl sm:text-2xl font-semibold tracking-tight text-foreground mt-1">
          Direct Compliance & Research Support
        </h1>
        <p className="text-xs text-muted-foreground font-mono mt-0.5">
          Communicate directly with SEBI-registered analysts, technical engineers, and account compliance officers.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left Column: Create Ticket (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <motion.div 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-panel p-6 shadow-sm"
          >
            <div className="flex items-center gap-2 mb-4 pb-3 border-b border-border">
              <MessageSquare className="w-4 h-4 text-primary" />
              <h3 className="text-sm font-semibold text-foreground">Open Support Inquiry</h3>
            </div>
            
            <form onSubmit={handleCreateTicket} className="space-y-3 text-xs font-mono">
              <div>
                <label className="block text-[10px] uppercase text-muted-foreground mb-1">Inquiry Subject</label>
                <input 
                  type="text" 
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="w-full glass-panel-data px-3 py-1.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary font-medium" 
                  placeholder="e.g. Allocation rebalance clarification" 
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] uppercase text-muted-foreground mb-1">Category</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as any)}
                    className="w-full glass-panel-data px-2.5 py-1.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary capitalize font-mono"
                  >
                    <option value="portfolio">Portfolio</option>
                    <option value="advisory">Advisory</option>
                    <option value="billing">Billing</option>
                    <option value="technical">Technical</option>
                    <option value="general">General</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] uppercase text-muted-foreground mb-1">Urgency</label>
                  <select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value as any)}
                    className="w-full glass-panel-data px-2.5 py-1.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary capitalize font-mono"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="urgent">Urgent</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[10px] uppercase text-muted-foreground mb-1">Detailed Message</label>
                <textarea 
                  rows={4} 
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  className="w-full glass-panel-data p-2.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary leading-relaxed font-sans" 
                  placeholder="Provide complete context to expedite analyst resolution..." 
                  required
                />
              </div>

              <button 
                type="submit" 
                disabled={isSubmitting}
                className="w-full bg-primary hover:opacity-90 text-primary-foreground font-semibold text-xs py-2.5 rounded-md transition-all shadow-xs flex items-center justify-center gap-1.5 disabled:opacity-60 cursor-pointer font-sans"
              >
                <Send className="w-3.5 h-3.5" />
                <span>{isSubmitting ? 'Dispatching Ticket...' : 'Submit Support Ticket'}</span>
              </button>
            </form>
          </motion.div>

          <div className="p-4 rounded-md glass-panel-data text-xs text-muted-foreground space-y-2">
            <div className="flex items-center gap-2 text-foreground font-semibold">
              <Headphones className="w-3.5 h-3.5 text-primary" />
              <span>Desk Operating Hours</span>
            </div>
            <p className="leading-relaxed text-[11px] font-mono">
              Market trading hours: Mon–Fri, 9:00 AM – 6:00 PM IST. Critical portfolio signals receive 24/7 automated monitoring.
            </p>
          </div>
        </div>

        {/* Right Column: Ticket List & Thread (7 cols) */}
        <div className="lg:col-span-7">
          {selectedTicket ? (
            <motion.div 
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              className="glass-panel p-6 shadow-sm flex flex-col h-[560px]"
            >
              {/* Thread Header */}
              <div className="border-b border-border pb-3 mb-4 flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[10px] font-mono font-bold px-1.5 py-0.2 rounded bg-muted text-muted-foreground">
                      #{selectedTicket.id.slice(0, 6).toUpperCase()}
                    </span>
                    <span className={`text-[10px] font-mono uppercase tracking-wider px-1.5 py-0.2 rounded ${
                      selectedTicket.status === 'open' ? 'bg-primary/15 text-primary' :
                      selectedTicket.status === 'in_progress' ? 'bg-secondary/15 text-secondary' :
                      selectedTicket.status === 'resolved' ? 'bg-[hsl(var(--success))/0.15] text-[hsl(var(--success))]' : 'bg-muted text-muted-foreground'
                    }`}>
                      {selectedTicket.status.replace('_', ' ')}
                    </span>
                    <span className="text-[10px] font-mono uppercase text-muted-foreground">
                      {selectedTicket.category}
                    </span>
                  </div>
                  <h3 className="text-sm font-semibold text-foreground">{selectedTicket.subject}</h3>
                </div>
                
                <button
                  onClick={() => setSelectedTicket(null)}
                  className="glass-panel text-muted-foreground hover:text-foreground px-2 py-1 rounded transition-colors flex items-center gap-1 text-xs font-mono cursor-pointer"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>All Inquiries</span>
                </button>
              </div>

              {/* Messages Feed */}
              <div className="flex-1 overflow-y-auto space-y-3 pr-1 mb-3">
                {messages.length === 0 ? (
                  <div className="text-center py-16 text-xs font-mono text-muted-foreground">Loading conversation history...</div>
                ) : (
                  messages.map((m) => {
                    const isMe = m.senderId === user?.uid;
                    return (
                      <div key={m.id} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                        <div className="flex items-center gap-1.5 mb-1 text-[10px] font-mono text-muted-foreground">
                          <span>{isMe ? 'You' : `${m.senderName} (${m.senderRole.toUpperCase()})`}</span>
                          <span>•</span>
                          <span>{formatDateTime(m.createdAt)}</span>
                        </div>
                        <div className={`max-w-[85%] p-3 rounded text-xs leading-relaxed ${
                          isMe 
                            ? 'bg-primary text-primary-foreground font-medium' 
                            : 'glass-panel-data text-foreground'
                        }`}>
                          {m.message}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Reply Form */}
              {selectedTicket.status !== 'closed' ? (
                <form onSubmit={handleSendReply} className="flex gap-2 pt-3 border-t border-border">
                  <input
                    type="text"
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    placeholder="Type your response to the analyst desk..."
                    className="flex-1 glass-panel-data px-3 py-1.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary font-mono"
                    disabled={isSendingReply}
                  />
                  <button
                    type="submit"
                    disabled={isSendingReply || !replyText.trim()}
                    className="bg-primary hover:opacity-90 text-primary-foreground px-3.5 py-1.5 rounded text-xs font-semibold transition-colors disabled:opacity-50 flex items-center gap-1 cursor-pointer"
                  >
                    <Send className="w-3.5 h-3.5" />
                  </button>
                </form>
              ) : (
                <div className="p-2.5 glass-panel-data rounded text-center text-xs font-mono text-muted-foreground">
                  This inquiry is resolved and closed.
                </div>
              )}
            </motion.div>
          ) : (
            /* Ticket List View */
            <div className="glass-panel p-6 shadow-sm space-y-3">
              <div className="flex items-center justify-between pb-3 border-b border-border">
                <h3 className="text-sm font-semibold text-foreground">
                  Active Inquiries ({tickets.length})
                </h3>
              </div>

              {loadingTickets ? (
                <div className="py-12 text-center text-xs font-mono text-muted-foreground animate-pulse">
                  Loading tickets...
                </div>
              ) : tickets.length === 0 ? (
                <div className="py-10 text-center space-y-2">
                  <AlertCircle className="w-6 h-6 mx-auto text-muted-foreground" />
                  <p className="font-semibold text-xs text-foreground">No Open Tickets</p>
                  <p className="text-[11px] font-mono text-muted-foreground">
                    Use the inquiry form on the left to reach our research and compliance teams.
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {tickets.map((t) => (
                    <div
                      key={t.id}
                      onClick={() => setSelectedTicket(t)}
                      className="p-3.5 rounded glass-panel-data hover:bg-muted/40 transition-all cursor-pointer flex items-center justify-between gap-4 group"
                    >
                      <div className="space-y-1 min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className={`text-[9px] font-mono uppercase tracking-wider px-1.5 py-0.2 rounded ${
                            t.status === 'open' ? 'bg-primary/15 text-primary' :
                            t.status === 'in_progress' ? 'bg-secondary/15 text-secondary' :
                            t.status === 'resolved' ? 'bg-[hsl(var(--success))/0.15] text-[hsl(var(--success))]' : 'bg-muted text-muted-foreground'
                          }`}>
                            {t.status.replace('_', ' ')}
                          </span>
                          <span className="text-[10px] font-mono text-muted-foreground uppercase">
                            {t.category}
                          </span>
                        </div>
                        <h4 className="font-semibold text-xs text-foreground truncate">
                          {t.subject}
                        </h4>
                        <p className="text-[11px] text-muted-foreground truncate">
                          {t.lastMessageSnippet || 'No responses yet.'}
                        </p>
                      </div>
                      <ChevronRight className="w-3.5 h-3.5 text-muted-foreground group-hover:translate-x-0.5 transition-transform shrink-0" />
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
