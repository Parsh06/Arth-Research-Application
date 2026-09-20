import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Save, Database, RefreshCw, CheckCircle2, Trash2, AlertTriangle, UserX } from 'lucide-react';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { useToastStore } from '../../stores/toastStore';
import { integrityService } from '../../services/integrityService';
import { adminMaintenanceService, type PurgeResult } from '../../services/adminMaintenanceService';

export default function AdminSettings() {
  const { addToast } = useToastStore();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Form State
  const [platformName, setPlatformName] = useState('Arth Research Private Desk');
  const [entityLicenseNumber, setEntityLicenseNumber] = useState('');
  const [supportEmail, setSupportEmail] = useState(import.meta.env.VITE_SUPPORT_EMAIL || 'support@arthresearch.com');
  const [disclaimer, setDisclaimer] = useState('Quantitative research and model allocations are for informational purposes only. Securities investments carry risk.');
  const [maxStockWeight, setMaxStockWeight] = useState(25);
  const [razorpayKeyId, setRazorpayKeyId] = useState(import.meta.env.VITE_RAZORPAY_KEY_ID || '');

  // Diagnostics State
  const [isRunningDiagnostics, setIsRunningDiagnostics] = useState(false);
  const [diagnosticReport, setDiagnosticReport] = useState<any | null>(null);

  // Maintenance / Purge State
  const [targetEmail, setTargetEmail] = useState('');
  const [isPurgingUser, setIsPurgingUser] = useState(false);
  const [purgeUserResult, setPurgeUserResult] = useState<PurgeResult | null>(null);
  const [isPurgingLogs, setIsPurgingLogs] = useState(false);
  const [purgedLogsCount, setPurgedLogsCount] = useState<number | null>(null);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    setLoading(true);
    try {
      const snap = await getDoc(doc(db, 'settings', 'platform_config'));
      if (snap.exists()) {
        const data = snap.data();
        if (data.platformName) setPlatformName(data.platformName);
        if (data.entityLicenseNumber || data.licenseNumber) setEntityLicenseNumber(data.entityLicenseNumber || data.licenseNumber);
        if (data.supportEmail) setSupportEmail(data.supportEmail);
        if (data.disclaimer) setDisclaimer(data.disclaimer);
        if (data.maxStockWeight) setMaxStockWeight(data.maxStockWeight);
        if (data.razorpayKeyId) setRazorpayKeyId(data.razorpayKeyId);
      }
    } catch (err) {
      console.error("Failed to load settings:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await setDoc(doc(db, 'settings', 'platform_config'), {
        platformName,
        entityLicenseNumber,
        supportEmail,
        disclaimer,
        maxStockWeight: Number(maxStockWeight),
        razorpayKeyId,
        updatedAt: new Date().toISOString()
      }, { merge: true });

      addToast('Platform configuration saved successfully!', 'success');
    } catch (err: any) {
      console.error("Failed to save settings:", err);
      addToast('Failed to save settings. Please try again.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleRunDiagnostics = async () => {
    setIsRunningDiagnostics(true);
    try {
      const report = await integrityService.runSystemAudit();
      setDiagnosticReport(report);
      addToast('System integrity diagnostic complete.', 'success');
    } catch (err: any) {
      console.error("Diagnostic failed:", err);
      addToast('Integrity check failed. Please try again.', 'error');
    } finally {
      setIsRunningDiagnostics(false);
    }
  };

  const handlePurgeUser = async () => {
    if (!targetEmail.trim()) {
      addToast('Please enter an email address to purge.', 'error');
      return;
    }
    if (!window.confirm(`Permanently purge all data, portfolios, orders, and subscriptions for ${targetEmail}?`)) {
      return;
    }

    setIsPurgingUser(true);
    setPurgeUserResult(null);
    try {
      const res = await adminMaintenanceService.purgeUserDataByEmail(targetEmail);
      setPurgeUserResult(res);
      addToast(`Purged all records associated with ${targetEmail}`, 'success');
    } catch (err: any) {
      console.error("Purge user failed:", err);
      addToast('Failed to purge user records. Please try again.', 'error');
    } finally {
      setIsPurgingUser(false);
    }
  };

  const handlePurgeAuditLogs = async () => {
    if (!window.confirm("Permanently wipe all administrative audit records from the system?")) {
      return;
    }

    setIsPurgingLogs(true);
    setPurgedLogsCount(null);
    try {
      const count = await adminMaintenanceService.purgeAllAuditLogs();
      setPurgedLogsCount(count);
      addToast(`Successfully wiped ${count} audit entries`, 'success');
    } catch (err: any) {
      console.error("Purge audit logs failed:", err);
      addToast('Failed to purge audit records. Please try again.', 'error');
    } finally {
      setIsPurgingLogs(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-3">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        <span className="text-xs font-mono tracking-wider text-muted-foreground">Loading Platform Configuration...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="pb-4 border-b border-border">
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-mono uppercase tracking-wider text-primary bg-primary/10 px-2.5 py-0.5 rounded border border-primary/20">
            System Settings
          </span>
        </div>
        <h1 className="text-xl sm:text-2xl font-semibold tracking-tight text-foreground mt-1">
          Platform Governance & Controls
        </h1>
        <p className="text-xs text-muted-foreground font-mono mt-0.5">
          Configure advisory parameters, risk limits, and execute operational maintenance routines.
        </p>
      </div>

      <form onSubmit={handleSaveSettings} className="space-y-6">
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-panel p-6 shadow-sm space-y-5"
        >
          <div className="pb-3 border-b border-border">
            <h3 className="text-sm font-semibold text-foreground">Advisory Entity Registration</h3>
            <p className="text-xs font-mono text-muted-foreground mt-0.5">Public advisory entity identifiers</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-mono">
            <div>
              <label className="block text-xs font-mono text-muted-foreground mb-1.5">Platform Entity Name</label>
              <input
                type="text"
                value={platformName}
                onChange={(e) => setPlatformName(e.target.value)}
                className="w-full bg-card border border-border rounded-md px-3.5 py-2 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-colors"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-mono text-muted-foreground mb-1.5">Entity / License Identifier</label>
              <input
                type="text"
                value={entityLicenseNumber}
                onChange={(e) => setEntityLicenseNumber(e.target.value)}
                className="w-full bg-card border border-border rounded-md px-3.5 py-2 text-xs font-mono text-foreground focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-colors"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-mono text-muted-foreground mb-1.5">Compliance Email</label>
              <input
                type="email"
                value={supportEmail}
                onChange={(e) => setSupportEmail(e.target.value)}
                className="w-full bg-card border border-border rounded-md px-3.5 py-2 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-colors"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-mono text-muted-foreground mb-1.5">Max Stock Allocation Limit (%)</label>
              <input
                type="number"
                value={maxStockWeight}
                onChange={(e) => setMaxStockWeight(Number(e.target.value))}
                className="w-full bg-card border border-border rounded-md px-3.5 py-2 text-xs font-mono text-foreground focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-colors"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-mono text-muted-foreground mb-1.5">Statutory Risk Disclaimer</label>
            <textarea
              rows={3}
              value={disclaimer}
              onChange={(e) => setDisclaimer(e.target.value)}
              className="w-full bg-card border border-border rounded-md p-3 text-xs text-foreground leading-relaxed focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-colors font-mono"
              required
            />
          </div>

          <div className="pt-4 border-t border-border flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="bg-primary hover:opacity-90 text-primary-foreground font-semibold text-xs py-2 px-4 rounded-md shadow-xs transition-all flex items-center gap-1.5 disabled:opacity-60 cursor-pointer font-mono"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{saving ? 'Saving...' : 'Save Configuration'}</span>
            </button>
          </div>
        </motion.div>
      </form>

      {/* Maintenance & Purge Controls */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        className="glass-panel border-destructive/30 p-6 shadow-sm space-y-5"
      >
        <div className="pb-3 border-b border-border">
          <h3 className="text-sm font-semibold text-destructive flex items-center gap-2">
            <AlertTriangle className="w-4 h-4" />
            <span>Administrative Maintenance & Data Purge Desk</span>
          </h3>
          <p className="text-xs font-mono text-muted-foreground mt-0.5">
            Purge sandbox user registrations, test portfolios, filled plans, and reset audit trails.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 font-mono">
          {/* User Purge Box */}
          <div className="p-4 rounded-md glass-panel-data space-y-3">
            <div>
              <h4 className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                <UserX className="w-3.5 h-3.5 text-destructive" />
                <span>Purge Specific User Data</span>
              </h4>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                Deletes all portfolio setups, holdings, subscriptions, and compliance records for this email.
              </p>
            </div>

            <div className="space-y-1.5">
              <label className="block text-[10px] uppercase tracking-wider text-muted-foreground">Target User Email</label>
              <input
                type="email"
                value={targetEmail}
                onChange={(e) => setTargetEmail(e.target.value)}
                placeholder="e.g. user@example.com"
                className="w-full bg-card border border-border rounded-md px-3 py-1.5 text-xs font-mono text-foreground focus:outline-none focus:ring-1 focus:ring-destructive focus:border-destructive transition-colors"
              />
            </div>

            <button
              onClick={handlePurgeUser}
              disabled={isPurgingUser || !targetEmail}
              className="w-full bg-destructive/10 hover:bg-destructive/20 text-destructive font-semibold text-xs py-2 px-3 rounded-md border border-destructive/25 transition-all flex items-center justify-center gap-1.5 disabled:opacity-50 cursor-pointer"
            >
              <Trash2 className={`w-3.5 h-3.5 ${isPurgingUser ? 'animate-spin' : ''}`} />
              <span>{isPurgingUser ? 'Purging User Records...' : `Purge Data for ${targetEmail}`}</span>
            </button>

            {purgeUserResult && (
              <div className="p-3 rounded-md bg-[hsl(var(--success))/0.15] border border-[hsl(var(--success))/0.3] text-[11px] font-mono text-[hsl(var(--success))] space-y-1">
                <div className="font-bold flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Purge Summary for {purgeUserResult.email}:</span>
                </div>
                <div>Portfolios deleted: {purgeUserResult.deletedPortfolios}</div>
                <div>Holdings deleted: {purgeUserResult.deletedHoldings}</div>
                <div>Versions deleted: {purgeUserResult.deletedVersions}</div>
                <div>Orders deleted: {purgeUserResult.deletedOrders}</div>
                <div>Subscriptions deleted: {purgeUserResult.deletedSubscriptions}</div>
              </div>
            )}
          </div>

          {/* Audit Logs Purge Box */}
          <div className="p-4 rounded-md glass-panel-data space-y-3">
            <div>
              <h4 className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                <Trash2 className="w-3.5 h-3.5 text-primary" />
                <span>Wipe Administrative Audit Records</span>
              </h4>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                Clears historical administrative action logs.
              </p>
            </div>

            <div className="pt-6">
              <button
                onClick={handlePurgeAuditLogs}
                disabled={isPurgingLogs}
                className="w-full bg-primary/10 hover:bg-primary/20 text-primary font-semibold text-xs py-2 px-3 rounded-md border border-primary/25 transition-all flex items-center justify-center gap-1.5 disabled:opacity-50 cursor-pointer"
              >
                <Trash2 className={`w-3.5 h-3.5 ${isPurgingLogs ? 'animate-spin' : ''}`} />
                <span>{isPurgingLogs ? 'Wiping Records...' : 'Purge All Audit Records'}</span>
              </button>
            </div>

            {purgedLogsCount !== null && (
              <div className="p-3 rounded-md bg-[hsl(var(--success))/0.15] border border-[hsl(var(--success))/0.3] text-[11px] font-mono text-[hsl(var(--success))] space-y-1">
                <div className="font-bold flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Records Purged: {purgedLogsCount} entries removed</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </motion.div>

      {/* Diagnostics Panel */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="glass-panel p-6 shadow-sm space-y-4"
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-border">
          <div>
            <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
              <Database className="w-4 h-4 text-primary" />
              <span>System Integrity & Health Audit</span>
            </h3>
            <p className="text-xs font-mono text-muted-foreground mt-0.5">
              Verify monetary invariants, data consistency, and system health status.
            </p>
          </div>

          <button
            onClick={handleRunDiagnostics}
            disabled={isRunningDiagnostics}
            className="glass-panel hover:bg-muted text-foreground text-xs font-mono font-medium px-3 py-1.5 rounded-md transition-colors flex items-center gap-1.5 self-start sm:self-auto disabled:opacity-60 cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRunningDiagnostics ? 'animate-spin' : ''}`} />
            <span>{isRunningDiagnostics ? 'Running Diagnostic Audit...' : 'Run Diagnostics'}</span>
          </button>
        </div>

        {diagnosticReport && (
          <div className="p-4 rounded-md glass-panel-data text-xs space-y-2 font-mono">
            <div className="flex items-center gap-1.5 text-[hsl(var(--success))] font-semibold">
              <CheckCircle2 className="w-4 h-4" />
              <span>Diagnostic Check Passed</span>
            </div>
            <pre className="p-3 bg-card rounded border border-border font-mono text-[11px] overflow-x-auto text-foreground">
              {JSON.stringify(diagnosticReport, null, 2)}
            </pre>
          </div>
        )}
      </motion.div>
    </div>
  );
}
