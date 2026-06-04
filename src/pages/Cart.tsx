import { Link } from "react-router";
import { trpc } from "@/providers/trpc";
import { useCart } from "@/hooks/useCart";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Minus,
  Plus,
  Trash2,
  ShoppingCart,
  ArrowLeft,
  Loader2,
  Package,
  Tag,
  X,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

interface CartProduct {
  id: number;
  name: string;
  slug: string;
  price: string;
  image: string | null;
  category: { name: string } | null;
}

export default function Cart() {
  const { sessionId, refreshCart } = useCart();
  const [couponCode, setCouponCode] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<{ code: string; type: string; value: string } | null>(null);
  const [customerEmail, setCustomerEmail] = useState("");
  const [checkoutStep, setCheckoutStep] = useState<"cart" | "checkout">("cart");

  const { data: cart, isLoading } = trpc.cart.get.useQuery({ sessionId });
  const updateQty = trpc.cart.updateQty.useMutation({ onSuccess: () => refreshCart() });
  const removeItem = trpc.cart.remove.useMutation({ onSuccess: () => refreshCart() });
  const clearCart = trpc.cart.clear.useMutation({ onSuccess: () => refreshCart() });
  const validateCoupon = trpc.coupon.validate.useQuery(
    { code: couponCode, orderAmount: cart?.total ?? "0" },
    { enabled: false }
  );
  const createOrder = trpc.order.create.useMutation({
    onSuccess: () => {
      clearCart.mutate({ sessionId });
      toast.success("Bestellung erfolgreich erstellt!");
      setCheckoutStep("cart");
    },
    onError: (err) => {
      toast.error(err.message);
    },
  });

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) return;
    const result = await validateCoupon.refetch();
    if (result.data?.valid && result.data.coupon) {
      setAppliedCoupon(result.data.coupon);
      toast.success("Gutschein angewendet!");
    } else {
      toast.error(result.data?.message ?? "Ung\u00fcltiger Gutschein");
    }
  };

  const handleCheckout = () => {
    if (!customerEmail.trim() || !customerEmail.includes("@")) {
      toast.error("Bitte gib eine g\u00fcltige E-Mail-Adresse ein");
      return;
    }
    if (!cart || cart.items.length === 0) return;

    const items = cart.items.map((item) => ({
      productId: item.productId,
      quantity: item.quantity,
    }));

    createOrder.mutate({
      customerEmail: customerEmail.trim(),
      items,
      paymentMethod: "stripe",
      couponCode: appliedCoupon?.code,
      sessionId,
    });
  };

  const cartTotal = parseFloat(cart?.total ?? "0");
  let discount = 0;
  if (appliedCoupon) {
    if (appliedCoupon.type === "percentage") {
      discount = cartTotal * (parseFloat(appliedCoupon.value) / 100);
    } else {
      discount = parseFloat(appliedCoupon.value);
    }
  }
  const finalTotal = Math.max(0, cartTotal - discount);
  const fee = finalTotal * 0.05;
  const grandTotal = finalTotal + fee;

  return (
    <div className="min-h-screen bg-[#0A0E1A]">
      <Navbar />

      <main className="pt-[72px]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
          <h1 className="text-2xl font-bold text-[#F1F5F9] mb-8">
            {checkoutStep === "cart" ? "Warenkorb" : "Kasse"}
          </h1>

          {isLoading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-8 h-8 text-[#6366F1] animate-spin" />
            </div>
          ) : !cart || cart.items.length === 0 ? (
            <div className="text-center py-20">
              <div className="w-20 h-20 rounded-full bg-[#1A2235] flex items-center justify-center mx-auto mb-6">
                <ShoppingCart className="w-10 h-10 text-[#64748B]" />
              </div>
              <h2 className="text-xl font-semibold text-[#F1F5F9] mb-2">Dein Warenkorb ist leer</h2>
              <p className="text-sm text-[#94A3B8] mb-6">Entdecke unsere Produkte und f\u00fcge sie deinem Warenkorb hinzu.</p>
              <Link to="/">
                <Button className="gradient-bg text-white hover:opacity-90">
                  Weiter einkaufen
                </Button>
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 space-y-4">
                {cart.items.map((item) => {
                  const product = (item as any).product as CartProduct | null;
                  return (
                    <div
                      key={item.id}
                      className="flex gap-4 p-4 rounded-xl bg-[#111827] card-shadow"
                    >
                      <img
                        src={product?.image ?? "https://placehold.co/120x90/1A2235/6366F1?text=No+Image"}
                        alt={product?.name ?? "Produkt"}
                        className="w-24 h-20 object-cover rounded-lg shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <Link
                            to={`/product/${product?.slug ?? ""}`}
                            className="text-sm font-medium text-[#F1F5F9] hover:text-[#6366F1] transition-colors line-clamp-1"
                          >
                            {product?.name ?? "Unbekanntes Produkt"}
                          </Link>
                          <button
                            onClick={() => removeItem.mutate({ cartItemId: item.id })}
                            className="p-1.5 rounded-lg hover:bg-[#EF4444]/10 text-[#64748B] hover:text-[#EF4444] transition-colors shrink-0"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                        <p className="text-xs text-[#94A3B8] mt-1">
                          {product?.category?.name ?? "Allgemein"}
                        </p>
                        <div className="flex items-center justify-between mt-3">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => {
                                if (item.quantity > 1) {
                                  updateQty.mutate({ cartItemId: item.id, quantity: item.quantity - 1 });
                                }
                              }}
                              className="w-7 h-7 rounded-md bg-[#1A2235] border border-[#2D3748] flex items-center justify-center text-[#F1F5F9] hover:border-[#6366F1]"
                            >
                              <Minus className="w-3 h-3" />
                            </button>
                            <span className="w-8 text-center text-sm font-medium text-[#F1F5F9]">
                              {item.quantity}
                            </span>
                            <button
                              onClick={() => updateQty.mutate({ cartItemId: item.id, quantity: item.quantity + 1 })}
                              className="w-7 h-7 rounded-md bg-[#1A2235] border border-[#2D3748] flex items-center justify-center text-[#F1F5F9] hover:border-[#6366F1]"
                            >
                              <Plus className="w-3 h-3" />
                            </button>
                          </div>
                          <span className="text-sm font-semibold text-[#6366F1]">
                            {(parseFloat(product?.price ?? "0") * item.quantity).toFixed(2)} &euro;
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}

                <button
                  onClick={() => clearCart.mutate({ sessionId })}
                  className="text-sm text-[#64748B] hover:text-[#EF4444] transition-colors flex items-center gap-1"
                >
                  <X className="w-3.5 h-3.5" />
                  Warenkorb leeren
                </button>

                {checkoutStep === "checkout" && (
                  <div className="mt-6">
                    <button
                      onClick={() => setCheckoutStep("cart")}
                      className="text-sm text-[#6366F1] hover:underline flex items-center gap-1"
                    >
                      <ArrowLeft className="w-4 h-4" />
                      Zur\u00fcck zum Warenkorb
                    </button>
                  </div>
                )}
              </div>

              <div className="lg:col-span-1">
                <div className="bg-[#111827] rounded-xl card-shadow p-6 lg:sticky lg:top-[88px]">
                  <h2 className="text-lg font-semibold text-[#F1F5F9] mb-6">Zusammenfassung</h2>

                  {checkoutStep === "cart" && (
                    <div className="mb-6 pb-6 border-b border-[#2D3748]">
                      <div className="flex items-center gap-2 mb-2">
                        <Tag className="w-4 h-4 text-[#94A3B8]" />
                        <span className="text-sm text-[#94A3B8]">Gutscheincode</span>
                      </div>
                      {appliedCoupon ? (
                        <div className="flex items-center justify-between p-3 rounded-lg bg-[#22C55E]/10 border border-[#22C55E]/20">
                          <span className="text-sm text-[#22C55E] font-medium">{appliedCoupon.code}</span>
                          <button
                            onClick={() => setAppliedCoupon(null)}
                            className="text-[#64748B] hover:text-[#EF4444]"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ) : (
                        <div className="flex gap-2">
                          <Input
                            placeholder="Code eingeben"
                            value={couponCode}
                            onChange={(e) => setCouponCode(e.target.value)}
                            className="h-9 bg-[#1A2235] border-[#2D3748] text-sm text-[#F1F5F9] placeholder:text-[#64748B]"
                          />
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={handleApplyCoupon}
                            className="h-9 border-[#2D3748] text-[#94A3B8] hover:bg-[#1A2235] shrink-0"
                          >
                            Anwenden
                          </Button>
                        </div>
                      )}
                    </div>
                  )}

                  <div className="space-y-3 mb-6">
                    <div className="flex justify-between text-sm">
                      <span className="text-[#94A3B8]">Zwischensumme</span>
                      <span className="text-[#F1F5F9]">{cartTotal.toFixed(2)} &euro;</span>
                    </div>
                    {discount > 0 && (
                      <div className="flex justify-between text-sm">
                        <span className="text-[#22C55E]">Rabatt</span>
                        <span className="text-[#22C55E]">-{discount.toFixed(2)} &euro;</span>
                      </div>
                    )}
                    <div className="flex justify-between text-sm">
                      <span className="text-[#94A3B8]">Geb\u00fchren (5%)</span>
                      <span className="text-[#F1F5F9]">{fee.toFixed(2)} &euro;</span>
                    </div>
                    <div className="flex justify-between text-lg font-semibold pt-3 border-t border-[#2D3748]">
                      <span className="text-[#F1F5F9]">Gesamt</span>
                      <span className="text-[#6366F1]">{grandTotal.toFixed(2)} &euro;</span>
                    </div>
                  </div>

                  {checkoutStep === "cart" ? (
                    <Button
                      onClick={() => setCheckoutStep("checkout")}
                      className="w-full h-12 gradient-bg text-white font-semibold hover:opacity-90"
                    >
                      Zur Kasse
                    </Button>
                  ) : (
                    <div className="space-y-4">
                      <div>
                        <label className="text-xs font-medium text-[#94A3B8] uppercase tracking-wider mb-2 block">
                          E-Mail-Adresse
                        </label>
                        <Input
                          type="email"
                          placeholder="deine@email.de"
                          value={customerEmail}
                          onChange={(e) => setCustomerEmail(e.target.value)}
                          className="h-11 bg-[#1A2235] border-[#2D3748] text-[#F1F5F9] placeholder:text-[#64748B]"
                        />
                      </div>
                      <Button
                        onClick={handleCheckout}
                        disabled={createOrder.isPending}
                        className="w-full h-12 gradient-bg text-white font-semibold hover:opacity-90"
                      >
                        {createOrder.isPending ? (
                          <Loader2 className="w-5 h-5 animate-spin" />
                        ) : (
                          "Bestellung aufgeben"
                        )}
                      </Button>
                      <p className="text-xs text-[#64748B] text-center">
                        Mit der Bestellung akzeptierst du unsere AGB.
                      </p>
                    </div>
                  )}

                  <div className="mt-4 flex items-center justify-center gap-2 text-xs text-[#64748B]">
                    <Package className="w-3.5 h-3.5" />
                    Sofortige digitale Lieferung
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
