import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, Lock, LogIn, Sparkles } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useToast } from '../../context/ToastContext';

export function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { showToast } = useToast();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      showToast('error', 'Incomplete Details', 'Please fill in both email and password.');
      return;
    }

    setIsLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password: password.trim(),
      });

      if (error) throw error;

      showToast('success', 'Logged In', 'Welcome to the Swaxtika Admin Portal');
      navigate('/admin');
    } catch (err: any) {
      showToast('error', 'Access Denied', err.message || 'Incorrect credentials. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FAF9F6] flex items-center justify-center p-6 selection:bg-primary-100 selection:text-primary-900 font-sans">
      <div className="w-full max-w-5xl h-[640px] bg-white rounded-3xl overflow-hidden flex shadow-premium hover:shadow-premium-hover transition-all duration-500 border border-black/5">
        
        {/* Left Visual Column */}
        <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-primary-500 via-primary-400 to-secondary relative p-12 flex-col justify-between overflow-hidden">
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
            <p className="mt-4 text-white/90 text-sm max-w-sm font-sans leading-relaxed">
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
                    <Mail className="h-5 w-5 text-gray-400 group-focus-within:text-primary-500" />
                  </div>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="block w-full pl-12 pr-4 py-3.5 border border-black/10 rounded-xl bg-background/30 text-foreground placeholder-gray-400 focus:bg-white focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500 transition-all duration-300 text-sm shadow-sm"
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
                    <Lock className="h-5 w-5 text-gray-400 group-focus-within:text-primary-500" />
                  </div>
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="block w-full pl-12 pr-4 py-3.5 border border-black/10 rounded-xl bg-background/30 text-foreground placeholder-gray-400 focus:bg-white focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500 transition-all duration-300 text-sm shadow-sm"
                    placeholder="••••••••"
                  />
                </div>
              </div>

              {/* Action Submit */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full h-12 flex items-center justify-center gap-3 bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 text-white font-bold rounded-xl shadow-md hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-all duration-300 transform active:scale-[0.98] mt-8 select-none disabled:opacity-75"
              >
                {isLoading ? (
                  <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                ) : (
                  <>
                    <LogIn className="w-5 h-5" />
                    <span>Access Admin Console</span>
                  </>
                )}
              </button>
            </form>
          </div>
        </div>

      </div>
    </div>
  );
}
