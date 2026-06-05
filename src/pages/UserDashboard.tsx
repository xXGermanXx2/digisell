import { useState } from "react";
import { Link, useParams, useNavigate } from "react-router";
import { useAuth } from "@/hooks/useAuth";
import { trpc } from "@/providers/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  LayoutDashboard,
  ShoppingBag,
  Download,
  Settings,
  Ticket,
  LogOut,
  Loader2,
  Package,
  Mail,
  Shield,
  Store,
  Key,
  Copy,
  CheckCircle,
  Clock,
  TrendingUp,
  FileText,
  Plus,
  X,
  ChevronRight,
  History,
  CreditCard,
  Eye,
  EyeOff,
  Send,
  ExternalLink,
} from "lucide-react";
import { toast } from "sonner";

const navItems = [
  { id: "overview", label: "Übersicht", icon: LayoutDashboard },
  { id: "orders", label: "Bestellungen", icon: ShoppingBag },
  { id: "downloads", label: "Downloads & Keys", icon: Download },
  { id: "tickets", label: "Support", icon: Ticket },
  { id: "payments", label: "Zahlungen", icon: CreditCard },
  { id: "security", label: "Sicherheit", icon: Shield },
  { id: "settings", label: "Einstellungen", icon: Settings },
];

function formatDate(date: Date | string | null) {
  if (!date) return "-";
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit", year: "numeric" });
}

