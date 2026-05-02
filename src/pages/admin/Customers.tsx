import { Search, Filter, Mail, Phone, ShoppingBag, RefreshCw, ChevronDown, X, Eye } from 'lucide-react';
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

export function Customers() {
  const [customers, setCustomers] = useState<any[]>([]);
  const [filtered, setFiltered] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState<any | null>(null);
  const [orderCounts, setOrderCounts] = useState<Record<string, number>>({});
  const { showToast } = useToast();

  useEffect(() => {
    fetchCustomers();

    // Real-time: listen for new profiles (new registrations)
    const channel = supabase
      .channel('admin-customers-realtime')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'profiles' }, (payload) => {
        setCustomers((prev) => [payload.new, ...prev]);
        showToast('success', '👤 New Customer!', `${payload.new.first_name || 'A new user'} just registered.`);
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  // Filter
  useEffect(() => {
    if (!search.trim()) { setFiltered(customers); return; }
    const q = search.toLowerCase();
    setFiltered(customers.filter((c) =>
      (c.first_name || '').toLowerCase().includes(q) ||
      (c.last_name || '').toLowerCase().includes(q) ||
      (c.email || '').toLowerCase().includes(q) ||
      (c.mobile_number || '').includes(q)
    ));
  }, [customers, search]);

  const fetchCustomers = async () => {
    setLoading(true);
    try {
      // Fetch from profiles table (correct source)
      const { data: profilesData } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (profilesData) {
        setCustomers(profilesData);

        // Also get order counts per customer
        const { data: ordersData } = await supabase
          .from('orders')
          .select('user_id');

        if (ordersData) {
          const counts: Record<string, number> = {};
          ordersData.forEach((o: any) => {
            counts[o.user_id] = (counts[o.user_id] || 0) + 1;
          });
          setOrderCounts(counts);
        }
      }
    } catch (error) {
      console.error('Error fetching customers:', error);
    } finally {
      setLoading(false);
    }
  };

  const totalRevenue = customers.reduce((acc, c) => {
    // Will be enhanced if we join orders
    return acc;
  }, 0);

  if (loading) return <div className="p-8 flex items-center justify-center"><div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div></div>;

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-display font-bold text-foreground">Customers</h1>
          <p className="text-foreground/60 text-sm mt-1">{filtered.length} registered customers</p>
        </div>
        <button onClick={fetchCustomers} className="p-2 border border-gray-300 rounded-md text-foreground/70 hover:bg-gray-50 transition-colors" title="Refresh">
          <RefreshCw className="w-4 h-4" />
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
              placeholder="Search by name, email, or phone..."
              className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:border-primary text-sm"
            />
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 text-foreground/60 font-medium">
              <tr>
                <th className="px-6 py-3">Customer</th>
                <th className="px-6 py-3">Contact</th>
                <th className="px-6 py-3">Joined</th>
                <th className="px-6 py-3">Orders</th>
                <th className="px-6 py-3">Status</th>
                <th className="px-6 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-foreground/50">
                    {search ? 'No customers match your search.' : 'No customers yet. They appear here when users register.'}
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
                          <div className="text-xs text-foreground/50">ID: {customer.id.split('-')[0]}</div>
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
                    <td className="px-6 py-4">
                      <span className="px-2.5 py-1 rounded-full text-xs font-medium border bg-green-50 text-green-700 border-green-200">
                        Active
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => setSelectedCustomer(customer)}
                        className="p-1.5 text-primary hover:bg-primary/10 rounded-lg opacity-0 group-hover:opacity-100 transition-all"
                        title="View Orders"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-100 text-xs text-foreground/50 flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></div>
          Live · new registrations appear automatically
        </div>
      </div>

      {/* Customer Orders Modal */}
      {selectedCustomer && (
        <CustomerOrdersModal customer={selectedCustomer} onClose={() => setSelectedCustomer(null)} />
      )}
    </div>
  );
}
