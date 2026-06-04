import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router";
import { useAuth } from "@/hooks/useAuth";
import { useCart } from "@/hooks/useCart";
import { Button } from "@/components/ui/button";
import {
  ShoppingCart,
  Search,
  Menu,
  X,
  LayoutDashboard,
  LogOut,
  User,
  Store,
  Package,
} from "lucide-react";

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const { user, isAuthenticated, logout } = useAuth();
  const { itemCount } = useCart();
  const navigate = useNavigate();

  const isAdmin = user?.role === "admin";

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/?search=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 h-[72px] flex items-center transition-all duration-300 ${
        scrolled
          ? "bg-[#0A0E1A]/95 backdrop-blur-md border-b border-[#2D3748]"
          : "bg-[#0A0E1A]/80 backdrop-blur-sm"
      }`}
    >
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2 shrink-0">
          <div className="w-8 h-8 rounded-lg gradient-bg flex items-center justify-center">
            <Store className="w-4 h-4 text-white" />
          </div>
          <span className="text-xl font-bold gradient-text">DigiSell</span>
        </Link>

        <form onSubmit={handleSearch} className="hidden md:flex flex-1 max-w-md mx-8">
          <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#64748B]" />
            <input
              type="text"
              placeholder="Produkte suchen..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-10 pl-10 pr-4 rounded-lg bg-[#1A2235] border border-[#2D3748] text-sm text-[#F1F5F9] placeholder:text-[#64748B] focus:outline-none focus:border-[#6366F1] focus:ring-1 focus:ring-[#6366F1]/30 transition-all"
            />
          </div>
        </form>

        <div className="hidden md:flex items-center gap-3">
          <Link to="/cart" className="relative p-2 rounded-lg hover:bg-[#1A2235] transition-colors">
            <ShoppingCart className="w-5 h-5 text-[#94A3B8]" />
            {itemCount > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full gradient-bg text-white text-[10px] font-medium flex items-center justify-center">
                {itemCount}
              </span>
            )}
          </Link>

          {isAuthenticated ? (
            <div className="flex items-center gap-2">
              {/* Mein Shop — fuer alle angemeldeten Nutzer */}
              <Link to="/seller">
                <Button size="sm" variant="outline" className="border-[#2D3748] text-[#94A3B8] hover:text-white hover:border-indigo-500 hover:bg-indigo-500/10 transition-all">
                  <Store className="w-4 h-4 mr-1.5" />
                  Mein Shop
                </Button>
              </Link>

              {/* Admin Panel — nur fuer Admins */}
              {isAdmin && (
                <Link to="/admin">
                  <Button size="sm" className="gradient-bg text-white hover:opacity-90">
                    <LayoutDashboard className="w-4 h-4 mr-1.5" />
                    Admin
                  </Button>
                </Link>
              )}

              <div className="flex items-center gap-2">
                <Link to="/dashboard">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-violet-500 flex items-center justify-center text-white text-sm font-medium cursor-pointer hover:opacity-80 transition-opacity">
                    {user?.name?.[0]?.toUpperCase() || "U"}
                  </div>
                </Link>
                <button
                  onClick={logout}
                  className="p-2 rounded-lg hover:bg-[#1A2235] text-[#94A3B8] hover:text-white transition-colors"
                  title="Abmelden"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link to="/login">
                <Button size="sm" variant="outline" className="border-[#2D3748] text-[#94A3B8] hover:text-white">
                  Anmelden
                </Button>
              </Link>
              <Link to="/register">
                <Button size="sm" className="gradient-bg text-white hover:opacity-90">
                  <User className="w-4 h-4 mr-1.5" />
                  Registrieren
                </Button>
              </Link>
            </div>
          )}
        </div>

        <button
          onClick={() => setMenuOpen(!menuOpen)}
          className="md:hidden p-2 rounded-lg hover:bg-[#1A2235] transition-colors"
        >
          {menuOpen ? <X className="w-5 h-5 text-[#94A3B8]" /> : <Menu className="w-5 h-5 text-[#94A3B8]" />}
        </button>
      </div>

      {/* Mobile Menu */}
      {menuOpen && (
        <div className="md:hidden absolute top-[72px] left-0 right-0 bg-[#111827] border-b border-[#2D3748] p-4 space-y-2 animate-fade-in">
          <form onSubmit={handleSearch} className="flex gap-2 mb-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#64748B]" />
              <input
                type="text"
                placeholder="Produkte suchen..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full h-10 pl-10 pr-4 rounded-lg bg-[#1A2235] border border-[#2D3748] text-sm text-[#F1F5F9] placeholder:text-[#64748B]"
              />
            </div>
          </form>

          <Link to="/cart" onClick={() => setMenuOpen(false)} className="flex items-center gap-3 p-3 rounded-lg hover:bg-[#1A2235] text-[#94A3B8] hover:text-white">
            <ShoppingCart className="w-5 h-5" />
            Warenkorb {itemCount > 0 && `(${itemCount})`}
          </Link>

          {isAuthenticated ? (
            <>
              <Link to="/seller" onClick={() => setMenuOpen(false)} className="flex items-center gap-3 p-3 rounded-lg hover:bg-[#1A2235] text-[#94A3B8] hover:text-white">
                <Store className="w-5 h-5" />
                Mein Shop
              </Link>
              <Link to="/dashboard" onClick={() => setMenuOpen(false)} className="flex items-center gap-3 p-3 rounded-lg hover:bg-[#1A2235] text-[#94A3B8] hover:text-white">
                <User className="w-5 h-5" />
                Mein Konto
              </Link>
              {isAdmin && (
                <Link to="/admin" onClick={() => setMenuOpen(false)} className="flex items-center gap-3 p-3 rounded-lg hover:bg-[#1A2235] text-[#94A3B8] hover:text-white">
                  <LayoutDashboard className="w-5 h-5" />
                  Admin Panel
                </Link>
              )}
              <button
                onClick={() => { logout(); setMenuOpen(false); }}
                className="flex items-center gap-3 p-3 rounded-lg hover:bg-[#1A2235] text-[#94A3B8] hover:text-[#EF4444] w-full text-left"
              >
                <LogOut className="w-5 h-5" />
                Abmelden
              </button>
            </>
          ) : (
            <>
              <Link to="/login" onClick={() => setMenuOpen(false)} className="flex items-center gap-3 p-3 rounded-lg hover:bg-[#1A2235] text-[#94A3B8] hover:text-white">
                <User className="w-5 h-5" />
                Anmelden
              </Link>
              <Link to="/register" onClick={() => setMenuOpen(false)} className="flex items-center gap-3 p-3 rounded-lg hover:bg-[#1A2235] text-[#94A3B8] hover:text-white">
                <Package className="w-5 h-5" />
                Registrieren
              </Link>
            </>
          )}
        </div>
      )}
    </nav>
  );
}
