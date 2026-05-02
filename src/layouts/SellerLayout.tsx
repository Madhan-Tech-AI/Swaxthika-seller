import React from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LayoutDashboard, Package, ShoppingBag, Settings, LogOut, Store } from 'lucide-react';

export const SellerLayout = () => {
  const { signOut } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await signOut();
    navigate('/');
  };

  return (
    <div className="flex h-screen bg-stone-50 font-serif">
      <aside className="w-64 bg-amber-900 text-stone-100 flex flex-col">
        <div className="p-6">
          <h1 className="text-2xl font-bold tracking-wider flex items-center gap-2">
            <Store className="w-6 h-6 text-amber-400" />
            Seller Hub
          </h1>
          <p className="text-amber-200/60 text-xs mt-1">Sacred Shoppe Platform</p>
        </div>
        <nav className="flex-1 px-4 space-y-2 mt-4">
          <NavLink to="/seller" end className={({isActive}) => `flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${isActive ? 'bg-amber-800 text-amber-50' : 'hover:bg-amber-800/50 text-amber-200'}`}>
            <LayoutDashboard className="w-5 h-5" /> Dashboard
          </NavLink>
          <NavLink to="/seller/products" className={({isActive}) => `flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${isActive ? 'bg-amber-800 text-amber-50' : 'hover:bg-amber-800/50 text-amber-200'}`}>
            <Package className="w-5 h-5" /> My Products
          </NavLink>
          <NavLink to="/seller/orders" className={({isActive}) => `flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${isActive ? 'bg-amber-800 text-amber-50' : 'hover:bg-amber-800/50 text-amber-200'}`}>
            <ShoppingBag className="w-5 h-5" /> Orders
          </NavLink>
          <NavLink to="/seller/settings" className={({isActive}) => `flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${isActive ? 'bg-amber-800 text-amber-50' : 'hover:bg-amber-800/50 text-amber-200'}`}>
            <Settings className="w-5 h-5" /> Store Settings
          </NavLink>
        </nav>
        <div className="p-4 border-t border-amber-800">
          <button onClick={handleLogout} className="flex items-center gap-3 px-4 py-3 w-full text-left rounded-lg text-amber-200 hover:bg-amber-800 transition-colors">
            <LogOut className="w-5 h-5" /> Logout
          </button>
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto p-8">
        <Outlet />
      </main>
    </div>
  );
};
