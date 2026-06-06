import { useParams, Link } from "react-router";
import { useShopBuyerAuth } from "@/hooks/useShopBuyerAuth";
import { trpc } from "@/providers/trpc";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Package,
  ShoppingCart,
  ArrowLeft,
  Loader2,
  AlertCircle,
  Key,
  FileText,
  Star,
  Shield,
  Zap,
  Download,
  Store,
  LogIn,
  UserCircle,
} from "lucide-react";

function formatCurrency(val: number, currency = "EUR") {
  return new Intl.NumberFormat("de-DE", { style: "currency", currency }).format(val);
}

const TYPE_LABEL: Record<string, string> = {
  file: "Digitale Datei",
  license: "Lizenzkey / Serial",
  service: "Service",
  subscription: "Abonnement",
};

const TYPE_ICON: Record<string, React.ReactNode> = {
  file: <Download className="w-4 h-4" />,
  license: <Key className="w-4 h-4" />,
  service: <Zap className="w-4 h-4" />,
  subscription: <Shield className="w-4 h-4" />,
};

export default function StoreProductPage() {
  const { slug: shopSlug, productSlug } = useParams<{ slug: string; productSlug: string }>();
  const { buyer } = useShopBuyerAuth(shopSlug);

  const { data, isLoading, error } = trpc.seller.getPublicProduct.useQuery(
    { shopSlug: shopSlug ?? "", productSlug: productSlug ?? "" },
    { enabled: !!shopSlug && !!productSlug }
  );

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0A0E1A] flex items-center justify-center">
        <Loader2 className="w-10 h-10 animate-spin text-indigo-400" />
      </div>
    );
  }

  if (!data || error) {
    return (
      <div className="min-h-screen bg-[#0A0E1A] flex flex-col items-center justify-center px-4 text-center">
        <AlertCircle className="w-16 h-16 text-red-400 mb-4" />
        <h1 className="text-2xl font-bold text-white mb-2">Produkt nicht gefunden</h1>
        <p className="text-gray-400 mb-6">Dieses Produkt existiert nicht oder ist nicht verfügbar.</p>
        <Link to={`/store/${shopSlug}`}>
          <Button className="bg-indigo-600 hover:bg-indigo-700 text-white">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Zurück zum Shop
          </Button>
        </Link>
      </div>
    );
  }

  const { shop, product, availableKeys, files } = data;
  const isOutOfStock = product.type === "license" && availableKeys === 0;

  return (
    <div className="min-h-screen bg-[#0A0E1A]">
      {/* Shop-Header (eigenständig, kein DigiSell-Branding) */}
      <header className="bg-[#111827] border-b border-[#2D3748] sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between gap-4">
          <Link to={`/store/${shop.slug}`} className="flex items-center gap-2.5 group">
            {shop.logo ? (
              <img src={shop.logo} alt={shop.name} className="w-8 h-8 rounded-lg object-cover" />
            ) : (
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center">
                <Store className="w-4 h-4 text-white" />
              </div>
            )}
            <span className="text-white font-semibold text-sm group-hover:text-indigo-400 transition-colors">{shop.name}</span>
          </Link>
          <div className="flex items-center gap-2 sm:gap-3">
            <Link
              to={`/store/${shop.slug}`}
              className="flex items-center gap-1.5 text-gray-400 hover:text-white text-sm transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="hidden sm:inline">Zurück zum Shop</span>
            </Link>
            <Link
              to={buyer ? `/store/${shop.slug}/account` : `/store/${shop.slug}/login`}
              className={buyer
                ? "inline-flex shrink-0 items-center justify-center rounded-md border border-[#334155] bg-[#1E293B] px-3 py-2 text-sm font-semibold text-white transition hover:bg-[#334155]"
                : "inline-flex shrink-0 items-center justify-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-lg shadow-indigo-900/30 transition hover:bg-indigo-700"
              }
            >
              {buyer ? <UserCircle className="w-4 h-4 mr-1.5" /> : <LogIn className="w-4 h-4 mr-1.5" />}
              {buyer ? "Shop-Konto" : "Shop-Login"}
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
          {/* Linke Spalte — Produktbild + Infos */}
          <div className="lg:col-span-3 space-y-6">
            {/* Produktbild */}
            <div className="bg-[#1A2235] rounded-2xl border border-[#2D3748] overflow-hidden">
              <div className="h-56 sm:h-72 bg-gradient-to-br from-indigo-600/20 to-violet-600/20 flex items-center justify-center">
                {product.image ? (
                  <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
                ) : (
                  <Package className="w-20 h-20 text-indigo-400/30" />
                )}
              </div>
            </div>

            {/* Produktbeschreibung */}
            <div className="bg-[#1A2235] rounded-2xl border border-[#2D3748] p-5 sm:p-6">
              <h2 className="text-white font-semibold text-base mb-3">Beschreibung</h2>
              {product.description ? (
                <p className="text-gray-400 text-sm leading-relaxed whitespace-pre-wrap">{product.description}</p>
              ) : (
                <p className="text-gray-600 text-sm italic">Keine Beschreibung vorhanden.</p>
              )}
            </div>

            {/* Lieferinhalt */}
            {(files.length > 0 || product.type === "license") && (
              <div className="bg-[#1A2235] rounded-2xl border border-[#2D3748] p-5 sm:p-6">
                <h2 className="text-white font-semibold text-base mb-3 flex items-center gap-2">
                  <Package className="w-4 h-4 text-indigo-400" />
                  Lieferinhalt
                </h2>
                {product.type === "license" && (
                  <div className="flex items-center gap-2 py-2.5 border-b border-[#2D3748] last:border-0">
                    <Key className="w-4 h-4 text-indigo-400 shrink-0" />
                    <span className="text-gray-300 text-sm">Lizenzkey / Serial wird nach Kauf automatisch geliefert</span>
                  </div>
                )}
                {files.map((f) => (
                  <div key={f.id} className="flex items-center gap-2 py-2.5 border-b border-[#2D3748] last:border-0">
                    <FileText className="w-4 h-4 text-indigo-400 shrink-0" />
                    <span className="text-gray-300 text-sm">{f.name}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Rechte Spalte — Kauf-Box */}
          <div className="lg:col-span-2">
            <div className="bg-[#1A2235] rounded-2xl border border-[#2D3748] p-5 sm:p-6 sticky top-20">
              {/* Produktname & Typ */}
              <div className="mb-4">
                <div className="flex items-center gap-2 mb-2 flex-wrap">
                  <Badge className="bg-indigo-500/20 text-indigo-400 text-xs flex items-center gap-1">
                    {TYPE_ICON[product.type]}
                    {TYPE_LABEL[product.type] ?? product.type}
                  </Badge>
                  {product.tags && (product.tags as string[]).map((tag) => (
                    <Badge key={tag} className="bg-[#2D3748] text-gray-400 text-xs">{tag}</Badge>
                  ))}
                </div>
                <h1 className="text-xl sm:text-2xl font-bold text-white leading-tight">{product.name}</h1>
                {product.shortDescription && (
                  <p className="text-gray-400 text-sm mt-2">{product.shortDescription}</p>
                )}
              </div>

              {/* Preis */}
              <div className="mb-5 pb-5 border-b border-[#2D3748]">
                <div className="flex items-baseline gap-3">
                  <span className="text-3xl font-bold text-white">
                    {formatCurrency(Number(product.price), shop.currency)}
                  </span>
                  {product.compareAtPrice && Number(product.compareAtPrice) > Number(product.price) && (
                    <span className="text-gray-500 line-through text-lg">
                      {formatCurrency(Number(product.compareAtPrice), shop.currency)}
                    </span>
                  )}
                </div>
                {product.compareAtPrice && Number(product.compareAtPrice) > Number(product.price) && (
                  <Badge className="mt-1 bg-green-500/20 text-green-400 text-xs">
                    {Math.round((1 - Number(product.price) / Number(product.compareAtPrice)) * 100)}% Rabatt
                  </Badge>
                )}
              </div>

              {/* Lagerbestand */}
              {product.type === "license" && (
                <div className="mb-4 flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${availableKeys > 0 ? "bg-green-400" : "bg-red-400"}`} />
                  <span className={`text-sm ${availableKeys > 0 ? "text-green-400" : "text-red-400"}`}>
                    {availableKeys > 0 ? `${availableKeys} verfügbar` : "Ausverkauft"}
                  </span>
                </div>
              )}
              {product.type !== "license" && product.stock !== -1 && (
                <div className="mb-4 flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${product.stock > 0 ? "bg-green-400" : "bg-red-400"}`} />
                  <span className={`text-sm ${product.stock > 0 ? "text-green-400" : "text-red-400"}`}>
                    {product.stock > 0 ? `${product.stock} auf Lager` : "Ausverkauft"}
                  </span>
                </div>
              )}

              {!buyer && (
                <div className="mb-3 rounded-xl border border-indigo-500/25 bg-indigo-500/10 p-3">
                  <p className="text-sm font-semibold text-white">Shop-Login erforderlich</p>
                  <p className="text-xs text-indigo-200/80 mt-1">Melde dich mit dem Käuferkonto dieses Shops an. Ein Konto aus einem anderen Shop gilt hier nicht.</p>
                  <Link
                    to={`/store/${shop.slug}/login`}
                    className="mt-3 inline-flex w-full items-center justify-center rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-indigo-700"
                  >
                    <LogIn className="w-4 h-4 mr-2" />
                    Zum Shop-Login
                  </Link>
                </div>
              )}

              {/* Kaufen Button */}
              <Button
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white h-12 text-base font-semibold mb-3"
                disabled={isOutOfStock || !buyer}
              >
                <ShoppingCart className="w-5 h-5 mr-2" />
                {isOutOfStock ? "Ausverkauft" : buyer ? "Jetzt kaufen" : "Bitte im Shop einloggen"}
              </Button>

              {/* Vertrauens-Badges */}
              <div className="space-y-2 mt-4 pt-4 border-t border-[#2D3748]">
                <div className="flex items-center gap-2 text-gray-500 text-xs">
                  <Shield className="w-3.5 h-3.5 text-green-400 shrink-0" />
                  <span>Sichere Zahlung</span>
                </div>
                <div className="flex items-center gap-2 text-gray-500 text-xs">
                  <Zap className="w-3.5 h-3.5 text-yellow-400 shrink-0" />
                  <span>Sofortige Lieferung nach Kauf</span>
                </div>
                <div className="flex items-center gap-2 text-gray-500 text-xs">
                  <Star className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                  <span>Verifizierter Verkäufer</span>
                </div>
              </div>

              {/* Verkäufer-Info */}
              <div className="mt-4 pt-4 border-t border-[#2D3748]">
                <Link to={`/store/${shop.slug}`} className="flex items-center gap-2.5 group">
                  {shop.logo ? (
                    <img src={shop.logo} alt={shop.name} className="w-8 h-8 rounded-lg object-cover shrink-0" />
                  ) : (
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shrink-0">
                      <Store className="w-4 h-4 text-white" />
                    </div>
                  )}
                  <div>
                    <p className="text-white text-xs font-medium group-hover:text-indigo-400 transition-colors">{shop.name}</p>
                    <p className="text-gray-500 text-xs">Alle Produkte ansehen →</p>
                  </div>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-[#2D3748] mt-16 py-6 text-center">
        <p className="text-gray-600 text-xs">
          Powered by <span className="text-indigo-400">DigiSell</span>
        </p>
      </footer>
    </div>
  );
}
