import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
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

function App() {
  return (
    <ToastProvider>
      <AuthProvider>
        <Router>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/" element={<ProtectedRoute><SellerLayout /></ProtectedRoute>}>
              <Route index element={<SellerDashboard />} />
              <Route path="products" element={<SellerProducts />} />
              <Route path="orders" element={<SellerOrders />} />
              <Route path="store-customization" element={<StoreCustomization />} />
              <Route path="settings" element={<SellerSettings />} />
            </Route>
          </Routes>
        </Router>
      </AuthProvider>
    </ToastProvider>
  );
}

export default App;

