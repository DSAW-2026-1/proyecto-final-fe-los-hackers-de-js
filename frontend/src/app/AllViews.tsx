import { Login } from './components/Login';
import { Register } from './components/Register';
import { Navigation } from './components/Navigation';
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
import { AdminDashboard } from './components/AdminDashboard';
import { AdminReportView } from './components/AdminReportView';
import { EditProduct } from './components/EditProduct';
import { Footer } from './components/Footer';
import { Separator } from './components/ui/separator';

export default function App() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Authentication Screens */}
      <Login />

      <div className="my-12" />

      <Register />

      <div className="my-12" />

      {/* Main App Screens */}
      <Navigation />

      <main className="flex-1">
        <HeroSection />

        <ProductsGrid />

        <ProductSearch />

        <Separator className="max-w-7xl mx-auto" />

        <ProductDetail />

        <Separator className="max-w-7xl mx-auto" />

        <CreateProduct />

        <Separator className="max-w-7xl mx-auto" />

        <EditProduct />

        <Separator className="max-w-7xl mx-auto" />

        <ShoppingCart />

        <Separator className="max-w-7xl mx-auto" />

        <Checkout />

        <Separator className="max-w-7xl mx-auto" />

        <OrderHistory />

        <Separator className="max-w-7xl mx-auto" />

        <BuyerShippingStatus />

        <Separator className="max-w-7xl mx-auto" />

        <LeaveReview />

        <Separator className="max-w-7xl mx-auto" />

        <SellerDashboard />

        <Separator className="max-w-7xl mx-auto" />

        <SellerShippingUpdate />

        <Separator className="max-w-7xl mx-auto" />

        <UserProfile />

        <Separator className="max-w-7xl mx-auto" />

        <EditProfile />

        <Separator className="max-w-7xl mx-auto" />

        <NotFound />

        <Separator className="max-w-7xl mx-auto" />

        <ChatInterface />

        <Separator className="max-w-7xl mx-auto" />

        <Notifications />

        <Separator className="max-w-7xl mx-auto" />

        <ReportView />

        <Separator className="max-w-7xl mx-auto" />

        <AdminDashboard />

        <Separator className="max-w-7xl mx-auto" />

        <AdminReportView />
      </main>

      <Footer />
    </div>
  );
}