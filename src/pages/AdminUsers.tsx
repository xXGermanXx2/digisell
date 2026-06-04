import { useState } from "react";
import { trpc } from "@/providers/trpc";
import AdminLayout from "@/components/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import {
  Search, MoreVertical, Shield, Ban, CheckCircle, Loader2, Users,
  Trash2, Eye, AlertTriangle, X, ChevronLeft, ChevronRight
} from "lucide-react";
import { toast } from "sonner";

const roleColors: Record<string, string> = {
  admin: "bg-red-500/20 text-red-400",
  seller: "bg-blue-500/20 text-blue-400",
  customer: "bg-slate-700 text-slate-300",
};
const statusColors: Record<string, string> = {
  active: "bg-green-500/20 text-green-400",
  blocked: "bg-red-500/20 text-red-400",
  pending: "bg-yellow-500/20 text-yellow-400",
};

function formatDate(d: any) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit", year: "numeric" });
}

export default function AdminUsers() {
  const utils = trpc.useUtils();
  const [search, setSearch] = useState("");
  const [role, setRole] = useState<string>("all");
  const [status, setStatus] = useState<string>("all");
  const [page, setPage] = useState(1);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [showWarning, setShowWarning] = useState(false);
  const [warningMsg, setWarningMsg] = useState("");

  const { data, isLoading } = trpc.admin.listUsers.useQuery({
    search: search || undefined,
    role: role !== "all" ? role as any : undefined,
    status: status !== "all" ? status as any : undefined,
    page,
    limit: 20,
  });

  const { data: userDetail } = trpc.admin.getUser.useQuery(
    { id: selectedUser?.id },
    { enabled: !!selectedUser?.id }
  );

  const blockUser = trpc.admin.blockUser.useMutation({
    onSuccess: () => { toast.success("Benutzer gesperrt"); utils.admin.listUsers.invalidate(); },
  });
  const unblockUser = trpc.admin.unblockUser.useMutation({
    onSuccess: () => { toast.success("Benutzer entsperrt"); utils.admin.listUsers.invalidate(); },
  });
  const assignRole = trpc.admin.assignRole.useMutation({
    onSuccess: () => { toast.success("Rolle geändert"); utils.admin.listUsers.invalidate(); },
  });
  const deleteUser = trpc.admin.deleteUser.useMutation({
    onSuccess: () => { toast.success("Benutzer gelöscht"); utils.admin.listUsers.invalidate(); setSelectedUser(null); },
  });
  const verifyUser = trpc.admin.verifyUser.useMutation({
    onSuccess: () => { toast.success("E-Mail verifiziert"); utils.admin.listUsers.invalidate(); },
  });
  const sendWarning = trpc.admin.sendWarning.useMutation({
    onSuccess: () => { toast.success("Warnung gesendet"); setShowWarning(false); setWarningMsg(""); },
  });

  const totalPages = Math.ceil((data?.total ?? 0) / 20);

  return (
    <AdminLayout>
      <div className="space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Users className="w-6 h-6 text-indigo-400" />
            <div>
              <h1 className="text-xl font-bold text-[#F1F5F9]">Benutzerverwaltung</h1>
              <p className="text-sm text-[#64748B]">{data?.total ?? 0} Benutzer insgesamt</p>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-[#111827] rounded-xl border border-[#1E293B] p-4">
          <div className="flex flex-wrap gap-3">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#64748B]" />
              <Input value={search} onChange={e => { setSearch(e.target.value); setPage(1); }}
                placeholder="Name oder E-Mail suchen..."
                className="pl-9 bg-[#0F172A] border-[#1E293B] text-[#F1F5F9] placeholder:text-[#64748B]" />
            </div>
            <Select value={role} onValueChange={v => { setRole(v); setPage(1); }}>
              <SelectTrigger className="w-36 bg-[#0F172A] border-[#1E293B] text-[#F1F5F9]">
                <SelectValue placeholder="Rolle" />
              </SelectTrigger>
              <SelectContent className="bg-[#111827] border-[#1E293B]">
                <SelectItem value="all">Alle Rollen</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
                <SelectItem value="seller">Verkäufer</SelectItem>
                <SelectItem value="customer">Kunde</SelectItem>
              </SelectContent>
            </Select>
            <Select value={status} onValueChange={v => { setStatus(v); setPage(1); }}>
              <SelectTrigger className="w-36 bg-[#0F172A] border-[#1E293B] text-[#F1F5F9]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent className="bg-[#111827] border-[#1E293B]">
                <SelectItem value="all">Alle Status</SelectItem>
                <SelectItem value="active">Aktiv</SelectItem>
                <SelectItem value="blocked">Gesperrt</SelectItem>
                <SelectItem value="pending">Ausstehend</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Table */}
        <div className="bg-[#111827] rounded-xl border border-[#1E293B] overflow-hidden">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-[#1E293B] hover:bg-transparent">
                    <TableHead className="text-[#64748B]">Benutzer</TableHead>
                    <TableHead className="text-[#64748B]">Rolle</TableHead>
                    <TableHead className="text-[#64748B]">Status</TableHead>
                    <TableHead className="text-[#64748B]">E-Mail verifiziert</TableHead>
                    <TableHead className="text-[#64748B]">2FA</TableHead>
                    <TableHead className="text-[#64748B]">Registriert</TableHead>
                    <TableHead className="text-[#64748B] text-right">Aktionen</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data?.items.map(user => (
                    <TableRow key={user.id} className="border-[#1E293B] hover:bg-[#1A2235]/40">
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#6366F1] to-[#8B5CF6] flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                            {((user.name ?? user.email ?? "?") as string)[0].toUpperCase()}
                          </div>
                          <div>
                            <p className="text-[#F1F5F9] font-medium text-sm">{user.name ?? "—"}</p>
                            <p className="text-[#64748B] text-xs">{user.email ?? user.unionId}</p>
                          </div>
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
                          : <X className="w-4 h-4 text-red-400" />}
                      </TableCell>
                      <TableCell>
                        {(user as any).twoFactorEnabled
                          ? <CheckCircle className="w-4 h-4 text-green-400" />
                          : <span className="text-[#64748B] text-xs">Nein</span>}
                      </TableCell>
                      <TableCell className="text-[#94A3B8] text-sm">
                        {formatDate(user.createdAt)}
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button size="sm" variant="ghost" className="text-[#64748B] hover:text-[#F1F5F9] h-8 w-8 p-0">
                              <MoreVertical className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="bg-[#1A2235] border-[#2D3748] w-48">
                            <DropdownMenuItem onClick={() => setSelectedUser(user)}
                              className="text-[#F1F5F9] hover:bg-[#2D3748] cursor-pointer">
                              <Eye className="w-4 h-4 mr-2" /> Profil anzeigen
                            </DropdownMenuItem>
                            {!(user as any).emailVerified && (
                              <DropdownMenuItem onClick={() => verifyUser.mutate({ id: user.id })}
                                className="text-green-400 hover:bg-[#2D3748] cursor-pointer">
                                <CheckCircle className="w-4 h-4 mr-2" /> E-Mail verifizieren
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuSeparator className="bg-[#2D3748]" />
                            {user.status !== "blocked" ? (
                              <DropdownMenuItem onClick={() => blockUser.mutate({ id: user.id })}
                                className="text-red-400 hover:bg-[#2D3748] cursor-pointer">
                                <Ban className="w-4 h-4 mr-2" /> Sperren
                              </DropdownMenuItem>
                            ) : (
                              <DropdownMenuItem onClick={() => unblockUser.mutate({ id: user.id })}
                                className="text-green-400 hover:bg-[#2D3748] cursor-pointer">
                                <CheckCircle className="w-4 h-4 mr-2" /> Entsperren
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuItem onClick={() => { setSelectedUser(user); setShowWarning(true); }}
                              className="text-yellow-400 hover:bg-[#2D3748] cursor-pointer">
                              <AlertTriangle className="w-4 h-4 mr-2" /> Warnung senden
                            </DropdownMenuItem>
                            <DropdownMenuSeparator className="bg-[#2D3748]" />
                            <DropdownMenuItem onClick={() => assignRole.mutate({ id: user.id, role: "seller" })}
                              className="text-blue-400 hover:bg-[#2D3748] cursor-pointer">
                              <Shield className="w-4 h-4 mr-2" /> Rolle: Verkäufer
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => assignRole.mutate({ id: user.id, role: "admin" })}
                              className="text-red-400 hover:bg-[#2D3748] cursor-pointer">
                              <Shield className="w-4 h-4 mr-2" /> Rolle: Admin
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => assignRole.mutate({ id: user.id, role: "customer" })}
                              className="text-[#94A3B8] hover:bg-[#2D3748] cursor-pointer">
                              <Shield className="w-4 h-4 mr-2" /> Rolle: Kunde
                            </DropdownMenuItem>
                            <DropdownMenuSeparator className="bg-[#2D3748]" />
                            <DropdownMenuItem
                              onClick={() => { if (confirm("Benutzer wirklich löschen?")) deleteUser.mutate({ id: user.id }); }}
                              className="text-red-400 hover:bg-[#2D3748] cursor-pointer">
                              <Trash2 className="w-4 h-4 mr-2" /> Löschen
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                  {!data?.items?.length && (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-10 text-[#64748B]">Keine Benutzer gefunden</TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="px-5 py-3 border-t border-[#1E293B] flex items-center justify-between">
              <p className="text-sm text-[#64748B]">Seite {page} von {totalPages}</p>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(p => p - 1)}
                  className="border-[#1E293B] text-[#94A3B8] h-8">
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}
                  className="border-[#1E293B] text-[#94A3B8] h-8">
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* User Detail Modal */}
      {selectedUser && !showWarning && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#111827] border border-[#1E293B] rounded-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b border-[#1E293B]">
              <h2 className="text-lg font-semibold text-[#F1F5F9]">Nutzerprofil</h2>
              <Button variant="ghost" size="sm" onClick={() => setSelectedUser(null)} className="text-[#64748B]">
                <X className="w-4 h-4" />
              </Button>
            </div>
            <div className="p-6 space-y-5">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#6366F1] to-[#8B5CF6] flex items-center justify-center text-white text-2xl font-bold">
                  {((selectedUser.name ?? selectedUser.email ?? "?") as string)[0].toUpperCase()}
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-[#F1F5F9]">{selectedUser.name ?? "—"}</h3>
                  <p className="text-sm text-[#64748B]">{selectedUser.email}</p>
                  <div className="flex gap-2 mt-1">
                    <Badge className={roleColors[selectedUser.role]}>{selectedUser.role}</Badge>
                    <Badge className={statusColors[selectedUser.status]}>{selectedUser.status}</Badge>
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div><p className="text-[#64748B]">ID</p><p className="text-[#F1F5F9] font-mono">#{selectedUser.id}</p></div>
                <div><p className="text-[#64748B]">Registriert</p><p className="text-[#F1F5F9]">{formatDate(selectedUser.createdAt)}</p></div>
                <div><p className="text-[#64748B]">E-Mail verifiziert</p><p className={selectedUser.emailVerified ? "text-green-400" : "text-red-400"}>{selectedUser.emailVerified ? "Ja" : "Nein"}</p></div>
                <div><p className="text-[#64748B]">2FA</p><p className={(selectedUser as any).twoFactorEnabled ? "text-green-400" : "text-[#64748B]"}>{(selectedUser as any).twoFactorEnabled ? "Aktiv" : "Inaktiv"}</p></div>
              </div>
              {userDetail?.orders && userDetail.orders.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium text-[#94A3B8] mb-2">Letzte Bestellungen</h4>
                  <div className="space-y-2">
                    {userDetail.orders.map((o: any) => (
                      <div key={o.id} className="flex items-center justify-between bg-[#0F172A] rounded-lg px-4 py-2">
                        <span className="text-sm text-[#F1F5F9] font-mono">{o.orderNumber}</span>
                        <span className="text-sm text-[#F1F5F9]">{Number(o.total).toFixed(2)}€</span>
                        <span className={`text-xs px-2 py-0.5 rounded-full ${o.status === "completed" ? "bg-green-500/20 text-green-400" : "bg-yellow-500/20 text-yellow-400"}`}>{o.status}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {userDetail?.loginHistory && userDetail.loginHistory.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium text-[#94A3B8] mb-2">Login-Historie</h4>
                  <div className="space-y-1 max-h-32 overflow-y-auto">
                    {userDetail.loginHistory.map((log: any) => (
                      <div key={log.id} className="flex items-center justify-between text-xs bg-[#0F172A] rounded px-3 py-1.5">
                        <span className="text-[#94A3B8]">{log.message}</span>
                        <span className="text-[#64748B]">{formatDate(log.createdAt)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Warning Modal */}
      {showWarning && selectedUser && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#111827] border border-[#1E293B] rounded-xl w-full max-w-md">
            <div className="flex items-center justify-between px-6 py-4 border-b border-[#1E293B]">
              <h2 className="text-base font-semibold text-[#F1F5F9]">Warnung senden</h2>
              <Button variant="ghost" size="sm" onClick={() => { setShowWarning(false); setWarningMsg(""); }} className="text-[#64748B]">
                <X className="w-4 h-4" />
              </Button>
            </div>
            <div className="p-6 space-y-4">
              <p className="text-sm text-[#94A3B8]">An: <span className="text-[#F1F5F9]">{selectedUser.name ?? selectedUser.email}</span></p>
              <textarea
                placeholder="Nachricht..."
                value={warningMsg}
                onChange={e => setWarningMsg(e.target.value)}
                rows={4}
                className="w-full bg-[#0F172A] border border-[#1E293B] text-[#F1F5F9] rounded-lg px-3 py-2 text-sm placeholder:text-[#64748B] resize-none"
              />
              <div className="flex gap-3 justify-end">
                <Button variant="outline" onClick={() => { setShowWarning(false); setWarningMsg(""); }} className="border-[#1E293B] text-[#94A3B8]">Abbrechen</Button>
                <Button
                  onClick={() => sendWarning.mutate({ userId: selectedUser.id, subject: "Verwarnung", message: warningMsg })}
                  disabled={!warningMsg.trim() || sendWarning.isPending}
                  className="bg-yellow-600 hover:bg-yellow-700 text-white"
                >
                  {sendWarning.isPending ? "Sende..." : "Warnung senden"}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
