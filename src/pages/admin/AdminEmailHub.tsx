// src/pages/admin/AdminEmailHub.tsx
import React, { useState, useMemo, useEffect } from 'react';
import {
  Mail,
  Send,
  Smartphone,
  Monitor,
  Code,
  Eye,
  CheckCircle2,
  AlertTriangle,
  Clock,
  RefreshCw,
  Search,
  Trash2,
  ShieldCheck,
  Check,
  Calendar,
  Zap,
  Copy,
  Users,
  ExternalLink,
  Play
} from 'lucide-react';
import { EMAIL_TEMPLATES_CATALOG, type EmailTemplateDefinition } from '../../templates/emails';
import { emailService, type EmailAuditLogEntry } from '../../services/emailService';
import { subscriptionRepository } from '../../repositories/subscriptionRepository';
import { useUserStore } from '../../stores/userStore';

export const AdminEmailHub: React.FC = () => {
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>(EMAIL_TEMPLATES_CATALOG[0].id);
  const [previewMode, setPreviewMode] = useState<'visual' | 'code'>('visual');
  const [viewPort, setViewPort] = useState<'desktop' | 'mobile'>('desktop');
  const [recipientEmail, setRecipientEmail] = useState<string>('jainparsh06@gmail.com');
  const [isSending, setIsSending] = useState<boolean>(false);
  const [sendResult, setSendResult] = useState<{ success: boolean; message: string; mocked?: boolean } | null>(null);
  const [auditLogs, setAuditLogs] = useState<EmailAuditLogEntry[]>([]);
  const [activeTab, setActiveTab] = useState<'preview' | 'logs' | 'cron'>('preview');

  // Cron execution state
  const [isExecutingCron, setIsExecutingCron] = useState<boolean>(false);
  const [cronResult, setCronResult] = useState<{
    scanned?: number;
    warningsSent: number;
    expiredSent: number;
    errors: string[];
    logs: string[];
  } | null>(null);
  const [copiedWebhook, setCopiedWebhook] = useState<boolean>(false);

  const { allUsers, fetchAllUsers } = useUserStore();

  // Load audit logs and users on mount
  useEffect(() => {
    setAuditLogs(emailService.getAuditLogs());
    fetchAllUsers();
  }, [fetchAllUsers]);

  const refreshLogs = () => {
    setAuditLogs(emailService.getAuditLogs());
  };

  const handleClearLogs = () => {
    emailService.clearAuditLogs();
    setAuditLogs([]);
  };

  const handleRunCron = async () => {
    setIsExecutingCron(true);
    setCronResult(null);
    try {
      const res = await subscriptionRepository.checkAndDispatchExpiryWarnings();
      setCronResult(res);
      refreshLogs();
    } catch (err: any) {
      setCronResult({
        scanned: 0,
        warningsSent: 0,
        expiredSent: 0,
        errors: [err.message || 'Cron execution failed.'],
        logs: []
      });
    } finally {
      setIsExecutingCron(false);
    }
  };

  const handleCopyWebhook = () => {
    const webhookUrl = `${window.location.origin}/api/cron/check-subscriptions`;
    navigator.clipboard.writeText(webhookUrl);
    setCopiedWebhook(true);
    setTimeout(() => setCopiedWebhook(false), 2000);
  };

  const filteredTemplates = useMemo(() => {
    return EMAIL_TEMPLATES_CATALOG.filter(tmpl => {
      const matchesCat = selectedCategory === 'ALL' || tmpl.category.toUpperCase() === selectedCategory;
      const matchesSearch = tmpl.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            tmpl.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            tmpl.number.toString().includes(searchQuery);
      return matchesCat && matchesSearch;
    });
  }, [selectedCategory, searchQuery]);

  const activeTemplate: EmailTemplateDefinition = useMemo(() => {
    return EMAIL_TEMPLATES_CATALOG.find(t => t.id === selectedTemplateId) || EMAIL_TEMPLATES_CATALOG[0];
  }, [selectedTemplateId]);

  // Generate current preview email HTML & subject
  const generatedEmail = useMemo(() => {
    return activeTemplate.generateSample(recipientEmail);
  }, [activeTemplate, recipientEmail]);

  const handleSendTestEmail = async () => {
    if (!recipientEmail || !recipientEmail.includes('@')) {
      setSendResult({ success: false, message: 'Please enter a valid recipient email address.' });
      return;
    }

    setIsSending(true);
    setSendResult(null);

    try {
      const res = await emailService.sendEmail({
        to: recipientEmail,
        subject: generatedEmail.subject,
        html: generatedEmail.html,
        templateId: activeTemplate.id
      });

      if (res.success) {
        setSendResult({
          success: true,
          mocked: res.mocked,
          message: res.mocked
            ? `Simulated dispatch successful! (Credentials not set in .env. Check terminal logs).`
            : `Live email dispatched via Gmail SMTP to ${recipientEmail}!`
        });
      } else {
        setSendResult({
          success: false,
          message: res.error || 'Failed to dispatch email.'
        });
      }
      refreshLogs();
    } catch (err: any) {
      setSendResult({
        success: false,
        message: err.message || 'Dispatch error occurred.'
      });
      refreshLogs();
    } finally {
      setIsSending(false);
    }
  };

  const categories = ['ALL', 'AUTH', 'BILLING', 'PORTFOLIO', 'ADVISORY', 'SUPPORT', 'GOVERNANCE'];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border/40 pb-5">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold tracking-wider bg-brass/10 text-brass border border-brass/30">
              SMTP ENGINE &bull; 17 TEMPLATES
            </span>
            <span className="flex items-center gap-1 text-[11px] text-muted-foreground font-mono">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              Firestore Data Synchronized
            </span>
          </div>
          <h1 className="text-2xl font-cinzel font-bold text-foreground tracking-wide">
            Institutional Email Hub & Cron Telemetry
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Preview, test, and automate all investor communications with real-time Firestore synchronization and cron-job.org connectivity.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('preview')}
            className={`px-3.5 py-2 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all border ${
              activeTab === 'preview'
                ? 'bg-primary text-primary-foreground border-primary shadow-sm'
                : 'bg-card hover:bg-accent text-foreground border-border/60'
            }`}
          >
            <Eye className="w-4 h-4" />
            Studio Preview
          </button>
          <button
            onClick={() => setActiveTab('cron')}
            className={`px-3.5 py-2 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all border ${
              activeTab === 'cron'
                ? 'bg-primary text-primary-foreground border-primary shadow-sm'
                : 'bg-card hover:bg-accent text-foreground border-border/60'
            }`}
          >
            <Calendar className="w-4 h-4" />
            Cron Automation
          </button>
          <button
            onClick={() => setActiveTab('logs')}
            className={`px-3.5 py-2 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all border ${
              activeTab === 'logs'
                ? 'bg-primary text-primary-foreground border-primary shadow-sm'
                : 'bg-card hover:bg-accent text-foreground border-border/60'
            }`}
          >
            <Clock className="w-4 h-4" />
            Audit Logs ({auditLogs.length})
          </button>
        </div>
      </div>

      {activeTab === 'cron' ? (
        /* CRON AUTOMATION VIEW */
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* Left: Live Trigger Card */}
            <div className="lg:col-span-6 bg-card border border-border/60 rounded-xl p-6 space-y-5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-lg bg-brass/10 border border-brass/30 flex items-center justify-center text-brass">
                    <Zap className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-sm font-semibold text-foreground">Subscription Lifecycle Cron</h2>
                    <p className="text-[11px] text-muted-foreground">Pulls real user data from Firestore and processes automated warnings</p>
                  </div>
                </div>
              </div>

              <div className="p-4 rounded-lg bg-background border border-border/40 space-y-2 text-xs">
                <div className="text-[11px] font-mono text-muted-foreground uppercase font-bold">Automation Logic:</div>
                <ul className="space-y-1.5 text-muted-foreground list-disc list-inside">
                  <li><strong>7-Day Expiry Warning:</strong> Scans active mandates expiring in &le; 7 days, pulls investor details, and dispatches Template #6.</li>
                  <li><strong>Subscription Expired Notice:</strong> Detects expired subscriptions, transitions Firestore status to <code className="text-brass">expired</code>, and dispatches Template #7.</li>
                  <li><strong>Deduplication Shield:</strong> Records <code className="text-brass">warningEmailSentAt</code> and <code className="text-brass">expiredNoticeSentAt</code> to prevent repeated emails.</li>
                </ul>
              </div>

              <button
                onClick={handleRunCron}
                disabled={isExecutingCron}
                className="w-full py-3 px-4 rounded-lg bg-gradient-to-r from-brass to-brass/80 text-black font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-md shadow-brass/10 hover:opacity-95 disabled:opacity-50 transition-all cursor-pointer"
              >
                {isExecutingCron ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" /> Evaluating Firestore Subscriptions...
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4 fill-current" /> Execute Lifecycle Scan Now
                  </>
                )}
              </button>

              {cronResult && (
                <div className={`p-4 rounded-xl border text-xs space-y-3 ${
                  cronResult.errors.length > 0
                    ? 'bg-amber-500/10 border-amber-500/30 text-amber-300'
                    : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                }`}>
                  <div className="flex items-center justify-between font-bold text-sm">
                    <span className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4" /> Scan Execution Complete
                    </span>
                    <span className="font-mono text-xs">{new Date().toLocaleTimeString()}</span>
                  </div>

                  <div className="grid grid-cols-3 gap-2 pt-2 border-t border-border/40 font-mono text-center">
                    <div className="p-2 rounded bg-black/20">
                      <div className="text-[10px] text-muted-foreground">Scanned</div>
                      <div className="text-base font-bold text-foreground">{cronResult.scanned}</div>
                    </div>
                    <div className="p-2 rounded bg-black/20">
                      <div className="text-[10px] text-muted-foreground">7-Day Warnings</div>
                      <div className="text-base font-bold text-brass">{cronResult.warningsSent}</div>
                    </div>
                    <div className="p-2 rounded bg-black/20">
                      <div className="text-[10px] text-muted-foreground">Expired Notices</div>
                      <div className="text-base font-bold text-emerald-400">{cronResult.expiredSent}</div>
                    </div>
                  </div>

                  {cronResult.logs.length > 0 && (
                    <div className="space-y-1 pt-2 border-t border-border/40 text-[11px] font-mono">
                      {cronResult.logs.map((l, i) => (
                        <div key={i} className="text-emerald-400/90">&bull; {l}</div>
                      ))}
                    </div>
                  )}

                  {cronResult.errors.length > 0 && (
                    <div className="space-y-1 pt-2 border-t border-destructive/30 text-[11px] font-mono text-destructive">
                      {cronResult.errors.map((e, i) => (
                        <div key={i}>&times; {e}</div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Right: cron-job.org Integration Guide */}
            <div className="lg:col-span-6 bg-card border border-border/60 rounded-xl p-6 space-y-5">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-lg bg-sapphire/10 border border-sapphire/30 flex items-center justify-center text-sapphire">
                  <ExternalLink className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-sm font-semibold text-foreground">cron-job.org Setup Instructions</h2>
                  <p className="text-[11px] text-muted-foreground">Configure free recurring 24/7 background scheduling</p>
                </div>
              </div>

              <div className="space-y-3 text-xs text-muted-foreground">
                <p>
                  To run automatic daily subscription checks even when no administrator is logged in, register this webhook URL in <strong className="text-foreground">cron-job.org</strong>:
                </p>

                <div className="p-3 rounded-lg bg-background border border-border/60 font-mono text-[11px] flex items-center justify-between gap-2">
                  <span className="text-brass truncate">
                    {window.location.origin}/api/cron/check-subscriptions
                  </span>
                  <button
                    onClick={handleCopyWebhook}
                    className="p-1.5 rounded bg-accent hover:bg-accent/80 text-foreground text-xs flex items-center gap-1 shrink-0"
                    title="Copy Webhook URL"
                  >
                    {copiedWebhook ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedWebhook ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>

                <div className="space-y-2 pt-2">
                  <div className="font-semibold text-foreground text-xs">Recommended cron-job.org Settings:</div>
                  <div className="grid grid-cols-2 gap-2 text-[11px] font-mono">
                    <div className="p-2.5 rounded bg-background border border-border/40">
                      <div className="text-muted-foreground">Schedule:</div>
                      <div className="text-foreground font-semibold">Every Day @ 09:00 IST</div>
                    </div>
                    <div className="p-2.5 rounded bg-background border border-border/40">
                      <div className="text-muted-foreground">HTTP Method:</div>
                      <div className="text-foreground font-semibold">GET / POST</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      ) : activeTab === 'logs' ? (
        /* AUDIT LOGS VIEW */
        <div className="bg-card border border-border/60 rounded-xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-brass" />
              <h2 className="text-sm font-semibold text-foreground">Recent Dispatch Telemetry</h2>
              <span className="text-xs text-muted-foreground font-mono">({auditLogs.length} events logged)</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={refreshLogs}
                className="p-1.5 rounded-lg bg-accent/50 hover:bg-accent text-muted-foreground hover:text-foreground text-xs flex items-center gap-1"
                title="Refresh logs"
              >
                <RefreshCw className="w-3.5 h-3.5" />
              </button>
              {auditLogs.length > 0 && (
                <button
                  onClick={handleClearLogs}
                  className="px-2.5 py-1 rounded-lg bg-destructive/10 hover:bg-destructive/20 text-destructive text-xs flex items-center gap-1 border border-destructive/20"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Clear Logs
                </button>
              )}
            </div>
          </div>

          {auditLogs.length === 0 ? (
            <div className="text-center py-16 border border-dashed border-border/40 rounded-lg">
              <Mail className="w-8 h-8 text-muted-foreground/40 mx-auto mb-2" />
              <div className="text-sm text-muted-foreground">No email dispatches recorded in this session.</div>
              <p className="text-xs text-muted-foreground/70 mt-1">
                Trigger a test email from the preview studio to view real-time audit records.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-border/40 bg-accent/20 text-muted-foreground font-mono uppercase text-[10px]">
                    <th className="py-2.5 px-3">Timestamp</th>
                    <th className="py-2.5 px-3">Recipient</th>
                    <th className="py-2.5 px-3">Template / ID</th>
                    <th className="py-2.5 px-3">Subject Line</th>
                    <th className="py-2.5 px-3 text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/20 font-mono">
                  {auditLogs.map(log => (
                    <tr key={log.id} className="hover:bg-accent/10 transition-colors">
                      <td className="py-2.5 px-3 text-muted-foreground">
                        {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                      </td>
                      <td className="py-2.5 px-3 font-semibold text-foreground">{log.to}</td>
                      <td className="py-2.5 px-3 text-brass">{log.templateId || 'custom'}</td>
                      <td className="py-2.5 px-3 text-muted-foreground truncate max-w-xs">{log.subject}</td>
                      <td className="py-2.5 px-3 text-right">
                        {log.status === 'SENT' && (
                          <span className="inline-flex items-center gap-1 text-[10px] text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20 font-semibold">
                            <Check className="w-3 h-3" /> SENT (SMTP)
                          </span>
                        )}
                        {log.status === 'SIMULATED' && (
                          <span className="inline-flex items-center gap-1 text-[10px] text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20 font-semibold">
                            <Clock className="w-3 h-3" /> SIMULATED
                          </span>
                        )}
                        {log.status === 'FAILED' && (
                          <span className="inline-flex items-center gap-1 text-[10px] text-destructive bg-destructive/10 px-2 py-0.5 rounded border border-destructive/20 font-semibold" title={log.errorMessage}>
                            <AlertTriangle className="w-3 h-3" /> FAILED
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      ) : (
        /* MAIN STUDIO VIEW */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* LEFT: TEMPLATES CATALOG (4 cols) */}
          <div className="lg:col-span-4 space-y-4">
            {/* Search & Filter */}
            <div className="bg-card border border-border/60 rounded-xl p-3.5 space-y-3">
              <div className="relative">
                <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Search template #, title, keyword..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 bg-background border border-border/60 rounded-lg text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-brass/60"
                />
              </div>

              {/* Category Pills */}
              <div className="flex flex-wrap gap-1">
                {categories.map(cat => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-2.5 py-1 rounded text-[10px] font-mono font-semibold uppercase transition-all ${
                      selectedCategory === cat
                        ? 'bg-brass text-black font-bold shadow-sm'
                        : 'bg-accent/40 text-muted-foreground hover:text-foreground hover:bg-accent'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Template List Cards */}
            <div className="space-y-2 max-h-[720px] overflow-y-auto pr-1">
              {filteredTemplates.map(tmpl => {
                const isSelected = tmpl.id === selectedTemplateId;
                return (
                  <button
                    key={tmpl.id}
                    onClick={() => {
                      setSelectedTemplateId(tmpl.id);
                      setSendResult(null);
                    }}
                    className={`w-full text-left p-3.5 rounded-xl border transition-all relative ${
                      isSelected
                        ? 'bg-accent/80 border-brass/70 shadow-md shadow-brass/5'
                        : 'bg-card hover:bg-accent/40 border-border/60'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-2">
                        <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-mono font-bold ${
                          isSelected ? 'bg-brass text-black' : 'bg-muted text-muted-foreground'
                        }`}>
                          {tmpl.number}
                        </span>
                        <span className="text-[10px] font-mono font-semibold uppercase tracking-wider text-muted-foreground">
                          [{tmpl.category}]
                        </span>
                      </div>
                      <span className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded uppercase ${
                        tmpl.badgeColor === 'brass' ? 'bg-brass/10 text-brass border border-brass/30' :
                        tmpl.badgeColor === 'emerald' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30' :
                        tmpl.badgeColor === 'sapphire' ? 'bg-blue-500/10 text-blue-400 border border-blue-500/30' :
                        tmpl.badgeColor === 'garnet' ? 'bg-rose-500/10 text-rose-400 border border-rose-500/30' :
                        'bg-zinc-500/10 text-zinc-400 border border-zinc-500/30'
                      }`}>
                        {tmpl.badgeColor}
                      </span>
                    </div>

                    <div className="text-xs font-semibold text-foreground tracking-tight">
                      {tmpl.title}
                    </div>
                    <div className="text-[11px] text-muted-foreground mt-1 line-clamp-2 leading-relaxed">
                      {tmpl.description}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* RIGHT: PREVIEW & DISPATCH DRAWER (8 cols) */}
          <div className="lg:col-span-8 space-y-4">
            {/* Top Toolbar */}
            <div className="bg-card border border-border/60 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded bg-brass/20 text-brass flex items-center justify-center text-xs font-mono font-bold">
                  #{activeTemplate.number}
                </span>
                <div>
                  <h3 className="text-sm font-semibold text-foreground">{activeTemplate.title}</h3>
                  <div className="text-[10px] font-mono text-muted-foreground truncate max-w-sm">
                    Subject: <span className="text-foreground">{generatedEmail.subject}</span>
                  </div>
                </div>
              </div>

              {/* Viewport & Mode Controls */}
              <div className="flex items-center gap-2">
                <div className="flex items-center bg-background border border-border/60 rounded-lg p-0.5">
                  <button
                    onClick={() => setPreviewMode('visual')}
                    className={`px-2.5 py-1 rounded text-xs flex items-center gap-1.5 font-medium transition-colors ${
                      previewMode === 'visual' ? 'bg-accent text-foreground' : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    <Eye className="w-3.5 h-3.5" /> Visual
                  </button>
                  <button
                    onClick={() => setPreviewMode('code')}
                    className={`px-2.5 py-1 rounded text-xs flex items-center gap-1.5 font-medium transition-colors ${
                      previewMode === 'code' ? 'bg-accent text-foreground' : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    <Code className="w-3.5 h-3.5" /> HTML
                  </button>
                </div>

                {previewMode === 'visual' && (
                  <div className="flex items-center bg-background border border-border/60 rounded-lg p-0.5">
                    <button
                      onClick={() => setViewPort('desktop')}
                      className={`p-1.5 rounded transition-colors ${
                        viewPort === 'desktop' ? 'bg-accent text-brass' : 'text-muted-foreground hover:text-foreground'
                      }`}
                      title="Desktop View (650px)"
                    >
                      <Monitor className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => setViewPort('mobile')}
                      className={`p-1.5 rounded transition-colors ${
                        viewPort === 'mobile' ? 'bg-accent text-brass' : 'text-muted-foreground hover:text-foreground'
                      }`}
                      title="Mobile View (375px)"
                    >
                      <Smartphone className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Test Send Form & Real User Fast Selector */}
            <div className="bg-card border border-border/60 rounded-xl p-4 space-y-3">
              {allUsers.length > 0 && (
                <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
                  <span className="text-[10px] font-mono uppercase text-muted-foreground shrink-0 flex items-center gap-1">
                    <Users className="w-3 h-3 text-brass" /> Select Firestore User:
                  </span>
                  {allUsers.slice(0, 4).map((u: any) => (
                    <button
                      key={u.uid}
                      onClick={() => setRecipientEmail(u.email)}
                      className={`px-2 py-0.5 rounded text-[11px] font-mono transition-colors shrink-0 border ${
                        recipientEmail === u.email
                          ? 'bg-brass/15 border-brass text-brass font-bold'
                          : 'bg-background hover:bg-accent border-border/50 text-muted-foreground'
                      }`}
                    >
                      {u.displayName || u.email.split('@')[0]} ({u.email})
                    </button>
                  ))}
                </div>
              )}

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                <div className="flex-1">
                  <label className="text-[10px] font-mono uppercase text-muted-foreground font-semibold block mb-1">
                    Send Live Test Email To:
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-muted-foreground absolute left-3 top-2.5" />
                    <input
                      type="email"
                      value={recipientEmail}
                      onChange={e => setRecipientEmail(e.target.value)}
                      placeholder="investor@example.com"
                      className="w-full pl-9 pr-3 py-1.5 bg-background border border-border/60 rounded-lg text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-brass/60 font-mono"
                    />
                  </div>
                </div>

                <div className="sm:self-end">
                  <button
                    onClick={handleSendTestEmail}
                    disabled={isSending}
                    className="w-full sm:w-auto px-5 py-2 rounded-lg bg-gradient-to-r from-brass to-brass/80 text-black text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 shadow-md shadow-brass/10 hover:opacity-95 disabled:opacity-50 transition-all cursor-pointer"
                  >
                    {isSending ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Dispatching...
                      </>
                    ) : (
                      <>
                        <Send className="w-3.5 h-3.5" /> Dispatch Test Email
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Status Alert Banner */}
              {sendResult && (
                <div className={`p-3 rounded-lg text-xs flex items-start gap-2.5 border ${
                  sendResult.success
                    ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                    : 'bg-destructive/10 border-destructive/30 text-destructive'
                }`}>
                  {sendResult.success ? (
                    <CheckCircle2 className="w-4 h-4 mt-0.5 shrink-0" />
                  ) : (
                    <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
                  )}
                  <div className="flex-1">
                    <div className="font-semibold">{sendResult.message}</div>
                  </div>
                </div>
              )}
            </div>

            {/* Preview Canvas */}
            <div className="bg-[#06080E] border border-border/60 rounded-xl p-4 overflow-hidden min-h-[640px] flex items-center justify-center">
              {previewMode === 'code' ? (
                <div className="w-full h-[620px] overflow-auto bg-[#0A0E16] p-4 rounded-lg border border-border/40 font-mono text-[11px] text-emerald-400/90 whitespace-pre">
                  {generatedEmail.html}
                </div>
              ) : (
                <div
                  className="transition-all duration-300 rounded-lg overflow-hidden border border-border/50 shadow-2xl bg-[#0A0E16]"
                  style={{
                    width: viewPort === 'mobile' ? '375px' : '650px',
                    height: '620px'
                  }}
                >
                  <iframe
                    title="Email Preview"
                    srcDoc={generatedEmail.html}
                    className="w-full h-full border-0 bg-[#0A0E16]"
                    sandbox="allow-same-origin"
                  />
                </div>
              )}
            </div>

          </div>

        </div>
      )}
    </div>
  );
};
