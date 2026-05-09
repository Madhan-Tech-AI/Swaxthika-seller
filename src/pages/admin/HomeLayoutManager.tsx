import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../../lib/supabase';
import { useToast } from '../../context/ToastContext';
import { Upload, Loader2, Image as ImageIcon, Link as LinkIcon, Check, X, RefreshCw } from 'lucide-react';

interface BannerSlot {
  id?: string;
  slot_name: string;
  title: string;
  subtitle: string;
  image_url: string;
  link_url: string;
  is_active: boolean;
}

const SLOTS = [
  { name: 'main_featured_large', label: 'Main Featured (Large)', ratio: '8:7', description: 'Recommended: 1600x1400px' },
  { name: 'side_top', label: 'Side Top', ratio: '2:1', description: 'Recommended: 800x400px' },
  { name: 'side_middle', label: 'Side Middle', ratio: '2:1', description: 'Recommended: 800x400px' },
  { name: 'side_bottom', label: 'Side Bottom', ratio: '2:1', description: 'Recommended: 800x400px' },
  { name: 'wide_bottom', label: 'Wide Bottom Row', ratio: '3:1', description: 'Recommended: 1800x600px' }
];

export const HomeLayoutManager = () => {
  const [banners, setBanners] = useState<Record<string, BannerSlot>>({});
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingSlot, setSavingSlot] = useState<string | null>(null);
  const { showToast } = useToast();
  const globalFileInputRef = useRef<HTMLInputElement>(null);
  const [activeSlot, setActiveSlot] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    await Promise.all([fetchBanners(), fetchCategories()]);
    setLoading(false);
  };

  const fetchCategories = async () => {
    const { data } = await supabase.from('categories').select('name').order('name');
    if (data) setCategories(data);
  };

  // Trigger file input when activeSlot is set
  useEffect(() => {
    if (activeSlot && globalFileInputRef.current) {
      globalFileInputRef.current.click();
    }
  }, [activeSlot]);

  const fetchBanners = async () => {
    const { data, error } = await supabase.from('featured_banners').select('*');
    if (!error && data) {
      const bannerMap = data.reduce((acc: any, b: any) => ({ ...acc, [b.slot_name]: { ...b } }), {});
      setBanners({ ...bannerMap });
    }
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>, slotName: string) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setSavingSlot(slotName);
    try {
      // 1. Upload to Storage (using carousel-images bucket as it exists and is public)
      const fileExt = file.name.split('.').pop();
      const fileName = `${slotName}_${Math.random()}.${fileExt}`;
      const filePath = `home_layout/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('carousel-images')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('carousel-images')
        .getPublicUrl(filePath);

      // 2. Update DB with Upsert
      const { error } = await supabase
        .from('featured_banners')
        .upsert({
          slot_name: slotName,
          image_url: publicUrl,
          is_active: true,
          updated_at: new Date().toISOString()
        }, { onConflict: 'slot_name' });

      if (error) throw error;

      showToast('success', 'Layout Updated', `Image for ${slotName} uploaded successfully.`);
      fetchBanners();
    } catch (err: any) {
      console.error(err);
      showToast('error', 'Upload Failed', err.message || 'Could not upload image.');
    } finally {
      setSavingSlot(null);
    }
  };

  const updateLink = async (slotName: string, link: string) => {
    setSavingSlot(slotName);
    try {
      const { error } = await supabase
        .from('featured_banners')
        .upsert({
          slot_name: slotName,
          link_url: link,
          updated_at: new Date().toISOString()
        }, { onConflict: 'slot_name' });

      if (error) throw error;
      showToast('success', 'Link Updated', 'Redirection link saved.');
      fetchBanners();
    } catch (err: any) {
      showToast('error', 'Update Failed', err.message);
    } finally {
      setSavingSlot(null);
      setActiveSlot(null);
    }
  };

  const toggleActive = async (slotName: string, status: boolean) => {
    const existing = banners[slotName];
    if (!existing?.id) return;

    try {
      const { error } = await supabase
        .from('featured_banners')
        .update({ is_active: status })
        .eq('id', existing.id);

      if (error) throw error;
      fetchBanners();
    } catch (err: any) {
      showToast('error', 'Error', err.message);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-10 h-10 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-20">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-display font-bold text-gray-900 tracking-tight">Home Layout Manager</h1>
          <p className="text-gray-500 mt-2">Manage the premium featured collections grid on the main storefront.</p>
        </div>
        <button onClick={fetchBanners} className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-400 hover:text-primary">
          <RefreshCw className="w-5 h-5" />
        </button>
      </div>

      <div className="grid grid-cols-1 gap-10">
        {SLOTS.map((slot) => {
          const data = banners[slot.name];
          const isSaving = savingSlot === slot.name;

          return (
            <div key={slot.name} className="bg-white rounded-3xl border border-gray-100 shadow-premium overflow-hidden">
              <div className="p-6 border-b border-gray-50 bg-gray-50/50 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold">
                    {slot.name[0].toUpperCase()}
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900">{slot.label}</h3>
                    <p className="text-xs text-primary font-bold uppercase tracking-widest mt-0.5">{slot.description}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                   <label className="relative inline-flex items-center cursor-pointer">
                    <input 
                      type="checkbox" 
                      className="sr-only peer" 
                      checked={data?.is_active ?? false}
                      onChange={(e) => toggleActive(slot.name, e.target.checked)}
                      disabled={!data?.image_url}
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                  </label>
                  <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Active</span>
                </div>
              </div>

              <div className="p-8">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                  {/* Upload Area */}
                  <div className="space-y-4">
                    <div 
                      className={`relative aspect-video rounded-2xl border-2 border-dashed flex flex-col items-center justify-center overflow-hidden transition-all group ${data?.image_url ? 'border-primary/20 bg-primary/5' : 'border-gray-200 hover:border-primary/40 bg-gray-50/50'}`}
                    >
                      {data?.image_url ? (
                        <>
                          <img src={data.image_url} alt={slot.label} className="w-full h-full object-cover" />
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4">
                            <button 
                              onClick={() => setActiveSlot(slot.name)}
                              className="w-12 h-12 bg-white rounded-full flex items-center justify-center text-primary hover:scale-110 transition-transform shadow-xl"
                            >
                              <Upload className="w-6 h-6" />
                            </button>
                          </div>
                        </>
                      ) : (
                        <div className="text-center p-6">
                          <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-sm border border-gray-100 group-hover:scale-110 transition-transform">
                            <ImageIcon className="w-8 h-8 text-gray-300" />
                          </div>
                          <p className="font-bold text-gray-600">No image uploaded</p>
                          <p className="text-xs text-gray-400 mt-1">This section is currently hidden from site</p>
                          <button 
                            onClick={() => setActiveSlot(slot.name)}
                            className="mt-4 px-6 py-2 bg-primary text-white rounded-xl text-sm font-bold shadow-lg shadow-primary/20 hover:bg-primary-600 transition-all active:scale-95"
                          >
                            Upload Image
                          </button>
                        </div>
                      )}
                      
                      {isSaving && (
                        <div className="absolute inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center z-20">
                          <div className="flex flex-col items-center gap-3">
                            <Loader2 className="w-8 h-8 animate-spin text-primary" />
                            <p className="text-sm font-bold text-primary uppercase tracking-widest">Uploading...</p>
                          </div>
                        </div>
                      )}
                    </div>
                    
                    {activeSlot === slot.name && (
                      <div className="fixed inset-0 z-[-1]" onClick={() => setActiveSlot(null)}></div>
                    )}
                  </div>

                  {/* Settings Area */}
                  <div className="flex flex-col justify-center gap-6">
                    <div>
                      <label className="block text-xs font-bold text-gray-400 uppercase tracking-[0.2em] mb-3">Redirection Link (CTA)</label>
                      <div className="relative group">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                          <LinkIcon className="h-4 w-4 text-gray-400" />
                        </div>
                        <select
                          value={data?.link_url || ''}
                          onChange={(e) => updateLink(slot.name, e.target.value)}
                          className="block w-full pl-11 pr-4 py-4 border border-gray-100 rounded-2xl bg-gray-50 focus:bg-white focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/5 transition-all text-sm shadow-inner-sm appearance-none cursor-pointer"
                        >
                          <option value="">Select Target Page</option>
                          <option value="/category/all">Shop All Products</option>
                          <option value="/today-deals">Today's Deals</option>
                          <optgroup label="Shop by Category">
                            {categories.map(cat => (
                              <option key={cat.name} value={`/category/${cat.name.toLowerCase().replace(/\s+/g, '-')}`}>
                                {cat.name}
                              </option>
                            ))}
                          </optgroup>
                        </select>
                      </div>
                      <p className="text-[10px] text-gray-400 mt-2 ml-2 italic">Selecting an option saves the link automatically.</p>
                    </div>

                    <div className="p-4 rounded-2xl bg-amber-50/50 border border-amber-100">
                      <p className="text-xs text-amber-800 leading-relaxed font-medium">
                        <strong>Design Tip:</strong> For the {slot.label} slot, use an image that has a clear subject on one side to allow the premium storefront aesthetic to shine.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Hidden file input trigger */}
      <input 
        type="file" 
        className="hidden" 
        ref={globalFileInputRef}
        onChange={(e) => {
          if (activeSlot) {
            handleUpload(e, activeSlot);
            // Small timeout to allow the browser to process the click properly if same slot is clicked again
            setTimeout(() => setActiveSlot(null), 100);
          }
        }}
      />
    </div>
  );
};
