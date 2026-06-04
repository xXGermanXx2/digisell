import { useState } from "react";
import { useNavigate } from "react-router";
import { trpc } from "@/providers/trpc";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Store,
  ChevronRight,
  ChevronLeft,
  Check,
  Loader2,
  AlertCircle,
  Globe,
  Tag,
  Image,
  Sparkles,
} from "lucide-react";

const SHOP_CATEGORIES = [
  { value: "software", label: "Software & Tools" },
  { value: "games", label: "Games & Keys" },
  { value: "graphics", label: "Grafik & Design" },
  { value: "music", label: "Musik & Audio" },
  { value: "ebooks", label: "E-Books & Kurse" },
  { value: "templates", label: "Templates & Themes" },
  { value: "services", label: "Dienstleistungen" },
  { value: "general", label: "Allgemein" },
];

function slugify(text: string) {
  return text
    .toLowerCase()
    .replace(/ä/g, "ae")
    .replace(/ö/g, "oe")
    .replace(/ü/g, "ue")
    .replace(/ß/g, "ss")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 60);
}

export default function ShopSetupWizard() {
  const navigate = useNavigate();
  const { user } = useAuth({ redirectOnUnauthenticated: true });

  const [step, setStep] = useState(1);
  const [error, setError] = useState("");

  // Form state
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [slugManual, setSlugManual] = useState(false);
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("general");
  const [logo, setLogo] = useState("");
  const [banner, setBanner] = useState("");

  const checkSlug = trpc.seller.checkSlug.useQuery(
    { slug },
    { enabled: slug.length >= 2, staleTime: 2000 }
  );

  const createShop = trpc.seller.createShop.useMutation({
    onSuccess: (data) => {
      navigate("/seller");
    },
    onError: (err) => {
      setError(err.message);
    },
  });

  const handleNameChange = (val: string) => {
    setName(val);
    if (!slugManual) {
      setSlug(slugify(val));
    }
  };

  const handleSlugChange = (val: string) => {
    setSlugManual(true);
    setSlug(slugify(val));
  };

  const canProceedStep1 = name.length >= 2 && slug.length >= 2 && checkSlug.data?.available !== false;
  const canProceedStep2 = description.length >= 10;
  const canProceedStep3 = !!category;

  const handleSubmit = () => {
    setError("");
    createShop.mutate({ name, slug, description, category, logo, banner });
  };

  const slugAvailable = checkSlug.data?.available;
  const slugChecking = checkSlug.isFetching;

  return (
    <div className="min-h-screen bg-[#0A0E1A] flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center mx-auto mb-4">
            <Store className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white">Shop erstellen</h1>
          <p className="text-gray-400 mt-2">Richte deinen Shop in wenigen Schritten ein</p>
        </div>

        {/* Progress */}
        <div className="flex items-center justify-center gap-2 mb-8">
          {[1, 2, 3, 4].map((s) => (
            <div key={s} className="flex items-center gap-2">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-all ${
                  s < step
                    ? "bg-indigo-500 text-white"
                    : s === step
                    ? "bg-indigo-500/20 border-2 border-indigo-500 text-indigo-400"
                    : "bg-[#1A2235] text-gray-500"
                }`}
              >
                {s < step ? <Check className="w-4 h-4" /> : s}
              </div>
              {s < 4 && (
                <div className={`w-12 h-0.5 ${s < step ? "bg-indigo-500" : "bg-[#2D3748]"}`} />
              )}
            </div>
          ))}
        </div>

        {/* Card */}
        <div className="bg-[#111827] border border-[#2D3748] rounded-2xl p-8">

          {/* Step 1: Name & URL */}
          {step === 1 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-semibold text-white flex items-center gap-2">
                  <Store className="w-5 h-5 text-indigo-400" />
                  Shop-Name & URL
                </h2>
                <p className="text-gray-400 text-sm mt-1">Wie soll dein Shop heißen?</p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Shop-Name *</label>
                  <Input
                    value={name}
                    onChange={(e) => handleNameChange(e.target.value)}
                    placeholder="z.B. Max's Software Shop"
                    className="bg-[#1A2235] border-[#2D3748] text-white placeholder:text-gray-500 focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    <Globe className="w-4 h-4 inline mr-1" />
                    Shop-URL *
                  </label>
                  <div className="flex items-center gap-2">
                    <span className="text-gray-500 text-sm whitespace-nowrap">digisell.app/store/</span>
                    <div className="relative flex-1">
                      <Input
                        value={slug}
                        onChange={(e) => handleSlugChange(e.target.value)}
                        placeholder="mein-shop"
                        className="bg-[#1A2235] border-[#2D3748] text-white placeholder:text-gray-500 focus:border-indigo-500"
                      />
                      {slug.length >= 2 && (
                        <div className="absolute right-3 top-1/2 -translate-y-1/2">
                          {slugChecking ? (
                            <Loader2 className="w-4 h-4 text-gray-400 animate-spin" />
                          ) : slugAvailable ? (
                            <Check className="w-4 h-4 text-green-400" />
                          ) : (
                            <AlertCircle className="w-4 h-4 text-red-400" />
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                  {slug.length >= 2 && !slugChecking && (
                    <p className={`text-xs mt-1 ${slugAvailable ? "text-green-400" : "text-red-400"}`}>
                      {slugAvailable ? "✓ Diese URL ist verfügbar" : "✗ Diese URL ist bereits vergeben"}
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Beschreibung */}
          {step === 2 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-semibold text-white flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-indigo-400" />
                  Shop-Beschreibung
                </h2>
                <p className="text-gray-400 text-sm mt-1">Beschreibe deinen Shop für Kunden</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Beschreibung *</label>
                <Textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Beschreibe, was du verkaufst und was deinen Shop besonders macht..."
                  rows={5}
                  className="bg-[#1A2235] border-[#2D3748] text-white placeholder:text-gray-500 focus:border-indigo-500 resize-none"
                />
                <p className="text-xs text-gray-500 mt-1">{description.length}/1000 Zeichen (min. 10)</p>
              </div>
            </div>
          )}

          {/* Step 3: Kategorie */}
          {step === 3 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-semibold text-white flex items-center gap-2">
                  <Tag className="w-5 h-5 text-indigo-400" />
                  Shop-Kategorie
                </h2>
                <p className="text-gray-400 text-sm mt-1">In welcher Kategorie verkaufst du?</p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {SHOP_CATEGORIES.map((cat) => (
                  <button
                    key={cat.value}
                    onClick={() => setCategory(cat.value)}
                    className={`p-4 rounded-xl border text-left transition-all ${
                      category === cat.value
                        ? "border-indigo-500 bg-indigo-500/10 text-white"
                        : "border-[#2D3748] bg-[#1A2235] text-gray-400 hover:border-[#4A5568] hover:text-white"
                    }`}
                  >
                    <span className="font-medium text-sm">{cat.label}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Step 4: Logo & Banner (optional) */}
          {step === 4 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-semibold text-white flex items-center gap-2">
                  <Image className="w-5 h-5 text-indigo-400" />
                  Shop-Bilder (optional)
                </h2>
                <p className="text-gray-400 text-sm mt-1">Logo und Banner können später auch noch geändert werden</p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Logo-URL (optional)</label>
                  <Input
                    value={logo}
                    onChange={(e) => setLogo(e.target.value)}
                    placeholder="https://example.com/logo.png"
                    className="bg-[#1A2235] border-[#2D3748] text-white placeholder:text-gray-500 focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Banner-URL (optional)</label>
                  <Input
                    value={banner}
                    onChange={(e) => setBanner(e.target.value)}
                    placeholder="https://example.com/banner.png"
                    className="bg-[#1A2235] border-[#2D3748] text-white placeholder:text-gray-500 focus:border-indigo-500"
                  />
                </div>

                {/* Preview */}
                <div className="bg-[#1A2235] rounded-xl p-4 border border-[#2D3748]">
                  <p className="text-xs text-gray-500 mb-3 uppercase tracking-wide">Vorschau</p>
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center overflow-hidden">
                      {logo ? (
                        <img src={logo} alt="Logo" className="w-full h-full object-cover" onError={() => {}} />
                      ) : (
                        <Store className="w-6 h-6 text-white" />
                      )}
                    </div>
                    <div>
                      <p className="font-semibold text-white">{name || "Mein Shop"}</p>
                      <p className="text-xs text-gray-400">digisell.app/store/{slug || "mein-shop"}</p>
                    </div>
                  </div>
                </div>
              </div>

              {error && (
                <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  {error}
                </div>
              )}
            </div>
          )}

          {/* Navigation */}
          <div className="flex items-center justify-between mt-8 pt-6 border-t border-[#2D3748]">
            <Button
              variant="ghost"
              onClick={() => setStep((s) => s - 1)}
              disabled={step === 1}
              className="text-gray-400 hover:text-white"
            >
              <ChevronLeft className="w-4 h-4 mr-1" />
              Zurück
            </Button>

            {step < 4 ? (
              <Button
                onClick={() => setStep((s) => s + 1)}
                disabled={
                  (step === 1 && !canProceedStep1) ||
                  (step === 2 && !canProceedStep2) ||
                  (step === 3 && !canProceedStep3)
                }
                className="bg-indigo-600 hover:bg-indigo-700 text-white"
              >
                Weiter
                <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            ) : (
              <Button
                onClick={handleSubmit}
                disabled={createShop.isPending}
                className="bg-indigo-600 hover:bg-indigo-700 text-white min-w-[140px]"
              >
                {createShop.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Erstelle Shop...
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4 mr-2" />
                    Shop erstellen
                  </>
                )}
              </Button>
            )}
          </div>
        </div>

        {/* Step labels */}
        <div className="flex justify-between mt-4 px-4 text-xs text-gray-500">
          <span>Name & URL</span>
          <span>Beschreibung</span>
          <span>Kategorie</span>
          <span>Bilder</span>
        </div>
      </div>
    </div>
  );
}
