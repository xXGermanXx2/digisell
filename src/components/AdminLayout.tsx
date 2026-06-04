import { Link, useLocation, useNavigate } from "react-router";
import { useAuth } from "@/hooks/useAuth";
import {
  LayoutDashboard,
  Package,
  ShoppingBag,
  Users,
  BarChart3,
  Settings,
  Ticket,
  LogOut,
  Store,
  ChevronLeft,
  Menu,
  X,
} from "lucide-react";
import { useState } from "react";

const adminNavItems = [
  { path: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { path: "/admin/products", label: "Produkte", icon: Package },
  { path: "/admin/orders", label: "Bestellungen", icon: ShoppingBag },
  { path: "/admin/customers", label: "Kunden", icon: Users },
  { path: "/admin/analytics", label: "Analytics", icon: BarChart3 },
  { path: "/admin/tickets", label: "Tickets", icon: Ticket },
  { path: "/admin/settings", label: "Einstellungen", icon: Settings },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth({ redirectOnUnauthenticated: true });
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const isAdmin = user?.role === "admin" || user?.role === "seller";

  if (!isAdmin) {
    navigate("/dashboard");
    return null;
  }

  return (
    <div className="min-h-screen bg-[#0A0E1A] flex">
      <aside className="hidden lg:flex w-64 flex-col bg-[#0F172A] border-r border-[#1E293B] fixed h-full z-30">
        <div className="flex items-center gap-2 h-16 px-4 border-b border-[#1E293B]">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg gradient-bg flex items-center justify-center">
              <Store className="w-4 h-4 text-white" />
            </div>
            <span className="text-lg font-bold gradient-text">DigiSell</span>
          </Link>
          <span className="ml-2 text-[10px] font-medium text-[#6366F1] bg-[#6366F1]/10 px-2 py-0.5 rounded-full uppercase tracking-wider">
            Admin
          </span>
        </div>

        <nav className="flex-1 py-4 px-3 space-y-1">
          {adminNavItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                  isActive
                    ? "bg-[#6366F1]/15 text-[#6366F1] border-l-2 border-[#6366F1]"
                    : "text-[#94A3B8] hover:bg-[#1A2235] hover:text-[#F1F5F9]"
                }`}
              >
                <Icon className="w-4 h-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="p-3 border-t border-[#1E293B]">
          <div className="flex items-center gap-3 px-3 py-2 mb-2">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-violet-500 flex items-center justify-center text-white text-xs font-bold">
              {user?.name?.[0]?.toUpperCase() || "U"}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-medium text-[#F1F5F9] truncate">{user?.name ?? "Admin"}</p>
              <p className="text-[10px] text-[#64748B]">{user?.role === "admin" ? "Administrator" : "Verk\u00e4ufer"}</p>
            </div>
          </div>
          <div className="flex gap-1">
            <Link
              to="/dashboard"
              className="flex-1 flex items-center justify-center gap-1.5 px-2 py-2 rounded-lg text-xs text-[#94A3B8] hover:bg-[#1A2235] hover:text-[#F1F5F9] transition-colors"
            >
              <ChevronLeft className="w-3 h-3" />
              Shop
            </Link>
            <button
              onClick={logout}
              className="flex-1 flex items-center justify-center gap-1.5 px-2 py-2 rounded-lg text-xs text-[#94A3B8] hover:bg-[#1A2235] hover:text-[#EF4444] transition-colors"
            >
              <LogOut className="w-3 h-3" />
              Logout
            </button>
          </div>
        </div>
      </aside>

      <div className="lg:hidden fixed top-0 left-0 right-0 z-40 bg-[#0F172A] border-b border-[#1E293B]">
        <div className="flex items-center justify-between h-14 px-4">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-md gradient-bg flex items-center justify-center">
              <Store className="w-3.5 h-3.5 text-white" />
            </div>
            <span className="text-sm font-bold gradient-text">DigiSell Admin</span>
          </Link>
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 rounded-lg hover:bg-[#1A2235]"
          >
            {mobileMenuOpen ? <X className="w-5 h-5 text-[#94A3B8]" /> : <Menu className="w-5 h-5 text-[#94A3B8]" />}
          </button>
        </div>

        {mobileMenuOpen && (
          <div className="border-t border-[#1E293B] bg-[#0F172A] animate-fade-in">
            {adminNavItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center gap-3 px-4 py-3 text-sm font-medium transition-colors ${
                    isActive
                      ? "bg-[#6366F1]/15 text-[#6366F1]"
                      : "text-[#94A3B8] hover:bg-[#1A2235]"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {item.label}
                </Link>
              );
            })}
          </div>
        )}
      </div>

      <main className="flex-1 lg:ml-64 pt-14 lg:pt-0">
        <div className="p-4 sm:p-6 lg:p-8">
          {children}
        </div>
      </main>
    </div>
  );
}
