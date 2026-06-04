import { useParams, Link } from "react-router";
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
  Tag,
  ArrowLeft,
} from "lucide-react";
import Navbar from "@/components/Navbar";

function formatCurrency(val: number, currency = "EUR") {
  return new Intl.NumberFormat("de-DE", { style: "currency", currency }).format(val);
}

const TYPE_LABEL: Record<string, string> = {
  file: "Datei",
  license: "Lizenz",
  service: "Service",
  subscription: "Abo",
};

export default function StorePage() {
  const { slug } = useParams<{ slug: string }>();
  const { data, isLoading, error } = trpc.seller.getPublicShop.useQuery(
    { slug: slug ?? "" },
    { enabled: !!slug }
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
        <h1 className="text-2xl font-bold text-white mb-2">Shop nicht gefunden</h1>
        <p className="text-gray-400 mb-6">Der Shop <span className="text-indigo-400 font-mono">/store/{slug}</span> existiert nicht oder ist nicht aktiv.</p>
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
      <Navbar />

      {/* Banner */}
      <div className="relative h-40 sm:h-56 bg-gradient-to-r from-indigo-600/30 via-violet-600/20 to-indigo-600/30 overflow-hidden">
        {shop.banner && (
          <img src={shop.banner} alt="Banner" className="w-full h-full object-cover" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-[#0A0E1A] to-transparent" />
      </div>

      {/* Shop Header */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6">
        <div className="flex items-end gap-4 -mt-10 sm:-mt-14 mb-6 relative z-10">
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
              <Badge className="bg-green-500/20 text-green-400 text-xs">Aktiv</Badge>
              {shop.category && shop.category !== "general" && (
                <Badge className="bg-indigo-500/20 text-indigo-400 text-xs capitalize">{shop.category}</Badge>
              )}
            </div>
            <div className="flex items-center gap-1 text-xs text-gray-500 mt-1">
              <Globe className="w-3 h-3" />
              <span>digisell.app/store/{shop.slug}</span>
            </div>
          </div>
        </div>

        {shop.description && (
          <p className="text-gray-400 text-sm sm:text-base mb-6 max-w-2xl">{shop.description}</p>
        )}

        {/* Stats */}
        <div className="flex items-center gap-4 sm:gap-6 mb-8 flex-wrap">
          <div className="flex items-center gap-1.5 text-gray-400 text-sm">
            <Package className="w-4 h-4 text-indigo-400" />
            <span>{shop.totalProducts} Produkte</span>
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

        {/* Products */}
        <div className="mb-12">
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
                  className="block"
                >
                  <div className="bg-[#1A2235] rounded-2xl border border-[#2D3748] hover:border-indigo-500/50 transition-all hover:shadow-lg hover:shadow-indigo-500/10 overflow-hidden group">
                    {/* Product Image */}
                    <div className="h-40 bg-gradient-to-br from-indigo-600/20 to-violet-600/20 flex items-center justify-center overflow-hidden">
                      {product.image ? (
                        <img src={product.image} alt={product.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                      ) : (
                        <Package className="w-12 h-12 text-indigo-400/50" />
                      )}
                    </div>

                    <div className="p-4">
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <h3 className="text-white font-semibold text-sm leading-tight line-clamp-2 flex-1">{product.name}</h3>
                        <Badge className="bg-indigo-500/20 text-indigo-400 text-xs shrink-0">{TYPE_LABEL[product.type] ?? product.type}</Badge>
                      </div>

                      {product.shortDescription && (
                        <p className="text-gray-500 text-xs line-clamp-2 mb-3">{product.shortDescription}</p>
                      )}

                      <div className="flex items-center justify-between mt-3">
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
                        {product.stock !== -1 && product.stock <= 10 && product.stock > 0 && (
                          <span className="text-xs text-orange-400">Nur {product.stock} übrig</span>
                        )}
                        {product.stock === 0 && (
                          <Badge className="bg-red-500/20 text-red-400 text-xs">Ausverkauft</Badge>
                        )}
                      </div>

                      <Button className="w-full mt-3 bg-indigo-600 hover:bg-indigo-700 text-white text-sm h-9">
                        <ShoppingCart className="w-3.5 h-3.5 mr-1.5" />
                        Kaufen
                      </Button>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
