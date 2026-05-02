import { useState, useEffect, useRef } from 'react';
import { supabase } from '../../lib/supabase';
import { Plus, GripVertical, Trash2, Image as ImageIcon, Upload, X, Check, ExternalLink } from 'lucide-react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import type { DragEndEvent } from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useToast } from '../../context/ToastContext';

interface CarouselItem {
  id: string;
  title: string;
  subtitle: string;
  badge: string;
  image_url: string;
  link_url: string;
  order_index: number;
}

// Sortable Item Component
function SortableSlide({ item, onDelete }: { item: CarouselItem; onDelete: (id: string) => void }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 10 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`bg-white rounded-2xl border border-gray-200 p-5 flex items-center gap-6 ${isDragging ? 'shadow-2xl border-primary ring-2 ring-primary/20 bg-gray-50' : 'shadow-sm hover:shadow-md transition-shadow'}`}
    >
      <div {...attributes} {...listeners} className="cursor-grab text-gray-400 hover:text-primary p-2 active:cursor-grabbing">
        <GripVertical className="w-6 h-6" />
      </div>
      
      <div className="w-32 h-20 bg-gray-100 rounded-xl overflow-hidden flex-shrink-0 relative border border-gray-100">
        {item.image_url ? (
          <img src={item.image_url} alt="slide" className="w-full h-full object-cover" />
        ) : (
          <ImageIcon className="w-8 h-8 text-gray-300 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
        )}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          {item.badge && (
            <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary text-[10px] font-bold uppercase tracking-wider">
              {item.badge}
            </span>
          )}
        </div>
        <div className="flex items-center gap-1 mt-2 text-xs text-primary font-medium">
          <ExternalLink className="w-3 h-3" />
          {item.link_url}
        </div>
      </div>

      <div className="flex items-center gap-2">
        <button 
          onClick={() => onDelete(item.id)}
          className="p-3 text-red-500 hover:bg-red-50 rounded-xl transition-colors group"
          title="Delete Slide"
        >
          <Trash2 className="w-5 h-5 group-hover:scale-110 transition-transform" />
        </button>
      </div>
    </div>
  );
}

