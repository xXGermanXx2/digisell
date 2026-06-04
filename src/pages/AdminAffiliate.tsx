import { trpc } from "@/providers/trpc";
import AdminLayout from "@/components/AdminLayout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { CheckCircle, XCircle, Users, DollarSign } from "lucide-react";
import { toast } from "sonner";

function formatDate(d: any) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("de-DE");
}

export default function AdminAffiliate() {
  const utils = trpc.useUtils();
  const { data } = trpc.admin.listAffiliates.useQuery({});
  const approve = trpc.admin.approveAffiliate.useMutation({ onSuccess: () => { toast.success("Genehmigt"); utils.admin.listAffiliates.invalidate(); } });
  const reject = trpc.admin.rejectAffiliate.useMutation({ onSuccess: () => { toast.success("Abgelehnt"); utils.admin.listAffiliates.invalidate(); } });
  const payout = trpc.admin.processAffiliatePayout.useMutation({ onSuccess: () => { toast.success("Auszahlung verarbeitet"); utils.admin.listAffiliates.invalidate(); } });

  return (
    <AdminLayout>
      <div className="space-y-5">
        <div className="flex items-center gap-3">
          <Users className="w-6 h-6 text-indigo-400" />
          <div>
            <h1 className="text-xl font-bold text-[#F1F5F9]">Affiliate-Verwaltung</h1>
            <p className="text-sm text-[#64748B]">{data?.items?.length ?? 0} Affiliates</p>
          </div>
        </div>

        <div className="bg-[#111827] rounded-xl border border-[#1E293B] overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="border-[#1E293B] hover:bg-transparent">
                <TableHead className="text-[#64748B]">Nutzer</TableHead>
                <TableHead className="text-[#64748B]">Code</TableHead>
                <TableHead className="text-[#64748B]">Status</TableHead>
                <TableHead className="text-[#64748B]">Klicks</TableHead>
                <TableHead className="text-[#64748B]">Verkäufe</TableHead>
                <TableHead className="text-[#64748B]">Provision</TableHead>
                <TableHead className="text-[#64748B]">Ausstehend</TableHead>
                <TableHead className="text-[#64748B]">Registriert</TableHead>
                <TableHead className="text-[#64748B] text-right">Aktionen</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(data?.items ?? []).map((a: any) => (
                <TableRow key={a.id} className="border-[#1E293B] hover:bg-[#1A2235]/40">
                  <TableCell>
                    <p className="text-[#F1F5F9] text-sm">{a.user?.name ?? a.user?.email ?? "—"}</p>
                    <p className="text-[#64748B] text-xs">{a.user?.email}</p>
                  </TableCell>
                  <TableCell className="text-[#F1F5F9] font-mono text-sm">{a.code}</TableCell>
                  <TableCell>
                    <Badge className={a.status === "active" ? "bg-green-500/20 text-green-400" : a.status === "pending" ? "bg-yellow-500/20 text-yellow-400" : "bg-red-500/20 text-red-400"}>
                      {a.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-[#94A3B8]">{a.totalClicks ?? 0}</TableCell>
                  <TableCell className="text-[#94A3B8]">{a.totalSales ?? 0}</TableCell>
                  <TableCell className="text-[#F1F5F9]">{Number(a.totalEarnings ?? 0).toFixed(2)}€</TableCell>
                  <TableCell className="text-yellow-400">{Number(a.pendingPayout ?? 0).toFixed(2)}€</TableCell>
                  <TableCell className="text-[#94A3B8] text-sm">{formatDate(a.createdAt)}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center gap-1 justify-end">
                      {a.status === "pending" && (
                        <>
                          <Button size="sm" onClick={() => approve.mutate({ id: a.id })} className="h-7 px-2 bg-green-600 hover:bg-green-700 text-white text-xs">
                            <CheckCircle className="w-3 h-3 mr-1" /> Genehmigen
                          </Button>
                          <Button size="sm" onClick={() => reject.mutate({ id: a.id })} className="h-7 px-2 bg-red-600 hover:bg-red-700 text-white text-xs">
                            <XCircle className="w-3 h-3 mr-1" /> Ablehnen
                          </Button>
                        </>
                      )}
                      {a.status === "active" && Number(a.pendingPayout) > 0 && (
                        <Button size="sm" onClick={() => payout.mutate({ id: a.id })} className="h-7 px-2 bg-[#6366F1] hover:bg-[#4F46E5] text-white text-xs">
                          <DollarSign className="w-3 h-3 mr-1" /> Auszahlen
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {!data?.items?.length && (
                <TableRow><TableCell colSpan={9} className="text-center py-10 text-[#64748B]">Keine Affiliates vorhanden</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </AdminLayout>
  );
}
