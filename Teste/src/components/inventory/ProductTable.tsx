import React from 'react';
import { Package, AlertTriangle, ChevronUp, ChevronDown, MoreVertical } from 'lucide-react';
import { Product } from '../../types';
import { cn } from '../Common';

interface ProductTableProps {
  products: Product[];
  visibleColumns: string[];
  requestSort: (key: keyof Product | 'status') => void;
  getSortIcon: (key: keyof Product | 'status') => React.ReactNode;
  onProductClick: (p: Product) => void;
}

export const ProductTable = ({
  products,
  visibleColumns,
  requestSort,
  getSortIcon,
  onProductClick
}: ProductTableProps) => {
  return (
    <table className="w-full text-left border-collapse">
      <thead>
        <tr className="bg-zinc-50/50 dark:bg-zinc-800/50">
          {visibleColumns.includes('id') && (
            <th 
              onClick={() => requestSort('id')}
              className="px-6 py-3 text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider cursor-pointer group"
            >
              <div className="flex items-center gap-1">
                ID
                {getSortIcon('id')}
              </div>
            </th>
          )}
          {visibleColumns.includes('name') && (
            <th 
              onClick={() => requestSort('name')}
              className="px-6 py-3 text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider cursor-pointer group"
            >
              <div className="flex items-center gap-1">
                Produto
                {getSortIcon('name')}
              </div>
            </th>
          )}
          {visibleColumns.includes('category') && (
            <th 
              onClick={() => requestSort('category')}
              className="px-6 py-3 text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider cursor-pointer group"
            >
              <div className="flex items-center gap-1">
                Categoria
                {getSortIcon('category')}
              </div>
            </th>
          )}
          {visibleColumns.includes('quantity') && (
            <th 
              onClick={() => requestSort('quantity')}
              className="px-6 py-3 text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider cursor-pointer group"
            >
              <div className="flex items-center gap-1">
                Estoque
                {getSortIcon('quantity')}
              </div>
            </th>
          )}
          {visibleColumns.includes('total_value') && (
            <th className="px-6 py-3 text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
              Valor Total
            </th>
          )}
          {visibleColumns.includes('min_quantity') && (
            <th 
              onClick={() => requestSort('min_quantity')}
              className="px-6 py-3 text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider cursor-pointer group"
            >
              <div className="flex items-center gap-1">
                Mínimo
                {getSortIcon('min_quantity')}
              </div>
            </th>
          )}
          {visibleColumns.includes('status') && (
            <th 
              onClick={() => requestSort('status')}
              className="px-6 py-3 text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider cursor-pointer group"
            >
              <div className="flex items-center gap-1">
                Status
                {getSortIcon('status')}
              </div>
            </th>
          )}
        </tr>
      </thead>
      <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
        {products.map((p) => {
          const isLowStock = p.min_quantity !== null && p.quantity <= p.min_quantity;
          return (
            <tr 
              key={p.id} 
              onClick={() => onProductClick(p)}
              className={cn(
                "transition-colors cursor-pointer",
                isLowStock 
                  ? "bg-amber-50/50 hover:bg-amber-100/50 dark:bg-amber-500/5 dark:hover:bg-amber-500/10" 
                  : "hover:bg-zinc-50/50 dark:hover:bg-zinc-800/50"
              )}
            >
              {visibleColumns.includes('id') && (
                <td className="px-6 py-4 text-sm text-zinc-500 dark:text-zinc-400 font-mono">#{p.id}</td>
              )}
              {visibleColumns.includes('name') && (
                <td className="px-6 py-4 text-sm font-medium text-zinc-900 dark:text-zinc-100">
                  <div className="flex items-center gap-3">
                    {p.photo ? (
                      <img src={p.photo} alt={p.name} className="w-8 h-8 rounded object-cover border border-zinc-100 dark:border-zinc-800" referrerPolicy="no-referrer" />
                    ) : (
                      <div className="w-8 h-8 rounded bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-400 dark:text-zinc-500">
                        <Package size={14} />
                      </div>
                    )}
                    {p.name}
                  </div>
                </td>
              )}
              {visibleColumns.includes('category') && (
                <td className="px-6 py-4 text-sm text-zinc-500 dark:text-zinc-400">{p.category}</td>
              )}
              {visibleColumns.includes('quantity') && (
                <td className={cn(
                  "px-6 py-4 text-sm font-medium",
                  isLowStock ? "text-amber-600 dark:text-amber-400 flex items-center gap-2" : "text-zinc-900 dark:text-zinc-100"
                )}>
                  {isLowStock && <AlertTriangle size={14} />}
                  {p.quantity} {p.unit}
                </td>
              )}
              {visibleColumns.includes('total_value') && (
                <td className="px-6 py-4 text-sm font-bold text-zinc-900 dark:text-zinc-100">
                  R$ {(p.quantity * p.cost_price).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </td>
              )}
              {visibleColumns.includes('min_quantity') && (
                <td className="px-6 py-4 text-sm text-zinc-500 dark:text-zinc-400">
                  {p.min_quantity ?? '-'} {p.min_quantity !== null ? p.unit : ''}
                </td>
              )}
              {visibleColumns.includes('status') && (
                <td className="px-6 py-4 text-sm">
                  <span className={cn(
                    "px-2 py-1 rounded-full text-[10px] font-bold uppercase",
                    isLowStock 
                      ? "bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400" 
                      : "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400"
                  )}>
                    {isLowStock ? 'Estoque Baixo' : 'Normal'}
                  </span>
                </td>
              )}
            </tr>
          );
        })}
      </tbody>
    </table>
  );
};
