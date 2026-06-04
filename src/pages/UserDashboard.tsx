import { Link, useParams, useNavigate } from "react-router";
import { useAuth } from "@/hooks/useAuth";
import { trpc } from "@/providers/trpc";
import Navbar from "@/components/Navbar";
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
} from "lucide-react";

const navItems = [
  { id: "overview", label: "\u00dcbersicht", icon: LayoutDashboard },
  { id: "orders", label: "Bestellungen", icon: ShoppingBag },
  { id: "downloads", label: "Downloads", icon: Download },
  { id: "tickets", label: "Support", icon: Ticket },
  { id: "settings", label: "Einstellungen", icon: Settings },
];

function formatDate(date: Date | string | null) {
  if (!date) return "-";
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleDateString("de-DE");
}

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

  const handleTabChange = (value: string) => {
    navigate(`/dashboard/${value}`);
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-[#0A0E1A] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-[#6366F1] animate-spin" />
      </div>
    );
  }

  if (!user) return null;

  const isAdmin = user.role === "admin" || user.role === "seller";

  return (
    <div className="min-h-screen bg-[#0A0E1A]">
      <Navbar />

      <div className="pt-[72px] flex min-h-screen">
        <aside className="hidden md:flex w-64 flex-col bg-[#0F172A] border-r border-[#1E293B] fixed h-full pt-[72px]">
          <div className="flex-1 py-6 px-3 space-y-1">
            <div className="px-3 mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-violet-500 flex items-center justify-center text-white font-bold">
                  {user.name?.[0]?.toUpperCase() || "U"}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-[#F1F5F9] truncate">{user.name ?? "Benutzer"}</p>
                  <p className="text-xs text-[#64748B] truncate">{user.email ?? ""}</p>
                </div>
              </div>
            </div>

            <Link
              to="/seller"
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-indigo-400 hover:bg-indigo-500/10 transition-colors mb-2"
            >
              <Store className="w-4 h-4" />
              Mein Shop
            </Link>
            {isAdmin && (
              <Link
                to="/admin"
                className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-[#6366F1] hover:bg-[#6366F1]/10 transition-colors mb-4"
              >
                <LayoutDashboard className="w-4 h-4" />
                Admin Panel
              </Link>
            )}

            <div className="text-xs font-medium text-[#64748B] uppercase tracking-wider px-3 mb-2">
              Mein Konto
            </div>
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={() => handleTabChange(item.id)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                    activeTab === item.id
                      ? "bg-[#6366F1]/15 text-[#6366F1] border-l-2 border-[#6366F1]"
                      : "text-[#94A3B8] hover:bg-[#1A2235] hover:text-[#F1F5F9]"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {item.label}
                </button>
              );
            })}
          </div>

          <div className="p-3 border-t border-[#1E293B]">
            <button
              onClick={logout}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-[#94A3B8] hover:bg-[#1A2235] hover:text-[#EF4444] transition-colors"
            >
              <LogOut className="w-4 h-4" />
              Abmelden
            </button>
          </div>
        </aside>

        <main className="flex-1 md:ml-64 p-4 sm:p-8">
          <div className="max-w-5xl mx-auto">
            <div className="md:hidden mb-6 overflow-x-auto scrollbar-hide">
              <div className="flex gap-2">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.id}
                      onClick={() => handleTabChange(item.id)}
                      className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
                        activeTab === item.id
                          ? "bg-[#6366F1]/15 text-[#6366F1]"
                          : "bg-[#111827] text-[#94A3B8]"
                      }`}
                    >
                      <Icon className="w-3.5 h-3.5" />
                      {item.label}
                    </button>
                  );
                })}
              </div>
            </div>

            <h1 className="text-2xl font-bold text-[#F1F5F9] mb-6">
              {activeTab === "overview" && `Hallo, ${user.name?.split(" ")[0] ?? "Benutzer"}!`}
              {activeTab === "orders" && "Meine Bestellungen"}
              {activeTab === "downloads" && "Meine Downloads"}
              {activeTab === "tickets" && "Support-Tickets"}
              {activeTab === "settings" && "Einstellungen"}
            </h1>

            {activeTab === "overview" && (
              <div className="space-y-6 animate-fade-in">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {[
                    { label: "Bestellungen", value: ordersData?.items?.length ?? 0, icon: ShoppingBag, color: "#6366F1" },
                    { label: "Downloads", value: ordersData?.items?.filter((o: any) => o.status === "completed").length ?? 0, icon: Download, color: "#22C55E" },
                    { label: "Tickets", value: ticketData?.items?.length ?? 0, icon: Ticket, color: "#F59E0B" },
                  ].map((stat) => (
                    <div key={stat.label} className="bg-[#111827] rounded-xl card-shadow p-5">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${stat.color}15` }}>
                          <stat.icon className="w-5 h-5" style={{ color: stat.color }} />
                        </div>
                        <span className="text-sm text-[#94A3B8]">{stat.label}</span>
                      </div>
                      <p className="text-2xl font-bold text-[#F1F5F9]">{stat.value}</p>
                    </div>
                  ))}
                </div>

                <div className="bg-[#111827] rounded-xl card-shadow p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-semibold text-[#F1F5F9]">Letzte Bestellungen</h2>
                    <button onClick={() => handleTabChange("orders")} className="text-sm text-[#6366F1] hover:underline">
                      Alle ansehen
                    </button>
                  </div>
                  {ordersData?.items && ordersData.items.length > 0 ? (
                    <div className="space-y-3">
                      {ordersData.items.slice(0, 5).map((order: any) => (
                        <div key={order.id} className="flex items-center justify-between p-3 rounded-lg bg-[#1A2235]">
                          <div>
                            <p className="text-sm font-medium text-[#F1F5F9]">{order.orderNumber}</p>
                            <p className="text-xs text-[#64748B]">{formatDate(order.createdAt)}</p>
                          </div>
                          <div className="flex items-center gap-4">
                            <span className="text-sm font-semibold text-[#6366F1]">{order.total} &euro;</span>
                            <span className={`text-xs px-2 py-1 rounded-full ${
                              order.status === "completed" ? "bg-[#22C55E]/10 text-[#22C55E]" :
                              order.status === "paid" ? "bg-[#3B82F6]/10 text-[#3B82F6]" :
                              order.status === "pending" ? "bg-[#F59E0B]/10 text-[#F59E0B]" :
                              "bg-[#EF4444]/10 text-[#EF4444]"
                            }`}>
                              {order.status === "completed" ? "Abgeschlossen" :
                               order.status === "paid" ? "Bezahlt" :
                               order.status === "pending" ? "Ausstehend" :
                               order.status === "refunded" ? "Erstattet" : "Storniert"}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-[#64748B]">Noch keine Bestellungen.</p>
                  )}
                </div>
              </div>
            )}

            {activeTab === "orders" && (
              <div className="animate-fade-in">
                <div className="bg-[#111827] rounded-xl card-shadow overflow-hidden">
                  {ordersLoading ? (
                    <div className="flex items-center justify-center py-12">
                      <Loader2 className="w-6 h-6 text-[#6366F1] animate-spin" />
                    </div>
                  ) : ordersData?.items && ordersData.items.length > 0 ? (
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="bg-[#1A2235]">
                            <th className="text-left text-xs font-medium text-[#64748B] uppercase tracking-wider px-6 py-3">Bestellnr.</th>
                            <th className="text-left text-xs font-medium text-[#64748B] uppercase tracking-wider px-6 py-3">Datum</th>
                            <th className="text-left text-xs font-medium text-[#64748B] uppercase tracking-wider px-6 py-3">Produkte</th>
                            <th className="text-left text-xs font-medium text-[#64748B] uppercase tracking-wider px-6 py-3">Betrag</th>
                            <th className="text-left text-xs font-medium text-[#64748B] uppercase tracking-wider px-6 py-3">Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[#1E293B]">
                          {ordersData.items.map((order: any) => (
                            <tr key={order.id} className="hover:bg-[#1A2235]/50 transition-colors">
                              <td className="px-6 py-4 text-sm text-[#F1F5F9] font-medium">{order.orderNumber}</td>
                              <td className="px-6 py-4 text-sm text-[#94A3B8]">{formatDate(order.createdAt)}</td>
                              <td className="px-6 py-4 text-sm text-[#94A3B8]">{order.items?.length ?? 0} Artikel</td>
                              <td className="px-6 py-4 text-sm font-semibold text-[#6366F1]">{order.total} &euro;</td>
                              <td className="px-6 py-4">
                                <span className={`text-xs px-2 py-1 rounded-full ${
                                  order.status === "completed" ? "bg-[#22C55E]/10 text-[#22C55E]" :
                                  order.status === "paid" ? "bg-[#3B82F6]/10 text-[#3B82F6]" :
                                  order.status === "pending" ? "bg-[#F59E0B]/10 text-[#F59E0B]" :
                                  "bg-[#EF4444]/10 text-[#EF4444]"
                                }`}>
                                  {order.status === "completed" ? "Abgeschlossen" :
                                   order.status === "paid" ? "Bezahlt" :
                                   order.status === "pending" ? "Ausstehend" :
                                   order.status === "refunded" ? "Erstattet" : "Storniert"}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <Package className="w-10 h-10 text-[#64748B] mx-auto mb-3" />
                      <p className="text-sm text-[#94A3B8]">Noch keine Bestellungen vorhanden.</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeTab === "downloads" && (
              <div className="animate-fade-in">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {ordersData?.items
                    ?.filter((o: any) => o.status === "completed" || o.status === "paid")
                    .flatMap((order: any) =>
                      order.items?.map((item: any) => (
                        <div key={item.id} className="bg-[#111827] rounded-xl card-shadow p-5">
                          <div className="flex items-start gap-4">
                            <div className="w-16 h-12 rounded-lg bg-[#1A2235] flex items-center justify-center shrink-0">
                              <Package className="w-6 h-6 text-[#6366F1]" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <h3 className="text-sm font-medium text-[#F1F5F9] truncate">{item.productName}</h3>
                              <p className="text-xs text-[#64748B] mt-1">{formatDate(order.createdAt)}</p>
                              {item.licenseKey && (
                                <p className="text-xs text-[#6366F1] mt-1 font-mono">Key: {item.licenseKey.slice(0, 20)}...</p>
                              )}
                            </div>
                          </div>
                          <div className="mt-4 flex gap-2">
                            {item.fileUrl && (
                              <button className="flex-1 h-9 gradient-bg text-white text-xs rounded-md flex items-center justify-center">
                                <Download className="w-3.5 h-3.5 mr-1.5" />
                                Download
                              </button>
                            )}
                            {item.licenseKey && (
                              <button
                                className="h-9 px-3 border border-[#2D3748] text-[#94A3B8] text-xs rounded-md"
                                onClick={() => navigator.clipboard.writeText(item.licenseKey ?? "")}
                              >
                                Key kopieren
                              </button>
                            )}
                          </div>
                        </div>
                      ))
                    )}
                  {(!ordersData?.items || ordersData.items.filter((o: any) => o.status === "completed" || o.status === "paid").length === 0) && (
                    <div className="col-span-full text-center py-12 bg-[#111827] rounded-xl card-shadow">
                      <Download className="w-10 h-10 text-[#64748B] mx-auto mb-3" />
                      <p className="text-sm text-[#94A3B8]">Noch keine Downloads verf\u00fcgbar.</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeTab === "tickets" && (
              <div className="animate-fade-in space-y-4">
                {ticketData?.items && ticketData.items.length > 0 ? (
                  ticketData.items.map((ticket: any) => (
                    <div key={ticket.id} className="bg-[#111827] rounded-xl card-shadow p-5">
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-sm font-medium text-[#F1F5F9]">{ticket.ticketNumber}</span>
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
                      </div>
                      <h3 className="text-sm font-medium text-[#F1F5F9] mb-1">{ticket.subject}</h3>
                      <p className="text-xs text-[#64748B]">{ticket.category} | {formatDate(ticket.createdAt)}</p>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-12 bg-[#111827] rounded-xl card-shadow">
                    <Ticket className="w-10 h-10 text-[#64748B] mx-auto mb-3" />
                    <p className="text-sm text-[#94A3B8]">Noch keine Tickets erstellt.</p>
                  </div>
                )}
              </div>
            )}

            {activeTab === "settings" && (
              <div className="animate-fade-in max-w-lg">
                <div className="bg-[#111827] rounded-xl card-shadow p-6 space-y-6">
                  <div className="flex items-center gap-4 pb-6 border-b border-[#2D3748]">
                    <div className="w-16 h-16 rounded-full bg-gradient-to-br from-indigo-500 to-violet-500 flex items-center justify-center text-white text-xl font-bold">
                      {user.name?.[0]?.toUpperCase() || "U"}
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-[#F1F5F9]">{user.name ?? "Benutzer"}</h3>
                      <div className="flex items-center gap-2 text-sm text-[#94A3B8]">
                        <Mail className="w-3.5 h-3.5" />
                        {user.email ?? ""}
                      </div>
                      <div className="flex items-center gap-2 text-xs text-[#64748B] mt-1">
                        <Shield className="w-3 h-3" />
                        Rolle: {user.role === "admin" ? "Administrator" : user.role === "seller" ? "Verk\u00e4ufer" : "Kunde"}
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-medium text-[#94A3B8] uppercase tracking-wider mb-2 block">Name</label>
                    <div className="p-3 rounded-lg bg-[#1A2235] border border-[#2D3748] text-sm text-[#F1F5F9]">
                      {user.name ?? "Nicht angegeben"}
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-medium text-[#94A3B8] uppercase tracking-wider mb-2 block">E-Mail</label>
                    <div className="p-3 rounded-lg bg-[#1A2235] border border-[#2D3748] text-sm text-[#F1F5F9]">
                      {user.email ?? "Nicht angegeben"}
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-medium text-[#94A3B8] uppercase tracking-wider mb-2 block">Account-ID</label>
                    <div className="p-3 rounded-lg bg-[#1A2235] border border-[#2D3748] text-sm text-[#64748B] font-mono">
                      {user.unionId}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
