import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, AlertTriangle, X, ShieldAlert, Trash2, RotateCcw, FileText } from 'lucide-react';
import { useUserStore } from '../../stores/userStore';
import { useToastStore } from '../../stores/toastStore';
import { userRepository } from '../../repositories/userRepository';
import { useAuthStore } from '../../stores/authStore';
import { formatDateTime } from '../../utils/datetime';

export default function AdminUsers() {
  const { allUsers, fetchAllUsers, isLoadingUsers } = useUserStore();
  const { user: currentAdmin } = useAuthStore();
  const { addToast } = useToastStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [isUpdating, setIsUpdating] = useState(false);

  // Revocation Modal State
  const [revocationTarget, setRevocationTarget] = useState<any | null>(null);
  const [revocationReason, setRevocationReason] = useState('');
  const [isRevoking, setIsRevoking] = useState(false);

  useEffect(() => {
    fetchAllUsers();
  }, [fetchAllUsers]);

  const handleUpdateRole = async (targetUid: string, newRole: any) => {
    if (!currentAdmin) return;
    if (!window.confirm(`Are you sure you want to change this user's role to ${newRole.toUpperCase()}?`)) return;

    setIsUpdating(true);
    try {
      await userRepository.updateUserRole(targetUid, newRole, currentAdmin.uid);
      addToast(`User role updated to ${newRole}`, 'success');
      await fetchAllUsers();
    } catch (err: any) {
      console.error("Failed to update role:", err);
      addToast(err.message || "Failed to update user role", 'error');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleOpenRevokeModal = (u: any) => {
    setRevocationTarget(u);
    setRevocationReason('');
  };

  const handleConfirmRevocation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentAdmin || !revocationTarget) return;

    if (!revocationReason.trim()) {
      addToast("You must provide a compliance / regulatory reason for revoking access.", "error");
      return;
    }

    setIsRevoking(true);
    try {
      const reasonText = revocationReason.trim();
      await userRepository.revokeUserAccess(
        revocationTarget.uid,
        reasonText,
        currentAdmin.uid,
        currentAdmin.email || 'admin@arthadvisory.com'
      );
      
      // Dispatch Mandatory Governance Revocation Notice Email with Supervisor Basis
      if (revocationTarget.email) {
        import('../../services/emailService').then(({ emailService }) => {
          emailService.sendAccountRevokedEmail(revocationTarget.email, {
            userName: revocationTarget.displayName || 'Investor',
            userEmail: revocationTarget.email,
            revocationDate: new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }) + ' IST',
            reason: reasonText,
            supervisorName: currentAdmin.displayName || currentAdmin.email || 'Compliance Officer',
            supervisorRole: 'Principal Compliance Officer',
            appealUrl: window.location.origin + '/support'
          }).catch(e => console.warn('[AdminUsers] Revoke email error:', e));
        });
      }

      addToast(`Access revoked for ${revocationTarget.email}. Notification dispatched.`, 'success');
      setRevocationTarget(null);
      setRevocationReason('');
      await fetchAllUsers();
    } catch (err: any) {
      console.error("Revoke access failed:", err);
      addToast(err.message || "Failed to revoke access", 'error');
    } finally {
      setIsRevoking(false);
    }
  };

  const handleReactivate = async (u: any) => {
    if (!currentAdmin) return;
    if (!window.confirm(`Reactivate advisory and terminal access for ${u.email}?`)) return;

    setIsUpdating(true);
    try {
      await userRepository.reactivateUserAccess(
        u.uid,
        currentAdmin.uid,
        currentAdmin.email || 'admin@arthadvisory.com'
      );

      // Dispatch Account Reactivated Email
      if (u.email) {
        import('../../services/emailService').then(({ emailService }) => {
          emailService.sendAccountReactivatedEmail(u.email, {
            userName: u.displayName || 'Investor',
            userEmail: u.email,
            reactivationDate: new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }) + ' IST',
            portalUrl: window.location.origin + '/login'
          }).catch(e => console.warn('[AdminUsers] Reactivate email error:', e));
        });
      }

      addToast(`Account reactivated for ${u.email}`, 'success');
      await fetchAllUsers();
    } catch (err: any) {
      console.error("Reactivate failed:", err);
      addToast(err.message || "Failed to reactivate user", 'error');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDeleteUser = async (u: any) => {
    if (!currentAdmin) return;
    if (!window.confirm(`PERMANENT ACTION: Completely delete user ${u.email} and all their portfolios, orders, and subscriptions from Firestore?`)) {
      return;
    }

    setIsUpdating(true);
    try {
      await userRepository.deleteUserPermanently(
        u.uid,
        u.email,
        currentAdmin.uid,
        currentAdmin.email || 'admin@arthadvisory.com'
      );
      addToast(`Permanently deleted user records for ${u.email}`, 'success');
      await fetchAllUsers();
    } catch (err: any) {
      console.error("Delete user failed:", err);
      addToast(err.message || "Failed to delete user", 'error');
    } finally {
      setIsUpdating(false);
    }
  };

  const filteredUsers = allUsers.filter(u => {
    const matchesSearch = 
      (u.displayName || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (u.email || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.uid.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesRole = roleFilter === 'all' || u.role === roleFilter;
    const matchesStatus = statusFilter === 'all' || u.status === statusFilter;

    return matchesSearch && matchesRole && matchesStatus;
  });

  if (isLoadingUsers) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-3">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        <span className="text-xs font-mono tracking-wider text-muted-foreground">Loading User Ledger...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="pb-4 border-b border-border">
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-mono uppercase tracking-wider text-primary bg-primary/10 px-2 py-0.5 rounded border border-primary/20">
            RBAC Directory
          </span>
        </div>
        <h1 className="text-xl sm:text-2xl font-semibold tracking-tight text-foreground mt-1">
          User & Identity Governance
        </h1>
        <p className="text-xs text-muted-foreground font-mono mt-0.5">
          Manage investor clearance levels, revoke/suspend access with regulatory audit justification, or purge accounts.
        </p>
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-panel-data p-5 space-y-4"
      >
        {/* Filters */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="h-3.5 w-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by name, email, or UID..."
              className="w-full glass-panel pl-9 pr-3 py-1.5 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary font-mono"
            />
          </div>

          <div className="flex items-center gap-2.5">
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="glass-panel px-2.5 py-1.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary capitalize font-mono"
            >
              <option value="all">All Roles</option>
              <option value="user">Investors (User)</option>
              <option value="admin">Administrators</option>
              <option value="super_admin">Super Admin</option>
              <option value="research_admin">Research Admin</option>
            </select>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="glass-panel px-2.5 py-1.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary capitalize font-mono"
            >
              <option value="all">All Statuses</option>
              <option value="active">Active</option>
              <option value="suspended">Suspended</option>
              <option value="revoked">Revoked</option>
            </select>
          </div>
        </div>

        {/* User Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left whitespace-nowrap">
            <thead>
              <tr className="border-b border-border text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
                <th className="pb-2.5 px-3">Investor Profile</th>
                <th className="pb-2.5 px-3">Role Designation</th>
                <th className="pb-2.5 px-3">Access Status</th>
                <th className="pb-2.5 px-3">Registered Date</th>
                <th className="pb-2.5 px-3 text-right">Supervision Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {filteredUsers.map((u) => {
                const isSuspendedOrRevoked = u.status === 'suspended' || u.status === 'revoked';
                return (
                  <tr key={u.uid} className="hover:bg-muted/30 transition-colors">
                    <td className="py-3 px-3">
                      <div className="font-semibold text-foreground">{u.displayName || 'Investor'}</div>
                      <div className="text-[10px] font-mono text-muted-foreground">{u.email}</div>
                      <span className="font-mono text-[9px] text-muted-foreground opacity-75">{u.uid.slice(0, 12)}...</span>
                      
                      {isSuspendedOrRevoked && u.revocationReason && (
                        <div className="mt-1 flex items-start gap-1 text-[10px] font-mono text-destructive max-w-xs truncate" title={u.revocationReason}>
                          <FileText className="w-3 h-3 shrink-0 mt-0.5" />
                          <span className="truncate">Basis: {u.revocationReason}</span>
                        </div>
                      )}
                    </td>
                    <td className="py-3 px-3">
                      <select
                        value={u.role || 'user'}
                        onChange={(e) => handleUpdateRole(u.uid, e.target.value)}
                        disabled={isUpdating}
                        className="glass-panel px-2 py-0.5 text-xs font-mono text-foreground capitalize focus:outline-none focus:ring-1 focus:ring-primary"
                      >
                        <option value="user">User</option>
                        <option value="admin">Admin</option>
                        <option value="super_admin">Super Admin</option>
                        <option value="research_admin">Research Admin</option>
                        <option value="support">Support</option>
                      </select>
                    </td>
                    <td className="py-3 px-3">
                      <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-mono uppercase tracking-wider ${
                        u.status === 'active' ? 'bg-[hsl(var(--success))/0.15] text-[hsl(var(--success))] border border-[hsl(var(--success))/0.3]' :
                        'bg-destructive/15 text-destructive border border-destructive/30'
                      }`}>
                        {u.status === 'active' ? (
                          <span className="w-1.5 h-1.5 rounded-full bg-[hsl(var(--success))] animate-pulse" />
                        ) : (
                          <ShieldAlert className="w-3 h-3" />
                        )}
                        {u.status || 'active'}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-xs font-mono text-muted-foreground">
                      {formatDateTime(u.createdAt)}
                    </td>
                    <td className="py-3 px-3 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <a
                          href={`/admin/users/${u.uid}/portfolio`}
                          className="px-2 py-1 rounded glass-panel text-xs font-mono text-primary hover:bg-primary/10 transition-colors"
                        >
                          Portfolio
                        </a>

                        {isSuspendedOrRevoked ? (
                          <button
                            onClick={() => handleReactivate(u)}
                            disabled={isUpdating}
                            className="px-2 py-1 rounded text-xs font-mono bg-[hsl(var(--success))/0.15] text-[hsl(var(--success))] hover:bg-[hsl(var(--success))/0.25] transition-colors cursor-pointer flex items-center gap-1"
                            title="Reactivate full terminal access"
                          >
                            <RotateCcw className="w-3 h-3" />
                            <span>Reactivate</span>
                          </button>
                        ) : (
                          <button
                            onClick={() => handleOpenRevokeModal(u)}
                            disabled={isUpdating}
                            className="px-2 py-1 rounded text-xs font-mono bg-destructive/15 text-destructive hover:bg-destructive/25 transition-colors cursor-pointer flex items-center gap-1"
                            title="Revoke access with regulatory justification"
                          >
                            <ShieldAlert className="w-3 h-3" />
                            <span>Revoke</span>
                          </button>
                        )}

                        <button
                          onClick={() => handleDeleteUser(u)}
                          disabled={isUpdating}
                          className="p-1 rounded text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors cursor-pointer"
                          title="Permanently purge user and portfolios"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {filteredUsers.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-10 text-center text-xs font-mono text-muted-foreground">
                    No users matching search filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </motion.div>

      {/* Revocation Justification Modal */}
      <AnimatePresence>
        {revocationTarget && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-lg bg-card border border-destructive/30 rounded-lg p-6 shadow-2xl relative my-8"
            >
              <div className="flex items-center justify-between pb-3 border-b border-border">
                <div className="flex items-center gap-2 text-destructive font-semibold text-sm">
                  <AlertTriangle className="w-4 h-4" />
                  <span>Revoke / Suspend Investor Terminal Access</span>
                </div>
                <button
                  onClick={() => setRevocationTarget(null)}
                  className="p-1 rounded text-muted-foreground hover:text-foreground cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleConfirmRevocation} className="mt-4 space-y-4 text-xs font-mono">
                <div className="p-3 rounded-md glass-panel-data space-y-1 text-xs">
                  <div className="text-muted-foreground">Target Account:</div>
                  <div className="font-semibold text-foreground">{revocationTarget.displayName} ({revocationTarget.email})</div>
                  <div className="text-[10px] text-muted-foreground opacity-75">UID: {revocationTarget.uid}</div>
                </div>

                <div>
                  <label className="block text-xs font-mono text-foreground font-semibold mb-1">
                    Regulatory / Compliance Basis for Revocation <span className="text-destructive">*</span>
                  </label>
                  <p className="text-[11px] text-muted-foreground mb-2 leading-relaxed">
                    Enter the exact reason for suspending this user's terminal privileges (e.g., PAN verification discrepancy, risk limit breach, chargeback dispute). This explanation will be displayed to the client on login.
                  </p>
                  <textarea
                    rows={4}
                    value={revocationReason}
                    onChange={(e) => setRevocationReason(e.target.value)}
                    placeholder="e.g. Account suspended due to unresolved verification discrepancy under advisory risk guidelines. Please submit clear identity document to advisory desk."
                    className="w-full bg-card border border-border rounded-md p-3 text-xs text-foreground leading-relaxed focus:outline-none focus:ring-1 focus:ring-destructive focus:border-destructive transition-colors"
                    required
                  />
                </div>

                <div className="pt-3 border-t border-border flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setRevocationTarget(null)}
                    className="glass-panel hover:bg-muted text-foreground px-4 py-2 rounded-md text-xs cursor-pointer font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isRevoking || !revocationReason.trim()}
                    className="bg-destructive hover:opacity-90 text-destructive-foreground font-semibold px-4 py-2 rounded-md text-xs shadow-xs transition-all flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
                  >
                    <ShieldAlert className="w-3.5 h-3.5" />
                    <span>{isRevoking ? 'Revoking Access...' : 'Confirm Access Revocation'}</span>
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
