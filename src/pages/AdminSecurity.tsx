import { useState } from "react";
import { trpc } from "@/providers/trpc";
import AdminLayout from "@/components/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  Shield, Plus, Trash2, CheckCircle, XCircle, Globe,
  Mail, Monitor, AlertTriangle, Loader2, RefreshCw, Ban,
} from "lucide-react";
import { toast } from "sonner";

export default function AdminSecurity() {
  const utils = trpc.useUtils();

  // Blocklist state
  const [blocklistType, setBlocklistType] = useState<"ip" | "email" | "domain">("ip");
  const [newValue, setNewValue] = useState("");
  const [newReason, setNewReason] = useState("");
  const [isAddOpen, setIsAddOpen] = useState(false);

  // Wörter-Sperrliste state
  const [newBannedWord, setNewBannedWord] = useState("");
  const [newBannedReason, setNewBannedReason] = useState("");
  const [newBannedMatchMode, setNewBannedMatchMode] = useState<"exact" | "contains">("contains");
  const [isAddWordOpen, setIsAddWordOpen] = useState(false);

  // Login-Logs state
  const [loginSuccess, setLoginSuccess] = useState<boolean | undefined>(undefined);
  const [loginPage, setLoginPage] = useState(1);

  // Queries
  const { data: blocklists, isLoading: blocklistsLoading } = trpc.admin.listBlocklists.useQuery({});
  const { data: bannedWords, isLoading: bannedWordsLoading } = trpc.admin.listBannedWords.useQuery({});
  const { data: loginLogs, isLoading: loginLogsLoading } = trpc.admin.getLoginLogs.useQuery({
    success: loginSuccess,
    page: loginPage,
    limit: 50,
  });

  // Mutations
  const addBlocklist = trpc.admin.addBlocklist.useMutation({
    onSuccess: () => {
      utils.admin.listBlocklists.invalidate();
      setNewValue("");
      setNewReason("");
      setIsAddOpen(false);
      toast.success("Eintrag zur Sperrliste hinzugefügt");
    },
    onError: (err) => toast.error(err.message),
  });

  const deleteBlocklist = trpc.admin.deleteBlocklist.useMutation({
    onSuccess: () => {
      utils.admin.listBlocklists.invalidate();
      toast.success("Eintrag entfernt");
    },
    onError: (err) => toast.error(err.message),
  });

  const addBannedWord = trpc.admin.addBannedWord.useMutation({
    onSuccess: () => {
      utils.admin.listBannedWords.invalidate();
      setNewBannedWord("");
      setNewBannedReason("");
      setNewBannedMatchMode("contains");
      setIsAddWordOpen(false);
      toast.success("Sperrwort hinzugefügt");
    },
    onError: (err) => toast.error(err.message),
  });

  const updateBannedWord = trpc.admin.updateBannedWord.useMutation({
    onSuccess: () => {
      utils.admin.listBannedWords.invalidate();
      toast.success("Sperrwort aktualisiert");
    },
    onError: (err) => toast.error(err.message),
  });

  const deleteBannedWord = trpc.admin.deleteBannedWord.useMutation({
    onSuccess: () => {
      utils.admin.listBannedWords.invalidate();
      toast.success("Sperrwort entfernt");
    },
    onError: (err) => toast.error(err.message),
  });

  const activeBannedWords = bannedWords?.filter((word) => word.isActive) ?? [];
  const inactiveBannedWords = bannedWords?.filter((word) => !word.isActive) ?? [];
  const ipList = blocklists?.filter((b) => b.type === "ip") ?? [];
  const emailList = blocklists?.filter((b) => b.type === "email") ?? [];
  const domainList = blocklists?.filter((b) => b.type === "domain") ?? [];

  const typeIcon = (type: string) => {
    if (type === "ip") return <Monitor className="w-4 h-4 text-red-400" />;
    if (type === "email") return <Mail className="w-4 h-4 text-yellow-400" />;
    return <Globe className="w-4 h-4 text-orange-400" />;
  };

  return (
    <AdminLayout>
      <div className="min-w-0 max-w-full space-y-6 overflow-x-hidden">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
          <div className="flex min-w-0 items-start gap-3">
            <Shield className="w-6 h-6 text-indigo-400" />
            <div className="min-w-0">
              <h1 className="text-xl font-bold text-[#F1F5F9]">Sicherheit</h1>
              <p className="break-words text-sm text-[#64748B]">Sperrlisten, Login-Protokolle & Sicherheitsüberwachung</p>
            </div>
          </div>
        </div>

        <Tabs defaultValue="blocklists" className="min-w-0 max-w-full">
          <TabsList className="w-full justify-start bg-[#111827] border border-[#1E293B] flex-wrap h-auto gap-1 p-1">
            <TabsTrigger value="blocklists" className="data-[state=active]:bg-[#6366F1] data-[state=active]:text-white text-[#94A3B8]">
              Sperrlisten
            </TabsTrigger>
            <TabsTrigger value="banned-words" className="data-[state=active]:bg-[#6366F1] data-[state=active]:text-white text-[#94A3B8]">
              Wörter-Sperrliste
            </TabsTrigger>
            <TabsTrigger value="login-logs" className="data-[state=active]:bg-[#6366F1] data-[state=active]:text-white text-[#94A3B8]">
              Login-Protokolle
            </TabsTrigger>
          </TabsList>

          {/* ── Sperrlisten ── */}
          <TabsContent value="blocklists" className="min-w-0 space-y-4 mt-4">
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
              <div className="flex flex-wrap gap-3">
                <div className="bg-[#111827] rounded-lg border border-[#1E293B] px-4 py-2 flex min-w-0 items-center gap-2">
                  <Monitor className="w-4 h-4 text-red-400" />
                  <span className="text-sm text-[#F1F5F9] font-semibold">{ipList.length}</span>
                  <span className="text-xs text-[#64748B]">IPs gesperrt</span>
                </div>
                <div className="bg-[#111827] rounded-lg border border-[#1E293B] px-4 py-2 flex min-w-0 items-center gap-2">
                  <Mail className="w-4 h-4 text-yellow-400" />
                  <span className="text-sm text-[#F1F5F9] font-semibold">{emailList.length}</span>
                  <span className="text-xs text-[#64748B]">E-Mails gesperrt</span>
                </div>
                <div className="bg-[#111827] rounded-lg border border-[#1E293B] px-4 py-2 flex min-w-0 items-center gap-2">
                  <Globe className="w-4 h-4 text-orange-400" />
                  <span className="text-sm text-[#F1F5F9] font-semibold">{domainList.length}</span>
                  <span className="text-xs text-[#64748B]">Domains gesperrt</span>
                </div>
              </div>

              <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
                <DialogTrigger asChild>
                  <Button className="w-full sm:w-auto bg-[#6366F1] hover:bg-[#5558E3] text-white">
                    <Plus className="w-4 h-4 mr-2" /> Eintrag hinzufügen
                  </Button>
                </DialogTrigger>
                <DialogContent className="w-[calc(100vw-1rem)] sm:w-full max-h-[calc(100dvh-2rem)] overflow-y-auto bg-[#111827] border-[#1E293B] text-[#F1F5F9] p-4 sm:p-6">
                  <DialogHeader>
                    <DialogTitle>Zur Sperrliste hinzufügen</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 mt-2">
                    <div>
                      <Label className="text-[#94A3B8] text-sm">Typ</Label>
                      <Select value={blocklistType} onValueChange={(v) => setBlocklistType(v as any)}>
                        <SelectTrigger className="mt-1 w-full bg-[#0F172A] border-[#1E293B] text-[#F1F5F9]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-[#111827] border-[#1E293B]">
                          <SelectItem value="ip">IP-Adresse</SelectItem>
                          <SelectItem value="email">E-Mail</SelectItem>
                          <SelectItem value="domain">Domain</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label className="text-[#94A3B8] text-sm">
                        {blocklistType === "ip" ? "IP-Adresse" : blocklistType === "email" ? "E-Mail-Adresse" : "Domain"}
                      </Label>
                      <Input
                        value={newValue}
                        onChange={(e) => setNewValue(e.target.value)}
                        placeholder={blocklistType === "ip" ? "z.B. 192.168.1.1" : blocklistType === "email" ? "z.B. spam@example.com" : "z.B. example.com"}
                        className="mt-1 bg-[#0F172A] border-[#1E293B] text-[#F1F5F9]"
                      />
                    </div>
                    <div>
                      <Label className="text-[#94A3B8] text-sm">Grund (optional)</Label>
                      <Input
                        value={newReason}
                        onChange={(e) => setNewReason(e.target.value)}
                        placeholder="z.B. Spam, Betrug, Missbrauch..."
                        className="mt-1 bg-[#0F172A] border-[#1E293B] text-[#F1F5F9]"
                      />
                    </div>
                    <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 pt-2">
                      <Button variant="outline" onClick={() => setIsAddOpen(false)} className="w-full sm:w-auto border-[#1E293B] text-[#94A3B8]">
                        Abbrechen
                      </Button>
                      <Button
                        onClick={() => addBlocklist.mutate({ type: blocklistType, value: newValue, reason: newReason || undefined })}
                        disabled={!newValue.trim() || addBlocklist.isPending}
                        className="w-full sm:w-auto bg-[#6366F1] hover:bg-[#5558E3] text-white"
                      >
                        {addBlocklist.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Hinzufügen"}
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>

            {/* Blocklist-Tabs */}
            <Tabs defaultValue="ip">
              <TabsList className="bg-[#0F172A] border border-[#1E293B] flex-wrap h-auto gap-1 p-1">
                <TabsTrigger value="ip" className="data-[state=active]:bg-red-500/20 data-[state=active]:text-red-400 text-[#94A3B8]">
                  <Monitor className="w-3.5 h-3.5 mr-1" /> IP ({ipList.length})
                </TabsTrigger>
                <TabsTrigger value="email" className="data-[state=active]:bg-yellow-500/20 data-[state=active]:text-yellow-400 text-[#94A3B8]">
                  <Mail className="w-3.5 h-3.5 mr-1" /> E-Mail ({emailList.length})
                </TabsTrigger>
                <TabsTrigger value="domain" className="data-[state=active]:bg-orange-500/20 data-[state=active]:text-orange-400 text-[#94A3B8]">
                  <Globe className="w-3.5 h-3.5 mr-1" /> Domain ({domainList.length})
                </TabsTrigger>
              </TabsList>

              {(["ip", "email", "domain"] as const).map((type) => {
                const list = type === "ip" ? ipList : type === "email" ? emailList : domainList;
                return (
                  <TabsContent key={type} value={type} className="mt-3">
                    <div className="max-w-full overflow-hidden rounded-xl border border-[#1E293B] bg-[#111827]">
                      {blocklistsLoading ? (
                        <div className="flex items-center justify-center py-12">
                          <Loader2 className="w-6 h-6 text-[#6366F1] animate-spin" />
                        </div>
                      ) : list.length === 0 ? (
                        <div className="text-center py-12">
                          <AlertTriangle className="w-8 h-8 text-[#64748B] mx-auto mb-2" />
                          <p className="text-sm text-[#64748B]">Keine Einträge in der {type === "ip" ? "IP" : type === "email" ? "E-Mail" : "Domain"}-Sperrliste</p>
                        </div>
                      ) : (
                        <Table>
                          <TableHeader>
                            <TableRow className="border-[#1E293B] hover:bg-transparent">
                              <TableHead className="text-[#64748B]">Wert</TableHead>
                              <TableHead className="text-[#64748B]">Grund</TableHead>
                              <TableHead className="text-[#64748B]">Hinzugefügt am</TableHead>
                              <TableHead className="text-[#64748B] text-right">Aktionen</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {list.map((entry) => (
                              <TableRow key={entry.id} className="border-[#1E293B] hover:bg-[#1A2235]/30">
                                <TableCell>
                                  <div className="flex flex-wrap items-center gap-2">
                                    {typeIcon(entry.type)}
                                    <span className="text-[#F1F5F9] font-mono text-sm break-all">{entry.value}</span>
                                  </div>
                                </TableCell>
                                <TableCell className="text-[#94A3B8] text-sm">{entry.reason ?? "—"}</TableCell>
                                <TableCell className="text-[#64748B] text-sm">
                                  {entry.createdAt ? new Date(entry.createdAt).toLocaleDateString("de-DE") : "—"}
                                </TableCell>
                                <TableCell className="text-right">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => {
                                      if (confirm(`Eintrag "${entry.value}" wirklich entfernen?`)) {
                                        deleteBlocklist.mutate({ id: entry.id });
                                      }
                                    }}
                                    className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </Button>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      )}
                    </div>
                  </TabsContent>
                );
              })}
            </Tabs>
          </TabsContent>

          {/* ── Wörter-Sperrliste ── */}
          <TabsContent value="banned-words" className="min-w-0 space-y-4 mt-4">
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
              <div className="flex flex-wrap gap-3">
                <div className="bg-[#111827] rounded-lg border border-[#1E293B] px-4 py-2 flex min-w-0 items-center gap-2">
                  <Ban className="w-4 h-4 text-red-400" />
                  <span className="text-sm text-[#F1F5F9] font-semibold">{activeBannedWords.length}</span>
                  <span className="text-xs text-[#64748B]">aktive Wörter</span>
                </div>
                <div className="bg-[#111827] rounded-lg border border-[#1E293B] px-4 py-2 flex min-w-0 items-center gap-2">
                  <XCircle className="w-4 h-4 text-[#64748B]" />
                  <span className="text-sm text-[#F1F5F9] font-semibold">{inactiveBannedWords.length}</span>
                  <span className="text-xs text-[#64748B]">deaktiviert</span>
                </div>
              </div>

              <Dialog open={isAddWordOpen} onOpenChange={setIsAddWordOpen}>
                <DialogTrigger asChild>
                  <Button className="w-full sm:w-auto bg-[#6366F1] hover:bg-[#5558E3] text-white">
                    <Plus className="w-4 h-4 mr-2" /> Sperrwort hinzufügen
                  </Button>
                </DialogTrigger>
                <DialogContent className="w-[calc(100vw-1rem)] sm:w-full max-h-[calc(100dvh-2rem)] overflow-y-auto bg-[#111827] border-[#1E293B] text-[#F1F5F9] p-4 sm:p-6">
                  <DialogHeader>
                    <DialogTitle>Neues Sperrwort hinzufügen</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 mt-2">
                    <div>
                      <Label className="text-[#94A3B8] text-sm">Wort oder Begriff</Label>
                      <Input
                        value={newBannedWord}
                        onChange={(e) => setNewBannedWord(e.target.value)}
                        placeholder="z.B. verbotener Begriff"
                        className="mt-1 bg-[#0F172A] border-[#1E293B] text-[#F1F5F9]"
                      />
                    </div>
                    <div>
                      <Label className="text-[#94A3B8] text-sm">Trefferart</Label>
                      <Select value={newBannedMatchMode} onValueChange={(value) => setNewBannedMatchMode(value as "exact" | "contains")}>
                        <SelectTrigger className="mt-1 w-full bg-[#0F172A] border-[#1E293B] text-[#F1F5F9]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-[#111827] border-[#1E293B]">
                          <SelectItem value="contains">Enthält Begriff</SelectItem>
                          <SelectItem value="exact">Ganzes Wort</SelectItem>
                        </SelectContent>
                      </Select>
                      <p className="text-xs text-[#64748B] mt-1">
                        „Enthält Begriff“ sperrt auch zusammengesetzte Treffer. „Ganzes Wort“ sperrt nur eigenständige Wörter.
                      </p>
                    </div>
                    <div>
                      <Label className="text-[#94A3B8] text-sm">Grund / interne Notiz (optional)</Label>
                      <Textarea
                        value={newBannedReason}
                        onChange={(e) => setNewBannedReason(e.target.value)}
                        placeholder="z.B. Richtlinienverstoß, Markenmissbrauch, Betrug..."
                        className="mt-1 bg-[#0F172A] border-[#1E293B] text-[#F1F5F9]"
                      />
                    </div>
                    <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 pt-2">
                      <Button variant="outline" onClick={() => setIsAddWordOpen(false)} className="w-full sm:w-auto border-[#1E293B] text-[#94A3B8]">
                        Abbrechen
                      </Button>
                      <Button
                        onClick={() => addBannedWord.mutate({
                          word: newBannedWord,
                          matchMode: newBannedMatchMode,
                          reason: newBannedReason || undefined,
                          isActive: true,
                        })}
                        disabled={!newBannedWord.trim() || addBannedWord.isPending}
                        className="w-full sm:w-auto bg-[#6366F1] hover:bg-[#5558E3] text-white"
                      >
                        {addBannedWord.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Hinzufügen"}
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>

            <div className="max-w-full overflow-hidden rounded-xl border border-[#1E293B] bg-[#111827]">
              {bannedWordsLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-6 h-6 text-[#6366F1] animate-spin" />
                </div>
              ) : !bannedWords || bannedWords.length === 0 ? (
                <div className="text-center py-12">
                  <Ban className="w-8 h-8 text-[#64748B] mx-auto mb-2" />
                  <p className="text-sm text-[#64748B]">Noch keine Sperrwörter hinterlegt.</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow className="border-[#1E293B] hover:bg-transparent">
                      <TableHead className="text-[#64748B]">Wort</TableHead>
                      <TableHead className="text-[#64748B]">Trefferart</TableHead>
                      <TableHead className="text-[#64748B]">Status</TableHead>
                      <TableHead className="text-[#64748B]">Grund</TableHead>
                      <TableHead className="text-[#64748B]">Hinzugefügt am</TableHead>
                      <TableHead className="text-[#64748B] text-right">Aktionen</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {bannedWords.map((entry) => (
                      <TableRow key={entry.id} className="border-[#1E293B] hover:bg-[#1A2235]/30">
                        <TableCell className="text-[#F1F5F9] font-mono text-sm break-all">{entry.word}</TableCell>
                        <TableCell>
                          <Badge className="bg-[#1E293B] text-[#94A3B8] hover:bg-[#1E293B]">
                            {entry.matchMode === "exact" ? "Ganzes Wort" : "Enthält"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge className={entry.isActive ? "bg-green-500/20 text-green-400 hover:bg-green-500/20" : "bg-[#1E293B] text-[#64748B] hover:bg-[#1E293B]"}>
                            {entry.isActive ? "Aktiv" : "Inaktiv"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-[#94A3B8] text-sm max-w-[16rem] truncate">{entry.reason ?? "—"}</TableCell>
                        <TableCell className="text-[#64748B] text-sm">
                          {entry.createdAt ? new Date(entry.createdAt).toLocaleDateString("de-DE") : "—"}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => updateBannedWord.mutate({ id: entry.id, isActive: !entry.isActive })}
                              className="text-[#94A3B8] hover:text-[#F1F5F9] hover:bg-[#1E293B]"
                            >
                              {entry.isActive ? "Deaktivieren" : "Aktivieren"}
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                if (confirm(`Sperrwort "${entry.word}" wirklich entfernen?`)) {
                                  deleteBannedWord.mutate({ id: entry.id });
                                }
                              }}
                              className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </div>
          </TabsContent>

          {/* ── Login-Protokolle ── */}
          <TabsContent value="login-logs" className="min-w-0 space-y-4 mt-4">
            <div className="flex flex-wrap items-center gap-2">
              <Button
                size="sm"
                variant={loginSuccess === undefined ? "default" : "outline"}
                onClick={() => { setLoginSuccess(undefined); setLoginPage(1); }}
                className={loginSuccess === undefined ? "bg-[#6366F1] text-white" : "border-[#1E293B] text-[#94A3B8]"}
              >
                Alle
              </Button>
              <Button
                size="sm"
                variant={loginSuccess === true ? "default" : "outline"}
                onClick={() => { setLoginSuccess(true); setLoginPage(1); }}
                className={loginSuccess === true ? "bg-green-600 text-white" : "border-[#1E293B] text-[#94A3B8]"}
              >
                <CheckCircle className="w-3.5 h-3.5 mr-1" /> Erfolgreich
              </Button>
              <Button
                size="sm"
                variant={loginSuccess === false ? "default" : "outline"}
                onClick={() => { setLoginSuccess(false); setLoginPage(1); }}
                className={loginSuccess === false ? "bg-red-600 text-white" : "border-[#1E293B] text-[#94A3B8]"}
              >
                <XCircle className="w-3.5 h-3.5 mr-1" /> Fehlgeschlagen
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => utils.admin.getLoginLogs.invalidate()}
                className="border-[#1E293B] text-[#94A3B8] sm:ml-auto"
              >
                <RefreshCw className="w-3.5 h-3.5" />
              </Button>
            </div>

            <div className="max-w-full overflow-hidden rounded-xl border border-[#1E293B] bg-[#111827]">
              {loginLogsLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-6 h-6 text-[#6366F1] animate-spin" />
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow className="border-[#1E293B] hover:bg-transparent">
                      <TableHead className="text-[#64748B]">Status</TableHead>
                      <TableHead className="text-[#64748B]">Nutzer</TableHead>
                      <TableHead className="text-[#64748B]">IP-Adresse</TableHead>
                      <TableHead className="text-[#64748B]">Browser / Gerät</TableHead>
                      <TableHead className="text-[#64748B]">Zeitpunkt</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loginLogs?.items.map((log) => (
                      <TableRow key={log.id} className="border-[#1E293B] hover:bg-[#1A2235]/30">
                        <TableCell>
                          {log.success ? (
                            <Badge className="bg-green-500/10 text-green-400 border-green-500/20">
                              <CheckCircle className="w-3 h-3 mr-1" /> Erfolg
                            </Badge>
                          ) : (
                            <Badge className="bg-red-500/10 text-red-400 border-red-500/20">
                              <XCircle className="w-3 h-3 mr-1" /> Fehler
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="text-[#F1F5F9] text-sm">{(log as any).user?.name ?? "Unbekannt"}</p>
                            <p className="text-[#64748B] text-xs">{(log as any).user?.email ?? (log as any).email ?? "—"}</p>
                          </div>
                        </TableCell>
                        <TableCell className="text-[#94A3B8] text-sm font-mono">{log.ipAddress ?? "—"}</TableCell>
                        <TableCell className="text-[#64748B] text-xs max-w-xs truncate">{log.userAgent ?? "—"}</TableCell>
                        <TableCell className="text-[#64748B] text-sm">
                          {new Date(log.createdAt!).toLocaleString("de-DE")}
                        </TableCell>
                      </TableRow>
                    ))}
                    {(!loginLogs?.items || loginLogs.items.length === 0) && (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center text-[#64748B] py-8">
                          Keine Login-Logs gefunden
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              )}
            </div>

            {loginLogs && loginLogs.total > 50 && (
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                <p className="text-[#64748B] text-sm">{loginLogs.total} Einträge · Seite {loginPage} von {Math.ceil(loginLogs.total / 50)}</p>
                <div className="flex w-full sm:w-auto gap-2">
                  <Button size="sm" variant="outline" onClick={() => setLoginPage((p) => Math.max(1, p - 1))} disabled={loginPage === 1}
                    className="border-[#1E293B] text-[#94A3B8]">Zurück</Button>
                  <Button size="sm" variant="outline" onClick={() => setLoginPage((p) => p + 1)} disabled={loginPage >= Math.ceil(loginLogs.total / 50)}
                    className="border-[#1E293B] text-[#94A3B8]">Weiter</Button>
                </div>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
}
