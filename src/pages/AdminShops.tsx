import { useState } from "react";
import { trpc } from "@/providers/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Store, Search, Eye, Ban, Trash2, CheckCircle, TrendingUp, Package, ShoppingCart } from "lucide-react";

export default function AdminShops() {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<string>("all");
  const [page, setPage] = useState(1);
  const [selectedShop, setSelectedShop] = useState<number | null>(null);

  const { data, refetch } = trpc.admin.listShops.useQuery({
    search: search || undefined,
    status: status !== "all" ? (status as any) : undefined,
    page,
    limit: 20,
  });

  const { data: shopDetail } = trpc.admin.getShop.useQuery(
    { id: selectedShop! },
    { enabled: !!selectedShop }
  );

  const updateStatus = trpc.admin.updateShopStatus.useMutation({ onSuccess: () => refetch() });
  const deleteShop = trpc.admin.deleteShop.useMutation({ onSuccess: () => { refetch(); setSelectedShop(null); } });

  const statusColor: Record<string, string> = {
    active: "bg-green-500/20 text-green-400",
    inactive: "bg-gray-500/20 text-gray-400",
    suspended: "bg-red-500/20 text-red-400",
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Store className="w-6 h-6 text-purple-400" /> Shopverwaltung
          </h1>
          <p className="text-gray-400 text-sm mt-1">Alle Shops verwalten, sperren und überwachen</p>
        </div>
      </div>

      {/* Filter */}
      <Card className="bg-gray-900 border-gray-800">
        <CardContent className="pt-4">
          <div className="flex gap-3 flex-wrap">
            <div className="relative flex-1 min-w-48">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input placeholder="Shop suchen..." value={search} onChange={e => { setSearch(e.target.value); setPage(1); }}
                className="pl-9 bg-gray-800 border-gray-700 text-white" />
            </div>
            <Select value={status} onValueChange={v => { setStatus(v); setPage(1); }}>
              <SelectTrigger className="w-full sm:w-40 bg-gray-800 border-gray-700 text-white">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent className="bg-gray-800 border-gray-700">
                <SelectItem value="all">Alle</SelectItem>
                <SelectItem value="active">Aktiv</SelectItem>
                <SelectItem value="inactive">Inaktiv</SelectItem>
                <SelectItem value="suspended">Gesperrt</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Tabelle */}
      <Card className="bg-gray-900 border-gray-800">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="border-gray-800">
                <TableHead className="text-gray-400">Shop</TableHead>
                <TableHead className="text-gray-400">Inhaber</TableHead>
                <TableHead className="text-gray-400">Status</TableHead>
                <TableHead className="text-gray-400">Erstellt</TableHead>
                <TableHead className="text-gray-400 text-right">Aktionen</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data?.items.map(shop => (
                <TableRow key={shop.id} className="border-gray-800 hover:bg-gray-800/50">
                  <TableCell>
                    <div>
                      <p className="text-white font-medium">{shop.name}</p>
                      <p className="text-gray-400 text-xs">/{shop.slug}</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div>
                      <p className="text-white text-sm">{(shop as any).owner?.name ?? "—"}</p>
                      <p className="text-gray-400 text-xs">{(shop as any).owner?.email ?? "—"}</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColor[shop.status] ?? "bg-gray-500/20 text-gray-400"}`}>
                      {shop.status}
                    </span>
                  </TableCell>
                  <TableCell className="text-gray-400 text-sm">
                    {new Date(shop.createdAt!).toLocaleDateString("de-DE")}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex gap-2 justify-end">
                      <Button size="sm" variant="ghost" className="text-blue-400 hover:text-blue-300"
                        onClick={() => setSelectedShop(shop.id)}>
                        <Eye className="w-4 h-4" />
                      </Button>
                      {shop.status === "active" ? (
                        <Button size="sm" variant="ghost" className="text-yellow-400 hover:text-yellow-300"
                          onClick={() => updateStatus.mutate({ id: shop.id, status: "suspended" })}>
                          <Ban className="w-4 h-4" />
                        </Button>
                      ) : (
                        <Button size="sm" variant="ghost" className="text-green-400 hover:text-green-300"
                          onClick={() => updateStatus.mutate({ id: shop.id, status: "active" })}>
                          <CheckCircle className="w-4 h-4" />
                        </Button>
                      )}
                      <Button size="sm" variant="ghost" className="text-red-400 hover:text-red-300"
                        onClick={() => { if (confirm("Shop wirklich löschen?")) deleteShop.mutate({ id: shop.id }); }}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {(!data?.items || data.items.length === 0) && (
                <TableRow><TableCell colSpan={5} className="text-center text-gray-400 py-8">Keine Shops gefunden</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Pagination */}
      {data && data.total > 20 && (
        <div className="flex justify-center gap-2">
          <Button variant="outline" size="sm" disabled={page === 1} onClick={() => setPage(p => p - 1)}
            className="border-gray-700 text-gray-300">Zurück</Button>
          <span className="text-gray-400 text-sm self-center">Seite {page} / {Math.ceil(data.total / 20)}</span>
          <Button variant="outline" size="sm" disabled={page >= Math.ceil(data.total / 20)} onClick={() => setPage(p => p + 1)}
            className="border-gray-700 text-gray-300">Weiter</Button>
        </div>
      )}

      {/* Shop-Detail-Modal */}
      <Dialog open={!!selectedShop} onOpenChange={() => setSelectedShop(null)}>
        <DialogContent className="w-[calc(100vw-1rem)] sm:w-full bg-gray-900 border-gray-800 text-white max-w-2xl">
          <DialogHeader>
            <DialogTitle>Shop-Details</DialogTitle>
          </DialogHeader>
          {shopDetail && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <Card className="bg-gray-800 border-gray-700">
                  <CardContent className="pt-4 text-center">
                    <Package className="w-6 h-6 text-blue-400 mx-auto mb-1" />
                    <p className="text-2xl font-bold text-white">{shopDetail.stats.products}</p>
                    <p className="text-gray-400 text-xs">Produkte</p>
                  </CardContent>
                </Card>
                <Card className="bg-gray-800 border-gray-700">
                  <CardContent className="pt-4 text-center">
                    <ShoppingCart className="w-6 h-6 text-green-400 mx-auto mb-1" />
                    <p className="text-2xl font-bold text-white">{shopDetail.stats.orders}</p>
                    <p className="text-gray-400 text-xs">Bestellungen</p>
                  </CardContent>
                </Card>
                <Card className="bg-gray-800 border-gray-700">
                  <CardContent className="pt-4 text-center">
                    <TrendingUp className="w-6 h-6 text-purple-400 mx-auto mb-1" />
                    <p className="text-2xl font-bold text-white">€{shopDetail.stats.revenue.toFixed(2)}</p>
                    <p className="text-gray-400 text-xs">Umsatz</p>
                  </CardContent>
                </Card>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                <div><span className="text-gray-400">Name:</span> <span className="text-white ml-2">{shopDetail.shop.name}</span></div>
                <div><span className="text-gray-400">Slug:</span> <span className="text-white ml-2">/{shopDetail.shop.slug}</span></div>
                <div><span className="text-gray-400">Inhaber:</span> <span className="text-white ml-2">{(shopDetail.shop as any).owner?.name}</span></div>
                <div><span className="text-gray-400">Status:</span> <span className="text-white ml-2">{shopDetail.shop.status}</span></div>
              </div>
              <div className="flex gap-2 justify-end">
                {shopDetail.shop.status === "active" ? (
                  <Button variant="destructive" size="sm"
                    onClick={() => updateStatus.mutate({ id: shopDetail.shop.id, status: "suspended" })}>
                    <Ban className="w-4 h-4 mr-1" /> Sperren
                  </Button>
                ) : (
                  <Button size="sm" className="bg-green-600 hover:bg-green-700"
                    onClick={() => updateStatus.mutate({ id: shopDetail.shop.id, status: "active" })}>
                    <CheckCircle className="w-4 h-4 mr-1" /> Entsperren
                  </Button>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
