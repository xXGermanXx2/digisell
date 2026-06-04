import { trpc } from "@/providers/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { TrendingUp, Package, ShoppingCart, Users, DollarSign } from "lucide-react";

export default function SellerPanel() {
  const { data: stats } = trpc.admin.myShopStats.useQuery();
  const { data: orders } = trpc.admin.myOrders.useQuery({ limit: 10 });
  const { data: customers } = trpc.admin.myCustomers.useQuery({ limit: 10 });
  const { data: chart } = trpc.admin.myRevenueChart.useQuery({ days: 30 });

  const statusColor: Record<string, string> = {
    completed: "bg-green-500/20 text-green-400",
    pending: "bg-yellow-500/20 text-yellow-400",
    cancelled: "bg-red-500/20 text-red-400",
    refunded: "bg-gray-500/20 text-gray-400",
  };

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Mein Verkäufer-Panel</h1>
        <p className="text-gray-400 text-sm mt-1">Übersicht deiner Shop-Aktivitäten</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Produkte", value: stats?.products ?? 0, icon: Package, color: "text-blue-400" },
          { label: "Bestellungen", value: stats?.orders ?? 0, icon: ShoppingCart, color: "text-green-400" },
          { label: "Kunden", value: stats?.customers ?? 0, icon: Users, color: "text-purple-400" },
          { label: "Umsatz (Monat)", value: `€${(stats?.revenueMonth ?? 0).toFixed(2)}`, icon: DollarSign, color: "text-yellow-400" },
        ].map(s => (
          <Card key={s.label} className="bg-gray-900 border-gray-800">
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-xs">{s.label}</p>
                  <p className="text-2xl font-bold text-white mt-1">{s.value}</p>
                </div>
                <s.icon className={`w-8 h-8 ${s.color} opacity-80`} />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Umsatz-Chart */}
      <Card className="bg-gray-900 border-gray-800">
        <CardHeader><CardTitle className="text-white text-sm">Umsatz (letzte 30 Tage)</CardTitle></CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={chart ?? []}>
              <defs>
                <linearGradient id="sellerRevGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis dataKey="date" stroke="#6b7280" tick={{ fontSize: 11 }} />
              <YAxis stroke="#6b7280" tick={{ fontSize: 11 }} />
              <Tooltip contentStyle={{ backgroundColor: "#1f2937", border: "1px solid #374151", borderRadius: "8px" }} />
              <Area type="monotone" dataKey="revenue" stroke="#8b5cf6" fill="url(#sellerRevGrad)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Letzte Bestellungen */}
        <Card className="bg-gray-900 border-gray-800">
          <CardHeader><CardTitle className="text-white text-sm">Letzte Bestellungen</CardTitle></CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow className="border-gray-800">
                  <TableHead className="text-gray-400 text-xs">Bestellung</TableHead>
                  <TableHead className="text-gray-400 text-xs">Betrag</TableHead>
                  <TableHead className="text-gray-400 text-xs">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {orders?.items.slice(0, 5).map(o => (
                  <TableRow key={o.id} className="border-gray-800">
                    <TableCell className="text-white text-xs">{o.orderNumber}</TableCell>
                    <TableCell className="text-gray-300 text-xs">€{Number(o.total).toFixed(2)}</TableCell>
                    <TableCell>
                      <span className={`px-1.5 py-0.5 rounded text-xs ${statusColor[o.status] ?? ""}`}>{o.status}</span>
                    </TableCell>
                  </TableRow>
                ))}
                {(!orders?.items || orders.items.length === 0) && (
                  <TableRow><TableCell colSpan={3} className="text-center text-gray-400 py-4 text-xs">Keine Bestellungen</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Kunden */}
        <Card className="bg-gray-900 border-gray-800">
          <CardHeader><CardTitle className="text-white text-sm">Meine Kunden</CardTitle></CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow className="border-gray-800">
                  <TableHead className="text-gray-400 text-xs">Name</TableHead>
                  <TableHead className="text-gray-400 text-xs">E-Mail</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {customers?.items.slice(0, 5).map(c => (
                  <TableRow key={c.id} className="border-gray-800">
                    <TableCell className="text-white text-xs">{c.name}</TableCell>
                    <TableCell className="text-gray-400 text-xs">{c.email}</TableCell>
                  </TableRow>
                ))}
                {(!customers?.items || customers.items.length === 0) && (
                  <TableRow><TableCell colSpan={2} className="text-center text-gray-400 py-4 text-xs">Keine Kunden</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
