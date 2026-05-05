import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Package, IndianRupee, TrendingUp, ShoppingBag, Plus, Clock, ExternalLink, Star } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { Link } from 'react-router-dom';

interface DashboardStats {
  totalProducts: number;
  totalOrders: number;
  revenue: number;
  recentOrders: any[];
  topProducts: any[];
}

export const SellerDashboard = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<DashboardStats>({
    totalProducts: 0,
    totalOrders: 0,
    revenue: 0,
    recentOrders: [],
    topProducts: [],
  });

  useEffect(() => {
    fetchDashboardData();
  }, [user]);

  const fetchDashboardData = async () => {
    if (!user?.email) return;
    setLoading(true);
    try {
      // 1. Get the seller profile
      const { data: seller } = await supabase
        .from('seller_applications')
        .select('id')
        .eq('email', user.email)
        .eq('status', 'approved')
        .limit(1)
        .maybeSingle();

      if (!seller) {
        setLoading(false);
        return;
      }

      // 2. Fetch Seller's Products
      const { data: products } = await supabase
        .from('products')
        .select('*')
        .eq('seller_id', seller.id);

      const sellerProducts = products || [];
      const productIds = new Set(sellerProducts.map(p => p.id));

      // 3. Fetch All Orders to calculate seller specific metrics
      const { data: allOrders } = await supabase
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false });

      let totalRevenue = 0;
      let sellerOrdersCount = 0;
      let recentOrders: any[] = [];

      (allOrders || []).forEach(order => {
        let isSellerOrder = false;
        let orderRevenue = 0;

        // Parse items (ensure it's an array)
        const items = Array.isArray(order.items) ? order.items : [];
        
        items.forEach(item => {
          if (productIds.has(item.product_id)) {
            isSellerOrder = true;
            // Assuming item structure has price and quantity
            const itemPrice = Number(item.price || item.price_at_time) || 0;
            const qty = Number(item.quantity) || 1;
            orderRevenue += (itemPrice * qty);
            totalRevenue += (itemPrice * qty);
          }
        });

        if (isSellerOrder) {
          sellerOrdersCount++;
          if (recentOrders.length < 5) {
            recentOrders.push({
              ...order,
              sellerRevenue: orderRevenue
            });
          }
        }
      });

      // 4. Calculate Top Products (just sorting by a mock metric if we don't have historical sales per product, e.g. lowest stock or highest rating)
      const topProducts = [...sellerProducts]
        .sort((a, b) => (Number(b.rating) || 0) - (Number(a.rating) || 0))
        .slice(0, 5);

      setStats({
        totalProducts: sellerProducts.length,
        totalOrders: sellerOrdersCount,
        revenue: totalRevenue,
        recentOrders,
        topProducts
      });

    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-amber-900 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-10">
      
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:justify-between md:items-end gap-4 bg-white p-8 rounded-3xl shadow-[0_2px_20px_-4px_rgba(0,0,0,0.05)] border border-gray-100 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-amber-50 rounded-full blur-3xl -mr-20 -mt-20 opacity-60 pointer-events-none"></div>
        <div className="relative z-10">
          <h1 className="text-3xl font-display font-extrabold text-gray-900 tracking-tight">Business Dashboard</h1>
          <p className="text-gray-500 mt-2 font-sans">Here's what's happening with your store today.</p>
        </div>
        <Link to="/products" className="relative z-10 bg-gradient-to-r from-amber-800 to-amber-950 text-white px-6 py-3.5 rounded-xl hover:shadow-lg hover:shadow-amber-900/20 transition-all duration-300 flex items-center gap-2 font-bold text-sm transform hover:-translate-y-0.5">
          <Plus className="w-5 h-5" /> Add New Product
        </Link>
      </div>

      {/* Stats Cards Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Revenue Card */}
        <div className="bg-white p-6 rounded-3xl shadow-[0_2px_20px_-4px_rgba(0,0,0,0.02)] border border-gray-100 relative overflow-hidden group hover:border-amber-200 transition-colors duration-300">
          <div className="absolute right-0 top-0 w-24 h-24 bg-amber-50 rounded-bl-full opacity-50 group-hover:scale-110 transition-transform duration-500"></div>
          <div className="flex items-start justify-between relative z-10">
            <div>
              <p className="text-gray-500 text-sm font-medium mb-1">Total Earnings</p>
              <h3 className="text-3xl font-display font-extrabold text-gray-900">₹{stats.revenue.toLocaleString('en-IN')}</h3>
            </div>
            <div className="w-12 h-12 bg-amber-50 rounded-2xl flex items-center justify-center text-amber-700 shadow-sm">
              <IndianRupee className="w-6 h-6" />
            </div>
          </div>
          <div className="mt-6 flex items-center gap-2 text-sm">
            <span className="flex items-center gap-1 text-emerald-600 font-bold bg-emerald-50 px-2 py-1 rounded-lg">
              <TrendingUp className="w-3 h-3"/> +12.5%
            </span>
            <span className="text-gray-400">vs last month</span>
          </div>
        </div>
        
        {/* Orders Card */}
        <div className="bg-white p-6 rounded-3xl shadow-[0_2px_20px_-4px_rgba(0,0,0,0.02)] border border-gray-100 relative overflow-hidden group hover:border-blue-200 transition-colors duration-300">
          <div className="absolute right-0 top-0 w-24 h-24 bg-blue-50 rounded-bl-full opacity-50 group-hover:scale-110 transition-transform duration-500"></div>
          <div className="flex items-start justify-between relative z-10">
            <div>
              <p className="text-gray-500 text-sm font-medium mb-1">Total Orders</p>
              <h3 className="text-3xl font-display font-extrabold text-gray-900">{stats.totalOrders}</h3>
            </div>
            <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600 shadow-sm">
              <ShoppingBag className="w-6 h-6" />
            </div>
          </div>
          <div className="mt-6 flex items-center gap-2 text-sm">
            <span className="flex items-center gap-1 text-emerald-600 font-bold bg-emerald-50 px-2 py-1 rounded-lg">
              <TrendingUp className="w-3 h-3"/> +5.2%
            </span>
            <span className="text-gray-400">vs last month</span>
          </div>
        </div>

        {/* Products Card */}
        <div className="bg-white p-6 rounded-3xl shadow-[0_2px_20px_-4px_rgba(0,0,0,0.02)] border border-gray-100 relative overflow-hidden group hover:border-purple-200 transition-colors duration-300">
          <div className="absolute right-0 top-0 w-24 h-24 bg-purple-50 rounded-bl-full opacity-50 group-hover:scale-110 transition-transform duration-500"></div>
          <div className="flex items-start justify-between relative z-10">
            <div>
              <p className="text-gray-500 text-sm font-medium mb-1">Active Products</p>
              <h3 className="text-3xl font-display font-extrabold text-gray-900">{stats.totalProducts}</h3>
            </div>
            <div className="w-12 h-12 bg-purple-50 rounded-2xl flex items-center justify-center text-purple-600 shadow-sm">
              <Package className="w-6 h-6" />
            </div>
          </div>
          <div className="mt-6 flex items-center gap-2 text-sm">
            <span className="text-gray-500 font-medium bg-gray-50 px-3 py-1 rounded-lg border border-gray-100">
              Listed in catalog
            </span>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column: Chart & Recent Orders (Takes up 2 cols on large screens) */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* Custom CSS Sales Chart */}
          <div className="bg-white p-6 md:p-8 rounded-3xl shadow-[0_2px_20px_-4px_rgba(0,0,0,0.02)] border border-gray-100">
            <div className="flex items-center justify-between mb-8">
              <h3 className="font-display font-bold text-xl text-gray-900">Revenue Overview</h3>
              <select className="bg-gray-50 border border-gray-200 text-gray-700 text-sm rounded-lg focus:ring-amber-900 focus:border-amber-900 block p-2 outline-none cursor-pointer">
                <option>This Week</option>
                <option>This Month</option>
                <option>This Year</option>
              </select>
            </div>
            
            {/* CSS Bar Chart Simulation */}
            <div className="h-64 flex items-end justify-between gap-2 md:gap-4 pt-4 border-b border-gray-100 relative">
              {/* Y-axis lines */}
              <div className="absolute w-full h-full flex flex-col justify-between pb-8 top-0 left-0 pointer-events-none">
                {[100, 75, 50, 25, 0].map((val) => (
                  <div key={val} className="w-full border-t border-gray-100 border-dashed flex items-center">
                    <span className="absolute -left-2 -translate-x-full text-xs text-gray-400 font-medium">{val}k</span>
                  </div>
                ))}
              </div>

              {/* Bars */}
              {[40, 65, 30, 85, 55, 90, 70].map((height, i) => {
                const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
                return (
                  <div key={i} className="relative flex flex-col items-center flex-1 group z-10">
                    {/* Tooltip */}
                    <div className="absolute -top-10 opacity-0 group-hover:opacity-100 transition-opacity bg-gray-900 text-white text-xs py-1 px-2 rounded font-medium whitespace-nowrap pointer-events-none">
                      ₹{(height * 1000).toLocaleString('en-IN')}
                    </div>
                    {/* Bar Line */}
                    <div 
                      className="w-full max-w-[40px] bg-amber-100 group-hover:bg-amber-200 rounded-t-xl transition-all duration-500 relative overflow-hidden" 
                      style={{ height: `${height}%` }}
                    >
                      <div className="absolute bottom-0 w-full bg-gradient-to-t from-amber-600 to-amber-400 rounded-t-xl transition-all duration-1000 delay-100" style={{ height: '0%', animation: `growUp 1s ease-out forwards ${i * 0.1}s`}}></div>
                    </div>
                    <span className="mt-3 text-xs font-medium text-gray-400">{days[i]}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Recent Orders Table */}
          <div className="bg-white rounded-3xl shadow-[0_2px_20px_-4px_rgba(0,0,0,0.02)] border border-gray-100 overflow-hidden">
            <div className="p-6 md:p-8 border-b border-gray-100 flex items-center justify-between">
              <h3 className="font-display font-bold text-xl text-gray-900">Recent Transactions</h3>
              <Link to="/orders" className="text-amber-700 text-sm font-bold hover:text-amber-900 transition-colors flex items-center gap-1">
                View All <ExternalLink className="w-4 h-4" />
              </Link>
            </div>
            
            <div className="overflow-x-auto">
              {stats.recentOrders.length === 0 ? (
                <div className="p-8 text-center text-gray-500 flex flex-col items-center">
                  <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-3">
                    <Clock className="w-8 h-8 text-gray-300" />
                  </div>
                  <p>No recent orders found.</p>
                </div>
              ) : (
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-gray-50/50">
                      <th className="py-4 px-6 text-xs font-bold text-gray-500 uppercase tracking-wider border-b border-gray-100">Order ID</th>
                      <th className="py-4 px-6 text-xs font-bold text-gray-500 uppercase tracking-wider border-b border-gray-100">Customer</th>
                      <th className="py-4 px-6 text-xs font-bold text-gray-500 uppercase tracking-wider border-b border-gray-100">Status</th>
                      <th className="py-4 px-6 text-xs font-bold text-gray-500 uppercase tracking-wider border-b border-gray-100 text-right">Revenue</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {stats.recentOrders.map((order) => (
                      <tr key={order.id} className="hover:bg-gray-50/50 transition-colors group">
                        <td className="py-4 px-6">
                          <span className="font-mono text-xs font-medium text-gray-600 bg-gray-100 px-2 py-1 rounded">
                            {order.id.split('-')[0]}
                          </span>
                        </td>
                        <td className="py-4 px-6">
                          <p className="font-medium text-gray-900">{order.customer_name || 'Guest User'}</p>
                          <p className="text-xs text-gray-500">{order.customer_email || 'No email'}</p>
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
                        <td className="py-4 px-6 text-right font-bold text-gray-900">
                          ₹{(order.sellerRevenue || 0).toLocaleString('en-IN')}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Top Products Widget */}
        <div className="space-y-8">
          <div className="bg-white rounded-3xl shadow-[0_2px_20px_-4px_rgba(0,0,0,0.02)] border border-gray-100 overflow-hidden">
            <div className="p-6 md:p-8 border-b border-gray-100 flex items-center justify-between bg-gradient-to-br from-amber-50/50 to-white">
              <h3 className="font-display font-bold text-lg text-gray-900">Top Rated Products</h3>
              <Star className="w-5 h-5 text-amber-400 fill-amber-400" />
            </div>
            
            <div className="p-4">
              {stats.topProducts.length === 0 ? (
                <p className="text-center text-gray-500 py-4 text-sm">No products listed yet.</p>
              ) : (
                <div className="space-y-4">
                  {stats.topProducts.map((product, idx) => (
                    <Link to="/products" key={product.id} className="flex items-center gap-4 p-3 rounded-2xl hover:bg-gray-50 transition-colors group">
                      <div className="w-16 h-16 rounded-xl bg-gray-100 overflow-hidden relative flex-shrink-0 border border-gray-200">
                        {product.image ? (
                          <img src={product.image} alt={product.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                        ) : (
                          <Package className="w-6 h-6 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-gray-400" />
                        )}
                        <div className="absolute top-1 left-1 w-5 h-5 bg-black/60 backdrop-blur-sm text-white rounded-md flex items-center justify-center text-[10px] font-bold">
                          #{idx + 1}
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-gray-900 text-sm truncate group-hover:text-amber-800 transition-colors">{product.name}</p>
                        <p className="text-xs text-gray-500 mt-1 truncate">{product.category || 'Uncategorized'}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-gray-900 text-sm">₹{product.price}</p>
                        <div className="flex items-center gap-1 text-xs text-amber-600 mt-1 font-medium">
                          <Star className="w-3 h-3 fill-current" />
                          {product.rating || '5.0'}
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>
            
            <div className="p-4 border-t border-gray-100 bg-gray-50/50 text-center">
              <Link to="/products" className="text-xs font-bold text-gray-500 hover:text-amber-800 uppercase tracking-wider transition-colors">
                Manage Inventory
              </Link>
            </div>
          </div>
        </div>

      </div>

      <style>{`
        @keyframes growUp {
          to { height: 100%; }
        }
      `}</style>
    </div>
  );
};
