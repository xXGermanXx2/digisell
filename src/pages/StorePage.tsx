import { useParams, Link } from "react-router";
import { useAuth } from "@/hooks/useAuth";
import { trpc } from "@/providers/trpc";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Store,
  Package,
  ShoppingCart,
  Star,
  Globe,
  Loader2,
  AlertCircle,
  ArrowLeft,
  Key,
  Download,
  Zap,
  Shield,
  Coins,
  Wallet,
  LogIn,
  UserCircle,
} from "lucide-react";

function formatCurrency(val: number, currency = "EUR") {
  return new Intl.NumberFormat("de-DE", { style: "currency", currency }).format(val);
}

const TYPE_LABEL: Record<string, string> = {
  file: "Datei",
  license: "Lizenz",
  service: "Service",
  subscription: "Abo",
};

const TYPE_ICON: Record<string, React.ReactNode> = {
  file: <Download className="w-3 h-3" />,
  license: <Key className="w-3 h-3" />,
  service: <Zap className="w-3 h-3" />,
  subscription: <Shield className="w-3 h-3" />,
};

export default function StorePage() {
  const { slug } = useParams<{ slug: string }>();
  const { user } = useAuth({});
  const { data, isLoading, error } = trpc.seller.getPublicShop.useQuery(
    { slug: slug ?? "" },
    { enabled: !!slug }
  );
  const shopId = data?.shop?.id;
  const { data: shopCredits } = trpc.credits.getMyShopCredits.useQuery(
    { shopId: shopId ?? "" },
    { enabled: !!user && !!shopId }
  );
  const myShopBalance = shopCredits?.balance ?? 0;

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
        <h1 className="text-2xl font-bold text-white mb-2">Shop nicht gefunden</h1>
        <p className="text-gray-400 mb-6">
          Der Shop <span className="text-indigo-400 font-mono">/store/{slug}</span> existiert nicht oder ist nicht aktiv.
        </p>
        <Link to="/">
          <Button className="bg-indigo-600 hover:bg-indigo-700 text-white">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Zur Startseite
          </Button>
        </Link>
      </div>
    );
  }

  const { shop, products } = data;

  return (
    <div className="min-h-screen bg-[#0A0E1A]">
      {/* Eigenständiger Shop-Header — kein DigiSell-Branding */}
      <header className="bg-[#111827] border-b border-[#2D3748] sticky top-0 z-40">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            {shop.logo ? (
              <img src={shop.logo} alt={shop.name} className="w-8 h-8 rounded-lg object-cover" />
            ) : (
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center">
                <Store className="w-4 h-4 text-white" />
              </div>
            )}
            <span className="text-white font-semibold text-sm">{shop.name}</span>
            <Badge className="bg-green-500/20 text-green-400 text-xs hidden sm:flex">Aktiv</Badge>
          </div>
          <div className="flex items-center gap-3">
            {user && myShopBalance > 0 && (
              <div className="flex items-center gap-1.5 bg-violet-500/10 border border-violet-500/20 rounded-full px-3 py-1">
                <Coins className="w-3.5 h-3.5 text-violet-400" />
                <span className="text-xs font-semibold text-violet-400">{myShopBalance.toFixed(2)} Credits</span>
              </div>
            )}
            <div className="hidden md:flex items-center gap-1 text-gray-500 text-xs">
              <Globe className="w-3 h-3" />
              <span>digisell.app/store/{shop.slug}</span>
            </div>
            <Link
              to={user ? "/dashboard" : "/login"}
              className={user
                ? "inline-flex shrink-0 items-center justify-center rounded-md border border-[#334155] bg-[#1E293B] px-3 py-2 text-sm font-semibold text-white transition hover:bg-[#334155]"
                : "inline-flex shrink-0 items-center justify-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-lg shadow-indigo-900/30 transition hover:bg-indigo-700"
              }
            >
              {user ? <UserCircle className="w-4 h-4 mr-1.5" /> : <LogIn className="w-4 h-4 mr-1.5" />}
              {user ? "Käuferkonto" : "Käufer-Login"}
            </Link>
          </div>
        </div>
      </header>

      {/* Banner */}
      <div className="relative h-36 sm:h-52 bg-gradient-to-r from-indigo-600/30 via-violet-600/20 to-indigo-600/30 overflow-hidden">
        {shop.banner && (
          <img src={shop.banner} alt="Banner" className="w-full h-full object-cover" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-[#0A0E1A] to-transparent" />
      </div>

      {/* Shop-Profil */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6">
        <div className="flex items-end gap-4 -mt-10 sm:-mt-12 mb-6 relative z-10">
          <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center overflow-hidden border-4 border-[#0A0E1A] shrink-0">
            {shop.logo ? (
              <img src={shop.logo} alt="Logo" className="w-full h-full object-cover" />
            ) : (
              <Store className="w-10 h-10 sm:w-12 sm:h-12 text-white" />
            )}
          </div>
          <div className="pb-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xl sm:text-2xl font-bold text-white">{shop.name}</h1>
              {shop.category && shop.category !== "general" && (
                <Badge className="bg-indigo-500/20 text-indigo-400 text-xs capitalize">{shop.category}</Badge>
              )}
            </div>
          </div>
        </div>

        {shop.description && (
          <p className="text-gray-400 text-sm sm:text-base mb-5 max-w-2xl">{shop.description}</p>
        )}

        <div className="mb-6 rounded-xl border border-indigo-500/25 bg-indigo-500/10 p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-white">Käuferbereich</p>
            <p className="text-xs text-indigo-200/80 mt-1">Melde dich an, um Käufe, Downloads, Rechnungen und Support-Tickets zu verwalten.</p>
          </div>
          <Link
            to={user ? "/dashboard" : "/login"}
            className="inline-flex shrink-0 items-center justify-center rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-indigo-700"
          >
            {user ? <UserCircle className="w-4 h-4 mr-2" /> : <LogIn className="w-4 h-4 mr-2" />}
            {user ? "Zum Käuferkonto" : "Zum Käufer-Login"}
          </Link>
        </div>

        {/* Stats */}
        <div className="flex items-center gap-4 sm:gap-6 mb-8 flex-wrap">
          <div className="flex items-center gap-1.5 text-gray-400 text-sm">
            <Package className="w-4 h-4 text-indigo-400" />
            <span>{products.length} Produkte</span>
          </div>
          <div className="flex items-center gap-1.5 text-gray-400 text-sm">
            <ShoppingCart className="w-4 h-4 text-green-400" />
            <span>{shop.totalOrders} Bestellungen</span>
          </div>
          <div className="flex items-center gap-1.5 text-gray-400 text-sm">
            <Star className="w-4 h-4 text-yellow-400" />
            <span>Verifizierter Verkäufer</span>
          </div>
        </div>

        {/* Shop-Guthaben Banner (nur wenn eingeloggt und Guthaben vorhanden) */}
        {user && myShopBalance > 0 && (
          <div className="mb-6 bg-violet-500/10 border border-violet-500/20 rounded-xl p-4 flex items-center gap-4">
            <div className="w-10 h-10 rounded-lg bg-violet-500/20 flex items-center justify-center flex-shrink-0">
              <Wallet className="w-5 h-5 text-violet-400" />
            </div>
            <div>
              <p className="text-sm font-semibold text-violet-300">Du hast <span className="text-violet-400">{myShopBalance.toFixed(2)} Credits</span> in diesem Shop</p>
              <p className="text-xs text-violet-400/70 mt-0.5">Dein Shop-Guthaben kann beim Kauf von Produkten in diesem Shop eingesetzt werden.</p>
            </div>
          </div>
        )}
        {/* Produkte */}
        <div className="mb-16">
          <h2 className="text-lg sm:text-xl font-bold text-white mb-4">
            Produkte
            <span className="ml-2 text-sm font-normal text-gray-500">({products.length})</span>
          </h2>

          {products.length === 0 ? (
            <div className="bg-[#1A2235] rounded-2xl border border-[#2D3748] p-12 text-center">
              <Package className="w-12 h-12 text-gray-600 mx-auto mb-3" />
              <p className="text-gray-400">Dieser Shop hat noch keine Produkte.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {products.map((product) => (
                <Link
                  key={product.id}
                  to={`/store/${shop.slug}/product/${product.slug}`}
                  className="block group"
                >
                  <div className="bg-[#1A2235] rounded-2xl border border-[#2D3748] hover:border-indigo-500/50 transition-all hover:shadow-lg hover:shadow-indigo-500/10 overflow-hidden h-full flex flex-col">
                    {/* Produktbild */}
                    <div className="h-40 bg-gradient-to-br from-indigo-600/20 to-violet-600/20 flex items-center justify-center overflow-hidden shrink-0">
                      {product.image ? (
                        <img
                          src={product.image}
                          alt={product.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      ) : (
                        <Package className="w-12 h-12 text-indigo-400/40" />
                      )}
                    </div>

                    <div className="p-4 flex flex-col flex-1">
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <h3 className="text-white font-semibold text-sm leading-tight line-clamp-2 flex-1">
                          {product.name}
                        </h3>
                        <Badge className="bg-indigo-500/20 text-indigo-400 text-xs shrink-0 flex items-center gap-1">
                          {TYPE_ICON[product.type]}
                          {TYPE_LABEL[product.type] ?? product.type}
                        </Badge>
                      </div>

                      {product.shortDescription && (
                        <p className="text-gray-500 text-xs line-clamp-2 mb-3">{product.shortDescription}</p>
                      )}

                      <div className="mt-auto">
                        <div className="flex items-center justify-between mb-3">
                          <div>
                            <span className="text-xl font-bold text-white">
                              {formatCurrency(Number(product.price), shop.currency)}
                            </span>
                            {product.compareAtPrice && Number(product.compareAtPrice) > Number(product.price) && (
                              <span className="ml-2 text-xs text-gray-500 line-through">
                                {formatCurrency(Number(product.compareAtPrice), shop.currency)}
                              </span>
                            )}
                          </div>
                          {product.stock === 0 && (
                            <Badge className="bg-red-500/20 text-red-400 text-xs">Ausverkauft</Badge>
                          )}
                          {product.stock !== -1 && product.stock > 0 && product.stock <= 10 && (
                            <span className="text-xs text-orange-400">Nur {product.stock} übrig</span>
                          )}
                        </div>

                        <Button
                          className="w-full bg-indigo-600 hover:bg-indigo-700 text-white text-sm h-9"
                          disabled={product.stock === 0}
                        >
                          <ShoppingCart className="w-3.5 h-3.5 mr-1.5" />
                          {product.stock === 0 ? "Ausverkauft" : "Kaufen"}
                        </Button>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Footer — nur "Powered by DigiSell" */}
      <footer className="border-t border-[#2D3748] py-6 text-center">
        <p className="text-gray-600 text-xs">
          Powered by <span className="text-indigo-400">DigiSell</span>
        </p>
      </footer>
    </div>
  );
}