function formatDateTime(date: Date | string | null) {
  if (!date) return "-";
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleString("de-DE", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

function formatCurrency(val: number | string) {
  const num = typeof val === "string" ? parseFloat(val) : val;
  if (isNaN(num)) return "0,00 €";
  return new Intl.NumberFormat("de-DE", { style: "currency", currency: "EUR" }).format(num);
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; cls: string }> = {
    completed: { label: "Abgeschlossen", cls: "bg-green-500/10 text-green-400 border-green-500/20" },
    paid: { label: "Bezahlt", cls: "bg-blue-500/10 text-blue-400 border-blue-500/20" },
    pending: { label: "Ausstehend", cls: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20" },
    refunded: { label: "Erstattet", cls: "bg-purple-500/10 text-purple-400 border-purple-500/20" },
    cancelled: { label: "Storniert", cls: "bg-red-500/10 text-red-400 border-red-500/20" },
    failed: { label: "Fehlgeschlagen", cls: "bg-red-500/10 text-red-400 border-red-500/20" },
    open: { label: "Offen", cls: "bg-green-500/10 text-green-400 border-green-500/20" },
    in_progress: { label: "In Bearbeitung", cls: "bg-blue-500/10 text-blue-400 border-blue-500/20" },
    resolved: { label: "Gelöst", cls: "bg-indigo-500/10 text-indigo-400 border-indigo-500/20" },
    closed: { label: "Geschlossen", cls: "bg-slate-500/10 text-slate-400 border-slate-500/20" },
  };
  const s = map[status] ?? { label: status, cls: "bg-slate-500/10 text-slate-400 border-slate-500/20" };
  return <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${s.cls}`}>{s.label}</span>;
}

// ─── Overview Tab ────────────────────────────────────────────────────────────
function OverviewTab({ user, ordersData, ticketData, onTabChange }: any) {
  const orders = ordersData?.items ?? [];
  const tickets = ticketData?.items ?? [];
  const totalSpent = orders
    .filter((o: any) => ["paid", "completed"].includes(o.status))
    .reduce((sum: number, o: any) => sum + parseFloat(o.total ?? "0"), 0);
  const activeDownloads = orders.filter((o: any) => ["paid", "completed"].includes(o.status)).length;
  const openTickets = tickets.filter((t: any) => t.status === "open" || t.status === "in_progress").length;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Bestellungen", value: orders.length, icon: ShoppingBag, color: "text-indigo-400", bg: "bg-indigo-500/10" },
          { label: "Ausgegeben", value: formatCurrency(totalSpent), icon: TrendingUp, color: "text-green-400", bg: "bg-green-500/10" },
          { label: "Downloads", value: activeDownloads, icon: Download, color: "text-blue-400", bg: "bg-blue-500/10" },
          { label: "Offene Tickets", value: openTickets, icon: Ticket, color: "text-yellow-400", bg: "bg-yellow-500/10" },
        ].map((s) => (
          <div key={s.label} className="bg-[#111827] rounded-xl p-4 border border-[#1E293B]">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs text-[#64748B] font-medium">{s.label}</span>
              <div className={`w-8 h-8 rounded-lg ${s.bg} flex items-center justify-center`}>
                <s.icon className={`w-4 h-4 ${s.color}`} />
              </div>
            </div>
            <p className={`text-xl font-bold ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      <div className="bg-[#111827] rounded-xl border border-[#1E293B] overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#1E293B]">
          <h3 className="text-sm font-semibold text-[#F1F5F9]">Letzte Bestellungen</h3>
          <button onClick={() => onTabChange("orders")} className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1">
            Alle anzeigen <ChevronRight className="w-3 h-3" />
          </button>
        </div>
        {orders.length === 0 ? (
          <div className="text-center py-10">
            <Package className="w-8 h-8 text-[#64748B] mx-auto mb-2" />
            <p className="text-sm text-[#64748B]">Noch keine Bestellungen</p>
          </div>
        ) : (
          <div className="divide-y divide-[#1E293B]">
            {orders.slice(0, 5).map((order: any) => (
              <div key={order.id} className="flex items-center justify-between px-5 py-3 hover:bg-[#1A2235]/50 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-indigo-500/10 flex items-center justify-center">
                    <ShoppingBag className="w-4 h-4 text-indigo-400" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-[#F1F5F9]">{order.orderNumber}</p>
                    <p className="text-xs text-[#64748B]">{formatDate(order.createdAt)} · {order.items?.length ?? 0} Artikel</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm font-semibold text-[#F1F5F9]">{formatCurrency(order.total)}</span>
                  <StatusBadge status={order.status} />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {openTickets > 0 && (
        <div className="bg-[#111827] rounded-xl border border-yellow-500/20 overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-[#1E293B]">
            <h3 className="text-sm font-semibold text-[#F1F5F9]">Offene Support-Tickets</h3>
            <button onClick={() => onTabChange("tickets")} className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1">
              Alle anzeigen <ChevronRight className="w-3 h-3" />
            </button>
          </div>
          <div className="divide-y divide-[#1E293B]">
            {tickets.filter((t: any) => t.status === "open" || t.status === "in_progress").slice(0, 3).map((ticket: any) => (
              <div key={ticket.id} className="flex items-center justify-between px-5 py-3">
                <div>
                  <p className="text-sm font-medium text-[#F1F5F9]">{ticket.subject}</p>
                  <p className="text-xs text-[#64748B]">{ticket.ticketNumber} · {formatDate(ticket.createdAt)}</p>
                </div>
                <StatusBadge status={ticket.status} />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Orders Tab ───────────────────────────────────────────────────────────────
function OrdersTab({ ordersData, ordersLoading }: any) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const orders = ordersData?.items ?? [];
  const filtered = orders.filter((o: any) => {
    const matchSearch = !search || o.orderNumber?.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === "all" || o.status === statusFilter;
    return matchSearch && matchStatus;
  });

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="flex flex-col sm:flex-row gap-3">
        <Input
          placeholder="Bestellnummer suchen..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="bg-[#111827] border-[#2D3748] text-[#F1F5F9] placeholder:text-[#64748B] h-9 text-sm"
        />
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="bg-[#111827] border border-[#2D3748] text-[#F1F5F9] rounded-md px-3 py-2 text-sm h-9 min-w-[140px]"
        >
          <option value="all">Alle Status</option>
          <option value="pending">Ausstehend</option>
          <option value="paid">Bezahlt</option>
          <option value="completed">Abgeschlossen</option>
          <option value="refunded">Erstattet</option>
          <option value="cancelled">Storniert</option>
        </select>
      </div>
      <div className="bg-[#111827] rounded-xl border border-[#1E293B] overflow-hidden">
        {ordersLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-6 h-6 text-indigo-400 animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12">
            <Package className="w-10 h-10 text-[#64748B] mx-auto mb-3" />
            <p className="text-sm text-[#94A3B8]">Keine Bestellungen gefunden.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-[#1A2235] border-b border-[#1E293B]">
                  <th className="text-left text-xs font-medium text-[#64748B] uppercase tracking-wider px-5 py-3">Bestellnr.</th>
                  <th className="text-left text-xs font-medium text-[#64748B] uppercase tracking-wider px-5 py-3">Datum</th>
                  <th className="text-left text-xs font-medium text-[#64748B] uppercase tracking-wider px-5 py-3 hidden sm:table-cell">Produkte</th>
                  <th className="text-left text-xs font-medium text-[#64748B] uppercase tracking-wider px-5 py-3">Betrag</th>
                  <th className="text-left text-xs font-medium text-[#64748B] uppercase tracking-wider px-5 py-3">Status</th>
                  <th className="text-left text-xs font-medium text-[#64748B] uppercase tracking-wider px-5 py-3">Aktionen</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1E293B]">
                {filtered.map((order: any) => (
                  <tr key={order.id} className="hover:bg-[#1A2235]/50 transition-colors">
                    <td className="px-5 py-3.5 text-sm text-[#F1F5F9] font-medium">{order.orderNumber}</td>
                    <td className="px-5 py-3.5 text-sm text-[#94A3B8]">{formatDate(order.createdAt)}</td>
                    <td className="px-5 py-3.5 text-sm text-[#94A3B8] hidden sm:table-cell">
                      {order.items?.map((i: any) => i.product?.name).filter(Boolean).join(", ") || `${order.items?.length ?? 0} Artikel`}
                    </td>
                    <td className="px-5 py-3.5 text-sm font-semibold text-[#F1F5F9]">{formatCurrency(order.total)}</td>
                    <td className="px-5 py-3.5"><StatusBadge status={order.status} /></td>
                    <td className="px-5 py-3.5">
                      <Link to={`/invoice/${order.id}`}>
                        <Button variant="ghost" size="sm" className="h-7 px-2 text-xs text-indigo-400 hover:text-indigo-300 hover:bg-indigo-500/10">
                          <FileText className="w-3.5 h-3.5 mr-1" /> Rechnung
                        </Button>
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Downloads & Keys Tab ─────────────────────────────────────────────────────
function DownloadsTab({ ordersData, ordersLoading }: any) {
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const orders = ordersData?.items ?? [];
  const paidOrders = orders.filter((o: any) => ["paid", "completed"].includes(o.status));

  const copyKey = (key: string) => {
    navigator.clipboard.writeText(key);
    setCopiedKey(key);
    toast.success("Key kopiert!");
    setTimeout(() => setCopiedKey(null), 2000);
  };

  if (ordersLoading) {
    return <div className="flex items-center justify-center py-12"><Loader2 className="w-6 h-6 text-indigo-400 animate-spin" /></div>;
  }

  if (paidOrders.length === 0) {
    return (
      <div className="text-center py-16 bg-[#111827] rounded-xl border border-[#1E293B]">
        <Download className="w-12 h-12 text-[#64748B] mx-auto mb-3" />
        <p className="text-sm text-[#94A3B8]">Noch keine Downloads verfügbar.</p>
        <p className="text-xs text-[#64748B] mt-1">Kaufe ein Produkt um Downloads freizuschalten.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4 animate-fade-in">
      {paidOrders.map((order: any) => (
        <div key={order.id} className="bg-[#111827] rounded-xl border border-[#1E293B] overflow-hidden">
          <div className="flex items-center justify-between px-5 py-3.5 bg-[#1A2235] border-b border-[#1E293B]">
            <div className="flex items-center gap-2">
              <ShoppingBag className="w-4 h-4 text-[#64748B]" />
              <span className="text-sm font-medium text-[#F1F5F9]">{order.orderNumber}</span>
              <span className="text-xs text-[#64748B]">· {formatDate(order.createdAt)}</span>
            </div>
            <StatusBadge status={order.status} />
          </div>
          <div className="divide-y divide-[#1E293B]">
            {order.items?.map((item: any) => (
              <div key={item.id} className="px-5 py-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-lg bg-indigo-500/10 flex items-center justify-center flex-shrink-0">
                      {item.product?.type === "license" ? (
                        <Key className="w-4 h-4 text-indigo-400" />
                      ) : (
                        <Download className="w-4 h-4 text-indigo-400" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-[#F1F5F9] truncate">{item.product?.name ?? item.productName ?? "Produkt"}</p>
                      <p className="text-xs text-[#64748B] capitalize">{item.product?.type ?? "file"}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {item.product?.type === "file" && item.product?.fileUrl && (
                      <a href={item.product.fileUrl} target="_blank" rel="noopener noreferrer">
                        <Button size="sm" className="h-7 px-3 text-xs bg-indigo-600 hover:bg-indigo-700 text-white">
                          <Download className="w-3.5 h-3.5 mr-1" /> Download
                        </Button>
                      </a>
                    )}
                    {item.product?.type === "service" && (
                      <span className="text-xs text-[#64748B] italic">Service</span>
                    )}
                  </div>
                </div>
                {item.licenseKey && (
                  <div className="mt-3 flex items-center gap-2 bg-[#0A0E1A] rounded-lg px-3 py-2 border border-[#2D3748]">
                    <Key className="w-3.5 h-3.5 text-yellow-400 flex-shrink-0" />
                    <code className="text-xs text-yellow-300 font-mono flex-1 truncate">{item.licenseKey}</code>
                    <button onClick={() => copyKey(item.licenseKey)} className="text-[#64748B] hover:text-[#F1F5F9] transition-colors flex-shrink-0">
                      {copiedKey === item.licenseKey ? <CheckCircle className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Tickets Tab ──────────────────────────────────────────────────────────────
function TicketsTab({ ticketData, user }: any) {
  const utils = trpc.useUtils();
  const [showCreate, setShowCreate] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<any>(null);
  const [newMessage, setNewMessage] = useState("");
  const [form, setForm] = useState({
    subject: "",
    category: "general" as "general" | "technical" | "billing" | "refund",
    priority: "medium" as "low" | "medium" | "high",
    message: "",
  });

  const createTicket = trpc.ticket.create.useMutation({
    onSuccess: () => {
      toast.success("Ticket erstellt!");
      setShowCreate(false);
      setForm({ subject: "", category: "general", priority: "medium", message: "" });
      utils.ticket.listByCustomer.invalidate();
    },
    onError: (e) => toast.error(e.message),
  });

  const ticketDetail = trpc.ticket.getById.useQuery(
    { id: selectedTicket?.id ?? 0 },
    { enabled: !!selectedTicket }
  );

  const addMessage = trpc.ticket.addMessage.useMutation({
    onSuccess: () => {
      setNewMessage("");
      utils.ticket.getById.invalidate({ id: selectedTicket?.id });
    },
    onError: (e) => toast.error(e.message),
  });

  const closeTicket = trpc.ticket.close.useMutation({
    onSuccess: () => {
      toast.success("Ticket geschlossen");
      utils.ticket.listByCustomer.invalidate();
      utils.ticket.getById.invalidate({ id: selectedTicket?.id });
    },
  });

  const tickets = ticketData?.items ?? [];

  if (selectedTicket) {
    const t = ticketDetail.data;
    return (
      <div className="animate-fade-in space-y-4">
        <button onClick={() => setSelectedTicket(null)} className="flex items-center gap-2 text-sm text-[#64748B] hover:text-[#F1F5F9] transition-colors">
          ← Zurück zur Übersicht
        </button>
        {ticketDetail.isLoading ? (
          <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 text-indigo-400 animate-spin" /></div>
        ) : t ? (
          <div className="bg-[#111827] rounded-xl border border-[#1E293B] overflow-hidden">
            <div className="px-5 py-4 border-b border-[#1E293B] flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-[#F1F5F9]">{t.subject}</h3>
                <p className="text-xs text-[#64748B] mt-0.5">{t.ticketNumber} · {t.category} · {formatDate(t.createdAt)}</p>
              </div>
              <div className="flex items-center gap-2">
                <StatusBadge status={t.status} />
                {t.status !== "closed" && (
                  <Button size="sm" variant="ghost" className="h-7 px-2 text-xs text-red-400 hover:text-red-300 hover:bg-red-500/10"
                    onClick={() => closeTicket.mutate({ id: t.id })}>
                    <X className="w-3.5 h-3.5 mr-1" /> Schließen
                  </Button>
                )}
              </div>
            </div>
            <div className="p-5 space-y-4 max-h-96 overflow-y-auto">
              {t.messages?.map((msg: any) => (
                <div key={msg.id} className={`flex gap-3 ${msg.senderRole === "customer" ? "flex-row-reverse" : ""}`}>
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                    msg.senderRole === "customer" ? "bg-indigo-500/20 text-indigo-400" : "bg-[#2D3748] text-[#94A3B8]"
                  }`}>
                    {msg.senderRole === "customer" ? user?.name?.[0]?.toUpperCase() ?? "U" : "S"}
                  </div>
                  <div className={`max-w-[75%] flex flex-col gap-1 ${msg.senderRole === "customer" ? "items-end" : "items-start"}`}>
                    <div className={`rounded-xl px-4 py-2.5 text-sm ${
                      msg.senderRole === "customer" ? "bg-indigo-600 text-white" : "bg-[#1A2235] text-[#F1F5F9] border border-[#2D3748]"
                    }`}>
                      {msg.message}
                    </div>
                    <span className="text-xs text-[#64748B]">{formatDateTime(msg.createdAt)}</span>
                  </div>
                </div>
              ))}
            </div>
            {t.status !== "closed" && (
              <div className="px-5 pb-5 flex gap-2">
                <Textarea
                  placeholder="Antwort schreiben..."
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  className="bg-[#1A2235] border-[#2D3748] text-[#F1F5F9] placeholder:text-[#64748B] text-sm resize-none min-h-[80px]"
                />
                <Button
                  onClick={() => addMessage.mutate({
                    ticketId: t.id,
                    message: newMessage,
                    senderName: user?.name ?? user?.email ?? "Kunde",
                    senderRole: "customer",
                    attachments: [],
                  })}
                  disabled={!newMessage.trim() || addMessage.isPending}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white self-end h-9 px-3"
                >
                  {addMessage.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                </Button>
              </div>
            )}
          </div>
        ) : null}
      </div>
    );
  }

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="flex items-center justify-between">
        <p className="text-sm text-[#64748B]">{tickets.length} Ticket{tickets.length !== 1 ? "s" : ""}</p>
        <Button size="sm" onClick={() => setShowCreate(true)} className="bg-indigo-600 hover:bg-indigo-700 text-white h-8 px-3 text-xs">
          <Plus className="w-3.5 h-3.5 mr-1" /> Neues Ticket
        </Button>
      </div>
      {showCreate && (
        <div className="bg-[#111827] rounded-xl border border-[#1E293B] p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-[#F1F5F9]">Neues Ticket erstellen</h3>
            <button onClick={() => setShowCreate(false)} className="text-[#64748B] hover:text-[#F1F5F9]"><X className="w-4 h-4" /></button>
          </div>
          <Input placeholder="Betreff" value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })}
            className="bg-[#1A2235] border-[#2D3748] text-[#F1F5F9] placeholder:text-[#64748B] text-sm" />
          <div className="grid grid-cols-2 gap-3">
            <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value as any })}
              className="bg-[#1A2235] border border-[#2D3748] text-[#F1F5F9] rounded-md px-3 py-2 text-sm">
              <option value="general">Allgemein</option>
              <option value="technical">Technisch</option>
              <option value="billing">Abrechnung</option>
              <option value="refund">Rückerstattung</option>
            </select>
            <select value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value as any })}
              className="bg-[#1A2235] border border-[#2D3748] text-[#F1F5F9] rounded-md px-3 py-2 text-sm">
              <option value="low">Niedrig</option>
              <option value="medium">Mittel</option>
              <option value="high">Hoch</option>
            </select>
          </div>
          <Textarea placeholder="Beschreibe dein Problem..." value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })}
            className="bg-[#1A2235] border-[#2D3748] text-[#F1F5F9] placeholder:text-[#64748B] text-sm resize-none min-h-[100px]" />
          <div className="flex gap-2 justify-end">
            <Button variant="ghost" size="sm" onClick={() => setShowCreate(false)} className="text-[#64748B] hover:text-[#F1F5F9]">Abbrechen</Button>
            <Button size="sm"
              onClick={() => createTicket.mutate({ ...form, customerEmail: user?.email ?? "", customerId: user?.id })}
              disabled={!form.subject || !form.message || createTicket.isPending}
              className="bg-indigo-600 hover:bg-indigo-700 text-white">
              {createTicket.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Erstellen"}
            </Button>
          </div>
        </div>
      )}
      {tickets.length === 0 ? (
        <div className="text-center py-12 bg-[#111827] rounded-xl border border-[#1E293B]">
          <Ticket className="w-10 h-10 text-[#64748B] mx-auto mb-3" />
          <p className="text-sm text-[#94A3B8]">Noch keine Tickets erstellt.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {tickets.map((ticket: any) => (
            <button key={ticket.id} onClick={() => setSelectedTicket(ticket)}
              className="w-full bg-[#111827] rounded-xl border border-[#1E293B] p-4 hover:border-[#3D4F6B] transition-colors text-left">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-mono text-[#64748B]">{ticket.ticketNumber}</span>
                <StatusBadge status={ticket.status} />
              </div>
              <h3 className="text-sm font-medium text-[#F1F5F9] mb-1">{ticket.subject}</h3>
              <p className="text-xs text-[#64748B]">{ticket.category} · {formatDate(ticket.createdAt)}</p>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Payments Tab ─────────────────────────────────────────────────────────────
function PaymentsTab({ ordersData, ordersLoading }: any) {
  const orders = ordersData?.items ?? [];
  const payments = orders.filter((o: any) => o.status !== "pending");

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="bg-[#111827] rounded-xl border border-[#1E293B] overflow-hidden">
        <div className="px-5 py-4 border-b border-[#1E293B]">
          <h3 className="text-sm font-semibold text-[#F1F5F9]">Zahlungshistorie</h3>
        </div>
        {ordersLoading ? (
          <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 text-indigo-400 animate-spin" /></div>
        ) : payments.length === 0 ? (
          <div className="text-center py-12">
            <CreditCard className="w-10 h-10 text-[#64748B] mx-auto mb-3" />
            <p className="text-sm text-[#94A3B8]">Noch keine Zahlungen vorhanden.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-[#1A2235] border-b border-[#1E293B]">
                  <th className="text-left text-xs font-medium text-[#64748B] uppercase tracking-wider px-5 py-3">Bestellnr.</th>
                  <th className="text-left text-xs font-medium text-[#64748B] uppercase tracking-wider px-5 py-3">Datum</th>
                  <th className="text-left text-xs font-medium text-[#64748B] uppercase tracking-wider px-5 py-3 hidden sm:table-cell">Methode</th>
                  <th className="text-left text-xs font-medium text-[#64748B] uppercase tracking-wider px-5 py-3">Betrag</th>
                  <th className="text-left text-xs font-medium text-[#64748B] uppercase tracking-wider px-5 py-3">Status</th>
                  <th className="text-left text-xs font-medium text-[#64748B] uppercase tracking-wider px-5 py-3">Rechnung</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1E293B]">
                {payments.map((p: any) => (
                  <tr key={p.id} className="hover:bg-[#1A2235]/50 transition-colors">
                    <td className="px-5 py-3.5 text-sm text-[#F1F5F9] font-medium">{p.orderNumber}</td>
                    <td className="px-5 py-3.5 text-sm text-[#94A3B8]">{formatDate(p.createdAt)}</td>
                    <td className="px-5 py-3.5 text-sm text-[#94A3B8] hidden sm:table-cell capitalize">{p.paymentMethod ?? "—"}</td>
                    <td className="px-5 py-3.5 text-sm font-semibold text-[#F1F5F9]">{formatCurrency(p.total)}</td>
                    <td className="px-5 py-3.5"><StatusBadge status={p.status} /></td>
                    <td className="px-5 py-3.5">
                      <Link to={`/invoice/${p.id}`}>
                        <Button variant="ghost" size="sm" className="h-7 px-2 text-xs text-indigo-400 hover:text-indigo-300 hover:bg-indigo-500/10">
                          <FileText className="w-3.5 h-3.5 mr-1" /> PDF
                        </Button>
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Security Tab ─────────────────────────────────────────────────────────────
function SecurityTab({ user }: any) {
  const { data: loginHistoryData, isLoading } = trpc.profile.loginHistory.useQuery();
  const loginHistory = loginHistoryData?.items ?? [];

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="bg-[#111827] rounded-xl border border-[#1E293B] p-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center">
              <Shield className="w-5 h-5 text-indigo-400" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-[#F1F5F9]">Zwei-Faktor-Authentifizierung</h3>
              <p className="text-xs text-[#64748B] mt-0.5">Erhöhe die Sicherheit deines Accounts</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {user?.twoFactorEnabled ? (
              <span className="text-xs px-2 py-1 rounded-full bg-green-500/10 text-green-400 border border-green-500/20 font-medium">Aktiv</span>
            ) : (
              <span className="text-xs px-2 py-1 rounded-full bg-red-500/10 text-red-400 border border-red-500/20 font-medium">Inaktiv</span>
            )}
            <Link to="/settings">
              <Button size="sm" variant="ghost" className="h-7 px-2 text-xs text-indigo-400 hover:text-indigo-300 hover:bg-indigo-500/10">
                Verwalten <ChevronRight className="w-3.5 h-3.5 ml-1" />
              </Button>
            </Link>
          </div>
        </div>
      </div>
      <div className="bg-[#111827] rounded-xl border border-[#1E293B] overflow-hidden">
        <div className="px-5 py-4 border-b border-[#1E293B]">
          <h3 className="text-sm font-semibold text-[#F1F5F9]">Login-Verlauf</h3>
          <p className="text-xs text-[#64748B] mt-0.5">Letzte Anmeldungen an deinem Account</p>
        </div>
        {isLoading ? (
          <div className="flex justify-center py-8"><Loader2 className="w-5 h-5 text-indigo-400 animate-spin" /></div>
        ) : loginHistory.length === 0 ? (
          <div className="text-center py-10">
            <History className="w-8 h-8 text-[#64748B] mx-auto mb-2" />
            <p className="text-sm text-[#64748B]">Kein Login-Verlauf vorhanden.</p>
          </div>
        ) : (
          <div className="divide-y divide-[#1E293B]">
            {loginHistory.map((log: any) => (
              <div key={log.id} className="flex items-center justify-between px-5 py-3.5">
                <div className="flex items-center gap-3">
                  <div className={`w-2 h-2 rounded-full ${log.success ? "bg-green-400" : "bg-red-400"}`} />
                  <div>
                    <p className="text-sm text-[#F1F5F9]">{formatDateTime(log.createdAt)}</p>
                    <p className="text-xs text-[#64748B]">
                      {log.ipAddress ?? "Unbekannte IP"}
                      {log.country ? ` · ${log.country}` : ""}
                      {log.failReason ? ` · ${log.failReason}` : ""}
                    </p>
                  </div>
                </div>
                <span className={`text-xs font-medium ${log.success ? "text-green-400" : "text-red-400"}`}>
                  {log.success ? "Erfolgreich" : "Fehlgeschlagen"}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Settings Tab ─────────────────────────────────────────────────────────────
function SettingsTab({ user }: any) {
  const utils = trpc.useUtils();
  const [nameVal, setNameVal] = useState(user?.name ?? "");
  const [bioVal, setBioVal] = useState("");
  const [pwForm, setPwForm] = useState({ currentPassword: "", newPassword: "", confirm: "" });
  const [showPw, setShowPw] = useState(false);
  const [notifs, setNotifs] = useState({ notifyEmail: true, notifyOrderEmail: true, notifyTicketEmail: true, notifyNewsletterEmail: false });

  const updateProfile = trpc.profile.update.useMutation({
    onSuccess: () => { toast.success("Profil gespeichert"); utils.profile.get.invalidate(); },
    onError: (e) => toast.error(e.message),
  });
  const changePassword = trpc.profile.changePassword.useMutation({
    onSuccess: () => { toast.success("Passwort geändert"); setPwForm({ currentPassword: "", newPassword: "", confirm: "" }); },
    onError: (e) => toast.error(e.message),
  });
  const updateNotifs = trpc.profile.updateNotifications.useMutation({
    onSuccess: () => toast.success("Benachrichtigungen gespeichert"),
  });

  return (
    <div className="space-y-6 animate-fade-in max-w-2xl">
      {/* Profil */}
      <div className="bg-[#111827] rounded-xl border border-[#1E293B] p-5">
        <h3 className="text-sm font-semibold text-[#F1F5F9] mb-4">Profil bearbeiten</h3>
        <div className="flex items-center gap-4 mb-5">
          <div className="w-14 h-14 rounded-full bg-gradient-to-br from-indigo-500 to-violet-500 flex items-center justify-center text-white text-xl font-bold">
            {user?.name?.[0]?.toUpperCase() ?? "U"}
          </div>
          <div>
            <p className="text-sm font-medium text-[#F1F5F9]">{user?.name ?? "Benutzer"}</p>
            <p className="text-xs text-[#64748B]">{user?.email}</p>
          </div>
        </div>
        <div className="space-y-3">
          <div>
            <label className="text-xs font-medium text-[#94A3B8] mb-1.5 block">Name</label>
            <Input value={nameVal} onChange={(e) => setNameVal(e.target.value)} className="bg-[#1A2235] border-[#2D3748] text-[#F1F5F9] text-sm" />
          </div>
          <div>
            <label className="text-xs font-medium text-[#94A3B8] mb-1.5 block">Bio</label>
            <Textarea value={bioVal} onChange={(e) => setBioVal(e.target.value)} placeholder="Kurze Beschreibung..."
              className="bg-[#1A2235] border-[#2D3748] text-[#F1F5F9] text-sm resize-none" rows={2} />
          </div>
          <div>
            <label className="text-xs font-medium text-[#94A3B8] mb-1.5 block">Account-ID</label>
            <div className="p-2.5 rounded-lg bg-[#0A0E1A] border border-[#2D3748] text-xs text-[#64748B] font-mono">{user?.unionId}</div>
          </div>
        </div>
        <Button size="sm" onClick={() => updateProfile.mutate({ name: nameVal, bio: bioVal })}
          disabled={updateProfile.isPending} className="mt-4 bg-indigo-600 hover:bg-indigo-700 text-white">
          {updateProfile.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : null} Speichern
        </Button>
      </div>

      {/* Passwort */}
      <div className="bg-[#111827] rounded-xl border border-[#1E293B] p-5">
        <h3 className="text-sm font-semibold text-[#F1F5F9] mb-4">Passwort ändern</h3>
        <div className="space-y-3">
          <div>
            <label className="text-xs font-medium text-[#94A3B8] mb-1.5 block">Aktuelles Passwort</label>
            <div className="relative">
              <Input type={showPw ? "text" : "password"} value={pwForm.currentPassword}
                onChange={(e) => setPwForm({ ...pwForm, currentPassword: e.target.value })}
                className="bg-[#1A2235] border-[#2D3748] text-[#F1F5F9] text-sm pr-10" />
              <button type="button" onClick={() => setShowPw(!showPw)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#64748B] hover:text-[#F1F5F9]">
                {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>
          <div>
            <label className="text-xs font-medium text-[#94A3B8] mb-1.5 block">Neues Passwort</label>
            <Input type="password" value={pwForm.newPassword} onChange={(e) => setPwForm({ ...pwForm, newPassword: e.target.value })}
              className="bg-[#1A2235] border-[#2D3748] text-[#F1F5F9] text-sm" />
          </div>
          <div>
            <label className="text-xs font-medium text-[#94A3B8] mb-1.5 block">Passwort bestätigen</label>
            <Input type="password" value={pwForm.confirm} onChange={(e) => setPwForm({ ...pwForm, confirm: e.target.value })}
              className="bg-[#1A2235] border-[#2D3748] text-[#F1F5F9] text-sm" />
          </div>
        </div>
        <Button size="sm"
          onClick={() => {
            if (pwForm.newPassword !== pwForm.confirm) { toast.error("Passwörter stimmen nicht überein"); return; }
            changePassword.mutate({ currentPassword: pwForm.currentPassword, newPassword: pwForm.newPassword });
          }}
          disabled={!pwForm.currentPassword || !pwForm.newPassword || changePassword.isPending}
          className="mt-4 bg-indigo-600 hover:bg-indigo-700 text-white">
          {changePassword.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : null} Passwort ändern
        </Button>
      </div>

      {/* Benachrichtigungen */}
      <div className="bg-[#111827] rounded-xl border border-[#1E293B] p-5">
        <h3 className="text-sm font-semibold text-[#F1F5F9] mb-4">Benachrichtigungen</h3>
        <div className="space-y-3">
          {[
            { key: "notifyEmail", label: "E-Mail-Benachrichtigungen", desc: "Allgemeine E-Mails erhalten" },
            { key: "notifyOrderEmail", label: "Bestellbestätigungen", desc: "E-Mail bei neuen Bestellungen" },
            { key: "notifyTicketEmail", label: "Ticket-Antworten", desc: "E-Mail bei neuen Ticket-Nachrichten" },
            { key: "notifyNewsletterEmail", label: "Newsletter", desc: "Promotions und Neuigkeiten" },
          ].map((item) => (
            <div key={item.key} className="flex items-center justify-between py-2">
              <div>
                <p className="text-sm text-[#F1F5F9]">{item.label}</p>
                <p className="text-xs text-[#64748B]">{item.desc}</p>
              </div>
              <button
                onClick={() => setNotifs({ ...notifs, [item.key]: !notifs[item.key as keyof typeof notifs] })}
                className={`w-10 rounded-full transition-colors relative flex-shrink-0 ${notifs[item.key as keyof typeof notifs] ? "bg-indigo-600" : "bg-[#2D3748]"}`}
                style={{ height: "22px" }}
              >
                <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform ${notifs[item.key as keyof typeof notifs] ? "translate-x-5" : "translate-x-0.5"}`} />
              </button>
            </div>
          ))}
        </div>
        <Button size="sm" onClick={() => updateNotifs.mutate(notifs)} disabled={updateNotifs.isPending}
          className="mt-4 bg-indigo-600 hover:bg-indigo-700 text-white">Speichern</Button>
      </div>

      {/* Erweiterte Einstellungen */}
      <div className="bg-[#111827] rounded-xl border border-[#1E293B] p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-[#F1F5F9]">Erweiterte Einstellungen</p>
            <p className="text-xs text-[#64748B]">2FA, API-Keys, Webhooks und mehr</p>
          </div>
          <Link to="/settings">
            <Button size="sm" variant="ghost" className="text-indigo-400 hover:text-indigo-300 hover:bg-indigo-500/10 h-8 px-3 text-xs">
              Öffnen <ExternalLink className="w-3.5 h-3.5 ml-1" />
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function UserDashboard() {
  const { tab } = useParams<{ tab?: string }>();
  const navigate = useNavigate();
  const { user, isLoading: authLoading, logout } = useAuth({ redirectOnUnauthenticated: true });
  const activeTab = tab ?? "overview";

  const { data: ordersData, isLoading: ordersLoading } = trpc.order.getByCustomer.useQuery(
    undefined,
    { enabled: !!user }
  );
  const { data: ticketData } = trpc.ticket.listByCustomer.useQuery(
    undefined,
    { enabled: !!user }
  );

  const handleTabChange = (value: string) => navigate(`/dashboard/${value}`);

  if (authLoading) {
    return (
      <div className="min-h-screen bg-[#0A0E1A] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-indigo-400 animate-spin" />
      </div>
    );
  }
  if (!user) return null;

  const isAdmin = user.role === "admin" || user.role === "seller";

  const tabTitles: Record<string, string> = {
    overview: `Hallo, ${user.name?.split(" ")[0] ?? "Benutzer"}!`,
    orders: "Meine Bestellungen",
    downloads: "Downloads & Lizenzschlüssel",
    tickets: "Support-Tickets",
    payments: "Zahlungen & Rechnungen",
    security: "Sicherheit",
    settings: "Einstellungen",
  };

  return (
    <div className="min-h-screen bg-[#0A0E1A]">
      {/* Top Bar */}
      <div className="h-[60px] bg-[#0F172A] border-b border-[#1E293B] fixed top-0 left-0 right-0 z-50 flex items-center px-4 sm:px-6 justify-between">
        <Link to="/" className="text-base font-bold text-white tracking-tight">DigiSell</Link>
        <div className="flex items-center gap-3">
          {isAdmin && (
            <Link to="/admin" className="text-xs text-violet-400 hover:text-violet-300 transition-colors hidden sm:block">Admin</Link>
          )}
          <Link to="/seller" className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors hidden sm:block">Mein Shop</Link>
          <button onClick={() => logout()} className="text-xs text-[#64748B] hover:text-red-400 transition-colors flex items-center gap-1">
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="pt-[60px] flex min-h-screen">
        {/* Sidebar */}
        <aside className="hidden md:flex w-56 flex-col bg-[#0F172A] border-r border-[#1E293B] fixed h-full pt-[60px]">
          <div className="flex-1 py-5 px-3 space-y-0.5 overflow-y-auto">
            <div className="px-3 mb-5">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-violet-500 flex items-center justify-center text-white font-bold text-sm">
                  {user.name?.[0]?.toUpperCase() ?? "U"}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-[#F1F5F9] truncate">{user.name ?? "Benutzer"}</p>
                  <p className="text-xs text-[#64748B] truncate">{user.email ?? ""}</p>
                </div>
              </div>
            </div>
            <div className="text-xs font-medium text-[#64748B] uppercase tracking-wider px-3 mb-2">Mein Konto</div>
            {navItems.map((item) => (
              <button key={item.id} onClick={() => handleTabChange(item.id)}
                className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  activeTab === item.id ? "bg-indigo-600 text-white" : "text-[#94A3B8] hover:bg-[#1E293B] hover:text-[#F1F5F9]"
                }`}>
                <item.icon className="w-4 h-4 flex-shrink-0" />
                {item.label}
              </button>
            ))}
          </div>
          <div className="p-3 border-t border-[#1E293B]">
            <button onClick={() => logout()}
              className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-medium text-[#64748B] hover:bg-red-500/10 hover:text-red-400 transition-colors">
              <LogOut className="w-4 h-4" /> Abmelden
            </button>
          </div>
        </aside>

        {/* Mobile bottom nav */}
        <div className="md:hidden fixed bottom-0 left-0 right-0 bg-[#0F172A] border-t border-[#1E293B] z-50 flex">
          {navItems.slice(0, 5).map((item) => (
            <button key={item.id} onClick={() => handleTabChange(item.id)}
              className={`flex-1 flex flex-col items-center gap-0.5 py-2.5 text-xs transition-colors ${activeTab === item.id ? "text-indigo-400" : "text-[#64748B]"}`}>
              <item.icon className="w-5 h-5" />
              <span className="text-[10px]">{item.label.split(" ")[0]}</span>
            </button>
          ))}
        </div>

        {/* Main content */}
        <main className="flex-1 md:ml-56 pb-20 md:pb-0">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6">
            <div className="mb-6">
              <h1 className="text-xl font-bold text-[#F1F5F9]">{tabTitles[activeTab] ?? activeTab}</h1>
              {activeTab === "overview" && <p className="text-sm text-[#64748B] mt-1">Willkommen in deinem Käufer-Dashboard</p>}
            </div>

            {activeTab === "overview" && <OverviewTab user={user} ordersData={ordersData} ticketData={ticketData} onTabChange={handleTabChange} />}
            {activeTab === "orders" && <OrdersTab ordersData={ordersData} ordersLoading={ordersLoading} />}
            {activeTab === "downloads" && <DownloadsTab ordersData={ordersData} ordersLoading={ordersLoading} />}
            {activeTab === "tickets" && <TicketsTab ticketData={ticketData} user={user} />}
            {activeTab === "payments" && <PaymentsTab ordersData={ordersData} ordersLoading={ordersLoading} />}
            {activeTab === "security" && <SecurityTab user={user} />}
            {activeTab === "settings" && <SettingsTab user={user} />}
          </div>
        </main>
      </div>
    </div>
  );
}
