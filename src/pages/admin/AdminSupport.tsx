import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Search, Send, Headphones } from 'lucide-react';
import { useAuthStore } from '../../stores/authStore';
import { supportRepository } from '../../repositories/supportRepository';
import type { SupportTicket, SupportMessage } from '../../schemas/support.schema';
import { useToastStore } from '../../stores/toastStore';
import { formatDateTime } from '../../utils/datetime';

export default function AdminSupport() {
  const { user } = useAuthStore();
  const { addToast } = useToastStore();

  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);
  const [messages, setMessages] = useState<SupportMessage[]>([]);

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [replyText, setReplyText] = useState('');
  const [isSending, setIsSending] = useState(false);

  // Subscribe to all tickets
  useEffect(() => {
    const unsubscribe = supportRepository.subscribeToAllTickets((data) => {
      setTickets(data);
      if (selectedTicket) {
        const updated = data.find(t => t.id === selectedTicket.id);
        if (updated) setSelectedTicket(updated);
      }
    });

    return () => unsubscribe();
  }, [selectedTicket]);

  // Subscribe to messages of selected ticket
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

  const handleSendReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !selectedTicket || !replyText.trim()) return;

    setIsSending(true);
    const replyContent = replyText.trim();
    try {
      await supportRepository.sendMessage({
        ticketId: selectedTicket.id,
        senderId: user.uid,
        senderName: user.displayName || 'Support Desk',
        senderRole: 'admin',
        message: replyContent
      });

      // Dispatch Analyst Reply Notification Email to Ticket Owner
      if (selectedTicket.userEmail) {
        import('../../services/emailService').then(({ emailService }) => {
          emailService.sendAnalystReplyEmail(selectedTicket.userEmail, {
            userName: selectedTicket.userName || 'Investor',
            ticketId: selectedTicket.id.slice(0, 8).toUpperCase(),
            subject: selectedTicket.subject,
            analystName: user.displayName || 'Parsh Jain',
            analystRole: 'Lead Quantitative Analyst',
            replySnippet: replyContent,
            ticketUrl: window.location.origin + '/support'
          }).catch(e => console.warn('[AdminSupport] Analyst reply email error:', e));
        });
      }

      setReplyText('');
      addToast('Response dispatched to investor portal and email notified.', 'success');
    } catch (err: any) {
      console.error('Failed to send reply:', err);
      addToast(err.message || 'Failed to send reply', 'error');
    } finally {
      setIsSending(false);
    }
  };

  const handleUpdateStatus = async (ticketId: string, status: SupportTicket['status']) => {
    try {
      await supportRepository.updateTicketStatus(ticketId, status);
      addToast(`Ticket status updated to ${status}`, 'success');
    } catch (err: any) {
      console.error('Failed to update ticket status:', err);
      addToast(err.message || 'Failed to update status', 'error');
    }
  };

  // Filtered tickets
  const filteredTickets = tickets.filter(t => {
    const matchesQuery = 
      t.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.userEmail.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.userName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.id.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = statusFilter === 'all' || t.status === statusFilter;
    return matchesQuery && matchesStatus;
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="pb-4 border-b border-border">
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-mono uppercase tracking-wider text-primary bg-primary/10 px-2.5 py-0.5 rounded border border-primary/20">
            Desk Management
          </span>
        </div>
        <h1 className="text-xl sm:text-2xl font-semibold tracking-tight text-foreground mt-1">
          Support & Inquiry Resolution Desk
        </h1>
        <p className="text-xs text-muted-foreground font-mono mt-0.5">
          Triage incoming investor tickets, manage response SLAs, and resolve advisory questions.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left Column: Tickets Master List (5 cols) */}
        <div className="lg:col-span-5 space-y-3">
          <div className="glass-panel p-4 space-y-2.5">
            <div className="relative">
              <Search className="h-3.5 w-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search inquiries..."
                className="w-full bg-card border border-border rounded-md pl-9 pr-3 py-1.5 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary font-mono transition-colors"
              />
            </div>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full bg-card border border-border rounded-md px-3 py-1.5 text-xs text-foreground font-mono capitalize focus:outline-none focus:ring-1 focus:ring-primary"
            >
              <option value="all">All Inquiries ({tickets.length})</option>
              <option value="open">Open</option>
              <option value="in_progress">In Progress</option>
              <option value="resolved">Resolved</option>
              <option value="closed">Closed</option>
            </select>
          </div>

          <div className="space-y-2 max-h-[560px] overflow-y-auto pr-1">
            {filteredTickets.length === 0 ? (
              <div className="p-8 text-center glass-panel text-xs font-mono text-muted-foreground">
                No tickets matching current filters.
              </div>
            ) : (
              filteredTickets.map((t) => {
                const isSelected = selectedTicket?.id === t.id;
                return (
                  <motion.div
                    key={t.id}
                    onClick={() => setSelectedTicket(t)}
                    whileHover={{ scale: 1.005 }}
                    className={`p-4 rounded-md cursor-pointer transition-all border ${
                      isSelected 
                        ? 'bg-primary/10 border-primary shadow-xs' 
                        : 'glass-panel hover:bg-muted/40 border-border'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2 mb-1.5 font-mono">
                      <span className="text-[10px] text-muted-foreground">
                        #{t.id.slice(0, 8).toUpperCase()}
                      </span>
                      <span className={`text-[9px] uppercase tracking-wider font-semibold px-1.5 py-0.5 rounded border ${
                        t.status === 'open' ? 'bg-primary/10 text-primary border-primary/25' :
                        t.status === 'in_progress' ? 'bg-amber-500/10 text-amber-500 border-amber-500/25' :
                        'bg-[hsl(var(--success))/0.15] text-[hsl(var(--success))] border-[hsl(var(--success))/0.25]'
                      }`}>
                        {t.status.replace('_', ' ')}
                      </span>
                    </div>

                    <h4 className="text-xs font-semibold text-foreground truncate mb-1">{t.subject}</h4>
                    
                    <div className="flex items-center justify-between text-[11px] text-muted-foreground font-mono">
                      <span className="truncate max-w-[160px]">{t.userName || t.userEmail}</span>
                      <span>{formatDateTime(t.updatedAt || t.createdAt)}</span>
                    </div>
                  </motion.div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Column: Ticket Conversation & Dispatch Desk (7 cols) */}
        <div className="lg:col-span-7">
          {selectedTicket ? (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="glass-panel p-6 shadow-sm flex flex-col h-[660px]"
            >
              {/* Header */}
              <div className="pb-4 border-b border-border flex flex-col sm:flex-row sm:items-center justify-between gap-3 font-mono">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-foreground">{selectedTicket.subject}</span>
                    <span className="text-[10px] text-muted-foreground">({selectedTicket.category})</span>
                  </div>
                  <div className="text-[11px] text-muted-foreground mt-0.5">
                    Investor: <span className="text-foreground font-medium">{selectedTicket.userName}</span> ({selectedTicket.userEmail})
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <select
                    value={selectedTicket.status}
                    onChange={(e) => handleUpdateStatus(selectedTicket.id, e.target.value as any)}
                    className="bg-card border border-border text-[11px] font-mono rounded px-2.5 py-1 text-foreground focus:outline-none focus:ring-1 focus:ring-primary capitalize"
                  >
                    <option value="open">Open</option>
                    <option value="in_progress">In Progress</option>
                    <option value="resolved">Resolved</option>
                    <option value="closed">Closed</option>
                  </select>
                </div>
              </div>

              {/* Messages Thread */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3.5 my-3 rounded-md glass-panel-data">
                {messages.length === 0 ? (
                  <div className="py-12 text-center text-xs font-mono text-muted-foreground">
                    No conversation thread recorded.
                  </div>
                ) : (
                  messages.map((m) => {
                    const isAdminMsg = m.senderRole === 'admin';
                    return (
                      <div
                        key={m.id}
                        className={`flex flex-col ${isAdminMsg ? 'items-end' : 'items-start'}`}
                      >
                        <div className="flex items-center gap-2 mb-1 text-[10px] font-mono text-muted-foreground">
                          <span className="font-semibold text-foreground">{m.senderName}</span>
                          <span>•</span>
                          <span>{formatDateTime(m.createdAt)}</span>
                        </div>
                        <div
                          className={`p-3 rounded-md text-xs leading-relaxed max-w-[85%] ${
                            isAdminMsg
                              ? 'bg-primary text-primary-foreground shadow-xs font-medium'
                              : 'bg-card border border-border text-foreground'
                          }`}
                        >
                          {m.message}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Reply Box */}
              <form onSubmit={handleSendReply} className="pt-2 flex gap-2">
                <input
                  type="text"
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  placeholder="Type advisory resolution dispatch..."
                  className="flex-1 bg-card border border-border rounded-md px-3.5 py-2 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary font-mono transition-colors"
                />
                <button
                  type="submit"
                  disabled={isSending || !replyText.trim()}
                  className="bg-primary hover:opacity-90 text-primary-foreground px-4 py-2 rounded-md text-xs font-semibold shadow-xs transition-all flex items-center gap-1.5 disabled:opacity-50 cursor-pointer font-mono"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{isSending ? 'Sending...' : 'Reply'}</span>
                </button>
              </form>
            </motion.div>
          ) : (
            <div className="glass-panel p-16 text-center shadow-sm flex flex-col items-center justify-center min-h-[400px]">
              <div className="w-12 h-12 rounded-md bg-muted border border-border flex items-center justify-center text-muted-foreground mb-3">
                <Headphones className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-sm font-semibold text-foreground mb-1">Select an Inquiry</h3>
              <p className="text-xs text-muted-foreground font-mono max-w-sm">
                Click on any support ticket in the master list to inspect the conversation history and dispatch replies.
              </p>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
