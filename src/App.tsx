import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Navigate } from 'react-router-dom';
import { SellerLayout } from './layouts/SellerLayout';
import { SellerDashboard } from './pages/seller/Dashboard';
import { SellerApplications } from './pages/admin/SellerApplications';
import { BannersManager } from './pages/admin/BannersManager';

import { AdminLayout } from './layouts/AdminLayout';
import { Dashboard } from './pages/admin/Dashboard';
import { Products } from './pages/admin/Products';
import { Orders } from './pages/admin/Orders';
import { Customers } from './pages/admin/Customers';
import { Settings } from './pages/admin/Settings';
import { CarouselManager } from './pages/admin/CarouselManager';
import { ToastProvider } from './context/ToastContext';
import { AuthProvider } from './context/AuthContext';
import { AuthModal } from './components/AuthModal';
import { ProtectedRoute } from './components/ProtectedRoute';

function App() {
  return (
    <ToastProvider>
      <AuthProvider>
        <AuthModal />
        <Router>
        <Routes>
        <Route path="/" element={<Navigate to="/admin" replace />} />
        
        <Route path="/admin" element={<ProtectedRoute><AdminLayout /></ProtectedRoute>}>
          <Route index element={<Dashboard />} />
          <Route path="products" element={<Products />} />
          <Route path="orders" element={<Orders />} />
          <Route path="customers" element={<Customers />} />
          <Route path="carousel" element={<CarouselManager />} />
          <Route path="banners" element={<BannersManager />} />
          <Route path="seller-applications" element={<SellerApplications />} />
          <Route path="settings" element={<Settings />} />
        </Route>

        <Route path="/seller" element={<ProtectedRoute><SellerLayout /></ProtectedRoute>}>
          <Route index element={<SellerDashboard />} />
        </Route>
        </Routes>
        </Router>
      </AuthProvider>
    </ToastProvider>
  );
}

export default App;