export function CarouselManager() {
  const [items, setItems] = useState<CarouselItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // New Slide Form State
  const [newBadge, setNewBadge] = useState('');
  const [newImageFile, setNewImageFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const [newLink, setNewLink] = useState('');
  const { showToast } = useToast();

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  useEffect(() => {
    fetchItems();
  }, []);

  const fetchItems = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('carousel_items')
      .select('*')
      .order('order_index', { ascending: true });
    
    if (error) {
      console.error('Error fetching carousel items:', error);
    } else if (data) {
      setItems(data);
    }
    setLoading(false);
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setNewImageFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      setItems((items) => {
        const oldIndex = items.findIndex((i) => i.id === active.id);
        const newIndex = items.findIndex((i) => i.id === over.id);
        
        return arrayMove(items, oldIndex, newIndex);
      });
    }
  };

  const saveOrder = async () => {
    setSaving(true);
    try {
      const updates = items.map((item, index) => ({
        id: item.id,
        order_index: index,
      }));
      
      const { error } = await supabase
        .from('carousel_items')
        .upsert(updates);
        
      if (error) throw error;
      showToast('success', 'Order Saved', 'Carousel arrangement has been updated successfully.');
    } catch (error) {
      console.error('Error saving order:', error);
      showToast('error', 'Update Failed', 'Failed to save the new slide order.');
    } finally {
      setSaving(false);
    }
  };

  const uploadImage = async (file: File) => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${Math.random()}.${fileExt}`;
    const filePath = `${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('carousel-images')
      .upload(filePath, file);

    if (uploadError) {
      throw uploadError;
    }

    const { data } = supabase.storage
      .from('carousel-images')
      .getPublicUrl(filePath);

    return data.publicUrl;
  };

  const handleAddSlide = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newImageFile) {
      alert('Please upload an image for the slide.');
      return;
    }

    setSaving(true);
    try {
      // 1. Upload Image
      const publicUrl = await uploadImage(newImageFile);

      // 2. Insert into DB
      const { error } = await supabase
        .from('carousel_items')
        .insert({
          title: '',
          subtitle: '',
          badge: newBadge,
          image_url: publicUrl,
          link_url: newLink,
          order_index: items.length,
        });

      if (error) throw error;
      
      showToast('success', 'Slide Published', 'The new hero slide has been added to the homepage.');
      
      // Reset form & refresh
      setIsAdding(false);
      resetForm();
      fetchItems();
    } catch (error) {
      console.error('Error adding slide:', error);
      showToast('error', 'Creation Failed', 'Could not add the slide. Please check your connection and storage bucket.');
    } finally {
      setSaving(false);
    }
  };

  const resetForm = () => {
    setNewBadge('');
    setNewImageFile(null);
    setPreviewUrl('');
    setNewLink('');
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this slide?')) return;
    try {
      const { error } = await supabase.from('carousel_items').delete().eq('id', id);
      if (error) throw error;
      setItems(items.filter(i => i.id !== id));
      showToast('success', 'Slide Deleted', 'The slide was removed successfully.');
    } catch (error) {
      console.error('Error deleting slide:', error);
      showToast('error', 'Delete Failed', 'Failed to remove the slide from the database.');
    }
  };

  if (loading) {
    return <div className="p-8 flex items-center justify-center min-h-[400px]"><div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div></div>;
  }

  return (
    <div className="max-w-6xl mx-auto pb-20">
      {/* Header Section */}
      <div className="mb-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-display font-bold text-foreground">Hero Carousel Manager</h1>
          <p className="text-foreground/60 mt-2 text-lg">Design and arrange the premium hero slides for your homepage.</p>
        </div>
        <div className="flex items-center gap-4">
          <button 
            onClick={saveOrder}
            disabled={saving || items.length === 0}
            className="flex items-center gap-2 bg-white border-2 border-gray-200 text-foreground px-6 py-3 rounded-2xl text-sm font-bold hover:bg-gray-50 transition-all disabled:opacity-50 shadow-sm"
          >
            <Check className="w-4 h-4" />
            {saving ? 'Saving...' : 'Save Order'}
          </button>
          <button 
            onClick={() => {
              setIsAdding(!isAdding);
              if (isAdding) resetForm();
            }}
            className="bg-primary text-white px-6 py-3 rounded-2xl text-sm font-bold hover:bg-primary-600 transition-all flex items-center gap-2 shadow-lg shadow-primary/20 active:scale-95"
          >
            {isAdding ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
            {isAdding ? 'Cancel' : 'Add New Slide'}
          </button>
        </div>
      </div>

      {/* Add Form Section */}
      {isAdding && (
        <div className="bg-white rounded-3xl border border-gray-200 shadow-2xl p-10 mb-12 animate-in fade-in slide-in-from-top-6 duration-500">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
              <Plus className="w-6 h-6" />
            </div>
            <h2 className="text-2xl font-bold text-foreground">Configure New Hero Slide</h2>
          </div>

          <form onSubmit={handleAddSlide} className="space-y-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
              {/* Image Upload Area */}
              <div className="space-y-4">
                <label className="block text-sm font-bold text-foreground uppercase tracking-wider">Slide Image</label>
                <div 
                  onClick={() => fileInputRef.current?.click()}
                  className={`relative group cursor-pointer border-3 border-dashed rounded-3xl transition-all h-[300px] flex flex-col items-center justify-center overflow-hidden ${previewUrl ? 'border-primary bg-primary/5' : 'border-gray-200 hover:border-primary hover:bg-primary/5'}`}
                >
                  {previewUrl ? (
                    <>
                      <img src={previewUrl} alt="Preview" className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <Upload className="w-12 h-12 text-white" />
                      </div>
                    </>
                  ) : (
                    <div className="text-center p-6">
                      <div className="w-20 h-20 bg-gray-100 rounded-3xl flex items-center justify-center mx-auto mb-4 group-hover:bg-primary/20 group-hover:scale-110 transition-all">
                        <Upload className="w-10 h-10 text-gray-400 group-hover:text-primary" />
                      </div>
                      <p className="font-bold text-foreground">Click to upload image</p>
                      <p className="text-sm text-foreground/50 mt-1">Recommended: 1920x800px (JPG/PNG)</p>
                    </div>
                  )}
                </div>
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  onChange={handleImageChange} 
                  className="hidden" 
                  accept="image/*"
                />
              </div>

              {/* Action Link & Category Area */}
              <div className="space-y-6">
                <div className="grid grid-cols-1 gap-6">
                  <div>
                    <label className="block text-sm font-bold text-foreground uppercase tracking-wider mb-2">Deal Category</label>
                    <select 
                      value={newBadge} 
                      onChange={e=>setNewBadge(e.target.value)}
                      className="w-full px-5 py-4 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all appearance-none cursor-pointer"
                    >
                      <option value="">No Badge</option>
                      <option value="Hot Deals">Hot Deals 🔥</option>
                      <option value="Top Deals">Top Deals ⭐</option>
                      <option value="Today's Deals">Today's Deals ⏳</option>
                      <option value="Limited Offer">Limited Offer ⚡</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-foreground uppercase tracking-wider mb-2">Action Link (CTA)</label>
                    <select 
                      value={newLink} 
                      onChange={e=>setNewLink(e.target.value)}
                      className="w-full px-5 py-4 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all appearance-none cursor-pointer"
                    >
                      <option value="">Select Target Page</option>
                      <option value="/today-deals">Today's Deals Page</option>
                      <option value="/category/bestsellers">Bestsellers Page</option>
                      <option value="/category/all">Shop All Products</option>
                      <option value="/category/books">Spiritual Books</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-4 pt-6 border-t border-gray-100">
              <button 
                type="button" 
                onClick={() => {
                  setIsAdding(false);
                  resetForm();
                }} 
                className="px-8 py-4 text-sm font-bold text-gray-500 hover:text-gray-700 transition-colors"
              >
                Discard Changes
              </button>
              <button 
                type="submit" 
                disabled={saving} 
                className="px-10 py-4 bg-primary text-white rounded-2xl font-bold text-lg hover:bg-primary-600 shadow-xl shadow-primary/30 transition-all active:scale-95 disabled:opacity-50"
              >
                {saving ? 'Uploading & Saving...' : 'Publish Hero Slide'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Reorder Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between px-2">
          <h3 className="font-bold text-foreground/60 uppercase tracking-widest text-sm">Arrangement & Order</h3>
          <p className="text-xs text-foreground/40 italic">Drag handles to reorder slides</p>
        </div>
        
        {items.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-3xl border-3 border-dashed border-gray-100">
            <ImageIcon className="w-16 h-16 text-gray-100 mx-auto mb-6" />
            <h3 className="text-xl font-bold text-foreground/40">Your Hero Section is Empty</h3>
            <p className="text-foreground/30 mt-2 mb-8">Add your first high-converting slide to get started.</p>
            <button 
              onClick={() => setIsAdding(true)} 
              className="px-8 py-3 bg-primary/10 text-primary font-bold rounded-2xl hover:bg-primary/20 transition-all"
            >
              + Create Slide
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext
                items={items.map(i => i.id)}
                strategy={verticalListSortingStrategy}
              >
                {items.map((item) => (
                  <SortableSlide key={item.id} item={item} onDelete={handleDelete} />
                ))}
              </SortableContext>
            </DndContext>
          </div>
        )}
      </div>
    </div>
  );
}
