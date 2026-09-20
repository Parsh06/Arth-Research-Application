import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare, Send, ChevronRight, Headphones, ArrowLeft, ShieldCheck } from 'lucide-react';
import { useAuthStore } from '../stores/authStore';
import { supportRepository } from '../repositories/supportRepository';
import type { SupportTicket, SupportMessage } from '../schemas/support.schema';
import { useToastStore } from '../stores/toastStore';
import { formatDateTime } from '../utils/datetime';
import { emailService } from '../services/emailService';
import NoActiveStrategyGate from '../components/NoActiveStrategyGate';
import { useAdvisoryAccess } from '../hooks/useAdvisoryAccess';

export default function SupportPage() {
  const { user } = useAuthStore();
  const { addToast } = useToastStore();
  const { hasAccess, isLoading: isAccessLoading } = useAdvisoryAccess();

  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);
  const [messages, setMessages] = useState<SupportMessage[]>([]);
  const [loadingTickets, setLoadingTickets] = useState(true);

  // Form State & Bot Protection
  const [subject, setSubject] = useState('');
  const [category, setCategory] = useState<'portfolio' | 'billing' | 'technical' | 'advisory' | 'general'>('general');
  const [priority, setPriority] = useState<'low' | 'medium' | 'high' | 'urgent'>('medium');
  const [message, setMessage] = useState('');
  const [honeypot, setHoneypot] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const mountTimeRef = useRef<number>(Date.now());

  // Reply State
  const [replyText, setReplyText] = useState('');
  const [isSendingReply, setIsSendingReply] = useState(false);

  // Scroll ref for chat container
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  // Scroll to bottom when messages change
  const scrollToBottom = (behavior: ScrollBehavior = 'smooth') => {
    messagesEndRef.current?.scrollIntoView({ behavior, block: 'end' });
  };

  useEffect(() => {
    scrollToBottom('auto');
  }, [selectedTicket?.id]);

  useEffect(() => {
    scrollToBottom('smooth');
  }, [messages]);

  // Subscribe to user tickets
  useEffect(() => {
    if (!user?.uid) {
      setLoadingTickets(false);
      return;
    }
    setLoadingTickets(true);
    const unsubscribe = supportRepository.subscribeToUserTickets(
      user.uid, 
      (data) => {
        setTickets(data);
        setLoadingTickets(false);
        if (selectedTicket) {
          const updated = data.find(t => t.id === selectedTicket.id);
          if (updated) setSelectedTicket(updated);
        }
      },
      () => {
        setLoadingTickets(false);
      }
    );

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

    // Anti-bot honeypot check
    if (honeypot) {
      console.warn('[SECURITY] Automated bot submission rejected via honeypot trap.');
      addToast('Ticket received and dispatched.', 'success');
      setSubject('');
      setMessage('');
      return;
    }

    // Rapid-submission bot detection (< 1.2s from page mount)
    if (Date.now() - mountTimeRef.current < 1200) {
      console.warn('[SECURITY] Automated submission rejected due to rapid submission rate.');
      addToast('Please wait a moment before submitting your inquiry.', 'error');
      return;
    }

    if (!subject.trim() || !message.trim()) {
      addToast('Please provide both a subject and details for your ticket.', 'error');
      return;
    }

    setIsSubmitting(true);
    const ticketSubject = subject.trim();
    const ticketMessage = message.trim();
    const userName = user.displayName || 'Investor';
    const userEmail = user.email || 'investor@arth.app';

    try {
      const ticketId = await supportRepository.createTicket({
        userId: user.uid,
        userEmail,
        userName,
        subject: ticketSubject,
        category,
        priority,
        message: ticketMessage
      });

      // 1. Dispatch Support Ticket Logged Email to Client
      if (user.email) {
        emailService.sendTicketLoggedEmail(user.email, {
          userName,
          ticketId,
          subject: ticketSubject,
          category: category.toUpperCase(),
          priority: (priority.toUpperCase() as any) || 'MEDIUM',
          messageSnippet: ticketMessage,
          ticketUrl: `${window.location.origin}/support`
        }).catch(err => console.warn('[SupportPage] Client ticket email warning:', err));
      }

      // 2. Dispatch Real-Time Alert to Super Admin & Desk Team
      const adminEmail = emailService.getAdminEmail();
      emailService.sendAdminNewTicketAlertEmail(adminEmail, {
        userName,
        userEmail,
        ticketId,
        subject: ticketSubject,
        category: category.toUpperCase(),
        priority: (priority.toUpperCase() as any) || 'MEDIUM',
        messageSnippet: ticketMessage,
        adminPortalUrl: `${window.location.origin}/admin/support`
      }).catch(err => console.warn('[SupportPage] Admin new ticket alert error:', err));

      addToast(`Ticket #${ticketId} created and dispatched to research desk.`, 'success');
      setSubject('');
      setMessage('');
      setCategory('general');
      setPriority('medium');

      const newTicket: SupportTicket = {
        id: ticketId,
        userId: user.uid,
        userEmail,
        userName,
        subject: ticketSubject,
        category,
        priority,
        status: 'open',
        lastMessageSnippet: ticketMessage.slice(0, 100),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      setSelectedTicket(newTicket);
    } catch (err: any) {
      console.error('Failed to create ticket:', err);
      addToast('Unable to submit inquiry. Please verify your connection and try again.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSendReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !selectedTicket || !replyText.trim()) return;

    const replyContent = replyText.trim();
    setIsSendingReply(true);

    try {
      await supportRepository.sendMessage({
        ticketId: selectedTicket.id,
        senderId: user.uid,
        senderName: user.displayName || 'Investor',
        senderRole: 'user',
        message: replyContent
      });

      // Dispatch Alert to Super Admin & Advisory Desk
      const adminEmail = emailService.getAdminEmail();
      emailService.sendAdminUserReplyAlertEmail(adminEmail, {
        userName: user.displayName || 'Investor',
        userEmail: user.email || 'investor@arth.app',
        ticketId: selectedTicket.id,
        subject: selectedTicket.subject,
        replySnippet: replyContent,
        adminPortalUrl: `${window.location.origin}/admin/support`
      }).catch(err => console.warn('[SupportPage] Admin reply alert error:', err));

      setReplyText('');
    } catch (err: any) {
      console.error('Failed to send reply:', err);
      addToast('Unable to send message. Please try again.', 'error');
    } finally {
      setIsSendingReply(false);
    }
  };

  if (!isAccessLoading && !hasAccess) {
    return <NoActiveStrategyGate />;
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="pb-4 border-b border-border">
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-mono uppercase tracking-wider text-primary bg-primary/10 px-2 py-0.5 rounded border border-primary/20">
            Advisory Desk
          </span>
        </div>
        <h1 className="text-xl sm:text-2xl font-semibold tracking-tight text-foreground mt-1">
          Direct Advisory & Portfolio Support
        </h1>
        <p className="text-xs text-muted-foreground font-mono mt-0.5">
          Communicate directly with quantitative analysts, mandate advisors, and investor support specialists.
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
              {/* Anti-Bot Honeypot Field (Off-Screen) */}
              <div style={{ position: 'absolute', opacity: 0, zIndex: -1, pointerEvents: 'none', left: '-9999px' }} aria-hidden="true">
                <input
                  type="text"
                  name="website_source_verification"
                  value={honeypot}
                  onChange={(e) => setHoneypot(e.target.value)}
                  tabIndex={-1}
                  autoComplete="off"
                />
              </div>

              <div>
                <label className="block text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400 mb-1">Inquiry Subject</label>
                <input 
                  type="text" 
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="w-full bg-white dark:bg-[#121926] border border-slate-200 dark:border-white/10 px-3 py-2 text-xs text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-primary font-medium rounded-md shadow-2xs" 
                  placeholder="e.g. Allocation rebalance clarification" 
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400 mb-1">Category</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as any)}
                    className="w-full bg-white dark:bg-[#121926] border border-slate-200 dark:border-white/10 rounded-md px-3 py-2 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-primary capitalize font-mono cursor-pointer shadow-2xs"
                  >
                    <option className="bg-white dark:bg-[#121926] text-slate-900 dark:text-slate-100" value="portfolio">Portfolio</option>
                    <option className="bg-white dark:bg-[#121926] text-slate-900 dark:text-slate-100" value="advisory">Advisory</option>
                    <option className="bg-white dark:bg-[#121926] text-slate-900 dark:text-slate-100" value="billing">Billing</option>
                    <option className="bg-white dark:bg-[#121926] text-slate-900 dark:text-slate-100" value="technical">Technical</option>
                    <option className="bg-white dark:bg-[#121926] text-slate-900 dark:text-slate-100" value="general">General</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400 mb-1">Urgency</label>
                  <select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value as any)}
                    className="w-full bg-white dark:bg-[#121926] border border-slate-200 dark:border-white/10 rounded-md px-3 py-2 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-primary capitalize font-mono cursor-pointer shadow-2xs"
                  >
                    <option className="bg-white dark:bg-[#121926] text-slate-900 dark:text-slate-100" value="low">Low</option>
                    <option className="bg-white dark:bg-[#121926] text-slate-900 dark:text-slate-100" value="medium">Medium</option>
                    <option className="bg-white dark:bg-[#121926] text-slate-900 dark:text-slate-100" value="high">High</option>
                    <option className="bg-white dark:bg-[#121926] text-slate-900 dark:text-slate-100" value="urgent">Urgent</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400 mb-1">Detailed Message</label>
                <textarea 
                  rows={4} 
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  className="w-full bg-white dark:bg-[#121926] border border-slate-200 dark:border-white/10 p-3 text-xs text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-primary leading-relaxed font-sans rounded-md shadow-2xs" 
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
          <AnimatePresence mode="wait">
            {selectedTicket ? (
              <motion.div 
                key="ticket-chat"
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
                className="glass-panel p-5 sm:p-6 shadow-sm flex flex-col h-[620px]"
              >
                {/* Thread Header */}
                <div className="border-b border-border pb-3.5 mb-3 flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2 mb-1.5">
                      <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-muted text-muted-foreground border border-border">
                        #{selectedTicket.id}
                      </span>
                      <span className={`text-[10px] font-mono uppercase tracking-wider font-semibold px-2 py-0.5 rounded border ${
                        selectedTicket.status === 'open' ? 'bg-primary/15 text-primary border-primary/25' :
                        selectedTicket.status === 'in_progress' ? 'bg-amber-500/15 text-amber-500 border-amber-500/25' :
                        selectedTicket.status === 'resolved' ? 'bg-[hsl(var(--success))/0.15] text-[hsl(var(--success))] border-[hsl(var(--success))/0.25]' : 
                        'bg-muted text-muted-foreground border-border'
                      }`}>
                        {selectedTicket.status.replace('_', ' ')}
                      </span>
                      <span className="text-[10px] font-mono uppercase text-muted-foreground bg-muted/50 px-1.5 py-0.5 rounded">
                        {selectedTicket.category}
                      </span>
                    </div>
                    <h3 className="text-sm font-semibold text-foreground truncate">{selectedTicket.subject}</h3>
                  </div>
                  
                  <button
                    onClick={() => setSelectedTicket(null)}
                    className="glass-panel text-muted-foreground hover:text-foreground px-2.5 py-1.5 rounded transition-colors flex items-center gap-1.5 text-xs font-mono cursor-pointer shrink-0"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    <span>All Inquiries</span>
                  </button>
                </div>

                {/* Scrollable Messages Thread Container */}
                <div 
                  ref={chatContainerRef}
                  className="flex-1 overflow-y-auto space-y-4 p-3.5 rounded-lg glass-panel-data border border-border/40 scrollbar-thin scrollbar-thumb-muted-foreground/20"
                >
                  {messages.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-center py-16 text-xs font-mono text-muted-foreground">
                      <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center mb-2 animate-pulse">
                        <MessageSquare className="w-4 h-4 text-muted-foreground" />
                      </div>
                      <span>Loading conversation history...</span>
                    </div>
                  ) : (
                    messages.map((m) => {
                      // Distinction logic: Admin/Support messages go LEFT, Client (User) messages go RIGHT
                      const isAdminMsg = m.senderRole === 'admin' || m.senderRole === 'support_admin' || m.senderRole === 'super_admin';
                      const isClientMsg = !isAdminMsg;

                      return (
                        <div 
                          key={m.id} 
                          className={`flex flex-col ${isClientMsg ? 'items-end' : 'items-start'}`}
                        >
                          {/* Message Sender Header */}
                          <div className="flex items-center gap-1.5 mb-1 text-[10px] font-mono text-muted-foreground">
                            {isClientMsg ? (
                              <>
                                <span className="font-semibold text-primary">You (Investor)</span>
                                <span>•</span>
                                <span>{formatDateTime(m.createdAt)}</span>
                              </>
                            ) : (
                              <>
                                <span className="inline-flex items-center gap-1 font-bold text-amber-500 dark:text-amber-400 bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/20">
                                  <ShieldCheck className="w-3 h-3 text-amber-500" />
                                  <span>Arth Research Desk &bull; {m.senderName}</span>
                                </span>
                                <span>•</span>
                                <span>{formatDateTime(m.createdAt)}</span>
                              </>
                            )}
                          </div>

                          {/* Message Content Bubble */}
                          <div className={`p-3.5 rounded-2xl text-xs leading-relaxed max-w-[85%] shadow-xs break-words ${
                            isClientMsg 
                              ? 'bg-primary text-primary-foreground font-medium rounded-tr-xs ml-8' 
                              : 'bg-card dark:bg-[#121926] border border-border text-foreground font-normal rounded-tl-xs mr-8'
                          }`}>
                            {m.message}
                          </div>
                        </div>
                      );
                    })
                  )}
                  {/* Invisible anchor to ensure smooth scrolling to bottom */}
                  <div ref={messagesEndRef} />
                </div>

                {/* Reply Form */}
                <div className="pt-3">
                  {selectedTicket.status !== 'closed' ? (
                    <form onSubmit={handleSendReply} className="flex gap-2">
                      <input
                        type="text"
                        value={replyText}
                        onChange={(e) => setReplyText(e.target.value)}
                        placeholder="Type your response to the analyst desk..."
                        className="flex-1 bg-card dark:bg-[#121926] border border-border px-3.5 py-2 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary font-mono rounded-md"
                        disabled={isSendingReply}
                      />
                      <button
                        type="submit"
                        disabled={isSendingReply || !replyText.trim()}
                        className="bg-primary hover:opacity-90 text-primary-foreground px-4 py-2 rounded-md text-xs font-semibold transition-all disabled:opacity-50 flex items-center gap-1.5 cursor-pointer shadow-xs font-mono"
                      >
                        <Send className="w-3.5 h-3.5" />
                        <span>{isSendingReply ? 'Sending...' : 'Send'}</span>
                      </button>
                    </form>
                  ) : (
                    <div className="p-3 bg-muted/40 border border-border rounded-md text-center text-xs font-mono text-muted-foreground">
                      This inquiry is resolved and closed. Open a new ticket if you need additional assistance.
                    </div>
                  )}
                </div>
              </motion.div>
            ) : (
              /* Ticket List View */
              <motion.div 
                key="ticket-list"
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
                className="glass-panel p-6 shadow-sm space-y-3"
              >
                <div className="flex items-center justify-between pb-3 border-b border-border">
                  <h3 className="text-sm font-semibold text-foreground">
                    Active Inquiries ({tickets.length})
                  </h3>
                </div>

                {loadingTickets ? (
                  <div className="py-14 text-center text-xs font-mono text-muted-foreground animate-pulse">
                    Loading inquiries...
                  </div>
                ) : tickets.length === 0 ? (
                  <div className="py-14 text-center space-y-2 px-4">
                    <div className="w-10 h-10 rounded-full bg-primary/10 text-primary mx-auto flex items-center justify-center">
                      <MessageSquare className="w-5 h-5" />
                    </div>
                    <p className="font-semibold text-sm text-foreground">No Tickets Raised</p>
                    <p className="text-xs font-mono text-muted-foreground max-w-sm mx-auto leading-relaxed">
                      You haven't submitted any support tickets yet. Use the inquiry form on the left to reach our quantitative analysts and compliance desk.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2.5 max-h-[500px] overflow-y-auto pr-1">
                    {tickets.map((t) => (
                      <div
                        key={t.id}
                        onClick={() => setSelectedTicket(t)}
                        className="p-4 rounded-md glass-panel-data hover:bg-muted/40 border border-border/60 transition-all cursor-pointer flex items-center justify-between gap-4 group"
                      >
                        <div className="space-y-1.5 min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-mono font-bold text-muted-foreground">
                              #{t.id}
                            </span>
                            <span className={`text-[9px] font-mono uppercase tracking-wider font-semibold px-1.5 py-0.5 rounded border ${
                              t.status === 'open' ? 'bg-primary/15 text-primary border-primary/25' :
                              t.status === 'in_progress' ? 'bg-amber-500/15 text-amber-500 border-amber-500/25' :
                              t.status === 'resolved' ? 'bg-[hsl(var(--success))/0.15] text-[hsl(var(--success))] border-[hsl(var(--success))/0.25]' : 
                              'bg-muted text-muted-foreground border-border'
                            }`}>
                              {t.status.replace('_', ' ')}
                            </span>
                            <span className="text-[10px] font-mono text-muted-foreground uppercase bg-muted/40 px-1 rounded">
                              {t.category}
                            </span>
                          </div>
                          <h4 className="font-semibold text-xs text-foreground truncate">
                            {t.subject}
                          </h4>
                          <p className="text-[11px] text-muted-foreground truncate font-sans">
                            {t.lastMessageSnippet || 'No responses yet.'}
                          </p>
                        </div>
                        <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:translate-x-0.5 transition-transform shrink-0" />
                      </div>
                    ))}
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
