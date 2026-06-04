import { useState } from "react";
import { useParams, Link } from "react-router";
import { trpc } from "@/providers/trpc";
import { useCart } from "@/hooks/useCart";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Star,
  ShoppingCart,
  Shield,
  ChevronRight,
  Minus,
  Plus,
  Loader2,
  Lock,
  CreditCard,
  Bitcoin,
  Check,
  Package,
} from "lucide-react";
import { toast } from "sonner";

export default function ProductDetail() {
  const { slug } = useParams<{ slug: string }>();
  const { sessionId, refreshCart } = useCart();
  const [quantity, setQuantity] = useState(1);

  const { data: product, isLoading } = trpc.product.getBySlug.useQuery(
    { slug: slug ?? "" },
    { enabled: !!slug }
  );
  const { data: reviews } = trpc.review.listByProduct.useQuery(
    { productId: product?.id ?? 0 },
    { enabled: !!product }
  );

  const addToCart = trpc.cart.add.useMutation({
    onSuccess: () => {
      refreshCart();
      toast.success("Zum Warenkorb hinzugefügt");
    },
  });

  const handleAddToCart = () => {
    if (!product) return;
    addToCart.mutate({ sessionId, productId: product.id, quantity });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0A0E1A] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-[#6366F1] animate-spin" />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-[#0A0E1A]">
        <Navbar />
        <div className="pt-[72px] flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-[#F1F5F9] mb-4">Produkt nicht gefunden</h1>
            <Link to="/" className="text-[#6366F1] hover:underline">Zurück zur Startseite</Link>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  const rating = parseFloat(product.rating ?? "0");

  return (
    <div className="min-h-screen bg-[#0A0E1A]">
      <Navbar />

      <main className="pt-[72px]">
        {/* Breadcrumb */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4">
          <div className="flex items-center gap-2 text-xs text-[#64748B]">
            <Link to="/" className="hover:text-[#6366F1] transition-colors">Startseite</Link>
            <ChevronRight className="w-3 h-3" />
            {product.category && (
              <>
                <Link to={`/?category=${product.category.slug}`} className="hover:text-[#6366F1] transition-colors">
                  {product.category.name}
                </Link>
                <ChevronRight className="w-3 h-3" />
              </>
            )}
            <span className="text-[#94A3B8]">{product.name}</span>
          </div>
        </div>

        {/* Product Content */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 pb-16">
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 lg:gap-12">
            {/* Left Column - Images & Details */}
            <div className="lg:col-span-3">
              <div className="rounded-2xl overflow-hidden bg-[#111827] card-shadow mb-8">
                <img
                  src={product.image ?? "https://placehold.co/800x500/1A2235/6366F1?text=No+Image"}
                  alt={product.name}
                  className="w-full aspect-[16/10] object-cover"
                />
              </div>

              <Tabs defaultValue="description" className="w-full">
                <TabsList className="bg-[#111827] border border-[#2D3748] p-1 mb-6">
                  <TabsTrigger
                    value="description"
                    className="text-xs data-[state=active]:bg-[#6366F1] data-[state=active]:text-white text-[#94A3B8]"
                  >
                    Beschreibung
                  </TabsTrigger>
                  <TabsTrigger
                    value="reviews"
                    className="text-xs data-[state=active]:bg-[#6366F1] data-[state=active]:text-white text-[#94A3B8]"
                  >
                    Bewertungen ({product.reviewCount})
                  </TabsTrigger>
                  <TabsTrigger
                    value="delivery"
                    className="text-xs data-[state=active]:bg-[#6366F1] data-[state=active]:text-white text-[#94A3B8]"
                  >
                    Lieferung
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="description" className="mt-0">
                  <div className="bg-[#111827] rounded-xl p-6 card-shadow">
                    <h2 className="text-lg font-semibold text-[#F1F5F9] mb-4">Produktbeschreibung</h2>
                    <p className="text-sm text-[#94A3B8] leading-relaxed whitespace-pre-line">
                      {product.description ?? "Keine Beschreibung verfügbar."}
                    </p>
                    <div className="mt-6 flex flex-wrap gap-2">
                      {product.tags?.map((tag) => (
                        <span key={tag} className="px-3 py-1 rounded-full bg-[#1A2235] text-[#94A3B8] text-xs">
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="reviews" className="mt-0">
                  <div className="bg-[#111827] rounded-xl p-6 card-shadow">
                    <h2 className="text-lg font-semibold text-[#F1F5F9] mb-4">Kundenbewertungen</h2>
                    {reviews && reviews.length > 0 ? (
                      <div className="space-y-4">
                        {reviews.map((review) => (
                          <div key={review.id} className="border-b border-[#2D3748] pb-4 last:border-0">
                            <div className="flex items-center gap-3 mb-2">
                              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-violet-500 flex items-center justify-center text-white text-xs font-bold">
                                {review.customerName[0]}
                              </div>
                              <div>
                                <p className="text-sm font-medium text-[#F1F5F9]">{review.customerName}</p>
                                <div className="flex">
                                  {[1, 2, 3, 4, 5].map((star) => (
                                    <Star
                                      key={star}
                                      className={`w-3 h-3 ${
                                        star <= review.rating
                                          ? "text-[#F59E0B] fill-[#F59E0B]"
                                          : "text-[#2D3748]"
                                      }`}
                                    />
                                  ))}
                                </div>
                              </div>
                            </div>
                            <p className="text-sm text-[#94A3B8] ml-11">{review.comment}</p>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-[#64748B]">Noch keine Bewertungen.</p>
                    )}
                  </div>
                </TabsContent>

                <TabsContent value="delivery" className="mt-0">
                  <div className="bg-[#111827] rounded-xl p-6 card-shadow">
                    <h2 className="text-lg font-semibold text-[#F1F5F9] mb-4">Digitale Lieferung</h2>
                    <div className="space-y-4">
                      <div className="flex items-start gap-3">
                        <Check className="w-5 h-5 text-[#22C55E] shrink-0 mt-0.5" />
                        <div>
                          <p className="text-sm font-medium text-[#F1F5F9]">Sofortige Lieferung</p>
                          <p className="text-xs text-[#94A3B8]">Du erhältst sofort nach Zahlungseingang Zugriff auf dein Produkt.</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <Check className="w-5 h-5 text-[#22C55E] shrink-0 mt-0.5" />
                        <div>
                          <p className="text-sm font-medium text-[#F1F5F9]">Lebenslanger Zugriff</p>
                          <p className="text-xs text-[#94A3B8]">Deine Käufe bleiben für immer in deinem Konto verfügbar.</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <Check className="w-5 h-5 text-[#22C55E] shrink-0 mt-0.5" />
                        <div>
                          <p className="text-sm font-medium text-[#F1F5F9]">Sichere Downloads</p>
                          <p className="text-xs text-[#94A3B8]">Alle Downloads werden über verschlüsselte Verbindungen bereitgestellt.</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            </div>

            {/* Right Column - Purchase Panel */}
            <div className="lg:col-span-2">
              <div className="lg:sticky lg:top-[88px]">
                <div className="bg-[#111827] rounded-xl card-shadow p-6 mb-6">
                  <h1 className="text-2xl font-bold text-[#F1F5F9] mb-2">{product.name}</h1>

                  {/* Rating */}
                  {rating > 0 && (
                    <div className="flex items-center gap-2 mb-4">
                      <div className="flex">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star
                            key={star}
                            className={`w-4 h-4 ${
                              star <= Math.round(rating)
                                ? "text-[#F59E0B] fill-[#F59E0B]"
                                : "text-[#2D3748]"
                            }`}
                          />
                        ))}
                      </div>
                      <span className="text-sm text-[#94A3B8]">{rating} ({product.reviewCount} Bewertungen)</span>
                    </div>
                  )}

                  {/* Price */}
                  <div className="flex items-baseline gap-3 mb-6 pb-6 border-b border-[#2D3748]">
                    <span className="text-3xl font-bold text-[#6366F1]">{product.price} &euro;</span>
                    {product.compareAtPrice && (
                      <span className="text-lg text-[#64748B] line-through">{product.compareAtPrice} &euro;</span>
                    )}
                  </div>

                  {/* Quantity */}
                  <div className="mb-6">
                    <label className="text-xs font-medium text-[#94A3B8] uppercase tracking-wider mb-2 block">
                      Menge
                    </label>
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => setQuantity(Math.max(1, quantity - 1))}
                        className="w-10 h-10 rounded-lg bg-[#1A2235] border border-[#2D3748] flex items-center justify-center text-[#F1F5F9] hover:border-[#6366F1] transition-colors"
                      >
                        <Minus className="w-4 h-4" />
                      </button>
                      <span className="w-12 text-center text-lg font-semibold text-[#F1F5F9]">{quantity}</span>
                      <button
                        onClick={() => setQuantity(quantity + 1)}
                        className="w-10 h-10 rounded-lg bg-[#1A2235] border border-[#2D3748] flex items-center justify-center text-[#F1F5F9] hover:border-[#6366F1] transition-colors"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="space-y-3">
                    <Button
                      onClick={handleAddToCart}
                      disabled={addToCart.isPending}
                      className="w-full h-12 gradient-bg text-white font-semibold hover:opacity-90"
                    >
                      {addToCart.isPending ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                      ) : (
                        <>
                          <ShoppingCart className="w-5 h-5 mr-2" />
                          In den Warenkorb
                        </>
                      )}
                    </Button>
                    <Link to="/cart" className="block">
                      <Button
                        variant="outline"
                        className="w-full h-12 border-[#2D3748] text-[#F1F5F9] hover:bg-[#1A2235]"
                      >
                        Jetzt kaufen
                      </Button>
                    </Link>
                  </div>

                  {/* Payment Methods */}
                  <div className="mt-6 pt-6 border-t border-[#2D3748]">
                    <p className="text-xs text-[#64748B] mb-3 text-center">Zahlungsmethoden</p>
                    <div className="flex items-center justify-center gap-4">
                      <div className="flex items-center gap-1.5 text-[#64748B]">
                        <CreditCard className="w-4 h-4" />
                        <span className="text-xs">Stripe</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-[#64748B]">
                        <Lock className="w-4 h-4" />
                        <span className="text-xs">PayPal</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-[#64748B]">
                        <Bitcoin className="w-4 h-4" />
                        <span className="text-xs">Crypto</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Trust Badges */}
                <div className="bg-[#111827] rounded-xl card-shadow p-5 space-y-3">
                  <div className="flex items-center gap-3 text-sm text-[#94A3B8]">
                    <Shield className="w-4 h-4 text-[#22C55E]" />
                    Sichere SSL-Zahlung
                  </div>
                  <div className="flex items-center gap-3 text-sm text-[#94A3B8]">
                    <Package className="w-4 h-4 text-[#22C55E]" />
                    Sofortige digitale Lieferung
                  </div>
                  <div className="flex items-center gap-3 text-sm text-[#94A3B8]">
                    <Check className="w-4 h-4 text-[#22C55E]" />
                    14 Tage Geld-zurück-Garantie
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
