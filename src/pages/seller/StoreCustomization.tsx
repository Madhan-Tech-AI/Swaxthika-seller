import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import { Store, FileText, Globe, Image as ImageIcon, Save, Loader2, UploadCloud, CheckCircle } from 'lucide-react';
import { useToast } from '../../context/ToastContext';

export function StoreCustomization() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [sellerApp, setSellerApp] = useState<any>(null);
  
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [uploadingBanner, setUploadingBanner] = useState(false);

  const [storeData, setStoreData] = useState({
    store_description: '',
    store_website: '',
    store_logo: '',
    store_banner: ''
  });

  useEffect(() => {
    fetchSellerData();
  }, [user]);

  const fetchSellerData = async () => {
    if (!user) return;
    try {
      // Primary Strategy: Match by user_id
      let { data: seller } = await supabase
        .from('seller_applications')
        .select('*')
        .eq('user_id', user.id)
        .eq('status', 'approved')
        .maybeSingle();

      // Secondary Strategy: Match by email (fallback)
      if (!seller && user.email) {
        const { data: byEmail } = await supabase
          .from('seller_applications')
          .select('*')
          .ilike('email', user.email)
          .eq('status', 'approved')
          .maybeSingle();
        
        if (byEmail) {
          seller = byEmail;
          // Link user_id if missing
          await supabase.from('seller_applications').update({ user_id: user.id }).eq('id', seller.id);
        }
      }

      if (seller) {
        setSellerApp(seller);
        setStoreData({
          store_description: seller.store_description || '',
          store_website: seller.store_website || '',
          store_logo: seller.store_logo || '',
          store_banner: seller.store_banner || ''
        });
      }
    } catch (err) {
      console.error('Error fetching seller:', err);
    } finally {
      setLoading(false);
    }
  };

  const uploadImage = async (file: File) => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${Math.random()}.${fileExt}`;
    const filePath = `branding/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('product-images')
      .upload(filePath, file);

    if (uploadError) throw uploadError;

    const { data } = supabase.storage
      .from('product-images')
      .getPublicUrl(filePath);

    return data.publicUrl;
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, field: 'store_logo' | 'store_banner') => {
    try {
      if (!e.target.files || e.target.files.length === 0) return;
      
      if (field === 'store_logo') setUploadingLogo(true);
      else setUploadingBanner(true);

      const url = await uploadImage(e.target.files[0]);
      setStoreData(prev => ({ ...prev, [field]: url }));
      showToast('success', 'Uploaded', `${field === 'store_logo' ? 'Logo' : 'Banner'} uploaded successfully.`);
    } catch (error) {
      console.error('Upload error:', error);
      showToast('error', 'Upload Failed', 'Could not upload image.');
    } finally {
      setUploadingLogo(false);
      setUploadingBanner(false);
    }
  };

  const handleSave = async () => {
    if (!sellerApp) return;
    setSaving(true);
    try {
      const { error } = await supabase
        .from('seller_applications')
        .update(storeData)
        .eq('id', sellerApp.id);

      if (error) throw error;
      showToast('success', 'Settings Saved', 'Store customization updated successfully.');
    } catch (err) {
      console.error('Error saving store profile:', err);
      showToast('error', 'Save Failed', 'Could not update store profile.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-amber-900" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-display font-bold text-gray-900 mb-2">Store Customization</h1>
        <p className="text-gray-500">Configure how your store appears to customers on the main platform.</p>
      </div>

      <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-8 border-b border-gray-50">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-10 h-10 bg-amber-900/10 rounded-xl flex items-center justify-center text-amber-900">
              <Store className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">Branding & Profile</h2>
              <p className="text-sm text-gray-500">Personalize your storefront identity</p>
            </div>
          </div>

          <div className="space-y-8">
            {/* Description */}
            <div className="space-y-3">
              <label className="flex items-center gap-2 text-sm font-bold text-amber-900 uppercase tracking-wider">
                <FileText className="w-4 h-4" /> About Your Store
              </label>
              <textarea
                value={storeData.store_description}
                onChange={(e) => setStoreData({ ...storeData, store_description: e.target.value })}
                className="w-full px-5 py-4 border border-gray-200 rounded-2xl focus:ring-4 focus:ring-amber-900/5 focus:border-amber-900 transition-all min-h-[160px] text-gray-700 bg-gray-50/50"
                placeholder="Describe your brand, your history, and what makes your products special..."
              />
            </div>

            {/* Website */}
            <div className="space-y-3">
              <label className="flex items-center gap-2 text-sm font-bold text-amber-900 uppercase tracking-wider">
                <Globe className="w-4 h-4" /> External Contact Link
              </label>
              <div className="relative">
                <Globe className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="url"
                  value={storeData.store_website}
                  onChange={(e) => setStoreData({ ...storeData, store_website: e.target.value })}
                  className="w-full pl-12 pr-5 py-4 border border-gray-200 rounded-2xl focus:ring-4 focus:ring-amber-900/5 focus:border-amber-900 transition-all text-gray-700 bg-gray-50/50"
                  placeholder="https://yourwebsite.com or your Google Maps link"
                />
              </div>
              <p className="text-xs text-gray-400 italic">This link will be used for the 'Contact Us' button on your store page.</p>
            </div>

            {/* Logo and Banner Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Logo Upload */}
              <div className="space-y-3">
                <label className="flex items-center gap-2 text-sm font-bold text-amber-900 uppercase tracking-wider">
                  <ImageIcon className="w-4 h-4" /> Store Logo
                </label>
                <div className="relative group">
                  <div className="aspect-square rounded-3xl bg-gray-50 border-2 border-dashed border-gray-200 flex flex-col items-center justify-center overflow-hidden transition-colors group-hover:border-amber-900/30">
                    {storeData.store_logo ? (
                      <>
                        <img src={storeData.store_logo} alt="Logo Preview" className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                           <label className="cursor-pointer bg-white text-gray-900 px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2">
                             <UploadCloud className="w-4 h-4" /> Change Logo
                             <input type="file" accept="image/*" className="hidden" onChange={(e) => handleFileUpload(e, 'store_logo')} />
                           </label>
                        </div>
                      </>
                    ) : (
                      <label className="cursor-pointer flex flex-col items-center gap-3 p-6 text-center">
                        <div className="w-12 h-12 bg-white rounded-2xl shadow-sm flex items-center justify-center text-gray-400">
                          {uploadingLogo ? <Loader2 className="w-6 h-6 animate-spin" /> : <UploadCloud className="w-6 h-6" />}
                        </div>
                        <div>
                          <p className="text-sm font-bold text-gray-700">Upload Logo</p>
                          <p className="text-xs text-gray-400 mt-1">Square image (PNG/JPG)</p>
                        </div>
                        <input type="file" accept="image/*" className="hidden" onChange={(e) => handleFileUpload(e, 'store_logo')} />
                      </label>
                    )}
                  </div>
                </div>
              </div>

              {/* Banner Upload */}
              <div className="space-y-3">
                <label className="flex items-center gap-2 text-sm font-bold text-amber-900 uppercase tracking-wider">
                  <ImageIcon className="w-4 h-4" /> Store Banner
                </label>
                <div className="relative group">
                  <div className="aspect-square rounded-3xl bg-gray-50 border-2 border-dashed border-gray-200 flex flex-col items-center justify-center overflow-hidden transition-colors group-hover:border-amber-900/30">
                    {storeData.store_banner ? (
                      <>
                        <img src={storeData.store_banner} alt="Banner Preview" className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                           <label className="cursor-pointer bg-white text-gray-900 px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2">
                             <UploadCloud className="w-4 h-4" /> Change Banner
                             <input type="file" accept="image/*" className="hidden" onChange={(e) => handleFileUpload(e, 'store_banner')} />
                           </label>
                        </div>
                      </>
                    ) : (
                      <label className="cursor-pointer flex flex-col items-center gap-3 p-6 text-center">
                        <div className="w-12 h-12 bg-white rounded-2xl shadow-sm flex items-center justify-center text-gray-400">
                          {uploadingBanner ? <Loader2 className="w-6 h-6 animate-spin" /> : <UploadCloud className="w-6 h-6" />}
                        </div>
                        <div>
                          <p className="text-sm font-bold text-gray-700">Upload Banner</p>
                          <p className="text-xs text-gray-400 mt-1">Wide image (2000x800 recommended)</p>
                        </div>
                        <input type="file" accept="image/*" className="hidden" onChange={(e) => handleFileUpload(e, 'store_banner')} />
                      </label>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-gray-50/50 p-8 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <CheckCircle className="w-4 h-4 text-green-500" />
            Changes made here will be visible to all customers visiting your store page.
          </div>
          <button
            onClick={handleSave}
            disabled={saving}
            className="w-full md:w-auto bg-amber-900 text-white px-10 py-4 rounded-2xl font-bold flex items-center justify-center gap-3 shadow-xl shadow-amber-900/20 hover:bg-amber-950 transition-all disabled:opacity-50 disabled:cursor-not-allowed group"
          >
            {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5 group-hover:scale-110 transition-transform" />}
            Save Store Profile
          </button>
        </div>
      </div>
    </div>
  );
}
