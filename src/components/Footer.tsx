import { Link } from "react-router";
import { Store, Github, Twitter, Mail } from "lucide-react";

export default function Footer() {
  return (
    <footer className="bg-[#111827] border-t border-[#2D3748]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="space-y-4">
            <Link to="/" className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg gradient-bg flex items-center justify-center">
                <Store className="w-4 h-4 text-white" />
              </div>
              <span className="text-xl font-bold gradient-text">DigiSell</span>
            </Link>
            <p className="text-sm text-[#94A3B8] leading-relaxed">
              Die führende Plattform für den Verkauf digitaler Produkte. Einfach, sicher und profitabel.
            </p>
            <div className="flex gap-3">
              <a href="#" className="w-8 h-8 rounded-lg bg-[#1A2235] flex items-center justify-center text-[#64748B] hover:text-white hover:bg-[#2D3748] transition-colors">
                <Twitter className="w-4 h-4" />
              </a>
              <a href="#" className="w-8 h-8 rounded-lg bg-[#1A2235] flex items-center justify-center text-[#64748B] hover:text-white hover:bg-[#2D3748] transition-colors">
                <Github className="w-4 h-4" />
              </a>
              <a href="#" className="w-8 h-8 rounded-lg bg-[#1A2235] flex items-center justify-center text-[#64748B] hover:text-white hover:bg-[#2D3748] transition-colors">
                <Mail className="w-4 h-4" />
              </a>
            </div>
          </div>

          {/* Products */}
          <div>
            <h4 className="text-sm font-semibold text-[#F1F5F9] mb-4">Produkte</h4>
            <ul className="space-y-2">
              <li><Link to="/?category=software" className="text-sm text-[#94A3B8] hover:text-[#6366F1] transition-colors">Software</Link></li>
              <li><Link to="/?category=e-books" className="text-sm text-[#94A3B8] hover:text-[#6366F1] transition-colors">E-Books</Link></li>
              <li><Link to="/?category=templates" className="text-sm text-[#94A3B8] hover:text-[#6366F1] transition-colors">Templates</Link></li>
              <li><Link to="/?category=lizenzen" className="text-sm text-[#94A3B8] hover:text-[#6366F1] transition-colors">Lizenzen</Link></li>
            </ul>
          </div>

          {/* Company */}
          <div>
            <h4 className="text-sm font-semibold text-[#F1F5F9] mb-4">Unternehmen</h4>
            <ul className="space-y-2">
              <li><a href="#" className="text-sm text-[#94A3B8] hover:text-[#6366F1] transition-colors">Über uns</a></li>
              <li><a href="#" className="text-sm text-[#94A3B8] hover:text-[#6366F1] transition-colors">Karriere</a></li>
              <li><a href="#" className="text-sm text-[#94A3B8] hover:text-[#6366F1] transition-colors">Blog</a></li>
              <li><a href="#" className="text-sm text-[#94A3B8] hover:text-[#6366F1] transition-colors">Kontakt</a></li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h4 className="text-sm font-semibold text-[#F1F5F9] mb-4">Rechtliches</h4>
            <ul className="space-y-2">
              <li><a href="#" className="text-sm text-[#94A3B8] hover:text-[#6366F1] transition-colors">AGB</a></li>
              <li><a href="#" className="text-sm text-[#94A3B8] hover:text-[#6366F1] transition-colors">Datenschutz</a></li>
              <li><a href="#" className="text-sm text-[#94A3B8] hover:text-[#6366F1] transition-colors">Impressum</a></li>
              <li><a href="#" className="text-sm text-[#94A3B8] hover:text-[#6366F1] transition-colors">Cookie-Richtlinie</a></li>
            </ul>
          </div>
        </div>

        <div className="mt-10 pt-6 border-t border-[#2D3748] flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-[#64748B]">
            &copy; {new Date().getFullYear()} DigiSell. Alle Rechte vorbehalten.
          </p>
          <p className="text-xs text-[#64748B]">
            Hergestellt mit &hearts; in Deutschland
          </p>
        </div>
      </div>
    </footer>
  );
}
