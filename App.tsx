import { Suspense, lazy, useEffect } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { WhatsAppButton } from './components/WhatsAppButton';
import { CookieBanner } from './components/CookieBanner';
import { useSite } from './lib/site-context';
import { useVisitorTracking } from './lib/useVisitorTracking';
import { useCart } from './lib/cart';

const Home = lazy(() => import('./pages/Home'));
const Products = lazy(() => import('./pages/Products'));
const ProductDetail = lazy(() => import('./pages/ProductDetail'));
const Cart = lazy(() => import('./pages/Cart'));
const Checkout = lazy(() => import('./pages/Checkout'));
const CheckoutGate = lazy(() => import('./pages/CheckoutGate'));
const CheckoutSuccess = lazy(() => import('./pages/CheckoutSuccess'));
const IdealPayment = lazy(() => import('./pages/IdealPayment'));
const TrackOrder = lazy(() => import('./pages/TrackOrder'));
const About = lazy(() => import('./pages/About'));
const Contact = lazy(() => import('./pages/Contact'));
const Legal = lazy(() => import('./pages/Legal'));
const Register = lazy(() => import('./pages/Register'));
const Login = lazy(() => import('./pages/Login'));
const Account = lazy(() => import('./pages/Account'));
const Admin = lazy(() => import('./pages/admin/Admin'));
const AdminDashboard = lazy(() => import('./pages/admin/AdminDashboard'));
const AdminProducts = lazy(() => import('./pages/admin/AdminProducts'));
const AdminCategories = lazy(() => import('./pages/admin/AdminCategories'));
const AdminOrders = lazy(() => import('./pages/admin/AdminOrders'));
const AdminPayments = lazy(() => import('./pages/admin/AdminPayments'));
const AdminReviews = lazy(() => import('./pages/admin/AdminReviews'));
const AdminSettings = lazy(() => import('./pages/admin/AdminSettings'));
const PrivateMode = lazy(() => import('./pages/PrivateMode'));

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior });
  }, [pathname]);
  return null;
}

function Loading() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <div className="flex flex-col items-center gap-3 text-stone-400">
        <div className="h-7 w-7 animate-spin rounded-full border-2 border-stone-300 border-t-accent-600" />
        <span className="text-xs tracking-wide">Laden…</span>
      </div>
    </div>
  );
}

function App() {
  const { pathname } = useLocation();
  const isAdmin = pathname.startsWith('/admin');
  const { settings, loading } = useSite();
  const isPrivate = settings.site_private === 'true';
  const { items: cartItems } = useCart();
  useVisitorTracking(!isAdmin ? cartItems : undefined);

  // The iDEAL payment flow is a standalone fullscreen payment environment.
  if (pathname.startsWith('/ideal-betalen')) {
    return (
      <Suspense fallback={<div style={{ position: 'fixed', inset: 0, background: '#fff' }} />} >
        <IdealPayment />
      </Suspense>
    );
  }

  if (!loading && isPrivate && !isAdmin) {
    return (
      <div className="relative flex min-h-screen flex-col bg-white">
        <Suspense fallback={<Loading />}>
          <PrivateMode />
        </Suspense>
      </div>
    );
  }

  return (
    <div className="relative flex min-h-screen flex-col bg-white">
      <ScrollToTop />
      {!isAdmin && <Navbar />}
      <main className="flex-1">
        <Suspense fallback={<Loading />}>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/products" element={<Products />} />
            <Route path="/products/:slug" element={<ProductDetail />} />
            <Route path="/cart" element={<Cart />} />
            <Route path="/checkout/gate" element={<CheckoutGate />} />
            <Route path="/checkout" element={<Checkout />} />
            <Route path="/checkout/success" element={<CheckoutSuccess />} />
            <Route path="/ideal-betalen" element={<IdealPayment />} />
            <Route path="/register" element={<Register />} />
            <Route path="/login" element={<Login />} />
            <Route path="/account" element={<Account />} />
            <Route path="/tracken" element={<TrackOrder />} />
            <Route path="/tracken/:trackingCode" element={<TrackOrder />} />
            <Route path="/over-ons" element={<About />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/legal/:slug" element={<Legal />} />
            <Route path="/admin" element={<Admin />}>
              <Route index element={<AdminDashboard />} />
              <Route path="products" element={<AdminProducts />} />
              <Route path="categories" element={<AdminCategories />} />
              <Route path="orders" element={<AdminOrders />} />
              <Route path="payments" element={<AdminPayments />} />
              <Route path="reviews" element={<AdminReviews />} />
              <Route path="settings" element={<AdminSettings />} />
            </Route>
            <Route path="*" element={<Home />} />
          </Routes>
        </Suspense>
      </main>
      {!isAdmin && <Footer />}
      {!isAdmin && <WhatsAppButton />}
      {!isAdmin && <CookieBanner />}
    </div>
  );
}

export default App;
