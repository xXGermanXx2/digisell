import { useParams, Link } from "react-router";
import { trpc } from "@/providers/trpc";
import { Loader2, ArrowLeft, Printer, Download } from "lucide-react";

export default function InvoiceView() {
  const { orderId } = useParams<{ orderId: string }>();
  const id = Number(orderId);

  const { data, isLoading, error } = trpc.invoice.getInvoice.useQuery(
    { orderId: id },
    { enabled: !isNaN(id) }
  );

  const handlePrint = () => {
    const printWindow = window.open("", "_blank");
    if (!printWindow || !data) return;
    printWindow.document.write(data.html);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
    }, 500);
  };

  const handleDownload = () => {
    if (!data) return;
    const blob = new Blob([data.html], { type: "text/html;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `Rechnung_${data.orderNumber}.html`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-950">
        <Loader2 className="w-8 h-8 text-indigo-400 animate-spin" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-gray-950">
        <p className="text-red-400 text-lg">Rechnung nicht gefunden oder kein Zugriff.</p>
        <Link to="/dashboard/orders" className="text-indigo-400 hover:text-indigo-300 flex items-center gap-2 transition-colors">
          <ArrowLeft className="w-4 h-4" /> Zurück zu Bestellungen
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950">
      {/* Toolbar */}
      <div className="sticky top-0 z-10 bg-gray-900/95 backdrop-blur border-b border-white/10 px-6 py-3 flex items-center justify-between">
        <Link
          to="/dashboard/orders"
          className="flex items-center gap-2 text-sm text-white/60 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Zurück
        </Link>
        <div className="flex items-center gap-3">
          <span className="text-sm text-white/60">Rechnung {data.orderNumber}</span>
          <button
            onClick={handleDownload}
            className="flex items-center gap-2 px-3 py-1.5 text-sm bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors"
          >
            <Download className="w-4 h-4" />
            Herunterladen
          </button>
          <button
            onClick={handlePrint}
            className="flex items-center gap-2 px-3 py-1.5 text-sm bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg transition-colors"
          >
            <Printer className="w-4 h-4" />
            Drucken
          </button>
        </div>
      </div>

      {/* Invoice preview */}
      <div className="p-6">
        <div className="max-w-4xl mx-auto">
          <div
            className="bg-white rounded-2xl shadow-2xl overflow-hidden"
            dangerouslySetInnerHTML={{ __html: data.html }}
          />
        </div>
      </div>
    </div>
  );
}
