import { useState } from "react";
import { trpc } from "@/providers/trpc";
import AdminLayout from "@/components/AdminLayout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { RefreshCw, Plus, TrendingUp, Users, DollarSign, Calendar } from "lucide-react";
import { toast } from "sonner";

function formatDate(d: any) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("de-DE");
}

const statusColors: Record<string, string> = {
  active: "bg-green-500/20 text-green-400",
  cancelled: "bg-red-500/20 text-red-400",
  expired: "bg-gray-700 text-gray-400",
  past_due: "bg-yellow-500/20 text-yellow-400",
};

export default function AdminSubscriptions() {
  const utils = trpc.useUtils();
  const [extendId, setExtendId] = useState<number | null>(null);
  const [extendDays, setExtendDays] = useState("30");
  const { data } = trpc.admin.listSubscriptions.useQuery({});
  const cancel = trpc.admin.cancelSubscription.useMutation({
    onSuccess: () => { toast.success("Abonnement gekündigt"); utils.admin.listSubscriptions.invalidate(); }
  });
  const extend = trpc.admin.extendSubscription.useMutation({
    onSuccess: () => { toast.success("Abonnement verlängert"); utils.admin.listSubscriptions.invalidate(); setExtendId(null); }
  });

  const items = data?.items ?? [];
  const activeCount = items.filter((s: any) => s.status === "active").length;
  const totalRevenue = items.reduce((sum: number, s: any) => sum + Number(s.amount ?? 0), 0);
  const cancelledCount = items.filter((s: any) => s.status === "cancelled").length;

  return (
    <AdminLayout>
      <div className="space-y-5">
        <div>
          <h1 className="text-xl font-bold text-[#F1F5F9]">Abonnement-Verwaltung</h1>
          <p className="text-sm text-[#64748B]">{items.length} Abonnements gesamt</p>
        </div>

        {/* Statistiken */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "Gesamt", value: items.length, icon: Users, color: "text-blue-400" },
            { label: "Aktiv", value: activeCount, icon: TrendingUp, color: "text-green-400" },
            { label: "Gekündigt", value: cancelledCount, icon: RefreshCw, color: "text-red-400" },
            { label: "Umsatz", value: `${totalRevenue.toFixed(2)}€`, icon: DollarSign, color: "text-yellow-400" },
          ].map(({ label, value, icon: Icon, color }) => (
            <div key={label} className="bg-[#111827] rounded-xl border border-[#1E293B] p-4 flex items-center gap-3">
              <Icon className={`w-5 h-5 ${color}`} />
              <div>
                <p className="text-xs text-[#64748B]">{label}</p>
                <p className="text-lg font-bold text-[#F1F5F9]">{value}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="bg-[#111827] rounded-xl border border-[#1E293B] overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="border-[#1E293B] hover:bg-transparent">
                <TableHead className="text-[#64748B]">Nutzer</TableHead>
                <TableHead className="text-[#64748B]">Produkt</TableHead>
                <TableHead className="text-[#64748B]">Plan</TableHead>
                <TableHead className="text-[#64748B]">Status</TableHead>
                <TableHead className="text-[#64748B]">Betrag</TableHead>
                <TableHead className="text-[#64748B]">Nächste Zahlung</TableHead>
                <TableHead className="text-[#64748B]">Erstellt</TableHead>
                <TableHead className="text-[#64748B] text-right">Aktionen</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((s: any) => (
                <TableRow key={s.id} className="border-[#1E293B] hover:bg-[#1A2235]/40">
                  <TableCell>
                    <p className="text-[#F1F5F9] text-sm">{s.user?.name ?? s.user?.email ?? "—"}</p>
                    <p className="text-[#64748B] text-xs">{s.user?.email}</p>
                  </TableCell>
                  <TableCell className="text-[#94A3B8] text-sm">{s.product?.title ?? "—"}</TableCell>
                  <TableCell className="text-[#94A3B8] text-sm capitalize">{s.interval}</TableCell>
                  <TableCell><Badge className={statusColors[s.status] ?? ""}>{s.status}</Badge></TableCell>
                  <TableCell className="text-[#F1F5F9]">{Number(s.amount ?? 0).toFixed(2)}€</TableCell>
                  <TableCell className="text-[#94A3B8] text-sm">{formatDate(s.currentPeriodEnd)}</TableCell>
                  <TableCell className="text-[#94A3B8] text-sm">{formatDate(s.createdAt)}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex gap-1 justify-end">
                      <Button size="sm" onClick={() => { setExtendId(s.id); setExtendDays("30"); }}
                        className="h-7 px-2 bg-[#6366F1] hover:bg-[#4F46E5] text-white text-xs">
                        <Calendar className="w-3 h-3 mr-1" /> Verlängern
                      </Button>
                      {s.status === "active" && (
                        <Button size="sm" onClick={() => { if (confirm("Abonnement kündigen?")) cancel.mutate({ id: s.id }); }}
                          className="h-7 px-2 bg-red-600 hover:bg-red-700 text-white text-xs">
                          <RefreshCw className="w-3 h-3 mr-1" /> Kündigen
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {!items.length && (
                <TableRow><TableCell colSpan={8} className="text-center py-10 text-[#64748B]">Keine Abonnements vorhanden</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Verlängerungs-Dialog */}
      <Dialog open={extendId !== null} onOpenChange={() => setExtendId(null)}>
        <DialogContent className="w-[calc(100vw-1rem)] sm:w-full bg-[#111827] border-[#1E293B] text-[#F1F5F9]">
          <DialogHeader><DialogTitle>Abonnement verlängern</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div>
              <Label className="text-xs text-[#94A3B8] uppercase tracking-wider">Verlängerung in Tagen</Label>
              <Input value={extendDays} onChange={(e) => setExtendDays(e.target.value)} type="number" min="1"
                className="mt-1.5 bg-[#1A2235] border-[#2D3748] text-[#F1F5F9]" />
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setExtendId(null)} className="border-[#2D3748] text-[#94A3B8]">Abbrechen</Button>
              <Button onClick={() => extend.mutate({ id: extendId!, days: parseInt(extendDays) })}
                disabled={extend.isPending} className="bg-[#6366F1] hover:bg-[#4F46E5] text-white">
                <Plus className="w-4 h-4 mr-1" /> Verlängern
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
