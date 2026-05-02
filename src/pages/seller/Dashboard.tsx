import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Package, IndianRupee, TrendingUp, ShoppingBag, Plus } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export const SellerDashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    totalProducts: 0,
    totalOrders: 0,
    revenue: 0,
  });

  useEffect(() => {
    if (user) {
      // In a full implementation, we'd filter by seller_id = user.id
      setStats({
        totalProducts: 12,
        totalOrders: 45,
        revenue: 85400,
      });
    }
  }, [user]);

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold text-amber-900 tracking-tight">Store Overview</h1>
          <p className="text-stone-500 mt-2">Welcome back! Here's what's happening with your store today.</p>
        </div>
        <button className="bg-amber-900 text-white px-6 py-2.5 rounded-lg hover:bg-amber-950 transition-colors flex items-center gap-2 shadow-sm font-medium">
          <Plus className="w-5 h-5" /> Add New Product
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-stone-100 flex items-center gap-6">
          <div className="w-14 h-14 bg-amber-50 rounded-xl flex items-center justify-center text-amber-600">
            <IndianRupee className="w-7 h-7" />
          </div>
          <div>
            <p className="text-stone-500 text-sm font-medium">Total Revenue</p>
            <h3 className="text-3xl font-bold text-stone-900">₹{stats.revenue.toLocaleString('en-IN')}</h3>
            <p className="text-emerald-600 text-xs font-medium mt-1 flex items-center gap-1"><TrendingUp className="w-3 h-3"/> +12% this month</p>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-stone-100 flex items-center gap-6">
          <div className="w-14 h-14 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600">
            <ShoppingBag className="w-7 h-7" />
          </div>
          <div>
            <p className="text-stone-500 text-sm font-medium">Total Orders</p>
            <h3 className="text-3xl font-bold text-stone-900">{stats.totalOrders}</h3>
            <p className="text-emerald-600 text-xs font-medium mt-1 flex items-center gap-1"><TrendingUp className="w-3 h-3"/> +5% this month</p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-stone-100 flex items-center gap-6">
          <div className="w-14 h-14 bg-purple-50 rounded-xl flex items-center justify-center text-purple-600">
            <Package className="w-7 h-7" />
          </div>
          <div>
            <p className="text-stone-500 text-sm font-medium">Active Products</p>
            <h3 className="text-3xl font-bold text-stone-900">{stats.totalProducts}</h3>
            <p className="text-stone-400 text-xs font-medium mt-1">Ready for sale</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-stone-100 h-96 flex flex-col justify-center items-center text-center">
           <p className="text-stone-400 mb-2">Sales Chart Placeholder</p>
           <TrendingUp className="w-12 h-12 text-stone-200" />
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-stone-100 h-96 overflow-hidden flex flex-col">
           <h3 className="font-bold text-lg text-stone-900 mb-4">Recent Orders</h3>
           <div className="flex-1 flex justify-center items-center">
             <p className="text-stone-400 text-sm">No recent orders to show.</p>
           </div>
        </div>
      </div>
    </div>
  );
};
