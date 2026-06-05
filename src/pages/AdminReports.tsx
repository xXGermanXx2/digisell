import { useState } from "react";
import { trpc } from "@/providers/trpc";
import AdminLayout from "@/components/AdminLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Flag, CheckCircle, XCircle, Eye } from "lucide-react";

export default function AdminReports() {
  const [status, setStatus] = useState("all");
  const [type, setType] = useState("all");
  const [page, setPage] = useState(1);

  const { data, refetch } = trpc.admin.listReports.useQuery({
    status: status !== "all" ? (status as any) : undefined,
    type: type !== "all" ? (type as any) : undefined,
    page, limit: 20,
  });

  const updateStatus = trpc.admin.updateReportStatus.useMutation({ onSuccess: () => refetch() });

  const statusColor: Record<string, string> = {
    pending: "bg-yellow-500/20 text-yellow-400",
    reviewed: "bg-blue-500/20 text-blue-400",
    resolved: "bg-green-500/20 text-green-400",
    dismissed: "bg-gray-500/20 text-gray-400",
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <Flag className="w-6 h-6 text-red-400" /> Meldungen & Moderation
        </h1>
        <p className="text-gray-400 text-sm mt-1">Gemeldete Inhalte prüfen und moderieren</p>
      </div>

      <Card className="bg-gray-900 border-gray-800">
        <CardContent className="pt-4">
          <div className="flex gap-3 flex-wrap">
            <Select value={status} onValueChange={v => { setStatus(v); setPage(1); }}>
              <SelectTrigger className="w-full sm:w-40 bg-gray-800 border-gray-700 text-white">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent className="bg-gray-800 border-gray-700">
                <SelectItem value="all">Alle Status</SelectItem>
                <SelectItem value="pending">Ausstehend</SelectItem>
                <SelectItem value="reviewed">Geprüft</SelectItem>
                <SelectItem value="resolved">Gelöst</SelectItem>
                <SelectItem value="dismissed">Abgewiesen</SelectItem>
              </SelectContent>
            </Select>
            <Select value={type} onValueChange={v => { setType(v); setPage(1); }}>
              <SelectTrigger className="w-full sm:w-40 bg-gray-800 border-gray-700 text-white">
                <SelectValue placeholder="Typ" />
              </SelectTrigger>
              <SelectContent className="bg-gray-800 border-gray-700">
                <SelectItem value="all">Alle Typen</SelectItem>
                <SelectItem value="product">Produkt</SelectItem>
                <SelectItem value="user">Nutzer</SelectItem>
                <SelectItem value="review">Bewertung</SelectItem>
                <SelectItem value="shop">Shop</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-gray-900 border-gray-800">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="border-gray-800">
                <TableHead className="text-gray-400">Typ</TableHead>
                <TableHead className="text-gray-400">Melder</TableHead>
                <TableHead className="text-gray-400">Grund</TableHead>
                <TableHead className="text-gray-400">Status</TableHead>
                <TableHead className="text-gray-400">Datum</TableHead>
                <TableHead className="text-gray-400 text-right">Aktionen</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data?.items.map(report => (
                <TableRow key={report.id} className="border-gray-800 hover:bg-gray-800/50">
                  <TableCell>
                    <span className="px-2 py-1 rounded text-xs bg-gray-700 text-gray-300 capitalize">{report.type}</span>
                  </TableCell>
                  <TableCell className="text-white text-sm">{(report as any).reporter?.name ?? "Anonym"}</TableCell>
                  <TableCell className="text-gray-300 text-sm max-w-xs truncate">{report.reason}</TableCell>
                  <TableCell>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColor[report.status] ?? ""}`}>
                      {report.status}
                    </span>
                  </TableCell>
                  <TableCell className="text-gray-400 text-sm">
                    {new Date(report.createdAt!).toLocaleDateString("de-DE")}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex gap-1 justify-end">
                      <Button size="sm" variant="ghost" className="text-green-400 hover:text-green-300"
                        onClick={() => updateStatus.mutate({ id: report.id, status: "resolved" })}>
                        <CheckCircle className="w-4 h-4" />
                      </Button>
                      <Button size="sm" variant="ghost" className="text-gray-400 hover:text-gray-300"
                        onClick={() => updateStatus.mutate({ id: report.id, status: "dismissed" })}>
                        <XCircle className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {(!data?.items || data.items.length === 0) && (
                <TableRow><TableCell colSpan={6} className="text-center text-gray-400 py-8">Keine Meldungen gefunden</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {data && data.total > 20 && (
        <div className="flex justify-center gap-2">
          <Button variant="outline" size="sm" disabled={page === 1} onClick={() => setPage(p => p - 1)} className="border-gray-700 text-gray-300">Zurück</Button>
          <span className="text-gray-400 text-sm self-center">Seite {page} / {Math.ceil(data.total / 20)}</span>
          <Button variant="outline" size="sm" disabled={page >= Math.ceil(data.total / 20)} onClick={() => setPage(p => p + 1)} className="border-gray-700 text-gray-300">Weiter</Button>
        </div>
      )}
      </div>
    </AdminLayout>
  );
}
