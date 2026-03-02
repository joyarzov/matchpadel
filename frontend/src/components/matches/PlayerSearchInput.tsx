import { useState, useEffect, useRef } from 'react';
import { Search, User as UserIcon, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useUserSearch } from '@/hooks/useUsers';

interface SearchResult {
  id: string;
  firstName: string;
  lastName: string;
  category: string;
  gender: string;
  avatarUrl: string | null;
}

interface PlayerSearchInputProps {
  index: number;
  value: { userId: string | null; name: string | null; user?: SearchResult };
  onChange: (value: { userId: string | null; name: string | null; user?: SearchResult }) => void;
}

export function PlayerSearchInput({ index, value, onChange }: PlayerSearchInputProps) {
  const [query, setQuery] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(query), 300);
    return () => clearTimeout(timer);
  }, [query]);

  const { data: results = [] } = useUserSearch(debouncedQuery);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
        // Auto-select as anonymous guest if user typed text and clicked away
        if (query.trim()) {
          onChange({ userId: null, name: query.trim() });
          setQuery('');
        }
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [query, onChange]);

  // If a player is selected, show their info
  if (value.userId || value.name) {
    const displayName = value.user
      ? `${value.user.firstName} ${value.user.lastName}`
      : value.name || `Jugador ${index + 2}`;
    const initials = value.user
      ? `${value.user.firstName.charAt(0)}${value.user.lastName.charAt(0)}`
      : displayName.charAt(0);

    return (
      <div className="flex items-center gap-2 rounded-md border border-slate-200 bg-white px-3 py-2">
        <Avatar className="h-7 w-7">
          {value.user?.avatarUrl && <AvatarImage src={value.user.avatarUrl} />}
          <AvatarFallback className={value.user ? 'bg-blue-100 text-xs font-semibold text-blue-800' : 'bg-slate-200 text-xs text-slate-500'}>
            {initials}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1">
          <p className="text-sm font-medium text-slate-700">{displayName}</p>
          {value.user?.category && (
            <p className="text-xs text-slate-400">{value.user.category}</p>
          )}
          {!value.user && value.name && (
            <p className="text-xs text-slate-400">Sin cuenta</p>
          )}
        </div>
        <button
          type="button"
          onClick={() => onChange({ userId: null, name: null })}
          className="rounded-full p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="relative">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <Input
          placeholder={`Buscar jugador ${index + 2}...`}
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setShowDropdown(true);
          }}
          onFocus={() => setShowDropdown(true)}
          className="pl-9"
        />
      </div>

      {showDropdown && query.length >= 2 && (
        <div className="absolute z-10 mt-1 w-full rounded-md border border-slate-200 bg-white shadow-lg">
          <div className="max-h-48 overflow-y-auto py-1">
            {results.map((user) => (
              <button
                key={user.id}
                type="button"
                className="flex w-full items-center gap-2 px-3 py-2 text-left hover:bg-slate-50"
                onClick={() => {
                  onChange({ userId: user.id, name: null, user });
                  setQuery('');
                  setShowDropdown(false);
                }}
              >
                <Avatar className="h-7 w-7">
                  {user.avatarUrl && <AvatarImage src={user.avatarUrl} />}
                  <AvatarFallback className="bg-blue-100 text-xs font-semibold text-blue-800">
                    {user.firstName.charAt(0)}{user.lastName.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-sm font-medium text-slate-700">
                    {user.firstName} {user.lastName}
                  </p>
                  <p className="text-xs text-slate-400">{user.category}</p>
                </div>
              </button>
            ))}

            {results.length === 0 && debouncedQuery.length >= 2 && (
              <p className="px-3 py-2 text-sm text-slate-400">Sin resultados</p>
            )}

            {/* Anonymous guest option */}
            <button
              type="button"
              className="flex w-full items-center gap-2 border-t border-slate-100 px-3 py-2 text-left hover:bg-slate-50"
              onClick={() => {
                onChange({ userId: null, name: query || `Jugador ${index + 2}` });
                setQuery('');
                setShowDropdown(false);
              }}
            >
              <div className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-200">
                <UserIcon className="h-4 w-4 text-slate-500" />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-600">Jugador sin cuenta</p>
                <p className="text-xs text-slate-400">Agregar como invitado</p>
              </div>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
