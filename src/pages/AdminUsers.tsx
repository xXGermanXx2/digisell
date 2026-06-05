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
  Trash2, Eye, AlertTriangle, X, ChevronLeft, ChevronRight,
  Crown, Star, Zap, Coins, Plus, Minus
} from "lucide-react";
import { toast } from "sonner";

const PLAN_COLORS: Record<string, string> = {
  free: "bg-gray-500/20 text-gray-300",
  premium: "bg-indigo-500/20 text-indigo-300",
  business: "bg-violet-500/20 text-violet-300",
  enterprise: "bg-amber-500/20 text-amber-300",
};
const PLAN_LABELS: Record<string, string> = { free: "Free", premium: "Premium", business: "Business", enterprise: "Enterprise" };

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
  const [warningForm, setWarningForm] = useState({ subject: "Verwarnung", message: "", reason: "" });
  const [showPlanModal, setShowPlanModal] = useState(false);
  const [planForm, setPlanForm] = useState({ plan: "free", expiresAt: "", isLifetime: false, notes: "" });
  const [showLimitsModal, setShowLimitsModal] = useState(false);
  const [limitsForm, setLimitsForm] = useState({ shopLimit: 1, productLimit: 10, storageLimit: 500 });
  const [showCreditsModal, setShowCreditsModal] = useState(false);
  const [creditsForm, setCreditsForm] = useState({ amount: "", description: "", action: "credit" as "credit" | "debit" });

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
  const { data: warningHistory, isLoading: warningHistoryLoading } = trpc.admin.listWarnings.useQuery(
    { userId: selectedUser?.id, limit: 50 },
    { enabled: !!selectedUser?.id && showWarning }
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
    onSuccess: (result) => {
      toast.success(result.emailSent ? "Warnung gespeichert und per E-Mail gesendet" : "Warnung gespeichert; E-Mail-Versand nicht konfiguriert oder fehlgeschlagen");
      setWarningForm({ subject: "Verwarnung", message: "", reason: "" });
      utils.admin.listWarnings.invalidate();
    },
    onError: (e) => toast.error(e.message),
  });
  const deleteWarning = trpc.admin.deleteWarning.useMutation({
    onSuccess: () => { toast.success("Warnung gelöscht"); utils.admin.listWarnings.invalidate(); },
    onError: (e) => toast.error(e.message),
  });
  const setPlan = trpc.subscription.adminSetPlan.useMutation({
    onSuccess: () => { toast.success("Tarif geändert"); setShowPlanModal(false); utils.admin.listUsers.invalidate(); },
    onError: (e) => toast.error(e.message),
  });
  const setLimits = trpc.subscription.adminSetLimits.useMutation({
    onSuccess: () => { toast.success("Limits gespeichert"); setShowLimitsModal(false); utils.admin.listUsers.invalidate(); },
    onError: (e) => toast.error(e.message),
  });
  const revokePremium = trpc.subscription.adminRevokePremium.useMutation({
    onSuccess: () => { toast.success("Premium entzogen"); utils.admin.listUsers.invalidate(); },
    onError: (e) => toast.error(e.message),
  });
  const grantCredits = trpc.credits.adminGrantPlatformCredits.useMutation({
    onSuccess: () => { toast.success("Guthaben gutgeschrieben ✓"); setShowCreditsModal(false); setCreditsForm({ amount: "", description: "", action: "credit" }); },
    onError: (e) => toast.error(e.message),
  });
  const deductCredits = trpc.credits.adminDeductPlatformCredits.useMutation({
    onSuccess: () => { toast.success("Guthaben abgezogen ✓"); setShowCreditsModal(false); setCreditsForm({ amount: "", description: "", action: "credit" }); },
    onError: (e) => toast.error(e.message),
  });

  const totalPages = Math.ceil((data?.total ?? 0) / 20);

  return (
    <AdminLayout>
      <div className="space-y-5">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
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
              <SelectTrigger className="w-full sm:w-36 bg-[#0F172A] border-[#1E293B] text-[#F1F5F9]">
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
              <SelectTrigger className="w-full sm:w-36 bg-[#0F172A] border-[#1E293B] text-[#F1F5F9]">
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
                    <TableHead className="text-[#64748B]">Tarif</TableHead>
                    <TableHead className="text-[#64748B]">Shops</TableHead>
                    <TableHead className="text-[#64748B]">Status</TableHead>
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
                        <div className="flex items-center gap-1.5">
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${PLAN_COLORS[(user as any).subscriptionPlan ?? "free"]}`}>
                            {PLAN_LABELS[(user as any).subscriptionPlan ?? "free"]}
                          </span>
                          {(user as any).isLifetimePremium && <span className="text-amber-400 text-xs">★</span>}
                          {(user as any).subscriptionStatus === "expired" && <span className="text-xs text-red-400">Abgelaufen</span>}
                        </div>
                      </TableCell>
                      <TableCell className="text-[#94A3B8] text-sm">
                        {(user as any).shopCount ?? 0} / {(user as any).shopLimit === -1 ? "∞" : ((user as any).shopLimit ?? 1)}
                      </TableCell>
                      <TableCell>
                        <Badge className={statusColors[user.status] ?? ""}>{user.status}</Badge>
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
                            <DropdownMenuItem onClick={() => { setSelectedUser(user); setPlanForm({ plan: (user as any).subscriptionPlan ?? "free", expiresAt: "", isLifetime: !!(user as any).isLifetimePremium, notes: "" }); setShowPlanModal(true); }}
                              className="text-indigo-400 hover:bg-[#2D3748] cursor-pointer">
                              <Crown className="w-4 h-4 mr-2" /> Tarif ändern
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => { setSelectedUser(user); setLimitsForm({ shopLimit: (user as any).shopLimit ?? 1, productLimit: (user as any).productLimit ?? 10, storageLimit: (user as any).storageLimit ?? 500 }); setShowLimitsModal(true); }}
                              className="text-violet-400 hover:bg-[#2D3748] cursor-pointer">
                              <Zap className="w-4 h-4 mr-2" /> Limits setzen
                            </DropdownMenuItem>
                            {(user as any).subscriptionPlan !== "free" && (
                              <DropdownMenuItem onClick={() => { if (confirm("Premium wirklich entziehen?")) revokePremium.mutate({ userId: user.id }); }}
                                className="text-orange-400 hover:bg-[#2D3748] cursor-pointer">
                                <Star className="w-4 h-4 mr-2" /> Premium entziehen
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuSeparator className="bg-[#2D3748]" />
                            <DropdownMenuItem onClick={() => { setSelectedUser(user); setCreditsForm({ amount: "", description: "", action: "credit" }); setShowCreditsModal(true); }}
                              className="text-emerald-400 hover:bg-[#2D3748] cursor-pointer">
                              <Coins className="w-4 h-4 mr-2" /> Guthaben vergeben
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
            <div className="px-5 py-3 border-t border-[#1E293B] flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
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
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 px-6 py-4 border-b border-[#1E293B]">
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
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
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
                      <div key={o.id} className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 bg-[#0F172A] rounded-lg px-4 py-2">
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
                      <div key={log.id} className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 text-xs bg-[#0F172A] rounded px-3 py-1.5">
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


      {/* Plan Modal */}
      {showPlanModal && selectedUser && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#111827] border border-[#1E293B] rounded-xl w-full max-w-md">
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 px-6 py-4 border-b border-[#1E293B]">
              <h2 className="text-base font-semibold text-[#F1F5F9] flex items-center gap-2"><Crown className="w-4 h-4 text-indigo-400" />Tarif ändern</h2>
              <Button variant="ghost" size="sm" onClick={() => setShowPlanModal(false)} className="text-[#64748B]"><X className="w-4 h-4" /></Button>
            </div>
            <div className="p-6 space-y-4">
              <p className="text-sm text-[#94A3B8]">Nutzer: <span className="text-[#F1F5F9] font-medium">{selectedUser.name ?? selectedUser.email}</span></p>
              <div>
                <label className="block text-xs text-[#64748B] mb-1.5">Tarif</label>
                <select value={planForm.plan} onChange={e => setPlanForm(f => ({ ...f, plan: e.target.value }))}
                  className="w-full bg-[#0F172A] border border-[#1E293B] text-[#F1F5F9] rounded-lg px-3 py-2 text-sm">
                  <option value="free">Free (1 Shop, 10 Produkte)</option>
                  <option value="premium">Premium (5 Shops, 100 Produkte)</option>
                  <option value="business">Business (20 Shops, 500 Produkte)</option>
                  <option value="enterprise">Enterprise (Unbegrenzt)</option>
                </select>
              </div>
              <div>
                <label className="block text-xs text-[#64748B] mb-1.5">Ablaufdatum (leer = kein Ablauf)</label>
                <input type="date" value={planForm.expiresAt} onChange={e => setPlanForm(f => ({ ...f, expiresAt: e.target.value }))}
                  className="w-full bg-[#0F172A] border border-[#1E293B] text-[#F1F5F9] rounded-lg px-3 py-2 text-sm" />
              </div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={planForm.isLifetime} onChange={e => setPlanForm(f => ({ ...f, isLifetime: e.target.checked }))} className="rounded" />
                <span className="text-sm text-[#94A3B8]">Lifetime Premium (kein Ablauf)</span>
              </label>
              <div>
                <label className="block text-xs text-[#64748B] mb-1.5">Notiz (optional)</label>
                <input value={planForm.notes} onChange={e => setPlanForm(f => ({ ...f, notes: e.target.value }))}
                  placeholder="z.B. Manuell vergeben, Gewinnspiel..."
                  className="w-full bg-[#0F172A] border border-[#1E293B] text-[#F1F5F9] rounded-lg px-3 py-2 text-sm placeholder:text-[#64748B]" />
              </div>
              <div className="flex gap-3 justify-end pt-2">
                <Button variant="outline" onClick={() => setShowPlanModal(false)} className="border-[#1E293B] text-[#94A3B8]">Abbrechen</Button>
                <Button onClick={() => setPlan.mutate({ userId: selectedUser.id, plan: planForm.plan as any, expiresAt: planForm.expiresAt || undefined, isLifetimePremium: planForm.isLifetime, notes: planForm.notes || undefined })}
                  disabled={setPlan.isPending} className="bg-indigo-600 hover:bg-indigo-700 text-white">
                  {setPlan.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Speichern"}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Limits Modal */}
      {showLimitsModal && selectedUser && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#111827] border border-[#1E293B] rounded-xl w-full max-w-md">
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 px-6 py-4 border-b border-[#1E293B]">
              <h2 className="text-base font-semibold text-[#F1F5F9] flex items-center gap-2"><Zap className="w-4 h-4 text-violet-400" />Individuelle Limits</h2>
              <Button variant="ghost" size="sm" onClick={() => setShowLimitsModal(false)} className="text-[#64748B]"><X className="w-4 h-4" /></Button>
            </div>
            <div className="p-6 space-y-4">
              <p className="text-sm text-[#94A3B8]">Nutzer: <span className="text-[#F1F5F9] font-medium">{selectedUser.name ?? selectedUser.email}</span></p>
              <p className="text-xs text-[#64748B]">-1 = unbegrenzt</p>
              {[
                { label: "Shop-Limit", key: "shopLimit" as const },
                { label: "Produkt-Limit", key: "productLimit" as const },
                { label: "Speicher-Limit (MB)", key: "storageLimit" as const },
              ].map(({ label, key }) => (
                <div key={key}>
                  <label className="block text-xs text-[#64748B] mb-1.5">{label}</label>
                  <input type="number" min={-1} value={limitsForm[key]} onChange={e => setLimitsForm(f => ({ ...f, [key]: Number(e.target.value) }))}
                    className="w-full bg-[#0F172A] border border-[#1E293B] text-[#F1F5F9] rounded-lg px-3 py-2 text-sm" />
                </div>
              ))}
              <div className="flex gap-3 justify-end pt-2">
                <Button variant="outline" onClick={() => setShowLimitsModal(false)} className="border-[#1E293B] text-[#94A3B8]">Abbrechen</Button>
                <Button onClick={() => setLimits.mutate({ userId: selectedUser.id, ...limitsForm })}
                  disabled={setLimits.isPending} className="bg-violet-600 hover:bg-violet-700 text-white">
                  {setLimits.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Speichern"}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Warning Modal */}
      {showWarning && selectedUser && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#111827] border border-[#1E293B] rounded-xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
            <div className="flex flex-row items-center justify-between gap-3 px-4 sm:px-6 py-4 border-b border-[#1E293B]">
              <div>
                <h2 className="text-base font-semibold text-[#F1F5F9]">Warnung senden</h2>
                <p className="text-xs text-[#64748B] mt-1">An: <span className="text-[#CBD5E1]">{selectedUser.name ?? selectedUser.email}</span></p>
              </div>
              <Button variant="ghost" size="sm" onClick={() => { setShowWarning(false); setWarningForm({ subject: "Verwarnung", message: "", reason: "" }); }} className="text-[#64748B]">
                <X className="w-4 h-4" />
              </Button>
            </div>
            <div className="p-4 sm:p-6 space-y-5 overflow-y-auto">
              <div className="grid gap-4">
                <div>
                  <label className="block text-xs font-medium text-[#94A3B8] mb-1.5">Betreff</label>
                  <Input
                    value={warningForm.subject}
                    onChange={e => setWarningForm(f => ({ ...f, subject: e.target.value }))}
                    placeholder="z.B. Richtlinienverstoß"
                    className="bg-[#0F172A] border-[#1E293B] text-[#F1F5F9] placeholder:text-[#64748B]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-[#94A3B8] mb-1.5">Nachricht an den Nutzer</label>
                  <textarea
                    placeholder="Was soll dem Nutzer direkt angezeigt werden?"
                    value={warningForm.message}
                    onChange={e => setWarningForm(f => ({ ...f, message: e.target.value }))}
                    rows={4}
                    className="w-full bg-[#0F172A] border border-[#1E293B] text-[#F1F5F9] rounded-lg px-3 py-2 text-sm placeholder:text-[#64748B] resize-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-[#94A3B8] mb-1.5">Begründung</label>
                  <textarea
                    placeholder="Warum wird diese Warnung ausgesprochen?"
                    value={warningForm.reason}
                    onChange={e => setWarningForm(f => ({ ...f, reason: e.target.value }))}
                    rows={3}
                    className="w-full bg-[#0F172A] border border-[#1E293B] text-[#F1F5F9] rounded-lg px-3 py-2 text-sm placeholder:text-[#64748B] resize-none"
                  />
                </div>
              </div>
              <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-3">
                <Button variant="outline" onClick={() => { setShowWarning(false); setWarningForm({ subject: "Verwarnung", message: "", reason: "" }); }} className="border-[#1E293B] text-[#94A3B8]">Schließen</Button>
                <Button
                  onClick={() => sendWarning.mutate({ userId: selectedUser.id, subject: warningForm.subject, message: warningForm.message, reason: warningForm.reason })}
                  disabled={!warningForm.subject.trim() || !warningForm.message.trim() || !warningForm.reason.trim() || sendWarning.isPending}
                  className="bg-yellow-600 hover:bg-yellow-700 text-white"
                >
                  {sendWarning.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Warnung senden"}
                </Button>
              </div>
              <div className="border-t border-[#1E293B] pt-5">
                <div className="flex items-center justify-between gap-3 mb-3">
                  <h3 className="text-sm font-semibold text-[#F1F5F9]">Bisherige Warnungen</h3>
                  <Badge className="bg-yellow-500/10 text-yellow-300">{warningHistory?.total ?? 0}</Badge>
                </div>
                {warningHistoryLoading ? (
                  <div className="flex items-center gap-2 text-sm text-[#94A3B8]"><Loader2 className="w-4 h-4 animate-spin" /> Lade Warnungen...</div>
                ) : !warningHistory?.items?.length ? (
                  <p className="text-sm text-[#64748B]">Für diesen Nutzer wurden noch keine Warnungen gespeichert.</p>
                ) : (
                  <div className="space-y-3">
                    {warningHistory.items.map((warning: any) => (
                      <div key={warning.id} className="rounded-lg border border-[#1E293B] bg-[#0F172A] p-3">
                        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                          <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                              <p className="text-sm font-semibold text-[#F1F5F9] break-words">{warning.subject}</p>
                              {warning.isDismissed && <Badge className="bg-slate-700 text-slate-300">geschlossen</Badge>}
                            </div>
                            <p className="text-xs text-[#64748B] mt-1">{formatDate(warning.createdAt)} · Admin: {warning.admin?.name ?? warning.admin?.email ?? "—"}</p>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => deleteWarning.mutate({ id: warning.id })}
                            disabled={deleteWarning.isPending}
                            className="text-red-400 hover:text-red-300 hover:bg-red-500/10 shrink-0"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                        <p className="text-sm text-[#CBD5E1] mt-3 whitespace-pre-wrap break-words">{warning.message}</p>
                        <p className="text-xs text-[#94A3B8] mt-2 whitespace-pre-wrap break-words"><span className="font-semibold text-yellow-300">Begründung:</span> {warning.reason}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
      {/* Credits Modal */}
      {showCreditsModal && selectedUser && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#111827] border border-[#1E293B] rounded-xl w-full max-w-md">
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 px-6 py-4 border-b border-[#1E293B]">
              <h2 className="text-base font-semibold text-[#F1F5F9] flex items-center gap-2">
                <Coins className="w-4 h-4 text-emerald-400" /> Plattform-Guthaben
              </h2>
              <Button variant="ghost" size="sm" onClick={() => setShowCreditsModal(false)} className="text-[#64748B]"><X className="w-4 h-4" /></Button>
            </div>
            <div className="p-6 space-y-4">
              <p className="text-sm text-[#94A3B8]">Nutzer: <span className="text-[#F1F5F9] font-medium">{selectedUser.name ?? selectedUser.email}</span></p>
              {/* Action Toggle */}
              <div className="flex gap-2 p-1 bg-[#0F172A] rounded-lg">
                <button onClick={() => setCreditsForm(f => ({ ...f, action: "credit" }))}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-md text-sm font-medium transition-colors ${
                    creditsForm.action === "credit" ? "bg-emerald-600 text-white" : "text-[#64748B] hover:text-[#F1F5F9]"
                  }`}>
                  <Plus className="w-3.5 h-3.5" /> Gutschreiben
                </button>
                <button onClick={() => setCreditsForm(f => ({ ...f, action: "debit" }))}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-md text-sm font-medium transition-colors ${
                    creditsForm.action === "debit" ? "bg-red-600 text-white" : "text-[#64748B] hover:text-[#F1F5F9]"
                  }`}>
                  <Minus className="w-3.5 h-3.5" /> Abziehen
                </button>
              </div>
              <div>
                <label className="block text-xs text-[#64748B] mb-1.5">Betrag (Credits)</label>
                <input type="number" min="1" value={creditsForm.amount}
                  onChange={e => setCreditsForm(f => ({ ...f, amount: e.target.value }))}
                  placeholder="z.B. 100"
                  className="w-full bg-[#0F172A] border border-[#1E293B] text-[#F1F5F9] rounded-lg px-3 py-2 text-sm placeholder:text-[#64748B]" />
              </div>
              <div>
                <label className="block text-xs text-[#64748B] mb-1.5">Beschreibung (optional)</label>
                <input value={creditsForm.description}
                  onChange={e => setCreditsForm(f => ({ ...f, description: e.target.value }))}
                  placeholder="z.B. Bonus für treue Nutzung"
                  className="w-full bg-[#0F172A] border border-[#1E293B] text-[#F1F5F9] rounded-lg px-3 py-2 text-sm placeholder:text-[#64748B]" />
              </div>
              <div className="flex gap-3 justify-end pt-2">
                <Button variant="outline" onClick={() => setShowCreditsModal(false)} className="border-[#1E293B] text-[#94A3B8]">Abbrechen</Button>
                <Button
                  onClick={() => {
                    const amt = parseInt(creditsForm.amount);
                    if (!amt || amt < 1) return toast.error("Ungültiger Betrag");
                    if (creditsForm.action === "credit") {
                      grantCredits.mutate({ userId: selectedUser.id, amount: amt, description: creditsForm.description || undefined });
                    } else {
                      deductCredits.mutate({ userId: selectedUser.id, amount: amt, description: creditsForm.description || undefined });
                    }
                  }}
                  disabled={grantCredits.isPending || deductCredits.isPending}
                  className={creditsForm.action === "credit" ? "bg-emerald-600 hover:bg-emerald-700 text-white" : "bg-red-600 hover:bg-red-700 text-white"}
                >
                  {(grantCredits.isPending || deductCredits.isPending) ? <Loader2 className="w-4 h-4 animate-spin" /> : creditsForm.action === "credit" ? "Gutschreiben" : "Abziehen"}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
