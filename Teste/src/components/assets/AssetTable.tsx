import React from 'react';
import { Settings, ChevronUp, ChevronDown, Edit, Trash2, ArrowUpRight, ArrowDownLeft } from 'lucide-react';
import { Asset } from '../../types';
import { cn } from '../Common';

interface AssetTableProps {
  assets: Asset[];
  visibleColumns: string[];
  requestSort: (key: keyof Asset | 'status') => void;
  getSortIcon: (key: keyof Asset | 'status') => React.ReactNode;
  onAssetClick: (asset: Asset) => void;
  onEdit: (asset: Asset) => void;
  onDelete: (id: string | number) => void;
  isAdmin?: boolean;
}

export const AssetTable = ({ 
  assets, 
  visibleColumns, 
  requestSort, 
  getSortIcon, 
  onAssetClick,
  onEdit,
  onDelete,
  isAdmin = false
}: AssetTableProps) => {
  return (
    <table className="w-full text-left border-collapse">
      <thead>
        <tr className="border-b border-zinc-100 dark:border-zinc-800">
          {visibleColumns.includes('id') && (
            <th className="px-6 py-4 text-xs font-bold text-zinc-400 uppercase tracking-widest cursor-pointer group" onClick={() => requestSort('id')}>
              <div className="flex items-center gap-2">ID {getSortIcon('id')}</div>
            </th>
          )}
          {visibleColumns.includes('description') && (
            <th className="px-6 py-4 text-xs font-bold text-zinc-400 uppercase tracking-widest cursor-pointer group" onClick={() => requestSort('description')}>
              <div className="flex items-center gap-2">Descrição {getSortIcon('description')}</div>
            </th>
          )}
          {visibleColumns.includes('asset_number') && (
            <th className="px-6 py-4 text-xs font-bold text-zinc-400 uppercase tracking-widest cursor-pointer group" onClick={() => requestSort('asset_number')}>
              <div className="flex items-center gap-2">Nº Patrimônio {getSortIcon('asset_number')}</div>
            </th>
          )}
          {visibleColumns.includes('category') && (
            <th className="px-6 py-4 text-xs font-bold text-zinc-400 uppercase tracking-widest cursor-pointer group" onClick={() => requestSort('category')}>
              <div className="flex items-center gap-2">Categoria {getSortIcon('category')}</div>
            </th>
          )}
          {visibleColumns.includes('purchase_value') && (
            <th className="px-6 py-4 text-xs font-bold text-zinc-400 uppercase tracking-widest cursor-pointer group" onClick={() => requestSort('purchase_value')}>
              <div className="flex items-center gap-2">V. Compra {getSortIcon('purchase_value')}</div>
            </th>
          )}
          {visibleColumns.includes('status') && (
            <th className="px-6 py-4 text-xs font-bold text-zinc-400 uppercase tracking-widest cursor-pointer group" onClick={() => requestSort('status')}>
              <div className="flex items-center gap-2">Status {getSortIcon('status')}</div>
            </th>
          )}
          {isAdmin && <th className="px-6 py-4 text-xs font-bold text-zinc-400 uppercase tracking-widest text-right">Ações</th>}
        </tr>
      </thead>
      <tbody>
        {assets.map((asset) => (
          <tr 
            key={asset.id} 
            className="border-b border-zinc-50 dark:border-zinc-800/50 hover:bg-zinc-50/50 dark:hover:bg-zinc-800/30 transition-colors cursor-pointer group"
            onClick={() => onAssetClick(asset)}
          >
            {visibleColumns.includes('id') && (
              <td className="px-6 py-4 text-sm font-mono text-zinc-400">#{asset.id}</td>
            )}
            {visibleColumns.includes('description') && (
              <td className="px-6 py-4">
                <div className="flex items-center gap-3">
                  {asset.photo ? (
                    <img src={asset.photo} alt={asset.description} className="w-8 h-8 rounded-lg object-cover border border-zinc-100 dark:border-zinc-800" referrerPolicy="no-referrer" />
                  ) : (
                    <div className="w-8 h-8 rounded-lg bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-400">
                      <Settings size={14} />
                    </div>
                  )}
                  <span className="text-sm font-bold text-zinc-900 dark:text-zinc-100">{asset.description}</span>
                </div>
              </td>
            )}
            {visibleColumns.includes('asset_number') && (
              <td className="px-6 py-4 text-sm text-zinc-600 dark:text-zinc-400">{asset.asset_number || '-'}</td>
            )}
            {visibleColumns.includes('category') && (
              <td className="px-6 py-4">
                <span className="px-2 py-1 text-[10px] font-bold bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 rounded-md uppercase tracking-wider">
                  {asset.category}
                </span>
              </td>
            )}
            {visibleColumns.includes('purchase_value') && (
              <td className="px-6 py-4 text-sm font-bold text-zinc-900 dark:text-zinc-100">
                R$ {asset.purchase_value.toFixed(2)}
              </td>
            )}
            {visibleColumns.includes('status') && (
              <td className="px-6 py-4">
                <span className={cn(
                  "px-2 py-1 text-[10px] font-bold rounded-md uppercase tracking-wider",
                  asset.status === 'ATIVO' 
                    ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400" 
                    : "bg-rose-50 text-rose-600 dark:bg-rose-500/10 dark:text-rose-400"
                )}>
                  {asset.status}
                </span>
              </td>
            )}
            {isAdmin && (
              <td className="px-6 py-4 text-right" onClick={e => e.stopPropagation()}>
                <div className="flex items-center justify-end gap-2">
                  <button 
                    onClick={() => onEdit(asset)}
                    className="p-2 text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-all"
                    title="Editar"
                  >
                    <Edit size={16} />
                  </button>
                  <button 
                    onClick={() => onDelete(asset.id)}
                    className="p-2 text-zinc-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-lg transition-all"
                    title="Excluir"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </td>
            )}
          </tr>
        ))}
      </tbody>
    </table>
  );
};
