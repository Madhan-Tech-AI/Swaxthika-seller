import { LayoutDashboard, ShoppingBag, Users, Package, Settings, LogOut, Search, Bell, Lock, Image, X, Store, FileImage, Sparkles, LogIn, Mail, Layout } from 'lucide-react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

const ADMIN_SESSION_KEY = 'swaxtika_admin_auth';

export function AdminLayout() {
  const location = useLocation();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isCheckingSession, setIsCheckingSession] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);

  console.log('[AdminLayout] Render called, isCheckingSession:', isCheckingSession);

  // Real-time notification state
  const [newOrderCount, setNewOrderCount] = useState(0);
  const [showNotif, setShowNotif] = useState(false);
  const [recentNotifs, setRecentNotifs] = useState<any[]>([]);

  // Check for existing Supabase session on mount
  useEffect(() => {
    const checkAdmin = async (userId: string) => {
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('role, is_admin')
          .eq('id', userId)
          .single();

        if (error) {
          console.error('[Admin Auth] Error checking profile:', error);
          return false;
        }
        return data?.role === 'admin' || data?.is_admin === true;
      } catch (err) {
        return false;
      }
    };

    console.log('[Admin Auth] useEffect started');

    // Fallback timeout to prevent infinite loading if getSession hangs
    const timeoutId = setTimeout(() => {
      console.warn('[Admin Auth] Session check timed out, forcing load complete');
      setIsCheckingSession(false);
    }, 3000);

    supabase.auth.getSession().then(async ({ data: { session } }) => {
      console.log('[Admin Auth] getSession resolved, session:', session ? 'exists' : 'null');
      try {
        if (session?.user) {
          console.log('[Admin Auth] Calling checkAdmin for user', session.user.id);
          const isAdmin = await checkAdmin(session.user.id);
          console.log('[Admin Auth] checkAdmin result:', isAdmin);
          if (isAdmin) {
            setIsAuthenticated(true);
          } else {
            console.log('[Admin Auth] Not admin, signing out');
            await supabase.auth.signOut().catch(e => console.error(e));
            setIsAuthenticated(false);
          }
        } else {
          setIsAuthenticated(false);
        }
      } catch (error) {
        console.error('[Admin Auth] Session check error:', error);
        setIsAuthenticated(false);
      } finally {
        console.log('[Admin Auth] Setting isCheckingSession to false');
        clearTimeout(timeoutId);
        setIsCheckingSession(false);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('[Admin Auth] onAuthStateChange fired! Event:', event, 'Session:', session ? 'exists' : 'null');

      // FIRE AND FORGET - DO NOT AWAIT HERE!
      // Awaiting here causes a deadlock because supabase.from() calls getSession(),
      // which waits for the auth state change lock to release.
      if (session?.user) {
        checkAdmin(session.user.id).then((isAdmin) => {
          if (isAdmin) {
            setIsAuthenticated(true);
          } else {
            supabase.auth.signOut().catch(() => { });
            setIsAuthenticated(false);
          }
        }).catch((error) => {
          console.error('Auth state change checkAdmin error:', error);
          setIsAuthenticated(false);
        });
      } else {
        setIsAuthenticated(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoginLoading(true);

    console.log('[Admin Auth] Starting login process...');

    const loginTimeout = setTimeout(() => {
      console.warn('[Admin Auth] Login process hung for 10s!');
      setLoginLoading(false);
      setError('Login request timed out. Please check your connection.');
    }, 10000);

    try {
      console.log('[Admin Auth] Calling signInWithPassword...');
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      console.log('[Admin Auth] signInWithPassword returned. Error:', signInError ? signInError.message : 'None');

      if (signInError) {
        setError(signInError.message);
        clearTimeout(loginTimeout);
        return;
      }

      if (data.session?.user) {
        console.log('[Admin Auth] Session exists. Checking profile role...');
        // Double check admin role before allowing entry
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('role, is_admin')
          .eq('id', data.user.id)
          .single();

        console.log('[Admin Auth] Profile check returned. Profile:', profile, 'Error:', profileError?.message);

        if (profileError || (!profile?.is_admin && profile?.role !== 'admin')) {
          console.log('[Admin Auth] Access Denied. Signing out...');
          await supabase.auth.signOut().catch(() => { });
          setError('Access Denied. You do not have administrator privileges.');
          clearTimeout(loginTimeout);
          return;
        }

        console.log('[Admin Auth] Setting isAuthenticated to true');
        setIsAuthenticated(true);
        console.log('[Admin Auth] Signed in as:', data.user.email, '| UID:', data.user.id);
      }
    } catch (err: any) {
      console.error('[Admin Auth] Login try-catch error:', err);
      setError(err.message || 'An unexpected error occurred');
    } finally {
      console.log('[Admin Auth] Login finally block reached');
      clearTimeout(loginTimeout);
      setLoginLoading(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setIsAuthenticated(false);
    setEmail('');
    setPassword('');
  };

  // Real-time: listen for new orders, update notification badge
  useEffect(() => {
    if (!isAuthenticated) return;

    // Fetch last 5 orders for notification panel
    const fetchRecentOrders = async () => {
      const { data } = await supabase
        .from('orders')
        .select('id, customer_name, total_amount, status, created_at')
        .order('created_at', { ascending: false })
        .limit(5);
      if (data) setRecentNotifs(data);
    };
    fetchRecentOrders();

    const channel = supabase
      .channel('admin-notifications')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'orders' }, (payload) => {
        setNewOrderCount((c) => c + 1);
        setRecentNotifs((prev) => [payload.new, ...prev].slice(0, 5));
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'orders' }, (payload) => {
        setRecentNotifs((prev) => prev.map((n) => n.id === payload.new.id ? payload.new : n));
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [isAuthenticated]);

  const handleBellClick = () => {
    setShowNotif(!showNotif);
    if (!showNotif) setNewOrderCount(0); // clear badge when opened
  };

  const NAV_ITEMS = [
    { name: 'Dashboard', path: '/admin', icon: LayoutDashboard },
    { name: 'Orders', path: '/admin/orders', icon: ShoppingBag },
    { name: 'Products', path: '/admin/products', icon: Package },
    { name: 'Customers', path: '/admin/customers', icon: Users },
    { name: 'Carousel', path: '/admin/carousel', icon: Image },
    { name: 'Home Layout', path: '/admin/layout', icon: Layout },
    { name: 'Sellers', path: '/admin/seller-applications', icon: Store },
    { name: 'Settings', path: '/admin/settings', icon: Settings },
  ];

  // Show spinner while checking if user has an existing session
  if (isCheckingSession) {
    return (
      <div className="min-h-screen bg-[#FAF9F6] flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#FAF9F6] flex items-center justify-center p-6 selection:bg-primary-100 selection:text-primary-900 font-sans">
        <div className="w-full max-w-5xl h-[640px] bg-white rounded-3xl overflow-hidden flex shadow-premium hover:shadow-premium-hover transition-all duration-500 border border-black/5">

          {/* Left Visual Column */}
          <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-primary via-primary/80 to-secondary relative p-12 flex-col justify-between overflow-hidden">
            <div className="absolute inset-0 bg-black/10 mix-blend-overlay"></div>
            <div className="absolute -top-32 -right-32 w-80 h-80 bg-accent/20 rounded-full blur-3xl"></div>
            <div className="absolute -bottom-32 -left-32 w-80 h-80 bg-secondary/30 rounded-full blur-3xl"></div>

            {/* Swaxtika Brand/Slogan */}
            <div className="relative z-10">
              <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-md px-4 py-2 rounded-full border border-white/30 mb-8 animate-fade-in">
                <Sparkles className="w-4 h-4 text-accent" />
                <span className="text-xs font-bold font-display uppercase tracking-wider text-white">Administrator Portal</span>
              </div>
              <h1 className="text-4xl lg:text-5xl font-display font-extrabold text-white leading-tight">
                Manage the <span className="text-accent">Swaxtika</span> ecosystem with ease.
              </h1>
              <p className="mt-4 text-white/90 text-sm font-sans leading-relaxed">
                Log in to access complete dashboard controls, view metrics, approve sellers, and manage all your platform data in one place.
              </p>
            </div>

            <div className="relative z-10 flex items-center justify-between border-t border-white/20 pt-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-white/20 backdrop-blur-md border border-white/30 rounded-2xl flex items-center justify-center font-display font-bold text-2xl text-white shadow-inner select-none">
                  S
                </div>
                <div>
                  <div className="text-white text-base font-display font-bold leading-none">Swaxtika</div>
                  <div className="text-white/60 text-xs mt-1">Swaxthika Commerce</div>
                </div>
              </div>
              <div className="text-white/40 text-xs font-display tracking-widest font-bold">
                EST. 2026
              </div>
            </div>
          </div>

          {/* Right Form Column */}
          <div className="w-full lg:w-1/2 p-10 flex flex-col justify-center relative bg-white">
            <div className="max-w-md mx-auto w-full">
              <div className="mb-10 text-center lg:text-left">
                <h2 className="text-3xl font-display font-extrabold text-foreground tracking-tight">
                  Portal Access
                </h2>
                <p className="text-gray-500 text-sm mt-2">
                  Sign in using your administrator credentials below.
                </p>
              </div>

              <form onSubmit={handleLogin} className="space-y-6">
                {/* Email Input */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-foreground uppercase tracking-wider">Email Address</label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none transition-colors duration-300">
                      <Mail className="h-5 w-5 text-gray-400 group-focus-within:text-primary" />
                    </div>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="block w-full pl-12 pr-4 py-3.5 border border-black/10 rounded-xl bg-background/30 text-foreground placeholder-gray-400 focus:bg-white focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all duration-300 text-sm shadow-sm"
                      placeholder="Admin@swaxthika.com"
                    />
                  </div>
                </div>

                {/* Password Input */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-foreground uppercase tracking-wider">Password</label>
                  </div>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none transition-colors duration-300">
                      <Lock className="h-5 w-5 text-gray-400 group-focus-within:text-primary" />
                    </div>
                    <input
                      type="password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="block w-full pl-12 pr-4 py-3.5 border border-black/10 rounded-xl bg-background/30 text-foreground placeholder-gray-400 focus:bg-white focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all duration-300 text-sm shadow-sm"
                      placeholder="••••••••"
                    />
                  </div>
                </div>

                {error && (
                  <div className="p-3 bg-red-50 text-red-600 text-sm rounded-lg border border-red-100 text-center">
                    {error}
                  </div>
                )}

                {/* Action Submit */}
                <button
                  type="submit"
                  disabled={loginLoading}
                  className="w-full h-12 flex items-center justify-center gap-3 bg-gradient-to-r from-primary to-primary-600 hover:from-primary-600 hover:to-primary text-white font-bold rounded-xl shadow-md hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-all duration-300 transform active:scale-[0.98] mt-8 select-none disabled:opacity-75"
                >
                  {loginLoading ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    <LogIn className="w-5 h-5" />
                  )}
                  <span>{loginLoading ? 'Signing in...' : 'Access Admin Console'}</span>
                </button>
              </form>
            </div>
          </div>

        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex font-sans">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-gray-200 flex flex-col hidden lg:flex">
        <div className="h-20 flex items-center px-6 border-b border-gray-200">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary text-white rounded-md flex items-center justify-center font-display font-bold">
              S
            </div>
            <span className="font-display font-bold tracking-tight text-foreground text-lg">
              Swaxthika Admin
            </span>
          </Link>
        </div>

        <div className="flex-1 overflow-y-auto py-6">
          <nav className="space-y-1 px-4">
            {NAV_ITEMS.map((item) => {
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.name}
                  to={item.path}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors ${isActive
                      ? 'bg-primary/10 text-primary'
                      : 'text-foreground/70 hover:bg-gray-100 hover:text-foreground'
                    }`}
                >
                  <item.icon className="w-5 h-5" />
                  {item.name}
                </Link>
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
        <header className="h-20 bg-white border-b border-gray-200 flex items-center justify-between px-6">
          <div className="flex items-center gap-4 flex-1">
            <div className="relative w-full max-w-md hidden md:block">
              <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search orders, products..."
                className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-md bg-gray-50 focus:bg-white focus:outline-none focus:border-primary transition-colors text-sm"
              />
            </div>
          </div>
          <div className="flex items-center gap-4">
            {/* Notification Bell */}
            <div className="relative">
              <button
                onClick={handleBellClick}
                className="relative p-2 text-foreground/70 hover:text-primary transition-colors"
              >
                <Bell className="w-5 h-5" />
                {newOrderCount > 0 && (
                  <span className="absolute top-0.5 right-0.5 min-w-[18px] h-[18px] bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1 animate-pulse">
                    {newOrderCount > 9 ? '9+' : newOrderCount}
                  </span>
                )}
              </button>

              {/* Notification Dropdown */}
              {showNotif && (
                <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-2xl shadow-2xl border border-gray-100 z-50 animate-in fade-in slide-in-from-top-2">
                  <div className="flex items-center justify-between p-4 border-b border-gray-100">
                    <h3 className="font-bold text-foreground text-sm">Recent Orders</h3>
                    <button onClick={() => setShowNotif(false)} className="p-1 text-gray-400 hover:text-gray-600 rounded-md">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="divide-y divide-gray-50 max-h-72 overflow-y-auto">
                    {recentNotifs.length === 0 ? (
                      <p className="text-center text-foreground/40 text-sm py-6">No orders yet</p>
                    ) : recentNotifs.map((order) => (
                      <Link
                        key={order.id}
                        to="/admin/orders"
                        onClick={() => setShowNotif(false)}
                        className="flex items-center gap-3 p-4 hover:bg-gray-50 transition-colors"
                      >
                        <div className="w-9 h-9 rounded-full bg-primary/10 text-primary flex items-center justify-center flex-shrink-0 text-sm font-bold">
                          {(order.customer_name || 'U')[0].toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-foreground text-sm truncate">{order.customer_name || 'Guest'}</p>
                          <p className="text-xs text-foreground/50">
                            ₹{order.total_amount} · {new Date(order.created_at).toLocaleDateString('en-IN')}
                          </p>
                        </div>
                        <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${order.status === 'Delivered' ? 'bg-green-100 text-green-700' :
                            order.status === 'Shipped' ? 'bg-purple-100 text-purple-700' :
                              order.status === 'Processing' ? 'bg-blue-100 text-blue-700' :
                                'bg-yellow-100 text-yellow-700'
                          }`}>
                          {order.status}
                        </span>
                      </Link>
                    ))}
                  </div>
                  <div className="p-3 border-t border-gray-100">
                    <Link
                      to="/admin/orders"
                      onClick={() => setShowNotif(false)}
                      className="block text-center text-primary text-sm font-bold hover:text-primary-600 transition-colors"
                    >
                      View All Orders →
                    </Link>
                  </div>
                </div>
              )}
            </div>

            <div className="w-9 h-9 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center text-primary font-medium text-sm">
              AD
            </div>
          </div>
        </header>

        {/* Dashboard Content */}
        <main className="flex-1 overflow-y-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
