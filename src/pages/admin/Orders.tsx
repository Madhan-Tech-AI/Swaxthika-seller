import { Search, Filter, Eye, X, Download, RefreshCw, ChevronDown } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import { supabase } from '../../lib/supabase';
import { useToast } from '../../context/ToastContext';

const STATUS_OPTIONS = ['Pending', 'Processing', 'Shipped', 'Delivered', 'Cancelled'];

const STATUS_COLORS: Record<string, string> = {
  Pending: 'bg-yellow-50 text-yellow-700 border-yellow-200',
  Processing: 'bg-blue-50 text-blue-700 border-blue-200',
  Shipped: 'bg-purple-50 text-purple-700 border-purple-200',
  Delivered: 'bg-green-50 text-green-700 border-green-200',
  Cancelled: 'bg-red-50 text-red-700 border-red-200',
};

function OrderDetailModal({ order, onClose, onStatusChange }: { order: any; onClose: () => void; onStatusChange: (id: string, status: string) => void }) {
  const [updating, setUpdating] = useState(false);

  const handleStatusChange = async (newStatus: string) => {
    setUpdating(true);
    await onStatusChange(order.id, newStatus);
    setUpdating(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 animate-in fade-in">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-100 flex items-center justify-between sticky top-0 bg-white z-10">
          <div>
            <h2 className="text-xl font-bold text-foreground">Order Details</h2>
            <p className="text-sm text-foreground/50 mt-0.5">#{order.id.split('-')[0].toUpperCase()}</p>
          </div>
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Status Updater */}
          <div className="bg-gray-50 rounded-xl p-4">
            <p className="text-sm font-bold text-foreground/70 uppercase tracking-wider mb-3">Update Status</p>
            <div className="flex flex-wrap gap-2">
              {STATUS_OPTIONS.map((status) => (
                <button
                  key={status}
                  disabled={updating || order.status === status}
                  onClick={() => handleStatusChange(status)}
                  className={`px-4 py-2 rounded-full text-xs font-bold border transition-all ${
                    order.status === status
                      ? (STATUS_COLORS[status] || '') + ' ring-2 ring-offset-1 ring-current'
                      : 'bg-white text-foreground/60 border-gray-200 hover:border-primary hover:text-primary'
                  } disabled:opacity-60`}
                >
                  {status}
                </button>
              ))}
            </div>
          </div>

          {/* Customer Info */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs font-bold text-foreground/50 uppercase tracking-wider mb-1">Customer</p>
              <p className="font-medium text-foreground">{order.customer_name || '—'}</p>
              <p className="text-sm text-foreground/60">{order.customer_email || '—'}</p>
              <p className="text-sm text-foreground/60">{order.customer_phone || '—'}</p>
            </div>
            <div>
              <p className="text-xs font-bold text-foreground/50 uppercase tracking-wider mb-1">Shipping To</p>
              {order.shipping_address ? (
                <>
                  <p className="font-medium text-foreground">{order.shipping_address.fullName}</p>
                  <p className="text-sm text-foreground/60">{order.shipping_address.address}</p>
                  <p className="text-sm text-foreground/60">{order.shipping_address.city} — {order.shipping_address.pin}</p>
                </>
              ) : <p className="text-sm text-foreground/50">N/A</p>}
            </div>
          </div>

          {/* Items */}
          <div>
            <p className="text-xs font-bold text-foreground/50 uppercase tracking-wider mb-3">Items Ordered</p>
            <div className="space-y-3">
              {(Array.isArray(order.items) ? order.items : []).map((item: any, i: number) => (
                <div key={i} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  {item.image && <img src={item.image} alt={item.name} className="w-12 h-12 rounded-lg object-cover border border-gray-200" />}
                  <div className="flex-1">
                    <p className="font-medium text-sm text-foreground">{item.name}</p>
                    <p className="text-xs text-foreground/50">Qty: {item.quantity} × ₹{item.price}</p>
                  </div>
                  <p className="font-bold text-sm">₹{item.price * item.quantity}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Totals */}
          <div className="border-t border-gray-100 pt-4 space-y-2">
            <div className="flex justify-between text-sm text-foreground/70">
              <span>Subtotal</span><span>₹{order.subtotal}</span>
            </div>
            <div className="flex justify-between text-sm text-foreground/70">
              <span>Shipping</span><span>{order.shipping_fee === 0 ? 'Free' : `₹${order.shipping_fee}`}</span>
            </div>
            <div className="flex justify-between font-bold text-lg border-t border-gray-100 pt-2 mt-2">
              <span>Total</span><span>₹{order.total_amount}</span>
            </div>
          </div>

          {/* Payment */}
          <div className="flex gap-6 text-sm">
            <div>
              <p className="text-xs font-bold text-foreground/50 uppercase tracking-wider mb-1">Payment</p>
              <p className="capitalize font-medium">{order.payment_method?.toUpperCase() || 'N/A'}</p>
            </div>
            <div>
              <p className="text-xs font-bold text-foreground/50 uppercase tracking-wider mb-1">Date</p>
              <p className="font-medium">{new Date(order.created_at).toLocaleString('en-IN')}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function Orders() {
  const [orders, setOrders] = useState<any[]>([]);
  const [filtered, setFiltered] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [filterOpen, setFilterOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<any | null>(null);
  const [updatingStatus, setUpdatingStatus] = useState<string | null>(null);
  const { showToast } = useToast();
  const filterRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchOrders();

    // Real-time subscription
    const channel = supabase
      .channel('admin-orders-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, (payload) => {
        if (payload.eventType === 'INSERT') {
          setOrders((prev) => [payload.new, ...prev]);
          showToast('success', '🛒 New Order!', `Order #${payload.new.id.split('-')[0].toUpperCase()} just arrived.`);
        } else if (payload.eventType === 'UPDATE') {
          setOrders((prev) => prev.map((o) => (o.id === payload.new.id ? payload.new : o)));
          if (selectedOrder?.id === payload.new.id) {
            setSelectedOrder(payload.new);
          }
        } else if (payload.eventType === 'DELETE') {
          setOrders((prev) => prev.filter((o) => o.id !== payload.old.id));
        }
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  // Filter orders
  useEffect(() => {
    let result = [...orders];
    if (statusFilter !== 'All') result = result.filter((o) => o.status === statusFilter);
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter((o) =>
        o.id.toLowerCase().includes(q) ||
        (o.customer_name || '').toLowerCase().includes(q) ||
        (o.customer_email || '').toLowerCase().includes(q)
      );
    }
    setFiltered(result);
  }, [orders, search, statusFilter]);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const { data } = await supabase.from('orders').select('*').order('created_at', { ascending: false });
      if (data) setOrders(data);
    } catch (error) {
      console.error('Error fetching admin orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (orderId: string, newStatus: string) => {
    setUpdatingStatus(orderId);
    try {
      const { error } = await supabase.from('orders').update({ status: newStatus }).eq('id', orderId);
      if (error) throw error;
      setOrders((prev) => prev.map((o) => (o.id === orderId ? { ...o, status: newStatus } : o)));
      if (selectedOrder?.id === orderId) setSelectedOrder((prev: any) => ({ ...prev, status: newStatus }));
      showToast('success', 'Status Updated', `Order is now ${newStatus}.`);
    } catch (err) {
      showToast('error', 'Update Failed', 'Could not update order status.');
    } finally {
      setUpdatingStatus(null);
    }
  };

  const handleExportCSV = () => {
    const rows = [
      ['Order ID', 'Date', 'Customer', 'Email', 'Phone', 'Total', 'Payment', 'Status'],
      ...filtered.map((o) => [
        o.id, o.created_at, o.customer_name || '', o.customer_email || '',
        o.customer_phone || '', o.total_amount, o.payment_method || '', o.status,
      ]),
    ];
    const csv = rows.map((r) => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `orders_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const revenue = filtered.filter((o) => o.status !== 'Cancelled').reduce((acc, o) => acc + (o.total_amount || 0), 0);

  if (loading) return <div className="p-8 flex items-center justify-center"><div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div></div>;

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-display font-bold text-foreground">Orders</h1>
          <p className="text-foreground/60 text-sm mt-1">
            {filtered.length} orders · Revenue: <span className="text-green-600 font-bold">₹{revenue.toLocaleString('en-IN')}</span>
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={fetchOrders} className="p-2 border border-gray-300 rounded-md text-foreground/70 hover:bg-gray-50 transition-colors" title="Refresh">
            <RefreshCw className="w-4 h-4" />
          </button>
          <button onClick={handleExportCSV} className="flex items-center gap-2 px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-foreground hover:bg-gray-50 transition-colors">
            <Download className="w-4 h-4" /> Export CSV
          </button>
        </div>
      </div>

      {/* Stats strip */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-6">
        {['All', ...STATUS_OPTIONS].map((s) => {
          const count = s === 'All' ? orders.length : orders.filter((o) => o.status === s).length;
          return (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`p-3 rounded-xl border text-left transition-all ${statusFilter === s ? 'border-primary bg-primary/5 ring-1 ring-primary' : 'border-gray-200 bg-white hover:border-primary/40'}`}
            >
              <p className="text-xl font-bold text-foreground">{count}</p>
              <p className="text-xs text-foreground/50 mt-0.5">{s}</p>
            </button>
          );
        })}
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        {/* Toolbar */}
        <div className="p-4 border-b border-gray-200 flex flex-col sm:flex-row justify-between gap-3">
          <div className="relative max-w-sm w-full">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by ID, name, or email..."
              className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:border-primary text-sm"
            />
          </div>
          <div className="relative" ref={filterRef}>
            <button
              onClick={() => setFilterOpen(!filterOpen)}
              className="flex items-center gap-2 px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-foreground hover:bg-gray-50 transition-colors"
            >
              <Filter className="w-4 h-4" /> {statusFilter} <ChevronDown className="w-3 h-3" />
            </button>
            {filterOpen && (
              <div className="absolute right-0 top-full mt-1 bg-white border border-gray-200 rounded-xl shadow-xl z-20 w-40 py-1 animate-in fade-in slide-in-from-top-2">
                {['All', ...STATUS_OPTIONS].map((s) => (
                  <button
                    key={s}
                    onClick={() => { setStatusFilter(s); setFilterOpen(false); }}
                    className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-50 transition-colors ${statusFilter === s ? 'text-primary font-bold' : 'text-foreground'}`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 text-foreground/60 font-medium">
              <tr>
                <th className="px-6 py-3">Order ID</th>
                <th className="px-6 py-3">Date</th>
                <th className="px-6 py-3">Customer</th>
                <th className="px-6 py-3">Items</th>
                <th className="px-6 py-3">Total</th>
                <th className="px-6 py-3">Payment</th>
                <th className="px-6 py-3">Status</th>
                <th className="px-6 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center text-foreground/50">
                    {search || statusFilter !== 'All' ? 'No orders match your filter.' : 'No orders yet. They will appear here in real-time.'}
                  </td>
                </tr>
              ) : filtered.map((order) => (
                <tr key={order.id} className="hover:bg-gray-50/50 group">
                  <td className="px-6 py-4 font-mono font-medium text-primary text-xs">
                    #{order.id.split('-')[0].toUpperCase()}
                  </td>
                  <td className="px-6 py-4 text-foreground/70 text-xs">
                    {new Date(order.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </td>
                  <td className="px-6 py-4">
                    <p className="font-medium text-foreground">{order.customer_name || '—'}</p>
                    <p className="text-xs text-foreground/50">{order.customer_email || ''}</p>
                  </td>
                  <td className="px-6 py-4 text-foreground/70">
                    {Array.isArray(order.items) ? order.items.length : 0} item(s)
                  </td>
                  <td className="px-6 py-4 font-bold text-foreground">₹{order.total_amount}</td>
                  <td className="px-6 py-4 text-xs uppercase font-medium text-foreground/60">{order.payment_method || '—'}</td>
                  <td className="px-6 py-4">
                    <select
                      value={order.status || 'Pending'}
                      onChange={(e) => handleStatusChange(order.id, e.target.value)}
                      disabled={updatingStatus === order.id}
                      className={`text-xs font-bold px-2.5 py-1.5 rounded-full border cursor-pointer focus:outline-none ${STATUS_COLORS[order.status] || 'bg-gray-50 text-gray-600 border-gray-200'} disabled:opacity-60`}
                    >
                      {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button
                      onClick={() => setSelectedOrder(order)}
                      className="p-1.5 text-primary hover:bg-primary/10 rounded-lg transition-colors"
                      title="View Details"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-100 text-xs text-foreground/50 flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></div>
          Live · updates automatically when customers place orders
        </div>
      </div>

      {/* Order Detail Modal */}
      {selectedOrder && (
        <OrderDetailModal
          order={selectedOrder}
          onClose={() => setSelectedOrder(null)}
          onStatusChange={handleStatusChange}
        />
      )}
    </div>
  );
}
