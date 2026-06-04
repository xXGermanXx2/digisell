import { useState } from "react";
import { Link, useParams, useNavigate } from "react-router";
import { useAuth } from "@/hooks/useAuth";
import { trpc } from "@/providers/trpc";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
} from "recharts";
import {
  LayoutDashboard,
  Store,
  Package,
  ShoppingCart,
  Users,
  DollarSign,
  Ticket,
  Tag,
  BarChart2,
  Settings,
  LogOut,
  Plus,
  Edit,
  Trash2,
  Eye,
  ExternalLink,
  TrendingUp,
  Loader2,
  AlertCircle,
  ChevronRight,
  Check,
  X,
  Globe,
} from "lucide-react";

const NAV_ITEMS = [
  { id: "overview", label: "Dashboard", icon: LayoutDashboard },
  { id: "shop", label: "Mein Shop", icon: Store },
  { id: "products", label: "Produkte", icon: Package },
  { id: "orders", label: "Bestellungen", icon: ShoppingCart },
  { id: "customers", label: "Kunden", icon: Users },
  { id: "payments", label: "Zahlungen", icon: DollarSign },
  { id: "coupons", label: "Gutscheine", icon: Tag },
  { id: "tickets", label: "Tickets", icon: Ticket },
  { id: "analytics", label: "Analytics", icon: BarChart2 },
  { id: "settings", label: "Einstellungen", icon: Settings },
];

function formatCurrency(val: number) {
  return new Intl.NumberFormat("de-DE", { style: "currency", currency: "EUR" }).format(val);
}
function formatDate(d: string | Date | null) {
  if (!d) return "-";
  return new Date(d).toLocaleDateString("de-DE");
}

