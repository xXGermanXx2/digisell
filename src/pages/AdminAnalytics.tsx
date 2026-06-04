import { useState } from "react";
import { trpc } from "@/providers/trpc";
import AdminLayout from "@/components/AdminLayout";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from "recharts";
import { TrendingUp, Users, ShoppingBag, DollarSign, Download } from "lucide-react";

export default function AdminAnalytics() {
  const [period, setPeriod] = useState("30d");
  const { data } = trpc.analytics.overview.useQuery({ period });
  const { data: revenue } = trpc.analytics.revenueChart.useQuery({ period });
  const { data: visitors } = trpc.analytics.visitorStats.useQuery({ period });

  const handleExport = () => {
    const csvData = (revenue?.data ?? []).map((d: any) => `${d.date},${d.revenue}`).join("\n");
    const blob = new Blob([`Datum,Umsatz\n${csvData}`], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = "analytics.csv"; a.click();
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <TrendingUp className="w-6 h-6 text-indigo-400" />
            <h1 className="text-xl font-bold text-[#F1F5F9]">Analytics</h1>
          </div>
          <div className="flex items-center gap-3">
            <Select value={period} onValueChange={setPeriod}>
              <SelectTrigger className="w-32 bg-[#0F172A] border-[#1E293B] text-[#F1F5F9]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-[#111827] border-[#1E293B]">
                <SelectItem value="7d">7 Tage</SelectItem>
                <SelectItem value="30d">30 Tage</SelectItem>
                <SelectItem value="90d">90 Tage</SelectItem>
                <SelectItem value="1y">1 Jahr</SelectItem>
              </SelectContent>
            </Select>
            <Button onClick={handleExport} variant="outline" className="border-[#1E293B] text-[#94A3B8]">
              <Download className="w-4 h-4 mr-2" /> CSV Export
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "Gesamtumsatz", value: `${Number(data?.totalRevenue ?? 0).toFixed(2)}€`, icon: DollarSign, color: "text-green-400" },
            { label: "Bestellungen", value: data?.totalOrders ?? 0, icon: ShoppingBag, color: "text-blue-400" },
            { label: "Neue Nutzer", value: data?.newUsers ?? 0, icon: Users, color: "text-purple-400" },
            { label: "Conversion", value: `${Number(data?.conversionRate ?? 0).toFixed(1)}%`, icon: TrendingUp, color: "text-yellow-400" },
          ].map(({ label, value, icon: Icon, color }) => (
            <div key={label} className="bg-[#111827] rounded-xl border border-[#1E293B] p-4">
              <div className="flex items-center gap-2 mb-2">
                <Icon className={`w-4 h-4 ${color}`} />
                <span className="text-sm text-[#64748B]">{label}</span>
              </div>
              <p className="text-2xl font-bold text-[#F1F5F9]">{value}</p>
            </div>
          ))}
        </div>

        {/* Revenue Chart */}
        <div className="bg-[#111827] rounded-xl border border-[#1E293B] p-5">
          <h2 className="text-base font-semibold text-[#F1F5F9] mb-4">Umsatz-Verlauf</h2>
          <ResponsiveContainer width="100%" height={250}>
            <AreaChart data={revenue?.data ?? []}>
              <defs>
                <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6366F1" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#6366F1" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" />
              <XAxis dataKey="date" tick={{ fill: "#64748B", fontSize: 11 }} />
              <YAxis tick={{ fill: "#64748B", fontSize: 11 }} />
              <Tooltip contentStyle={{ backgroundColor: "#111827", border: "1px solid #1E293B", borderRadius: "8px", color: "#F1F5F9" }} />
              <Area type="monotone" dataKey="revenue" stroke="#6366F1" fill="url(#revenueGrad)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Visitor Chart */}
        <div className="bg-[#111827] rounded-xl border border-[#1E293B] p-5">
          <h2 className="text-base font-semibold text-[#F1F5F9] mb-4">Besucher</h2>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={visitors?.data ?? []}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" />
              <XAxis dataKey="date" tick={{ fill: "#64748B", fontSize: 11 }} />
              <YAxis tick={{ fill: "#64748B", fontSize: 11 }} />
              <Tooltip contentStyle={{ backgroundColor: "#111827", border: "1px solid #1E293B", borderRadius: "8px", color: "#F1F5F9" }} />
              <Bar dataKey="visitors" fill="#8B5CF6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </AdminLayout>
  );
}
