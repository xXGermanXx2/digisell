import { useState } from "react";
import { Link, useParams, useNavigate } from "react-router";
import { useAuth } from "@/hooks/useAuth";
import { trpc } from "@/providers/trpc";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar,
} from "recharts";
import {
  LayoutDashboard, Store, Package, ShoppingCart, Users, DollarSign, Ticket, Tag, BarChart2,
  Settings, LogOut, Plus, Edit, Trash2, Eye, ExternalLink, TrendingUp, Loader2, AlertCircle,
  ChevronRight, Check, X, Globe, Menu, Home, Key, FileText, Upload, ChevronDown, ChevronUp,
  Coins, Minus, History,
} from "lucide-react";

const NAV_ITEMS = [
  { id: "overview", label: "Dashboard", icon: LayoutDashboard },
  { id: "shop", label: "Mein Shop", icon: Store },
  { id: "products", label: "Produkte", icon: Package },
  { id: "orders", label: "Bestellungen", icon: ShoppingCart },
  { id: "customers", label: "Kunden", icon: Users },
  { id: "payments", label: "Zahlungen", icon: DollarSign },
  { id: "credits", label: "Shop-Guthaben", icon: Coins },
  { id: "coupons", label: "Gutscheine", icon: Tag },
  { id: "tickets", label: "Tickets", icon: Ticket },
  { id: "analytics", label: "Analytics", icon: BarChart2 },
  { id: "settings", label: "Einstellungen", icon: Settings },
];

const BOTTOM_NAV = [
  { id: "overview", label: "Dashboard", icon: LayoutDashboard },
  { id: "products", label: "Produkte", icon: Package },
  { id: "orders", label: "Bestellungen", icon: ShoppingCart },
  { id: "analytics", label: "Analytics", icon: BarChart2 },
  { id: "settings", label: "Mehr", icon: Menu },
];

function formatCurrency(val: number) {
  return new Intl.NumberFormat("de-DE", { style: "currency", currency: "EUR" }).format(val);
}
function formatDate(d: string | Date | null) {
  if (!d) return "-";
  return new Date(d).toLocaleDateString("de-DE");
}

