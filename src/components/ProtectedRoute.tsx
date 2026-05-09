import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
<<<<<<< HEAD
    if (!isLoading) {
      if (!user) {
        navigate('/login');
      } else if (user.user_metadata?.role !== 'seller') {
        // Not a seller, sign out and redirect
        supabase.auth.signOut().then(() => {
          navigate('/login');
        });
      }
=======
    if (!isLoading && !user) {
      navigate('/login');
>>>>>>> 04fc0f1d35e1087a58ef766938a8d8e292ad3de9
    }
  }, [user, isLoading, navigate]);

  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return user && user.user_metadata?.role === 'seller' ? <>{children}</> : null;
}

