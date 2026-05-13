import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Search, Plus, Settings, FileText, Download, ChevronUp, ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Card, cn, SearchBar } from './Common';
import { useDebounce } from '../hooks/useDebounce';
import { exportGenericToCSV, exportGenericToPDF } from '../services/exportService';

interface Column {
  key: string;
  label: string;
  mono?: boolean;
  render?: (val: any, item: any) => React.ReactNode;
}

interface GenericListProps {
  title: string;
  hideTitle?: boolean;
  items: any[];
  columns: Column[];
  showAddButton?: boolean;
  showActions?: boolean;
  onAdd?: () => void;
  addButtonLabel?: string;
  onItemClick?: (item: any) => void;
}

export const GenericList = ({ 
  title, 
  hideTitle = false,
  items, 
  columns, 
  showAddButton = true, 
  addButtonLabel = "Novo",
  onAdd,
  onItemClick
}: GenericListProps) => {
  const [inputValue, setInputValue] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearchTerm = useDebounce(inputValue, 300);
  const [visibleColumns, setVisibleColumns] = useState<string[]>([]);
  const [isColumnSelectorOpen, setIsColumnSelectorOpen] = useState(false);
  const columnSelectorRef = useRef<HTMLDivElement>(null);
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' } | null>(null);

  useEffect(() => {
    setVisibleColumns(columns.map(c => c.key).filter(k => k.toLowerCase() !== 'id'));
  }, [columns]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (columnSelectorRef.current && !columnSelectorRef.current.contains(event.target as Node)) {
        setIsColumnSelectorOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    setSearchTerm(debouncedSearchTerm);
  }, [debouncedSearchTerm]);

  const requestSort = (key: string) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const getSortIcon = (key: string) => {
    if (!sortConfig || sortConfig.key !== key) return <ChevronDown size={12} className="opacity-0 group-hover/th:opacity-50" />;
    return sortConfig.direction === 'asc' ? <ChevronUp size={12} /> : <ChevronDown size={12} />;
  };

  const filteredItems = useMemo(() => {
    let result = items.filter(item => 
      columns.some(col => {
        const val = item[col.key];
        return val !== null && val !== undefined && val.toString().toLowerCase().includes(searchTerm.toLowerCase());
      })
    );

    if (sortConfig) {
      result.sort((a, b) => {
        let aValue = a[sortConfig.key];
        let bValue = b[sortConfig.key];

        if (aValue === null || aValue === undefined) return 1;
        if (bValue === null || bValue === undefined) return -1;

        if (typeof aValue === 'string') {
          const aStr = aValue.trim();
          const bStr = (typeof bValue === 'string' ? bValue.trim() : '');

          // Improved numeric detection for R$ 1.234,56 or pure formatted numbers like 1.234,56
          const isNumericFormat = (s: string) => /^-?R?\$?\s?[\d.]+(,[\d]{1,2})?$/.test(s) || /^-?[\d.]+(,[\d]{1,2})?$/.test(s);
          
          if (isNumericFormat(aStr) && (bStr === '' || isNumericFormat(bStr))) {
            const parseNum = (s: string) => {
              if (!s) return 0;
              const clean = s.replace(/R\$/g, '').replace(/\s/g, '').replace(/\./g, '').replace(',', '.');
              const n = parseFloat(clean);
              return isNaN(n) ? 0 : n;
            };
            aValue = parseNum(aStr);
            bValue = parseNum(bStr);
          } else {
            aValue = aStr.toLowerCase();
            bValue = bStr.toLowerCase();
          }
        }

        if (aValue < bValue) {
          return sortConfig.direction === 'asc' ? -1 : 1;
        }
        if (aValue > bValue) {
          return sortConfig.direction === 'asc' ? 1 : -1;
        }
        return 0;
      });
    }

    return result;
  }, [items, searchTerm, columns, sortConfig]);

  const activeColumns = columns.filter(col => visibleColumns.includes(col.key));

  return (
    <Card className="p-0 overflow-visible">
      <div className="px-6 py-4 border-b border-zinc-100 dark:border-zinc-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4 flex-1">
          {!hideTitle && title && <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 whitespace-nowrap uppercase">{title}</h3>}
          <SearchBar 
            value={inputValue}
            onChange={setInputValue}
          />
        </div>
        
        <div className="flex items-center gap-2 flex-wrap">
          <div className="relative" ref={columnSelectorRef}>
            <button 
              onClick={() => setIsColumnSelectorOpen(!isColumnSelectorOpen)}
              className="flex items-center gap-2 px-4 py-2 text-sm font-bold text-zinc-600 bg-zinc-100 rounded-xl hover:bg-zinc-200 transition-colors dark:text-zinc-300 dark:bg-zinc-800 dark:hover:bg-zinc-700 uppercase"
            >
              <Settings size={18} />
              Colunas
            </button>
            <AnimatePresence>
              {isColumnSelectorOpen && (
                <motion.div 
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                  className="absolute right-0 top-full mt-2 w-48 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-xl z-[160] overflow-hidden p-2"
                >
                  <div className="space-y-1">
                    {columns.map(col => (
                      <label key={col.key} className="flex items-center gap-3 px-3 py-2 hover:bg-zinc-50 dark:hover:bg-zinc-800 rounded-lg cursor-pointer transition-colors group">
                        <input 
                          type="checkbox"
                          checked={visibleColumns.includes(col.key)}
                          onChange={() => {
                            if (visibleColumns.includes(col.key)) {
                              if (visibleColumns.length > 1) {
                                setVisibleColumns(visibleColumns.filter(c => c !== col.key));
                              }
                            } else {
                              setVisibleColumns([...visibleColumns, col.key]);
                            }
                          }}
                          className="w-4 h-4 rounded border-zinc-300 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 focus:ring-zinc-900 dark:focus:ring-zinc-100"
                        />
                        <span className="text-xs text-zinc-600 dark:text-zinc-400 group-hover:text-zinc-900 dark:group-hover:text-zinc-100 transition-colors uppercase">{col.label}</span>
                      </label>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <button 
            onClick={() => exportGenericToPDF(filteredItems, activeColumns, title, title.toLowerCase().replace(/\s+/g, '_'))}
            className="flex items-center gap-2 px-4 py-2 text-sm font-bold text-zinc-600 bg-zinc-100 rounded-xl hover:bg-zinc-200 transition-colors dark:text-zinc-300 dark:bg-zinc-800 dark:hover:bg-zinc-700 uppercase"
          >
            <FileText size={18} />
            PDF
          </button>
          
          <button 
            onClick={() => exportGenericToCSV(filteredItems, activeColumns, title.toLowerCase().replace(/\s+/g, '_'))}
            className="flex items-center gap-2 px-4 py-2 text-sm font-bold text-zinc-600 bg-zinc-100 rounded-xl hover:bg-zinc-200 transition-colors dark:text-zinc-300 dark:bg-zinc-800 dark:hover:bg-zinc-700 uppercase"
          >
            <Download size={18} />
            CSV
          </button>

          {showAddButton && onAdd && (
            <button 
              onClick={onAdd}
              className="flex items-center gap-2 px-4 py-2 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 text-sm font-bold rounded-xl hover:bg-zinc-800 dark:hover:bg-zinc-200 transition-colors uppercase ml-2 shadow-lg shadow-zinc-900/10 dark:shadow-none"
            >
              <Plus size={18} />
              {addButtonLabel}
            </button>
          )}
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-zinc-50/50 dark:bg-zinc-800/50">
              {activeColumns.map(col => (
                <th 
                  key={col.key} 
                  onClick={() => requestSort(col.key)}
                  className="px-6 py-3 text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider cursor-pointer group/th"
                >
                  <div className="flex items-center gap-1">
                    {col.label}
                    {getSortIcon(col.key)}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
            {filteredItems.map((item, idx) => (
              <tr 
                key={idx} 
                onClick={() => onItemClick?.(item)}
                className={cn(
                  "transition-colors group",
                  onItemClick ? "cursor-pointer hover:bg-zinc-50/50 dark:hover:bg-zinc-800/50" : "hover:bg-zinc-50/50 dark:hover:bg-zinc-800/50"
                )}
              >
                {activeColumns.map(col => (
                  <td key={col.key} className={cn("px-6 py-4 text-sm", col.mono ? "font-mono text-zinc-500 dark:text-zinc-400" : "text-zinc-900 dark:text-zinc-100")}>
                    {col.render ? col.render(item[col.key], item) : item[col.key]}
                  </td>
                ))}
              </tr>
            ))}
            {filteredItems.length === 0 && (
              <tr>
                <td colSpan={activeColumns.length} className="px-6 py-8 text-center text-zinc-400 dark:text-zinc-500 text-sm italic uppercase">
                  NENHUM REGISTRO ENCONTRADO.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </Card>
  );
};
