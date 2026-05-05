import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import { Settings, User, Store, Shield, LogOut, CheckCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const SellerSettings = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [sellerData, setSellerData] = useState<any>(null);

  useEffect(() => {
    fetchProfile();
  }, [user]);

  const fetchProfile = async () => {
    if (!user?.email) return;
    try {
      const { data } = await supabase
        .from('seller_applications')
        .select('*')
        .eq('email', user.email)
        .eq('status', 'approved')
        .limit(1)
        .maybeSingle();
        
      setSellerData(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await signOut();
    navigate('/login');
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-20">
        <div className="w-8 h-8 border-4 border-amber-900 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-10">
      
      {/* Header */}
      <div>
        <h1 className="text-3xl font-display font-extrabold text-gray-900 tracking-tight">Account Settings</h1>
        <p className="text-gray-500 mt-2 font-sans">Manage your seller profile and business preferences.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-8">
        
        {/* Sidebar Nav */}
        <div className="space-y-2">
          <button className="w-full flex items-center gap-3 px-4 py-3 bg-white text-amber-900 font-bold rounded-xl shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)] border border-amber-100 transition-all">
            <User className="w-5 h-5" /> Profile Overview
          </button>
          <button className="w-full flex items-center gap-3 px-4 py-3 text-gray-600 hover:bg-white hover:shadow-sm font-medium rounded-xl border border-transparent hover:border-gray-100 transition-all">
            <Store className="w-5 h-5" /> Business Details
          </button>
          <button className="w-full flex items-center gap-3 px-4 py-3 text-gray-600 hover:bg-white hover:shadow-sm font-medium rounded-xl border border-transparent hover:border-gray-100 transition-all">
            <Shield className="w-5 h-5" /> Security
          </button>
          <button onClick={handleLogout} className="w-full flex items-center gap-3 px-4 py-3 text-red-600 hover:bg-red-50 font-bold rounded-xl transition-all mt-4">
            <LogOut className="w-5 h-5" /> Sign Out
          </button>
        </div>

        {/* Content Area */}
        <div className="md:col-span-2 space-y-6">
          
          <div className="bg-white rounded-3xl shadow-[0_2px_20px_-4px_rgba(0,0,0,0.02)] border border-gray-100 overflow-hidden">
            <div className="p-8 border-b border-gray-100 flex items-center gap-6">
              <div className="w-20 h-20 bg-gradient-to-br from-amber-100 to-amber-50 rounded-2xl flex items-center justify-center text-amber-800 text-2xl font-bold font-display border border-amber-200/50">
                {user?.user_metadata?.first_name?.charAt(0) || 'S'}
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900">{sellerData?.business_name || 'Seller Business'}</h2>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-gray-500">{sellerData?.owner_name || 'Owner Name'}</span>
                  <span className="flex items-center gap-1 text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">
                    <CheckCircle className="w-3 h-3" /> Verified Partner
                  </span>
                </div>
              </div>
            </div>

            <div className="p-8 space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Email Address</label>
                  <div className="p-3 bg-gray-50 rounded-xl border border-gray-100 text-gray-700 font-medium text-sm">
                    {user?.email}
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Mobile Number</label>
                  <div className="p-3 bg-gray-50 rounded-xl border border-gray-100 text-gray-700 font-medium text-sm">
                    {sellerData?.phone || user?.user_metadata?.mobile_number || 'N/A'}
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Business Address</label>
                <div className="p-4 bg-gray-50 rounded-xl border border-gray-100 text-gray-700 text-sm leading-relaxed">
                  {sellerData?.address ? (
                    <>
                      {sellerData.address}<br/>
                      {sellerData.city}, {sellerData.state} - {sellerData.pincode}
                    </>
                  ) : 'No address provided'}
                </div>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-4 border-t border-gray-100">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">PAN Number</label>
                  <div className="p-3 bg-gray-50 rounded-xl border border-gray-100 text-gray-700 font-medium text-sm uppercase">
                    {sellerData?.pan_number || 'Not Provided'}
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">GST Number</label>
                  <div className="p-3 bg-gray-50 rounded-xl border border-gray-100 text-gray-700 font-medium text-sm uppercase">
                    {sellerData?.gst_number || 'Not Applicable'}
                  </div>
                </div>
              </div>
            </div>
            
            <div className="bg-amber-50/50 p-6 border-t border-amber-100 flex items-center justify-between">
              <p className="text-sm text-amber-800">To update these details, please contact administrator support.</p>
              <button className="px-4 py-2 bg-white text-amber-900 border border-amber-200 rounded-lg text-sm font-bold hover:bg-amber-50 transition-colors shadow-sm">
                Contact Admin
              </button>
            </div>
          </div>

        </div>
      </div>

    </div>
  );
};
