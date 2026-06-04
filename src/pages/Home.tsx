import { useState, useEffect } from "react";
import { Link, useSearchParams } from "react-router";
import { trpc } from "@/providers/trpc";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ProductCard from "@/components/ProductCard";
import { Button } from "@/components/ui/button";
import {
  ArrowRight,
  Upload,
  CreditCard,
  Download,
  Code,
  BookOpen,
  Layout,
  GraduationCap,
  Key,
  Plug,
  Shield,
  Zap,
  Globe,
  Loader2,
} from "lucide-react";

const categoryIcons: Record<string, React.ReactNode> = {
  software: <Code className="w-6 h-6" />,
  "e-books": <BookOpen className="w-6 h-6" />,
  templates: <Layout className="w-6 h-6" />,
  kurse: <GraduationCap className="w-6 h-6" />,
  lizenzen: <Key className="w-6 h-6" />,
  plugins: <Plug className="w-6 h-6" />,
};

export default function Home() {
  const [searchParams] = useSearchParams();
  const searchQuery = searchParams.get("search") ?? undefined;
  const categoryFilter = searchParams.get("category") ?? undefined;
  const [activeCategory, setActiveCategory] = useState<number | undefined>(undefined);

  const { data: categories } = trpc.category.list.useQuery();
  const { data: productsData, isLoading: productsLoading } = trpc.product.list.useQuery({
    search: searchQuery,
    categoryId: activeCategory,
    status: "active",
    limit: 12,
  });
  const { data: featuredProducts } = trpc.product.getFeatured.useQuery();

  // Map category slug to id
  useEffect(() => {
    if (categoryFilter && categories) {
      const cat = categories.find((c) => c.slug === categoryFilter);
      if (cat) setActiveCategory(cat.id);
    }
  }, [categoryFilter, categories]);

  const displayedProducts = searchQuery ? productsData?.items : (featuredProducts ?? productsData?.items);

  return (
    <div className="min-h-screen bg-[#0A0E1A]">
      <Navbar />

      {/* Hero Section */}
      <section className="relative pt-[72px] min-h-[60vh] flex items-center overflow-hidden">
        {/* Background Effect */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-1/4 -left-32 w-96 h-96 bg-[#6366F1]/5 rounded-full blur-3xl" />
          <div className="absolute bottom-1/4 -right-32 w-96 h-96 bg-[#8B5CF6]/5 rounded-full blur-3xl" />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 py-16 md:py-24">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#6366F1]/10 border border-[#6366F1]/20 text-[#6366F1] text-xs font-medium mb-6">
              <Zap className="w-3.5 h-3.5" />
              Neue Produkte jeden Tag
            </div>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-[#F1F5F9] leading-tight mb-6">
              Digitale Produkte{" "}
              <span className="gradient-text">einfach verkaufen</span>
            </h1>
            <p className="text-base md:text-lg text-[#94A3B8] leading-relaxed mb-8 max-w-lg">
              Die All-in-One Plattform für digitale Güter. Lizenzschlüssel, Dateien, Abos und mehr. Starte jetzt deinen digitalen Shop.
            </p>
            <div className="flex flex-wrap gap-4">
              <Link to="/login">
                <Button size="lg" className="gradient-bg text-white hover:opacity-90 text-sm">
                  Jetzt verkaufen
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
              <Button
                size="lg"
                variant="outline"
                className="border-[#2D3748] text-[#F1F5F9] hover:bg-[#1A2235] text-sm"
                onClick={() => {
                  document.getElementById("products")?.scrollIntoView({ behavior: "smooth" });
                }}
              >
                Produkte entdecken
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Bar */}
      <section className="bg-[#111827] border-y border-[#1E293B]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8 stagger-children">
            {[
              { value: "500+", label: "Verkäufer" },
              { value: "50K+", label: "Produkte" },
              { value: "\u20ac2M+", label: "Umsatz" },
              { value: "99.9%", label: "Uptime" },
            ].map((stat) => (
              <div key={stat.label} className="text-center">
                <div className="text-2xl md:text-3xl font-bold text-[#6366F1] mb-1">{stat.value}</div>
                <div className="text-xs text-[#94A3B8] uppercase tracking-wider">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="py-12 md:py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <h2 className="text-xl md:text-2xl font-bold text-[#F1F5F9] mb-8">Kategorien</h2>
          <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-2">
            <button
              onClick={() => setActiveCategory(undefined)}
              className={`flex items-center gap-2 px-4 py-3 rounded-xl border transition-all shrink-0 ${
                !activeCategory
                  ? "border-[#6366F1] bg-[#6366F1]/10 text-[#6366F1]"
                  : "border-[#2D3748] bg-[#111827] text-[#94A3B8] hover:border-[#6366F1]/50 hover:text-[#F1F5F9]"
              }`}
            >
              <Globe className="w-5 h-5" />
              <span className="text-sm font-medium">Alle</span>
            </button>
            {categories?.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(activeCategory === cat.id ? undefined : cat.id)}
                className={`flex items-center gap-2 px-4 py-3 rounded-xl border transition-all shrink-0 ${
                  activeCategory === cat.id
                    ? "border-[#6366F1] bg-[#6366F1]/10 text-[#6366F1]"
                    : "border-[#2D3748] bg-[#111827] text-[#94A3B8] hover:border-[#6366F1]/50 hover:text-[#F1F5F9]"
                }`}
              >
                {categoryIcons[cat.slug] ?? <Layout className="w-5 h-5" />}
                <span className="text-sm font-medium">{cat.name}</span>
                <span className="text-[10px] text-[#64748B] bg-[#1A2235] px-1.5 py-0.5 rounded-full">{cat.productCount}</span>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Products */}
      <section id="products" className="py-12 md:py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-xl md:text-2xl font-bold text-[#F1F5F9]">
              {searchQuery ? `Suchergebnisse für "${searchQuery}"` : "Beliebte Produkte"}
            </h2>
            {!searchQuery && (
              <Link to="/" className="text-sm text-[#6366F1] hover:text-[#8B5CF6] transition-colors flex items-center gap-1">
                Alle ansehen <ArrowRight className="w-4 h-4" />
              </Link>
            )}
          </div>

          {productsLoading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-8 h-8 text-[#6366F1] animate-spin" />
            </div>
          ) : displayedProducts && displayedProducts.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 stagger-children">
              {displayedProducts.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          ) : (
            <div className="text-center py-20">
              <p className="text-[#94A3B8]">Keine Produkte gefunden.</p>
            </div>
          )}
        </div>
      </section>

      {/* How It Works */}
      <section className="py-12 md:py-16 bg-[#111827]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <h2 className="text-xl md:text-2xl font-bold text-[#F1F5F9] mb-10 text-center">
            So funktioniert&apos;s
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                icon: <Upload className="w-8 h-8" />,
                title: "Produkt hochladen",
                description: "Lade dein digitales Produkt in wenigen Minuten hoch. Unterstützt Dateien, Lizenzen und mehr.",
              },
              {
                icon: <CreditCard className="w-8 h-8" />,
                title: "Zahlung empfangen",
                description: "Akzeptiere Zahlungen per Stripe, PayPal oder Krypto. Automatische Abwicklung inklusive.",
              },
              {
                icon: <Download className="w-8 h-8" />,
                title: "Automatisch ausliefern",
                description: "Deine Kunden erhalten sofort nach Zahlungseingang Zugriff auf ihre Produkte.",
              },
            ].map((step, i) => (
              <div key={i} className="text-center group">
                <div className="w-16 h-16 rounded-2xl bg-[#6366F1]/10 border border-[#6366F1]/20 flex items-center justify-center text-[#6366F1] mx-auto mb-5 group-hover:bg-[#6366F1]/20 transition-colors">
                  {step.icon}
                </div>
                <h3 className="text-lg font-semibold text-[#F1F5F9] mb-2">{step.title}</h3>
                <p className="text-sm text-[#94A3B8] leading-relaxed max-w-xs mx-auto">{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Trust Section */}
      <section className="py-12 md:py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {[
              { icon: <Shield className="w-5 h-5" />, title: "Sichere Zahlungen", desc: "SSL-verschlüsselt mit Stripe & PayPal" },
              { icon: <Zap className="w-5 h-5" />, title: "Sofortige Lieferung", desc: "Automatischer Download nach Kauf" },
              { icon: <Globe className="w-5 h-5" />, title: "Weltweit verfügbar", desc: "Verkaufe in über 135 Ländern" },
            ].map((item) => (
              <div key={item.title} className="flex items-start gap-4 p-5 rounded-xl bg-[#111827] card-shadow">
                <div className="w-10 h-10 rounded-lg bg-[#6366F1]/10 flex items-center justify-center text-[#6366F1] shrink-0">
                  {item.icon}
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-[#F1F5F9] mb-1">{item.title}</h4>
                  <p className="text-xs text-[#94A3B8]">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
