import React, { useState } from 'react';
import { Outlet, NavLink, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LayoutDashboard, Package, ShoppingBag, Settings, LogOut, Store, Search, Bell, X } from 'lucide-react';

const NAV_ITEMS = [
  { name: 'Dashboard', path: '/', icon: LayoutDashboard },
  { name: 'My Products', path: '/products', icon: Package },
  { name: 'Orders', path: '/orders', icon: ShoppingBag },
  { name: 'Settings', path: '/settings', icon: Settings },
];

export const SellerLayout = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [showNotif, setShowNotif] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  const handleLogout = async () => {
    await signOut();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-gray-50 flex font-sans">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-gray-200 flex flex-col hidden lg:flex">
        <div className="h-20 flex items-center px-6 border-b border-gray-200">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-amber-900 text-white rounded-md flex items-center justify-center font-display font-bold">
              S
            </div>
            <span className="font-display font-bold tracking-tight text-amber-950 text-lg">
              Seller Hub
            </span>
          </Link>
        </div>

        <div className="flex-1 overflow-y-auto py-6">
          <nav className="space-y-1 px-4">
            {NAV_ITEMS.map((item) => {
              return (
                <NavLink
                  key={item.name}
                  to={item.path}
                  end={item.path === '/'}
                  className={({ isActive }) => `flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-amber-900/10 text-amber-900'
                      : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                  }`}
                >
                  <item.icon className="w-5 h-5" />
                  {item.name}
                </NavLink>
              );
            })}
          </nav>
        </div>

        <div className="p-4 border-t border-gray-200">
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-3 py-2.5 w-full rounded-md text-sm font-medium text-red-600 hover:bg-red-50 transition-colors"
          >
            <LogOut className="w-5 h-5" />
            Logout
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Header */}
        <header className="h-20 bg-white border-b border-gray-200 flex items-center justify-between px-6 flex-shrink-0">
          <div className="flex items-center gap-4 flex-1">
            <div className="relative w-full max-w-md hidden md:block">
              <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search products, orders..."
                className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-md bg-gray-50 focus:bg-white focus:outline-none focus:border-amber-800 transition-colors text-sm"
              />
            </div>
          </div>
          <div className="flex items-center gap-4">
            {/* Notification Bell */}
            <div className="relative">
              <button
                onClick={() => setShowNotif(!showNotif)}
                className="relative p-2 text-gray-600 hover:text-amber-900 transition-colors"
              >
                <Bell className="w-5 h-5" />
              </button>

              {/* Dropdown */}
              {showNotif && (
                <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-2xl shadow-2xl border border-gray-100 z-50 animate-in fade-in slide-in-from-top-2">
                  <div className="flex items-center justify-between p-4 border-b border-gray-100">
                    <h3 className="font-bold text-gray-900 text-sm">Notifications</h3>
                    <button onClick={() => setShowNotif(false)} className="p-1 text-gray-400 hover:text-gray-600 rounded-md">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="p-4 text-center text-gray-500 text-sm">
                    No new notifications
                  </div>
                </div>
              )}
            </div>

            {/* Profile Menu */}
            <div className="relative">
              <button
                onClick={() => setShowProfileMenu(!showProfileMenu)}
                className="w-9 h-9 rounded-full bg-amber-900/20 border border-amber-900/30 flex items-center justify-center text-amber-900 font-medium text-sm hover:bg-amber-900/30 transition-colors"
              >
                {user?.user_metadata?.first_name?.charAt(0) || 'S'}
              </button>

              {showProfileMenu && (
                <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-xl shadow-xl border border-gray-100 z-50 overflow-hidden animate-in fade-in slide-in-from-top-2">
                  <div className="px-4 py-3 border-b border-gray-100">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {user?.user_metadata?.first_name || 'Seller'} {user?.user_metadata?.last_name || ''}
                    </p>
                    <p className="text-xs text-gray-500 truncate mt-0.5">{user?.email}</p>
                  </div>
                  <div className="p-1">
                    <button
                      onClick={handleLogout}
                      className="flex items-center w-full gap-2 px-3 py-2 text-sm text-red-600 rounded-md hover:bg-red-50 transition-colors"
                    >
                      <LogOut className="w-4 h-4" />
                      Logout
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Dynamic Content */}
        <main className="flex-1 overflow-y-auto p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
