import { Link } from "react-router";
import { Star, ShoppingCart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { trpc } from "@/providers/trpc";
import { useCart } from "@/hooks/useCart";
import { toast } from "sonner";

interface ProductCardProps {
  product: {
    id: number;
    name: string;
    slug: string;
    price: string;
    compareAtPrice: string | null;
    image: string | null;
    shortDescription: string | null;
    category: { name: string } | null;
    rating: string | null;
    soldCount: number;
  };
}

export default function ProductCard({ product }: ProductCardProps) {
  const { sessionId, refreshCart } = useCart();
  const addToCart = trpc.cart.add.useMutation({
    onSuccess: () => {
      refreshCart();
      toast.success("Zum Warenkorb hinzugefügt");
    },
    onError: (err) => {
      toast.error(err.message);
    },
  });

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    addToCart.mutate({ sessionId, productId: product.id, quantity: 1 });
  };

  const rating = parseFloat(product.rating ?? "0");

  return (
    <Link
      to={`/product/${product.slug}`}
      className="group block bg-[#111827] rounded-xl card-shadow overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:card-shadow-hover"
    >
      {/* Image */}
      <div className="relative aspect-[16/10] overflow-hidden">
        <img
          src={product.image ?? "https://placehold.co/600x400/1A2235/6366F1?text=No+Image"}
          alt={product.name}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
        {product.category && (
          <span className="absolute top-2 left-2 px-2 py-1 rounded-md bg-[#6366F1]/80 text-white text-[10px] font-medium uppercase tracking-wider backdrop-blur-sm">
            {product.category.name}
          </span>
        )}
      </div>

      {/* Content */}
      <div className="p-4">
        <h3 className="text-sm font-semibold text-[#F1F5F9] line-clamp-1 mb-1 group-hover:text-[#6366F1] transition-colors">
          {product.name}
        </h3>
        <p className="text-xs text-[#94A3B8] line-clamp-2 mb-3 min-h-[2rem]">
          {product.shortDescription ?? "Keine Beschreibung verfügbar"}
        </p>

        {/* Rating */}
        {rating > 0 && (
          <div className="flex items-center gap-1 mb-3">
            <div className="flex">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star
                  key={star}
                  className={`w-3 h-3 ${
                    star <= Math.round(rating)
                      ? "text-[#F59E0B] fill-[#F59E0B]"
                      : "text-[#2D3748]"
                  }`}
                />
              ))}
            </div>
            <span className="text-[10px] text-[#64748B]">({product.soldCount} verkauft)</span>
          </div>
        )}

        {/* Price & CTA */}
        <div className="flex items-center justify-between">
          <div className="flex items-baseline gap-2">
            <span className="text-lg font-bold text-[#6366F1]">{product.price} &euro;</span>
            {product.compareAtPrice && (
              <span className="text-xs text-[#64748B] line-through">{product.compareAtPrice} &euro;</span>
            )}
          </div>
          <Button
            size="sm"
            onClick={handleAddToCart}
            disabled={addToCart.isPending}
            className="h-8 px-3 gradient-bg text-white text-xs hover:opacity-90"
          >
            <ShoppingCart className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>
    </Link>
  );
}
