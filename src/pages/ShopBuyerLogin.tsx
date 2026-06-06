import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router";
import { toast } from "sonner";
import { ArrowLeft, Loader2, LogIn, Store, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { trpc } from "@/providers/trpc";
import { useShopBuyerAuth } from "@/hooks/useShopBuyerAuth";

export default function ShopBuyerLogin() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const shopSlug = slug ?? "";
  const { saveToken } = useShopBuyerAuth(shopSlug);
  const { data, isLoading } = trpc.seller.getPublicShop.useQuery({ slug: shopSlug }, { enabled: !!shopSlug });
  const login = trpc.shopBuyerAuth.login.useMutation();
  const register = trpc.shopBuyerAuth.register.useMutation();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [form, setForm] = useState({ name: "", email: "", password: "" });

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!shopSlug) return;
    try {
      const result = mode === "login"
        ? await login.mutateAsync({ shopSlug, email: form.email, password: form.password })
        : await register.mutateAsync({ shopSlug, name: form.name, email: form.email, password: form.password });
      saveToken(result.token);
      toast.success(mode === "login" ? "Im Shop angemeldet." : "Shop-Käuferkonto erstellt.");
      navigate(`/store/${shopSlug}/account`);
    } catch (error: any) {
      toast.error(error?.message ?? "Anmeldung fehlgeschlagen.");
    }
  };

  return (
    <div className="min-h-screen bg-[#0A0E1A] flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-md">
        <Link to={`/store/${shopSlug}`} className="inline-flex items-center gap-2 text-sm text-gray-400 hover:text-white mb-6">
          <ArrowLeft className="w-4 h-4" /> Zurück zum Shop
        </Link>

        <div className="rounded-2xl border border-[#2D3748] bg-[#111827] p-6 shadow-2xl">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-11 h-11 rounded-xl bg-indigo-600/20 flex items-center justify-center">
              {data?.shop?.logo ? <img src={data.shop.logo} alt={data.shop.name} className="w-full h-full rounded-xl object-cover" /> : <Store className="w-5 h-5 text-indigo-300" />}
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide text-indigo-300">Shopgebundenes Käuferkonto</p>
              <h1 className="text-xl font-bold text-white">{data?.shop?.name ?? "Shop"}</h1>
            </div>
          </div>

          <div className="mb-5 rounded-xl border border-amber-500/20 bg-amber-500/10 p-3 text-xs text-amber-100">
            Dieses Käuferkonto gilt nur für diesen Shop. Ein Login aus einem anderen Shop wird hier nicht akzeptiert.
          </div>

          <div className="grid grid-cols-2 gap-2 mb-5">
            <Button type="button" variant={mode === "login" ? "default" : "outline"} onClick={() => setMode("login")} className={mode === "login" ? "bg-indigo-600 hover:bg-indigo-700" : "border-[#334155] text-gray-300"}>Einloggen</Button>
            <Button type="button" variant={mode === "register" ? "default" : "outline"} onClick={() => setMode("register")} className={mode === "register" ? "bg-indigo-600 hover:bg-indigo-700" : "border-[#334155] text-gray-300"}>Neu registrieren</Button>
          </div>

          <form onSubmit={submit} className="space-y-4">
            {mode === "register" && (
              <label className="block">
                <span className="text-sm text-gray-300">Name</span>
                <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required minLength={2} className="mt-1 w-full rounded-lg border border-[#2D3748] bg-[#0A0E1A] px-3 py-2 text-white outline-none focus:border-indigo-500" />
              </label>
            )}
            <label className="block">
              <span className="text-sm text-gray-300">E-Mail</span>
              <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required className="mt-1 w-full rounded-lg border border-[#2D3748] bg-[#0A0E1A] px-3 py-2 text-white outline-none focus:border-indigo-500" />
            </label>
            <label className="block">
              <span className="text-sm text-gray-300">Passwort</span>
              <input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required minLength={mode === "register" ? 8 : 1} className="mt-1 w-full rounded-lg border border-[#2D3748] bg-[#0A0E1A] px-3 py-2 text-white outline-none focus:border-indigo-500" />
            </label>
            <Button type="submit" disabled={login.isPending || register.isPending || isLoading} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white">
              {(login.isPending || register.isPending) ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : mode === "login" ? <LogIn className="w-4 h-4 mr-2" /> : <UserPlus className="w-4 h-4 mr-2" />}
              {mode === "login" ? "In diesem Shop einloggen" : "Käuferkonto für diesen Shop erstellen"}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
