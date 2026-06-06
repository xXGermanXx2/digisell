import { Link, useParams } from "react-router";
import { ArrowLeft, LogIn, LogOut, Package, Store } from "lucide-react";
import { Button } from "@/components/ui/button";
import { trpc } from "@/providers/trpc";
import { useShopBuyerAuth } from "@/hooks/useShopBuyerAuth";

export default function ShopBuyerAccount() {
  const { slug } = useParams<{ slug: string }>();
  const shopSlug = slug ?? "";
  const { buyer, isLoading, clearToken } = useShopBuyerAuth(shopSlug);
  const { data } = trpc.seller.getPublicShop.useQuery({ slug: shopSlug }, { enabled: !!shopSlug });

  return (
    <div className="min-h-screen bg-[#0A0E1A] px-4 py-8">
      <div className="max-w-3xl mx-auto">
        <Link to={`/store/${shopSlug}`} className="inline-flex items-center gap-2 text-sm text-gray-400 hover:text-white mb-6">
          <ArrowLeft className="w-4 h-4" /> Zurück zum Shop
        </Link>
        <div className="rounded-2xl border border-[#2D3748] bg-[#111827] p-6">
          <div className="flex items-center justify-between gap-4 mb-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-indigo-600/20 flex items-center justify-center">
                <Store className="w-6 h-6 text-indigo-300" />
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide text-indigo-300">Käuferkonto nur für</p>
                <h1 className="text-2xl font-bold text-white">{data?.shop?.name ?? "diesen Shop"}</h1>
              </div>
            </div>
            {buyer && <Button onClick={clearToken} variant="outline" className="border-[#334155] text-gray-300 hover:text-white"><LogOut className="w-4 h-4 mr-2" />Abmelden</Button>}
          </div>

          {isLoading ? (
            <p className="text-gray-400">Käuferkonto wird geprüft …</p>
          ) : !buyer ? (
            <div className="rounded-xl border border-indigo-500/25 bg-indigo-500/10 p-5">
              <p className="text-white font-semibold mb-2">Du bist in diesem Shop nicht eingeloggt.</p>
              <p className="text-sm text-indigo-100/80 mb-4">Ein Login aus einem anderen Shop reicht hier nicht aus.</p>
              <Link to={`/store/${shopSlug}/login`}><Button className="bg-indigo-600 hover:bg-indigo-700 text-white"><LogIn className="w-4 h-4 mr-2" />Zum Shop-Login</Button></Link>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="rounded-xl border border-green-500/20 bg-green-500/10 p-4">
                <p className="text-sm text-green-200">Angemeldet als</p>
                <p className="text-white font-semibold">{buyer.name || buyer.email}</p>
                <p className="text-xs text-green-100/70 mt-1">Dieses Konto ist ausschließlich für /store/{shopSlug} gültig.</p>
              </div>
              <div className="rounded-xl border border-[#2D3748] bg-[#0A0E1A] p-4">
                <div className="flex items-center gap-2 text-white font-semibold mb-2"><Package className="w-4 h-4 text-indigo-300" />Käufe und Downloads</div>
                <p className="text-sm text-gray-400">Die shopgebundene Kontoansicht ist vorbereitet. Bestellungen und Downloads werden hier shopisoliert angezeigt, sobald die Kaufstrecke angebunden ist.</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
