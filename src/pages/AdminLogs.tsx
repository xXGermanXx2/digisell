import { useState } from "react";
import { trpc } from "@/providers/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import AdminLayout from "@/components/AdminLayout";
import { Search, Loader2, AlertTriangle, Info, CheckCircle, XCircle, FileText } from "lucide-react";

const levelColors: Record<string, string> = {
  info: "bg-blue-500/20 text-blue-400",
  warning: "bg-yellow-500/20 text-yellow-400",
  error: "bg-red-500/20 text-red-400",
  success: "bg-green-500/20 text-green-400",
};

const levelIcons: Record<string, React.ReactNode> = {
  info: <Info className="w-3 h-3" />,
  warning: <AlertTriangle className="w-3 h-3" />,
  error: <XCircle className="w-3 h-3" />,
  success: <CheckCircle className="w-3 h-3" />,
};

export default function AdminLogs() {
  const [search, setSearch] = useState("");
  const [level, setLevel] = useState("all");
  const [action, setAction] = useState("");
  const [page, setPage] = useState(1);

  const { data, isLoading } = trpc.admin.getLogs.useQuery({
    search: search || undefined,
    level: level !== "all" ? level as any : undefined,
    action: action || undefined,
    page,
    limit: 50,
  });

  return (
    <AdminLayout>
      <div className="space-y-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <FileText className="w-6 h-6 text-indigo-400" />
          <h1 className="text-2xl font-bold text-white">System-Logs</h1>
        </div>

        <Card className="bg-slate-900 border-slate-800 mb-4">
          <CardContent className="pt-4 pb-4">
            <div className="flex gap-3 flex-wrap">
              <div className="relative flex-1 min-w-48">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input value={search} onChange={e => { setSearch(e.target.value); setPage(1); }}
                  placeholder="Suchen..." className="pl-9 bg-slate-800 border-slate-700 text-white" />
              </div>
              <Select value={level} onValueChange={v => { setLevel(v); setPage(1); }}>
                <SelectTrigger className="w-full sm:w-36 bg-slate-800 border-slate-700 text-white">
                  <SelectValue placeholder="Level" />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-700">
                  <SelectItem value="all">Alle Level</SelectItem>
                  <SelectItem value="info">Info</SelectItem>
                  <SelectItem value="warning">Warning</SelectItem>
                  <SelectItem value="error">Error</SelectItem>
                  <SelectItem value="success">Success</SelectItem>
                </SelectContent>
              </Select>
              <Input value={action} onChange={e => { setAction(e.target.value); setPage(1); }}
                placeholder="Aktion filtern..." className="w-48 bg-slate-800 border-slate-700 text-white" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-900 border-slate-800">
          <CardContent className="p-0">
            {isLoading ? (
              <div className="flex items-center justify-center py-12"><Loader2 className="w-8 h-8 text-indigo-500 animate-spin" /></div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow className="border-slate-800 hover:bg-transparent">
                    <TableHead className="text-slate-400 w-32">Zeit</TableHead>
                    <TableHead className="text-slate-400 w-24">Level</TableHead>
                    <TableHead className="text-slate-400 w-40">Aktion</TableHead>
                    <TableHead className="text-slate-400">Nachricht</TableHead>
                    <TableHead className="text-slate-400 w-32">IP</TableHead>
                    <TableHead className="text-slate-400 w-32">Benutzer</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data?.items.map(log => (
                    <TableRow key={log.id} className="border-slate-800 hover:bg-slate-800/50 font-mono text-xs">
                      <TableCell className="text-slate-400">
                        {log.createdAt ? new Date(log.createdAt).toLocaleString("de", { dateStyle: "short", timeStyle: "medium" }) : "–"}
                      </TableCell>
                      <TableCell>
                        <Badge className={`${levelColors[log.level] ?? ""} flex items-center gap-1 w-fit`}>
                          {levelIcons[log.level]}{log.level}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-slate-300">{log.action}</TableCell>
                      <TableCell className="text-slate-300 max-w-xs truncate">{log.message}</TableCell>
                      <TableCell className="text-slate-400">{log.ipAddress ?? "–"}</TableCell>
                      <TableCell className="text-slate-400">{log.userId ? `#${log.userId}` : "–"}</TableCell>
                    </TableRow>
                  ))}
                  {!data?.items.length && (
                    <TableRow><TableCell colSpan={6} className="text-center text-slate-500 py-8">Keine Logs gefunden.</TableCell></TableRow>
                  )}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {data && data.total > 50 && (
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mt-4">
            <p className="text-slate-400 text-sm">{data.total} Einträge · Seite {page} von {Math.ceil(data.total / 50)}</p>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                className="border-slate-700 text-slate-300">Zurück</Button>
              <Button size="sm" variant="outline" onClick={() => setPage(p => p + 1)} disabled={page >= Math.ceil(data.total / 50)}
                className="border-slate-700 text-slate-300">Weiter</Button>
            </div>
          </div>
        )}
      </div>
      </div>
    </AdminLayout>
  );
}
