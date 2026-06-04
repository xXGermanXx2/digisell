import { useState } from "react";
import { trpc } from "@/providers/trpc";
import AdminLayout from "@/components/AdminLayout";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Loader2,
  ShoppingBag,
  RefreshCw,
} from "lucide-react";
import { toast } from "sonner";

export default function AdminOrders() {
  const [statusFilter, setStatusFilter] = useState("all");
  const utils = trpc.useUtils();

  const { data: ordersData, isLoading } = trpc.order.list.useQuery({
    status: statusFilter as any,
    limit: 50,
  });

  const updateStatus = trpc.order.updateStatus.useMutation({
    onSuccess: () => {
      utils.order.list.invalidate();
      toast.success("Status aktualisiert");
    },
  });
  const refundOrder = trpc.order.refund.useMutation({
    onSuccess: () => {
      utils.order.list.invalidate();
      toast.success("Bestellung erstattet");
    },
  });

  return (
    <AdminLayout>
      <div className="space-y-6 animate-fade-in">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-[#F1F5F9]">Bestellungen</h1>
            <p className="text-sm text-[#94A3B8] mt-1">Verwalte alle Bestellungen</p>
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-44 bg-[#111827] border-[#2D3748] text-[#F1F5F9]">
              <SelectValue placeholder="Status-Filter" />
            </SelectTrigger>
            <SelectContent className="bg-[#1E293B] border-[#2D3748]">
              <SelectItem value="all" className="text-[#F1F5F9]">Alle Status</SelectItem>
              <SelectItem value="pending" className="text-[#F1F5F9]">Ausstehend</SelectItem>
              <SelectItem value="paid" className="text-[#F1F5F9]">Bezahlt</SelectItem>
              <SelectItem value="completed" className="text-[#F1F5F9]">Abgeschlossen</SelectItem>
              <SelectItem value="cancelled" className="text-[#F1F5F9]">Storniert</SelectItem>
              <SelectItem value="refunded" className="text-[#F1F5F9]">Erstattet</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="bg-[#111827] rounded-xl card-shadow overflow-hidden">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-6 h-6 text-[#6366F1] animate-spin" />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-[#1A2235]">
                    <th className="text-left text-xs font-medium text-[#64748B] uppercase tracking-wider px-6 py-3">Bestellnr.</th>
                    <th className="text-left text-xs font-medium text-[#64748B] uppercase tracking-wider px-6 py-3">Kunde</th>
                    <th className="text-left text-xs font-medium text-[#64748B] uppercase tracking-wider px-6 py-3">Produkte</th>
                    <th className="text-left text-xs font-medium text-[#64748B] uppercase tracking-wider px-6 py-3">Betrag</th>
                    <th className="text-left text-xs font-medium text-[#64748B] uppercase tracking-wider px-6 py-3">Methode</th>
                    <th className="text-left text-xs font-medium text-[#64748B] uppercase tracking-wider px-6 py-3">Status</th>
                    <th className="text-right text-xs font-medium text-[#64748B] uppercase tracking-wider px-6 py-3">Aktionen</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1E293B]">
                  {ordersData?.items?.map((order) => (
                    <tr key={order.id} className="hover:bg-[#1A2235]/30 transition-colors">
                      <td className="px-6 py-4 text-sm font-medium text-[#F1F5F9]">{order.orderNumber}</td>
                      <td className="px-6 py-4">
                        <div>
                          <p className="text-sm text-[#F1F5F9]">{order.customerName ?? "Gast"}</p>
                          <p className="text-xs text-[#64748B]">{order.customerEmail}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-[#94A3B8]">{order.items?.length ?? 0} Artikel</td>
                      <td className="px-6 py-4 text-sm font-semibold text-[#6366F1]">{order.total} &euro;</td>
                      <td className="px-6 py-4">
                        <span className="text-xs text-[#94A3B8] uppercase">{order.paymentMethod}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`text-xs px-2 py-1 rounded-full ${
                          order.status === "completed" ? "bg-[#22C55E]/10 text-[#22C55E]" :
                          order.status === "paid" ? "bg-[#3B82F6]/10 text-[#3B82F6]" :
                          order.status === "pending" ? "bg-[#F59E0B]/10 text-[#F59E0B]" :
                          order.status === "refunded" ? "bg-[#64748B]/10 text-[#64748B]" :
                          "bg-[#EF4444]/10 text-[#EF4444]"
                        }`}>
                          {order.status === "completed" ? "Abgeschlossen" :
                           order.status === "paid" ? "Bezahlt" :
                           order.status === "pending" ? "Ausstehend" :
                           order.status === "refunded" ? "Erstattet" : "Storniert"}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end gap-1">
                          <Select
                            value={order.status}
                            onValueChange={(v) => updateStatus.mutate({ orderId: order.id, status: v as any })}
                          >
                            <SelectTrigger className="h-8 w-32 bg-[#1A2235] border-[#2D3748] text-[#F1F5F9] text-xs">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="bg-[#1E293B] border-[#2D3748]">
                              <SelectItem value="pending" className="text-[#F1F5F9] text-xs">Ausstehend</SelectItem>
                              <SelectItem value="paid" className="text-[#F1F5F9] text-xs">Bezahlt</SelectItem>
                              <SelectItem value="completed" className="text-[#F1F5F9] text-xs">Abgeschlossen</SelectItem>
                              <SelectItem value="cancelled" className="text-[#F1F5F9] text-xs">Storniert</SelectItem>
                            </SelectContent>
                          </Select>
                          {order.status !== "refunded" && (
                            <button
                              onClick={() => {
                                if (confirm("Bestellung wirklich erstatten?")) {
                                  refundOrder.mutate({ orderId: order.id });
                                }
                              }}
                              className="p-1.5 rounded-lg hover:bg-[#EF4444]/10 text-[#64748B] hover:text-[#EF4444] transition-colors"
                              title="Erstatten"
                            >
                              <RefreshCw className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {(!ordersData?.items || ordersData.items.length === 0) && (
                <div className="text-center py-12">
                  <ShoppingBag className="w-10 h-10 text-[#64748B] mx-auto mb-3" />
                  <p className="text-sm text-[#64748B]">Keine Bestellungen vorhanden</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}
