import React from 'react';
import { Settings, ChevronUp, ChevronDown, Edit, Trash2, ArrowUpRight, ArrowDownLeft } from 'lucide-react';
import { Asset } from '../../types';
import { cn } from '../Common';

import { formatCurrency } from '../../lib/valueMask';
import { calculateDepreciation } from '../../lib/depreciation';

interface AssetTableProps {
  assets: Asset[];
  visibleColumns: string[];
  requestSort: (key: keyof Asset | 'status') => void;
  getSortIcon: (key: keyof Asset | 'status') => React.ReactNode;
  onAssetClick: (asset: Asset) => void;
  isAdmin?: boolean;
  canSeeValues?: boolean;
}

export const AssetTable = ({ 
  assets, 
  visibleColumns, 
  requestSort, 
  getSortIcon, 
  onAssetClick,
  isAdmin = false,
  canSeeValues = true
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
          {visibleColumns.includes('location_or_responsible') && (
            <th className="px-6 py-4 text-xs font-bold text-zinc-400 uppercase tracking-widest cursor-pointer group" onClick={() => requestSort('location_or_responsible')}>
              <div className="flex items-center gap-2">Responsável/Local {getSortIcon('location_or_responsible')}</div>
            </th>
          )}
          {visibleColumns.includes('category') && (
            <th className="px-6 py-4 text-xs font-bold text-zinc-400 uppercase tracking-widest cursor-pointer group" onClick={() => requestSort('category')}>
              <div className="flex items-center gap-2">Categoria {getSortIcon('category')}</div>
            </th>
          )}
          {visibleColumns.includes('purchase_date') && (
            <th className="px-6 py-4 text-xs font-bold text-zinc-400 uppercase tracking-widest cursor-pointer group" onClick={() => requestSort('purchase_date')}>
              <div className="flex items-center gap-2">Data Compra {getSortIcon('purchase_date')}</div>
            </th>
          )}
          {visibleColumns.includes('purchase_value') && (
            <th className="px-6 py-4 text-xs font-bold text-zinc-400 uppercase tracking-widest cursor-pointer group" onClick={() => requestSort('purchase_value')}>
              <div className="flex items-center gap-2">V. Compra {getSortIcon('purchase_value')}</div>
            </th>
          )}
          {visibleColumns.includes('depreciation_type') && (
            <th className="px-6 py-4 text-xs font-bold text-zinc-400 uppercase tracking-widest cursor-pointer group" onClick={() => requestSort('depreciation_type')}>
              <div className="flex items-center gap-2">Tipo Deprec. {getSortIcon('depreciation_type')}</div>
            </th>
          )}
          {visibleColumns.includes('depreciation_percentage') && (
            <th className="px-6 py-4 text-xs font-bold text-zinc-400 uppercase tracking-widest cursor-pointer group" onClick={() => requestSort('depreciation_percentage')}>
              <div className="flex items-center gap-2">% Deprec. {getSortIcon('depreciation_percentage')}</div>
            </th>
          )}
          {visibleColumns.includes('status') && (
            <th className="px-6 py-4 text-xs font-bold text-zinc-400 uppercase tracking-widest cursor-pointer group" onClick={() => requestSort('status')}>
              <div className="flex items-center gap-2">Status {getSortIcon('status')}</div>
            </th>
          )}
          {visibleColumns.includes('disposal_type') && (
            <th className="px-6 py-4 text-xs font-bold text-zinc-400 uppercase tracking-widest cursor-pointer group" onClick={() => requestSort('disposal_type')}>
              <div className="flex items-center gap-2">Tipo Baixa {getSortIcon('disposal_type')}</div>
            </th>
          )}
          {visibleColumns.includes('disposal_date') && (
            <th className="px-6 py-4 text-xs font-bold text-zinc-400 uppercase tracking-widest cursor-pointer group" onClick={() => requestSort('disposal_date')}>
              <div className="flex items-center gap-2">Data Baixa {getSortIcon('disposal_date')}</div>
            </th>
          )}
          {visibleColumns.includes('disposal_value') && (
            <th className="px-6 py-4 text-xs font-bold text-zinc-400 uppercase tracking-widest cursor-pointer group" onClick={() => requestSort('disposal_value')}>
              <div className="flex items-center gap-2">Valor Baixa {getSortIcon('disposal_value')}</div>
            </th>
          )}
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
            {visibleColumns.includes('location_or_responsible') && (
              <td className="px-6 py-4 text-sm text-zinc-600 dark:text-zinc-400">{asset.location_or_responsible || '-'}</td>
            )}
            {visibleColumns.includes('category') && (
              <td className="px-6 py-4">
                <span className="px-2 py-1 text-[10px] font-bold bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 rounded-md uppercase tracking-wider">
                  {asset.category}
                </span>
              </td>
            )}
            {visibleColumns.includes('purchase_date') && (
              <td className="px-6 py-4 text-sm text-zinc-600 dark:text-zinc-400">
                {new Date(asset.purchase_date).toLocaleDateString('pt-BR')}
              </td>
            )}
            {visibleColumns.includes('purchase_value') && (
              <td className="px-6 py-4 text-sm font-bold text-zinc-900 dark:text-zinc-100">
                {formatCurrency(asset.purchase_value, canSeeValues)}
              </td>
            )}
            {visibleColumns.includes('depreciation_type') && (
              <td className="px-6 py-4 text-sm text-zinc-600 dark:text-zinc-400 uppercase">
                {asset.depreciation_type}
              </td>
            )}
            {visibleColumns.includes('depreciation_percentage') && (
              <td className="px-6 py-4 text-sm text-zinc-600 dark:text-zinc-400">
                {asset.depreciation_percentage}%
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
            {visibleColumns.includes('disposal_type') && (
              <td className="px-6 py-4 text-sm text-zinc-600 dark:text-zinc-400 uppercase">
                {asset.disposal_type || '-'}
              </td>
            )}
            {visibleColumns.includes('disposal_date') && (
              <td className="px-6 py-4 text-sm text-zinc-600 dark:text-zinc-400">
                {asset.disposal_date ? new Date(asset.disposal_date).toLocaleDateString('pt-BR') : '-'}
              </td>
            )}
            {visibleColumns.includes('disposal_value') && (
              <td className="px-6 py-4 text-sm font-bold text-zinc-900 dark:text-zinc-100">
                {(() => {
                  if (asset.status === 'BAIXADO') {
                    // Use saved value if it exists, otherwise (fallback) calculate it for disposal date
                    const value = asset.disposal_value ?? (asset.disposal_date ? calculateDepreciation(
                      asset.purchase_value,
                      asset.purchase_date,
                      asset.disposal_date,
                      asset.depreciation_type,
                      asset.depreciation_percentage
                    ) : 0);
                    return formatCurrency(value, canSeeValues);
                  }
                  // For ATIVO assets, calculate current value (estimated)
                  const currentValue = calculateDepreciation(
                    asset.purchase_value,
                    asset.purchase_date,
                    new Date().toISOString().split('T')[0],
                    asset.depreciation_type,
                    asset.depreciation_percentage
                  );
                  return (
                    <span className="text-zinc-400 dark:text-zinc-500 italic font-medium">
                      {formatCurrency(currentValue, canSeeValues)}
                    </span>
                  );
                })()}
              </td>
            )}
          </tr>
        ))}
      </tbody>
    </table>
  );
};
