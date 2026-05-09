import { Search, Filter, Mail, Phone, ShoppingBag, RefreshCw, ChevronDown, X, Eye, Store, Users } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import { supabase } from '../../lib/supabase';
import { useToast } from '../../context/ToastContext';

function CustomerOrdersModal({ customer, onClose }: { customer: any; onClose: () => void }) {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase
      .from('orders')
      .select('*')
      .eq('user_id', customer.id)
      .order('created_at', { ascending: false })
      .then(({ data }) => {
        setOrders(data || []);
        setLoading(false);
      });
  }, [customer.id]);

  const STATUS_COLORS: Record<string, string> = {
    Pending: 'bg-yellow-50 text-yellow-700 border-yellow-200',
    Processing: 'bg-blue-50 text-blue-700 border-blue-200',
    Shipped: 'bg-purple-50 text-purple-700 border-purple-200',
    Delivered: 'bg-green-50 text-green-700 border-green-200',
    Cancelled: 'bg-red-50 text-red-700 border-red-200',
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 animate-in fade-in">
      <div className="bg-white rounded-2xl shadow-2xl max-w-xl w-full max-h-[80vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-100 flex items-center justify-between sticky top-0 bg-white z-10">
          <div>
            <h2 className="text-lg font-bold text-foreground">{customer.first_name} {customer.last_name}'s Orders</h2>
            <p className="text-sm text-foreground/50">{customer.email}</p>
          </div>
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-6">
          {loading ? (
            <div className="flex justify-center py-8"><div className="w-6 h-6 border-4 border-primary border-t-transparent rounded-full animate-spin"></div></div>
          ) : orders.length === 0 ? (
            <p className="text-center text-foreground/50 py-8">No orders placed yet.</p>
          ) : (
            <div className="space-y-3">
              {orders.map((order) => (
                <div key={order.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-100">
                  <div>
                    <p className="font-mono font-bold text-sm text-foreground">#{order.id.split('-')[0].toUpperCase()}</p>
                    <p className="text-xs text-foreground/50">{new Date(order.created_at).toLocaleDateString('en-IN')}</p>
                  </div>
                  <span className={`px-2.5 py-1 rounded-full text-xs font-medium border ${STATUS_COLORS[order.status] || ''}`}>{order.status}</span>
                  <p className="font-bold text-foreground">₹{order.total_amount}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function SellerStorePreviewModal({ seller, onClose }: { seller: any; onClose: () => void }) {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase
      .from('products')
      .select('*')
      .eq('seller_id', seller.id)
      .then(({ data }) => {
        setProducts(data || []);
        setLoading(false);
      });
  }, [seller.id]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in overflow-y-auto">
      <div className="bg-[#FAF9F6] rounded-2xl shadow-2xl max-w-4xl w-full h-[90vh] flex flex-col border border-black/10 overflow-hidden">
        
        {/* Header */}
        <div className="p-6 bg-white border-b border-gray-100 flex items-center justify-between sticky top-0 z-10 flex-shrink-0">
          <div>
            <span className="text-xs font-bold text-amber-800 uppercase tracking-wider bg-amber-50 px-3 py-1 rounded-full border border-amber-200">
              Seller ID: {seller.id.split('-')[0].toUpperCase()}
            </span>
            <h2 className="text-2xl font-display font-extrabold text-foreground mt-2">{seller.business_name}</h2>
            <p className="text-sm text-foreground/50">{seller.business_type} · Approved on {new Date(seller.created_at).toLocaleDateString('en-IN')}</p>
          </div>
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-8 space-y-8">
          {/* Top Row: Seller Info and Contact Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white p-6 rounded-2xl border border-black/5 shadow-sm space-y-4">
              <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider border-b pb-2 flex items-center gap-2">
                <Store className="w-4 h-4 text-primary" /> Store Information
              </h3>
              <div className="space-y-2">
                <div className="text-sm"><span className="font-semibold text-foreground/60">Business Type:</span> <span className="font-medium text-foreground capitalize">{seller.business_type}</span></div>
                <div className="text-sm"><span className="font-semibold text-foreground/60">PAN Number:</span> <span className="font-medium text-foreground uppercase">{seller.pan_number}</span></div>
                {seller.gst_number && (
                  <div className="text-sm"><span className="font-semibold text-foreground/60">GST Number:</span> <span className="font-medium text-foreground uppercase">{seller.gst_number}</span></div>
                )}
                <div className="text-sm"><span className="font-semibold text-foreground/60">Location:</span> <span className="font-medium text-foreground">{seller.address}, {seller.city}, {seller.state} - {seller.pincode}</span></div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-black/5 shadow-sm space-y-4">
              <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider border-b pb-2 flex items-center gap-2">
                <Users className="w-4 h-4 text-primary" /> Contact Details
              </h3>
              <div className="space-y-2">
                <div className="text-sm"><span className="font-semibold text-foreground/60">Owner Name:</span> <span className="font-medium text-foreground">{seller.owner_name}</span></div>
                <div className="text-sm"><span className="font-semibold text-foreground/60">Email:</span> <span className="font-medium text-foreground">{seller.email}</span></div>
                <div className="text-sm"><span className="font-semibold text-foreground/60">Phone:</span> <span className="font-medium text-foreground">{seller.phone}</span></div>
              </div>
            </div>
          </div>

          {/* Bottom Row: Seller Products */}
          <div className="bg-white p-6 rounded-2xl border border-black/5 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b pb-3 mb-4">
              <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider flex items-center gap-2">
                <ShoppingBag className="w-4 h-4 text-primary" /> Products by {seller.business_name}
              </h3>
              <span className="bg-primary/10 text-primary font-bold text-xs px-3 py-1 rounded-full">{products.length} products total</span>
            </div>

            {loading ? (
              <div className="flex justify-center py-8">
                <div className="w-6 h-6 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
              </div>
            ) : products.length === 0 ? (
              <div className="text-center py-12 text-foreground/50 border-2 border-dashed border-black/5 rounded-xl">
                No products have been added to this store yet.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {products.map((prod) => (
                  <div key={prod.id} className="p-4 bg-gray-50 rounded-xl border border-gray-100 flex flex-col justify-between hover:shadow-md transition-shadow">
                    <div>
                      <div className="w-full aspect-square bg-white rounded-lg border overflow-hidden mb-3">
                        {prod.image && <img src={prod.image} alt={prod.name} className="w-full h-full object-cover" />}
                      </div>
                      <h4 className="font-bold text-foreground line-clamp-1 text-sm">{prod.name}</h4>
                      <div className="text-xs font-mono text-gray-400 mt-0.5">SKU: {prod.sku || prod.id.split('-')[0].toUpperCase()}</div>
                    </div>
                    <div className="flex items-center justify-between mt-3">
                      <span className="font-bold text-foreground">₹{prod.price}</span>
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${prod.stock > 10 ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                        {prod.stock} in stock
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>

      </div>
    </div>
  );
}

export function Customers() {
  const [activeTab, setActiveTab] = useState<'users' | 'sellers'>('users');
  const [customers, setCustomers] = useState<any[]>([]);
  const [sellers, setSellers] = useState<any[]>([]);
  const [filtered, setFiltered] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState<any | null>(null);
  const [selectedSeller, setSelectedSeller] = useState<any | null>(null);
  const [orderCounts, setOrderCounts] = useState<Record<string, number>>({});
  const { showToast } = useToast();

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (activeTab === 'users') {
      if (!search.trim()) { setFiltered(customers); return; }
      const q = search.toLowerCase();
      setFiltered(customers.filter((c) =>
        (c.first_name || '').toLowerCase().includes(q) ||
        (c.last_name || '').toLowerCase().includes(q) ||
        (c.email || '').toLowerCase().includes(q) ||
        (c.mobile_number || '').includes(q)
      ));
    } else {
      if (!search.trim()) { setFiltered(sellers); return; }
      const q = search.toLowerCase();
      setFiltered(sellers.filter((s) =>
        (s.business_name || '').toLowerCase().includes(q) ||
        (s.owner_name || '').toLowerCase().includes(q) ||
        (s.email || '').toLowerCase().includes(q) ||
        (s.phone || '').includes(q)
      ));
    }
  }, [customers, sellers, activeTab, search]);

  const fetchData = async () => {
    setLoading(true);
    try {
      // 1. Fetch from profiles table
      const { data: profilesData } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });
      if (profilesData) setCustomers(profilesData);

      // 2. Fetch approved seller applications
      const { data: sellersData } = await supabase
        .from('seller_applications')
        .select('*')
        .eq('status', 'approved')
        .order('created_at', { ascending: false });
      if (sellersData) setSellers(sellersData);

      // 3. Fetch order counts
      const { data: ordersData } = await supabase.from('orders').select('user_id');
      if (ordersData) {
        const counts: Record<string, number> = {};
        ordersData.forEach((o: any) => {
          counts[o.user_id] = (counts[o.user_id] || 0) + 1;
        });
        setOrderCounts(counts);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="p-8 flex items-center justify-center"><div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div></div>;

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-display font-bold text-foreground">Directory Management</h1>
          <p className="text-foreground/60 text-sm mt-1">View users and approved sellers within the Swaxtika ecosystem</p>
        </div>
        <button onClick={fetchData} className="p-2 border border-gray-300 rounded-md text-foreground/70 hover:bg-gray-50 transition-colors" title="Refresh">
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200 mb-6 bg-white p-1 rounded-xl shadow-sm border border-black/5">
        <button
          onClick={() => { setActiveTab('users'); setSearch(''); }}
          className={`flex-1 flex items-center justify-center gap-2 py-3.5 text-sm font-bold transition-all rounded-lg select-none ${
            activeTab === 'users'
              ? 'bg-primary/10 text-primary'
              : 'text-gray-500 hover:text-gray-800 hover:bg-gray-50'
          }`}
        >
          <Users className="w-4 h-4" /> Site Users
        </button>
        <button
          onClick={() => { setActiveTab('sellers'); setSearch(''); }}
          className={`flex-1 flex items-center justify-center gap-2 py-3.5 text-sm font-bold transition-all rounded-lg select-none ${
            activeTab === 'sellers'
              ? 'bg-primary/10 text-primary'
              : 'text-gray-500 hover:text-gray-800 hover:bg-gray-50'
          }`}
        >
          <Store className="w-4 h-4" /> Approved Sellers
        </button>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        {/* Toolbar */}
        <div className="p-4 border-b border-gray-200 flex flex-col sm:flex-row justify-between gap-4">
          <div className="relative max-w-sm w-full">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={`Search ${activeTab === 'users' ? 'by name, email, or phone...' : 'by store name or email...'}`}
              className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:border-primary text-sm"
            />
          </div>
        </div>

        {/* Dynamic Table */}
        <div className="overflow-x-auto">
          {activeTab === 'users' ? (
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 text-foreground/60 font-medium">
                <tr>
                  <th className="px-6 py-3">Customer</th>
                  <th className="px-6 py-3">Contact</th>
                  <th className="px-6 py-3">Joined</th>
                  <th className="px-6 py-3">Orders</th>
                  <th className="px-6 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-foreground/50">
                      {search ? 'No users match your search.' : 'No site users found.'}
                    </td>
                  </tr>
                ) : filtered.map((customer) => {
                  const fullName = `${customer.first_name || ''} ${customer.last_name || ''}`.trim() || 'Anonymous';
                  const initial = fullName[0]?.toUpperCase() || '?';
                  const orderCount = orderCounts[customer.id] || 0;
                  return (
                    <tr key={customer.id} className="hover:bg-gray-50/50 group">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold flex-shrink-0">
                            {initial}
                          </div>
                          <div>
                            <div className="font-medium text-foreground">{fullName}</div>
                            <div className="text-xs text-foreground/50">ID: {customer.id.split('-')[0].toUpperCase()}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col gap-1">
                          {customer.email && (
                            <div className="flex items-center gap-2 text-foreground/80 text-sm">
                              <Mail className="w-3.5 h-3.5 text-gray-400" />
                              {customer.email}
                            </div>
                          )}
                          {customer.mobile_number && (
                            <div className="flex items-center gap-2 text-foreground/80 text-sm">
                              <Phone className="w-3.5 h-3.5 text-gray-400" />
                              {customer.mobile_number}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-foreground/70 text-sm">
                        {customer.created_at ? new Date(customer.created_at).toLocaleDateString('en-IN') : '—'}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-1.5">
                          <ShoppingBag className="w-4 h-4 text-primary" />
                          <span className="font-bold text-foreground">{orderCount}</span>
                          <span className="text-foreground/50 text-xs">order{orderCount !== 1 ? 's' : ''}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => setSelectedCustomer(customer)}
                          className="p-2 text-primary hover:bg-primary/10 rounded-lg opacity-0 group-hover:opacity-100 transition-all"
                          title="View Orders"
                        >
                          <Eye className="w-5 h-5" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          ) : (
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 text-foreground/60 font-medium">
                <tr>
                  <th className="px-6 py-3">Seller Store</th>
                  <th className="px-6 py-3">Owner</th>
                  <th className="px-6 py-3">Business Type</th>
                  <th className="px-6 py-3">Contact</th>
                  <th className="px-6 py-3">Approved Date</th>
                  <th className="px-6 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-foreground/50">
                      {search ? 'No approved sellers match your search.' : 'No approved sellers found.'}
                    </td>
                  </tr>
                ) : filtered.map((seller) => {
                  const initial = (seller.business_name || 'S')[0].toUpperCase();
                  return (
                    <tr key={seller.id} className="hover:bg-gray-50/50 group">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-amber-100 text-amber-800 flex items-center justify-center font-bold flex-shrink-0">
                            {initial}
                          </div>
                          <div>
                            <div className="font-bold text-foreground">{seller.business_name}</div>
                            <div className="text-xs text-foreground/50 font-mono">Seller ID: {seller.id.split('-')[0].toUpperCase()}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-foreground/80 font-medium">
                        {seller.owner_name}
                      </td>
                      <td className="px-6 py-4 text-foreground/80 font-medium capitalize">
                        {seller.business_type}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col gap-1">
                          <div className="flex items-center gap-2 text-foreground/80 text-sm">
                            <Mail className="w-3.5 h-3.5 text-gray-400" />
                            {seller.email}
                          </div>
                          <div className="flex items-center gap-2 text-foreground/80 text-sm">
                            <Phone className="w-3.5 h-3.5 text-gray-400" />
                            {seller.phone}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-foreground/70 text-sm">
                        {seller.created_at ? new Date(seller.created_at).toLocaleDateString('en-IN') : '—'}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => setSelectedSeller(seller)}
                          className="p-2 text-primary hover:bg-primary/10 rounded-lg opacity-0 group-hover:opacity-100 transition-all"
                          title="View Store"
                        >
                          <Eye className="w-5 h-5" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Modals */}
      {selectedCustomer && (
        <CustomerOrdersModal customer={selectedCustomer} onClose={() => setSelectedCustomer(null)} />
      )}

      {selectedSeller && (
        <SellerStorePreviewModal seller={selectedSeller} onClose={() => setSelectedSeller(null)} />
      )}
    </div>
  );
}
