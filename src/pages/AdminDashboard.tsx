import { trpc } from "@/providers/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Users, ShoppingBag, Package, Ticket, TrendingUp,
  DollarSign, Server, RefreshCw, ArrowUpRight, ArrowDownRight,
} from "lucide-react";
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer,
} from "recharts";
import { useState } from "react";
import { Link } from "react-router";
import AdminLayout from "@/components/AdminLayout";

function StatCard({ title, value, sub, icon: Icon, color = "blue" }: {
  title: string; value: string | number; sub?: string; icon: any; color?: string;
}) {
  const colors: Record<string, string> = {
    blue: "text-blue-400 bg-blue-500/10",
    green: "text-green-400 bg-green-500/10",
    purple: "text-purple-400 bg-purple-500/10",
    orange: "text-orange-400 bg-orange-500/10",
    red: "text-red-400 bg-red-500/10",
  };
  return (
    <div className="bg-[#111827] rounded-xl p-5 border border-[#1E293B]">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-[#94A3B8]">{title}</p>
          <p className="text-2xl font-bold text-[#F1F5F9] mt-1">{value}</p>
          {sub && <p className="text-xs text-[#64748B] mt-1">{sub}</p>}
        </div>
        <div className={`p-3 rounded-lg ${colors[color]}`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>
    </div>
  );
}

function formatCurrency(val: number) {
  return new Intl.NumberFormat("de-DE", { style: "currency", currency: "EUR" }).format(val);
}

function formatDate(d: string | Date | null | undefined) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit", year: "2-digit", hour: "2-digit", minute: "2-digit" });
}

const statusColors: Record<string, string> = {
  completed: "bg-green-500/20 text-green-400",
  pending: "bg-yellow-500/20 text-yellow-400",
  processing: "bg-blue-500/20 text-blue-400",
  cancelled: "bg-red-500/20 text-red-400",
  refunded: "bg-purple-500/20 text-purple-400",
};

export default function AdminDashboard() {
  const [chartDays, setChartDays] = useState(30);
  const { data: stats, isLoading, refetch } = trpc.admin.dashboardStats.useQuery();
  const { data: revenueChart } = trpc.admin.revenueChart.useQuery({ days: chartDays });
  const { data: userChart } = trpc.admin.userGrowthChart.useQuery({ days: chartDays });

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-96">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#6366F1]" />
        </div>
      </AdminLayout>
    );
  }

  const s = stats?.stats;

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-[#F1F5F9]">Admin Dashboard</h1>
            <p className="text-[#94A3B8] text-sm mt-1">Plattformübersicht in Echtzeit</p>
          </div>
          <Button variant="outline" size="sm" onClick={() => refetch()} className="border-[#1E293B] text-[#94A3B8]">
            <RefreshCw className="w-4 h-4 mr-2" /> Aktualisieren
          </Button>
        </div>

        {/* Revenue Stats */}
        <div>
          <p className="text-xs font-medium text-[#64748B] uppercase tracking-wider mb-3">Umsatz</p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard title="Gesamtumsatz" value={formatCurrency(s?.revenueTotal ?? 0)} icon={DollarSign} color="green" />
            <StatCard title="Heute" value={formatCurrency(s?.revenueToday ?? 0)} sub={`${s?.todayOrders ?? 0} Bestellungen`} icon={TrendingUp} color="blue" />
            <StatCard title="Diese Woche" value={formatCurrency(s?.revenueWeek ?? 0)} sub={`${s?.weekOrders ?? 0} Bestellungen`} icon={TrendingUp} color="purple" />
            <StatCard title="Dieser Monat" value={formatCurrency(s?.revenueMonth ?? 0)} sub={`${s?.monthOrders ?? 0} Bestellungen`} icon={TrendingUp} color="orange" />
          </div>
        </div>

        {/* Platform Stats */}
        <div>
          <p className="text-xs font-medium text-[#64748B] uppercase tracking-wider mb-3">Plattform</p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard title="Nutzer gesamt" value={s?.totalUsers ?? 0} sub={`${s?.activeUsers ?? 0} aktiv`} icon={Users} color="blue" />
            <StatCard title="Produkte" value={s?.totalProducts ?? 0} icon={Package} color="purple" />
            <StatCard title="Bestellungen" value={s?.totalOrders ?? 0} icon={ShoppingBag} color="orange" />
            <StatCard title="Tickets" value={s?.totalTickets ?? 0} icon={Ticket} color="red" />
          </div>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-[#111827] rounded-xl border border-[#1E293B] p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-semibold text-[#F1F5F9]">Umsatzverlauf</h2>
              <div className="flex gap-1">
                {[7, 30, 90].map(d => (
                  <button key={d}
                    className={`px-2 py-1 rounded text-xs font-medium transition-colors ${chartDays === d ? "bg-[#6366F1] text-white" : "text-[#64748B] hover:text-[#F1F5F9]"}`}
                    onClick={() => setChartDays(d)}>
                    {d}T
                  </button>
                ))}
              </div>
            </div>
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={revenueChart ?? []}>
                <defs>
                  <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366F1" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#6366F1" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" />
                <XAxis dataKey="date" stroke="#64748B" tick={{ fontSize: 11 }} />
                <YAxis stroke="#64748B" tick={{ fontSize: 11 }} tickFormatter={v => `${v}€`} />
                <Tooltip contentStyle={{ backgroundColor: "#111827", border: "1px solid #1E293B", borderRadius: "8px" }} labelStyle={{ color: "#F1F5F9" }} formatter={(v: any) => [`${Number(v).toFixed(2)}€`, "Umsatz"]} />
                <Area type="monotone" dataKey="revenue" stroke="#6366F1" fill="url(#revGrad)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-[#111827] rounded-xl border border-[#1E293B] p-5">
            <h2 className="text-base font-semibold text-[#F1F5F9] mb-4">Nutzerwachstum</h2>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={userChart ?? []}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" />
                <XAxis dataKey="date" stroke="#64748B" tick={{ fontSize: 11 }} />
                <YAxis stroke="#64748B" tick={{ fontSize: 11 }} />
                <Tooltip contentStyle={{ backgroundColor: "#111827", border: "1px solid #1E293B", borderRadius: "8px" }} labelStyle={{ color: "#F1F5F9" }} formatter={(v: any) => [v, "Neue Nutzer"]} />
                <Bar dataKey="count" fill="#8B5CF6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Last Orders */}
          <div className="bg-[#111827] rounded-xl border border-[#1E293B] overflow-hidden">
            <div className="px-5 py-4 border-b border-[#1E293B] flex items-center justify-between">
              <h2 className="text-sm font-semibold text-[#F1F5F9]">Letzte Bestellungen</h2>
              <Link to="/admin/orders" className="text-xs text-[#6366F1] hover:underline">Alle →</Link>
            </div>
            <div className="divide-y divide-[#1E293B]">
              {(stats?.lastOrders ?? []).map((o: any) => (
                <div key={o.id} className="px-5 py-3 flex items-center justify-between">
                  <div>
                    <p className="text-sm text-[#F1F5F9] font-medium">{o.orderNumber}</p>
                    <p className="text-xs text-[#64748B]">{o.customer?.name ?? o.customer?.email ?? "Gast"}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-[#F1F5F9]">{formatCurrency(Number(o.total))}</p>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${statusColors[o.status] ?? "bg-gray-700 text-gray-300"}`}>{o.status}</span>
                  </div>
                </div>
              ))}
              {!(stats?.lastOrders?.length) && <p className="text-[#64748B] text-sm text-center py-6">Keine Bestellungen</p>}
            </div>
          </div>

          {/* Last Payments */}
          <div className="bg-[#111827] rounded-xl border border-[#1E293B] overflow-hidden">
            <div className="px-5 py-4 border-b border-[#1E293B] flex items-center justify-between">
              <h2 className="text-sm font-semibold text-[#F1F5F9]">Letzte Zahlungen</h2>
              <Link to="/admin/payments" className="text-xs text-[#6366F1] hover:underline">Alle →</Link>
            </div>
            <div className="divide-y divide-[#1E293B]">
              {(stats?.lastPayments ?? []).map((p: any) => (
                <div key={p.id} className="px-5 py-3 flex items-center justify-between">
                  <div>
                    <p className="text-sm text-[#F1F5F9] font-medium capitalize">{p.provider}</p>
                    <p className="text-xs text-[#64748B]">{formatDate(p.createdAt)}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-[#F1F5F9]">{formatCurrency(Number(p.amount ?? 0))}</p>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${p.status === "success" ? "bg-green-500/20 text-green-400" : p.status === "failed" ? "bg-red-500/20 text-red-400" : "bg-yellow-500/20 text-yellow-400"}`}>{p.status}</span>
                  </div>
                </div>
              ))}
              {!(stats?.lastPayments?.length) && <p className="text-[#64748B] text-sm text-center py-6">Keine Zahlungen</p>}
            </div>
          </div>

          {/* Last Registrations */}
          <div className="bg-[#111827] rounded-xl border border-[#1E293B] overflow-hidden">
            <div className="px-5 py-4 border-b border-[#1E293B] flex items-center justify-between">
              <h2 className="text-sm font-semibold text-[#F1F5F9]">Neue Registrierungen</h2>
              <Link to="/admin/users" className="text-xs text-[#6366F1] hover:underline">Alle →</Link>
            </div>
            <div className="divide-y divide-[#1E293B]">
              {(stats?.lastRegistrations ?? []).map((u: any) => (
                <div key={u.id} className="px-5 py-3 flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#6366F1] to-[#8B5CF6] flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                    {(u.name ?? u.email ?? "?")[0].toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-[#F1F5F9] truncate">{u.name ?? u.email}</p>
                    <p className="text-xs text-[#64748B]">{formatDate(u.createdAt)}</p>
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${u.role === "admin" ? "bg-red-500/20 text-red-400" : u.role === "seller" ? "bg-blue-500/20 text-blue-400" : "bg-gray-700 text-gray-300"}`}>{u.role}</span>
                </div>
              ))}
              {!(stats?.lastRegistrations?.length) && <p className="text-[#64748B] text-sm text-center py-6">Keine Registrierungen</p>}
            </div>
          </div>
        </div>

        {/* System Status */}
        <div className="bg-[#111827] rounded-xl border border-[#1E293B] p-5">
          <h2 className="text-sm font-semibold text-[#F1F5F9] flex items-center gap-2 mb-4">
            <Server className="w-4 h-4 text-green-400" /> Systemstatus
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <p className="text-xs text-[#64748B]">Status</p>
              <div className="flex items-center gap-2 mt-1">
                <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                <span className="text-sm text-green-400 font-medium">Online</span>
              </div>
            </div>
            <div>
              <p className="text-xs text-[#64748B]">Node.js</p>
              <p className="text-sm text-[#F1F5F9] mt-1">{stats?.system?.nodeVersion ?? "—"}</p>
            </div>
            <div>
              <p className="text-xs text-[#64748B]">Uptime</p>
              <p className="text-sm text-[#F1F5F9] mt-1">
                {stats?.system?.uptime ? `${Math.floor(stats.system.uptime / 3600)}h ${Math.floor((stats.system.uptime % 3600) / 60)}m` : "—"}
              </p>
            </div>
            <div>
              <p className="text-xs text-[#64748B]">Speicher</p>
              <p className="text-sm text-[#F1F5F9] mt-1">
                {stats?.system?.memoryUsage ? `${Math.round((stats.system.memoryUsage as any).rss / 1024 / 1024)} MB` : "—"}
              </p>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
