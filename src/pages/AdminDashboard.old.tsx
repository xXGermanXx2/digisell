import { trpc } from "@/providers/trpc";
import AdminLayout from "@/components/AdminLayout";
import { Skeleton } from "@/components/ui/skeleton";
import {
  TrendingUp,
  DollarSign,
  ShoppingCart,
  Package,
  Users,
  ArrowUpRight,
  ArrowDownRight,
  Settings,
} from "lucide-react";

export default function AdminDashboard() {
  const { data: dashboard, isLoading: dashboardLoading } = trpc.analytics.dashboard.useQuery();
  const { data: recentOrders } = trpc.order.list.useQuery({ status: "all", limit: 5 });
  const { data: topProducts } = trpc.analytics.topProducts.useQuery({ limit: 5 });

  const stats = [
    {
      label: "Gesamtumsatz",
      value: dashboard ? `\u20ac${dashboard.totalRevenue.toLocaleString("de-DE", { minimumFractionDigits: 2 })}` : "\u20ac0,00",
      change: "+12%",
      up: true,
      icon: DollarSign,
      color: "#6366F1",
    },
    {
      label: "Bestellungen",
      value: dashboard?.totalOrders?.toString() ?? "0",
      change: "+8%",
      up: true,
      icon: ShoppingCart,
      color: "#8B5CF6",
    },
    {
      label: "Aktive Produkte",
      value: dashboard?.totalProducts?.toString() ?? "0",
      change: "+3",
      up: true,
      icon: Package,
      color: "#22C55E",
    },
    {
      label: "Kunden",
      value: dashboard?.totalCustomers?.toString() ?? "0",
      change: "+15%",
      up: true,
      icon: Users,
      color: "#F59E0B",
    },
  ];

  return (
    <AdminLayout>
      <div className="space-y-6 animate-fade-in">
        <div>
          <h1 className="text-2xl font-bold text-[#F1F5F9]">Dashboard</h1>
          <p className="text-sm text-[#94A3B8] mt-1">\u00dcbersicht deines Shops</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          {dashboardLoading
            ? Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="bg-[#111827] rounded-xl card-shadow p-5">
                  <Skeleton className="w-10 h-10 rounded-lg mb-4 bg-[#1A2235]" />
                  <Skeleton className="w-24 h-8 mb-2 bg-[#1A2235]" />
                  <Skeleton className="w-16 h-4 bg-[#1A2235]" />
                </div>
              ))
            : stats.map((stat) => {
                const Icon = stat.icon;
                return (
                  <div
                    key={stat.label}
                    className="bg-[#111827] rounded-xl card-shadow p-5 hover:-translate-y-0.5 hover:shadow-lg transition-all duration-200"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div
                        className="w-10 h-10 rounded-lg flex items-center justify-center"
                        style={{ backgroundColor: `${stat.color}15` }}
                      >
                        <Icon className="w-5 h-5" style={{ color: stat.color }} />
                      </div>
                      <span
                        className={`flex items-center gap-0.5 text-xs font-medium ${
                          stat.up ? "text-[#22C55E]" : "text-[#EF4444]"
                        }`}
                      >
                        {stat.up ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                        {stat.change}
                      </span>
                    </div>
                    <p className="text-2xl font-bold text-[#F1F5F9] mb-1">{stat.value}</p>
                    <p className="text-xs text-[#94A3B8]">{stat.label}</p>
                  </div>
                );
              })}
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          <div className="bg-[#111827] rounded-xl card-shadow overflow-hidden">
            <div className="px-6 py-4 border-b border-[#1E293B] flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
              <h2 className="text-base font-semibold text-[#F1F5F9]">Neueste Bestellungen</h2>
              <span className="text-xs text-[#64748B]">Letzte 5</span>
            </div>
            <div className="divide-y divide-[#1E293B]">
              {recentOrders?.items?.map((order) => (
                <div key={order.id} className="px-6 py-4 flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 hover:bg-[#1A2235]/30 transition-colors">
                  <div>
                    <p className="text-sm font-medium text-[#F1F5F9]">{order.orderNumber}</p>
                    <p className="text-xs text-[#64748B]">{order.customerEmail}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-[#6366F1]">{order.total} &euro;</p>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full ${
                      order.status === "completed" ? "bg-[#22C55E]/10 text-[#22C55E]" :
                      order.status === "paid" ? "bg-[#3B82F6]/10 text-[#3B82F6]" :
                      order.status === "pending" ? "bg-[#F59E0B]/10 text-[#F59E0B]" :
                      "bg-[#EF4444]/10 text-[#EF4444]"
                    }`}>
                      {order.status}
                    </span>
                  </div>
                </div>
              ))}
              {(!recentOrders?.items || recentOrders.items.length === 0) && (
                <div className="px-6 py-8 text-center text-sm text-[#64748B]">Keine Bestellungen vorhanden</div>
              )}
            </div>
          </div>

          <div className="bg-[#111827] rounded-xl card-shadow overflow-hidden">
            <div className="px-6 py-4 border-b border-[#1E293B] flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
              <h2 className="text-base font-semibold text-[#F1F5F9]">Top Produkte</h2>
              <span className="text-xs text-[#64748B]">Nach Verk\u00e4ufen</span>
            </div>
            <div className="divide-y divide-[#1E293B]">
              {topProducts?.map((product, index) => (
                <div key={product.productId} className="px-6 py-4 flex items-center gap-4 hover:bg-[#1A2235]/30 transition-colors">
                  <span className="w-6 text-sm font-bold text-[#64748B]">#{index + 1}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-[#F1F5F9] truncate">{product.productName}</p>
                    <p className="text-xs text-[#64748B]">{product.totalSold} verkauft</p>
                  </div>
                  <p className="text-sm font-semibold text-[#6366F1]">\u20ac{product.totalRevenue.toFixed(2)}</p>
                </div>
              ))}
              {(!topProducts || topProducts.length === 0) && (
                <div className="px-6 py-8 text-center text-sm text-[#64748B]">Keine Daten vorhanden</div>
              )}
            </div>
          </div>
        </div>

        <div className="bg-[#111827] rounded-xl card-shadow p-6">
          <h2 className="text-base font-semibold text-[#F1F5F9] mb-4">Schnellaktionen</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: "Produkt erstellen", path: "/admin/products", icon: Package, color: "#6366F1" },
              { label: "Bestellungen", path: "/admin/orders", icon: ShoppingCart, color: "#8B5CF6" },
              { label: "Analytics", path: "/admin/analytics", icon: TrendingUp, color: "#22C55E" },
              { label: "Einstellungen", path: "/admin/settings", icon: Settings, color: "#F59E0B" },
            ].map((action) => {
              const Icon = action.icon;
              return (
                <a
                  key={action.path}
                  href={action.path}
                  className="flex flex-col items-center gap-2 p-4 rounded-lg bg-[#1A2235] border border-[#2D3748] hover:border-[#2D3748] hover:bg-[#1A2235] transition-all group"
                  onClick={(e) => {
                    e.preventDefault();
                    window.location.href = action.path;
                  }}
                >
                  <Icon className="w-5 h-5" style={{ color: action.color }} />
                  <span className="text-xs font-medium text-[#94A3B8] group-hover:text-[#F1F5F9] text-center">{action.label}</span>
                </a>
              );
            })}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
