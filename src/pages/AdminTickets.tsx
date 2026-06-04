import { useState } from "react";
import { trpc } from "@/providers/trpc";
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
  ChevronRight,
} from "lucide-react";
import { toast } from "sonner";

export default function AdminTickets() {
  const [statusFilter, setStatusFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
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
                <div key={ticket.id} className="p-6 hover:bg-[#1A2235]/30 transition-colors">
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
