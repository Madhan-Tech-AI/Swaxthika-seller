import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
<<<<<<< HEAD
import { SellerLayout } from './layouts/SellerLayout';
import { SellerDashboard } from './pages/seller/Dashboard';
import { SellerProducts } from './pages/seller/Products';
import { SellerOrders } from './pages/seller/Orders';
import { SellerSettings } from './pages/seller/Settings';
import { ToastProvider } from './context/ToastContext';
import { AuthProvider } from './context/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { Login } from './pages/seller/Login';
import { StoreCustomization } from './pages/seller/StoreCustomization';
=======
import { Navigate } from 'react-router-dom';
import { SellerApplications } from './pages/admin/SellerApplications';
import { BannersManager } from './pages/admin/BannersManager';
import { HomeLayoutManager } from './pages/admin/HomeLayoutManager';

import { AdminLayout } from './layouts/AdminLayout';
import { Dashboard } from './pages/admin/Dashboard';
import { Products } from './pages/admin/Products';
import { Orders } from './pages/admin/Orders';
import { Customers } from './pages/admin/Customers';
import { Settings } from './pages/admin/Settings';
import { CarouselManager } from './pages/admin/CarouselManager';
import { ToastProvider } from './context/ToastContext';
import { AuthProvider } from './context/AuthContext';
>>>>>>> 04fc0f1d35e1087a58ef766938a8d8e292ad3de9

function App() {
  return (
    <ToastProvider>
      <AuthProvider>
        <Router>
          <Routes>
<<<<<<< HEAD
            <Route path="/login" element={<Login />} />
            <Route path="/" element={<ProtectedRoute><SellerLayout /></ProtectedRoute>}>
              <Route index element={<SellerDashboard />} />
              <Route path="products" element={<SellerProducts />} />
              <Route path="orders" element={<SellerOrders />} />
              <Route path="store-customization" element={<StoreCustomization />} />
              <Route path="settings" element={<SellerSettings />} />
=======
            <Route path="/" element={<Navigate to="/admin" replace />} />
            <Route path="/login" element={<Navigate to="/admin" replace />} />
            
            <Route path="/admin" element={<AdminLayout />}>
              <Route index element={<Dashboard />} />
              <Route path="products" element={<Products />} />
              <Route path="orders" element={<Orders />} />
              <Route path="customers" element={<Customers />} />
              <Route path="carousel" element={<CarouselManager />} />
              <Route path="banners" element={<BannersManager />} />
              <Route path="layout" element={<HomeLayoutManager />} />
              <Route path="seller-applications" element={<SellerApplications />} />
              <Route path="settings" element={<Settings />} />
>>>>>>> 04fc0f1d35e1087a58ef766938a8d8e292ad3de9
            </Route>
          </Routes>
        </Router>
      </AuthProvider>
    </ToastProvider>
  );
}

export default App;

<<<<<<< HEAD
=======

>>>>>>> 04fc0f1d35e1087a58ef766938a8d8e292ad3de9
