import { useState } from "react";
import { trpc } from "@/providers/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Search, MoreVertical, Shield, Ban, CheckCircle, Loader2, Users } from "lucide-react";
import { toast } from "sonner";

const roleColors: Record<string, string> = {
  admin: "bg-red-500/20 text-red-400", seller: "bg-blue-500/20 text-blue-400", customer: "bg-slate-700 text-slate-300",
};
const statusColors: Record<string, string> = {
  active: "bg-green-500/20 text-green-400", blocked: "bg-red-500/20 text-red-400", pending: "bg-yellow-500/20 text-yellow-400",
};

export default function AdminUsers() {
  const utils = trpc.useUtils();
  const [search, setSearch] = useState("");
  const [role, setRole] = useState<string>("all");
  const [status, setStatus] = useState<string>("all");
  const [page, setPage] = useState(1);

  const { data, isLoading } = trpc.admin.listUsers.useQuery({
    search: search || undefined,
    role: role !== "all" ? role as any : undefined,
    status: status !== "all" ? status as any : undefined,
    page,
    limit: 20,
  });

  const blockUser = trpc.admin.blockUser.useMutation({
    onSuccess: () => { toast.success("Benutzer gesperrt"); utils.admin.listUsers.invalidate(); },
  });
  const unblockUser = trpc.admin.unblockUser.useMutation({
    onSuccess: () => { toast.success("Benutzer entsperrt"); utils.admin.listUsers.invalidate(); },
  });
  const assignRole = trpc.admin.assignRole.useMutation({
    onSuccess: () => { toast.success("Rolle geändert"); utils.admin.listUsers.invalidate(); },
  });

  return (
    <div className="min-h-screen bg-slate-950 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Users className="w-6 h-6 text-indigo-400" />
            <h1 className="text-2xl font-bold text-white">Benutzerverwaltung</h1>
          </div>
          <Badge className="bg-slate-800 text-slate-300">{data?.total ?? 0} Benutzer</Badge>
        </div>

        {/* Filters */}
        <Card className="bg-slate-900 border-slate-800 mb-4">
          <CardContent className="pt-4 pb-4">
            <div className="flex gap-3 flex-wrap">
              <div className="relative flex-1 min-w-48">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input value={search} onChange={e => { setSearch(e.target.value); setPage(1); }}
                  placeholder="Name oder E-Mail suchen..." className="pl-9 bg-slate-800 border-slate-700 text-white" />
              </div>
              <Select value={role} onValueChange={v => { setRole(v); setPage(1); }}>
                <SelectTrigger className="w-36 bg-slate-800 border-slate-700 text-white">
                  <SelectValue placeholder="Rolle" />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-700">
                  <SelectItem value="all">Alle Rollen</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="seller">Verkäufer</SelectItem>
                  <SelectItem value="customer">Kunde</SelectItem>
                </SelectContent>
              </Select>
              <Select value={status} onValueChange={v => { setStatus(v); setPage(1); }}>
                <SelectTrigger className="w-36 bg-slate-800 border-slate-700 text-white">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-700">
                  <SelectItem value="all">Alle Status</SelectItem>
                  <SelectItem value="active">Aktiv</SelectItem>
                  <SelectItem value="blocked">Gesperrt</SelectItem>
                  <SelectItem value="pending">Ausstehend</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Table */}
        <Card className="bg-slate-900 border-slate-800">
          <CardContent className="p-0">
            {isLoading ? (
              <div className="flex items-center justify-center py-12"><Loader2 className="w-8 h-8 text-indigo-500 animate-spin" /></div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow className="border-slate-800 hover:bg-transparent">
                    <TableHead className="text-slate-400">Benutzer</TableHead>
                    <TableHead className="text-slate-400">Rolle</TableHead>
                    <TableHead className="text-slate-400">Status</TableHead>
                    <TableHead className="text-slate-400">E-Mail bestätigt</TableHead>
                    <TableHead className="text-slate-400">Registriert</TableHead>
                    <TableHead className="text-slate-400 text-right">Aktionen</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data?.items.map(user => (
                    <TableRow key={user.id} className="border-slate-800 hover:bg-slate-800/50">
                      <TableCell>
                        <div>
                          <p className="text-white font-medium">{user.name ?? "–"}</p>
                          <p className="text-slate-400 text-xs">{user.email ?? user.unionId}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={roleColors[user.role] ?? ""}>{user.role}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge className={statusColors[user.status] ?? ""}>{user.status}</Badge>
                      </TableCell>
                      <TableCell>
                        {user.emailVerified
                          ? <CheckCircle className="w-4 h-4 text-green-400" />
                          : <span className="text-slate-500 text-xs">Nein</span>}
                      </TableCell>
                      <TableCell className="text-slate-400 text-sm">
                        {user.createdAt ? new Date(user.createdAt).toLocaleDateString("de") : "–"}
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button size="sm" variant="ghost" className="text-slate-400 hover:text-white">
                              <MoreVertical className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="bg-slate-800 border-slate-700">
                            {user.status !== "blocked" ? (
                              <DropdownMenuItem onClick={() => blockUser.mutate({ id: user.id })}
                                className="text-red-400 hover:text-red-300 hover:bg-red-500/10 cursor-pointer">
                                <Ban className="w-4 h-4 mr-2" />Sperren
                              </DropdownMenuItem>
                            ) : (
                              <DropdownMenuItem onClick={() => unblockUser.mutate({ id: user.id })}
                                className="text-green-400 hover:text-green-300 hover:bg-green-500/10 cursor-pointer">
                                <CheckCircle className="w-4 h-4 mr-2" />Entsperren
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuItem onClick={() => assignRole.mutate({ id: user.id, role: "seller" })}
                              className="text-blue-400 hover:text-blue-300 hover:bg-blue-500/10 cursor-pointer">
                              <Shield className="w-4 h-4 mr-2" />Als Verkäufer
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => assignRole.mutate({ id: user.id, role: "admin" })}
                              className="text-red-400 hover:text-red-300 hover:bg-red-500/10 cursor-pointer">
                              <Shield className="w-4 h-4 mr-2" />Als Admin
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => assignRole.mutate({ id: user.id, role: "customer" })}
                              className="text-slate-300 hover:bg-slate-700 cursor-pointer">
                              Als Kunde
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Pagination */}
        {data && data.total > 20 && (
          <div className="flex items-center justify-between mt-4">
            <p className="text-slate-400 text-sm">Seite {page} von {Math.ceil(data.total / 20)}</p>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                className="border-slate-700 text-slate-300">Zurück</Button>
              <Button size="sm" variant="outline" onClick={() => setPage(p => p + 1)} disabled={page >= Math.ceil(data.total / 20)}
                className="border-slate-700 text-slate-300">Weiter</Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