// ── Overview Tab ─────────────────────────────────────────────────────────────
function OverviewTab() {
  const { data: stats, isLoading } = trpc.seller.getStats.useQuery();
  const { data: chart } = trpc.seller.getRevenueChart.useQuery({ days: 30 });

  if (isLoading) return <div className="flex items-center justify-center h-64"><Loader2 className="w-8 h-8 animate-spin text-indigo-400" /></div>;
  if (!stats) return <NoShopPrompt />;

  const statCards = [
    { label: "Gesamtumsatz", value: formatCurrency(stats.revenueTotal), icon: DollarSign, color: "text-green-400" },
    { label: "Umsatz (Monat)", value: formatCurrency(stats.revenueMonth), icon: TrendingUp, color: "text-indigo-400" },
    { label: "Bestellungen", value: stats.orders, icon: ShoppingCart, color: "text-blue-400" },
    { label: "Produkte", value: stats.products, icon: Package, color: "text-violet-400" },
    { label: "Kunden", value: stats.customers, icon: Users, color: "text-orange-400" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-white">Willkommen zurück!</h2>
        <p className="text-gray-400 text-sm mt-1">
          Dein Shop: <span className="text-indigo-400 font-medium">{stats.shop.name}</span>
          <a href={`/store/${stats.shop.slug}`} target="_blank" rel="noopener noreferrer" className="ml-2 text-gray-500 hover:text-white">
            <ExternalLink className="w-3 h-3 inline" />
          </a>
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {statCards.map((s) => (
          <div key={s.label} className="bg-[#1A2235] rounded-xl p-4 border border-[#2D3748]">
            <s.icon className={`w-5 h-5 ${s.color} mb-2`} />
            <p className="text-2xl font-bold text-white">{s.value}</p>
            <p className="text-xs text-gray-400 mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      {chart && chart.length > 0 && (
        <div className="bg-[#1A2235] rounded-xl p-6 border border-[#2D3748]">
          <h3 className="text-white font-semibold mb-4">Umsatz (letzte 30 Tage)</h3>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={chart}>
              <defs>
                <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#2D3748" />
              <XAxis dataKey="date" stroke="#64748B" tick={{ fontSize: 11 }} />
              <YAxis stroke="#64748B" tick={{ fontSize: 11 }} tickFormatter={(v) => `€${v}`} />
              <Tooltip
                contentStyle={{ background: "#1A2235", border: "1px solid #2D3748", borderRadius: 8 }}
                labelStyle={{ color: "#94A3B8" }}
                formatter={(v: number) => [formatCurrency(v), "Umsatz"]}
              />
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

  const saveEdit = () => {
    updateShop.mutate({ name, description, logo, banner });
    setEditing(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-white">Mein Shop</h2>
        <div className="flex gap-2">
          <a href={`/store/${shop.slug}`} target="_blank" rel="noopener noreferrer">
            <Button variant="outline" size="sm" className="border-[#2D3748] text-gray-400 hover:text-white">
              <Eye className="w-4 h-4 mr-2" />
              Vorschau
            </Button>
          </a>
          <Button onClick={startEdit} size="sm" className="bg-indigo-600 hover:bg-indigo-700 text-white">
            <Edit className="w-4 h-4 mr-2" />
            Bearbeiten
          </Button>
        </div>
      </div>

      {/* Shop Card */}
      <div className="bg-[#1A2235] rounded-xl border border-[#2D3748] overflow-hidden">
        {shop.banner && (
          <div className="h-32 bg-gradient-to-r from-indigo-600 to-violet-600 overflow-hidden">
            <img src={shop.banner} alt="Banner" className="w-full h-full object-cover" />
          </div>
        )}
        {!shop.banner && <div className="h-32 bg-gradient-to-r from-indigo-600/30 to-violet-600/30" />}

        <div className="p-6">
          <div className="flex items-start gap-4">
            <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center overflow-hidden -mt-10 border-4 border-[#1A2235]">
              {shop.logo ? (
                <img src={shop.logo} alt="Logo" className="w-full h-full object-cover" />
              ) : (
                <Store className="w-8 h-8 text-white" />
              )}
            </div>
            <div className="flex-1 pt-0">
              <div className="flex items-center gap-2">
                <h3 className="text-xl font-bold text-white">{shop.name}</h3>
                <Badge className={shop.status === "active" ? "bg-green-500/20 text-green-400" : "bg-red-500/20 text-red-400"}>
                  {shop.status === "active" ? "Aktiv" : "Inaktiv"}
                </Badge>
              </div>
              <div className="flex items-center gap-1 text-sm text-indigo-400 mt-1">
                <Globe className="w-3 h-3" />
                <span>/store/{shop.slug}</span>
              </div>
              <p className="text-gray-400 text-sm mt-2">{shop.description ?? "Keine Beschreibung"}</p>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4 mt-6 pt-6 border-t border-[#2D3748]">
            <div className="text-center">
              <p className="text-2xl font-bold text-white">{shop.totalProducts}</p>
              <p className="text-xs text-gray-400">Produkte</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-white">{shop.totalOrders}</p>
              <p className="text-xs text-gray-400">Bestellungen</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-white">{formatCurrency(Number(shop.totalRevenue))}</p>
              <p className="text-xs text-gray-400">Umsatz</p>
            </div>
          </div>
        </div>
      </div>

      {/* Edit Modal */}
      {editing && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-[#111827] border border-[#2D3748] rounded-2xl p-6 w-full max-w-lg">
            <h3 className="text-lg font-semibold text-white mb-4">Shop bearbeiten</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-gray-400 mb-1">Shop-Name</label>
                <Input value={name} onChange={(e) => setName(e.target.value)} className="bg-[#1A2235] border-[#2D3748] text-white" />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Beschreibung</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                  className="w-full bg-[#1A2235] border border-[#2D3748] rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-indigo-500 resize-none"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Logo-URL</label>
                <Input value={logo} onChange={(e) => setLogo(e.target.value)} placeholder="https://..." className="bg-[#1A2235] border-[#2D3748] text-white" />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Banner-URL</label>
                <Input value={banner} onChange={(e) => setBanner(e.target.value)} placeholder="https://..." className="bg-[#1A2235] border-[#2D3748] text-white" />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <Button onClick={() => setEditing(false)} variant="outline" className="flex-1 border-[#2D3748] text-gray-400">Abbrechen</Button>
              <Button onClick={saveEdit} className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white" disabled={updateShop.isPending}>
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
  const createProduct = trpc.seller.createProduct.useMutation({ onSuccess: () => { refetch(); setShowCreate(false); } });
  const [form, setForm] = useState({ name: "", description: "", price: "", type: "file" as const, status: "draft" as const });

  const statusColor: Record<string, string> = {
    active: "bg-green-500/20 text-green-400",
    inactive: "bg-gray-500/20 text-gray-400",
    draft: "bg-yellow-500/20 text-yellow-400",
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-white">Produkte</h2>
        <Button onClick={() => setShowCreate(true)} className="bg-indigo-600 hover:bg-indigo-700 text-white">
          <Plus className="w-4 h-4 mr-2" />
          Produkt erstellen
        </Button>
      </div>

      {!data?.items?.length ? (
        <div className="bg-[#1A2235] rounded-xl border border-[#2D3748] p-12 text-center">
          <Package className="w-12 h-12 text-gray-600 mx-auto mb-4" />
          <p className="text-gray-400">Noch keine Produkte. Erstelle dein erstes Produkt!</p>
        </div>
      ) : (
        <div className="bg-[#1A2235] rounded-xl border border-[#2D3748] overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[#2D3748]">
                <th className="text-left p-4 text-xs text-gray-400 uppercase">Produkt</th>
                <th className="text-left p-4 text-xs text-gray-400 uppercase">Typ</th>
                <th className="text-left p-4 text-xs text-gray-400 uppercase">Preis</th>
                <th className="text-left p-4 text-xs text-gray-400 uppercase">Status</th>
                <th className="text-left p-4 text-xs text-gray-400 uppercase">Verkauft</th>
                <th className="text-right p-4 text-xs text-gray-400 uppercase">Aktionen</th>
              </tr>
            </thead>
            <tbody>
              {data.items.map((p) => (
                <tr key={p.id} className="border-b border-[#2D3748] hover:bg-[#1E2A3D] transition-colors">
                  <td className="p-4">
                    <p className="text-white font-medium text-sm">{p.name}</p>
                    <p className="text-gray-500 text-xs mt-0.5">/product/{p.slug}</p>
                  </td>
                  <td className="p-4 text-gray-400 text-sm capitalize">{p.type}</td>
                  <td className="p-4 text-white font-medium text-sm">{formatCurrency(Number(p.price))}</td>
                  <td className="p-4">
                    <Badge className={`text-xs ${statusColor[p.status] ?? ""}`}>{p.status}</Badge>
                  </td>
                  <td className="p-4 text-gray-400 text-sm">{p.soldCount}</td>
                  <td className="p-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => updateProduct.mutate({ id: p.id, status: p.status === "active" ? "inactive" : "active" })}
                        className="p-1.5 rounded-lg hover:bg-[#2D3748] text-gray-400 hover:text-white transition-colors"
                        title={p.status === "active" ? "Deaktivieren" : "Aktivieren"}
                      >
                        {p.status === "active" ? <X className="w-4 h-4" /> : <Check className="w-4 h-4" />}
                      </button>
                      <button
                        onClick={() => { if (confirm("Produkt wirklich löschen?")) deleteProduct.mutate({ id: p.id }); }}
                        className="p-1.5 rounded-lg hover:bg-red-500/10 text-gray-400 hover:text-red-400 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Create Modal */}
      {showCreate && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-[#111827] border border-[#2D3748] rounded-2xl p-6 w-full max-w-lg">
            <h3 className="text-lg font-semibold text-white mb-4">Neues Produkt</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-gray-400 mb-1">Name *</label>
                <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="bg-[#1A2235] border-[#2D3748] text-white" />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Beschreibung</label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  rows={3}
                  className="w-full bg-[#1A2235] border border-[#2D3748] rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-indigo-500 resize-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Preis (€) *</label>
                  <Input type="number" min="0" step="0.01" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} className="bg-[#1A2235] border-[#2D3748] text-white" />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Typ</label>
                  <select
                    value={form.type}
                    onChange={(e) => setForm({ ...form, type: e.target.value as any })}
                    className="w-full bg-[#1A2235] border border-[#2D3748] rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-indigo-500"
                  >
                    <option value="file">Datei</option>
                    <option value="license">Lizenzschlüssel</option>
                    <option value="service">Dienstleistung</option>
                    <option value="subscription">Abonnement</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Status</label>
                <select
                  value={form.status}
                  onChange={(e) => setForm({ ...form, status: e.target.value as any })}
                  className="w-full bg-[#1A2235] border border-[#2D3748] rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-indigo-500"
                >
                  <option value="draft">Entwurf</option>
                  <option value="active">Aktiv</option>
                  <option value="inactive">Inaktiv</option>
                </select>
              </div>
            </div>
            <div className="flex gap-3 mt-6">
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
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-white">Bestellungen</h2>
      {!data?.items?.length ? (
        <div className="bg-[#1A2235] rounded-xl border border-[#2D3748] p-12 text-center">
          <ShoppingCart className="w-12 h-12 text-gray-600 mx-auto mb-4" />
          <p className="text-gray-400">Noch keine Bestellungen.</p>
        </div>
      ) : (
        <div className="bg-[#1A2235] rounded-xl border border-[#2D3748] overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[#2D3748]">
                <th className="text-left p-4 text-xs text-gray-400 uppercase">Bestellung</th>
                <th className="text-left p-4 text-xs text-gray-400 uppercase">Kunde</th>
                <th className="text-left p-4 text-xs text-gray-400 uppercase">Betrag</th>
                <th className="text-left p-4 text-xs text-gray-400 uppercase">Status</th>
                <th className="text-left p-4 text-xs text-gray-400 uppercase">Datum</th>
              </tr>
            </thead>
            <tbody>
              {data.items.map((o) => (
                <tr key={o.id} className="border-b border-[#2D3748] hover:bg-[#1E2A3D] transition-colors">
                  <td className="p-4 text-indigo-400 font-mono text-sm">{o.orderNumber}</td>
                  <td className="p-4 text-gray-300 text-sm">{o.customerEmail}</td>
                  <td className="p-4 text-white font-medium text-sm">{formatCurrency(Number(o.total))}</td>
                  <td className="p-4"><Badge className={`text-xs ${statusColor[o.status] ?? ""}`}>{o.status}</Badge></td>
                  <td className="p-4 text-gray-400 text-sm">{formatDate(o.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ── Customers Tab ─────────────────────────────────────────────────────────────
function CustomersTab() {
  const { data } = trpc.seller.getCustomers.useQuery({ page: 1, limit: 50 });

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-white">Kunden</h2>
      {!data?.items?.length ? (
        <div className="bg-[#1A2235] rounded-xl border border-[#2D3748] p-12 text-center">
          <Users className="w-12 h-12 text-gray-600 mx-auto mb-4" />
          <p className="text-gray-400">Noch keine Kunden.</p>
        </div>
      ) : (
        <div className="bg-[#1A2235] rounded-xl border border-[#2D3748] overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[#2D3748]">
                <th className="text-left p-4 text-xs text-gray-400 uppercase">Kunde</th>
                <th className="text-left p-4 text-xs text-gray-400 uppercase">Bestellungen</th>
                <th className="text-left p-4 text-xs text-gray-400 uppercase">Ausgaben</th>
                <th className="text-left p-4 text-xs text-gray-400 uppercase">Letzte Bestellung</th>
              </tr>
            </thead>
            <tbody>
              {data.items.map((c, i) => (
                <tr key={i} className="border-b border-[#2D3748] hover:bg-[#1E2A3D] transition-colors">
                  <td className="p-4">
                    <p className="text-white text-sm">{c.name ?? "Gast"}</p>
                    <p className="text-gray-500 text-xs">{c.email}</p>
                  </td>
                  <td className="p-4 text-gray-300 text-sm">{c.orderCount}</td>
                  <td className="p-4 text-white font-medium text-sm">{formatCurrency(c.totalSpent)}</td>
                  <td className="p-4 text-gray-400 text-sm">{formatDate(c.lastOrder)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ── Payments Tab ──────────────────────────────────────────────────────────────
function PaymentsTab() {
  const { data } = trpc.seller.getPayments.useQuery({ page: 1, limit: 50 });

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-white">Zahlungen</h2>
      {!data?.items?.length ? (
        <div className="bg-[#1A2235] rounded-xl border border-[#2D3748] p-12 text-center">
          <DollarSign className="w-12 h-12 text-gray-600 mx-auto mb-4" />
          <p className="text-gray-400">Noch keine Zahlungen.</p>
        </div>
      ) : (
        <div className="bg-[#1A2235] rounded-xl border border-[#2D3748] overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[#2D3748]">
                <th className="text-left p-4 text-xs text-gray-400 uppercase">Bestellung</th>
                <th className="text-left p-4 text-xs text-gray-400 uppercase">Methode</th>
                <th className="text-left p-4 text-xs text-gray-400 uppercase">Betrag</th>
                <th className="text-left p-4 text-xs text-gray-400 uppercase">Datum</th>
              </tr>
            </thead>
            <tbody>
              {data.items.map((o) => (
                <tr key={o.id} className="border-b border-[#2D3748] hover:bg-[#1E2A3D] transition-colors">
                  <td className="p-4 text-indigo-400 font-mono text-sm">{o.orderNumber}</td>
                  <td className="p-4 text-gray-300 text-sm capitalize">{o.paymentMethod}</td>
                  <td className="p-4 text-green-400 font-medium text-sm">{formatCurrency(Number(o.total))}</td>
                  <td className="p-4 text-gray-400 text-sm">{formatDate(o.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
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
  const [form, setForm] = useState({ code: "", type: "percentage" as const, value: "", minOrderAmount: "" });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-white">Gutscheine</h2>
        <Button onClick={() => setShowCreate(true)} className="bg-indigo-600 hover:bg-indigo-700 text-white">
          <Plus className="w-4 h-4 mr-2" />
          Gutschein erstellen
        </Button>
      </div>

      {!data?.items?.length ? (
        <div className="bg-[#1A2235] rounded-xl border border-[#2D3748] p-12 text-center">
          <Tag className="w-12 h-12 text-gray-600 mx-auto mb-4" />
          <p className="text-gray-400">Noch keine Gutscheine.</p>
        </div>
      ) : (
        <div className="bg-[#1A2235] rounded-xl border border-[#2D3748] overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[#2D3748]">
                <th className="text-left p-4 text-xs text-gray-400 uppercase">Code</th>
                <th className="text-left p-4 text-xs text-gray-400 uppercase">Typ</th>
                <th className="text-left p-4 text-xs text-gray-400 uppercase">Wert</th>
                <th className="text-left p-4 text-xs text-gray-400 uppercase">Verwendet</th>
                <th className="text-right p-4 text-xs text-gray-400 uppercase">Aktionen</th>
              </tr>
            </thead>
            <tbody>
              {data.items.map((c) => (
                <tr key={c.id} className="border-b border-[#2D3748] hover:bg-[#1E2A3D] transition-colors">
                  <td className="p-4 font-mono text-indigo-400 text-sm">{c.code}</td>
                  <td className="p-4 text-gray-300 text-sm capitalize">{c.type}</td>
                  <td className="p-4 text-white text-sm">{c.type === "percentage" ? `${c.value}%` : formatCurrency(Number(c.value))}</td>
                  <td className="p-4 text-gray-400 text-sm">{c.usedCount} / {c.maxUses === -1 ? "∞" : c.maxUses}</td>
                  <td className="p-4 text-right">
                    <button
                      onClick={() => { if (confirm("Gutschein löschen?")) deleteCoupon.mutate({ id: c.id }); }}
                      className="p-1.5 rounded-lg hover:bg-red-500/10 text-gray-400 hover:text-red-400 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showCreate && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-[#111827] border border-[#2D3748] rounded-2xl p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold text-white mb-4">Gutschein erstellen</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-gray-400 mb-1">Code *</label>
                <Input value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })} placeholder="SUMMER20" className="bg-[#1A2235] border-[#2D3748] text-white font-mono" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Typ</label>
                  <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value as any })} className="w-full bg-[#1A2235] border border-[#2D3748] rounded-lg px-3 py-2 text-white text-sm focus:outline-none">
                    <option value="percentage">Prozent (%)</option>
                    <option value="fixed">Festbetrag (€)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Wert *</label>
                  <Input type="number" min="0" value={form.value} onChange={(e) => setForm({ ...form, value: e.target.value })} className="bg-[#1A2235] border-[#2D3748] text-white" />
                </div>
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Mindestbestellwert (€)</label>
                <Input type="number" min="0" value={form.minOrderAmount} onChange={(e) => setForm({ ...form, minOrderAmount: e.target.value })} className="bg-[#1A2235] border-[#2D3748] text-white" />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <Button onClick={() => setShowCreate(false)} variant="outline" className="flex-1 border-[#2D3748] text-gray-400">Abbrechen</Button>
              <Button
                onClick={() => createCoupon.mutate({ code: form.code, type: form.type, value: Number(form.value), minOrderAmount: form.minOrderAmount ? Number(form.minOrderAmount) : undefined })}
                className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white"
                disabled={!form.code || !form.value || createCoupon.isPending}
              >
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
  const statusColor: Record<string, string> = {
    open: "bg-yellow-500/20 text-yellow-400",
    in_progress: "bg-blue-500/20 text-blue-400",
    resolved: "bg-green-500/20 text-green-400",
    closed: "bg-gray-500/20 text-gray-400",
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-white">Support-Tickets</h2>
      {!data?.items?.length ? (
        <div className="bg-[#1A2235] rounded-xl border border-[#2D3748] p-12 text-center">
          <Ticket className="w-12 h-12 text-gray-600 mx-auto mb-4" />
          <p className="text-gray-400">Noch keine Tickets.</p>
        </div>
      ) : (
        <div className="bg-[#1A2235] rounded-xl border border-[#2D3748] overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[#2D3748]">
                <th className="text-left p-4 text-xs text-gray-400 uppercase">Ticket</th>
                <th className="text-left p-4 text-xs text-gray-400 uppercase">Betreff</th>
                <th className="text-left p-4 text-xs text-gray-400 uppercase">Status</th>
                <th className="text-left p-4 text-xs text-gray-400 uppercase">Erstellt</th>
              </tr>
            </thead>
            <tbody>
              {data.items.map((t) => (
                <tr key={t.id} className="border-b border-[#2D3748] hover:bg-[#1E2A3D] transition-colors">
                  <td className="p-4 text-indigo-400 font-mono text-sm">{t.ticketNumber}</td>
                  <td className="p-4 text-gray-300 text-sm">{t.subject}</td>
                  <td className="p-4"><Badge className={`text-xs ${statusColor[t.status] ?? ""}`}>{t.status}</Badge></td>
                  <td className="p-4 text-gray-400 text-sm">{formatDate(t.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ── Analytics Tab ─────────────────────────────────────────────────────────────
function AnalyticsTab() {
  const { data } = trpc.seller.getAnalytics.useQuery({ days: 30 });

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-white">Analytics</h2>

      {data?.revenueByDay && data.revenueByDay.length > 0 && (
        <div className="bg-[#1A2235] rounded-xl p-6 border border-[#2D3748]">
          <h3 className="text-white font-semibold mb-4">Umsatz & Bestellungen (30 Tage)</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={data.revenueByDay}>
              <CartesianGrid strokeDasharray="3 3" stroke="#2D3748" />
              <XAxis dataKey="date" stroke="#64748B" tick={{ fontSize: 11 }} />
              <YAxis stroke="#64748B" tick={{ fontSize: 11 }} />
              <Tooltip contentStyle={{ background: "#1A2235", border: "1px solid #2D3748", borderRadius: 8 }} />
              <Bar dataKey="revenue" fill="#6366f1" radius={[4, 4, 0, 0]} name="Umsatz (€)" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {data?.topProducts && data.topProducts.length > 0 && (
        <div className="bg-[#1A2235] rounded-xl p-6 border border-[#2D3748]">
          <h3 className="text-white font-semibold mb-4">Top-Produkte</h3>
          <div className="space-y-3">
            {data.topProducts.map((p, i) => (
              <div key={i} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="w-6 h-6 rounded-full bg-indigo-500/20 text-indigo-400 text-xs flex items-center justify-center font-medium">{i + 1}</span>
                  <span className="text-gray-300 text-sm">{p.name}</span>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-gray-500 text-xs">{p.sold}x verkauft</span>
                  <span className="text-white font-medium text-sm">{formatCurrency(p.revenue)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {(!data || data.revenueByDay.length === 0) && (
        <div className="bg-[#1A2235] rounded-xl border border-[#2D3748] p-12 text-center">
          <BarChart2 className="w-12 h-12 text-gray-600 mx-auto mb-4" />
          <p className="text-gray-400">Noch keine Daten für Analytics vorhanden.</p>
        </div>
      )}
    </div>
  );
}

// ── Settings Tab ──────────────────────────────────────────────────────────────
function SettingsTab() {
  const { data: shop, refetch } = trpc.seller.getMyShop.useQuery();
  const updateShop = trpc.seller.updateMyShop.useMutation({ onSuccess: () => refetch() });
  const [currency, setCurrency] = useState(shop?.currency ?? "EUR");
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    updateShop.mutate({ currency });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-white">Einstellungen</h2>

      <div className="bg-[#1A2235] rounded-xl border border-[#2D3748] p-6 space-y-6">
        <div>
          <h3 className="text-white font-semibold mb-4">Shop-Einstellungen</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm text-gray-400 mb-2">Währung</label>
              <select
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                className="w-full max-w-xs bg-[#0A0E1A] border border-[#2D3748] rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-indigo-500"
              >
                <option value="EUR">EUR — Euro</option>
                <option value="USD">USD — US-Dollar</option>
                <option value="GBP">GBP — Britisches Pfund</option>
                <option value="CHF">CHF — Schweizer Franken</option>
              </select>
            </div>
          </div>
        </div>

        <div className="pt-4 border-t border-[#2D3748]">
          <Button onClick={handleSave} className="bg-indigo-600 hover:bg-indigo-700 text-white" disabled={updateShop.isPending}>
            {saved ? (
              <><Check className="w-4 h-4 mr-2" />Gespeichert!</>
            ) : updateShop.isPending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              "Speichern"
            )}
          </Button>
        </div>
      </div>

      <div className="bg-[#1A2235] rounded-xl border border-red-500/20 p-6">
        <h3 className="text-red-400 font-semibold mb-2">Gefahrenzone</h3>
        <p className="text-gray-400 text-sm mb-4">Shop deaktivieren — dein Shop wird für Kunden nicht mehr sichtbar sein.</p>
        <Button
          onClick={() => { if (confirm("Shop wirklich deaktivieren?")) updateShop.mutate({ status: "suspended" }); }}
          variant="outline"
          className="border-red-500/30 text-red-400 hover:bg-red-500/10"
        >
          Shop deaktivieren
        </Button>
      </div>
    </div>
  );
}

// ── No Shop Prompt ────────────────────────────────────────────────────────────
function NoShopPrompt() {
  return (
    <div className="flex flex-col items-center justify-center h-64 text-center">
      <Store className="w-16 h-16 text-gray-600 mb-4" />
      <h3 className="text-xl font-semibold text-white mb-2">Kein Shop vorhanden</h3>
      <p className="text-gray-400 mb-6">Erstelle zuerst deinen Shop, um loszulegen.</p>
      <Link to="/seller/setup">
        <Button className="bg-indigo-600 hover:bg-indigo-700 text-white">
          <Plus className="w-4 h-4 mr-2" />
          Shop erstellen
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
      default: return <OverviewTab />;
    }
  };

  return (
    <div className="min-h-screen bg-[#0A0E1A] flex">
      {/* Sidebar */}
      <aside className="w-64 shrink-0 bg-[#111827] border-r border-[#2D3748] flex flex-col">
        {/* Logo */}
        <div className="p-6 border-b border-[#2D3748]">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center">
              <Store className="w-4 h-4 text-white" />
            </div>
            <span className="text-lg font-bold text-white">DigiSell</span>
          </Link>
          <div className="mt-3 flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-gradient-to-br from-indigo-500 to-violet-500 flex items-center justify-center text-white text-xs font-medium">
              {user?.name?.[0]?.toUpperCase() ?? "U"}
            </div>
            <div>
              <p className="text-xs text-white font-medium truncate max-w-[140px]">{user?.name ?? user?.email}</p>
              {myShop && <p className="text-xs text-gray-500 truncate max-w-[140px]">{myShop.name}</p>}
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {NAV_ITEMS.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => navigate(`/seller/${item.id}`)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all ${
                  isActive
                    ? "bg-indigo-500/10 text-indigo-400 border border-indigo-500/20"
                    : "text-gray-400 hover:text-white hover:bg-[#1A2235]"
                }`}
              >
                <item.icon className="w-4 h-4 shrink-0" />
                {item.label}
              </button>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-[#2D3748] space-y-2">
          {user?.role === "admin" && (
            <Link to="/admin">
              <button className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-gray-400 hover:text-white hover:bg-[#1A2235] transition-all">
                <LayoutDashboard className="w-4 h-4" />
                Admin Panel
              </button>
            </Link>
          )}
          <Link to="/dashboard">
            <button className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-gray-400 hover:text-white hover:bg-[#1A2235] transition-all">
              <Users className="w-4 h-4" />
              Kunden-Dashboard
            </button>
          </Link>
          <button
            onClick={logout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-gray-400 hover:text-red-400 hover:bg-red-500/5 transition-all"
          >
            <LogOut className="w-4 h-4" />
            Abmelden
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        <div className="p-8 max-w-6xl">
          {/* No shop banner */}
          {!myShop && activeTab !== "shop" && (
            <div className="mb-6 flex items-center gap-3 p-4 bg-indigo-500/10 border border-indigo-500/30 rounded-xl">
              <AlertCircle className="w-5 h-5 text-indigo-400 shrink-0" />
              <p className="text-indigo-300 text-sm flex-1">Du hast noch keinen Shop. Erstelle jetzt deinen ersten Shop!</p>
              <Link to="/seller/setup">
                <Button size="sm" className="bg-indigo-600 hover:bg-indigo-700 text-white">
                  Shop erstellen
                  <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </Link>
            </div>
          )}
          {renderTab()}
        </div>
      </main>
    </div>
  );
}
