import { Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Building2,
  Grid3X3,
  Users,
  Trophy,
  X,
} from 'lucide-react';
import { PadelIcon } from '@/components/icons/PadelIcon';
import { cn } from '@/lib/utils';

interface SidebarProps {
  open: boolean;
  onClose: () => void;
}

const sidebarLinks = [
  { label: 'Dashboard', href: '/admin', icon: LayoutDashboard },
  { label: 'Clubes', href: '/admin/clubs', icon: Building2 },
  { label: 'Canchas', href: '/admin/courts', icon: Grid3X3 },
  { label: 'Usuarios', href: '/admin/users', icon: Users },
  { label: 'Partidos', href: '/admin/matches', icon: Trophy },
];

export function Sidebar({ open, onClose }: SidebarProps) {
  const location = useLocation();

  const isActive = (href: string) => {
    if (href === '/admin') {
      return location.pathname === '/admin';
    }
    return location.pathname.startsWith(href);
  };

  const sidebarContent = (
    <div className="flex h-full flex-col bg-blue-800">
      {/* Logo */}
      <div className="flex h-16 items-center justify-between px-4">
        <Link to="/admin" className="flex items-center gap-2" onClick={onClose}>
          <PadelIcon className="h-7 w-7 text-amber-500" />
          <span className="text-lg font-bold text-white">MatchPadel</span>
        </Link>
        <button
          className="rounded-md p-1 text-blue-200 hover:bg-blue-700 hover:text-white lg:hidden"
          onClick={onClose}
          aria-label="Cerrar menú"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 px-3 py-4">
        {sidebarLinks.map((link) => (
          <Link
            key={link.href}
            to={link.href}
            onClick={onClose}
            className={cn(
              'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
              isActive(link.href)
                ? 'bg-blue-700 text-white'
                : 'text-blue-200 hover:bg-blue-700/50 hover:text-white',
            )}
          >
            <link.icon className="h-5 w-5 shrink-0" />
            <span>{link.label}</span>
          </Link>
        ))}
      </nav>

      {/* Footer */}
      <div className="border-t border-blue-700 px-4 py-4">
        <Link
          to="/"
          className="text-xs text-blue-300 transition-colors hover:text-white"
        >
          Volver al sitio
        </Link>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden w-64 shrink-0 lg:block">
        <div className="fixed left-0 top-0 h-screen w-64">{sidebarContent}</div>
      </aside>

      {/* Mobile overlay */}
      {open && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={onClose} />
          <div className="relative z-10 h-full w-64 shadow-xl">{sidebarContent}</div>
        </div>
      )}
    </>
  );
}
