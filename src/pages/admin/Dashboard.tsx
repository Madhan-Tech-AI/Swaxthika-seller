import { TrendingUp, Users, ShoppingBag, DollarSign, Package, Download, RefreshCw } from 'lucide-react';
import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Link } from 'react-router-dom';

export function Dashboard() {
  const [stats, setStats] = useState({ revenue: 0, orders: 0, customers: 0, lowStock: 0 });
  const [recentOrders, setRecentOrders] = useState<any[]>([]);
  const [topProducts, setTopProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const [{ count: lowStockCount }, { data: productsData }, { data: ordersData }, { count: customersCount }] = await Promise.all([
        supabase.from('products').select('*', { count: 'exact', head: true }).lt('stock', 10),
        supabase.from('products').select('*').order('created_at', { ascending: false }).limit(4),
        supabase.from('orders').select('*').order('created_at', { ascending: false }).limit(5),
        supabase.from('profiles').select('*', { count: 'exact', head: true }),
      ]);

      const { data: allOrders } = await supabase.from('orders').select('total_amount, status');
      const revenue = (allOrders || []).filter(o => o.status !== 'Cancelled').reduce((s: number, o: any) => s + (o.total_amount || 0), 0);

      setStats({
        revenue,
        orders: ordersData ? ordersData.length : 0,
        customers: customersCount || 0,
        lowStock: lowStockCount || 0,
      });
      if (productsData) setTopProducts(productsData);
      if (ordersData) setRecentOrders(ordersData);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
    const channel = supabase.channel('dashboard-rt')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'orders' }, () => fetchDashboardData())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  const STATS_UI = [
    { name: 'Total Revenue', value: `₹${stats.revenue.toLocaleString()}`, change: '0%', icon: DollarSign, trend: 'up' },
    { name: 'Total Orders', value: stats.orders.toString(), change: '0%', icon: ShoppingBag, trend: 'up' },
    { name: 'Active Customers', value: stats.customers.toString(), change: '0%', icon: Users, trend: 'up' },
    { name: 'Low Stock Items', value: stats.lowStock.toString(), change: '0%', icon: Package, trend: 'down' },
  ];

  if (loading) {
    return <div className="p-8 flex items-center justify-center"><div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div></div>;
  }

  const handleDownloadReport = () => {
    const rows = [
      ['Metric', 'Value'],
      ['Total Revenue', `Rs ${stats.revenue}`],
      ['Total Orders', stats.orders],
      ['Customers', stats.customers],
      ['Low Stock Items', stats.lowStock],
    ];
    const csv = rows.map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `dashboard_report_${new Date().toISOString().split('T')[0]}.csv`; a.click();
    URL.revokeObjectURL(url);
  };

  const STATUS_COLORS: Record<string, string> = {
    Pending: 'bg-yellow-50 text-yellow-700 border-yellow-200',
    Processing: 'bg-blue-50 text-blue-700 border-blue-200',
    Shipped: 'bg-purple-50 text-purple-700 border-purple-200',
    Delivered: 'bg-green-50 text-green-700 border-green-200',
    Cancelled: 'bg-red-50 text-red-700 border-red-200',
  };

  if (loading) return <div className="p-8 flex items-center justify-center"><div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div></div>;

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold text-foreground">Dashboard Overview</h1>
          <p className="text-foreground/60 text-sm mt-1 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-green-400 inline-block animate-pulse"></span>
            Live · updates in real-time
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={fetchDashboardData} className="p-2 border border-gray-300 rounded-md text-foreground/70 hover:bg-gray-50" title="Refresh">
            <RefreshCw className="w-4 h-4" />
          </button>
          <button onClick={handleDownloadReport} className="bg-primary text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-primary-600 transition-colors flex items-center gap-2">
            <Download className="w-4 h-4" /> Download Report
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {STATS_UI.map((stat) => (
          <div key={stat.name} className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                <stat.icon className="w-5 h-5" />
              </div>
              <span className={`text-sm font-medium flex items-center gap-1 ${stat.trend === 'up' ? 'text-green-600' : 'text-red-600'}`}>
                {stat.change} <TrendingUp className={`w-3 h-3 ${stat.trend === 'down' ? 'rotate-180' : ''}`} />
              </span>
            </div>
            <h3 className="text-gray-500 text-sm font-medium mb-1">{stat.name}</h3>
            <p className="text-2xl font-bold text-foreground">{stat.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        <div className="xl:col-span-2 bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-gray-200 flex items-center justify-between">
            <h2 className="text-lg font-bold text-foreground">Recent Orders</h2>
            <Link to="/admin/orders" className="text-primary text-sm font-medium hover:underline">View All →</Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 text-foreground/60 font-medium">
                <tr>
                  <th className="px-6 py-3">Order ID</th>
                  <th className="px-6 py-3">Customer</th>
                  <th className="px-6 py-3">Date</th>
                  <th className="px-6 py-3">Amount</th>
                  <th className="px-6 py-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {recentOrders.length === 0 ? (
                  <tr><td colSpan={5} className="px-6 py-8 text-center text-foreground/50">No orders yet. Place a test order to see it here!</td></tr>
                ) : recentOrders.map((order) => (
                  <tr key={order.id} className="hover:bg-gray-50/50">
                    <td className="px-6 py-4 font-mono font-medium text-primary text-xs">#{order.id.split('-')[0].toUpperCase()}</td>
                    <td className="px-6 py-4 text-foreground">{order.customer_name || '—'}</td>
                    <td className="px-6 py-4 text-foreground/70">{new Date(order.created_at).toLocaleDateString('en-IN')}</td>
                    <td className="px-6 py-4 font-bold text-foreground">₹{order.total_amount}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-medium border ${STATUS_COLORS[order.status] || 'bg-gray-50 text-gray-600 border-gray-200'}`}>
                        {order.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Top Products */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
          <h2 className="text-lg font-bold text-foreground mb-6">Top Selling Products</h2>
          <div className="space-y-6">
            {topProducts.length === 0 ? (
              <div className="text-center text-foreground/50 py-4">No products found.</div>
            ) : topProducts.map((product) => (
              <div key={product.id} className="flex items-center gap-4">
                <img 
                  src={product.image || `https://images.unsplash.com/photo-1629813589437-0176045d62b9?auto=format&fit=crop&q=80&w=100`} 
                  alt={product.name} 
                  className="w-12 h-12 rounded object-cover bg-gray-100" 
                />
                <div className="flex-1 min-w-0">
                  <h4 className="text-sm font-medium text-foreground truncate">{product.name}</h4>
                  <p className="text-xs text-foreground/50 mt-1">{product.stock || 0} in stock</p>
                </div>
                <div className="text-sm font-bold text-foreground">
                  ₹{product.price}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
