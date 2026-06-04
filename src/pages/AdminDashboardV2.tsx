import { useState } from "react";
import { trpc } from "@/providers/trpc";
import {
  TrendingUp, ShoppingCart, Package, Users, Eye, MousePointerClick,
  Download, RefreshCw, BarChart3, ArrowUpRight, ArrowDownRight
} from "lucide-react";
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend
} from "recharts";

export default function AdminDashboardV2() {
  const [revenueDays, setRevenueDays] = useState(30);
  const [visitorDays, setVisitorDays] = useState(30);

  const { data: overview, isLoading: overviewLoading, refetch } = trpc.analytics.dashboard.useQuery();
  const { data: revenueData } = trpc.analytics.revenue.useQuery({ days: revenueDays });
  const { data: visitorData } = trpc.analytics.visitors.useQuery({ days: visitorDays });
  const { data: topProducts } = trpc.analytics.topProducts.useQuery({ limit: 5 });

  const exportMutation = trpc.analytics.exportOrders.useQuery(
    { status: "all" },
    { enabled: false }
  );

  const handleExport = async () => {
    const result = await exportMutation.refetch();
    if (!result.data?.csv) return;
    const blob = new Blob([result.data.csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `bestellungen_${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const statCards = [
    {
      label: "Gesamtumsatz",
      value: `€ ${(overview?.totalRevenue ?? 0).toFixed(2)}`,
      sub: `€ ${(overview?.recentRevenue ?? 0).toFixed(2)} (30 Tage)`,
      icon: <TrendingUp className="w-5 h-5" />,
      color: "text-emerald-400",
      bg: "bg-emerald-500/10",
    },
    {
      label: "Bestellungen",
      value: overview?.totalOrders ?? 0,
      sub: `${overview?.recentOrders ?? 0} (30 Tage)`,
      icon: <ShoppingCart className="w-5 h-5" />,
      color: "text-indigo-400",
      bg: "bg-indigo-500/10",
    },
    {
      label: "Produkte",
      value: overview?.totalProducts ?? 0,
      sub: "Aktive Produkte",
      icon: <Package className="w-5 h-5" />,
      color: "text-blue-400",
      bg: "bg-blue-500/10",
    },
    {
      label: "Kunden",
      value: overview?.totalCustomers ?? 0,
      sub: "Registrierte Kunden",
      icon: <Users className="w-5 h-5" />,
      color: "text-purple-400",
      bg: "bg-purple-500/10",
    },
    {
      label: "Besucher",
      value: overview?.totalVisitors ?? 0,
      sub: "Letzte 30 Tage",
      icon: <Eye className="w-5 h-5" />,
      color: "text-cyan-400",
      bg: "bg-cyan-500/10",
    },
    {
      label: "Conversion",
      value: `${overview?.conversionRate ?? "0.00"}%`,
      sub: "Besucher → Kauf",
      icon: <MousePointerClick className="w-5 h-5" />,
      color: "text-orange-400",
      bg: "bg-orange-500/10",
    },
  ];

  const tooltipStyle = {
    backgroundColor: "#1f2937",
    border: "1px solid rgba(255,255,255,0.1)",
    borderRadius: "8px",
    color: "#fff",
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-3">
            <BarChart3 className="w-7 h-7 text-indigo-400" />
            Dashboard
          </h1>
          <p className="text-white/50 text-sm mt-1">Übersicht über alle Kennzahlen</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={handleExport}
            className="flex items-center gap-2 px-3 py-2 text-sm bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors"
          >
            <Download className="w-4 h-4" /> CSV Export
          </button>
          <button
            onClick={() => refetch()}
            className="flex items-center gap-2 px-3 py-2 text-sm bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg transition-colors"
          >
            <RefreshCw className="w-4 h-4" /> Aktualisieren
          </button>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
        {statCards.map(card => (
          <div key={card.label} className="bg-white/5 border border-white/10 rounded-xl p-4 hover:bg-white/[0.07] transition-colors">
            <div className={`w-9 h-9 rounded-lg ${card.bg} flex items-center justify-center ${card.color} mb-3`}>
              {card.icon}
            </div>
            <p className="text-xs text-white/50 mb-1">{card.label}</p>
            <p className={`text-xl font-bold ${card.color}`}>{overviewLoading ? "..." : card.value}</p>
            <p className="text-xs text-white/30 mt-0.5">{card.sub}</p>
          </div>
        ))}
      </div>

      {/* Revenue Chart */}
      <div className="bg-white/5 border border-white/10 rounded-xl p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-white">Umsatz & Bestellungen</h2>
          <div className="flex gap-2">
            {[7, 14, 30, 90].map(d => (
              <button
                key={d}
                onClick={() => setRevenueDays(d)}
                className={`px-2.5 py-1 text-xs rounded-lg transition-colors ${revenueDays === d ? "bg-indigo-600 text-white" : "bg-white/10 text-white/60 hover:bg-white/20"}`}
              >
                {d}T
              </button>
            ))}
          </div>
        </div>
        <ResponsiveContainer width="100%" height={280}>
          <LineChart data={revenueData ?? []}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
            <XAxis dataKey="date" tick={{ fill: "rgba(255,255,255,0.4)", fontSize: 11 }} tickLine={false} axisLine={false} />
            <YAxis tick={{ fill: "rgba(255,255,255,0.4)", fontSize: 11 }} tickLine={false} axisLine={false} />
            <Tooltip contentStyle={tooltipStyle} />
            <Legend wrapperStyle={{ color: "rgba(255,255,255,0.6)", fontSize: 12 }} />
            <Line type="monotone" dataKey="revenue" name="Umsatz (€)" stroke="#6366f1" strokeWidth={2} dot={false} />
            <Line type="monotone" dataKey="orders" name="Bestellungen" stroke="#10b981" strokeWidth={2} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Visitor Chart */}
        <div className="bg-white/5 border border-white/10 rounded-xl p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-white">Besucher & Conversion</h2>
            <div className="flex gap-2">
              {[7, 30, 90].map(d => (
                <button
                  key={d}
                  onClick={() => setVisitorDays(d)}
                  className={`px-2.5 py-1 text-xs rounded-lg transition-colors ${visitorDays === d ? "bg-indigo-600 text-white" : "bg-white/10 text-white/60 hover:bg-white/20"}`}
                >
                  {d}T
                </button>
              ))}
            </div>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={visitorData ?? []}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="date" tick={{ fill: "rgba(255,255,255,0.4)", fontSize: 10 }} tickLine={false} axisLine={false} />
              <YAxis tick={{ fill: "rgba(255,255,255,0.4)", fontSize: 10 }} tickLine={false} axisLine={false} />
              <Tooltip contentStyle={tooltipStyle} />
              <Legend wrapperStyle={{ color: "rgba(255,255,255,0.6)", fontSize: 12 }} />
              <Bar dataKey="uniqueVisitors" name="Besucher" fill="#6366f1" radius={[4, 4, 0, 0]} />
              <Bar dataKey="orders" name="Bestellungen" fill="#10b981" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Top Products */}
        <div className="bg-white/5 border border-white/10 rounded-xl p-6">
          <h2 className="text-lg font-semibold text-white mb-6">Top Produkte</h2>
          <div className="space-y-3">
            {topProducts?.map((p, i) => (
              <div key={p.productId} className="flex items-center gap-4">
                <span className="w-6 h-6 rounded-full bg-indigo-500/20 text-indigo-400 text-xs font-bold flex items-center justify-center flex-shrink-0">
                  {i + 1}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-white/80 truncate">{p.productName}</p>
                  <div className="w-full h-1.5 bg-white/10 rounded-full mt-1.5 overflow-hidden">
                    <div
                      className="h-full bg-indigo-500 rounded-full"
                      style={{ width: `${Math.min(100, (p.totalSold / (topProducts[0]?.totalSold ?? 1)) * 100)}%` }}
                    />
                  </div>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-sm font-semibold text-white">{p.totalSold}×</p>
                  <p className="text-xs text-white/40">€ {p.totalRevenue.toFixed(2)}</p>
                </div>
              </div>
            ))}
            {(!topProducts || topProducts.length === 0) && (
              <p className="text-white/30 text-sm text-center py-4">Noch keine Verkäufe.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
