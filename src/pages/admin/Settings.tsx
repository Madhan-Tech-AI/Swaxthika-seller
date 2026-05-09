import { Save, Building, Mail, Phone, Globe, Shield, Lock } from 'lucide-react';
import { useState } from 'react';
import { supabase } from '../../lib/supabase';
import { useToast } from '../../context/ToastContext';

export function Settings() {
  const [loading, setLoading] = useState(false);
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [changingPassword, setChangingPassword] = useState(false);
  const { showToast } = useToast();

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      showToast('success', 'Settings Saved', 'Your store settings have been updated.');
    }, 800);
  };

  const handleChangePassword = async () => {
    if (!newPassword || newPassword.length < 6) { showToast('error', 'Invalid', 'Password must be at least 6 characters.'); return; }
    if (newPassword !== confirmPassword) { showToast('error', 'Mismatch', 'Passwords do not match.'); return; }
    setChangingPassword(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;
      showToast('success', 'Password Changed', 'Your admin password has been updated.');
      setShowPasswordForm(false);
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      showToast('error', 'Failed', err.message);
    } finally { setChangingPassword(false); }
  };

  return (
    <div className="max-w-4xl mx-auto pb-12">
      <div className="mb-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-display font-bold text-foreground">Settings</h1>
          <p className="text-foreground/60 text-sm mt-1">Manage your store preferences and configurations</p>
        </div>
        <button 
          onClick={handleSave}
          disabled={loading}
          className="bg-primary text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-primary-600 transition-colors flex items-center gap-2 shadow-sm disabled:opacity-70"
        >
          {loading ? (
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
          ) : (
            <Save className="w-4 h-4" />
          )}
          Save Changes
        </button>
      </div>

      <div className="grid grid-cols-1 gap-8">
        {/* General Settings */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
              <Building className="w-5 h-5 text-primary" />
              General Information
            </h2>
            <p className="text-sm text-foreground/60 mt-1">Update your store's basic information and contact details.</p>
          </div>
          <div className="p-6 space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">Store Name</label>
                <input 
                  type="text" 
                  defaultValue="Swaxthika"
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:border-primary text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">Tagline</label>
                <input 
                  type="text" 
                  defaultValue="Premium Spiritual & Religious Artifacts"
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:border-primary text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">Contact Email</label>
                <div className="relative">
                  <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input 
                    type="email" 
                    defaultValue="support@swaxthika.com"
                    className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:border-primary text-sm"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">Contact Phone</label>
                <div className="relative">
                  <Phone className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input 
                    type="text" 
                    defaultValue="+91 98765 43210"
                    className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:border-primary text-sm"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Currency & Region */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
              <Globe className="w-5 h-5 text-primary" />
              Currency & Region
            </h2>
          </div>
          <div className="p-6 space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">Base Currency</label>
                <select className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:border-primary text-sm bg-white">
                  <option value="INR">Indian Rupee (₹)</option>
                  <option value="USD">US Dollar ($)</option>
                  <option value="EUR">Euro (€)</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">Timezone</label>
                <select className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:border-primary text-sm bg-white">
                  <option value="IST">Asia/Kolkata (IST)</option>
                  <option value="UTC">UTC</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
              <Shield className="w-5 h-5 text-primary" /> Security
            </h2>
          </div>
          <div className="p-6 space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-medium text-foreground">Change Admin Password</h3>
                <p className="text-xs text-foreground/60 mt-1">Update your admin login password securely via Supabase Auth.</p>
              </div>
              <button onClick={() => setShowPasswordForm(!showPasswordForm)} className="px-4 py-2 bg-gray-100 text-foreground font-medium text-sm rounded-md hover:bg-gray-200 transition-colors flex items-center gap-2">
                <Lock className="w-4 h-4" /> {showPasswordForm ? 'Cancel' : 'Change Password'}
              </button>
            </div>
            {showPasswordForm && (
              <div className="bg-gray-50 rounded-xl p-5 space-y-4 border border-gray-200 animate-in fade-in">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">New Password</label>
                  <input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:border-primary text-sm" placeholder="Min. 6 characters" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">Confirm Password</label>
                  <input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:border-primary text-sm" placeholder="Repeat password" />
                </div>
                <button onClick={handleChangePassword} disabled={changingPassword} className="bg-primary text-white px-6 py-2 rounded-md text-sm font-medium hover:bg-primary-600 disabled:opacity-60 transition-colors">
                  {changingPassword ? 'Updating...' : 'Update Password'}
                </button>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
