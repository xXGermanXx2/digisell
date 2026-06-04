import { useState } from "react";
import { trpc } from "@/providers/trpc";
import AdminLayout from "@/components/AdminLayout";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  BarChart3,
  TrendingUp,
  DollarSign,
  ShoppingCart,
  Loader2,
} from "lucide-react";

export default function AdminAnalytics() {
  const [days, setDays] = useState("30");
  const { data: dashboard, isLoading: dashLoading } = trpc.analytics.dashboard.useQuery();
  const { data: revenue, isLoading: revLoading } = trpc.analytics.revenue.useQuery({ days: parseInt(days) });
  const { data: topProducts } = trpc.analytics.topProducts.useQuery({ limit: 10 });

  const totalRevenue = revenue?.reduce((sum, d) => sum + d.revenue, 0) ?? 0;
  const totalOrders = revenue?.reduce((sum, d) => sum + d.orders, 0) ?? 0;

  // Simple bar chart from revenue data
  const maxRevenue = Math.max(...(revenue?.map((d) => d.revenue) ?? [1]), 1);

  return (
    <AdminLayout>
      <div className="space-y-6 animate-fade-in">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-[#F1F5F9]">Analytics</h1>
            <p className="text-sm text-[#94A3B8] mt-1">Detaillierte Verkaufsstatistiken</p>
          </div>
          <Select value={days} onValueChange={setDays}>
            <SelectTrigger className="w-36 bg-[#111827] border-[#2D3748] text-[#F1F5F9]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-[#1E293B] border-[#2D3748]">
              <SelectItem value="7" className="text-[#F1F5F9]">7 Tage</SelectItem>
              <SelectItem value="30" className="text-[#F1F5F9]">30 Tage</SelectItem>
              <SelectItem value="90" className="text-[#F1F5F9]">90 Tage</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          {dashLoading
            ? Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="bg-[#111827] rounded-xl card-shadow p-5">
                  <Skeleton className="w-10 h-10 rounded-lg mb-4 bg-[#1A2235]" />
                  <Skeleton className="w-24 h-8 mb-2 bg-[#1A2235]" />
                  <Skeleton className="w-16 h-4 bg-[#1A2235]" />
                </div>
              ))
            : [
                { label: "Gesamtumsatz", value: `\u20ac${dashboard?.totalRevenue.toLocaleString("de-DE", { minimumFractionDigits: 2 })}`, icon: DollarSign, color: "#6366F1" },
                { label: "Umsatz (${days} Tage)", value: `\u20ac${totalRevenue.toLocaleString("de-DE", { minimumFractionDigits: 2 })}`, icon: TrendingUp, color: "#8B5CF6" },
                { label: "Bestellungen (${days} Tage)", value: totalOrders.toString(), icon: ShoppingCart, color: "#22C55E" },
                { label: "\u00d8 pro Tag", value: `\u20ac${(totalRevenue / Math.max(parseInt(days), 1)).toFixed(2)}`, icon: BarChart3, color: "#F59E0B" },
              ].map((stat) => {
                const Icon = stat.icon;
                return (
                  <div key={stat.label} className="bg-[#111827] rounded-xl card-shadow p-5">
                    <div className="w-10 h-10 rounded-lg flex items-center justify-center mb-4" style={{ backgroundColor: `${stat.color}15` }}>
                      <Icon className="w-5 h-5" style={{ color: stat.color }} />
                    </div>
                    <p className="text-2xl font-bold text-[#F1F5F9] mb-1">{stat.value}</p>
                    <p className="text-xs text-[#94A3B8]">{stat.label}</p>
                  </div>
                );
              })}
        </div>

        {/* Revenue Chart */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          <div className="bg-[#111827] rounded-xl card-shadow p-6">
            <h2 className="text-base font-semibold text-[#F1F5F9] mb-6">Umsatzverlauf ({days} Tage)</h2>
            {revLoading ? (
              <div className="flex items-center justify-center h-64">
                <Loader2 className="w-6 h-6 text-[#6366F1] animate-spin" />
              </div>
            ) : revenue && revenue.length > 0 ? (
              <div className="space-y-2">
                {revenue.map((day) => (
                  <div key={day.date} className="flex items-center gap-3">
                    <span className="text-xs text-[#64748B] w-20 shrink-0">{new Date(day.date).toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit" })}</span>
                    <div className="flex-1 h-6 bg-[#1A2235] rounded-md overflow-hidden">
                      <div
                        className="h-full rounded-md transition-all duration-500"
                        style={{
                          width: `${Math.max((day.revenue / maxRevenue) * 100, 2)}%`,
                          background: "linear-gradient(90deg, #6366F1, #8B5CF6)",
                        }}
                      />
                    </div>
                    <span className="text-xs text-[#F1F5F9] w-16 text-right">\u20ac{day.revenue.toFixed(2)}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex items-center justify-center h-64 text-sm text-[#64748B]">Keine Daten verfügbar</div>
            )}
          </div>

          {/* Top Products */}
          <div className="bg-[#111827] rounded-xl card-shadow p-6">
            <h2 className="text-base font-semibold text-[#F1F5F9] mb-6">Top Produkte</h2>
            {topProducts && topProducts.length > 0 ? (
              <div className="space-y-3">
                {topProducts.map((product, index) => (
                  <div key={product.productId} className="flex items-center gap-3">
                    <span className="text-xs font-bold text-[#64748B] w-5">#{index + 1}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-[#F1F5F9] truncate">{product.productName}</p>
                      <p className="text-xs text-[#64748B]">{product.totalSold} verkauft</p>
                    </div>
                    <div className="w-24 bg-[#1A2235] rounded-md overflow-hidden h-5">
                      <div
                        className="h-full rounded-md"
                        style={{
                          width: `${Math.max((product.totalSold / (topProducts[0]?.totalSold ?? 1)) * 100, 5)}%`,
                          background: "linear-gradient(90deg, #6366F1, #8B5CF6)",
                        }}
                      />
                    </div>
                    <span className="text-xs text-[#6366F1] w-16 text-right">\u20ac{product.totalRevenue.toFixed(2)}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex items-center justify-center h-64 text-sm text-[#64748B]">Keine Daten verfügbar</div>
            )}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
