import { Link } from "react-router";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Store } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[#0A0E1A] flex items-center justify-center px-4">
      <div className="text-center">
        <div className="text-[120px] font-bold gradient-text leading-none mb-4">404</div>
        <h1 className="text-2xl font-bold text-[#F1F5F9] mb-3">Seite nicht gefunden</h1>
        <p className="text-sm text-[#94A3B8] mb-8 max-w-sm mx-auto">
          Die gesuchte Seite existiert nicht oder wurde verschoben. Überprüfe die URL oder kehre zur Startseite zurück.
        </p>
        <div className="flex items-center justify-center gap-4">
          <Link to="/">
            <Button className="gradient-bg text-white hover:opacity-90">
              <Store className="w-4 h-4 mr-2" />
              Zurück zur Startseite
            </Button>
          </Link>
          <button onClick={() => window.history.back()}>
            <Button variant="outline" className="border-[#2D3748] text-[#F1F5F9] hover:bg-[#1A2235]">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Zurück
            </Button>
          </button>
        </div>
      </div>
    </div>
  );
}
