import { useState } from "react";
import { trpc } from "@/providers/trpc";
import AdminLayout from "@/components/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Search, MoreVertical, Eye, RefreshCw, Download, ChevronLeft, ChevronRight, ShoppingBag } from "lucide-react";
import { toast } from "sonner";

const statusColors: Record<string, string> = {
  completed: "bg-green-500/20 text-green-400",
  pending: "bg-yellow-500/20 text-yellow-400",
  processing: "bg-blue-500/20 text-blue-400",
  cancelled: "bg-red-500/20 text-red-400",
  refunded: "bg-purple-500/20 text-purple-400",
};

function formatDate(d: any) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

export default function AdminOrders() {
  const utils = trpc.useUtils();
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [page, setPage] = useState(1);
  const [selectedOrder, setSelectedOrder] = useState<any>(null);

  const { data, isLoading } = trpc.admin.listOrders.useQuery({
    search: search || undefined,
    status: status !== "all" ? status : undefined,
    page, limit: 20,
  });

  const updateStatus = trpc.admin.updateOrderStatus.useMutation({
    onSuccess: () => { toast.success("Status aktualisiert"); utils.admin.listOrders.invalidate(); },
  });
  const refundOrder = trpc.admin.refundOrder.useMutation({
    onSuccess: () => { toast.success("Rückerstattung eingeleitet"); utils.admin.listOrders.invalidate(); },
  });

  const totalPages = Math.ceil((data?.total ?? 0) / 20);

  return (
    <AdminLayout>
      <div className="space-y-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <ShoppingBag className="w-6 h-6 text-indigo-400" />
            <div>
              <h1 className="text-xl font-bold text-[#F1F5F9]">Bestellverwaltung</h1>
              <p className="text-sm text-[#64748B]">{data?.total ?? 0} Bestellungen insgesamt</p>
            </div>
          </div>
        </div>

        <div className="bg-[#111827] rounded-xl border border-[#1E293B] p-4">
          <div className="flex flex-wrap gap-3">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#64748B]" />
              <Input value={search} onChange={e => { setSearch(e.target.value); setPage(1); }}
                placeholder="Bestellnummer oder E-Mail..."
                className="pl-9 bg-[#0F172A] border-[#1E293B] text-[#F1F5F9] placeholder:text-[#64748B]" />
            </div>
            <Select value={status} onValueChange={v => { setStatus(v); setPage(1); }}>
              <SelectTrigger className="w-40 bg-[#0F172A] border-[#1E293B] text-[#F1F5F9]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-[#111827] border-[#1E293B]">
                <SelectItem value="all">Alle Status</SelectItem>
                <SelectItem value="pending">Ausstehend</SelectItem>
                <SelectItem value="processing">In Bearbeitung</SelectItem>
                <SelectItem value="completed">Abgeschlossen</SelectItem>
                <SelectItem value="cancelled">Storniert</SelectItem>
                <SelectItem value="refunded">Erstattet</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="bg-[#111827] rounded-xl border border-[#1E293B] overflow-hidden">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-[#1E293B] hover:bg-transparent">
                  <TableHead className="text-[#64748B]">Bestellnummer</TableHead>
                  <TableHead className="text-[#64748B]">Kunde</TableHead>
                  <TableHead className="text-[#64748B]">Betrag</TableHead>
                  <TableHead className="text-[#64748B]">Status</TableHead>
                  <TableHead className="text-[#64748B]">Datum</TableHead>
                  <TableHead className="text-[#64748B] text-right">Aktionen</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow><TableCell colSpan={6} className="text-center py-10 text-[#64748B]">Lädt...</TableCell></TableRow>
                ) : (data?.items ?? []).map((order: any) => (
                  <TableRow key={order.id} className="border-[#1E293B] hover:bg-[#1A2235]/40">
                    <TableCell className="text-[#F1F5F9] font-mono text-sm">{order.orderNumber}</TableCell>
                    <TableCell>
                      <p className="text-[#F1F5F9] text-sm">{order.customer?.name ?? "Gast"}</p>
                      <p className="text-[#64748B] text-xs">{order.customerEmail}</p>
                    </TableCell>
                    <TableCell className="text-[#F1F5F9] font-medium">{Number(order.total).toFixed(2)}€</TableCell>
                    <TableCell><Badge className={statusColors[order.status] ?? ""}>{order.status}</Badge></TableCell>
                    <TableCell className="text-[#94A3B8] text-sm">{formatDate(order.createdAt)}</TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button size="sm" variant="ghost" className="text-[#64748B] hover:text-[#F1F5F9] h-8 w-8 p-0">
                            <MoreVertical className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="bg-[#1A2235] border-[#2D3748] w-48">
                          <DropdownMenuItem onClick={() => setSelectedOrder(order)} className="text-[#F1F5F9] hover:bg-[#2D3748] cursor-pointer">
                            <Eye className="w-4 h-4 mr-2" /> Details
                          </DropdownMenuItem>
                          {["pending","processing","completed","cancelled"].map(s => (
                            <DropdownMenuItem key={s} onClick={() => updateStatus.mutate({ id: order.id, status: s })}
                              className="text-[#94A3B8] hover:bg-[#2D3748] cursor-pointer capitalize">
                              <RefreshCw className="w-4 h-4 mr-2" /> Status: {s}
                            </DropdownMenuItem>
                          ))}
                          {order.status === "completed" && (
                            <DropdownMenuItem onClick={() => { if (confirm("Rückerstattung einleiten?")) refundOrder.mutate({ id: order.id }); }}
                              className="text-purple-400 hover:bg-[#2D3748] cursor-pointer">
                              <Download className="w-4 h-4 mr-2" /> Rückerstattung
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
                {!isLoading && !data?.items?.length && (
                  <TableRow><TableCell colSpan={6} className="text-center py-10 text-[#64748B]">Keine Bestellungen gefunden</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </div>
          {totalPages > 1 && (
            <div className="px-5 py-3 border-t border-[#1E293B] flex items-center justify-between">
              <p className="text-sm text-[#64748B]">Seite {page} von {totalPages}</p>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(p => p - 1)} className="border-[#1E293B] text-[#94A3B8] h-8"><ChevronLeft className="w-4 h-4" /></Button>
                <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)} className="border-[#1E293B] text-[#94A3B8] h-8"><ChevronRight className="w-4 h-4" /></Button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Order Detail Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#111827] border border-[#1E293B] rounded-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b border-[#1E293B]">
              <h2 className="text-lg font-semibold text-[#F1F5F9]">Bestellung {selectedOrder.orderNumber}</h2>
              <Button variant="ghost" size="sm" onClick={() => setSelectedOrder(null)} className="text-[#64748B]">✕</Button>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div><p className="text-[#64748B]">Kunde</p><p className="text-[#F1F5F9]">{selectedOrder.customer?.name ?? "Gast"}</p></div>
                <div><p className="text-[#64748B]">E-Mail</p><p className="text-[#F1F5F9]">{selectedOrder.customerEmail}</p></div>
                <div><p className="text-[#64748B]">Betrag</p><p className="text-[#F1F5F9] font-bold">{Number(selectedOrder.total).toFixed(2)}€</p></div>
                <div><p className="text-[#64748B]">Status</p><Badge className={statusColors[selectedOrder.status]}>{selectedOrder.status}</Badge></div>
                <div><p className="text-[#64748B]">Datum</p><p className="text-[#F1F5F9]">{formatDate(selectedOrder.createdAt)}</p></div>
                <div><p className="text-[#64748B]">Zahlungsmethode</p><p className="text-[#F1F5F9] capitalize">{selectedOrder.paymentMethod ?? "—"}</p></div>
              </div>
              {selectedOrder.items?.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium text-[#94A3B8] mb-2">Bestellpositionen</h4>
                  <div className="space-y-2">
                    {selectedOrder.items.map((item: any) => (
                      <div key={item.id} className="flex justify-between bg-[#0F172A] rounded px-4 py-2 text-sm">
                        <span className="text-[#F1F5F9]">{item.product?.title ?? "Produkt"}</span>
                        <span className="text-[#94A3B8]">{item.quantity}x {Number(item.price).toFixed(2)}€</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
