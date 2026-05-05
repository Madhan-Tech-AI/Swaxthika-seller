import React, { useState, useEffect } from 'react';
import { Plus, Search, Filter, Edit, Trash2, X, Upload, UploadCloud, RefreshCw } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';

export function SellerProducts() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [sellerApp, setSellerApp] = useState<any | null>(null);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [editingProduct, setEditingProduct] = useState<any | null>(null);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  
  // Form State
  const [formData, setFormData] = useState({
    name: '',
    brand: '',
    sku: '',
    category: '',
    price: '',
    original_price: '',
    stock: '',
    image: '',
    description: '',
    is_featured: false,
    is_deal: false,
    status: 'Active'
  });
  const [bulletPoints, setBulletPoints] = useState<string[]>(['']);
  const [additionalImages, setAdditionalImages] = useState<string[]>([]);
  const [uploadingMainImage, setUploadingMainImage] = useState(false);
  const [uploadingAdditional, setUploadingAdditional] = useState(false);

  useEffect(() => {
    if (user?.email) {
      supabase
        .from('seller_applications')
        .select('*')
        .eq('email', user.email)
        .eq('status', 'approved')
        .limit(1)
        .maybeSingle()
        .then(({ data }) => {
          if (data) {
            setSellerApp(data);
          } else {
            setLoading(false);
          }
        });
    }
  }, [user]);

  useEffect(() => {
    if (sellerApp) {
      fetchProducts();
    }
  }, [sellerApp]);

  const fetchProducts = async () => {
    if (!sellerApp) return;
    setLoading(true);
    try {
      const { data } = await supabase
        .from('products')
        .select('*')
        .eq('seller_id', sellerApp.id)
        .order('created_at', { ascending: false });
      if (data) setProducts(data);
    } catch (error) {
      console.error('Error fetching seller products:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleBulletChange = (index: number, value: string) => {
    const newBullets = [...bulletPoints];
    newBullets[index] = value;
    setBulletPoints(newBullets);
  };
  const addBullet = () => setBulletPoints([...bulletPoints, '']);
  const removeBullet = (index: number) => setBulletPoints(bulletPoints.filter((_, i) => i !== index));

  const uploadImage = async (file: File) => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${Math.random()}.${fileExt}`;
    const filePath = `${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('product-images')
      .upload(filePath, file);

    if (uploadError) throw uploadError;

    const { data } = supabase.storage
      .from('product-images')
      .getPublicUrl(filePath);

    return data.publicUrl;
  };

  const handleMainImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    try {
      if (!e.target.files || e.target.files.length === 0) return;
      setUploadingMainImage(true);
      const url = await uploadImage(e.target.files[0]);
      setFormData({ ...formData, image: url });
      showToast('success', 'Image Uploaded', 'Main image uploaded successfully.');
    } catch (error) {
      console.error('Error uploading main image:', error);
      showToast('error', 'Upload Failed', 'Could not upload main image.');
    } finally {
      setUploadingMainImage(false);
    }
  };

  const handleAdditionalImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    try {
      if (!e.target.files || e.target.files.length === 0) return;
      setUploadingAdditional(true);
      const url = await uploadImage(e.target.files[0]);
      setAdditionalImages([...additionalImages, url]);
      showToast('success', 'Image Uploaded', 'Additional image uploaded successfully.');
    } catch (error) {
      console.error('Error uploading additional image:', error);
      showToast('error', 'Upload Failed', 'Could not upload additional image.');
    } finally {
      setUploadingAdditional(false);
    }
  };

  const removeImage = (urlToRemove: string) => {
    setAdditionalImages(additionalImages.filter(img => img !== urlToRemove));
  };

  const handleEditProduct = (product: any) => {
    setEditingProduct(product);
    setFormData({
      name: product.name || '',
      brand: product.brand || '',
      sku: product.sku || '',
      category: product.category || '',
      price: String(product.price || ''),
      original_price: String(product.original_price || ''),
      stock: String(product.stock || ''),
      image: product.image || '',
      description: product.description || '',
      is_featured: product.is_featured || false,
      is_deal: product.is_deal || false,
      status: product.status || 'Active',
    });
    setBulletPoints(product.bullet_points?.length ? product.bullet_points : ['']);
    setAdditionalImages(product.additional_images || []);
    setIsAdding(true);
  };

  const handleDeleteOne = async (id: string) => {
    if (!confirm('Delete this product? This cannot be undone.')) return;
    try {
      const { error } = await supabase.from('products').delete().eq('id', id).eq('seller_id', sellerApp.id);
      if (error) throw error;
      showToast('success', 'Deleted', 'Product removed.');
      fetchProducts();
    } catch {
      showToast('error', 'Failed', 'Could not delete product.');
    }
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sellerApp) return;
    setSaving(true);
    try {
      const cleanedBullets = bulletPoints.filter(b => b.trim() !== '');
      const cleanedImages = additionalImages.filter(img => img.trim() !== '');
      const productData = {
        ...formData,
        price: Number(formData.price),
        original_price: formData.original_price ? Number(formData.original_price) : null,
        stock: Number(formData.stock),
        bullet_points: cleanedBullets,
        additional_images: cleanedImages,
        seller_id: sellerApp.id
      };

      if (editingProduct) {
        const { error } = await supabase.from('products').update(productData).eq('id', editingProduct.id).eq('seller_id', sellerApp.id);
        if (error) throw error;
        showToast('success', 'Product Updated', `${formData.name} has been updated.`);
      } else {
        const { error } = await supabase.from('products').insert([productData]);
        if (error) throw error;
        showToast('success', 'Product Added', `${formData.name} has been added to your catalog.`);
      }

      setIsAdding(false);
      setEditingProduct(null);
      setFormData({ name: '', brand: '', sku: '', category: '', price: '', original_price: '', stock: '', image: '', description: '', is_featured: false, is_deal: false, status: 'Active' });
      setBulletPoints(['']);
      setAdditionalImages([]);
      fetchProducts();
    } catch (error) {
      showToast('error', 'Save Failed', 'Failed to save product.');
    } finally {
      setSaving(false);
    }
  };

  const filtered = products.filter(p => {
    const q = search.toLowerCase();
    const cat = categoryFilter === 'All' || p.category === categoryFilter;
    const s = !search.trim() || p.name?.toLowerCase().includes(q) || p.sku?.toLowerCase().includes(q);
    return cat && s;
  });

  const CATEGORIES = ['All', ...Array.from(new Set(products.map(p => p.category).filter(Boolean)))];

  if (loading) return <div className="p-8 flex items-center justify-center"><div className="w-8 h-8 border-4 border-amber-900 border-t-transparent rounded-full animate-spin"></div></div>;

  if (!sellerApp) {
    return (
      <div className="p-12 text-center bg-white rounded-2xl shadow-sm border border-stone-100 max-w-2xl mx-auto">
        <h2 className="text-xl font-bold text-amber-900 mb-2">Registration Required</h2>
        <p className="text-stone-600 mb-4">No approved seller account found with your current login details.</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-amber-900">Products Catalog</h1>
          <p className="text-stone-500 text-sm mt-1">Manage and edit the products offered in your seller store</p>
        </div>
        {!isAdding && (
          <button 
            onClick={() => setIsAdding(true)}
            className="bg-amber-900 text-white px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-amber-950 transition-colors flex items-center gap-2 shadow-sm"
          >
            <Plus className="w-4 h-4" /> Add Product
          </button>
        )}
      </div>

      {isAdding ? (
        <div className="bg-white rounded-xl border border-stone-100 shadow-sm overflow-hidden animate-in fade-in slide-in-from-bottom-4">
          <div className="p-4 border-b border-stone-100 flex items-center justify-between bg-stone-50">
            <h2 className="font-bold text-amber-900 text-lg">{editingProduct ? 'Edit Product' : 'Add New Product'}</h2>
            <button onClick={() => { setIsAdding(false); setEditingProduct(null); }} className="p-2 text-stone-400 hover:text-stone-600 rounded-full hover:bg-stone-200 transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>
          
          <form onSubmit={handleSaveProduct} className="p-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Left Column: Core Info */}
              <div className="lg:col-span-2 space-y-6">
                
                {/* Basic Info */}
                <div className="space-y-4">
                  <h3 className="text-sm font-bold text-amber-900 uppercase tracking-wider border-b border-amber-100 pb-2">Basic Info</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium mb-1">Product Title*</label>
                      <input required value={formData.name} onChange={e=>setFormData({...formData, name: e.target.value})} type="text" className="w-full px-3 py-2 border border-stone-200 bg-stone-50 rounded-md focus:ring-amber-500 focus:border-amber-500" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Brand</label>
                      <input value={formData.brand} onChange={e=>setFormData({...formData, brand: e.target.value})} type="text" className="w-full px-3 py-2 border border-stone-200 bg-stone-50 rounded-md" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Category*</label>
                      <select required value={formData.category} onChange={e=>setFormData({...formData, category: e.target.value})} className="w-full px-3 py-2 border border-stone-200 rounded-md bg-stone-50">
                        <option value="">Select Category</option>
                        <option value="Brass Idols">Brass Idols</option>
                        <option value="Spiritual Books">Spiritual Books</option>
                        <option value="Pooja Items">Pooja Items</option>
                        <option value="Temple Jewellery">Temple Jewellery</option>
                        <option value="Homam Samagri">Homam Samagri</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* About this item */}
                <div className="space-y-4 pt-4">
                  <h3 className="text-sm font-bold text-amber-900 uppercase tracking-wider border-b border-amber-100 pb-2">About this item</h3>
                  <p className="text-xs text-stone-500">Key bullet points (e.g. features/specifications)</p>
                  {bulletPoints.map((bullet, index) => (
                    <div key={index} className="flex gap-2">
                      <input 
                        value={bullet} 
                        onChange={(e) => handleBulletChange(index, e.target.value)}
                        type="text" 
                        className="flex-1 px-3 py-2 border border-stone-200 bg-stone-50 rounded-md text-sm"
                        placeholder="Feature or specification..."
                      />
                      <button type="button" onClick={() => removeBullet(index)} className="p-2 text-red-500 hover:bg-red-50 rounded border border-transparent">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                  <button type="button" onClick={addBullet} className="text-sm text-amber-800 font-medium flex items-center gap-1 hover:underline">
                    <Plus className="w-4 h-4" /> Add Bullet Point
                  </button>
                </div>

                {/* Detailed Description */}
                <div className="space-y-4 pt-4">
                  <h3 className="text-sm font-bold text-amber-900 uppercase tracking-wider border-b border-amber-100 pb-2">Detailed Description</h3>
                  <textarea 
                    value={formData.description} 
                    onChange={e=>setFormData({...formData, description: e.target.value})}
                    rows={4} 
                    className="w-full px-3 py-2 border border-stone-200 bg-stone-50 rounded-md text-sm" 
                  />
                </div>

              </div>

              {/* Right Column: Pricing, Media, Settings */}
              <div className="space-y-6">
                
                {/* Pricing & Inventory */}
                <div className="bg-stone-50 p-4 rounded-lg border border-stone-200 space-y-4">
                  <h3 className="text-sm font-bold text-amber-900 uppercase tracking-wider mb-2">Pricing & Inventory</h3>
                  <div>
                    <label className="block text-sm font-medium mb-1">Selling Price (₹)*</label>
                    <input required value={formData.price} onChange={e=>setFormData({...formData, price: e.target.value})} type="number" min="0" step="0.01" className="w-full px-3 py-2 border border-stone-200 bg-white rounded-md" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">MRP / Original Price (₹)</label>
                    <input value={formData.original_price} onChange={e=>setFormData({...formData, original_price: e.target.value})} type="number" min="0" step="0.01" className="w-full px-3 py-2 border border-stone-200 bg-white rounded-md text-stone-500" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-1">Stock*</label>
                      <input required value={formData.stock} onChange={e=>setFormData({...formData, stock: e.target.value})} type="number" min="0" className="w-full px-3 py-2 border border-stone-200 bg-white rounded-md" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">SKU</label>
                      <input value={formData.sku} onChange={e=>setFormData({...formData, sku: e.target.value})} type="text" className="w-full px-3 py-2 border border-stone-200 bg-white rounded-md" />
                    </div>
                  </div>
                </div>

                {/* Media */}
                <div className="bg-stone-50 p-4 rounded-lg border border-stone-200 space-y-4">
                  <h3 className="text-sm font-bold text-amber-900 uppercase tracking-wider mb-2 flex items-center gap-2"><Upload className="w-4 h-4"/> Media Upload</h3>
                  <div>
                    <label className="block text-sm font-medium mb-1">Main Image*</label>
                    {formData.image ? (
                      <div className="relative w-full aspect-video mb-2 bg-white border border-stone-200 rounded-md overflow-hidden flex items-center justify-center group">
                        <img src={formData.image} alt="Main" className="w-full h-full object-contain" />
                        <button type="button" onClick={() => setFormData({...formData, image: ''})} className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 shadow opacity-0 group-hover:opacity-100 transition-opacity">
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center justify-center w-full">
                        <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-stone-300 border-dashed rounded-lg cursor-pointer bg-white hover:bg-stone-100 transition-colors">
                          <div className="flex flex-col items-center justify-center pt-5 pb-6">
                            {uploadingMainImage ? (
                              <div className="w-6 h-6 border-2 border-amber-900 border-t-transparent rounded-full animate-spin mb-2"></div>
                            ) : (
                              <UploadCloud className="w-8 h-8 mb-2 text-stone-400" />
                            )}
                            <p className="text-sm text-stone-500 font-medium">Click to upload main image</p>
                          </div>
                          <input type="file" accept="image/*" className="hidden" onChange={handleMainImageUpload} disabled={uploadingMainImage} />
                        </label>
                      </div>
                    )}
                  </div>
                  
                  <div className="space-y-2 pt-2 border-t">
                    <label className="block text-sm font-medium">Additional Images</label>
                    <div className="grid grid-cols-3 gap-2">
                      {additionalImages.map((img, index) => (
                        <div key={index} className="relative w-full aspect-square bg-white border border-stone-200 rounded-md overflow-hidden flex items-center justify-center group">
                          <img src={img} alt={`Additional ${index}`} className="w-full h-full object-contain" />
                          <button type="button" onClick={() => removeImage(img)} className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-1 shadow scale-75 opacity-0 group-hover:opacity-100 transition-opacity">
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                      <label className="flex flex-col items-center justify-center w-full aspect-square border-2 border-stone-300 border-dashed rounded-lg cursor-pointer bg-white hover:bg-stone-100 transition-colors">
                        <div className="flex flex-col items-center justify-center">
                          {uploadingAdditional ? (
                            <div className="w-5 h-5 border-2 border-amber-900 border-t-transparent rounded-full animate-spin"></div>
                          ) : (
                            <Plus className="w-5 h-5 text-stone-400" />
                          )}
                        </div>
                        <input type="file" accept="image/*" className="hidden" onChange={handleAdditionalImageUpload} disabled={uploadingAdditional} />
                      </label>
                    </div>
                  </div>
                </div>

                {/* Settings */}
                <div className="bg-stone-50 p-4 rounded-lg border border-stone-200 space-y-4">
                  <h3 className="text-sm font-bold text-amber-900 uppercase tracking-wider mb-2">Visibility Status</h3>
                  <div>
                    <label className="block text-sm font-medium mb-1 mt-2">Status</label>
                    <select value={formData.status} onChange={e=>setFormData({...formData, status: e.target.value})} className="w-full px-3 py-2 border border-stone-200 rounded-md bg-white text-sm">
                      <option value="Active">Active</option>
                      <option value="Draft">Draft</option>
                    </select>
                  </div>
                </div>

              </div>
            </div>
            
            <div className="mt-8 pt-4 border-t border-stone-100 flex justify-end gap-3">
              <button type="button" onClick={() => setIsAdding(false)} className="px-6 py-2 border border-stone-200 bg-white rounded-md text-sm font-medium text-stone-700 hover:bg-stone-50 transition-colors">
                Cancel
              </button>
              <button type="submit" disabled={saving} className="bg-amber-900 text-white px-8 py-2 rounded-md text-sm font-medium hover:bg-amber-950 transition-colors disabled:opacity-50">
                {saving ? 'Saving...' : 'Save Product'}
              </button>
            </div>
          </form>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-stone-100 shadow-sm overflow-hidden">
          {/* Toolbar */}
          <div className="p-4 border-b border-stone-100 flex flex-col sm:flex-row justify-between gap-4">
            <div className="relative max-w-sm w-full">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
              <input
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search products..."
                className="w-full pl-9 pr-4 py-2 border border-stone-200 bg-stone-50 rounded-md focus:outline-none focus:border-amber-800 text-sm"
              />
            </div>
            <div className="flex items-center gap-2">
              <select
                value={categoryFilter}
                onChange={e => setCategoryFilter(e.target.value)}
                className="px-3 py-2 border border-stone-200 rounded-md text-sm bg-white focus:outline-none"
              >
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
              <button onClick={fetchProducts} className="p-2 border border-stone-200 rounded-md text-stone-600 hover:bg-stone-50 transition-colors" title="Refresh">
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-stone-50 text-stone-600 font-medium">
                <tr>
                  <th className="px-6 py-3">Product Name</th>
                  <th className="px-6 py-3">Category</th>
                  <th className="px-6 py-3">Price</th>
                  <th className="px-6 py-3">Stock</th>
                  <th className="px-6 py-3">Status</th>
                  <th className="px-6 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {filtered.length === 0 ? (
                  <tr><td colSpan={6} className="px-6 py-8 text-center text-stone-400">{search || categoryFilter !== 'All' ? 'No products match your filter.' : 'No products found. Add your first product.'}</td></tr>
                ) : filtered.map((product) => (
                  <tr key={product.id} className="hover:bg-stone-50/50 group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded bg-stone-100 flex-shrink-0">
                          {product.image && <img src={product.image} alt={product.name} className="w-full h-full object-cover rounded" />}
                        </div>
                        <div>
                          <div className="font-medium text-stone-900">{product.name}</div>
                          <div className="text-xs text-stone-400">{product.sku || product.id.split('-')[0]}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-stone-800">{product.category || 'N/A'}</td>
                    <td className="px-6 py-4 font-medium">₹{product.price}</td>
                    <td className="px-6 py-4 text-stone-800">{product.stock || 0}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-medium border ${
                        (product.stock || 0) > 10 ? 'bg-green-50 text-green-700 border-green-200' :
                        (product.stock || 0) > 0 ? 'bg-yellow-50 text-yellow-700 border-yellow-200' :
                        'bg-red-50 text-red-700 border-red-200'
                      }`}>{(product.stock || 0) > 10 ? 'Active' : (product.stock || 0) > 0 ? 'Low Stock' : 'Out of Stock'}</span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => handleEditProduct(product)} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded" title="Edit">
                          <Edit className="w-4 h-4" />
                        </button>
                        <button onClick={() => handleDeleteOne(product.id)} className="p-1.5 text-red-600 hover:bg-red-50 rounded" title="Delete">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
