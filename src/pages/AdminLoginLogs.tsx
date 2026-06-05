import { useState } from "react";
import { trpc } from "@/providers/trpc";
import AdminLayout from "@/components/AdminLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Shield, CheckCircle, XCircle } from "lucide-react";

export default function AdminLoginLogs() {
  const [success, setSuccess] = useState<boolean | undefined>(undefined);
  const [page, setPage] = useState(1);

  const { data } = trpc.admin.getLoginLogs.useQuery({ success, page, limit: 50 });

  return (
    <AdminLayout>
      <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <Shield className="w-6 h-6 text-blue-400" /> Login-Protokolle
        </h1>
        <p className="text-gray-400 text-sm mt-1">Alle Anmeldeversuche überwachen</p>
      </div>

      <Card className="bg-gray-900 border-gray-800">
        <CardContent className="pt-4">
          <div className="flex gap-2">
            <Button size="sm" variant={success === undefined ? "default" : "outline"} onClick={() => setSuccess(undefined)}
              className={success === undefined ? "bg-purple-600" : "border-gray-700 text-gray-300"}>Alle</Button>
            <Button size="sm" variant={success === true ? "default" : "outline"} onClick={() => setSuccess(true)}
              className={success === true ? "bg-green-600" : "border-gray-700 text-gray-300"}>Erfolgreich</Button>
            <Button size="sm" variant={success === false ? "default" : "outline"} onClick={() => setSuccess(false)}
              className={success === false ? "bg-red-600" : "border-gray-700 text-gray-300"}>Fehlgeschlagen</Button>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-gray-900 border-gray-800">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="border-gray-800">
                <TableHead className="text-gray-400">Status</TableHead>
                <TableHead className="text-gray-400">Nutzer</TableHead>
                <TableHead className="text-gray-400">IP-Adresse</TableHead>
                <TableHead className="text-gray-400">Browser</TableHead>
                <TableHead className="text-gray-400">Zeitpunkt</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data?.items.map(log => (
                <TableRow key={log.id} className="border-gray-800 hover:bg-gray-800/50">
                  <TableCell>
                    {log.success
                      ? <CheckCircle className="w-4 h-4 text-green-400" />
                      : <XCircle className="w-4 h-4 text-red-400" />}
                  </TableCell>
                  <TableCell>
                    <div>
                      <p className="text-white text-sm">{(log as any).user?.name ?? "Unbekannt"}</p>
                      <p className="text-gray-400 text-xs">{(log as any).user?.email ?? log.email ?? "—"}</p>
                    </div>
                  </TableCell>
                  <TableCell className="text-gray-300 text-sm font-mono">{log.ipAddress ?? "—"}</TableCell>
                  <TableCell className="text-gray-400 text-xs max-w-xs truncate">{log.userAgent ?? "—"}</TableCell>
                  <TableCell className="text-gray-400 text-sm">
                    {new Date(log.createdAt!).toLocaleString("de-DE")}
                  </TableCell>
                </TableRow>
              ))}
              {(!data?.items || data.items.length === 0) && (
                <TableRow><TableCell colSpan={5} className="text-center text-gray-400 py-8">Keine Login-Logs gefunden</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {data && data.total > 50 && (
        <div className="flex justify-center gap-2">
          <Button variant="outline" size="sm" disabled={page === 1} onClick={() => setPage(p => p - 1)} className="border-gray-700 text-gray-300">Zurück</Button>
          <span className="text-gray-400 text-sm self-center">Seite {page} / {Math.ceil(data.total / 50)}</span>
          <Button variant="outline" size="sm" disabled={page >= Math.ceil(data.total / 50)} onClick={() => setPage(p => p + 1)} className="border-gray-700 text-gray-300">Weiter</Button>
        </div>
      )}
      </div>
    </AdminLayout>
  );
}
