import { trpc } from "@/providers/trpc";
import AdminLayout from "@/components/AdminLayout";
import { Loader2, Users } from "lucide-react";

export default function AdminCustomers() {
  const { data: ordersData } = trpc.order.list.useQuery({ status: "all", limit: 100 });
  const { data: settings } = trpc.settings.get.useQuery();

  const customers = ordersData?.items?.reduce((acc: any[], order) => {
    const existing = acc.find((c) => c.email === order.customerEmail);
    if (existing) {
      existing.orders += 1;
      existing.total += parseFloat(order.total);
    } else {
      acc.push({
        email: order.customerEmail,
        name: order.customerName ?? order.customerEmail.split("@")[0],
        orders: 1,
        total: parseFloat(order.total),
        createdAt: order.createdAt,
      });
    }
    return acc;
  }, [] as any[]) ?? [];

  return (
    <AdminLayout>
      <div className="space-y-6 animate-fade-in">
        <div>
          <h1 className="text-2xl font-bold text-[#F1F5F9]">Kunden</h1>
          <p className="text-sm text-[#94A3B8] mt-1">\u00dcbersicht aller Kunden</p>
        </div>

        <div className="bg-[#111827] rounded-xl card-shadow overflow-hidden">
          {ordersData === undefined ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-6 h-6 text-[#6366F1] animate-spin" />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-[#1A2235]">
                    <th className="text-left text-xs font-medium text-[#64748B] uppercase tracking-wider px-6 py-3">Kunde</th>
                    <th className="text-left text-xs font-medium text-[#64748B] uppercase tracking-wider px-6 py-3">E-Mail</th>
                    <th className="text-left text-xs font-medium text-[#64748B] uppercase tracking-wider px-6 py-3">Bestellungen</th>
                    <th className="text-left text-xs font-medium text-[#64748B] uppercase tracking-wider px-6 py-3">Gesamtumsatz</th>
                    <th className="text-left text-xs font-medium text-[#64748B] uppercase tracking-wider px-6 py-3">Erste Bestellung</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1E293B]">
                  {customers.map((customer, idx) => (
                    <tr key={idx} className="hover:bg-[#1A2235]/30 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-violet-500 flex items-center justify-center text-white text-xs font-bold">
                            {customer.name[0]?.toUpperCase()}
                          </div>
                          <span className="text-sm font-medium text-[#F1F5F9]">{customer.name}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-[#94A3B8]">{customer.email}</td>
                      <td className="px-6 py-4 text-sm text-[#94A3B8]">{customer.orders}</td>
                      <td className="px-6 py-4 text-sm font-semibold text-[#6366F1]">{customer.total.toFixed(2)} {settings?.currency ?? "EUR"}</td>
                      <td className="px-6 py-4 text-sm text-[#64748B]">{new Date(customer.createdAt).toLocaleDateString("de-DE")}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {customers.length === 0 && (
                <div className="text-center py-12">
                  <Users className="w-10 h-10 text-[#64748B] mx-auto mb-3" />
                  <p className="text-sm text-[#64748B]">Noch keine Kunden vorhanden</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}
