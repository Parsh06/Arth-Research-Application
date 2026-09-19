import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { User, Mail, Phone, MapPin, Save, Shield, Key, CheckCircle2, Moon, Sun } from 'lucide-react';
import { useAuthStore } from '../stores/authStore';
import { userRepository } from '../repositories/userRepository';
import { useToastStore } from '../stores/toastStore';
import { useThemeStore } from '../stores/themeStore';
import type { UserPrivate, UserCompliance } from '../schemas/user.schema';

export default function ProfilePage() {
  const { dbUser, user } = useAuthStore();
  const { addToast } = useToastStore();
  const { theme, setTheme } = useThemeStore();
  
  const photoUrl = user?.photoURL || null;
  const initialName = dbUser?.displayName || user?.displayName || 'Investor';
  const email = user?.email || 'investor@arth.app';

  // Form State
  const [displayName, setDisplayName] = useState(initialName);
  const [phone, setPhone] = useState('');
  const [pan, setPan] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [addressLine, setAddressLine] = useState('');
  const [riskProfile, setRiskProfile] = useState<'Low' | 'Medium' | 'High'>('Medium');
  const [experience, setExperience] = useState('1_3_years');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!user?.uid) return;
    const loadProfileData = async () => {
      try {
        const [privateData, complianceData] = await Promise.all([
          userRepository.getUserPrivate(user.uid),
          userRepository.getUserCompliance(user.uid)
        ]);

        if (privateData) {
          if (privateData.phone) setPhone(privateData.phone);
          if (privateData.city) setCity(privateData.city);
          if (privateData.state) setState(privateData.state);
          if (privateData.address?.line1) setAddressLine(privateData.address.line1);
        }

        if (complianceData) {
          if (complianceData.panToken || complianceData.panLast4) {
            setPan(complianceData.panToken || `XXXXX${complianceData.panLast4}`);
          }
          if (complianceData.riskProfile) setRiskProfile(complianceData.riskProfile);
          if (complianceData.investmentExperience) setExperience(complianceData.investmentExperience);
        }
      } catch (err) {
        console.error("Failed to load profile data:", err);
      }
    };

    loadProfileData();
  }, [user?.uid]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.uid) return;

    setIsSaving(true);
    try {
      // 1. Update basic public profile and theme
      await userRepository.updateUser(user.uid, {
        displayName: displayName.trim(),
        theme: theme as any
      });

      // 2. Update private contact information
      const privatePayload: Partial<UserPrivate> = {
        phone: phone.trim(),
        city: city.trim(),
        state: state.trim(),
        country: 'India',
        address: {
          line1: addressLine.trim()
        }
      };
      await userRepository.updateUserPrivate(user.uid, privatePayload);

      // 3. Update compliance records (pure text & numeric data)
      const panClean = pan.trim().toUpperCase();
      const compliancePayload: Partial<UserCompliance> = {
        panToken: panClean,
        panLast4: panClean.length >= 4 ? panClean.slice(-4) : undefined,
        riskProfile,
        investmentExperience: experience,
        kycStatus: panClean.length === 10 ? 'verified' : 'pending'
      };
      await userRepository.updateUserCompliance(user.uid, compliancePayload);

      addToast('Profile and compliance records synchronized with database!', 'success');
    } catch (err: any) {
      console.error("Failed to save profile:", err);
      addToast(err.message || 'Failed to save profile data.', 'error');
    } finally {
      setIsSaving(false);
    }
  };
  
  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="pb-4 border-b border-border">
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-mono uppercase tracking-wider text-primary bg-primary/10 px-2 py-0.5 rounded border border-primary/20">
            Client Identity
          </span>
        </div>
        <h1 className="text-xl sm:text-2xl font-semibold tracking-tight text-foreground mt-1 flex items-center gap-2">
          <Key className="w-5 h-5 text-primary" />
          Investor Profile & Compliance Record
        </h1>
        <p className="text-xs text-muted-foreground font-mono mt-0.5">
          Manage your verified identity, risk suitability profile, and platform preferences.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: ID Card & Status */}
        <div className="lg:col-span-1 space-y-4">
          <motion.div 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-panel p-6 relative overflow-hidden"
          >
            <div className="flex flex-col items-center">
              <div className="w-20 h-20 rounded-full glass-panel-data flex items-center justify-center mb-3 overflow-hidden border border-border">
                {photoUrl ? (
                  <img src={photoUrl} alt="Investor Avatar" className="w-full h-full object-cover" />
                ) : (
                  <User className="w-10 h-10 text-muted-foreground" />
                )}
              </div>
              <h3 className="text-base font-semibold text-foreground text-center">{displayName || initialName}</h3>
              <p className="text-[10px] font-mono uppercase tracking-widest text-primary mt-0.5">{dbUser?.role || 'INVESTOR'} CLEARANCE</p>
              <span className="font-mono text-[10px] text-muted-foreground mt-1">UID: {user?.uid.substring(0, 12)}...</span>
            </div>
            
            <div className="mt-5 pt-4 border-t border-border space-y-2.5">
              <div className="glass-panel-data p-2.5 flex justify-between items-center text-xs font-mono">
                <span className="text-muted-foreground">Account Status</span>
                <span className="text-[hsl(var(--success))] font-semibold flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> ACTIVE
                </span>
              </div>
              <div className="glass-panel-data p-2.5 flex justify-between items-center text-xs font-mono">
                <span className="text-muted-foreground">Risk Profile</span>
                <span className="text-foreground font-semibold">{riskProfile} RISK</span>
              </div>
            </div>
          </motion.div>

          {/* Theme Preference Card */}
          <motion.div 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="glass-panel p-5 space-y-3"
          >
            <span className="text-[11px] font-mono uppercase tracking-wider text-muted-foreground block">Appearance & Theme</span>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setTheme('dark', true)}
                className={`p-2.5 rounded text-xs font-mono flex items-center justify-center gap-2 border transition-all cursor-pointer ${
                  theme === 'dark' 
                    ? 'border-primary bg-primary/15 text-primary font-semibold' 
                    : 'border-border text-muted-foreground hover:bg-muted/40'
                }`}
              >
                <Moon className="w-3.5 h-3.5" />
                <span>Dark Mode</span>
              </button>

              <button
                type="button"
                onClick={() => setTheme('light', true)}
                className={`p-2.5 rounded text-xs font-mono flex items-center justify-center gap-2 border transition-all cursor-pointer ${
                  theme === 'light' 
                    ? 'border-primary bg-primary/15 text-primary font-semibold' 
                    : 'border-border text-muted-foreground hover:bg-muted/40'
                }`}
              >
                <Sun className="w-3.5 h-3.5" />
                <span>Light Mode</span>
              </button>
            </div>
            <p className="text-[10px] font-mono text-muted-foreground">
              Theme preference is stored directly in your cloud account profile.
            </p>
          </motion.div>
        </div>

        {/* Right Column: Profile & Compliance Form */}
        <div className="lg:col-span-2">
          <motion.div 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="glass-panel p-6 shadow-sm"
          >
            <div className="pb-4 border-b border-border mb-5">
              <h2 className="text-sm font-semibold text-foreground">Compliance & Identity Attributes</h2>
              <p className="text-xs text-muted-foreground font-mono mt-0.5">Non-custodial cryptographic database records.</p>
            </div>
            
            <form onSubmit={handleSave} className="space-y-4 text-xs font-mono">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-muted-foreground mb-1 flex items-center gap-1.5 uppercase text-[10px]">
                    <User className="w-3 h-3 text-primary" /> Legal Full Name
                  </label>
                  <input 
                    type="text" 
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    className="w-full glass-panel-data px-3 py-1.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary" 
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-muted-foreground mb-1 flex items-center gap-1.5 uppercase text-[10px]">
                    <Mail className="w-3 h-3 text-primary" /> Authentication Email
                  </label>
                  <input 
                    type="email" 
                    value={email} 
                    disabled 
                    className="w-full glass-panel-data px-3 py-1.5 text-xs text-muted-foreground bg-muted/40 cursor-not-allowed" 
                  />
                </div>
                
                <div>
                  <label className="block text-muted-foreground mb-1 flex items-center gap-1.5 uppercase text-[10px]">
                    <Phone className="w-3 h-3 text-primary" /> Mobile Number
                  </label>
                  <input 
                    type="tel" 
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+91 9876543210" 
                    className="w-full glass-panel-data px-3 py-1.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary" 
                  />
                </div>
                
                <div>
                  <label className="block text-muted-foreground mb-1 flex items-center gap-1.5 uppercase text-[10px]">
                    <Shield className="w-3 h-3 text-primary" /> PAN Card Number (Text)
                  </label>
                  <input 
                    type="text" 
                    value={pan}
                    onChange={(e) => setPan(e.target.value.toUpperCase())}
                    maxLength={10}
                    placeholder="ABCDE1234F" 
                    className="w-full glass-panel-data px-3 py-1.5 text-xs text-foreground uppercase focus:outline-none focus:ring-1 focus:ring-primary" 
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-muted-foreground mb-1 uppercase text-[10px]">Risk Suitability Assessment</label>
                  <select
                    value={riskProfile}
                    onChange={(e) => setRiskProfile(e.target.value as any)}
                    className="w-full glass-panel-data px-3 py-1.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                  >
                    <option value="Low">Low (Capital Preservation)</option>
                    <option value="Medium">Medium (Balanced Growth)</option>
                    <option value="High">High (Aggressive Alpha)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-muted-foreground mb-1 uppercase text-[10px]">Investment Experience</label>
                  <select
                    value={experience}
                    onChange={(e) => setExperience(e.target.value)}
                    className="w-full glass-panel-data px-3 py-1.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                  >
                    <option value="0_1_years">&lt; 1 Year (Beginner)</option>
                    <option value="1_3_years">1 - 3 Years (Intermediate)</option>
                    <option value="3_5_years">3 - 5 Years (Experienced)</option>
                    <option value="5_plus_years">5+ Years (Veteran / HNI)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-muted-foreground mb-1 flex items-center gap-1.5 uppercase text-[10px]">
                  <MapPin className="w-3 h-3 text-primary" /> Registered Residential Address
                </label>
                <textarea 
                  rows={2} 
                  value={addressLine}
                  onChange={(e) => setAddressLine(e.target.value)}
                  placeholder="Enter flat / building, street, and postal code..." 
                  className="w-full glass-panel-data p-2.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary resize-none" 
                />
              </div>

              <div className="pt-4 border-t border-border flex justify-end">
                <button 
                  type="submit" 
                  disabled={isSaving}
                  className="bg-primary hover:opacity-90 text-primary-foreground py-2.5 px-5 rounded-md font-semibold text-xs transition-all flex items-center gap-2 shadow-xs cursor-pointer disabled:opacity-50"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>{isSaving ? 'Saving...' : 'Save Profile & Preferences'}</span>
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
