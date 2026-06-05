import { useState, useEffect } from "react";
import { Link, useSearchParams } from "react-router";
import { trpc } from "@/providers/trpc";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ProductCard from "@/components/ProductCard";
import { Button } from "@/components/ui/button";
import planFreeImg from "@/assets/plans/plan-free.png";
import planPremiumImg from "@/assets/plans/plan-premium.png";
import planBusinessImg from "@/assets/plans/plan-business.png";
import planEnterpriseImg from "@/assets/plans/plan-enterprise.png";
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
  Check,
} from "lucide-react";

const categoryIcons: Record<string, React.ReactNode> = {
  software: <Code className="w-6 h-6" />,
  "e-books": <BookOpen className="w-6 h-6" />,
  templates: <Layout className="w-6 h-6" />,
  kurse: <GraduationCap className="w-6 h-6" />,
  lizenzen: <Key className="w-6 h-6" />,
  plugins: <Plug className="w-6 h-6" />,
};

const PLANS = [
  {
    key: "free",
    img: planFreeImg,
    name: "Free",
    price: "0",
    period: "/ Monat",
    borderColor: "border-[#2D3748]",
    badge: null as string | null,
    highlight: false,
    features: [
      "1 Shop",
      "10 Produkte",
      "500 MB Speicher",
      "Basis-Analytics",
      "Community-Support",
    ],
    cta: "Kostenlos starten",
    ctaStyle: "bg-[#1E293B] hover:bg-[#2D3748] text-[#F1F5F9] border border-[#2D3748]",
  },
  {
    key: "premium",
    img: planPremiumImg,
    name: "Premium",
    price: "19",
    period: "/ Monat",
    borderColor: "border-[#6366F1]",
    badge: "Beliebt",
    highlight: true,
    features: [
      "5 Shops",
      "100 Produkte",
      "5 GB Speicher",
      "Erweiterte Analytics",
      "Prioritäts-Support",
      "Affiliate-Programm",
    ],
    cta: "Premium starten",
    ctaStyle: "bg-[#6366F1] hover:bg-[#4F46E5] text-white",
  },
  {
    key: "business",
    img: planBusinessImg,
    name: "Business",
    price: "49",
    period: "/ Monat",
    borderColor: "border-[#F59E0B]",
    badge: null as string | null,
    highlight: false,
    features: [
      "20 Shops",
      "500 Produkte",
      "20 GB Speicher",
      "Vollständige Analytics",
      "Dedizierter Support",
      "API-Zugang",
      "Webhook-Integration",
    ],
    cta: "Business starten",
    ctaStyle: "bg-[#F59E0B] hover:bg-[#D97706] text-[#0F172A] font-semibold",
  },
  {
    key: "enterprise",
    img: planEnterpriseImg,
    name: "Enterprise",
    price: "Auf Anfrage",
    period: "",
    borderColor: "border-[#06B6D4]",
    badge: null as string | null,
    highlight: false,
    features: [
      "Unbegrenzte Shops",
      "Unbegrenzte Produkte",
      "Unbegrenzter Speicher",
      "Custom Analytics",
      "24/7 Premium-Support",
      "SLA-Garantie",
      "White-Label-Option",
    ],
    cta: "Kontakt aufnehmen",
    ctaStyle: "bg-[#06B6D4]/10 hover:bg-[#06B6D4]/20 text-[#06B6D4] border border-[#06B6D4]/30",
  },
];

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
              { value: "€2M+", label: "Umsatz" },
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

      {/* Pricing Section */}
      <section id="pricing" className="py-16 md:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-12">
            <span className="inline-block px-3 py-1 text-xs font-semibold text-[#6366F1] bg-[#6366F1]/10 rounded-full border border-[#6366F1]/20 mb-4">
              Preise
            </span>
            <h2 className="text-2xl md:text-3xl font-bold text-[#F1F5F9] mb-3">
              Der richtige Plan für jeden
            </h2>
            <p className="text-[#94A3B8] max-w-xl mx-auto text-sm">
              Starte kostenlos und wachse mit deinem Business. Kein Risiko, jederzeit kündbar.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 items-start">
            {PLANS.map((plan) => (
              <div
                key={plan.key}
                className={`relative rounded-2xl border ${
                  plan.highlight
                    ? "border-[#6366F1] shadow-xl shadow-[#6366F1]/20 lg:-translate-y-2"
                    : plan.borderColor
                } bg-[#0F172A] overflow-hidden flex flex-col transition-all duration-200 hover:-translate-y-1 hover:shadow-lg`}
              >
                {plan.badge && (
                  <div className="absolute top-3 right-3 z-10">
                    <span className="px-2.5 py-1 text-xs font-bold bg-[#6366F1] text-white rounded-full shadow">
                      {plan.badge}
                    </span>
                  </div>
                )}

                {/* Plan-Bild */}
                <div className="h-36 overflow-hidden shrink-0">
                  <img
                    src={plan.img}
                    alt={`${plan.name} Plan`}
                    className="w-full h-full object-cover"
                  />
                </div>

                <div className="p-5 flex flex-col flex-1">
                  <h3 className="text-lg font-bold text-[#F1F5F9] mb-1">{plan.name}</h3>
                  <div className="flex items-baseline gap-1 mb-5">
                    {plan.price === "Auf Anfrage" ? (
                      <span className="text-xl font-bold text-[#F1F5F9]">Auf Anfrage</span>
                    ) : (
                      <>
                        <span className="text-3xl font-bold text-[#F1F5F9]">
                          {plan.price === "0" ? "Kostenlos" : `€${plan.price}`}
                        </span>
                        {plan.period && (
                          <span className="text-sm text-[#64748B]">{plan.period}</span>
                        )}
                      </>
                    )}
                  </div>

                  <ul className="space-y-2.5 mb-6 flex-1">
                    {plan.features.map((f) => (
                      <li key={f} className="flex items-center gap-2 text-sm text-[#94A3B8]">
                        <Check className="w-4 h-4 text-green-400 shrink-0" />
                        {f}
                      </li>
                    ))}
                  </ul>

                  <Link to="/register">
                    <button
                      className={`w-full py-2.5 px-4 rounded-xl text-sm font-medium transition-colors ${plan.ctaStyle}`}
                    >
                      {plan.cta}
                    </button>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Trust Section */}
      <section className="py-12 md:py-16 bg-[#111827]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {[
              { icon: <Shield className="w-5 h-5" />, title: "Sichere Zahlungen", desc: "SSL-verschlüsselt mit Stripe & PayPal" },
              { icon: <Zap className="w-5 h-5" />, title: "Sofortige Lieferung", desc: "Automatischer Download nach Kauf" },
              { icon: <Globe className="w-5 h-5" />, title: "Weltweit verfügbar", desc: "Verkaufe in über 135 Ländern" },
            ].map((item) => (
              <div key={item.title} className="flex items-start gap-4 p-5 rounded-xl bg-[#0F172A] card-shadow">
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
