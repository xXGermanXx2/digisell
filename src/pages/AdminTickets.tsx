import { useState } from "react";
import { trpc } from "@/providers/trpc";
import { useAuth } from "@/hooks/useAuth";
import AdminLayout from "@/components/AdminLayout";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Loader2,
  Ticket,
  Search,
  RefreshCw,
  Send,
  ArrowLeft,
} from "lucide-react";
import { toast } from "sonner";

function formatDateTime(value: string | Date | null | undefined) {
  if (!value) return "-";
  return new Date(value).toLocaleString("de-DE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function AdminTickets() {
  const [statusFilter, setStatusFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [selectedTicket, setSelectedTicket] = useState<any>(null);
  const [replyMessage, setReplyMessage] = useState("");
  const [internalNote, setInternalNote] = useState(false);
  const { user } = useAuth({ redirectOnUnauthenticated: true });
  const utils = trpc.useUtils();

  const { data: ticketsData, isLoading, refetch } = trpc.ticket.list.useQuery({
    status: statusFilter as any,
    priority: priorityFilter as any,
    category: categoryFilter as any,
    search: search || undefined,
    page,
    limit: 20,
  });

  const { data: stats } = trpc.ticket.stats.useQuery();

  const ticketDetail = trpc.ticket.getById.useQuery(
    { id: selectedTicket?.id ?? 0 },
    { enabled: !!selectedTicket }
  );

  const addMessage = trpc.ticket.addMessage.useMutation({
    onSuccess: () => {
      setReplyMessage("");
      setInternalNote(false);
      utils.ticket.getById.invalidate({ id: selectedTicket?.id });
      utils.ticket.list.invalidate();
      utils.ticket.stats.invalidate();
      toast.success("Antwort gesendet");
    },
    onError: (e) => toast.error(e.message),
  });

  const updateStatus = trpc.ticket.updateStatus.useMutation({
    onSuccess: () => {
      utils.ticket.list.invalidate();
      toast.success("Ticket-Status aktualisiert");
    },
  });

  const updatePriority = trpc.ticket.updatePriority.useMutation({
    onSuccess: () => {
      utils.ticket.list.invalidate();
      toast.success("Priorität aktualisiert");
    },
  });

  const totalPages = ticketsData ? Math.ceil(ticketsData.total / 20) : 1;

  const statusLabels: Record<string, string> = {
    open: "Offen",
    in_progress: "In Bearbeitung",
    resolved: "Gelöst",
    closed: "Geschlossen",
  };

  const statusBadgeClass: Record<string, string> = {
    open: "bg-[#22C55E]/10 text-[#22C55E]",
    in_progress: "bg-[#3B82F6]/10 text-[#3B82F6]",
    resolved: "bg-[#6366F1]/10 text-[#6366F1]",
    closed: "bg-[#64748B]/10 text-[#64748B]",
  };

  const categoryColors: Record<string, string> = {
    general: "#6366F1",
    technical: "#F59E0B",
    billing: "#22C55E",
    refund: "#EF4444",
  };

  const categoryLabels: Record<string, string> = {
    general: "Allgemein",
    technical: "Technisch",
    billing: "Abrechnung",
    refund: "R\u00fcckerstattung",
  };

  if (selectedTicket) {
    const ticket = ticketDetail.data;

    return (
      <AdminLayout>
        <div className="space-y-6 animate-fade-in">
          <button
            onClick={() => {
              setSelectedTicket(null);
              setReplyMessage("");
              setInternalNote(false);
            }}
            className="inline-flex items-center gap-2 text-sm text-[#94A3B8] hover:text-[#F1F5F9] transition-colors"
          >
            <ArrowLeft className="w-4 h-4" /> Zurück zu allen Tickets
          </button>

          {ticketDetail.isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-6 h-6 text-[#6366F1] animate-spin" />
            </div>
          ) : ticket ? (
            <div className="bg-[#111827] rounded-xl border border-[#1E293B] overflow-hidden card-shadow">
              <div className="px-6 py-5 border-b border-[#1E293B] flex flex-col lg:flex-row lg:items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xs font-mono text-[#64748B]">{ticket.ticketNumber}</span>
                    <span className={`text-xs px-2 py-1 rounded-full ${statusBadgeClass[ticket.status] ?? statusBadgeClass.open}`}>
                      {statusLabels[ticket.status] ?? ticket.status}
                    </span>
                  </div>
                  <h1 className="text-xl font-semibold text-[#F1F5F9]">{ticket.subject}</h1>
                  <p className="text-sm text-[#94A3B8] mt-1">
                    {ticket.customerEmail} · {categoryLabels[ticket.category] ?? ticket.category} · {formatDateTime(ticket.createdAt)}
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <Select
                    value={ticket.status}
                    onValueChange={(v) => updateStatus.mutate({ ticketId: ticket.id, status: v as any })}
                  >
                    <SelectTrigger className="h-9 w-40 bg-[#1A2235] border-[#2D3748] text-[#F1F5F9] text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-[#1E293B] border-[#2D3748]">
                      <SelectItem value="open" className="text-[#F1F5F9] text-xs">Offen</SelectItem>
                      <SelectItem value="in_progress" className="text-[#F1F5F9] text-xs">In Bearbeitung</SelectItem>
                      <SelectItem value="resolved" className="text-[#F1F5F9] text-xs">Gelöst</SelectItem>
                      <SelectItem value="closed" className="text-[#F1F5F9] text-xs">Geschlossen</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="p-6 space-y-4 max-h-[520px] overflow-y-auto">
                {ticket.messages?.map((message: any) => {
                  const fromAdmin = message.senderRole === "admin" || message.senderRole === "seller";
                  return (
                    <div key={message.id} className={`flex gap-3 ${fromAdmin ? "flex-row-reverse" : ""}`}>
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                        fromAdmin ? "bg-[#6366F1]/20 text-[#818CF8]" : "bg-[#2D3748] text-[#94A3B8]"
                      }`}>
                        {fromAdmin ? "A" : "K"}
                      </div>
                      <div className={`max-w-[78%] flex flex-col gap-1 ${fromAdmin ? "items-end" : "items-start"}`}>
                        <div className={`rounded-xl px-4 py-3 text-sm whitespace-pre-wrap ${
                          fromAdmin ? "bg-[#6366F1] text-white" : "bg-[#1A2235] text-[#F1F5F9] border border-[#2D3748]"
                        }`}>
                          {message.isInternal && (
                            <span className="block text-[10px] uppercase tracking-wide text-yellow-200 mb-1">Interne Notiz</span>
                          )}
                          {message.message}
                        </div>
                        <span className="text-xs text-[#64748B]">
                          {message.senderName} · {formatDateTime(message.createdAt)}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {ticket.status !== "closed" ? (
                <div className="px-6 pb-6 border-t border-[#1E293B] pt-5 space-y-3">
                  <textarea
                    placeholder="Antwort an den Kunden schreiben..."
                    value={replyMessage}
                    onChange={(e) => setReplyMessage(e.target.value)}
                    className="w-full bg-[#1A2235] border border-[#2D3748] text-[#F1F5F9] placeholder:text-[#64748B] rounded-lg px-4 py-3 text-sm resize-none min-h-[110px] focus:outline-none focus:ring-2 focus:ring-[#6366F1]"
                  />
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <label className="inline-flex items-center gap-2 text-xs text-[#94A3B8]">
                      <input
                        type="checkbox"
                        checked={internalNote}
                        onChange={(e) => setInternalNote(e.target.checked)}
                        className="accent-[#6366F1]"
                      />
                      Als interne Notiz speichern
                    </label>
                    <button
                      onClick={() => addMessage.mutate({
                        ticketId: ticket.id,
                        message: replyMessage,
                        senderName: user?.name ?? user?.email ?? "Admin",
                        senderRole: "admin",
                        senderId: user?.id,
                        isInternal: internalNote,
                        attachments: [],
                      })}
                      disabled={!replyMessage.trim() || addMessage.isPending}
                      className="inline-flex items-center justify-center gap-2 px-4 py-2 text-sm bg-[#6366F1] hover:bg-[#4F46E5] disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
                    >
                      {addMessage.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                      Antwort senden
                    </button>
                  </div>
                </div>
              ) : (
                <div className="px-6 py-5 border-t border-[#1E293B] text-sm text-[#94A3B8]">
                  Dieses Ticket ist geschlossen. Ändere den Status auf „Offen“ oder „In Bearbeitung“, um erneut zu antworten.
                </div>
              )}
            </div>
          ) : (
            <div className="bg-[#111827] rounded-xl p-8 text-center text-sm text-[#94A3B8]">Ticket konnte nicht geladen werden.</div>
          )}
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6 animate-fade-in">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-[#F1F5F9]">Support-Tickets</h1>
            <p className="text-sm text-[#94A3B8] mt-1">Verwalte Kundenanfragen</p>
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-44 bg-[#111827] border-[#2D3748] text-[#F1F5F9]">
              <SelectValue placeholder="Status-Filter" />
            </SelectTrigger>
            <SelectContent className="bg-[#1E293B] border-[#2D3748]">
              <SelectItem value="all" className="text-[#F1F5F9]">Alle</SelectItem>
              <SelectItem value="open" className="text-[#F1F5F9]">Offen</SelectItem>
              <SelectItem value="in_progress" className="text-[#F1F5F9]">In Bearbeitung</SelectItem>
              <SelectItem value="resolved" className="text-[#F1F5F9]">Gel\u00f6st</SelectItem>
              <SelectItem value="closed" className="text-[#F1F5F9]">Geschlossen</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Stats */}
        {stats && (
          <div className="grid grid-cols-5 gap-3">
            {[
              { label: "Gesamt", value: stats.total, color: "text-white" },
              { label: "Offen", value: stats.open, color: "text-yellow-400" },
              { label: "In Bearbeitung", value: stats.inProgress, color: "text-blue-400" },
              { label: "Gelöst", value: stats.resolved, color: "text-green-400" },
              { label: "Geschlossen", value: stats.closed, color: "text-[#64748B]" },
            ].map(s => (
              <div key={s.label} className="bg-[#111827] rounded-xl p-4 text-center card-shadow">
                <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
                <p className="text-xs text-[#64748B] mt-1">{s.label}</p>
              </div>
            ))}
          </div>
        )}

        {/* Search */}
        <div className="flex flex-wrap gap-3">
          <div className="relative flex-1 min-w-48">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#64748B]" />
            <input
              type="text"
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(1); }}
              placeholder="Suche nach Betreff, E-Mail, Ticket-Nr..."
              className="w-full bg-[#111827] border border-[#2D3748] text-[#F1F5F9] placeholder-[#64748B] rounded-lg pl-9 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#6366F1]"
            />
          </div>
          <Select value={priorityFilter} onValueChange={v => { setPriorityFilter(v); setPage(1); }}>
            <SelectTrigger className="w-36 bg-[#111827] border-[#2D3748] text-[#F1F5F9]">
              <SelectValue placeholder="Priorität" />
            </SelectTrigger>
            <SelectContent className="bg-[#1E293B] border-[#2D3748]">
              <SelectItem value="all" className="text-[#F1F5F9]">Alle Prioritäten</SelectItem>
              <SelectItem value="high" className="text-[#F1F5F9]">Hoch</SelectItem>
              <SelectItem value="medium" className="text-[#F1F5F9]">Mittel</SelectItem>
              <SelectItem value="low" className="text-[#F1F5F9]">Niedrig</SelectItem>
            </SelectContent>
          </Select>
          <Select value={categoryFilter} onValueChange={v => { setCategoryFilter(v); setPage(1); }}>
            <SelectTrigger className="w-36 bg-[#111827] border-[#2D3748] text-[#F1F5F9]">
              <SelectValue placeholder="Kategorie" />
            </SelectTrigger>
            <SelectContent className="bg-[#1E293B] border-[#2D3748]">
              <SelectItem value="all" className="text-[#F1F5F9]">Alle Kategorien</SelectItem>
              <SelectItem value="general" className="text-[#F1F5F9]">Allgemein</SelectItem>
              <SelectItem value="technical" className="text-[#F1F5F9]">Technisch</SelectItem>
              <SelectItem value="billing" className="text-[#F1F5F9]">Abrechnung</SelectItem>
              <SelectItem value="refund" className="text-[#F1F5F9]">Erstattung</SelectItem>
            </SelectContent>
          </Select>
          <button onClick={() => refetch()} className="flex items-center gap-2 px-3 py-2 text-sm bg-[#1A2235] hover:bg-[#2D3748] text-[#F1F5F9] rounded-lg border border-[#2D3748] transition-colors">
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>

        <div className="bg-[#111827] rounded-xl card-shadow overflow-hidden">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-6 h-6 text-[#6366F1] animate-spin" />
            </div>
          ) : (
            <div className="divide-y divide-[#1E293B]">
              {ticketsData?.items?.map((ticket) => (
                <div key={ticket.id} className="p-6 hover:bg-[#1A2235]/30 transition-colors cursor-pointer" onClick={() => setSelectedTicket(ticket)}>
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-xs font-mono text-[#64748B]">{ticket.ticketNumber}</span>
                        <span
                          className="text-[10px] px-2 py-0.5 rounded-full font-medium"
                          style={{
                            backgroundColor: `${categoryColors[ticket.category]}15`,
                            color: categoryColors[ticket.category],
                          }}
                        >
                          {categoryLabels[ticket.category]}
                        </span>
                        <span className={`text-[10px] px-2 py-0.5 rounded-full ${
                          ticket.priority === "high" ? "bg-[#EF4444]/10 text-[#EF4444]" :
                          ticket.priority === "medium" ? "bg-[#F59E0B]/10 text-[#F59E0B]" :
                          "bg-[#3B82F6]/10 text-[#3B82F6]"
                        }`}>
                          {ticket.priority === "high" ? "Hoch" : ticket.priority === "medium" ? "Mittel" : "Niedrig"}
                        </span>
                      </div>
                      <h3 className="text-sm font-medium text-[#F1F5F9] mb-1">{ticket.subject}</h3>
                      <p className="text-xs text-[#94A3B8]">{ticket.customerEmail}</p>
                      <p className="text-xs text-[#64748B] mt-1">
                        {ticket.createdAt ? new Date(ticket.createdAt).toLocaleString("de-DE") : "-"}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        ticket.status === "open" ? "bg-[#22C55E]/10 text-[#22C55E]" :
                        ticket.status === "in_progress" ? "bg-[#3B82F6]/10 text-[#3B82F6]" :
                        ticket.status === "resolved" ? "bg-[#6366F1]/10 text-[#6366F1]" :
                        "bg-[#64748B]/10 text-[#64748B]"
                      }`}>
                        {ticket.status === "open" ? "Offen" :
                         ticket.status === "in_progress" ? "In Bearbeitung" :
                         ticket.status === "resolved" ? "Gel\u00f6st" : "Geschlossen"}
                      </span>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedTicket(ticket);
                        }}
                        className="px-3 py-1.5 text-xs bg-[#6366F1] hover:bg-[#4F46E5] text-white rounded-lg transition-colors"
                      >
                        Antworten
                      </button>
                      <Select
                        value={ticket.status}
                        onValueChange={(v) => updateStatus.mutate({ ticketId: ticket.id, status: v as any })}
                      >
                        <SelectTrigger className="h-8 w-28 bg-[#1A2235] border-[#2D3748] text-[#F1F5F9] text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-[#1E293B] border-[#2D3748]">
                          <SelectItem value="open" className="text-[#F1F5F9] text-xs">Offen</SelectItem>
                          <SelectItem value="in_progress" className="text-[#F1F5F9] text-xs">In Bearbeitung</SelectItem>
                          <SelectItem value="resolved" className="text-[#F1F5F9] text-xs">Gel\u00f6st</SelectItem>
                          <SelectItem value="closed" className="text-[#F1F5F9] text-xs">Geschlossen</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              ))}
              {(!ticketsData?.items || ticketsData.items.length === 0) && (
                <div className="text-center py-12">
                  <Ticket className="w-10 h-10 text-[#64748B] mx-auto mb-3" />
                  <p className="text-sm text-[#64748B]">Keine Tickets vorhanden</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between">
            <p className="text-sm text-[#64748B]">
              Seite {page} von {totalPages} · {ticketsData?.total ?? 0} Tickets
            </p>
            <div className="flex gap-2">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="px-3 py-1.5 text-sm bg-[#1A2235] hover:bg-[#2D3748] text-[#F1F5F9] rounded-lg border border-[#2D3748] disabled:opacity-40 disabled:cursor-not-allowed transition-colors">Zurück</button>
              <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="px-3 py-1.5 text-sm bg-[#1A2235] hover:bg-[#2D3748] text-[#F1F5F9] rounded-lg border border-[#2D3748] disabled:opacity-40 disabled:cursor-not-allowed transition-colors">Weiter</button>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
