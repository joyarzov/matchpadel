import { Link } from 'react-router-dom';
import { Instagram, Facebook, Twitter, MapPin } from 'lucide-react';
import { PadelIcon } from '@/components/icons/PadelIcon';

export function Footer() {
  return (
    <footer className="border-t bg-white">
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
          {/* Brand */}
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-2">
              <PadelIcon className="h-6 w-6 text-amber-500" />
              <span className="text-lg font-bold text-blue-800">MatchPadel</span>
            </div>
            <p className="text-sm text-slate-500">
              Conectando jugadores de pádel en Chile
            </p>
            <div className="flex items-center gap-1 text-sm text-slate-500">
              <MapPin className="h-4 w-4" />
              <span>Valdivia, Chile</span>
            </div>
          </div>

          {/* Links */}
          <div className="flex flex-col gap-3">
            <h3 className="text-sm font-semibold text-slate-800">Enlaces</h3>
            <Link
              to="/about"
              className="text-sm text-slate-500 transition-colors hover:text-blue-800"
            >
              Sobre nosotros
            </Link>
            <Link
              to="/contact"
              className="text-sm text-slate-500 transition-colors hover:text-blue-800"
            >
              Contacto
            </Link>
          </div>

          {/* Social */}
          <div className="flex flex-col gap-3">
            <h3 className="text-sm font-semibold text-slate-800">Síguenos</h3>
            <div className="flex items-center gap-4">
              <a
                href="https://instagram.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-slate-400 transition-colors hover:text-blue-800"
                aria-label="Instagram"
              >
                <Instagram className="h-5 w-5" />
              </a>
              <a
                href="https://facebook.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-slate-400 transition-colors hover:text-blue-800"
                aria-label="Facebook"
              >
                <Facebook className="h-5 w-5" />
              </a>
              <a
                href="https://twitter.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-slate-400 transition-colors hover:text-blue-800"
                aria-label="Twitter"
              >
                <Twitter className="h-5 w-5" />
              </a>
            </div>
          </div>
        </div>

        <div className="mt-8 border-t pt-6 text-center">
          <p className="text-sm text-slate-400">
            MatchPadel &copy; 2025 - Conectando jugadores de pádel en Chile
          </p>
        </div>
      </div>
    </footer>
  );
}
