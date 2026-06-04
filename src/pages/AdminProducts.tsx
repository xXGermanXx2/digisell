import { useState } from "react";
import { trpc } from "@/providers/trpc";
import AdminLayout from "@/components/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  Plus,
  Search,
  Edit,
  Trash2,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";

export default function AdminProducts() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<any>(null);
  const [licenseKeysInput, setLicenseKeysInput] = useState("");

  const utils = trpc.useUtils();
  const { data: productsData, isLoading } = trpc.product.list.useQuery({
    search: search || undefined,
    status: statusFilter as any,
    limit: 50,
  });
  const { data: categories } = trpc.category.list.useQuery();

  const createProduct = trpc.product.create.useMutation({
    onSuccess: () => {
      utils.product.list.invalidate();
      setIsDialogOpen(false);
      resetForm();
      toast.success("Produkt erstellt");
    },
    onError: (err) => toast.error(err.message),
  });
  const deleteProduct = trpc.product.delete.useMutation({
    onSuccess: () => {
      utils.product.list.invalidate();
      toast.success("Produkt gel\u00f6scht");
    },
  });

  const [form, setForm] = useState<{
    name: string;
    slug: string;
    description: string;
    shortDescription: string;
    price: string;
    compareAtPrice: string;
    categoryId: string;
    type: string;
    image: string;
    fileUrl: string;
    stock: string;
    status: string;
    visibility: string;
    tags: string;
  }>({
    name: "",
    slug: "",
    description: "",
    shortDescription: "",
    price: "",
    compareAtPrice: "",
    categoryId: "",
    type: "file",
    image: "",
    fileUrl: "",
    stock: "-1",
    status: "draft",
    visibility: "public",
    tags: "",
  });

  const resetForm = () => {
    setForm({
      name: "", slug: "", description: "", shortDescription: "", price: "",
      compareAtPrice: "", categoryId: "", type: "file", image: "", fileUrl: "",
      stock: "-1", status: "draft", visibility: "public", tags: "",
    });
    setLicenseKeysInput("");
    setEditingProduct(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const licenseKeys = licenseKeysInput.split("\n").filter((k) => k.trim());
    createProduct.mutate({
      ...form,
      price: form.price,
      compareAtPrice: form.compareAtPrice || undefined,
      categoryId: parseInt(form.categoryId),
      stock: parseInt(form.stock),
      type: form.type as "file" | "license" | "service" | "subscription",
      status: form.status as "active" | "inactive" | "draft",
      visibility: form.visibility as "public" | "private",
      tags: form.tags.split(",").map((t) => t.trim()).filter(Boolean),
      licenseKeys: licenseKeys.length > 0 ? licenseKeys : undefined,
    });
  };

  const showLicenseField = form.type === "license";

  return (
    <AdminLayout>
      <div className="space-y-6 animate-fade-in">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-[#F1F5F9]">Produkte</h1>
            <p className="text-sm text-[#94A3B8] mt-1">Verwalte deine digitalen Produkte</p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gradient-bg text-white hover:opacity-90" onClick={resetForm}>
                <Plus className="w-4 h-4 mr-2" />
                Neues Produkt
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-[#111827] border-[#2D3748] text-[#F1F5F9] max-w-lg max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="text-lg font-semibold">
                  {editingProduct ? "Produkt bearbeiten" : "Produkt erstellen"}
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4 mt-4">
                <div>
                  <Label className="text-xs text-[#94A3B8]">Name</Label>
                  <Input
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value, slug: e.target.value.toLowerCase().replace(/\s+/g, "-") })}
                    className="bg-[#1A2235] border-[#2D3748] text-[#F1F5F9] mt-1"
                    required
                  />
                </div>
                <div>
                  <Label className="text-xs text-[#94A3B8]">Slug</Label>
                  <Input
                    value={form.slug}
                    onChange={(e) => setForm({ ...form, slug: e.target.value })}
                    className="bg-[#1A2235] border-[#2D3748] text-[#F1F5F9] mt-1"
                    required
                  />
                </div>
                <div>
                  <Label className="text-xs text-[#94A3B8]">Beschreibung</Label>
                  <Textarea
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                    className="bg-[#1A2235] border-[#2D3748] text-[#F1F5F9] mt-1 min-h-[80px]"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs text-[#94A3B8]">Preis (&euro;)</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={form.price}
                      onChange={(e) => setForm({ ...form, price: e.target.value })}
                      className="bg-[#1A2235] border-[#2D3748] text-[#F1F5F9] mt-1"
                      required
                    />
                  </div>
                  <div>
                    <Label className="text-xs text-[#94A3B8]">Vergleichspreis</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={form.compareAtPrice}
                      onChange={(e) => setForm({ ...form, compareAtPrice: e.target.value })}
                      className="bg-[#1A2235] border-[#2D3748] text-[#F1F5F9] mt-1"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs text-[#94A3B8]">Kategorie</Label>
                    <Select value={form.categoryId} onValueChange={(v) => setForm({ ...form, categoryId: v })}>
                      <SelectTrigger className="bg-[#1A2235] border-[#2D3748] text-[#F1F5F9] mt-1">
                        <SelectValue placeholder="W\u00e4hlen" />
                      </SelectTrigger>
                      <SelectContent className="bg-[#1E293B] border-[#2D3748]">
                        {categories?.map((cat) => (
                          <SelectItem key={cat.id} value={cat.id.toString()} className="text-[#F1F5F9]">
                            {cat.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-xs text-[#94A3B8]">Typ</Label>
                    <Select value={form.type} onValueChange={(v: any) => setForm({ ...form, type: v })}>
                      <SelectTrigger className="bg-[#1A2235] border-[#2D3748] text-[#F1F5F9] mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-[#1E293B] border-[#2D3748]">
                        <SelectItem value="file" className="text-[#F1F5F9]">Datei</SelectItem>
                        <SelectItem value="license" className="text-[#F1F5F9]">Lizenz</SelectItem>
                        <SelectItem value="service" className="text-[#F1F5F9]">Service</SelectItem>
                        <SelectItem value="subscription" className="text-[#F1F5F9]">Abonnement</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div>
                  <Label className="text-xs text-[#94A3B8]">Bild-URL</Label>
                  <Input
                    value={form.image}
                    onChange={(e) => setForm({ ...form, image: e.target.value })}
                    placeholder="https://..."
                    className="bg-[#1A2235] border-[#2D3748] text-[#F1F5F9] mt-1"
                  />
                </div>
                <div>
                  <Label className="text-xs text-[#94A3B8]">Datei-URL (f\u00fcr Download)</Label>
                  <Input
                    value={form.fileUrl}
                    onChange={(e) => setForm({ ...form, fileUrl: e.target.value })}
                    placeholder="https://..."
                    className="bg-[#1A2235] border-[#2D3748] text-[#F1F5F9] mt-1"
                  />
                </div>
                {showLicenseField && (
                  <div>
                    <Label className="text-xs text-[#94A3B8]">Lizenzschl\u00fcssel (einer pro Zeile)</Label>
                    <Textarea
                      value={licenseKeysInput}
                      onChange={(e) => setLicenseKeysInput(e.target.value)}
                      placeholder="XXXX-XXXX-XXXX-XXXX"
                      className="bg-[#1A2235] border-[#2D3748] text-[#F1F5F9] mt-1 min-h-[80px]"
                    />
                  </div>
                )}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs text-[#94A3B8]">Bestand (-1 = unbegrenzt)</Label>
                    <Input
                      type="number"
                      value={form.stock}
                      onChange={(e) => setForm({ ...form, stock: e.target.value })}
                      className="bg-[#1A2235] border-[#2D3748] text-[#F1F5F9] mt-1"
                    />
                  </div>
                  <div>
                    <Label className="text-xs text-[#94A3B8]">Status</Label>
                    <Select value={form.status} onValueChange={(v: any) => setForm({ ...form, status: v })}>
                      <SelectTrigger className="bg-[#1A2235] border-[#2D3748] text-[#F1F5F9] mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-[#1E293B] border-[#2D3748]">
                        <SelectItem value="draft" className="text-[#F1F5F9]">Entwurf</SelectItem>
                        <SelectItem value="active" className="text-[#F1F5F9]">Aktiv</SelectItem>
                        <SelectItem value="inactive" className="text-[#F1F5F9]">Inaktiv</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div>
                  <Label className="text-xs text-[#94A3B8]">Tags (kommagetrennt)</Label>
                  <Input
                    value={form.tags}
                    onChange={(e) => setForm({ ...form, tags: e.target.value })}
                    placeholder="SEO, Marketing, Tool"
                    className="bg-[#1A2235] border-[#2D3748] text-[#F1F5F9] mt-1"
                  />
                </div>
                <Button
                  type="submit"
                  disabled={createProduct.isPending}
                  className="w-full gradient-bg text-white hover:opacity-90"
                >
                  {createProduct.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Produkt erstellen"}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#64748B]" />
            <Input
              placeholder="Produkte suchen..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 bg-[#111827] border-[#2D3748] text-[#F1F5F9] placeholder:text-[#64748B]"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-40 bg-[#111827] border-[#2D3748] text-[#F1F5F9]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent className="bg-[#1E293B] border-[#2D3748]">
              <SelectItem value="all" className="text-[#F1F5F9]">Alle</SelectItem>
              <SelectItem value="active" className="text-[#F1F5F9]">Aktiv</SelectItem>
              <SelectItem value="inactive" className="text-[#F1F5F9]">Inaktiv</SelectItem>
              <SelectItem value="draft" className="text-[#F1F5F9]">Entwurf</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="bg-[#111827] rounded-xl card-shadow overflow-hidden">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-6 h-6 text-[#6366F1] animate-spin" />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-[#1A2235]">
                    <th className="text-left text-xs font-medium text-[#64748B] uppercase tracking-wider px-6 py-3">Produkt</th>
                    <th className="text-left text-xs font-medium text-[#64748B] uppercase tracking-wider px-6 py-3">Kategorie</th>
                    <th className="text-left text-xs font-medium text-[#64748B] uppercase tracking-wider px-6 py-3">Preis</th>
                    <th className="text-left text-xs font-medium text-[#64748B] uppercase tracking-wider px-6 py-3">Bestand</th>
                    <th className="text-left text-xs font-medium text-[#64748B] uppercase tracking-wider px-6 py-3">Status</th>
                    <th className="text-right text-xs font-medium text-[#64748B] uppercase tracking-wider px-6 py-3">Aktionen</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1E293B]">
                  {productsData?.items?.map((product) => (
                    <tr key={product.id} className="hover:bg-[#1A2235]/30 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <img
                            src={product.image ?? "https://placehold.co/40x40/1A2235/6366F1?text=P"}
                            alt={product.name}
                            className="w-10 h-10 rounded-lg object-cover shrink-0"
                          />
                          <span className="text-sm text-[#F1F5F9] font-medium">{product.name}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-[#94A3B8]">{product.category?.name ?? "-"}</td>
                      <td className="px-6 py-4 text-sm font-semibold text-[#6366F1]">{product.price} &euro;</td>
                      <td className="px-6 py-4 text-sm text-[#94A3B8]">{product.stock === -1 ? "\u221e" : product.stock}</td>
                      <td className="px-6 py-4">
                        <span className={`text-xs px-2 py-1 rounded-full ${
                          product.status === "active" ? "bg-[#22C55E]/10 text-[#22C55E]" :
                          product.status === "draft" ? "bg-[#F59E0B]/10 text-[#F59E0B]" :
                          "bg-[#EF4444]/10 text-[#EF4444]"
                        }`}>
                          {product.status === "active" ? "Aktiv" : product.status === "draft" ? "Entwurf" : "Inaktiv"}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => {
                              setEditingProduct(product);
                              setForm({
                                name: product.name,
                                slug: product.slug,
                                description: product.description ?? "",
                                shortDescription: product.shortDescription ?? "",
                                price: product.price,
                                compareAtPrice: product.compareAtPrice ?? "",
                                categoryId: product.categoryId?.toString() ?? "",
                                type: product.type as any,
                                image: product.image ?? "",
                                fileUrl: product.fileUrl ?? "",
                                stock: product.stock.toString(),
                                status: product.status as any,
                                visibility: product.visibility as any,
                                tags: product.tags?.join(", ") ?? "",
                              });
                              setIsDialogOpen(true);
                            }}
                            className="p-1.5 rounded-lg hover:bg-[#6366F1]/10 text-[#64748B] hover:text-[#6366F1] transition-colors"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => {
                              if (confirm("Produkt wirklich l\u00f6schen?")) {
                                deleteProduct.mutate({ id: product.id });
                              }
                            }}
                            className="p-1.5 rounded-lg hover:bg-[#EF4444]/10 text-[#64748B] hover:text-[#EF4444] transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {(!productsData?.items || productsData.items.length === 0) && (
                <div className="text-center py-12 text-sm text-[#64748B]">Keine Produkte gefunden</div>
              )}
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}
