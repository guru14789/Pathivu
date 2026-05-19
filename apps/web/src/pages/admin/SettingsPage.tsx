import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import {
  User,
  Bell,
  Shield,
  Globe,
  ChevronDown,
  ChevronUp,
  Save,
  Loader2,
  Eye,
  EyeOff,
  Smartphone,
  Mail,
  Clock,
  Palette,
  Key
} from 'lucide-react';
import { cn } from '../../lib/utils';
import toast from 'react-hot-toast';

interface SectionProps {
  icon: React.ElementType;
  title: string;
  description: string;
  isOpen: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}

const SettingsSection = ({ icon: Icon, title, description, isOpen, onToggle, children }: SectionProps) => (
  <div className="bg-white border border-gray-200 rounded-3xl overflow-hidden shadow-sm transition-all hover:shadow-md">
    <button
      onClick={onToggle}
      className="w-full flex items-center justify-between p-6 text-left hover:bg-gray-50/50 transition-colors"
    >
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 bg-purple-100 rounded-2xl flex items-center justify-center">
          <Icon size={24} className="text-[#6A1B9A]" />
        </div>
        <div className="space-y-0.5">
          <h3 className="text-lg font-bold text-gray-900">{title}</h3>
          <p className="text-sm text-gray-500">{description}</p>
        </div>
      </div>
      {isOpen ? (
        <ChevronUp size={20} className="text-gray-400 shrink-0" />
      ) : (
        <ChevronDown size={20} className="text-gray-400 shrink-0" />
      )}
    </button>
    <AnimatePresence initial={false}>
      {isOpen && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="overflow-hidden"
        >
          <div className="px-6 pb-6 border-t border-gray-100 pt-6 space-y-6">
            {children}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  </div>
);

export default function SettingsPage() {
  const { user } = useAuth();
  const [openSection, setOpenSection] = useState<string | null>('profile');

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPasswords, setShowPasswords] = useState(false);
  const [isSavingPassword, setIsSavingPassword] = useState(false);

  const [notifications, setNotifications] = useState({
    fault_alerts: true,
    maintenance_reminders: true,
    compliance_expiry: true,
    report_ready: false,
    weekly_digest: true,
  });

  const [timezone, setTimezone] = useState('Asia/Kolkata');
  const [dateFormat, setDateFormat] = useState('DD/MM/YYYY');

  const toggleSection = (section: string) => {
    setOpenSection(openSection === section ? null : section);
  };

  const handleSavePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      toast.error('New passwords do not match');
      return;
    }
    if (newPassword.length < 8) {
      toast.error('Password must be at least 8 characters');
      return;
    }
    setIsSavingPassword(true);
    try {
      await new Promise(r => setTimeout(r, 1000));
      toast.success('Password updated successfully');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch {
      toast.error('Failed to update password');
    } finally {
      setIsSavingPassword(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-8 pb-32">
      <div>
        <h1 className="text-4xl font-black text-gray-900 tracking-tighter">Settings</h1>
        <p className="text-gray-500 font-medium text-sm mt-1">
          Manage your account, notifications, and security preferences.
        </p>
      </div>

      <div className="space-y-4">
        {/* Profile */}
        <SettingsSection
          icon={User}
          title="Profile"
          description="Your account information and personal details"
          isOpen={openSection === 'profile'}
          onToggle={() => toggleSection('profile')}
        >
          <div className="flex items-center gap-6">
            <div className="w-20 h-20 rounded-[28px] bg-[#6A1B9A] text-white flex items-center justify-center text-3xl font-black shadow-lg shadow-purple-900/20 shrink-0">
              {user?.full_name?.[0] || 'U'}
            </div>
            <div className="space-y-2">
              <div>
                <p className="text-sm text-gray-500 font-medium">Full Name</p>
                <p className="text-lg font-bold text-gray-900">{user?.full_name || '—'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500 font-medium">Email</p>
                <p className="text-lg font-bold text-gray-900">{user?.email || '—'}</p>
              </div>
              <div className="flex items-center gap-2">
                <span className="px-3 py-0.5 bg-purple-100 text-[#6A1B9A] rounded-full text-[10px] font-black uppercase border border-purple-200">
                  {user?.role?.replace('_', ' ') || 'N/A'}
                </span>
              </div>
            </div>
          </div>
        </SettingsSection>

        {/* Notifications */}
        <SettingsSection
          icon={Bell}
          title="Notifications"
          description="Configure which alerts and updates you receive"
          isOpen={openSection === 'notifications'}
          onToggle={() => toggleSection('notifications')}
        >
          <div className="space-y-4">
            {[
              { key: 'fault_alerts', label: 'Fault Alerts', description: 'Real-time P1 and critical fault notifications', icon: Bell },
              { key: 'maintenance_reminders', label: 'Maintenance Reminders', description: 'Upcoming PPM and calibration due dates', icon: Clock },
              { key: 'compliance_expiry', label: 'Compliance Expiry', description: '30-day and 60-day certificate renewal alerts', icon: Shield },
              { key: 'report_ready', label: 'Report Ready', description: 'When generated reports are available for download', icon: Mail },
              { key: 'weekly_digest', label: 'Weekly Digest', description: 'Summary of all asset activity for the week', icon: Smartphone },
            ].map(item => (
              <div key={item.key} className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl border border-gray-100">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-gray-400 border border-gray-200">
                    <item.icon size={18} />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-gray-900">{item.label}</p>
                    <p className="text-xs text-gray-500">{item.description}</p>
                  </div>
                </div>
                <button
                  onClick={() => setNotifications(prev => ({ ...prev, [item.key]: !prev[item.key as keyof typeof notifications] }))}
                  className={cn(
                    "w-12 h-6 rounded-full transition-all relative p-0.5",
                    notifications[item.key as keyof typeof notifications] ? "bg-[#6A1B9A]" : "bg-gray-300"
                  )}
                >
                  <div className={cn(
                    "w-5 h-5 rounded-full bg-white shadow-sm transition-all",
                    notifications[item.key as keyof typeof notifications] ? "translate-x-6" : "translate-x-0.5"
                  )} />
                </button>
              </div>
            ))}
          </div>
          <div className="flex justify-end pt-2">
            <button
              onClick={() => { toast.success('Notification preferences saved'); }}
              className="px-6 py-3 bg-[#6A1B9A] hover:bg-[#7B1FA2] text-white rounded-2xl font-bold text-sm shadow-lg shadow-purple-900/20 flex items-center gap-2 transition-all"
            >
              <Save size={16} /> Save Preferences
            </button>
          </div>
        </SettingsSection>

        {/* Security */}
        <SettingsSection
          icon={Shield}
          title="Security"
          description="Update your password and manage account security"
          isOpen={openSection === 'security'}
          onToggle={() => toggleSection('security')}
        >
          <form onSubmit={handleSavePassword} className="space-y-5 max-w-xl">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-700 ml-1">Current Password</label>
              <div className="relative">
                <input
                  type={showPasswords ? 'text' : 'password'}
                  value={currentPassword}
                  onChange={e => setCurrentPassword(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 text-gray-900 px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#6A1B9A]/20 focus:border-[#6A1B9A] transition-all pr-10"
                  placeholder="Enter current password"
                  required
                />
              </div>
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-700 ml-1">New Password</label>
                <input
                  type={showPasswords ? 'text' : 'password'}
                  value={newPassword}
                  onChange={e => setNewPassword(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 text-gray-900 px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#6A1B9A]/20 focus:border-[#6A1B9A] transition-all"
                  placeholder="Min. 8 characters"
                  required
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-700 ml-1">Confirm Password</label>
                <input
                  type={showPasswords ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 text-gray-900 px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#6A1B9A]/20 focus:border-[#6A1B9A] transition-all"
                  placeholder="Re-enter new password"
                  required
                />
              </div>
            </div>
            <div className="flex items-center gap-4">
              <button
                type="button"
                onClick={() => setShowPasswords(!showPasswords)}
                className="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1.5 transition-all"
              >
                {showPasswords ? <EyeOff size={16} /> : <Eye size={16} />}
                {showPasswords ? 'Hide' : 'Show'} passwords
              </button>
            </div>
            <div className="flex justify-end pt-2">
              <button
                type="submit"
                disabled={isSavingPassword}
                className="px-6 py-3 bg-[#6A1B9A] hover:bg-[#7B1FA2] text-white rounded-2xl font-bold text-sm shadow-lg shadow-purple-900/20 flex items-center gap-2 transition-all disabled:opacity-50"
              >
                {isSavingPassword ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <Key size={16} />
                )}
                {isSavingPassword ? 'Updating...' : 'Update Password'}
              </button>
            </div>
          </form>
        </SettingsSection>

        {/* Preferences */}
        <SettingsSection
          icon={Globe}
          title="Preferences"
          description="Regional and display preferences"
          isOpen={openSection === 'preferences'}
          onToggle={() => toggleSection('preferences')}
        >
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-700 ml-1">Timezone</label>
              <select
                value={timezone}
                onChange={e => setTimezone(e.target.value)}
                className="w-full bg-gray-50 border border-gray-200 text-gray-900 px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#6A1B9A]/20 focus:border-[#6A1B9A] transition-all"
              >
                <option value="Asia/Kolkata">Asia/Kolkata (IST, UTC +5:30)</option>
                <option value="Asia/Dubai">Asia/Dubai (GST, UTC +4:00)</option>
                <option value="UTC">UTC (Coordinated Universal Time)</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-700 ml-1">Date Format</label>
              <select
                value={dateFormat}
                onChange={e => setDateFormat(e.target.value)}
                className="w-full bg-gray-50 border border-gray-200 text-gray-900 px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#6A1B9A]/20 focus:border-[#6A1B9A] transition-all"
              >
                <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                <option value="YYYY-MM-DD">YYYY-MM-DD (ISO)</option>
              </select>
            </div>
          </div>
          <div className="flex items-center justify-between p-4 bg-purple-50 rounded-2xl border border-purple-100">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-[#6A1B9A] border border-purple-200">
                <Palette size={18} />
              </div>
              <div>
                <p className="text-sm font-bold text-gray-900">Theme</p>
                <p className="text-xs text-gray-500">Light mode is enabled by default</p>
              </div>
            </div>
            <span className="px-3 py-1 bg-purple-100 text-[#6A1B9A] rounded-full text-[10px] font-black uppercase border border-purple-200">
              Light
            </span>
          </div>
          <div className="flex justify-end pt-2">
            <button
              onClick={() => { toast.success('Preferences saved'); }}
              className="px-6 py-3 bg-[#6A1B9A] hover:bg-[#7B1FA2] text-white rounded-2xl font-bold text-sm shadow-lg shadow-purple-900/20 flex items-center gap-2 transition-all"
            >
              <Save size={16} /> Save Preferences
            </button>
          </div>
        </SettingsSection>
      </div>
    </div>
  );
}
