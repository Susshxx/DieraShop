import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import ScrollToTop from "./components/ScrollToTop";
import { ThemeProvider } from "@/hooks/useTheme";
import { AuthProvider } from "@/hooks/useAuth";
import { CartProvider } from "@/hooks/useCart";
import { ProtectedRoute, AdminRoute } from "@/components/ProtectedRoute";
import ChatWidget from "@/components/user/ChatWidget";

import Index from "./pages/Index";
import Category from "./pages/Category";
import NewIn from "./pages/NewIn";
import ProductDetail from "./pages/ProductDetail";
import Checkout from "./pages/Checkout";
import SearchResults from "./pages/SearchResults";
import NotFound from "./pages/NotFound";

import OurStory from "./pages/about/OurStory";
import Sustainability from "./pages/about/Sustainability";
import SizeGuide from "./pages/about/SizeGuide";
import CustomerCare from "./pages/about/CustomerCare";
import StoreLocator from "./pages/about/StoreLocator";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import TermsOfService from "./pages/TermsOfService";

import Login from "./pages/auth/Login";
import Signup from "./pages/auth/Signup";
import ResetPassword from "./pages/auth/ResetPassword";
import GoogleCallback from "./pages/auth/GoogleCallback";
import EsewaSuccess from "./pages/payment/EsewaSuccess";
import EsewaFailure from "./pages/payment/EsewaFailure";

import AccountLayout from "./pages/account/Layout";
import AccountDashboard from "./pages/account/Dashboard";
import AccountOrders from "./pages/account/Orders";
import AccountChat from "./pages/account/Chat";
import AccountNotifications from "./pages/account/Notifications";
import AccountProfile from "./pages/account/Profile";

import AdminLogin from "./pages/admin/Login";
import AdminSignup from "./pages/admin/Signup";
import AdminLayout from "./pages/admin/Layout";
import AdminDashboard from "./pages/admin/Dashboard";
import AdminProducts from "./pages/admin/Products";
import AdminProductEditor from "./pages/admin/ProductEditor";
import AdminCategories from "./pages/admin/Categories";
import AdminOrders from "./pages/admin/Orders";
import AdminQuestions from "./pages/admin/Questions";
import AdminChats from "./pages/admin/Chats";
import AdminUsers from "./pages/admin/Users";
import AdminSiteImages from "./pages/admin/SiteImages";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider>
      <AuthProvider>
        <CartProvider>
          <TooltipProvider>
            <Sonner />
            <BrowserRouter>
              <ScrollToTop />
              <Routes>
                <Route path="/" element={<Index />} />
                <Route path="/category/new-in" element={<NewIn />} />
                <Route path="/category/:category" element={<Category />} />
                <Route path="/product/:productId" element={<ProductDetail />} />
                <Route path="/checkout" element={<Checkout />} />
                <Route path="/search" element={<SearchResults />} />

                <Route path="/about/our-story" element={<OurStory />} />
                <Route path="/about/sustainability" element={<Sustainability />} />
                <Route path="/about/size-guide" element={<SizeGuide />} />
                <Route path="/about/customer-care" element={<CustomerCare />} />
                <Route path="/about/store-locator" element={<StoreLocator />} />
                <Route path="/privacy-policy" element={<PrivacyPolicy />} />
                <Route path="/terms-of-service" element={<TermsOfService />} />

                <Route path="/auth/login" element={<Login />} />
                <Route path="/auth/signup" element={<Signup />} />
                <Route path="/auth/reset" element={<ResetPassword />} />
                <Route path="/auth/callback" element={<GoogleCallback />} />
                
                <Route path="/payment/esewa/success" element={<EsewaSuccess />} />
                <Route path="/payment/esewa/failure" element={<EsewaFailure />} />

                <Route path="/account" element={<ProtectedRoute><AccountLayout /></ProtectedRoute>}>
                  <Route index element={<AccountDashboard />} />
                  <Route path="orders" element={<AccountOrders />} />
                  <Route path="chat" element={<AccountChat />} />
                  <Route path="notifications" element={<AccountNotifications />} />
                  <Route path="profile" element={<AccountProfile />} />
                </Route>

                <Route path="/admin/login" element={<AdminLogin />} />
                <Route path="/admin/signup" element={<AdminSignup />} />
                <Route path="/admin" element={<AdminRoute><AdminLayout /></AdminRoute>}>
                  <Route index element={<AdminDashboard />} />
                  <Route path="products" element={<AdminProducts />} />
                  <Route path="products/:id" element={<AdminProductEditor />} />
                  <Route path="categories" element={<AdminCategories />} />
                  <Route path="orders" element={<AdminOrders />} />
                  <Route path="questions" element={<AdminQuestions />} />
                  <Route path="chats" element={<AdminChats />} />
                  <Route path="users" element={<AdminUsers />} />
                  <Route path="site-images" element={<AdminSiteImages />} />
                </Route>

                <Route path="*" element={<NotFound />} />
              </Routes>
              <ChatWidget />
            </BrowserRouter>
          </TooltipProvider>
        </CartProvider>
      </AuthProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
