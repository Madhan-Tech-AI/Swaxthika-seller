import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import { Search, Filter, ShoppingBag, Clock, FileText } from 'lucide-react';

export const SellerOrders = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchOrders();
  }, [user]);

  const fetchOrders = async () => {
    if (!user?.email) return;
    setLoading(true);
    try {
      // Get seller profile
      const { data: seller } = await supabase
        .from('seller_applications')
        .select('id')
        .eq('email', user.email)
        .eq('status', 'approved')
        .limit(1)
        .maybeSingle();

      if (!seller) return;

      // Fetch Seller's Products
      const { data: products } = await supabase
        .from('products')
        .select('id')
        .eq('seller_id', seller.id);

      const productIds = new Set((products || []).map(p => p.id));

      // Fetch All Orders
      const { data: allOrders } = await supabase
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false });

      let sellerOrders: any[] = [];

      (allOrders || []).forEach(order => {
        let orderRevenue = 0;
        let isSellerOrder = false;
        
        const items = Array.isArray(order.items) ? order.items : [];
        const sellerItems: any[] = [];

        items.forEach(item => {
          if (productIds.has(item.product_id)) {
            isSellerOrder = true;
            const itemPrice = Number(item.price || item.price_at_time) || 0;
            const qty = Number(item.quantity) || 1;
            orderRevenue += (itemPrice * qty);
            sellerItems.push({ ...item, price: itemPrice, quantity: qty });
          }
        });

        if (isSellerOrder) {
          sellerOrders.push({
            ...order,
            sellerRevenue: orderRevenue,
            sellerItems
          });
        }
      });

      setOrders(sellerOrders);
    } catch (error) {
      console.error("Error fetching orders:", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredOrders = orders.filter(order => 
    order.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (order.customer_name || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-10">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-display font-extrabold text-gray-900 tracking-tight">Order Management</h1>
          <p className="text-gray-500 mt-2 font-sans">View and track customer orders containing your products.</p>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input 
              type="text" 
              placeholder="Search by Order ID or Name..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl w-full md:w-72 focus:ring-2 focus:ring-amber-900/20 focus:border-amber-900 outline-none transition-all text-sm"
            />
          </div>
          <button className="flex items-center gap-2 bg-white border border-gray-200 px-4 py-2.5 rounded-xl hover:bg-gray-50 transition-colors text-sm font-bold text-gray-700">
            <Filter className="w-4 h-4" /> Filter
          </button>
        </div>
      </div>

      {/* Orders List */}
      <div className="bg-white rounded-3xl shadow-[0_2px_20px_-4px_rgba(0,0,0,0.02)] border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="flex justify-center items-center py-20">
            <div className="w-8 h-8 border-4 border-amber-900 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="py-24 text-center flex flex-col items-center justify-center">
            <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mb-4">
              <ShoppingBag className="w-10 h-10 text-gray-300" />
            </div>
            <h3 className="text-lg font-bold text-gray-900">No Orders Found</h3>
            <p className="text-gray-500 max-w-sm mt-2">When customers purchase your products, the orders will appear here.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50/80 border-b border-gray-100">
                  <th className="py-4 px-6 text-xs font-bold text-gray-500 uppercase tracking-wider">Order Details</th>
                  <th className="py-4 px-6 text-xs font-bold text-gray-500 uppercase tracking-wider">Customer</th>
                  <th className="py-4 px-6 text-xs font-bold text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="py-4 px-6 text-xs font-bold text-gray-500 uppercase tracking-wider">Items</th>
                  <th className="py-4 px-6 text-xs font-bold text-gray-500 uppercase tracking-wider text-right">Revenue</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredOrders.map(order => (
                  <tr key={order.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-amber-50 rounded-lg flex items-center justify-center text-amber-700">
                          <FileText className="w-5 h-5" />
                        </div>
                        <div>
                          <span className="font-mono text-xs font-bold text-gray-900 block">
                            #{order.id.split('-')[0].toUpperCase()}
                          </span>
                          <span className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                            <Clock className="w-3 h-3" />
                            {new Date(order.created_at).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <p className="font-bold text-sm text-gray-900">{order.customer_name || 'Guest User'}</p>
                      <p className="text-xs text-gray-500">{order.customer_email || 'No email provided'}</p>
                    </td>
                    <td className="py-4 px-6">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold ${
                        order.status === 'Completed' ? 'bg-emerald-100 text-emerald-700' :
                        order.status === 'Pending' ? 'bg-amber-100 text-amber-700' :
                        'bg-gray-100 text-gray-700'
                      }`}>
                        {order.status}
                      </span>
                    </td>
                    <td className="py-4 px-6">
                      <span className="text-sm font-medium text-gray-700">
                        {order.sellerItems.length} item{order.sellerItems.length !== 1 ? 's' : ''}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-right">
                      <span className="font-bold text-gray-900">₹{order.sellerRevenue.toLocaleString('en-IN')}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
