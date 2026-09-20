// src/pages/admin/AdminEmailHub.tsx
import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
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
  Play,
  Layers,
  Terminal,
  Activity,
  X
} from 'lucide-react';
import { EMAIL_TEMPLATES_CATALOG, type EmailTemplateDefinition } from '../../templates/emails';
import { emailService, type EmailAuditLogEntry } from '../../services/emailService';
import { subscriptionRepository } from '../../repositories/subscriptionRepository';
import { useUserStore } from '../../stores/userStore';
import type { Subscription } from '../../types/models';

export const AdminEmailHub: React.FC = () => {
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>(EMAIL_TEMPLATES_CATALOG[0].id);
  const [previewMode, setPreviewMode] = useState<'visual' | 'code'>('visual');
  const [viewPort, setViewPort] = useState<'desktop' | 'mobile'>('desktop');
  const [recipientEmail, setRecipientEmail] = useState<string>(import.meta.env.VITE_ADMIN_NOTIFICATION_EMAIL || '');
  const [isSending, setIsSending] = useState<boolean>(false);
  const [sendResult, setSendResult] = useState<{ success: boolean; message: string; mocked?: boolean } | null>(null);
  const [auditLogs, setAuditLogs] = useState<EmailAuditLogEntry[]>([]);
  const [activeTab, setActiveTab] = useState<'preview' | 'cron' | 'subscriptions' | 'logs'>('preview');
  const [copiedCode, setCopiedCode] = useState<boolean>(false);
  const [selectedLog, setSelectedLog] = useState<EmailAuditLogEntry | null>(null);

  // Cron & Webhook execution state
  const [isExecutingCron, setIsExecutingCron] = useState<boolean>(false);
  const [cronResult, setCronResult] = useState<{
    scanned?: number;
    warningsSent: number;
    expiredSent: number;
    errors: string[];
    logs: string[];
  } | null>(null);
  const [copiedWebhook, setCopiedWebhook] = useState<boolean>(false);
  const [copiedCurl, setCopiedCurl] = useState<boolean>(false);
  const [isPingingWebhook, setIsPingingWebhook] = useState<boolean>(false);
  const [webhookPingResult, setWebhookPingResult] = useState<any>(null);

  // Live Firestore subscriptions
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [isLoadingSubs, setIsLoadingSubs] = useState<boolean>(false);

  const { allUsers, fetchAllUsers } = useUserStore();

  // Load audit logs, users, and subscriptions on mount
  useEffect(() => {
    setAuditLogs(emailService.getAuditLogs());
    fetchAllUsers();
    fetchSubscriptions();
  }, [fetchAllUsers]);

  const fetchSubscriptions = async () => {
    setIsLoadingSubs(true);
    try {
      const subs = await subscriptionRepository.getAllSubscriptions();
      setSubscriptions(subs);
    } catch (err) {
      console.error('[AdminEmailHub] Failed to fetch subscriptions:', err);
    } finally {
      setIsLoadingSubs(false);
    }
  };

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
      fetchSubscriptions();
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

  const handleCopyCurl = () => {
    const webhookUrl = `${window.location.origin}/api/cron/check-subscriptions`;
    const curlCmd = `curl -X POST "${webhookUrl}"`;
    navigator.clipboard.writeText(curlCmd);
    setCopiedCurl(true);
    setTimeout(() => setCopiedCurl(false), 2000);
  };

  const handlePingWebhook = async () => {
    setIsPingingWebhook(true);
    setWebhookPingResult(null);
    try {
      const res = await fetch('/api/cron/check-subscriptions', { method: 'POST' });
      const data = await res.json();
      setWebhookPingResult({ status: res.status, ok: res.ok, data });
      refreshLogs();
    } catch (err: any) {
      setWebhookPingResult({ status: 500, ok: false, data: { error: err.message || 'Failed to ping webhook' } });
    } finally {
      setIsPingingWebhook(false);
    }
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

  const handleCopyHtml = () => {
    navigator.clipboard.writeText(generatedEmail.html);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

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
    <div className="space-y-6 max-w-7xl mx-auto font-sans">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border pb-5">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="px-2.5 py-0.5 rounded text-[10px] font-mono font-bold tracking-wider bg-primary/10 text-primary border border-primary/25">
              SMTP ENGINE • 17 TEMPLATES
            </span>
            <span className="flex items-center gap-1.5 text-[11px] text-muted-foreground font-mono bg-emerald-500/10 text-emerald-500 px-2.5 py-0.5 rounded border border-emerald-500/20">
              <ShieldCheck className="w-3.5 h-3.5" />
              Live Records Synchronized
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-semibold tracking-tight text-foreground">
            Institutional Email Hub & Delivery System
          </h1>
          <p className="text-xs text-muted-foreground font-mono mt-0.5">
            Preview, test, and automate all investor communications with real-time synchronization and automated schedule connectivity.
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center gap-1.5 p-1 rounded-lg bg-card border border-border self-start md:self-auto shadow-xs">
          <button
            onClick={() => setActiveTab('preview')}
            className={`px-3.5 py-1.5 rounded-md text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
              activeTab === 'preview'
                ? 'bg-primary text-primary-foreground shadow-xs'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted/40'
            }`}
          >
            <Eye className="w-3.5 h-3.5" />
            <span>Studio Preview</span>
          </button>
          <button
            onClick={() => setActiveTab('cron')}
            className={`px-3.5 py-1.5 rounded-md text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
              activeTab === 'cron'
                ? 'bg-primary text-primary-foreground shadow-xs'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted/40'
            }`}
          >
            <Calendar className="w-3.5 h-3.5" />
            <span>Cron Automation</span>
          </button>
          <button
            onClick={() => {
              setActiveTab('subscriptions');
              fetchSubscriptions();
            }}
            className={`px-3.5 py-1.5 rounded-md text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
              activeTab === 'subscriptions'
                ? 'bg-primary text-primary-foreground shadow-xs'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted/40'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Active Mandates ({subscriptions.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('logs')}
            className={`px-3.5 py-1.5 rounded-md text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
              activeTab === 'logs'
                ? 'bg-primary text-primary-foreground shadow-xs'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted/40'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Audit Logs ({auditLogs.length})</span>
          </button>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          TAB 1: CRON AUTOMATION
      ───────────────────────────────────────────────────────────── */}
      {activeTab === 'cron' ? (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* Left: Live Trigger Card */}
            <div className="lg:col-span-6 glass-panel p-6 space-y-5">
              <div className="flex items-center justify-between border-b border-border pb-4">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-lg bg-primary/10 border border-primary/25 flex items-center justify-center text-primary">
                    <Zap className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-sm font-semibold text-foreground">Subscription Lifecycle Cron</h2>
                    <p className="text-[11px] text-muted-foreground font-mono">Pulls active user records and processes automated warnings</p>
                  </div>
                </div>
              </div>

              <div className="p-4 rounded-lg bg-muted/40 border border-border space-y-2 text-xs">
                <div className="text-[10px] font-mono text-primary uppercase font-bold tracking-wider">Automation Logic:</div>
                <ul className="space-y-2 text-muted-foreground list-disc list-inside font-sans text-xs">
                  <li><strong>7-Day Expiry Warning:</strong> Scans active mandates expiring in &le; 7 days, pulls investor details, and dispatches Template #6.</li>
                  <li><strong>Subscription Expired Notice:</strong> Detects expired subscriptions, transitions status to <code className="text-primary font-mono bg-primary/10 px-1 py-0.5 rounded">expired</code>, and dispatches Template #7.</li>
                  <li><strong>Deduplication Shield:</strong> Records <code className="text-primary font-mono bg-primary/10 px-1 py-0.5 rounded">warningEmailSentAt</code> and <code className="text-primary font-mono bg-primary/10 px-1 py-0.5 rounded">expiredNoticeSentAt</code> to prevent repeated emails.</li>
                </ul>
              </div>

              <button
                onClick={handleRunCron}
                disabled={isExecutingCron}
                className="w-full py-3 px-4 rounded-md bg-primary hover:opacity-90 text-primary-foreground font-semibold text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer disabled:opacity-50"
              >
                {isExecutingCron ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Evaluating Active Subscriptions...</span>
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4 fill-current" />
                    <span>Execute Lifecycle Scan Now</span>
                  </>
                )}
              </button>

              {cronResult && (
                <div className={`p-4 rounded-lg border text-xs space-y-3 ${
                  cronResult.errors.length > 0
                    ? 'bg-amber-500/10 border-amber-500/30 text-amber-500'
                    : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-500'
                }`}>
                  <div className="flex items-center justify-between font-bold text-sm">
                    <span className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4" /> Scan Execution Complete
                    </span>
                    <span className="font-mono text-xs">{new Date().toLocaleTimeString('en-IN', { timeZone: 'Asia/Kolkata' })} IST</span>
                  </div>

                  <div className="grid grid-cols-3 gap-2 pt-2 border-t border-border font-mono text-center">
                    <div className="p-2 rounded bg-card border border-border">
                      <div className="text-[10px] text-muted-foreground uppercase">Scanned</div>
                      <div className="text-base font-bold text-foreground">{cronResult.scanned ?? 0}</div>
                    </div>
                    <div className="p-2 rounded bg-card border border-border">
                      <div className="text-[10px] text-muted-foreground uppercase">7-Day Warnings</div>
                      <div className="text-base font-bold text-primary">{cronResult.warningsSent}</div>
                    </div>
                    <div className="p-2 rounded bg-card border border-border">
                      <div className="text-[10px] text-muted-foreground uppercase">Expired Notices</div>
                      <div className="text-base font-bold text-emerald-500">{cronResult.expiredSent}</div>
                    </div>
                  </div>

                  {cronResult.logs.length > 0 && (
                    <div className="space-y-1 pt-2 border-t border-border text-[11px] font-mono">
                      {cronResult.logs.map((l, i) => (
                        <div key={i} className="text-emerald-500">• {l}</div>
                      ))}
                    </div>
                  )}

                  {cronResult.errors.length > 0 && (
                    <div className="space-y-1 pt-2 border-t border-destructive/30 text-[11px] font-mono text-destructive">
                      {cronResult.errors.map((e, i) => (
                        <div key={i}>× {e}</div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Right: cron-job.org Integration Guide & Live Webhook Ping */}
            <div className="lg:col-span-6 glass-panel p-6 space-y-5">
              <div className="flex items-center gap-2.5 border-b border-border pb-4">
                <div className="w-9 h-9 rounded-lg bg-primary/10 border border-primary/25 flex items-center justify-center text-primary">
                  <ExternalLink className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-sm font-semibold text-foreground">cron-job.org Setup Instructions</h2>
                  <p className="text-[11px] text-muted-foreground font-mono">Configure free recurring 24/7 background scheduling</p>
                </div>
              </div>

              <div className="space-y-3 text-xs text-muted-foreground">
                <p className="leading-relaxed">
                  To run automatic daily subscription checks even when no administrator is logged in, register this webhook URL in <strong className="text-foreground">cron-job.org</strong>:
                </p>

                {/* Webhook URL bar */}
                <div className="p-3 rounded-lg bg-muted/40 border border-border font-mono text-[11px] flex items-center justify-between gap-2">
                  <span className="text-primary truncate">
                    {window.location.origin}/api/cron/check-subscriptions
                  </span>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      onClick={handleCopyWebhook}
                      className="px-2.5 py-1 rounded bg-card hover:bg-accent text-foreground text-xs flex items-center gap-1 border border-border cursor-pointer transition-colors"
                      title="Copy Webhook URL"
                    >
                      {copiedWebhook ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedWebhook ? 'Copied' : 'Copy URL'}</span>
                    </button>
                    <button
                      onClick={handleCopyCurl}
                      className="px-2.5 py-1 rounded bg-card hover:bg-accent text-foreground text-xs flex items-center gap-1 border border-border cursor-pointer transition-colors"
                      title="Copy cURL command"
                    >
                      {copiedCurl ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Terminal className="w-3.5 h-3.5" />}
                      <span>{copiedCurl ? 'Copied' : 'cURL'}</span>
                    </button>
                  </div>
                </div>

                {/* Live Webhook Ping Tester */}
                <div className="pt-2">
                  <button
                    onClick={handlePingWebhook}
                    disabled={isPingingWebhook}
                    className="w-full py-2 px-3 rounded bg-muted hover:bg-accent border border-border text-xs font-mono font-semibold text-foreground flex items-center justify-center gap-2 transition-colors cursor-pointer"
                  >
                    <Activity className={`w-3.5 h-3.5 ${isPingingWebhook ? 'animate-spin' : 'text-primary'}`} />
                    <span>{isPingingWebhook ? 'Pinging Webhook Endpoint...' : 'Send Live Test Ping to Endpoint'}</span>
                  </button>

                  {webhookPingResult && (
                    <div className={`mt-2 p-3 rounded border text-xs font-mono ${
                      webhookPingResult.ok
                        ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-500'
                        : 'bg-destructive/10 border-destructive/30 text-destructive'
                    }`}>
                      <div className="flex justify-between items-center mb-1 font-bold">
                        <span>HTTP {webhookPingResult.status} {webhookPingResult.ok ? 'OK' : 'ERROR'}</span>
                        <span className="text-[10px] text-muted-foreground">{new Date().toLocaleTimeString()}</span>
                      </div>
                      <pre className="text-[11px] overflow-x-auto whitespace-pre-wrap">
                        {JSON.stringify(webhookPingResult.data, null, 2)}
                      </pre>
                    </div>
                  )}
                </div>

                {/* Recommended settings table */}
                <div className="space-y-2 pt-2 border-t border-border">
                  <div className="font-semibold text-foreground text-xs">Recommended cron-job.org Settings:</div>
                  <div className="grid grid-cols-2 gap-2 text-[11px] font-mono">
                    <div className="p-2.5 rounded bg-muted/40 border border-border">
                      <div className="text-muted-foreground">Schedule:</div>
                      <div className="text-foreground font-semibold">Every Day @ 09:00 IST</div>
                    </div>
                    <div className="p-2.5 rounded bg-muted/40 border border-border">
                      <div className="text-muted-foreground">HTTP Method:</div>
                      <div className="text-foreground font-semibold">GET / POST</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      ) : activeTab === 'subscriptions' ? (
        /* ─────────────────────────────────────────────────────────────
            TAB 2: ACTIVE MANDATES & FIRESTORE SUBSCRIPTIONS
        ───────────────────────────────────────────────────────────── */
        <div className="glass-panel p-5 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border pb-4">
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-primary" />
              <h2 className="text-sm font-semibold text-foreground">Active Subscriptions Registry</h2>
              <span className="text-xs text-muted-foreground font-mono">({subscriptions.length} total mandates recorded)</span>
            </div>
            <button
              onClick={fetchSubscriptions}
              disabled={isLoadingSubs}
              className="px-3 py-1.5 rounded-md bg-muted hover:bg-accent text-foreground text-xs font-mono flex items-center gap-1.5 border border-border cursor-pointer transition-colors"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoadingSubs ? 'animate-spin' : ''}`} />
              <span>Refresh Subscription Data</span>
            </button>
          </div>

          {subscriptions.length === 0 ? (
            <div className="text-center py-16 border border-dashed border-border rounded-lg">
              <Layers className="w-8 h-8 text-muted-foreground mx-auto mb-2 opacity-50" />
              <div className="text-sm font-semibold text-foreground">No Subscriptions Found</div>
              <p className="text-xs text-muted-foreground mt-1">When users subscribe to quant plans, their records will appear here with live expiry status.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs whitespace-nowrap">
                <thead>
                  <tr className="border-b border-border text-[10px] font-mono uppercase tracking-wider text-muted-foreground bg-muted/30">
                    <th className="py-2.5 px-3">Subscriber</th>
                    <th className="py-2.5 px-3">Advisory Strategy</th>
                    <th className="py-2.5 px-3">Expiry Date</th>
                    <th className="py-2.5 px-3 text-center">Days Left</th>
                    <th className="py-2.5 px-3 text-center">Status</th>
                    <th className="py-2.5 px-3 text-center">7-Day Warned</th>
                    <th className="py-2.5 px-3 text-center">Expired Notice</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60 font-mono">
                  {subscriptions.map((sub: any) => {
                    const now = Date.now();
                    const expTime = typeof sub.expiresAt === 'number' ? sub.expiresAt : new Date(sub.expiresAt).getTime();
                    const daysLeft = Math.ceil((expTime - now) / (1000 * 60 * 60 * 24));
                    const isExp = now >= expTime || sub.status === 'expired';

                    return (
                      <tr key={sub.id} className="hover:bg-muted/30 transition-colors">
                        <td className="py-3 px-3">
                          <div className="font-semibold text-foreground font-sans">{sub.userName || 'Investor'}</div>
                          <div className="text-[11px] text-muted-foreground">{sub.userEmail || sub.userId}</div>
                        </td>
                        <td className="py-3 px-3 font-semibold text-foreground">
                          <span className="px-2 py-0.5 rounded bg-primary/10 text-primary border border-primary/20 text-[11px]">
                            {sub.planName || 'Quant Strategy'}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-muted-foreground">
                          {new Date(expTime).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                        </td>
                        <td className="py-3 px-3 text-center">
                          {isExp ? (
                            <span className="px-1.5 py-0.5 rounded bg-destructive/15 text-destructive font-bold text-[10px]">
                              EXPIRED
                            </span>
                          ) : (
                            <span className={`px-1.5 py-0.5 rounded font-bold text-[10px] ${
                              daysLeft <= 7 ? 'bg-amber-500/15 text-amber-500 border border-amber-500/30' : 'bg-emerald-500/15 text-emerald-500'
                            }`}>
                              {daysLeft} Day{daysLeft === 1 ? '' : 's'}
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-3 text-center">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                            sub.status === 'active' ? 'bg-emerald-500/15 text-emerald-500 border border-emerald-500/30' : 'bg-destructive/15 text-destructive'
                          }`}>
                            {sub.status || 'active'}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-center">
                          {sub.warningEmailSentAt ? (
                            <span className="inline-flex items-center gap-1 text-[10px] text-emerald-500" title={`Sent at: ${sub.warningEmailSentAt}`}>
                              <CheckCircle2 className="w-3.5 h-3.5" /> Yes
                            </span>
                          ) : (
                            <span className="text-muted-foreground text-[10px]">—</span>
                          )}
                        </td>
                        <td className="py-3 px-3 text-center">
                          {sub.expiredNoticeSentAt ? (
                            <span className="inline-flex items-center gap-1 text-[10px] text-emerald-500" title={`Sent at: ${sub.expiredNoticeSentAt}`}>
                              <CheckCircle2 className="w-3.5 h-3.5" /> Yes
                            </span>
                          ) : (
                            <span className="text-muted-foreground text-[10px]">—</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      ) : activeTab === 'logs' ? (
        /* ─────────────────────────────────────────────────────────────
            TAB 3: AUDIT LOGS
        ───────────────────────────────────────────────────────────── */
        <div className="glass-panel p-5 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border pb-4">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-primary" />
              <h2 className="text-sm font-semibold text-foreground">Recent Dispatch Activity</h2>
              <span className="text-xs text-muted-foreground font-mono">({auditLogs.length} events logged)</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={refreshLogs}
                className="px-2.5 py-1.5 rounded-md bg-muted hover:bg-accent text-foreground text-xs flex items-center gap-1 border border-border cursor-pointer transition-colors"
                title="Refresh logs"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Refresh</span>
              </button>
              {auditLogs.length > 0 && (
                <button
                  onClick={handleClearLogs}
                  className="px-2.5 py-1.5 rounded-md bg-destructive/10 hover:bg-destructive/20 text-destructive text-xs flex items-center gap-1 border border-destructive/20 cursor-pointer transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Clear Logs</span>
                </button>
              )}
            </div>
          </div>

          {auditLogs.length === 0 ? (
            <div className="text-center py-16 border border-dashed border-border rounded-lg">
              <Mail className="w-8 h-8 text-muted-foreground mx-auto mb-2 opacity-50" />
              <div className="text-sm font-semibold text-foreground">No email dispatches recorded in this session.</div>
              <p className="text-xs text-muted-foreground mt-1">
                Trigger a test email from the preview studio to view real-time audit records.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs whitespace-nowrap">
                <thead>
                  <tr className="border-b border-border text-[10px] font-mono uppercase tracking-wider text-muted-foreground bg-muted/30">
                    <th className="py-2.5 px-3">Timestamp</th>
                    <th className="py-2.5 px-3">Recipient</th>
                    <th className="py-2.5 px-3">Template ID</th>
                    <th className="py-2.5 px-3">Subject Line</th>
                    <th className="py-2.5 px-3 text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60 font-mono">
                  {auditLogs.map(log => (
                    <tr
                      key={log.id}
                      onClick={() => setSelectedLog(log)}
                      className="hover:bg-muted/30 transition-colors cursor-pointer"
                    >
                      <td className="py-2.5 px-3 text-muted-foreground">
                        {new Date(log.timestamp).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                      </td>
                      <td className="py-2.5 px-3 font-semibold text-foreground">{log.to}</td>
                      <td className="py-2.5 px-3 text-primary">{log.templateId || 'custom'}</td>
                      <td className="py-2.5 px-3 text-muted-foreground truncate max-w-xs">{log.subject}</td>
                      <td className="py-2.5 px-3 text-right">
                        {log.status === 'SENT' && (
                          <span className="inline-flex items-center gap-1 text-[10px] text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20 font-semibold">
                            <Check className="w-3 h-3" /> SENT (SMTP)
                          </span>
                        )}
                        {log.status === 'SIMULATED' && (
                          <span className="inline-flex items-center gap-1 text-[10px] text-amber-500 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20 font-semibold">
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
        /* ─────────────────────────────────────────────────────────────
            TAB 4: MAIN STUDIO VIEW (PREVIEW & DISPATCH)
        ───────────────────────────────────────────────────────────── */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* LEFT: TEMPLATES CATALOG (4 cols) */}
          <div className="lg:col-span-4 space-y-4">
            {/* Search & Filter */}
            <div className="glass-panel p-3.5 space-y-3">
              <div className="relative">
                <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-2.5 pointer-events-none" />
                <input
                  type="text"
                  placeholder="Search template #, title, keyword..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 bg-background border border-border rounded-md text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary font-mono"
                />
              </div>

              {/* Category Pills */}
              <div className="flex flex-wrap gap-1">
                {categories.map(cat => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-2.5 py-1 rounded text-[10px] font-mono font-semibold uppercase transition-all cursor-pointer ${
                      selectedCategory === cat
                        ? 'bg-primary text-primary-foreground font-bold shadow-xs'
                        : 'bg-muted/40 text-muted-foreground hover:text-foreground hover:bg-muted'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Template List Cards */}
            <div className="space-y-2 max-h-[680px] overflow-y-auto pr-1">
              {filteredTemplates.map(tmpl => {
                const isSelected = tmpl.id === selectedTemplateId;
                return (
                  <button
                    key={tmpl.id}
                    onClick={() => {
                      setSelectedTemplateId(tmpl.id);
                      setSendResult(null);
                    }}
                    className={`w-full text-left p-3.5 rounded-lg border transition-all relative cursor-pointer ${
                      isSelected
                        ? 'glass-panel border-primary shadow-xs ring-1 ring-primary/40'
                        : 'bg-card hover:bg-muted/30 border-border'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-2">
                        <span className={`w-5 h-5 rounded flex items-center justify-center text-[10px] font-mono font-bold ${
                          isSelected ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
                        }`}>
                          {tmpl.number}
                        </span>
                        <span className="text-[10px] font-mono font-semibold uppercase tracking-wider text-muted-foreground">
                          [{tmpl.category}]
                        </span>
                      </div>
                      <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded uppercase bg-primary/10 text-primary border border-primary/20">
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
            <div className="glass-panel p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <span className="w-7 h-7 rounded bg-primary/15 text-primary flex items-center justify-center text-xs font-mono font-bold border border-primary/25">
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
                <div className="flex items-center bg-muted/40 border border-border rounded-md p-0.5">
                  <button
                    onClick={() => setPreviewMode('visual')}
                    className={`px-2.5 py-1 rounded text-xs flex items-center gap-1.5 font-medium transition-colors cursor-pointer ${
                      previewMode === 'visual' ? 'bg-card text-foreground font-semibold shadow-xs' : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    <Eye className="w-3.5 h-3.5" /> Visual
                  </button>
                  <button
                    onClick={() => setPreviewMode('code')}
                    className={`px-2.5 py-1 rounded text-xs flex items-center gap-1.5 font-medium transition-colors cursor-pointer ${
                      previewMode === 'code' ? 'bg-card text-foreground font-semibold shadow-xs' : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    <Code className="w-3.5 h-3.5" /> HTML
                  </button>
                </div>

                {previewMode === 'visual' ? (
                  <div className="flex items-center bg-muted/40 border border-border rounded-md p-0.5">
                    <button
                      onClick={() => setViewPort('desktop')}
                      className={`p-1.5 rounded transition-colors cursor-pointer ${
                        viewPort === 'desktop' ? 'bg-card text-primary font-semibold shadow-xs' : 'text-muted-foreground hover:text-foreground'
                      }`}
                      title="Desktop View (650px)"
                    >
                      <Monitor className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => setViewPort('mobile')}
                      className={`p-1.5 rounded transition-colors cursor-pointer ${
                        viewPort === 'mobile' ? 'bg-card text-primary font-semibold shadow-xs' : 'text-muted-foreground hover:text-foreground'
                      }`}
                      title="Mobile View (375px)"
                    >
                      <Smartphone className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={handleCopyHtml}
                    className="px-2.5 py-1 rounded bg-muted/40 hover:bg-muted text-foreground text-xs flex items-center gap-1.5 border border-border cursor-pointer transition-colors"
                  >
                    {copiedCode ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedCode ? 'Copied HTML' : 'Copy HTML'}</span>
                  </button>
                )}
              </div>
            </div>

            {/* Test Send Form & Real User Fast Selector */}
            <div className="glass-panel p-4 space-y-3">
              {allUsers.length > 0 && (
                <div className="space-y-1">
                  <label className="text-[10px] font-mono uppercase text-muted-foreground flex items-center gap-1 font-semibold">
                    <Users className="w-3 h-3 text-primary" /> Quick-Fill Recipient from User Directory ({allUsers.length} users)
                  </label>
                  <select
                    value={recipientEmail}
                    onChange={(e) => setRecipientEmail(e.target.value)}
                    className="w-full bg-background border border-border rounded-md px-3 py-1.5 text-xs font-mono text-foreground focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer"
                  >
                    <option value="">— Select a user from directory —</option>
                    {allUsers.map((u: any) => (
                      <option key={u.uid} value={u.email}>
                        {u.displayName || 'Unknown'} · {u.email}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                <div className="flex-1">
                  <label className="text-[10px] font-mono uppercase text-muted-foreground font-semibold block mb-1">
                    Send Live Test Email To:
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-muted-foreground absolute left-3 top-2.5 pointer-events-none" />
                    <input
                      type="email"
                      value={recipientEmail}
                      onChange={e => setRecipientEmail(e.target.value)}
                      placeholder="investor@example.com"
                      className="w-full pl-9 pr-3 py-1.5 bg-background border border-border rounded-md text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary font-mono"
                    />
                  </div>
                </div>

                <div className="sm:self-end">
                  <button
                    onClick={handleSendTestEmail}
                    disabled={isSending}
                    className="w-full sm:w-auto px-5 py-2 rounded-md bg-primary hover:opacity-90 text-primary-foreground text-xs font-semibold uppercase tracking-wider flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer disabled:opacity-50"
                  >
                    {isSending ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        <span>Dispatching...</span>
                      </>
                    ) : (
                      <>
                        <Send className="w-3.5 h-3.5" />
                        <span>Dispatch Test Email</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Status Alert Banner */}
              {sendResult && (
                <div className={`p-3 rounded-md text-xs flex items-start gap-2.5 border ${
                  sendResult.success
                    ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-500'
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
            <div className="bg-muted/30 border border-border rounded-lg p-4 overflow-hidden min-h-[640px] flex items-center justify-center">
              {previewMode === 'code' ? (
                <div className="w-full h-[620px] overflow-auto bg-card p-4 rounded-md border border-border font-mono text-[11px] text-foreground whitespace-pre">
                  {generatedEmail.html}
                </div>
              ) : (
                <div
                  className="transition-all duration-300 rounded-md overflow-hidden border border-border shadow-xl bg-card"
                  style={{
                    width: viewPort === 'mobile' ? '375px' : '650px',
                    height: '620px'
                  }}
                >
                  <iframe
                    title="Email Preview"
                    srcDoc={generatedEmail.html}
                    className="w-full h-full border-0 bg-card"
                    sandbox="allow-same-origin"
                  />
                </div>
              )}
            </div>

          </div>

        </div>
      )}

      {/* Audit Log Modal */}
      <AnimatePresence>
        {selectedLog && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-card border border-border rounded-xl max-w-lg w-full p-6 space-y-4 shadow-2xl relative"
            >
              <div className="flex items-center justify-between border-b border-border pb-3">
                <div className="flex items-center gap-2 font-semibold text-sm text-foreground">
                  <Mail className="w-4 h-4 text-primary" />
                  <span>Email Dispatch Details</span>
                </div>
                <button
                  onClick={() => setSelectedLog(null)}
                  className="p-1 rounded text-muted-foreground hover:text-foreground hover:bg-muted"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-2.5 font-mono text-xs">
                <div className="flex justify-between py-1 border-b border-border/50">
                  <span className="text-muted-foreground">Log ID:</span>
                  <span className="text-foreground">{selectedLog.id}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-border/50">
                  <span className="text-muted-foreground">Timestamp:</span>
                  <span className="text-foreground">{new Date(selectedLog.timestamp).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })} IST</span>
                </div>
                <div className="flex justify-between py-1 border-b border-border/50">
                  <span className="text-muted-foreground">Recipient:</span>
                  <span className="text-foreground font-semibold">{selectedLog.to}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-border/50">
                  <span className="text-muted-foreground">Template ID:</span>
                  <span className="text-primary font-bold">{selectedLog.templateId || 'custom'}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-border/50">
                  <span className="text-muted-foreground">Subject:</span>
                  <span className="text-foreground">{selectedLog.subject}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-border/50">
                  <span className="text-muted-foreground">Status:</span>
                  <span className={`font-bold ${
                    selectedLog.status === 'SENT' ? 'text-emerald-500' : selectedLog.status === 'SIMULATED' ? 'text-amber-500' : 'text-destructive'
                  }`}>
                    {selectedLog.status}
                  </span>
                </div>
                {selectedLog.errorMessage && (
                  <div className="p-2.5 rounded bg-destructive/10 border border-destructive/20 text-destructive text-[11px]">
                    {selectedLog.errorMessage}
                  </div>
                )}
              </div>

              <div className="flex justify-end pt-2">
                <button
                  onClick={() => setSelectedLog(null)}
                  className="px-4 py-2 rounded-md bg-muted hover:bg-accent text-foreground text-xs font-semibold"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
