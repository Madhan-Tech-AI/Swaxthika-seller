import { Plus, Search, Edit, Trash2, X, Upload, Download, UploadCloud, RefreshCw } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import { supabase } from '../../lib/supabase';
import { useToast } from '../../context/ToastContext';
import * as XLSX from 'xlsx';

const PAGE_SIZE = 20;

export function Products() {
  const [products, setProducts] = useState<any[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [sellers, setSellers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [editingProduct, setEditingProduct] = useState<any | null>(null);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [currentPage, setCurrentPage] = useState(1);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [inlineStockId, setInlineStockId] = useState<string | null>(null);
  const [inlineStockVal, setInlineStockVal] = useState('');
  const { showToast } = useToast();

  // Selection & Delete State
  const [selectedProductIds, setSelectedProductIds] = useState<string[]>([]);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

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
    status: 'Active',
    seller_id: ''
  });
  const [bulletPoints, setBulletPoints] = useState<string[]>(['']);
  const [additionalImages, setAdditionalImages] = useState<string[]>([]);
  const [uploadingMainImage, setUploadingMainImage] = useState(false);
  const [uploadingAdditional, setUploadingAdditional] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [bulkUploading, setBulkUploading] = useState(false);

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

  const fetchProducts = async (page = currentPage, searchVal = search, catFilter = categoryFilter) => {
    setLoading(true);
    try {
      let query = supabase
        .from('products')
        .select('*, seller_applications(business_name)', { count: 'exact' })
        .order('created_at', { ascending: false })
        .range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1);

      if (catFilter !== 'All') query = query.eq('category', catFilter);
      if (searchVal.trim()) {
        query = query.or(`name.ilike.%${searchVal}%,sku.ilike.%${searchVal}%`);
      }

      const { data, count, error } = await query;
      if (error) throw error;
      setProducts(data || []);
      setTotalCount(count || 0);

      const { data: sellersData } = await supabase.from('seller_applications').select('*').eq('status', 'approved');
      if (sellersData) setSellers(sellersData);
    } catch (error) {
      console.error('Error fetching admin products:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, [currentPage, search, categoryFilter]);

  useEffect(() => {
    const channel = supabase
      .channel('admin-products-rt')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'products' }, () => {
        fetchProducts();
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [currentPage, search, categoryFilter]);

  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));
  const CATEGORIES = ['All', 'Brass Idols', 'Spiritual Books', 'Pooja Items', 'Temple Jewellery', 'Homam Samagri'];

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
      seller_id: product.seller_id || '',
    });
    setBulletPoints(product.bullet_points?.length ? product.bullet_points : ['']);
    setAdditionalImages(product.additional_images || []);
    setIsAdding(true);
  };

  const handleDeleteOne = async (id: string) => {
    if (!confirm('Delete this product? This cannot be undone.')) return;
    setDeletingId(id);
    try {
      const { error } = await supabase.from('products').delete().eq('id', id);
      if (error) throw error;
      showToast('success', 'Deleted', 'Product removed.');
      fetchProducts();
    } catch {
      showToast('error', 'Failed', 'Could not delete product.');
    } finally { setDeletingId(null); }
  };

  const handleSaveInlineStock = async (id: string) => {
    const newStock = parseInt(inlineStockVal);
    if (isNaN(newStock) || newStock < 0) { setInlineStockId(null); return; }
    await supabase.from('products').update({ stock: newStock }).eq('id', id);
    setProducts(prev => prev.map(p => p.id === id ? { ...p, stock: newStock } : p));
    setInlineStockId(null);
    showToast('success', 'Stock Updated', `Stock set to ${newStock}.`);
  };

  // Bulk upload results state
  const [bulkResults, setBulkResults] = useState<{ success: number; failed: number; errors: string[] } | null>(null);

  const handleDownloadTemplate = () => {
    const templateData = [
      {
        name: 'Example Product',
        brand: 'Example Brand',
        sku: 'SKU12345',
        category: 'Brass Idols',
        price: 999.99,
        original_price: 1299.99,
        stock: 50,
        description: 'Detailed product description here...',
        image: 'https://example.com/image.jpg',
        bullet_points: 'Feature 1|Feature 2|Feature 3',
        is_featured: false,
        is_deal: false,
        status: 'Active'
      }
    ];

    const ws = XLSX.utils.json_to_sheet(templateData);

    // Set column widths for readability
    ws['!cols'] = [
      { wch: 30 }, { wch: 18 }, { wch: 14 }, { wch: 18 },
      { wch: 10 }, { wch: 14 }, { wch: 8 }, { wch: 40 },
      { wch: 50 }, { wch: 40 }, { wch: 12 }, { wch: 10 }, { wch: 10 }
    ];

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Products_Template");

    // Add instructions sheet
    const instructions = [
      { Instructions: 'BULK UPLOAD TEMPLATE GUIDE' },
      { Instructions: '' },
      { Instructions: 'REQUIRED COLUMNS: name, price, stock, category' },
      { Instructions: '' },
      { Instructions: 'COLUMN DETAILS:' },
      { Instructions: 'name - Product title (required)' },
      { Instructions: 'brand - Brand name (optional)' },
      { Instructions: 'sku - Unique SKU code (optional)' },
      { Instructions: 'category - Must be: Brass Idols, Spiritual Books, Pooja Items, Temple Jewellery, or Homam Samagri' },
      { Instructions: 'price - Selling price in INR (required, number)' },
      { Instructions: 'original_price - MRP/Original price in INR (optional, number)' },
      { Instructions: 'stock - Available quantity (required, number)' },
      { Instructions: 'description - Full product description (optional)' },
      { Instructions: 'image - Product image URL (paste a public image URL)' },
      { Instructions: 'bullet_points - Key features separated by | (pipe). Example: Feature 1|Feature 2|Feature 3' },
      { Instructions: 'is_featured - true or false (optional, default: false)' },
      { Instructions: 'is_deal - true or false (optional, default: false)' },
      { Instructions: 'status - Active, Draft, or Out of Stock (optional, default: Active)' },
    ];
    const wsInstructions = XLSX.utils.json_to_sheet(instructions);
    wsInstructions['!cols'] = [{ wch: 80 }];
    XLSX.utils.book_append_sheet(wb, wsInstructions, "Instructions");

    XLSX.writeFile(wb, "products_bulk_upload_template.xlsx");
  };

  const handleBulkUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setBulkUploading(true);
    setBulkResults(null);

    const VALID_CATEGORIES = ['Brass Idols', 'Spiritual Books', 'Pooja Items', 'Temple Jewellery', 'Homam Samagri'];
    const errors: string[] = [];
    let successCount = 0;
    let failedCount = 0;

    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data);
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      const rows = XLSX.utils.sheet_to_json(worksheet) as any[];

      if (rows.length === 0) {
        showToast('error', 'Empty File', 'The uploaded file contains no product data.');
        setBulkUploading(false);
        return;
      }

      // Validate and transform each row
      const validProducts: any[] = [];

      rows.forEach((row, index) => {
        const rowNum = index + 2; // +2 for header row and 0-index
        const rowErrors: string[] = [];

        // Required field validation
        if (!row.name || String(row.name).trim() === '') rowErrors.push('missing name');
        if (row.price === undefined || row.price === null || row.price === '' || isNaN(Number(row.price))) rowErrors.push('invalid price');
        if (row.stock === undefined || row.stock === null || row.stock === '' || isNaN(Number(row.stock))) rowErrors.push('invalid stock');

        // Category validation (warning, not blocking)
        const category = row.category ? String(row.category).trim() : '';
        if (category && !VALID_CATEGORIES.includes(category)) {
          rowErrors.push(`unknown category "${category}"`);
        }

        if (rowErrors.length > 0) {
          errors.push(`Row ${rowNum} (${row.name || 'unnamed'}): ${rowErrors.join(', ')}`);
          failedCount++;
          return;
        }

        // Transform valid row
        validProducts.push({
          name: String(row.name).trim(),
          brand: row.brand ? String(row.brand).trim() : null,
          sku: row.sku ? String(row.sku).trim() : null,
          category: category || null,
          price: Number(row.price),
          original_price: row.original_price && !isNaN(Number(row.original_price)) ? Number(row.original_price) : null,
          stock: Math.max(0, Math.floor(Number(row.stock))),
          description: row.description ? String(row.description).trim() : '',
          image: row.image ? String(row.image).trim() : null,
          bullet_points: row.bullet_points ? String(row.bullet_points).split('|').map((b: string) => b.trim()).filter((b: string) => b) : [],
          is_featured: row.is_featured === true || String(row.is_featured).toLowerCase() === 'true',
          is_deal: row.is_deal === true || String(row.is_deal).toLowerCase() === 'true',
          status: ['Active', 'Draft', 'Out of Stock'].includes(row.status) ? row.status : 'Active'
        });
      });

      // Insert in batches of 25 to avoid payload limits
      const BATCH_SIZE = 25;
      for (let i = 0; i < validProducts.length; i += BATCH_SIZE) {
        const batch = validProducts.slice(i, i + BATCH_SIZE);
        const { error } = await supabase.from('products').insert(batch);

        if (error) {
          errors.push(`Batch ${Math.floor(i / BATCH_SIZE) + 1} failed: ${error.message}`);
          failedCount += batch.length;
        } else {
          successCount += batch.length;
        }
      }

      // Show results
      setBulkResults({ success: successCount, failed: failedCount, errors });

      if (successCount > 0) {
        showToast('success', 'Bulk Upload Complete', `${successCount} products added successfully.`);
        fetchProducts();
      }
      if (failedCount > 0) {
        showToast('error', 'Some Rows Failed', `${failedCount} rows had errors. Check the summary.`);
      }
    } catch (error: any) {
      console.error("Bulk upload error:", error);
      showToast('error', 'Bulk Upload Failed', error?.message || 'Please check your file format and try again.');
    } finally {
      setBulkUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
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
        seller_id: formData.seller_id || null
      };

      if (editingProduct) {
        const { error } = await supabase.from('products').update(productData).eq('id', editingProduct.id);
        if (error) throw error;
        showToast('success', 'Product Updated', `${formData.name} has been updated.`);
      } else {
        const { error } = await supabase.from('products').insert([productData]);
        if (error) throw error;
        showToast('success', 'Product Added', `${formData.name} has been added.`);
      }

      setIsAdding(false);
      setEditingProduct(null);
      setFormData({ name: '', brand: '', sku: '', category: '', price: '', original_price: '', stock: '', image: '', description: '', is_featured: false, is_deal: false, status: 'Active', seller_id: '' });
      setBulletPoints(['']);
      setAdditionalImages([]);
      fetchProducts();
    } catch (error) {
      showToast('error', 'Save Failed', 'Failed to save product.');
    } finally { setSaving(false); }
  };

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedProductIds(products.map(p => p.id));
    } else {
      setSelectedProductIds([]);
    }
  };

  const handleSelectOne = (id: string) => {
    if (selectedProductIds.includes(id)) {
      setSelectedProductIds(selectedProductIds.filter(selectedId => selectedId !== id));
    } else {
      setSelectedProductIds([...selectedProductIds, id]);
    }
  };

  const handleDeleteSelected = async () => {
    setDeleting(true);
    try {
      const { error } = await supabase
        .from('products')
        .delete()
        .in('id', selectedProductIds);

      if (error) throw error;

      showToast('success', 'Products Deleted', `${selectedProductIds.length} products have been removed.`);
      setSelectedProductIds([]);
      setIsDeleteModalOpen(false);
      fetchProducts();
    } catch (error) {
      console.error('Error deleting products:', error);
      showToast('error', 'Delete Failed', 'Could not delete the selected products.');
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return <div className="p-8 flex items-center justify-center"><div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div></div>;
  }

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-display font-bold text-foreground">Products</h1>
          <p className="text-foreground/60 text-sm mt-1">Manage your product catalog</p>
        </div>
        {!isAdding && (
          <div className="flex items-center gap-3">
            <button 
              onClick={handleDownloadTemplate}
              className="bg-white text-gray-700 px-4 py-2 border border-gray-300 rounded-md text-sm font-medium hover:bg-gray-50 transition-colors flex items-center gap-2 shadow-sm"
            >
              <Download className="w-4 h-4" /> Template
            </button>
            <input 
              type="file" 
              accept=".xlsx, .xls, .csv" 
              className="hidden" 
              ref={fileInputRef}
              onChange={handleBulkUpload}
            />
            <button 
              onClick={() => fileInputRef.current?.click()}
              disabled={bulkUploading}
              className="bg-white text-primary border border-primary px-4 py-2 rounded-md text-sm font-medium hover:bg-primary-50 transition-colors flex items-center gap-2 shadow-sm disabled:opacity-50"
            >
              {bulkUploading ? <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin"></div> : <Upload className="w-4 h-4" />}
              Bulk Upload
            </button>
            <button 
              onClick={() => setIsAdding(true)}
              className="bg-primary text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-primary-600 transition-colors flex items-center gap-2 shadow-sm"
            >
              <Plus className="w-4 h-4" /> Add Product
            </button>
          </div>
        )}
      </div>

      {isAdding ? (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden animate-in fade-in slide-in-from-bottom-4">
          <div className="p-4 border-b border-gray-200 flex items-center justify-between bg-gray-50">
            <h2 className="font-bold text-foreground text-lg">{editingProduct ? 'Edit Product' : 'Add New Product'}</h2>
            <button onClick={() => { setIsAdding(false); setEditingProduct(null); }} className="p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-200 transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>
          
          <form onSubmit={handleSaveProduct} className="p-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Left Column: Core Info */}
              <div className="lg:col-span-2 space-y-6">
                
                {/* Basic Info */}
                <div className="space-y-4">
                  <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider border-b pb-2">Basic Info</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium mb-1">Product Title*</label>
                      <input required value={formData.name} onChange={e=>setFormData({...formData, name: e.target.value})} type="text" className="w-full px-3 py-2 border rounded-md focus:ring-primary focus:border-primary" placeholder="e.g. Premium Brass Ganesha Idol" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Brand</label>
                      <input value={formData.brand} onChange={e=>setFormData({...formData, brand: e.target.value})} type="text" className="w-full px-3 py-2 border rounded-md" placeholder="e.g. Sacred Arts" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Category*</label>
                      <select required value={formData.category} onChange={e=>setFormData({...formData, category: e.target.value})} className="w-full px-3 py-2 border rounded-md bg-white">
                        <option value="">Select Category</option>
                        <option value="Brass Idols">Brass Idols</option>
                        <option value="Spiritual Books">Spiritual Books</option>
                        <option value="Pooja Items">Pooja Items</option>
                        <option value="Temple Jewellery">Temple Jewellery</option>
                        <option value="Homam Samagri">Homam Samagri</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Assigned Seller</label>
                      <select value={formData.seller_id} onChange={e=>setFormData({...formData, seller_id: e.target.value})} className="w-full px-3 py-2 border rounded-md bg-white text-sm">
                        <option value="">Admin / Platform Owner</option>
                        {sellers.map((s: any) => (
                          <option key={s.id} value={s.id}>{s.business_name} ({s.owner_name})</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                {/* About this item */}
                <div className="space-y-4 pt-4">
                  <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider border-b pb-2">About this item</h3>
                  <p className="text-xs text-gray-500">Add bullet points detailing key features (Amazon style)</p>
                  {bulletPoints.map((bullet, index) => (
                    <div key={index} className="flex gap-2">
                      <input 
                        value={bullet} 
                        onChange={(e) => handleBulletChange(index, e.target.value)}
                        type="text" 
                        className="flex-1 px-3 py-2 border rounded-md text-sm"
                        placeholder="Feature or specification..."
                      />
                      <button type="button" onClick={() => removeBullet(index)} className="p-2 text-red-500 hover:bg-red-50 rounded border border-transparent">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                  <button type="button" onClick={addBullet} className="text-sm text-primary font-medium flex items-center gap-1 hover:underline">
                    <Plus className="w-4 h-4" /> Add Bullet Point
                  </button>
                </div>

                {/* Detailed Description */}
                <div className="space-y-4 pt-4">
                  <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider border-b pb-2">Detailed Description</h3>
                  <textarea 
                    value={formData.description} 
                    onChange={e=>setFormData({...formData, description: e.target.value})}
                    rows={4} 
                    className="w-full px-3 py-2 border rounded-md text-sm" 
                    placeholder="Full product description..."
                  />
                </div>

              </div>

              {/* Right Column: Pricing, Media, Settings */}
              <div className="space-y-6">
                
                {/* Pricing & Inventory */}
                <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 space-y-4">
                  <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-2">Pricing & Inventory</h3>
                  <div>
                    <label className="block text-sm font-medium mb-1">Selling Price (₹)*</label>
                    <input required value={formData.price} onChange={e=>setFormData({...formData, price: e.target.value})} type="number" min="0" step="0.01" className="w-full px-3 py-2 border rounded-md" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">MRP / Original Price (₹)</label>
                    <input value={formData.original_price} onChange={e=>setFormData({...formData, original_price: e.target.value})} type="number" min="0" step="0.01" className="w-full px-3 py-2 border rounded-md text-gray-500" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-1">Stock*</label>
                      <input required value={formData.stock} onChange={e=>setFormData({...formData, stock: e.target.value})} type="number" min="0" className="w-full px-3 py-2 border rounded-md" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">SKU</label>
                      <input value={formData.sku} onChange={e=>setFormData({...formData, sku: e.target.value})} type="text" className="w-full px-3 py-2 border rounded-md" />
                    </div>
                  </div>
                </div>

                {/* Media */}
                <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 space-y-4">
                  <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-2 flex items-center gap-2"><Upload className="w-4 h-4"/> Media Upload</h3>
                  <div>
                    <label className="block text-sm font-medium mb-1">Main Image*</label>
                    {formData.image ? (
                      <div className="relative w-full aspect-video sm:aspect-square md:aspect-video mb-2 bg-white border rounded-md overflow-hidden flex items-center justify-center group">
                        <img src={formData.image} alt="Main" className="w-full h-full object-contain" />
                        <button type="button" onClick={() => setFormData({...formData, image: ''})} className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 shadow opacity-0 group-hover:opacity-100 transition-opacity">
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center justify-center w-full">
                        <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-white hover:bg-gray-50 transition-colors">
                          <div className="flex flex-col items-center justify-center pt-5 pb-6">
                            {uploadingMainImage ? (
                              <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin mb-2"></div>
                            ) : (
                              <UploadCloud className="w-8 h-8 mb-2 text-gray-400" />
                            )}
                            <p className="text-sm text-gray-500 font-medium">Click to upload main image</p>
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
                        <div key={index} className="relative w-full aspect-square bg-white border rounded-md overflow-hidden flex items-center justify-center group">
                          <img src={img} alt={`Additional ${index}`} className="w-full h-full object-contain" />
                          <button type="button" onClick={() => removeImage(img)} className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-1 shadow scale-75 opacity-0 group-hover:opacity-100 transition-opacity">
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                      <label className="flex flex-col items-center justify-center w-full aspect-square border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-white hover:bg-gray-50 transition-colors">
                        <div className="flex flex-col items-center justify-center">
                          {uploadingAdditional ? (
                            <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                          ) : (
                            <Plus className="w-5 h-5 text-gray-400" />
                          )}
                        </div>
                        <input type="file" accept="image/*" className="hidden" onChange={handleAdditionalImageUpload} disabled={uploadingAdditional} />
                      </label>
                    </div>
                  </div>
                </div>

                {/* Settings */}
                <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 space-y-4">
                  <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-2">Visibility Status</h3>
                  <div className="flex items-center gap-2">
                    <input type="checkbox" id="is_featured" checked={formData.is_featured} onChange={e=>setFormData({...formData, is_featured: e.target.checked})} className="rounded text-primary focus:ring-primary w-4 h-4" />
                    <label htmlFor="is_featured" className="text-sm">Featured Product</label>
                  </div>
                  <div className="flex items-center gap-2">
                    <input type="checkbox" id="is_deal" checked={formData.is_deal} onChange={e=>setFormData({...formData, is_deal: e.target.checked})} className="rounded text-primary focus:ring-primary w-4 h-4" />
                    <label htmlFor="is_deal" className="text-sm">Daily Deal</label>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1 mt-2">Status</label>
                    <select value={formData.status} onChange={e=>setFormData({...formData, status: e.target.value})} className="w-full px-3 py-2 border rounded-md bg-white text-sm">
                      <option value="Active">Active</option>
                      <option value="Draft">Draft</option>
                      <option value="Out of Stock">Out of Stock</option>
                    </select>
                  </div>
                </div>

              </div>
            </div>
            
            <div className="mt-8 pt-4 border-t border-gray-200 flex justify-end gap-3">
              <button type="button" onClick={() => setIsAdding(false)} className="px-6 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">
                Cancel
              </button>
              <button type="submit" disabled={saving} className="bg-primary text-white px-8 py-2 rounded-md text-sm font-medium hover:bg-primary-600 transition-colors disabled:opacity-50">
                {saving ? 'Saving...' : 'Save Product'}
              </button>
            </div>
          </form>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        {/* Toolbar */}
        <div className="p-4 border-b border-gray-200 flex flex-col sm:flex-row justify-between gap-4">
          <div className="relative max-w-sm w-full">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={e => { setSearch(e.target.value); setCurrentPage(1); }}
              placeholder="Search products..."
              className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:border-primary text-sm"
            />
          </div>
          <div className="flex items-center gap-2">
            <select
              value={categoryFilter}
              onChange={e => { setCategoryFilter(e.target.value); setCurrentPage(1); }}
              className="px-3 py-2 border border-gray-300 rounded-md text-sm bg-white focus:outline-none focus:border-primary"
            >
              {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
            {selectedProductIds.length > 0 && (
              <button
                onClick={() => setIsDeleteModalOpen(true)}
                className="flex items-center gap-2 px-3 py-2 bg-red-50 text-red-600 border border-red-200 rounded-md text-sm font-medium hover:bg-red-100 transition-colors"
              >
                <Trash2 className="w-4 h-4" /> Delete ({selectedProductIds.length})
              </button>
            )}
            <button onClick={() => fetchProducts()} className="p-2 border border-gray-300 rounded-md text-foreground/70 hover:bg-gray-50" title="Refresh">
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 text-foreground/60 font-medium">
              <tr>
                <th className="px-6 py-3 w-10">
                  <input 
                    type="checkbox" 
                    className="rounded border-gray-300 text-primary focus:ring-primary" 
                    checked={products.length > 0 && selectedProductIds.length === products.length}
                    onChange={handleSelectAll}
                  />
                </th>
                <th className="px-6 py-3">Product Name</th>
                <th className="px-6 py-3">Category</th>
                <th className="px-6 py-3">Price</th>
                <th className="px-6 py-3">Stock</th>
                <th className="px-6 py-3">Status</th>
                <th className="px-6 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {products.length === 0 ? (
                <tr><td colSpan={7} className="px-6 py-8 text-center text-foreground/50">{search || categoryFilter !== 'All' ? 'No products match your filter.' : 'No products found. Add your first product.'}</td></tr>
              ) : products.map((product) => (
                <tr key={product.id} className="hover:bg-gray-50/50 group">
                  <td className="px-6 py-4">
                    <input type="checkbox" className="rounded border-gray-300 text-primary focus:ring-primary" checked={selectedProductIds.includes(product.id)} onChange={() => handleSelectOne(product.id)} />
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded bg-gray-100 flex-shrink-0">
                        {product.image && <img src={product.image} alt={product.name} className="w-full h-full object-cover rounded" />}
                      </div>
                      <div>
                        <div className="font-medium text-foreground">{product.name}</div>
                        <div className="text-xs text-foreground/50">{product.sku || product.id.split('-')[0]}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-foreground/80">{product.category || 'N/A'}</td>
                  <td className="px-6 py-4 font-medium">₹{product.price}</td>
                  <td className="px-6 py-4">
                    {inlineStockId === product.id ? (
                      <input
                        type="number" min="0"
                        value={inlineStockVal}
                        onChange={e => setInlineStockVal(e.target.value)}
                        onBlur={() => handleSaveInlineStock(product.id)}
                        onKeyDown={e => { if (e.key === 'Enter') handleSaveInlineStock(product.id); if (e.key === 'Escape') setInlineStockId(null); }}
                        autoFocus
                        className="w-20 px-2 py-1 border border-primary rounded text-sm focus:outline-none"
                      />
                    ) : (
                      <span
                        className={`font-medium cursor-pointer hover:text-primary transition-colors ${(product.stock || 0) < 10 ? 'text-red-600' : 'text-foreground'}`}
                        onClick={() => { setInlineStockId(product.id); setInlineStockVal(String(product.stock || 0)); }}
                        title="Click to edit stock"
                      >
                        {product.stock || 0}
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-medium border ${
                      (product.stock || 0) > 10 ? 'bg-green-50 text-green-700 border-green-200' :
                      (product.stock || 0) > 0 ? 'bg-yellow-50 text-yellow-700 border-yellow-200' :
                      'bg-red-50 text-red-700 border-red-200'
                    }`}>{(product.stock || 0) > 10 ? 'Active' : (product.stock || 0) > 0 ? 'Low Stock' : 'Out of Stock'}</span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => handleEditProduct(product)} className="p-1 text-blue-600 hover:bg-blue-50 rounded" title="Edit">
                        <Edit className="w-4 h-4" />
                      </button>
                      <button onClick={() => handleDeleteOne(product.id)} disabled={deletingId === product.id} className="p-1 text-red-600 hover:bg-red-50 rounded disabled:opacity-50" title="Delete">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="p-4 border-t border-gray-200 flex items-center justify-between text-sm text-foreground/70">
          <div>Showing {totalCount === 0 ? 0 : (currentPage - 1) * PAGE_SIZE + 1}–{Math.min(currentPage * PAGE_SIZE, totalCount)} of {totalCount} products</div>
          <div className="flex gap-1">
            <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} className="px-3 py-1 border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-40">Previous</button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).filter(p => p === 1 || p === totalPages || Math.abs(p - currentPage) <= 1).map((p, i, arr) => (
              <span key={p}>
                {i > 0 && arr[i - 1] !== p - 1 && <span className="px-2 text-gray-400">…</span>}
                <button onClick={() => setCurrentPage(p)} className={`px-3 py-1 border rounded ${currentPage === p ? 'bg-primary text-white border-primary' : 'border-gray-300 hover:bg-gray-50'}`}>{p}</button>
              </span>
            ))}
            <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} className="px-3 py-1 border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-40">Next</button>
          </div>
        </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {isDeleteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 animate-in fade-in">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full overflow-hidden">
            <div className="p-6">
              <div className="flex items-center justify-center w-12 h-12 rounded-full bg-red-100 mb-4 mx-auto">
                <Trash2 className="w-6 h-6 text-red-600" />
              </div>
              <h3 className="text-xl font-bold text-center text-gray-900 mb-2">Delete Products?</h3>
              <p className="text-center text-gray-500 text-sm mb-6">
                Are you sure you want to delete {selectedProductIds.length} selected product(s)? <br />
                <span className="font-semibold text-red-600 mt-1 block">If you delete once, the data cannot be retrieved.</span>
              </p>
              <div className="flex gap-3">
                <button 
                  onClick={() => setIsDeleteModalOpen(false)}
                  disabled={deleting}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 font-medium"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleDeleteSelected}
                  disabled={deleting}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center justify-center font-medium"
                >
                  {deleting ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    'Yes, Delete'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Upload Results Modal */}
      {bulkResults && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 animate-in fade-in">
          <div className="bg-white rounded-xl shadow-xl max-w-lg w-full overflow-hidden">
            <div className="p-6">
              <div className="flex items-center justify-center w-12 h-12 rounded-full bg-green-100 mb-4 mx-auto">
                <UploadCloud className="w-6 h-6 text-green-600" />
              </div>
              <h3 className="text-xl font-bold text-center text-gray-900 mb-2">Bulk Upload Summary</h3>
              <div className="flex justify-center gap-8 mb-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">{bulkResults.success}</div>
                  <div className="text-xs text-gray-500">Successful</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-red-600">{bulkResults.failed}</div>
                  <div className="text-xs text-gray-500">Failed</div>
                </div>
              </div>
              {bulkResults.errors.length > 0 && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3 max-h-48 overflow-y-auto">
                  <p className="text-xs font-bold text-red-700 mb-2">Errors:</p>
                  {bulkResults.errors.map((err, i) => (
                    <p key={i} className="text-xs text-red-600 mb-1">• {err}</p>
                  ))}
                </div>
              )}
              <button
                onClick={() => setBulkResults(null)}
                className="w-full mt-4 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-600 transition-colors font-medium"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
