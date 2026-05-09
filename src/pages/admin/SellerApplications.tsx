import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useToast } from '../../context/ToastContext';
import { Check, X, Loader2, Store, User, Mail, Phone, MapPin, Briefcase, Key, Copy, CheckCircle2, ExternalLink } from 'lucide-react';

export const SellerApplications = () => {
  const [applications, setApplications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [setupModalApp, setSetupModalApp] = useState<any | null>(null);
  const [setupData, setSetupData] = useState({ email: '', mobile: '', password: '' });
  const [setupLoading, setSetupLoading] = useState(false);

  // Credentials display state
  const [credentialsModal, setCredentialsModal] = useState<{
    email: string;
    password: string;
    sellerName: string;
    businessName: string;
    emailSent: boolean;
    emailError: string | null;
  } | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const { showToast } = useToast();

  useEffect(() => {
    fetchApplications();
  }, []);

  const fetchApplications = async () => {
    setLoading(true);
    const { data, error } = await supabase.from('seller_applications').select('*').order('created_at', { ascending: false });
    if (!error && data) setApplications(data);
    setLoading(false);
  };

  const updateStatus = async (id: string, status: string) => {
    const { error } = await supabase.from('seller_applications').update({ status }).eq('id', id);
    if (!error) {
      showToast('success', 'Status Updated', `Application marked as ${status}.`);
      fetchApplications();
    } else {
      showToast('error', 'Error', 'Failed to update application status.');
    }
  };

  const copyToClipboard = async (text: string, field: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(field);
      showToast('success', 'Copied', `${field} copied to clipboard.`);
      setTimeout(() => setCopiedField(null), 2000);
    } catch {
      showToast('error', 'Failed', 'Could not copy to clipboard.');
    }
  };

  const generatePassword = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789@#$!';
    let result = '';
    for (let i = 0; i < 10; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setSetupData({ ...setupData, password: result });
  };

  const handleSetupSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!setupModalApp) return;

    if (!setupData.password || setupData.password.length < 6) {
      showToast('error', 'Weak Password', 'Password must be at least 6 characters.');
      return;
    }

    setSetupLoading(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        showToast('error', 'Session Expired', 'Your admin session has expired. Please log in again.');
        return;
      }

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/approve-seller`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`,
            'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY,
          },
          body: JSON.stringify({
            application_id: setupModalApp.id,
            email: setupData.email,
            password: setupData.password,
            mobile: setupData.mobile,
          }),
        }
      );

      const result = await response.json();

      if (!response.ok || result.error) {
        throw new Error(result.error || 'Failed to approve seller');
      }

      // Close setup modal and show credentials modal
      setSetupModalApp(null);

      setCredentialsModal({
        email: setupData.email,
        password: setupData.password,
        sellerName: result.seller_name || setupModalApp.owner_name,
        businessName: result.business_name || setupModalApp.business_name,
        emailSent: result.email_sent || false,
        emailError: result.email_error || null,
      });

      setSetupData({ email: '', mobile: '', password: '' });
      fetchApplications();

    } catch (err: any) {
      console.error('Approve seller error:', err);
      showToast('error', 'Approval Failed', err.message || 'Could not complete the approval process.');
    } finally {
      setSetupLoading(false);
    }
  };

  const openSetupModal = (app: any) => {
    setSetupModalApp(app);
    setSetupData({ email: app.email, mobile: app.phone, password: '' });
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Seller Applications</h1>

      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-amber-900" /></div>
      ) : applications.length === 0 ? (
        <div className="bg-white p-8 rounded-xl shadow-sm text-center border border-gray-100">
          <p className="text-gray-500">No seller applications found.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {applications.map((app) => (
            <div key={app.id} className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
              <div className="flex justify-between items-start mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-amber-100 rounded-lg flex items-center justify-center text-amber-700">
                    <Store className="w-6 h-6" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">{app.business_name}</h2>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium mt-1 ${
                      app.status === 'approved' ? 'bg-green-100 text-green-800' :
                      app.status === 'rejected' ? 'bg-red-100 text-red-800' :
                      'bg-yellow-100 text-yellow-800'
                    }`}>
                      {app.status.toUpperCase()}
                    </span>
                  </div>
                </div>
                {app.status === 'pending' && (
                  <div className="flex gap-2">
                    <button onClick={() => openSetupModal(app)} className="flex items-center gap-1 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors text-sm font-medium">
                      <Check className="w-4 h-4" /> Approve & Setup
                    </button>
                    <button onClick={() => updateStatus(app.id, 'rejected')} className="flex items-center gap-1 bg-red-100 text-red-700 px-4 py-2 rounded-lg hover:bg-red-200 transition-colors text-sm font-medium">
                      <X className="w-4 h-4" /> Reject
                    </button>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-y-6 gap-x-8">
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-2 flex items-center gap-2"><User className="w-4 h-4"/> Owner Info</h3>
                  <p className="text-gray-900">{app.owner_name}</p>
                  <div className="flex items-center gap-2 mt-1 text-sm text-gray-600"><Mail className="w-3 h-3"/> {app.email}</div>
                  <div className="flex items-center gap-2 mt-1 text-sm text-gray-600"><Phone className="w-3 h-3"/> {app.phone}</div>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-2 flex items-center gap-2"><Briefcase className="w-4 h-4"/> Business Details</h3>
                  <p className="text-gray-900 capitalize">{app.business_type}</p>
                  <p className="text-sm text-gray-600 mt-1">PAN: {app.pan_number}</p>
                  {app.gst_number && <p className="text-sm text-gray-600 mt-1">GST: {app.gst_number}</p>}
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-2 flex items-center gap-2"><MapPin className="w-4 h-4"/> Location</h3>
                  <p className="text-gray-900 text-sm">{app.address}</p>
                  <p className="text-gray-600 text-sm mt-1">{app.city}, {app.state} - {app.pincode}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Setup Modal */}
      {setupModalApp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden relative animate-in fade-in zoom-in duration-200">
            <div className="flex justify-between items-center p-6 border-b border-gray-100 bg-gray-50">
              <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                <Key className="w-5 h-5 text-amber-600" />
                Setup Seller Credentials
              </h3>
              <button onClick={() => setSetupModalApp(null)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6">
              <p className="text-sm text-gray-600 mb-6">
                Create login credentials for <span className="font-semibold text-gray-900">{setupModalApp.business_name}</span>.
                <br />
                <span className="text-amber-700 text-xs mt-1 block">
                  ⚠️ After approval, credentials will be shown on screen for you to share with the seller.
                </span>
              </p>
              
              <form onSubmit={handleSetupSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <input type="email" required value={setupData.email} onChange={(e) => setSetupData({...setupData, email: e.target.value})} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-primary focus:border-primary" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Mobile Number</label>
                  <input type="tel" required value={setupData.mobile} onChange={(e) => setSetupData({...setupData, mobile: e.target.value})} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-primary focus:border-primary" />
                </div>
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-sm font-medium text-gray-700">Temporary Password</label>
                    <button type="button" onClick={generatePassword} className="text-xs text-amber-700 hover:text-amber-900 font-medium hover:underline">
                      Auto-generate
                    </button>
                  </div>
                  <input type="text" required value={setupData.password} onChange={(e) => setSetupData({...setupData, password: e.target.value})} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-primary focus:border-primary font-mono" placeholder="Min. 6 characters" />
                </div>
                <div className="pt-4 flex justify-end gap-3">
                  <button type="button" onClick={() => setSetupModalApp(null)} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg font-medium transition-colors">
                    Cancel
                  </button>
                  <button type="submit" disabled={setupLoading} className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium transition-colors disabled:opacity-70 flex items-center gap-2">
                    {setupLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Creating Account...
                      </>
                    ) : (
                      <>
                        <Check className="w-4 h-4" />
                        Approve & Create Account
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Credentials Success Modal — Shown AFTER approval */}
      {credentialsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in duration-300">
            {/* Success Header */}
            <div className="bg-gradient-to-br from-green-500 to-green-600 p-8 text-center">
              <div className="w-16 h-16 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 className="w-9 h-9 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-white">Seller Approved!</h3>
              <p className="text-green-100 text-sm mt-2">
                Account created for <strong className="text-white">{credentialsModal.businessName}</strong>
              </p>
            </div>

            {/* Credentials Card */}
            <div className="p-6">
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-5 mb-6">
                <h4 className="text-sm font-bold text-amber-900 uppercase tracking-wider mb-4 flex items-center gap-2">
                  <Key className="w-4 h-4" /> Login Credentials
                </h4>
                
                {/* Email */}
                <div className="flex items-center justify-between py-3 border-b border-amber-200/60">
                  <div>
                    <p className="text-xs text-amber-700 font-medium">Email</p>
                    <p className="text-gray-900 font-mono text-sm mt-0.5">{credentialsModal.email}</p>
                  </div>
                  <button
                    onClick={() => copyToClipboard(credentialsModal.email, 'Email')}
                    className="p-2 text-amber-700 hover:bg-amber-100 rounded-lg transition-colors"
                    title="Copy email"
                  >
                    {copiedField === 'Email' ? <CheckCircle2 className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>

                {/* Password */}
                <div className="flex items-center justify-between py-3">
                  <div>
                    <p className="text-xs text-amber-700 font-medium">Password</p>
                    <p className="text-gray-900 font-mono text-sm mt-0.5">{credentialsModal.password}</p>
                  </div>
                  <button
                    onClick={() => copyToClipboard(credentialsModal.password, 'Password')}
                    className="p-2 text-amber-700 hover:bg-amber-100 rounded-lg transition-colors"
                    title="Copy password"
                  >
                    {copiedField === 'Password' ? <CheckCircle2 className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Copy All Button */}
              <button
                onClick={() => copyToClipboard(
                  `Swaxtika Seller Portal Credentials\n\nSeller: ${credentialsModal.sellerName}\nBusiness: ${credentialsModal.businessName}\nEmail: ${credentialsModal.email}\nPassword: ${credentialsModal.password}\n\nLogin at: ${window.location.origin.replace('admin', 'seller') || 'Seller Portal URL'}`,
                  'All Credentials'
                )}
                className="w-full py-3 bg-gray-900 text-white rounded-xl hover:bg-gray-800 transition-colors font-medium text-sm flex items-center justify-center gap-2 mb-3"
              >
                {copiedField === 'All Credentials' ? (
                  <>
                    <CheckCircle2 className="w-4 h-4 text-green-400" /> Copied to Clipboard!
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" /> Copy All Credentials (to share via WhatsApp / SMS)
                  </>
                )}
              </button>

              {/* Email Status */}
              {credentialsModal.emailSent ? (
                <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-4 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-green-600 flex-shrink-0" />
                  <p className="text-xs text-green-700">
                    <strong>Email sent!</strong> Login credentials have been emailed to {credentialsModal.email}
                  </p>
                </div>
              ) : (
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-4 flex items-start gap-2">
                  <Mail className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs text-amber-800 font-semibold">Email not sent</p>
                    <p className="text-xs text-amber-700 mt-0.5">
                      {credentialsModal.emailError || 'Unknown error'}. Please share the credentials manually via WhatsApp or SMS using the copy button above.
                    </p>
                  </div>
                </div>
              )}

              {/* Warning */}
              <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
                <p className="text-xs text-red-700">
                  <strong>⚠️ Important:</strong> Please save these credentials now. They will not be shown again after you close this dialog.
                </p>
              </div>

              {/* Close */}
              <button
                onClick={() => setCredentialsModal(null)}
                className="w-full py-2.5 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors font-medium text-sm"
              >
                Done — I've saved the credentials
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
