import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useToast } from '../../context/ToastContext';
import { Plus, Trash2, Image as ImageIcon, Link as LinkIcon, Loader2 } from 'lucide-react';

export const BannersManager = () => {
  const [banners, setBanners] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const { showToast } = useToast();
  
  const [newBanner, setNewBanner] = useState({ image_url: '', link_url: '' });

  useEffect(() => {
    fetchBanners();
  }, []);

  const fetchBanners = async () => {
    setLoading(true);
    const { data, error } = await supabase.from('banners').select('*').order('created_at', { ascending: false });
    if (!error && data) setBanners(data);
    setLoading(false);
  };

  const handleAddBanner = async () => {
    if (!newBanner.image_url || !newBanner.link_url) {
      showToast('error', 'Error', 'Please provide both an image URL and a link URL.');
      return;
    }
    setUploading(true);
    const { error } = await supabase.from('banners').insert([newBanner]);
    if (error) {
      showToast('error', 'Error', 'Failed to add banner.');
    } else {
      showToast('success', 'Success', 'Banner added successfully.');
      setNewBanner({ image_url: '', link_url: '' });
      fetchBanners();
    }
    setUploading(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this banner?')) return;
    const { error } = await supabase.from('banners').delete().eq('id', id);
    if (!error) {
      showToast('success', 'Success', 'Banner deleted.');
      fetchBanners();
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Banners Management</h1>
      </div>

      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <h2 className="text-lg font-medium mb-4">Add New Banner (Top Deals)</h2>
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-2"><ImageIcon className="w-4 h-4"/> Image URL</label>
            <input type="text" value={newBanner.image_url} onChange={(e) => setNewBanner({...newBanner, image_url: e.target.value})} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500" placeholder="https://example.com/banner.jpg" />
          </div>
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-2"><LinkIcon className="w-4 h-4"/> Redirection Link</label>
            <input type="text" value={newBanner.link_url} onChange={(e) => setNewBanner({...newBanner, link_url: e.target.value})} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500" placeholder="/category/all or https://external.com" />
          </div>
          <div className="flex items-end">
            <button onClick={handleAddBanner} disabled={uploading} className="bg-amber-900 text-white px-6 py-2 rounded-lg hover:bg-amber-950 flex items-center gap-2 h-[42px]">
              {uploading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Plus className="w-5 h-5" />}
              Add Banner
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          <div className="col-span-3 flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-amber-900" /></div>
        ) : banners.map((banner) => (
          <div key={banner.id} className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-100 flex flex-col">
            <div className="h-40 bg-gray-100 relative">
              <img src={banner.image_url} alt="Banner" className="w-full h-full object-cover" />
            </div>
            <div className="p-4 flex-1 flex flex-col justify-between">
              <div className="mb-4">
                <span className="text-xs font-semibold text-gray-500 uppercase">Redirects to</span>
                <p className="text-sm text-amber-600 truncate" title={banner.link_url}>{banner.link_url}</p>
              </div>
              <button onClick={() => handleDelete(banner.id)} className="text-red-600 hover:text-red-700 text-sm font-medium flex items-center gap-1 justify-center w-full py-2 border border-red-100 hover:bg-red-50 rounded-lg transition-colors">
                <Trash2 className="w-4 h-4" /> Delete Banner
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
