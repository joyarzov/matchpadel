import { cn } from '@/lib/utils';
import type { PlayerCategory } from '@/types/auth.types';

interface CategoryFilterProps {
  selected: PlayerCategory | 'ALL';
  onChange: (category: PlayerCategory | 'ALL') => void;
}

const categories: { value: PlayerCategory | 'ALL'; label: string }[] = [
  { value: 'ALL', label: 'Todas' },
  { value: 'SEXTA', label: 'Sexta' },
  { value: 'QUINTA', label: 'Quinta' },
  { value: 'CUARTA', label: 'Cuarta' },
  { value: 'TERCERA', label: 'Tercera' },
  { value: 'SEGUNDA', label: 'Segunda' },
  { value: 'PRIMERA', label: 'Primera' },
];

export function CategoryFilter({ selected, onChange }: CategoryFilterProps) {
  return (
    <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none">
      {categories.map((cat) => (
        <button
          key={cat.value}
          onClick={() => onChange(cat.value)}
          className={cn(
            'shrink-0 rounded-full border-2 px-4 py-1.5 text-sm font-medium transition-colors',
            selected === cat.value
              ? 'border-blue-800 bg-blue-800 text-white'
              : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300',
          )}
        >
          {cat.label}
        </button>
      ))}
    </div>
  );
}
