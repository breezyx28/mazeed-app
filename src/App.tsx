import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation, Navigate } from "react-router-dom";
import { AnimatePresence } from "framer-motion";
import { useTranslation } from "react-i18next";
import { useEffect, useState } from "react";
import Home from "./pages/Home";
import ProductDetail from "./pages/ProductDetail";
import Cart from "./pages/Cart";
import SearchPage from "./pages/SearchPage";
import Profile from "./pages/Profile";
import EditProfile from "./pages/EditProfile";
import ShippingAddressWithMap from "./pages/ShippingAddressWithMap";
import PaymentMethods from "./pages/PaymentMethods";
import MyOrders from "./pages/MyOrders";
import Wishlist from "./pages/Wishlist";
import Notifications from "./pages/Notifications";
import Settings from "./pages/Settings";
import NotFound from "./pages/NotFound";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Checkout from "./pages/Checkout";
import PaymentSelection from "./pages/PaymentSelection";
import OrderSuccess from "./pages/OrderSuccess";
import Categories from "./pages/Categories";
import Offers from "./pages/Offers";
import ProductReviews from "./pages/ProductReviews";
import BiometricTest from "./pages/BiometricTest";
import { BottomNav } from "./components/BottomNav";
import { PageTransition } from "./components/PageTransition";
import { SplashScreen } from "./components/SplashScreen";
import { NotificationProvider } from "./context/NotificationContext";
import { SettingsProvider } from "./context/SettingsContext";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { useDeepLinking } from "./lib/use-deep-linking";

const queryClient = new QueryClient();

// Protected Route Component - Must be defined before AppContent
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

const AppContent = () => {
  const location = useLocation();
  const { i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';
  const hideBottomNav = ['/login', '/register'].includes(location.pathname);

  // Setup deep linking
  useDeepLinking();

  useEffect(() => {
    document.documentElement.setAttribute('dir', isRTL ? 'rtl' : 'ltr');
    document.documentElement.setAttribute('lang', i18n.language);
  }, [i18n.language, isRTL]);

  return (
    <>
      <AnimatePresence mode="wait">
        <Routes location={location} key={location.pathname}>
          <Route path="/" element={<PageTransition><Home /></PageTransition>} />
          <Route path="/product/:id" element={<PageTransition><ProductDetail /></PageTransition>} />
          <Route path="/cart" element={<ProtectedRoute><PageTransition><Cart /></PageTransition></ProtectedRoute>} />
          <Route path="/search" element={<PageTransition><SearchPage /></PageTransition>} />
          <Route path="/profile" element={<ProtectedRoute><PageTransition><Profile /></PageTransition></ProtectedRoute>} />
          <Route path="/edit-profile" element={<ProtectedRoute><PageTransition><EditProfile /></PageTransition></ProtectedRoute>} />
          <Route path="/shipping-address" element={<ProtectedRoute><PageTransition><ShippingAddressWithMap /></PageTransition></ProtectedRoute>} />
          <Route path="/payment-methods" element={<ProtectedRoute><PageTransition><PaymentMethods /></PageTransition></ProtectedRoute>} />
          <Route path="/my-orders" element={<ProtectedRoute><PageTransition><MyOrders /></PageTransition></ProtectedRoute>} />
          <Route path="/wishlist" element={<ProtectedRoute><PageTransition><Wishlist /></PageTransition></ProtectedRoute>} />
          <Route path="/notifications" element={<ProtectedRoute><PageTransition><Notifications /></PageTransition></ProtectedRoute>} />
          <Route path="/settings" element={<ProtectedRoute><PageTransition><Settings /></PageTransition></ProtectedRoute>} />
          <Route path="/login" element={<PageTransition><Login /></PageTransition>} />
          <Route path="/register" element={<PageTransition><Register /></PageTransition>} />
          <Route path="/checkout" element={<ProtectedRoute><PageTransition><Checkout /></PageTransition></ProtectedRoute>} />
          <Route path="/payment-selection" element={<ProtectedRoute><PageTransition><PaymentSelection /></PageTransition></ProtectedRoute>} />
          <Route path="/order-success" element={<ProtectedRoute><PageTransition><OrderSuccess /></PageTransition></ProtectedRoute>} />
          <Route path="/categories" element={<PageTransition><Categories /></PageTransition>} />
          <Route path="/offers" element={<PageTransition><Offers /></PageTransition>} />
          <Route path="/product/:id/reviews" element={<PageTransition><ProductReviews /></PageTransition>} />
          <Route path="/biometric-test" element={<PageTransition><BiometricTest /></PageTransition>} />
          <Route path="*" element={<PageTransition><NotFound /></PageTransition>} />
        </Routes>
      </AnimatePresence>
      {!hideBottomNav && <BottomNav />}
    </>
  );
};

const App = () => {
  const [showSplash, setShowSplash] = useState(true);

  useEffect(() => {
    // Initialize Capacitor plugins
    import('./lib/capacitor-utils').then(({ CapacitorUtils }) => {
      CapacitorUtils.initialize();
    });
  }, []);

  const handleLoadingComplete = () => {
    setShowSplash(false);
  };

  return (
    <>
      {showSplash && <SplashScreen onLoadingComplete={handleLoadingComplete} />}
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <SettingsProvider>
            <NotificationProvider>
              <AuthProvider>
                <Toaster />
                <Sonner />
                <BrowserRouter>
                  <AppContent />
                </BrowserRouter>
              </AuthProvider>
            </NotificationProvider>
          </SettingsProvider>
        </TooltipProvider>
      </QueryClientProvider>
    </>
  );
};

export default App;
