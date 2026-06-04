import { Routes, Route } from "react-router";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import Home from "./pages/Home";
import ProductDetail from "./pages/ProductDetail";
import Cart from "./pages/Cart";
import Login from "./pages/Login";
import Register from "./pages/Register";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import UserDashboard from "./pages/UserDashboard";
import UserSettings from "./pages/UserSettings";
import UserSubscriptions from "./pages/UserSubscriptions";
import AffiliateDashboard from "./pages/AffiliateDashboard";
import WebhookSettings from "./pages/WebhookSettings";
import AdminDashboard from "./pages/AdminDashboard";
import AdminProducts from "./pages/AdminProducts";
import AdminOrders from "./pages/AdminOrders";
import AdminCustomers from "./pages/AdminCustomers";
import AdminAnalytics from "./pages/AdminAnalytics";
import AdminSettings from "./pages/AdminSettings";
import AdminTickets from "./pages/AdminTickets";
import AdminUsers from "./pages/AdminUsers";
import AdminLogs from "./pages/AdminLogs";
import NotFound from "./pages/NotFound";

export default function App() {
  return (
    <TooltipProvider>
      <Routes>
        {/* Public */}
        <Route path="/" element={<Home />} />
        <Route path="/product/:slug" element={<ProductDetail />} />
        <Route path="/cart" element={<Cart />} />

        {/* Auth */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/auth/forgot-password" element={<ForgotPassword />} />
        <Route path="/auth/reset-password" element={<ResetPassword />} />

        {/* User Dashboard */}
        <Route path="/dashboard" element={<UserDashboard />} />
        <Route path="/dashboard/:tab" element={<UserDashboard />} />
        <Route path="/settings" element={<UserSettings />} />
        <Route path="/subscriptions" element={<UserSubscriptions />} />
        <Route path="/affiliate" element={<AffiliateDashboard />} />
        <Route path="/webhooks" element={<WebhookSettings />} />

        {/* Admin */}
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="/admin/products" element={<AdminProducts />} />
        <Route path="/admin/orders" element={<AdminOrders />} />
        <Route path="/admin/customers" element={<AdminCustomers />} />
        <Route path="/admin/analytics" element={<AdminAnalytics />} />
        <Route path="/admin/settings" element={<AdminSettings />} />
        <Route path="/admin/tickets" element={<AdminTickets />} />
        <Route path="/admin/users" element={<AdminUsers />} />
        <Route path="/admin/logs" element={<AdminLogs />} />

        <Route path="*" element={<NotFound />} />
      </Routes>
      <Toaster
        position="bottom-right"
        toastOptions={{
          style: { background: '#1E293B', color: '#F1F5F9', border: '1px solid #2D3748' },
        }}
      />
    </TooltipProvider>
  );
}