// ── Ware-Verwaltung Modal ─────────────────────────────────────────────────────
function WareModal({ product, onClose }: { product: { id: number; name: string; type: string }; onClose: () => void }) {
  const [activeTab, setActiveTab] = useState<"keys" | "files">(product.type === "file" ? "files" : "keys");
  const [newKeys, setNewKeys] = useState("");
  const [newFileName, setNewFileName] = useState("");
  const [newFileUrl, setNewFileUrl] = useState("");

  const { data: keys, refetch: refetchKeys } = trpc.seller.getProductKeys.useQuery({ productId: product.id });
  const { data: files, refetch: refetchFiles } = trpc.seller.getProductFiles.useQuery({ productId: product.id });
  const addKeys = trpc.seller.addLicenseKeys.useMutation({
    onSuccess: () => { setNewKeys(""); refetchKeys(); },
    onError: (e) => alert("Fehler: " + e.message),
  });
  const deleteKey = trpc.seller.deleteKey.useMutation({ onSuccess: () => refetchKeys() });
  const addFile = trpc.seller.addProductFile.useMutation({
    onSuccess: () => { setNewFileName(""); setNewFileUrl(""); refetchFiles(); },
    onError: (e) => alert("Fehler: " + e.message),
  });
  const deleteFile = trpc.seller.deleteProductFile.useMutation({ onSuccess: () => refetchFiles() });

  const handleAddKeys = () => {
    const parsed = newKeys.split("\n").map((k) => k.trim()).filter(Boolean);
    if (parsed.length === 0) return;
    addKeys.mutate({ productId: product.id, keys: parsed });
  };

  const statusColor: Record<string, string> = {
    available: "bg-green-500/20 text-green-400",
    sold: "bg-gray-500/20 text-gray-400",
    refunded: "bg-red-500/20 text-red-400",
  };

  return (
    <div className="fixed inset-0 bg-black/70 flex items-end sm:items-center justify-center z-50 p-0 sm:p-4">
      <div className="bg-[#111827] border border-[#2D3748] rounded-t-2xl sm:rounded-2xl w-full sm:max-w-2xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-[#2D3748] shrink-0">
          <div>
            <h3 className="text-lg font-semibold text-white">Ware verwalten</h3>
            <p className="text-gray-500 text-sm truncate max-w-xs">{product.name}</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-[#1A2235] text-gray-400">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-[#2D3748] shrink-0">
          <button
            onClick={() => setActiveTab("keys")}
            className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-medium transition-colors ${activeTab === "keys" ? "text-indigo-400 border-b-2 border-indigo-400" : "text-gray-500 hover:text-gray-300"}`}
          >
            <Key className="w-4 h-4" />
            Lizenzkeys / Serials
            {keys && <span className="bg-indigo-500/20 text-indigo-400 text-xs px-1.5 py-0.5 rounded-full">{keys.filter(k => k.status === "available").length}</span>}
          </button>
          <button
            onClick={() => setActiveTab("files")}
            className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-medium transition-colors ${activeTab === "files" ? "text-indigo-400 border-b-2 border-indigo-400" : "text-gray-500 hover:text-gray-300"}`}
          >
            <FileText className="w-4 h-4" />
            Dateien / Links
            {files && <span className="bg-indigo-500/20 text-indigo-400 text-xs px-1.5 py-0.5 rounded-full">{files.length}</span>}
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {activeTab === "keys" && (
            <>
              {/* Keys hinzufügen */}
              <div className="bg-[#1A2235] rounded-xl p-4 border border-[#2D3748]">
                <h4 className="text-white font-medium text-sm mb-3 flex items-center gap-2">
                  <Plus className="w-4 h-4 text-indigo-400" />
                  Keys hinzufügen
                </h4>
                <p className="text-gray-500 text-xs mb-2">Einen Key pro Zeile eingeben. Maximal 1000 auf einmal.</p>
                <textarea
                  value={newKeys}
                  onChange={(e) => setNewKeys(e.target.value)}
                  placeholder={"XXXX-YYYY-ZZZZ\nAAAA-BBBB-CCCC\n..."}
                  rows={5}
                  className="w-full bg-[#0A0E1A] border border-[#2D3748] rounded-lg px-3 py-2 text-white text-sm font-mono focus:outline-none focus:border-indigo-500 resize-none"
                />
                <div className="flex items-center justify-between mt-2">
                  <span className="text-gray-500 text-xs">
                    {newKeys.split("\n").filter(k => k.trim()).length} Keys erkannt
                  </span>
                  <Button
                    onClick={handleAddKeys}
                    size="sm"
                    className="bg-indigo-600 hover:bg-indigo-700 text-white"
                    disabled={!newKeys.trim() || addKeys.isPending}
                  >
                    {addKeys.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Upload className="w-3.5 h-3.5 mr-1" />Hinzufügen</>}
                  </Button>
                </div>
              </div>

              {/* Keys Liste */}
              <div>
                <h4 className="text-white font-medium text-sm mb-3">
                  Vorhandene Keys
                  <span className="ml-2 text-gray-500 font-normal text-xs">({keys?.length ?? 0} gesamt)</span>
                </h4>
                {!keys?.length ? (
                  <div className="text-center py-8 text-gray-500 text-sm">
                    <Key className="w-8 h-8 mx-auto mb-2 opacity-30" />
                    Noch keine Keys vorhanden
                  </div>
                ) : (
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {keys.map((k) => (
                      <div key={k.id} className="flex items-center justify-between gap-2 bg-[#1A2235] rounded-lg px-3 py-2 border border-[#2D3748]">
                        <div className="flex items-center gap-2 min-w-0">
                          <Badge className={`text-xs shrink-0 ${statusColor[k.status] ?? ""}`}>{k.status}</Badge>
                          <span className="text-gray-300 text-sm font-mono truncate">{k.key}</span>
                        </div>
                        {k.status === "available" && (
                          <button
                            onClick={() => deleteKey.mutate({ keyId: k.id })}
                            className="p-1 rounded hover:bg-red-500/10 text-gray-500 hover:text-red-400 shrink-0"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}

          {activeTab === "files" && (
            <>
              {/* Datei hinzufügen */}
              <div className="bg-[#1A2235] rounded-xl p-4 border border-[#2D3748]">
                <h4 className="text-white font-medium text-sm mb-3 flex items-center gap-2">
                  <Plus className="w-4 h-4 text-indigo-400" />
                  Datei / Link hinzufügen
                </h4>
                <p className="text-gray-500 text-xs mb-3">Füge Download-Links, Google Drive Links, Dropbox Links etc. hinzu.</p>
                <div className="space-y-2">
                  <Input
                    value={newFileName}
                    onChange={(e) => setNewFileName(e.target.value)}
                    placeholder="Dateiname (z.B. 'Software v2.0.zip')"
                    className="bg-[#0A0E1A] border-[#2D3748] text-white text-sm"
                  />
                  <Input
                    value={newFileUrl}
                    onChange={(e) => setNewFileUrl(e.target.value)}
                    placeholder="Download-URL (https://...)"
                    className="bg-[#0A0E1A] border-[#2D3748] text-white text-sm"
                  />
                </div>
                <Button
                  onClick={() => addFile.mutate({ productId: product.id, name: newFileName, url: newFileUrl })}
                  size="sm"
                  className="mt-3 bg-indigo-600 hover:bg-indigo-700 text-white"
                  disabled={!newFileName.trim() || !newFileUrl.trim() || addFile.isPending}
                >
                  {addFile.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Upload className="w-3.5 h-3.5 mr-1" />Hinzufügen</>}
                </Button>
              </div>

              {/* Dateien Liste */}
              <div>
                <h4 className="text-white font-medium text-sm mb-3">
                  Vorhandene Dateien
                  <span className="ml-2 text-gray-500 font-normal text-xs">({files?.length ?? 0})</span>
                </h4>
                {!files?.length ? (
                  <div className="text-center py-8 text-gray-500 text-sm">
                    <FileText className="w-8 h-8 mx-auto mb-2 opacity-30" />
                    Noch keine Dateien vorhanden
                  </div>
                ) : (
                  <div className="space-y-2">
                    {files.map((f) => (
                      <div key={f.id} className="flex items-center justify-between gap-2 bg-[#1A2235] rounded-lg px-3 py-2.5 border border-[#2D3748]">
                        <div className="min-w-0">
                          <p className="text-white text-sm font-medium truncate">{f.name}</p>
                          <p className="text-gray-500 text-xs truncate">{f.url}</p>
                        </div>
                        <button
                          onClick={() => deleteFile.mutate({ fileId: f.id })}
                          className="p-1 rounded hover:bg-red-500/10 text-gray-500 hover:text-red-400 shrink-0"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Plan Badge ───────────────────────────────────────────────────────────────
const PLAN_COLORS: Record<string, string> = {
  free: "bg-gray-500/20 text-gray-300 border-gray-500/30",
  premium: "bg-indigo-500/20 text-indigo-300 border-indigo-500/30",
  business: "bg-violet-500/20 text-violet-300 border-violet-500/30",
  enterprise: "bg-amber-500/20 text-amber-300 border-amber-500/30",
};
const PLAN_LABELS: Record<string, string> = { free: "Free", premium: "Premium", business: "Business", enterprise: "Enterprise" };

function PlanBanner() {
  const { data: plan } = trpc.subscription.getMyPlan.useQuery();
  const navigate = useNavigate();
  if (!plan) return null;
  const limitReached = !plan.canCreateShop;
  return (
    <div className={`rounded-xl border p-4 flex flex-col sm:flex-row sm:items-center gap-3 ${
      limitReached ? "bg-amber-500/10 border-amber-500/30" : "bg-[#1A2235] border-[#2D3748]"
    }`}>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${PLAN_COLORS[plan.plan] ?? PLAN_COLORS.free}`}>
            {PLAN_LABELS[plan.plan] ?? plan.plan}
          </span>
          {plan.isLifetimePremium && <span className="text-xs font-semibold px-2 py-0.5 rounded-full border bg-amber-500/20 text-amber-300 border-amber-500/30">Lifetime</span>}
          {plan.status === "expired" && <span className="text-xs font-semibold px-2 py-0.5 rounded-full border bg-red-500/20 text-red-300 border-red-500/30">Abgelaufen</span>}
        </div>
        <p className="text-xs text-gray-400 mt-1">
          Shops: <span className="text-white font-medium">{plan.currentShops} / {plan.shopLimit === -1 ? "∞" : plan.shopLimit}</span>
          <span className="mx-2 text-gray-600">·</span>
          Produkte: <span className="text-white font-medium">{plan.currentProducts} / {plan.productLimit === -1 ? "∞" : plan.productLimit}</span>
          {plan.expiresAt && !plan.isLifetimePremium && (
            <><span className="mx-2 text-gray-600">·</span>Läuft ab: <span className="text-white font-medium">{new Date(plan.expiresAt).toLocaleDateString("de-DE")}</span></>
          )}
        </p>
      </div>
      {limitReached && (
        <div className="shrink-0">
          <p className="text-amber-300 text-xs font-medium mb-1.5">Shop-Limit erreicht</p>
          <Button size="sm" className="bg-amber-500 hover:bg-amber-600 text-black font-semibold text-xs" onClick={() => navigate("/seller/settings")}>
            Tarif upgraden
          </Button>
        </div>
      )}
    </div>
  );
}

// ── Overview Tab ─────────────────────────────────────────────────────────────
function OverviewTab() {
  const { data: stats, isLoading } = trpc.seller.getStats.useQuery();
  const { data: chart } = trpc.seller.getRevenueChart.useQuery({ days: 30 });

  if (isLoading) return <div className="flex items-center justify-center h-64"><Loader2 className="w-8 h-8 animate-spin text-indigo-400" /></div>;
  if (!stats) return <NoShopPrompt />;

  const statCards = [
    { label: "Gesamtumsatz", value: formatCurrency(stats.revenueTotal), icon: DollarSign, color: "text-green-400", bg: "bg-green-500/10" },
    { label: "Umsatz (Monat)", value: formatCurrency(stats.revenueMonth), icon: TrendingUp, color: "text-indigo-400", bg: "bg-indigo-500/10" },
    { label: "Bestellungen", value: String(stats.orders), icon: ShoppingCart, color: "text-blue-400", bg: "bg-blue-500/10" },
    { label: "Produkte", value: String(stats.products), icon: Package, color: "text-violet-400", bg: "bg-violet-500/10" },
    { label: "Kunden", value: String(stats.customers), icon: Users, color: "text-orange-400", bg: "bg-orange-500/10" },
  ];

  return (
    <div className="space-y-5">
      <PlanBanner />
      <div>
        <h2 className="text-xl sm:text-2xl font-bold text-white">Willkommen zurück!</h2>
        <p className="text-gray-400 text-sm mt-1 flex items-center gap-1 flex-wrap">
          Dein Shop:
          <span className="text-indigo-400 font-medium">{stats.shop.name}</span>
          <a href={`/store/${stats.shop.slug}`} target="_blank" rel="noopener noreferrer" className="text-gray-500 hover:text-white">
            <ExternalLink className="w-3 h-3 inline" />
          </a>
        </p>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {statCards.map((s) => (
          <div key={s.label} className={`${s.bg} rounded-xl p-4 border border-white/5`}>
            <s.icon className={`w-5 h-5 ${s.color} mb-2`} />
            <p className="text-xl sm:text-2xl font-bold text-white leading-tight">{s.value}</p>
            <p className="text-xs text-gray-400 mt-1">{s.label}</p>
          </div>
        ))}
      </div>
      {chart && chart.length > 0 && (
        <div className="bg-[#1A2235] rounded-xl p-4 sm:p-6 border border-[#2D3748]">
          <h3 className="text-white font-semibold mb-4 text-sm sm:text-base">Umsatz (letzte 30 Tage)</h3>
          <ResponsiveContainer width="100%" height={180}>
            <AreaChart data={chart}>
              <defs>
                <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#2D3748" />
              <XAxis dataKey="date" stroke="#64748B" tick={{ fontSize: 10 }} />
              <YAxis stroke="#64748B" tick={{ fontSize: 10 }} tickFormatter={(v) => `€${v}`} width={45} />
              <Tooltip contentStyle={{ background: "#1A2235", border: "1px solid #2D3748", borderRadius: 8, fontSize: 12 }} formatter={(v: number) => [formatCurrency(v), "Umsatz"]} />
              <Area type="monotone" dataKey="revenue" stroke="#6366f1" fill="url(#revenueGrad)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}

// ── Shop Tab ──────────────────────────────────────────────────────────────────
function ShopTab() {
  const { data: shop, refetch } = trpc.seller.getMyShop.useQuery();
  const updateShop = trpc.seller.updateMyShop.useMutation({ onSuccess: () => refetch() });
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [logo, setLogo] = useState("");
  const [banner, setBanner] = useState("");

  if (!shop) return <NoShopPrompt />;

  const startEdit = () => {
    setName(shop.name);
    setDescription(shop.description ?? "");
    setLogo(shop.logo ?? "");
    setBanner(shop.banner ?? "");
    setEditing(true);
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h2 className="text-xl sm:text-2xl font-bold text-white">Mein Shop</h2>
        <div className="flex gap-2">
          <a href={`/store/${shop.slug}`} target="_blank" rel="noopener noreferrer">
            <Button variant="outline" size="sm" className="border-[#2D3748] text-gray-400 hover:text-white text-xs sm:text-sm">
              <Eye className="w-3.5 h-3.5 sm:mr-1" /><span className="hidden sm:inline">Vorschau</span>
            </Button>
          </a>
          <Button onClick={startEdit} size="sm" className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs sm:text-sm">
            <Edit className="w-3.5 h-3.5 sm:mr-1" /><span className="hidden sm:inline">Bearbeiten</span>
          </Button>
        </div>
      </div>
      <div className="bg-[#1A2235] rounded-xl border border-[#2D3748] overflow-hidden">
        <div className="h-24 sm:h-32 bg-gradient-to-r from-indigo-600/30 to-violet-600/30 overflow-hidden">
          {shop.banner && <img src={shop.banner} alt="Banner" className="w-full h-full object-cover" />}
        </div>
        <div className="p-4 sm:p-6">
          <div className="flex items-start gap-3">
            <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center overflow-hidden -mt-8 sm:-mt-10 border-4 border-[#1A2235] shrink-0">
              {shop.logo ? <img src={shop.logo} alt="Logo" className="w-full h-full object-cover" /> : <Store className="w-6 h-6 sm:w-8 sm:h-8 text-white" />}
            </div>
            <div className="flex-1 min-w-0 pt-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-lg sm:text-xl font-bold text-white">{shop.name}</h3>
                <Badge className={shop.status === "active" ? "bg-green-500/20 text-green-400 text-xs" : "bg-red-500/20 text-red-400 text-xs"}>
                  {shop.status === "active" ? "Aktiv" : "Inaktiv"}
                </Badge>
              </div>
              <div className="flex items-center gap-1 text-xs sm:text-sm text-indigo-400 mt-1">
                <Globe className="w-3 h-3" />
                <span className="truncate">/store/{shop.slug}</span>
              </div>
              <p className="text-gray-400 text-xs sm:text-sm mt-2 line-clamp-2">{shop.description ?? "Keine Beschreibung"}</p>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-2 sm:gap-4 mt-4 pt-4 border-t border-[#2D3748]">
            {[{ label: "Produkte", value: shop.totalProducts }, { label: "Bestellungen", value: shop.totalOrders }, { label: "Umsatz", value: formatCurrency(Number(shop.totalRevenue)) }].map((s) => (
              <div key={s.label} className="text-center">
                <p className="text-lg sm:text-2xl font-bold text-white">{s.value}</p>
                <p className="text-xs text-gray-400">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
      {editing && (
        <div className="fixed inset-0 bg-black/70 flex items-end sm:items-center justify-center z-50 p-0 sm:p-4">
          <div className="bg-[#111827] border border-[#2D3748] rounded-t-2xl sm:rounded-2xl p-5 w-full sm:max-w-lg max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-semibold text-white mb-4">Shop bearbeiten</h3>
            <div className="space-y-3">
              <div><label className="block text-sm text-gray-400 mb-1">Shop-Name</label><Input value={name} onChange={(e) => setName(e.target.value)} className="bg-[#1A2235] border-[#2D3748] text-white" /></div>
              <div><label className="block text-sm text-gray-400 mb-1">Beschreibung</label><textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} className="w-full bg-[#1A2235] border border-[#2D3748] rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-indigo-500 resize-none" /></div>
              <div><label className="block text-sm text-gray-400 mb-1">Logo-URL</label><Input value={logo} onChange={(e) => setLogo(e.target.value)} placeholder="https://..." className="bg-[#1A2235] border-[#2D3748] text-white" /></div>
              <div><label className="block text-sm text-gray-400 mb-1">Banner-URL</label><Input value={banner} onChange={(e) => setBanner(e.target.value)} placeholder="https://..." className="bg-[#1A2235] border-[#2D3748] text-white" /></div>
            </div>
            <div className="flex gap-3 mt-5">
              <Button onClick={() => setEditing(false)} variant="outline" className="flex-1 border-[#2D3748] text-gray-400">Abbrechen</Button>
              <Button onClick={() => { updateShop.mutate({ name, description, logo, banner }); setEditing(false); }} className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white" disabled={updateShop.isPending}>
                {updateShop.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Speichern"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Products Tab ──────────────────────────────────────────────────────────────
function ProductsTab() {
  const { data, refetch } = trpc.seller.getProducts.useQuery({ page: 1, limit: 50 });
  const deleteProduct = trpc.seller.deleteProduct.useMutation({ onSuccess: () => refetch() });
  const updateProduct = trpc.seller.updateProduct.useMutation({ onSuccess: () => refetch() });
  const [showCreate, setShowCreate] = useState(false);
  const [wareProduct, setWareProduct] = useState<{ id: number; name: string; type: string } | null>(null);
  const createProduct = trpc.seller.createProduct.useMutation({ onSuccess: () => { refetch(); setShowCreate(false); } });
  const [form, setForm] = useState({ name: "", description: "", price: "", type: "file" as const, status: "draft" as const });

  const statusColor: Record<string, string> = {
    active: "bg-green-500/20 text-green-400",
    inactive: "bg-gray-500/20 text-gray-400",
    draft: "bg-yellow-500/20 text-yellow-400",
  };

  const typeIcon: Record<string, React.ReactNode> = {
    file: <FileText className="w-3.5 h-3.5" />,
    license: <Key className="w-3.5 h-3.5" />,
    service: <Package className="w-3.5 h-3.5" />,
    subscription: <Tag className="w-3.5 h-3.5" />,
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h2 className="text-xl sm:text-2xl font-bold text-white">Produkte</h2>
        <Button onClick={() => setShowCreate(true)} size="sm" className="bg-indigo-600 hover:bg-indigo-700 text-white">
          <Plus className="w-4 h-4 sm:mr-1" /><span className="hidden sm:inline">Produkt erstellen</span>
        </Button>
      </div>

      {!data?.items?.length ? (
        <div className="bg-[#1A2235] rounded-xl border border-[#2D3748] p-10 text-center">
          <Package className="w-10 h-10 text-gray-600 mx-auto mb-3" />
          <p className="text-gray-400 text-sm">Noch keine Produkte. Erstelle dein erstes!</p>
          <Button onClick={() => setShowCreate(true)} size="sm" className="mt-4 bg-indigo-600 hover:bg-indigo-700 text-white">
            <Plus className="w-4 h-4 mr-1" /> Produkt erstellen
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {data.items.map((p) => (
            <div key={p.id} className="bg-[#1A2235] rounded-xl border border-[#2D3748] p-4">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <p className="text-white font-medium text-sm truncate">{p.name}</p>
                  <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                    <Badge className={`text-xs ${statusColor[p.status] ?? ""}`}>{p.status}</Badge>
                    <span className="flex items-center gap-1 text-xs text-gray-500 capitalize">
                      {typeIcon[p.type]}{p.type}
                    </span>
                    <span className="text-xs text-gray-500">{p.soldCount}x verkauft</span>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-2 shrink-0">
                  <p className="text-white font-semibold text-sm">{formatCurrency(Number(p.price))}</p>
                  <div className="flex gap-1">
                    {/* Ware hinzufügen Button */}
                    <button
                      onClick={() => setWareProduct({ id: p.id, name: p.name, type: p.type })}
                      className="p-1.5 rounded-lg bg-indigo-500/20 text-indigo-400 hover:bg-indigo-500/30 text-xs flex items-center gap-1"
                      title="Ware verwalten"
                    >
                      {p.type === "license" ? <Key className="w-3.5 h-3.5" /> : <FileText className="w-3.5 h-3.5" />}
                    </button>
                    <button
                      onClick={() => updateProduct.mutate({ id: p.id, status: p.status === "active" ? "inactive" : "active" })}
                      className="p-1.5 rounded-lg bg-[#2D3748] text-gray-400 hover:text-white"
                      title={p.status === "active" ? "Deaktivieren" : "Aktivieren"}
                    >
                      {p.status === "active" ? <X className="w-3.5 h-3.5" /> : <Check className="w-3.5 h-3.5" />}
                    </button>
                    <button
                      onClick={() => { if (confirm("Produkt löschen?")) deleteProduct.mutate({ id: p.id }); }}
                      className="p-1.5 rounded-lg bg-[#2D3748] text-gray-400 hover:text-red-400"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
              {/* Ware-Hinweis */}
              <button
                onClick={() => setWareProduct({ id: p.id, name: p.name, type: p.type })}
                className="mt-3 w-full flex items-center justify-between px-3 py-2 bg-[#0A0E1A] rounded-lg border border-[#2D3748] hover:border-indigo-500/50 transition-colors group"
              >
                <span className="flex items-center gap-2 text-xs text-gray-500 group-hover:text-gray-300">
                  {p.type === "license" ? <Key className="w-3.5 h-3.5 text-indigo-400" /> : <FileText className="w-3.5 h-3.5 text-indigo-400" />}
                  {p.type === "license" ? "Lizenzkeys / Serials verwalten" : "Dateien / Download-Links verwalten"}
                </span>
                <ChevronRight className="w-3.5 h-3.5 text-gray-600 group-hover:text-gray-400" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Ware Modal */}
      {wareProduct && <WareModal product={wareProduct} onClose={() => setWareProduct(null)} />}

      {/* Produkt erstellen Modal */}
      {showCreate && (
        <div className="fixed inset-0 bg-black/70 flex items-end sm:items-center justify-center z-50 p-0 sm:p-4">
          <div className="bg-[#111827] border border-[#2D3748] rounded-t-2xl sm:rounded-2xl p-5 w-full sm:max-w-lg max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-semibold text-white mb-4">Neues Produkt</h3>
            <div className="space-y-3">
              <div><label className="block text-sm text-gray-400 mb-1">Name *</label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="bg-[#1A2235] border-[#2D3748] text-white" /></div>
              <div><label className="block text-sm text-gray-400 mb-1">Beschreibung</label><textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3} className="w-full bg-[#1A2235] border border-[#2D3748] rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-indigo-500 resize-none" /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="block text-sm text-gray-400 mb-1">Preis (€) *</label><Input type="number" min="0" step="0.01" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} className="bg-[#1A2235] border-[#2D3748] text-white" /></div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Typ</label>
                  <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value as any })} className="w-full bg-[#1A2235] border border-[#2D3748] rounded-lg px-3 py-2 text-white text-sm focus:outline-none">
                    <option value="file">📁 Datei</option>
                    <option value="license">🔑 Lizenz/Key</option>
                    <option value="service">⚙️ Service</option>
                    <option value="subscription">🔄 Abo</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Status</label>
                <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as any })} className="w-full bg-[#1A2235] border border-[#2D3748] rounded-lg px-3 py-2 text-white text-sm focus:outline-none">
                  <option value="draft">Entwurf</option>
                  <option value="active">Aktiv</option>
                  <option value="inactive">Inaktiv</option>
                </select>
              </div>
              {/* Hinweis je nach Typ */}
              <div className="bg-indigo-500/10 border border-indigo-500/20 rounded-lg p-3 text-xs text-indigo-300">
                {form.type === "license" && <><Key className="w-3.5 h-3.5 inline mr-1" />Nach dem Erstellen kannst du Lizenzkeys/Serials hinzufügen.</>}
                {form.type === "file" && <><FileText className="w-3.5 h-3.5 inline mr-1" />Nach dem Erstellen kannst du Download-Links hinzufügen.</>}
                {form.type === "service" && <><Package className="w-3.5 h-3.5 inline mr-1" />Service-Produkte werden manuell geliefert.</>}
                {form.type === "subscription" && <><Tag className="w-3.5 h-3.5 inline mr-1" />Abo-Produkte werden wiederkehrend abgerechnet.</>}
              </div>
            </div>
            <div className="flex gap-3 mt-5">
              <Button onClick={() => setShowCreate(false)} variant="outline" className="flex-1 border-[#2D3748] text-gray-400">Abbrechen</Button>
              <Button
                onClick={() => createProduct.mutate({ name: form.name, description: form.description, price: Number(form.price), type: form.type, status: form.status })}
                className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white"
                disabled={!form.name || !form.price || createProduct.isPending}
              >
                {createProduct.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Erstellen"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Orders Tab ────────────────────────────────────────────────────────────────
function OrdersTab() {
  const { data } = trpc.seller.getOrders.useQuery({ page: 1, limit: 50 });
  const statusColor: Record<string, string> = {
    completed: "bg-green-500/20 text-green-400",
    pending: "bg-yellow-500/20 text-yellow-400",
    paid: "bg-blue-500/20 text-blue-400",
    cancelled: "bg-red-500/20 text-red-400",
    refunded: "bg-gray-500/20 text-gray-400",
  };
  return (
    <div className="space-y-5">
      <h2 className="text-xl sm:text-2xl font-bold text-white">Bestellungen</h2>
      {!data?.items?.length ? (
        <div className="bg-[#1A2235] rounded-xl border border-[#2D3748] p-10 text-center">
          <ShoppingCart className="w-10 h-10 text-gray-600 mx-auto mb-3" />
          <p className="text-gray-400 text-sm">Noch keine Bestellungen.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {data.items.map((o) => (
            <div key={o.id} className="bg-[#1A2235] rounded-xl border border-[#2D3748] p-4">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="text-indigo-400 font-mono text-sm font-medium">{o.orderNumber}</p>
                  <p className="text-gray-400 text-xs mt-0.5">{o.customerEmail}</p>
                  <p className="text-gray-500 text-xs mt-0.5">{formatDate(o.createdAt)}</p>
                </div>
                <div className="flex flex-col items-end gap-1.5">
                  <p className="text-white font-semibold text-sm">{formatCurrency(Number(o.total))}</p>
                  <Badge className={`text-xs ${statusColor[o.status] ?? ""}`}>{o.status}</Badge>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Customers Tab ─────────────────────────────────────────────────────────────
function CustomersTab() {
  const { data } = trpc.seller.getCustomers.useQuery({ page: 1, limit: 50 });
  return (
    <div className="space-y-5">
      <h2 className="text-xl sm:text-2xl font-bold text-white">Kunden</h2>
      {!data?.items?.length ? (
        <div className="bg-[#1A2235] rounded-xl border border-[#2D3748] p-10 text-center">
          <Users className="w-10 h-10 text-gray-600 mx-auto mb-3" />
          <p className="text-gray-400 text-sm">Noch keine Kunden.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {data.items.map((c, i) => (
            <div key={i} className="bg-[#1A2235] rounded-xl border border-[#2D3748] p-4">
              <div className="flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-white text-sm font-medium truncate">{c.name ?? "Gast"}</p>
                  <p className="text-gray-500 text-xs truncate">{c.email}</p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-white font-semibold text-sm">{formatCurrency(c.totalSpent)}</p>
                  <p className="text-gray-500 text-xs">{c.orderCount} Bestellungen</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Payments Tab ──────────────────────────────────────────────────────────────
function PaymentsTab() {
  const { data } = trpc.seller.getPayments.useQuery({ page: 1, limit: 50 });
  return (
    <div className="space-y-5">
      <h2 className="text-xl sm:text-2xl font-bold text-white">Zahlungen</h2>
      {!data?.items?.length ? (
        <div className="bg-[#1A2235] rounded-xl border border-[#2D3748] p-10 text-center">
          <DollarSign className="w-10 h-10 text-gray-600 mx-auto mb-3" />
          <p className="text-gray-400 text-sm">Noch keine Zahlungen.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {data.items.map((o) => (
            <div key={o.id} className="bg-[#1A2235] rounded-xl border border-[#2D3748] p-4">
              <div className="flex items-center justify-between gap-2">
                <div>
                  <p className="text-indigo-400 font-mono text-sm">{o.orderNumber}</p>
                  <p className="text-gray-400 text-xs capitalize mt-0.5">{o.paymentMethod}</p>
                  <p className="text-gray-500 text-xs">{formatDate(o.createdAt)}</p>
                </div>
                <p className="text-green-400 font-semibold text-sm">{formatCurrency(Number(o.total))}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Coupons Tab ───────────────────────────────────────────────────────────────
function CouponsTab() {
  const { data, refetch } = trpc.seller.getCoupons.useQuery({ page: 1, limit: 50 });
  const deleteCoupon = trpc.seller.deleteCoupon.useMutation({ onSuccess: () => refetch() });
  const createCoupon = trpc.seller.createCoupon.useMutation({ onSuccess: () => { refetch(); setShowCreate(false); } });
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ code: "", type: "percentage" as const, value: "" });
  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h2 className="text-xl sm:text-2xl font-bold text-white">Gutscheine</h2>
        <Button onClick={() => setShowCreate(true)} size="sm" className="bg-indigo-600 hover:bg-indigo-700 text-white">
          <Plus className="w-4 h-4 sm:mr-1" /><span className="hidden sm:inline">Erstellen</span>
        </Button>
      </div>
      {!data?.items?.length ? (
        <div className="bg-[#1A2235] rounded-xl border border-[#2D3748] p-10 text-center">
          <Tag className="w-10 h-10 text-gray-600 mx-auto mb-3" />
          <p className="text-gray-400 text-sm">Noch keine Gutscheine.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {data.items.map((c) => (
            <div key={c.id} className="bg-[#1A2235] rounded-xl border border-[#2D3748] p-4">
              <div className="flex items-center justify-between gap-2">
                <div>
                  <p className="text-indigo-400 font-mono text-sm font-bold">{c.code}</p>
                  <p className="text-gray-400 text-xs mt-0.5">{c.type === "percentage" ? `${c.value}% Rabatt` : `${formatCurrency(Number(c.value))} Rabatt`}</p>
                  <p className="text-gray-500 text-xs">{c.usedCount} / {c.maxUses === -1 ? "∞" : c.maxUses} verwendet</p>
                </div>
                <button onClick={() => { if (confirm("Gutschein löschen?")) deleteCoupon.mutate({ id: c.id }); }} className="p-2 rounded-lg bg-[#2D3748] text-gray-400 hover:text-red-400">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
      {showCreate && (
        <div className="fixed inset-0 bg-black/70 flex items-end sm:items-center justify-center z-50 p-0 sm:p-4">
          <div className="bg-[#111827] border border-[#2D3748] rounded-t-2xl sm:rounded-2xl p-5 w-full sm:max-w-md max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-semibold text-white mb-4">Gutschein erstellen</h3>
            <div className="space-y-3">
              <div><label className="block text-sm text-gray-400 mb-1">Code *</label><Input value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })} placeholder="SUMMER20" className="bg-[#1A2235] border-[#2D3748] text-white font-mono" /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="block text-sm text-gray-400 mb-1">Typ</label><select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value as any })} className="w-full bg-[#1A2235] border border-[#2D3748] rounded-lg px-3 py-2 text-white text-sm focus:outline-none"><option value="percentage">Prozent (%)</option><option value="fixed">Festbetrag (€)</option></select></div>
                <div><label className="block text-sm text-gray-400 mb-1">Wert *</label><Input type="number" min="0" value={form.value} onChange={(e) => setForm({ ...form, value: e.target.value })} className="bg-[#1A2235] border-[#2D3748] text-white" /></div>
              </div>
            </div>
            <div className="flex gap-3 mt-5">
              <Button onClick={() => setShowCreate(false)} variant="outline" className="flex-1 border-[#2D3748] text-gray-400">Abbrechen</Button>
              <Button onClick={() => createCoupon.mutate({ code: form.code, type: form.type, value: Number(form.value) })} className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white" disabled={!form.code || !form.value || createCoupon.isPending}>
                {createCoupon.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Erstellen"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Tickets Tab ───────────────────────────────────────────────────────────────
function TicketsTab() {
  const { data } = trpc.seller.getTickets.useQuery({ page: 1, limit: 50 });
  const statusColor: Record<string, string> = { open: "bg-yellow-500/20 text-yellow-400", in_progress: "bg-blue-500/20 text-blue-400", resolved: "bg-green-500/20 text-green-400", closed: "bg-gray-500/20 text-gray-400" };
  return (
    <div className="space-y-5">
      <h2 className="text-xl sm:text-2xl font-bold text-white">Support-Tickets</h2>
      {!data?.items?.length ? (
        <div className="bg-[#1A2235] rounded-xl border border-[#2D3748] p-10 text-center">
          <Ticket className="w-10 h-10 text-gray-600 mx-auto mb-3" />
          <p className="text-gray-400 text-sm">Noch keine Tickets.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {data.items.map((t) => (
            <div key={t.id} className="bg-[#1A2235] rounded-xl border border-[#2D3748] p-4">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="text-indigo-400 font-mono text-xs">{t.ticketNumber}</p>
                  <p className="text-white text-sm font-medium mt-0.5">{t.subject}</p>
                  <p className="text-gray-500 text-xs mt-0.5">{formatDate(t.createdAt)}</p>
                </div>
                <Badge className={`text-xs shrink-0 ${statusColor[t.status] ?? ""}`}>{t.status}</Badge>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Analytics Tab ─────────────────────────────────────────────────────────────
function AnalyticsTab() {
  const { data } = trpc.seller.getAnalytics.useQuery({ days: 30 });
  return (
    <div className="space-y-5">
      <h2 className="text-xl sm:text-2xl font-bold text-white">Analytics</h2>
      {data?.revenueByDay && data.revenueByDay.length > 0 ? (
        <>
          <div className="bg-[#1A2235] rounded-xl p-4 sm:p-6 border border-[#2D3748]">
            <h3 className="text-white font-semibold mb-4 text-sm sm:text-base">Umsatz (30 Tage)</h3>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={data.revenueByDay}>
                <CartesianGrid strokeDasharray="3 3" stroke="#2D3748" />
                <XAxis dataKey="date" stroke="#64748B" tick={{ fontSize: 10 }} />
                <YAxis stroke="#64748B" tick={{ fontSize: 10 }} width={40} />
                <Tooltip contentStyle={{ background: "#1A2235", border: "1px solid #2D3748", borderRadius: 8, fontSize: 12 }} />
                <Bar dataKey="revenue" fill="#6366f1" radius={[4, 4, 0, 0]} name="Umsatz (€)" />
              </BarChart>
            </ResponsiveContainer>
          </div>
          {data.topProducts && data.topProducts.length > 0 && (
            <div className="bg-[#1A2235] rounded-xl p-4 sm:p-6 border border-[#2D3748]">
              <h3 className="text-white font-semibold mb-4 text-sm sm:text-base">Top-Produkte</h3>
              <div className="space-y-3">
                {data.topProducts.map((p, i) => (
                  <div key={i} className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="w-6 h-6 rounded-full bg-indigo-500/20 text-indigo-400 text-xs flex items-center justify-center font-medium shrink-0">{i + 1}</span>
                      <span className="text-gray-300 text-sm truncate">{p.name}</span>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <span className="text-gray-500 text-xs">{p.sold}x</span>
                      <span className="text-white font-medium text-sm">{formatCurrency(p.revenue)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      ) : (
        <div className="bg-[#1A2235] rounded-xl border border-[#2D3748] p-10 text-center">
          <BarChart2 className="w-10 h-10 text-gray-600 mx-auto mb-3" />
          <p className="text-gray-400 text-sm">Noch keine Daten vorhanden.</p>
        </div>
      )}
    </div>
  );
}

// ── Credits Tab ─────────────────────────────────────────────────────────────
function CreditsTab() {
  const { data: shop } = trpc.seller.getMyShop.useQuery();
  const { data: balance, refetch: refetchBalance } = trpc.credits.getShopCreditBalance.useQuery(
    { shopId: shop?.id ?? 0 },
    { enabled: !!shop?.id }
  );
  const { data: history, refetch: refetchHistory } = trpc.credits.getShopCreditHistory.useQuery(
    { shopId: shop?.id ?? 0 },
    { enabled: !!shop?.id }
  );
  const { data: customers } = trpc.seller.getMyCustomers.useQuery({ page: 1, limit: 100 });
  const grantCredits = trpc.credits.sellerGrantShopCredits.useMutation({
    onSuccess: () => { setForm({ userId: "", amount: "", description: "" }); refetchBalance(); refetchHistory(); },
    onError: (e) => alert("Fehler: " + e.message),
  });
  const [form, setForm] = useState({ userId: "", amount: "", description: "" });

  if (!shop) return (
    <div className="flex flex-col items-center justify-center h-64 text-center">
      <Store className="w-12 h-12 text-gray-600 mb-3" />
      <p className="text-gray-400">Kein Shop vorhanden. Erstelle zuerst einen Shop.</p>
    </div>
  );

  return (
    <div className="space-y-6">
      <h2 className="text-xl sm:text-2xl font-bold text-white">Shop-Guthaben</h2>

      {/* Balance Card */}
      <div className="bg-gradient-to-br from-emerald-500/10 to-teal-500/10 border border-emerald-500/20 rounded-2xl p-6">
        <div className="flex items-center gap-3 mb-1">
          <Coins className="w-6 h-6 text-emerald-400" />
          <span className="text-gray-400 text-sm">Gesamtes Shop-Guthaben vergeben</span>
        </div>
        <p className="text-4xl font-bold text-white">{(balance?.totalGranted ?? 0).toLocaleString("de-DE")}</p>
        <p className="text-emerald-400 text-sm mt-1">Credits im Umlauf: {(balance?.totalOutstanding ?? 0).toLocaleString("de-DE")}</p>
      </div>

      {/* Grant Credits Form */}
      <div className="bg-[#1A2235] rounded-xl border border-[#2D3748] p-5">
        <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
          <Plus className="w-4 h-4 text-emerald-400" /> Guthaben an Kunden vergeben
        </h3>
        <div className="space-y-3">
          <div>
            <label className="block text-xs text-gray-400 mb-1.5">Kunde auswählen</label>
            <select value={form.userId} onChange={e => setForm(f => ({ ...f, userId: e.target.value }))}
              className="w-full bg-[#0A0E1A] border border-[#2D3748] text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-emerald-500">
              <option value="">-- Kunde wählen --</option>
              {customers?.items.map(c => (
                <option key={c.id} value={String(c.id)}>{c.name ?? c.email} ({c.email})</option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-gray-400 mb-1.5">Betrag (Credits)</label>
              <input type="number" min="1" value={form.amount} onChange={e => setForm(f => ({ ...f, amount: e.target.value }))}
                placeholder="z.B. 50"
                className="w-full bg-[#0A0E1A] border border-[#2D3748] text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-emerald-500" />
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1.5">Beschreibung (optional)</label>
              <input value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                placeholder="z.B. Treueprämie"
                className="w-full bg-[#0A0E1A] border border-[#2D3748] text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-emerald-500" />
            </div>
          </div>
          <Button
            onClick={() => {
              const amt = parseInt(form.amount);
              if (!form.userId || !amt || amt < 1) return alert("Bitte Kunde und gültigen Betrag angeben");
              grantCredits.mutate({ shopId: shop.id, userId: parseInt(form.userId), amount: amt, description: form.description || undefined });
            }}
            disabled={grantCredits.isPending || !form.userId || !form.amount}
            className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-700 text-white"
          >
            {grantCredits.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Coins className="w-4 h-4 mr-2" />Guthaben vergeben</>}
          </Button>
        </div>
      </div>

      {/* History */}
      <div className="bg-[#1A2235] rounded-xl border border-[#2D3748] p-5">
        <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
          <History className="w-4 h-4 text-gray-400" /> Vergabe-Verlauf
        </h3>
        {!history?.length ? (
          <div className="text-center py-8 text-gray-500 text-sm">
            <Coins className="w-8 h-8 mx-auto mb-2 opacity-30" />
            Noch keine Guthaben vergeben
          </div>
        ) : (
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {history.map((h: any) => (
              <div key={h.id} className="flex items-center justify-between gap-2 bg-[#0A0E1A] rounded-lg px-4 py-2.5 border border-[#2D3748]">
                <div className="min-w-0">
                  <p className="text-white text-sm font-medium truncate">{h.recipientName ?? h.recipientEmail}</p>
                  {h.description && <p className="text-gray-500 text-xs truncate">{h.description}</p>}
                </div>
                <div className="text-right shrink-0">
                  <p className="text-emerald-400 font-semibold text-sm">+{h.amount.toLocaleString("de-DE")} Credits</p>
                  <p className="text-gray-600 text-xs">{new Date(h.createdAt).toLocaleDateString("de-DE")}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Settings Tab ──────────────────────────────────────────────────────────────
function SettingsTab() {
  const { data: shop, refetch } = trpc.seller.getMyShop.useQuery();
  const updateShop = trpc.seller.updateMyShop.useMutation({ onSuccess: () => refetch() });
  const [currency, setCurrency] = useState(shop?.currency ?? "EUR");
  const [saved, setSaved] = useState(false);
  return (
    <div className="space-y-5">
      <h2 className="text-xl sm:text-2xl font-bold text-white">Einstellungen</h2>
      <div className="bg-[#1A2235] rounded-xl border border-[#2D3748] p-4 sm:p-6 space-y-5">
        <div>
          <h3 className="text-white font-semibold mb-3">Shop-Einstellungen</h3>
          <div>
            <label className="block text-sm text-gray-400 mb-2">Währung</label>
            <select value={currency} onChange={(e) => setCurrency(e.target.value)} className="w-full sm:max-w-xs bg-[#0A0E1A] border border-[#2D3748] rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-indigo-500">
              <option value="EUR">EUR — Euro</option>
              <option value="USD">USD — US-Dollar</option>
              <option value="GBP">GBP — Britisches Pfund</option>
              <option value="CHF">CHF — Schweizer Franken</option>
            </select>
          </div>
        </div>
        <div className="pt-3 border-t border-[#2D3748]">
          <Button onClick={() => { updateShop.mutate({ currency }); setSaved(true); setTimeout(() => setSaved(false), 2000); }} className="w-full sm:w-auto bg-indigo-600 hover:bg-indigo-700 text-white" disabled={updateShop.isPending}>
            {saved ? <><Check className="w-4 h-4 mr-2" />Gespeichert!</> : "Speichern"}
          </Button>
        </div>
      </div>
      <div className="bg-[#1A2235] rounded-xl border border-red-500/20 p-4 sm:p-6">
        <h3 className="text-red-400 font-semibold mb-2">Gefahrenzone</h3>
        <p className="text-gray-400 text-sm mb-4">Shop deaktivieren — nicht mehr sichtbar für Kunden.</p>
        <Button onClick={() => { if (confirm("Shop wirklich deaktivieren?")) updateShop.mutate({ status: "suspended" }); }} variant="outline" className="w-full sm:w-auto border-red-500/30 text-red-400 hover:bg-red-500/10">
          Shop deaktivieren
        </Button>
      </div>
    </div>
  );
}

// ── Sidebar Plan Badge ────────────────────────────────────────────────────────
function SidebarPlanBadge() {
  const { data: plan } = trpc.subscription.getMyPlan.useQuery();
  if (!plan) return null;
  return (
    <div className="px-3 py-2 mb-1 rounded-lg bg-[#1A2235] border border-[#2D3748]">
      <div className="flex items-center justify-between">
        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${PLAN_COLORS[plan.plan] ?? PLAN_COLORS.free}`}>
          {PLAN_LABELS[plan.plan] ?? plan.plan}
        </span>
        {plan.isLifetimePremium && <span className="text-xs text-amber-400">★ Lifetime</span>}
      </div>
      <p className="text-xs text-gray-500 mt-1">
        {plan.currentShops}/{plan.shopLimit === -1 ? "∞" : plan.shopLimit} Shops
        {" · "}
        {plan.currentProducts}/{plan.productLimit === -1 ? "∞" : plan.productLimit} Produkte
      </p>
    </div>
  );
}

// ── No Shop Prompt ────────────────────────────────────────────────────────────
function NoShopPrompt() {
  return (
    <div className="flex flex-col items-center justify-center h-64 text-center px-4">
      <Store className="w-14 h-14 text-gray-600 mb-4" />
      <h3 className="text-xl font-semibold text-white mb-2">Kein Shop vorhanden</h3>
      <p className="text-gray-400 text-sm mb-5">Erstelle deinen ersten Shop und fange an zu verkaufen.</p>
      <Link to="/seller/setup">
        <Button className="bg-indigo-600 hover:bg-indigo-700 text-white">
          <Plus className="w-4 h-4 mr-2" />Shop erstellen
        </Button>
      </Link>
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────
export default function SellerDashboard() {
  const { tab } = useParams<{ tab?: string }>();
  const navigate = useNavigate();
  const { user, logout } = useAuth({ redirectOnUnauthenticated: true });
  const { data: myShop } = trpc.seller.getMyShop.useQuery();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const activeTab = tab ?? "overview";

  const renderTab = () => {
    switch (activeTab) {
      case "overview": return <OverviewTab />;
      case "shop": return <ShopTab />;
      case "products": return <ProductsTab />;
      case "orders": return <OrdersTab />;
      case "customers": return <CustomersTab />;
      case "payments": return <PaymentsTab />;
      case "coupons": return <CouponsTab />;
      case "tickets": return <TicketsTab />;
      case "analytics": return <AnalyticsTab />;
      case "settings": return <SettingsTab />;
      case "credits": return <CreditsTab />;
      default: return <OverviewTab />;
    }
  };

  const handleNav = (id: string) => {
    navigate(`/seller/${id}`);
    setSidebarOpen(false);
  };

  return (
    <div className="min-h-screen bg-[#0A0E1A] flex">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex w-64 shrink-0 bg-[#111827] border-r border-[#2D3748] flex-col fixed h-full z-30">
        <div className="p-5 border-b border-[#2D3748]">
          <Link to="/" className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center"><Store className="w-4 h-4 text-white" /></div>
            <span className="text-lg font-bold text-white">DigiSell</span>
          </Link>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-violet-500 flex items-center justify-center text-white text-sm font-medium shrink-0">{user?.name?.[0]?.toUpperCase() ?? "U"}</div>
            <div className="min-w-0">
              <p className="text-xs text-white font-medium truncate">{user?.name ?? user?.email}</p>
              {myShop && <p className="text-xs text-gray-500 truncate">{myShop.name}</p>}
            </div>
          </div>
        </div>
        <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
          {NAV_ITEMS.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button key={item.id} onClick={() => handleNav(item.id)} className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all ${isActive ? "bg-indigo-500/10 text-indigo-400 border border-indigo-500/20" : "text-gray-400 hover:text-white hover:bg-[#1A2235]"}`}>
                <item.icon className="w-4 h-4 shrink-0" />{item.label}
              </button>
            );
          })}
        </nav>
        <div className="p-3 border-t border-[#2D3748] space-y-0.5">
          <SidebarPlanBadge />
          {user?.role === "admin" && <Link to="/admin"><button className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-gray-400 hover:text-white hover:bg-[#1A2235] transition-all"><LayoutDashboard className="w-4 h-4" />Admin Panel</button></Link>}
          <Link to="/dashboard"><button className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-gray-400 hover:text-white hover:bg-[#1A2235] transition-all"><Home className="w-4 h-4" />Kunden-Dashboard</button></Link>
          <button onClick={logout} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-gray-400 hover:text-red-400 hover:bg-red-500/5 transition-all"><LogOut className="w-4 h-4" />Abmelden</button>
        </div>
      </aside>

      {/* Mobile Overlay Sidebar */}
      {sidebarOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div className="absolute inset-0 bg-black/60" onClick={() => setSidebarOpen(false)} />
          <aside className="relative w-72 bg-[#111827] border-r border-[#2D3748] flex flex-col h-full z-10">
            <div className="p-5 border-b border-[#2D3748] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center"><Store className="w-4 h-4 text-white" /></div>
                <span className="text-lg font-bold text-white">DigiSell</span>
              </div>
              <button onClick={() => setSidebarOpen(false)} className="p-2 rounded-lg hover:bg-[#1A2235] text-gray-400"><X className="w-5 h-5" /></button>
            </div>
            <div className="px-5 py-3 border-b border-[#2D3748]">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-violet-500 flex items-center justify-center text-white font-medium">{user?.name?.[0]?.toUpperCase() ?? "U"}</div>
                <div className="min-w-0">
                  <p className="text-sm text-white font-medium truncate">{user?.name ?? user?.email}</p>
                  {myShop && <p className="text-xs text-gray-500 truncate">{myShop.name}</p>}
                </div>
              </div>
            </div>
            <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
              {NAV_ITEMS.map((item) => {
                const isActive = activeTab === item.id;
                return (
                  <button key={item.id} onClick={() => handleNav(item.id)} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm transition-all ${isActive ? "bg-indigo-500/10 text-indigo-400 border border-indigo-500/20" : "text-gray-400 hover:text-white hover:bg-[#1A2235]"}`}>
                    <item.icon className="w-5 h-5 shrink-0" />{item.label}
                  </button>
                );
              })}
            </nav>
            <div className="p-3 border-t border-[#2D3748] space-y-0.5">
              {user?.role === "admin" && <Link to="/admin" onClick={() => setSidebarOpen(false)}><button className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm text-gray-400 hover:text-white hover:bg-[#1A2235]"><LayoutDashboard className="w-5 h-5" />Admin Panel</button></Link>}
              <Link to="/dashboard" onClick={() => setSidebarOpen(false)}><button className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm text-gray-400 hover:text-white hover:bg-[#1A2235]"><Home className="w-5 h-5" />Kunden-Dashboard</button></Link>
              <button onClick={logout} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm text-gray-400 hover:text-red-400 hover:bg-red-500/5"><LogOut className="w-5 h-5" />Abmelden</button>
            </div>
          </aside>
        </div>
      )}

      {/* Main Content */}
      <main className="flex-1 lg:ml-64 flex flex-col min-h-screen">
        {/* Mobile Top Bar */}
        <header className="lg:hidden sticky top-0 z-20 bg-[#111827]/95 backdrop-blur border-b border-[#2D3748] flex items-center justify-between px-4 h-14">
          <button onClick={() => setSidebarOpen(true)} className="p-2 rounded-lg hover:bg-[#1A2235] text-gray-400 hover:text-white"><Menu className="w-5 h-5" /></button>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center"><Store className="w-3.5 h-3.5 text-white" /></div>
            <span className="text-white font-semibold text-sm">{NAV_ITEMS.find((n) => n.id === activeTab)?.label ?? "Dashboard"}</span>
          </div>
          <Link to="/"><button className="p-2 rounded-lg hover:bg-[#1A2235] text-gray-400 hover:text-white"><Home className="w-5 h-5" /></button></Link>
        </header>

        {/* Content */}
        <div className="flex-1 p-4 sm:p-6 lg:p-8 pb-24 lg:pb-8">
          <div className="max-w-5xl mx-auto">
            {!myShop && activeTab !== "shop" && (
              <div className="mb-5 flex items-start sm:items-center gap-3 p-4 bg-indigo-500/10 border border-indigo-500/30 rounded-xl">
                <AlertCircle className="w-5 h-5 text-indigo-400 shrink-0 mt-0.5 sm:mt-0" />
                <p className="text-indigo-300 text-sm flex-1">Du hast noch keinen Shop!</p>
                <Link to="/seller/setup"><Button size="sm" className="bg-indigo-600 hover:bg-indigo-700 text-white shrink-0">Erstellen <ChevronRight className="w-3.5 h-3.5 ml-1" /></Button></Link>
              </div>
            )}
            {renderTab()}
          </div>
        </div>
      </main>

      {/* Mobile Bottom Navigation */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-20 bg-[#111827]/95 backdrop-blur border-t border-[#2D3748] flex items-center">
        {BOTTOM_NAV.map((item) => {
          const isActive = item.id === "settings" ? ["settings", "coupons", "tickets", "customers", "payments", "shop"].includes(activeTab) : activeTab === item.id;
          return (
            <button key={item.id} onClick={() => item.id === "settings" ? setSidebarOpen(true) : handleNav(item.id)} className={`flex-1 flex flex-col items-center gap-1 py-2.5 transition-colors ${isActive ? "text-indigo-400" : "text-gray-500 hover:text-gray-300"}`}>
              <item.icon className="w-5 h-5" />
              <span className="text-[10px] font-medium">{item.label}</span>
            </button>
          );
        })}
      </nav>
    </div>
  );
}
