import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useToast } from '../../context/ToastContext';
import { Check, X, Loader2, Store, User, Mail, Phone, MapPin, Briefcase, Key } from 'lucide-react';

export const SellerApplications = () => {
  const [applications, setApplications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [setupModalApp, setSetupModalApp] = useState<any | null>(null);
  const [setupData, setSetupData] = useState({ email: '', mobile: '', password: '' });
  const [setupLoading, setSetupLoading] = useState(false);
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

  const handleSetupSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!setupModalApp) return;
    setSetupLoading(true);

    try {
      // 1. Create user in auth.users
      const { data, error: authError } = await supabase.auth.signUp({
        email: setupData.email,
        password: setupData.password,
        options: {
          data: {
            first_name: setupModalApp.owner_name.split(' ')[0],
            last_name: setupModalApp.owner_name.split(' ').slice(1).join(' ') || '',
            mobile_number: setupData.mobile,
            role: 'seller'
          }
        }
      });

      if (authError) throw authError;

      // Immediately sign out to prevent the admin from being logged into the seller account in Supabase
      await supabase.auth.signOut();

      // 2. Update application status
      await supabase.from('seller_applications').update({ status: 'approved' }).eq('id', setupModalApp.id);

      showToast('success', 'Credentials Created', 'Seller account created successfully!');
      setSetupModalApp(null);
      setSetupData({ email: '', mobile: '', password: '' });
      fetchApplications();

    } catch (err: any) {
      showToast('error', 'Setup Failed', err.message);
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
              <p className="text-sm text-gray-600 mb-6">Create login credentials for <span className="font-semibold text-gray-900">{setupModalApp.business_name}</span>.</p>
              
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
                  <label className="block text-sm font-medium text-gray-700 mb-1">Temporary Password</label>
                  <input type="text" required value={setupData.password} onChange={(e) => setSetupData({...setupData, password: e.target.value})} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-primary focus:border-primary" placeholder="Enter a secure password" />
                </div>
                <div className="pt-4 flex justify-end gap-3">
                  <button type="button" onClick={() => setSetupModalApp(null)} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg font-medium transition-colors">
                    Cancel
                  </button>
                  <button type="submit" disabled={setupLoading} className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium transition-colors disabled:opacity-70 flex items-center gap-2">
                    {setupLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                    Create & Approve
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
