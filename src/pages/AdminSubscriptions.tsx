import { trpc } from "@/providers/trpc";
import AdminLayout from "@/components/AdminLayout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { RefreshCw } from "lucide-react";
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
  const { data } = trpc.admin.listSubscriptions.useQuery({});
  const cancel = trpc.admin.cancelSubscription.useMutation({ onSuccess: () => { toast.success("Abonnement gekündigt"); utils.admin.listSubscriptions.invalidate(); } });

  return (
    <AdminLayout>
      <div className="space-y-5">
        <div>
          <h1 className="text-xl font-bold text-[#F1F5F9]">Abonnement-Verwaltung</h1>
          <p className="text-sm text-[#64748B]">{data?.items?.length ?? 0} Abonnements</p>
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
              {(data?.items ?? []).map((s: any) => (
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
                    {s.status === "active" && (
                      <Button size="sm" onClick={() => { if (confirm("Abonnement kündigen?")) cancel.mutate({ id: s.id }); }}
                        className="h-7 px-2 bg-red-600 hover:bg-red-700 text-white text-xs">
                        <RefreshCw className="w-3 h-3 mr-1" /> Kündigen
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
              {!data?.items?.length && (
                <TableRow><TableCell colSpan={8} className="text-center py-10 text-[#64748B]">Keine Abonnements vorhanden</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </AdminLayout>
  );
}
