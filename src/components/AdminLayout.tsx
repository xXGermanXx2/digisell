import { Link, useLocation, useNavigate } from "react-router";
import { useAuth } from "@/hooks/useAuth";
import {
  LayoutDashboard, Package, ShoppingBag, Users, BarChart3, Settings,
  Ticket, LogOut, Store, Menu, X, CreditCard, UserCheck, RefreshCw,
  Activity, Shield, FileText
} from "lucide-react";
import { useState } from "react";

const adminNavItems = [
  { path: "/admin", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { path: "/admin/users", label: "Nutzer", icon: Users },
  { path: "/admin/products", label: "Produkte", icon: Package },
  { path: "/admin/orders", label: "Bestellungen", icon: ShoppingBag },
  { path: "/admin/payments", label: "Zahlungen", icon: CreditCard },
  { path: "/admin/tickets", label: "Tickets", icon: Ticket },
  { path: "/admin/affiliate", label: "Affiliates", icon: UserCheck },
  { path: "/admin/subscriptions", label: "Abonnements", icon: RefreshCw },
  { path: "/admin/analytics", label: "Analytics", icon: BarChart3 },
  { path: "/admin/logs", label: "Logs", icon: FileText },
  { path: "/admin/security", label: "Sicherheit", icon: Shield },
  { path: "/admin/system", label: "System", icon: Activity },
  { path: "/admin/settings", label: "Einstellungen", icon: Settings },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth({ redirectOnUnauthenticated: true });
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const isAdmin = user?.role === "admin";
  if (user && !isAdmin) {
    navigate("/dashboard");
    return null;
  }

  const isActive = (item: { path: string; exact?: boolean }) =>
    item.exact ? location.pathname === item.path : location.pathname.startsWith(item.path);

  const NavContent = () => (
    <>
      <div className="flex items-center gap-2 h-16 px-4 border-b border-[#1E293B]">
        <Link to="/" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#6366F1] to-[#8B5CF6] flex items-center justify-center">
            <Store className="w-4 h-4 text-white" />
          </div>
          <span className="text-lg font-bold bg-gradient-to-r from-[#6366F1] to-[#8B5CF6] bg-clip-text text-transparent">DigiSell</span>
        </Link>
        <span className="ml-auto text-[10px] font-medium text-[#6366F1] bg-[#6366F1]/10 px-2 py-0.5 rounded-full uppercase tracking-wider">Admin</span>
      </div>
      <nav className="flex-1 py-4 px-3 space-y-0.5 overflow-y-auto">
        {adminNavItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item);
          return (
            <Link key={item.path} to={item.path}
              onClick={() => setMobileMenuOpen(false)}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                active
                  ? "bg-[#6366F1]/15 text-[#6366F1] border-l-2 border-[#6366F1]"
                  : "text-[#94A3B8] hover:bg-[#1A2235] hover:text-[#F1F5F9]"
              }`}>
              <Icon className="w-4 h-4 flex-shrink-0" />
              {item.label}
            </Link>
          );
        })}
      </nav>
      <div className="p-3 border-t border-[#1E293B]">
        <div className="flex items-center gap-3 px-3 py-2 mb-2">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-violet-500 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
            {((user?.name ?? user?.email ?? "A") as string)[0].toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-[#F1F5F9] truncate">{user?.name ?? "Admin"}</p>
            <p className="text-xs text-[#64748B] truncate">{user?.email}</p>
          </div>
        </div>
        <button onClick={() => logout()} className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-[#94A3B8] hover:bg-[#1A2235] hover:text-red-400 transition-all">
          <LogOut className="w-4 h-4" />
          Abmelden
        </button>
      </div>
    </>
  );

  return (
    <div className="min-h-screen bg-[#0A0E1A] flex">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex w-64 flex-col bg-[#0F172A] border-r border-[#1E293B] fixed h-full z-30">
        <NavContent />
      </aside>

      {/* Mobile Sidebar */}
      {mobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div className="fixed inset-0 bg-black/60" onClick={() => setMobileMenuOpen(false)} />
          <aside className="relative w-64 flex flex-col bg-[#0F172A] border-r border-[#1E293B] h-full z-50">
            <NavContent />
          </aside>
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 lg:ml-64 flex flex-col min-h-screen">
        {/* Mobile Header */}
        <header className="lg:hidden flex items-center gap-3 h-14 px-4 bg-[#0F172A] border-b border-[#1E293B] sticky top-0 z-20">
          <button onClick={() => setMobileMenuOpen(true)} className="text-[#94A3B8] hover:text-[#F1F5F9]">
            <Menu className="w-5 h-5" />
          </button>
          <span className="text-base font-bold bg-gradient-to-r from-[#6366F1] to-[#8B5CF6] bg-clip-text text-transparent">DigiSell Admin</span>
        </header>

        <main className="flex-1 p-4 lg:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
