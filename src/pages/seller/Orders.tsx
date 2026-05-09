import { Search, Filter, Eye, X, Download, RefreshCw, Clock, FileText, ShoppingBag } from 'lucide-react';
import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
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
            <h2 className="text-xl font-bold text-gray-900">Order Details</h2>
            <p className="text-sm text-gray-500 mt-0.5">#{order.id.split('-')[0].toUpperCase()}</p>
          </div>
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Status Updater */}
          <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
            <p className="text-sm font-bold text-gray-600 uppercase tracking-wider mb-3">Update Overall Order Status</p>
            <div className="flex flex-wrap gap-2">
              {STATUS_OPTIONS.map((status) => (
                <button
                  key={status}
                  disabled={updating || order.status === status}
                  onClick={() => handleStatusChange(status)}
                  className={`px-4 py-2 rounded-full text-xs font-bold border transition-all ${
                    order.status === status
                      ? (STATUS_COLORS[status] || '') + ' ring-2 ring-offset-1 ring-current'
                      : 'bg-white text-gray-500 border-gray-200 hover:border-amber-900 hover:text-amber-900'
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
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Customer</p>
              <p className="font-medium text-gray-900">{order.customer_name || 'Guest User'}</p>
              <p className="text-sm text-gray-600">{order.customer_email || 'No email provided'}</p>
              <p className="text-sm text-gray-600">{order.customer_phone || 'No phone provided'}</p>
            </div>
            <div>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Shipping To</p>
              {order.shipping_address ? (
                <>
                  <p className="font-medium text-gray-900">{order.shipping_address.fullName}</p>
                  <p className="text-sm text-gray-600">{order.shipping_address.address}</p>
                  <p className="text-sm text-gray-600">{order.shipping_address.city} — {order.shipping_address.pin}</p>
                </>
              ) : <p className="text-sm text-gray-500">N/A</p>}
            </div>
          </div>

          {/* Items */}
          <div>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Your Items in this Order</p>
            <div className="space-y-3">
              {(Array.isArray(order.sellerItems) ? order.sellerItems : []).map((item: any, i: number) => (
                <div key={i} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border border-gray-100">
                  {item.product_image && <img src={item.product_image} alt={item.product_name} className="w-12 h-12 rounded-lg object-cover border border-gray-200" />}
                  <div className="flex-1">
                    <p className="font-medium text-sm text-gray-900">{item.product_name}</p>
                    <p className="text-xs text-gray-500">Qty: {item.quantity} × ₹{item.price_at_time}</p>
                  </div>
                  <p className="font-bold text-sm text-amber-900">₹{item.line_total}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Totals */}
          <div className="border-t border-gray-100 pt-4 space-y-2">
            <div className="flex justify-between font-bold text-lg text-amber-900">
              <span>Your Revenue</span><span>₹{order.sellerRevenue}</span>
            </div>
          </div>

          {/* Payment */}
          <div className="flex gap-6 text-sm border-t border-gray-100 pt-4">
            <div>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Date</p>
              <p className="font-medium text-gray-900">{new Date(order.created_at).toLocaleString('en-IN')}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function SellerOrders() {
  const { user } = useAuth();
  const { showToast } = useToast();
  
  const [orders, setOrders] = useState<any[]>([]);
  const [filtered, setFiltered] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  
  const [selectedOrder, setSelectedOrder] = useState<any | null>(null);

  useEffect(() => {
    fetchOrders();
  }, [user]);

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
    if (!user?.email) return;
    setLoading(true);
    try {
      // 1. Get seller profile
      const { data: seller } = await supabase
        .from('seller_applications')
        .select('id')
        .eq('email', user.email)
        .eq('status', 'approved')
        .limit(1)
        .maybeSingle();

      if (!seller) { setLoading(false); return; }

      // 2. Query orders via RPC to bypass complex RLS joining recursion
      const { data: orderItemRows, error } = await supabase.rpc('get_seller_orders');

      if (error) throw error;

      // 3. Group by order_id
      const orderMap = new Map<string, any>();
      (orderItemRows || []).forEach((item: any) => {
        const orderId = item.order_id;
        if (!orderMap.has(orderId)) {
          orderMap.set(orderId, {
            ...item.order,
            sellerItems: [],
            sellerRevenue: 0,
          });
        }
        const o = orderMap.get(orderId);
        o.sellerItems.push(item);
        o.sellerRevenue += item.line_total;
      });

      setOrders(Array.from(orderMap.values()));
    } catch (error) {
      console.error('Error fetching orders:', error);
      showToast('error', 'Cannot Load Orders', 'Make sure you have run the fix_seller_orders_rpc.sql script.');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (orderId: string, newStatus: string) => {
    try {
      // Since Sellers might not have UPDATE permission on the whole 'orders' table due to strict RLS,
      // we use an RPC to safely update it (or we can just update if the policy allows).
      // Let's try direct update first. If it fails, we fall back to RPC.
      const { error } = await supabase.rpc('update_order_status_seller', { p_order_id: orderId, p_status: newStatus });
      
      if (error) {
         const { error: directError } = await supabase.from('orders').update({ status: newStatus }).eq('id', orderId);
         if(directError) throw directError;
      }
      
      setOrders((prev) => prev.map((o) => (o.id === orderId ? { ...o, status: newStatus } : o)));
      if (selectedOrder?.id === orderId) setSelectedOrder((prev: any) => ({ ...prev, status: newStatus }));
      showToast('success', 'Status Updated', `Order is now ${newStatus}.`);
    } catch (err: any) {
      showToast('error', 'Update Failed', err.message || 'Could not update order status.');
      console.error(err);
    }
  };

  const handleExportCSV = () => {
    const rows = [
      ['Order ID', 'Date', 'Customer', 'Email', 'Items Count', 'Your Revenue', 'Status'],
      ...filtered.map((o) => [
        o.id, o.created_at, o.customer_name || '', o.customer_email || '',
        o.sellerItems.length, o.sellerRevenue, o.status,
      ]),
    ];
    const csv = rows.map((r) => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `my_sales_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const revenue = filtered.filter((o) => o.status !== 'Cancelled').reduce((acc, o) => acc + (o.sellerRevenue || 0), 0);

  if (loading) return <div className="p-8 flex items-center justify-center"><div className="w-8 h-8 border-4 border-amber-900 border-t-transparent rounded-full animate-spin"></div></div>;

  return (
    <div className="max-w-7xl mx-auto pb-10">
      {/* Header */}
      <div className="mb-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-display font-extrabold text-gray-900 tracking-tight">Orders</h1>
          <p className="text-gray-500 text-sm mt-2">
            {filtered.length} orders containing your products · Your Revenue: <span className="text-green-600 font-bold">₹{revenue.toLocaleString('en-IN')}</span>
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={fetchOrders} className="p-2 border border-gray-300 rounded-md text-gray-600 hover:bg-gray-50 transition-colors" title="Refresh">
            <RefreshCw className="w-4 h-4" />
          </button>
          <button onClick={handleExportCSV} className="flex items-center gap-2 px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors shadow-sm bg-white">
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
              className={`p-3 rounded-xl border text-left transition-all ${statusFilter === s ? 'border-amber-900 bg-amber-50 ring-1 ring-amber-900' : 'border-gray-200 bg-white hover:border-amber-900/40'}`}
            >
              <p className="text-xl font-bold text-gray-900">{count}</p>
              <p className="text-xs text-gray-500 mt-0.5">{s}</p>
            </button>
          );
        })}
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        {/* Toolbar */}
        <div className="p-4 border-b border-gray-200 flex flex-col sm:flex-row justify-between gap-3 bg-gray-50/50">
          <div className="relative max-w-sm w-full">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by Order ID, customer name..."
              className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-900 focus:border-transparent bg-white"
            />
          </div>
        </div>

        {/* Orders Table */}
        <div className="overflow-x-auto">
          {filtered.length === 0 ? (
            <div className="py-24 text-center flex flex-col items-center justify-center bg-white">
              <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mb-4 border border-gray-100">
                <ShoppingBag className="w-10 h-10 text-gray-300" />
              </div>
              <h3 className="text-lg font-bold text-gray-900">No Orders Found</h3>
              <p className="text-gray-500 max-w-sm mt-2 text-sm">When customers purchase your products, the orders will appear here.</p>
            </div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/50">
                  <th className="py-4 px-6 text-xs font-bold text-gray-500 uppercase tracking-wider">Order</th>
                  <th className="py-4 px-6 text-xs font-bold text-gray-500 uppercase tracking-wider">Customer</th>
                  <th className="py-4 px-6 text-xs font-bold text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="py-4 px-6 text-xs font-bold text-gray-500 uppercase tracking-wider text-right">Items / Revenue</th>
                  <th className="py-4 px-6 text-xs font-bold text-gray-500 uppercase tracking-wider text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 bg-white">
                {filtered.map((order) => (
                  <tr key={order.id} className="hover:bg-gray-50 transition-colors">
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-amber-50 rounded-lg flex items-center justify-center text-amber-900 border border-amber-100">
                          <FileText className="w-5 h-5" />
                        </div>
                        <div>
                          <p className="font-mono text-sm font-bold text-gray-900 block">#{order.id.split('-')[0].toUpperCase()}</p>
                          <p className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                            <Clock className="w-3 h-3" />
                            {new Date(order.created_at).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <p className="font-medium text-sm text-gray-900">{order.customer_name || 'Guest User'}</p>
                      <p className="text-xs text-gray-500 mt-0.5">{order.customer_email || 'No email'}</p>
                    </td>
                    <td className="py-4 px-6">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold border ${STATUS_COLORS[order.status] || 'bg-gray-100 text-gray-700 border-gray-200'}`}>
                        {order.status}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-right">
                      <p className="text-sm font-medium text-gray-700">{order.sellerItems.length} items</p>
                      <p className="font-bold text-amber-900 mt-0.5">₹{order.sellerRevenue.toLocaleString('en-IN')}</p>
                    </td>
                    <td className="py-4 px-6 text-right">
                      <button
                        onClick={() => setSelectedOrder(order)}
                        className="inline-flex items-center gap-2 px-3 py-1.5 bg-white border border-gray-200 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 hover:border-gray-300 transition-colors shadow-sm"
                      >
                        <Eye className="w-4 h-4" /> View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

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
