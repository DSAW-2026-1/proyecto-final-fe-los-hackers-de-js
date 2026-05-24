import { Routes, Route } from 'react-router';
import { Toaster } from './components/ui/sonner';
import { AuthProvider } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import { NotificationProvider } from './context/NotificationContext';
import { Login } from './components/Login';
import { Register } from './components/Register';
import { HeroSection } from './components/HeroSection';
import { ProductsGrid } from './components/ProductsGrid';
import { ProductSearch } from './components/ProductSearch';
import { ProductDetail } from './components/ProductDetail';
import { CreateProduct } from './components/CreateProduct';
import { ShoppingCart } from './components/ShoppingCart';
import { Checkout } from './components/Checkout';
import { OrderHistory } from './components/OrderHistory';
import { BuyerShippingStatus } from './components/BuyerShippingStatus';
import { SellerShippingUpdate } from './components/SellerShippingUpdate';
import { LeaveReview } from './components/LeaveReview';
import { UserProfile } from './components/UserProfile';
import { EditProfile } from './components/EditProfile';
import { NotFound } from './components/NotFound';
import { SellerDashboard } from './components/SellerDashboard';
import { ChatInterface } from './components/ChatInterface';
import { Notifications } from './components/Notifications';
import { ReportView } from './components/ReportView';
import { UserReportView } from './components/UserReportView';
import { AdminDashboard } from './components/AdminDashboard';
import { AdminReportView } from './components/AdminReportView';
import { AdminSuspendUser } from './components/AdminSuspendUser.tsx';
import { AdminDeleteProduct } from './components/AdminDeleteProduct.tsx';
import { EditProduct } from './components/EditProduct';
import { MainLayout } from './components/MainLayout';
import { AdminLogin } from  './components/AdminLogin.tsx'
import { ScrollToTop } from './components/ScrollToTop.tsx';

import { ProtectedRoute } from './components/ProtectedRoute';
import { AdminProtectedRoute } from './components/AdminProtectedRoute';
import { NotificationPoller } from './components/NotificationPoller';
import { AdminLayout } from './components/AdminLayout.tsx'

function Home() {
  return (
    <>
      <HeroSection />
      <ProductsGrid />
    </>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <NotificationProvider>
        <CartProvider>
          <NotificationPoller />
          <Toaster position="top-right" expand={true} richColors />
          <ScrollToTop>
            <Routes>
            {/* Main app routes with MainLayout */}
            <Route element={<MainLayout />}>
              <Route path="/" element={<Home />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/search" element={<ProductSearch />} />
              <Route path="/product/:id" element={<ProductDetail />} />
              <Route path="/cart" element={<ShoppingCart />} />
              <Route path="/checkout" element={<Checkout />} />
              <Route path="/orders" element={<ProtectedRoute><OrderHistory /></ProtectedRoute>} />
              <Route path="/orders/:id/status" element={<ProtectedRoute><BuyerShippingStatus /></ProtectedRoute>} />
              <Route path="/orders/:id/review" element={<ProtectedRoute><LeaveReview /></ProtectedRoute>} />

              {/* Seller routes */}
              <Route path="/seller" element={<ProtectedRoute><SellerDashboard /></ProtectedRoute>} />
              <Route path="/seller/products/create" element={<ProtectedRoute><CreateProduct /></ProtectedRoute>} />
              <Route path="/seller/products/edit/:id" element={<ProtectedRoute><EditProduct /></ProtectedRoute>} />
              <Route path="/seller/orders/:id/update" element={<ProtectedRoute><SellerShippingUpdate /></ProtectedRoute>} />

              {/* User profile routes */}
              <Route path="/profile" element={<ProtectedRoute><UserProfile /></ProtectedRoute>} />
              <Route path="/profile/:uid" element={<UserProfile />} />
              <Route path="/profile/edit" element={<ProtectedRoute><EditProfile /></ProtectedRoute>} />

              {/* Communication & Utils */}
              <Route path="/chat" element={<ProtectedRoute><ChatInterface /></ProtectedRoute>} />
              <Route path="/notifications" element={<ProtectedRoute><Notifications /></ProtectedRoute>} />

              {/* Reporting users and products */}
              <Route path="/report/:id" element={<ProtectedRoute><ReportView /></ProtectedRoute>} />
              <Route path="/report/user/:id" element={<ProtectedRoute><UserReportView /></ProtectedRoute>} />

              {/* Admin login uses the normal layout so that regular users who somehow get here can easily get back to the marketplace */}
              <Route path="/admin/login" element={<AdminLogin />} />
            </Route>
            <Route element={<AdminLayout />}>
              {/* Admin routes */}
              <Route path="/admin" element={<AdminProtectedRoute><AdminDashboard /></AdminProtectedRoute>} />
              <Route path="/admin/reports/:id" element={<AdminProtectedRoute><AdminReportView /></AdminProtectedRoute>} />
              <Route path="/admin/suspend-user/:id" element={<AdminProtectedRoute><AdminSuspendUser /></AdminProtectedRoute>} />
              <Route path="/admin/delete-product/:id" element={<AdminProtectedRoute><AdminDeleteProduct /></AdminProtectedRoute>} />
            </Route>
            <Route element={<MainLayout />}>
              <Route path="*" element={<NotFound />} />
            </Route>
          </Routes>
        </ScrollToTop>
      </CartProvider>
    </NotificationProvider>
  </AuthProvider>
);
}
