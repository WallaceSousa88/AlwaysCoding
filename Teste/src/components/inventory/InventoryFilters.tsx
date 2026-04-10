import React, { useState, useEffect } from 'react';
import { Search, X } from 'lucide-react';
import { useDebounce } from '../../hooks/useDebounce';
import { cn, SearchBar } from '../Common';

interface InventoryFiltersProps {
  activeSubTab: 'products' | 'movements';
  searchTerm: string;
  setSearchTerm: (val: string) => void;
  movementTypeFilter: 'ALL' | 'IN' | 'OUT';
  setMovementTypeFilter: (val: 'ALL' | 'IN' | 'OUT') => void;
  movementLocationFilter: string;
  setMovementLocationFilter: (val: string) => void;
  locations: { id: string | number; name: string }[];
  startDate: string;
  setStartDate: (val: string) => void;
  endDate: string;
  setEndDate: (val: string) => void;
}

export const InventoryFilters = ({
  activeSubTab,
  searchTerm,
  setSearchTerm,
  movementTypeFilter,
  setMovementTypeFilter,
  movementLocationFilter,
  setMovementLocationFilter,
  locations,
  startDate,
  setStartDate,
  endDate,
  setEndDate
}: InventoryFiltersProps) => {
  const [localSearchTerm, setLocalSearchTerm] = useState(searchTerm);
  const debouncedSearchTerm = useDebounce(localSearchTerm, 300);

  useEffect(() => {
    setSearchTerm(debouncedSearchTerm);
  }, [debouncedSearchTerm, setSearchTerm]);

  // Sync local state if prop changes externally (e.g. clear filters)
  useEffect(() => {
    if (searchTerm !== localSearchTerm && searchTerm === '') {
      setLocalSearchTerm('');
    }
  }, [searchTerm]);

  return (
    <div className="flex items-center gap-4 flex-1">
      <SearchBar 
        value={localSearchTerm}
        onChange={setLocalSearchTerm}
      />
      {activeSubTab === 'movements' && (
        <div className="flex flex-wrap items-center gap-2">
          <select
            value={movementTypeFilter}
            onChange={(e) => setMovementTypeFilter(e.target.value as any)}
            className="px-3 py-2 bg-white border border-zinc-200 rounded-xl text-sm focus:ring-2 focus:ring-zinc-900 outline-none dark:bg-black dark:border-zinc-800 dark:text-zinc-100 dark:focus:ring-zinc-100 uppercase"
          >
            <option value="ALL">TODOS OS TIPOS</option>
            <option value="IN">ENTRADA</option>
            <option value="OUT">SAÍDA</option>
          </select>

          <select
            value={movementLocationFilter}
            onChange={(e) => setMovementLocationFilter(e.target.value)}
            className="px-3 py-2 bg-white border border-zinc-200 rounded-xl text-sm focus:ring-2 focus:ring-zinc-900 outline-none dark:bg-black dark:border-zinc-800 dark:text-zinc-100 dark:focus:ring-zinc-100 uppercase"
          >
            <option value="ALL">TODAS AS LOCALIZAÇÕES</option>
            {locations.map(loc => (
              <option key={loc.id} value={loc.name}>{loc.name.toUpperCase()}</option>
            ))}
          </select>

          <input 
            type="date" 
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="px-3 py-2 bg-white border border-zinc-200 rounded-xl text-sm focus:ring-2 focus:ring-zinc-900 outline-none dark:bg-black dark:border-zinc-800 dark:text-zinc-100 dark:focus:ring-zinc-100"
          />
          <span className="text-zinc-400 dark:text-zinc-500 text-xs font-bold uppercase">até</span>
          <input 
            type="date" 
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="px-3 py-2 bg-white border border-zinc-200 rounded-xl text-sm focus:ring-2 focus:ring-zinc-900 outline-none dark:bg-black dark:border-zinc-800 dark:text-zinc-100 dark:focus:ring-zinc-100"
          />
          {(startDate || endDate || movementTypeFilter !== 'ALL' || movementLocationFilter !== 'ALL') && (
            <button 
              onClick={() => { 
                setStartDate(''); 
                setEndDate(''); 
                setMovementTypeFilter('ALL');
                setMovementLocationFilter('ALL');
              }}
              className="p-2 text-zinc-400 hover:text-rose-600 dark:text-zinc-500 dark:hover:text-rose-400 transition-colors"
              title="Limpar filtros"
            >
              <X size={18} />
            </button>
          )}
        </div>
      )}
    </div>
  );
};
