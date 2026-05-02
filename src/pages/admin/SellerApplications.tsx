import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useToast } from '../../context/ToastContext';
import { Check, X, Loader2, Store, User, Mail, Phone, MapPin, Briefcase } from 'lucide-react';

export const SellerApplications = () => {
  const [applications, setApplications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
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
    // In a real app, if status === 'approved', we might trigger a Supabase Edge Function to create a user account.
    // For now, we just update the status, and the admin will manually create credentials or contact them.
    const { error } = await supabase.from('seller_applications').update({ status }).eq('id', id);
    if (!error) {
      showToast('success', 'Status Updated', `Application marked as ${status}.`);
      fetchApplications();
    } else {
      showToast('error', 'Error', 'Failed to update application status.');
    }
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
                    <button onClick={() => updateStatus(app.id, 'approved')} className="flex items-center gap-1 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors text-sm font-medium">
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
    </div>
  );
};
