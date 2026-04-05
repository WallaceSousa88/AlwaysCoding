import React from 'react';
import { FileText, Download, ArrowUpRight, ArrowDownLeft, Plus, Upload } from 'lucide-react';
import { Product, Movement } from '../../types';

interface ExportButtonsProps {
  activeSubTab: 'products' | 'movements';
  onPdfClick: () => void;
  onCsvClick: () => void;
  onImportCsvClick: () => void;
  onStockOutClick: () => void;
  onStockInClick: () => void;
  onNewProductClick: () => void;
  onExportMovementsPdf: () => void;
  onExportMovementsCsv: () => void;
}

export const ExportButtons = ({
  activeSubTab,
  onPdfClick,
  onCsvClick,
  onImportCsvClick,
  onStockOutClick,
  onStockInClick,
  onNewProductClick,
  onExportMovementsPdf,
  onExportMovementsCsv
}: ExportButtonsProps) => {
  if (activeSubTab === 'products') {
    return (
      <>
        <button 
          onClick={onImportCsvClick}
          className="flex-shrink-0 flex items-center gap-2 px-4 py-2 text-sm font-bold text-zinc-600 bg-zinc-100 rounded-xl hover:bg-zinc-200 transition-colors dark:text-zinc-300 dark:bg-zinc-800 dark:hover:bg-zinc-700"
          title="Importar Produtos via CSV"
        >
          <Upload size={18} />
          Importar
        </button>
        <button 
          onClick={onPdfClick}
          className="flex-shrink-0 flex items-center gap-2 px-4 py-2 text-sm font-bold text-zinc-600 bg-zinc-100 rounded-xl hover:bg-zinc-200 transition-colors dark:text-zinc-300 dark:bg-zinc-800 dark:hover:bg-zinc-700"
        >
          <FileText size={18} />
          PDF
        </button>
        <button 
          onClick={onCsvClick}
          className="flex-shrink-0 flex items-center gap-2 px-4 py-2 text-sm font-bold text-zinc-600 bg-zinc-100 rounded-xl hover:bg-zinc-200 transition-colors dark:text-zinc-300 dark:bg-zinc-800 dark:hover:bg-zinc-700"
        >
          <Download size={18} />
          CSV
        </button>
        <button 
          onClick={onStockOutClick}
          className="flex-shrink-0 flex items-center gap-2 px-4 py-2 text-sm font-bold text-rose-600 bg-rose-50 rounded-xl hover:bg-rose-100 transition-colors dark:bg-rose-500/10 dark:text-rose-400 dark:hover:bg-rose-500/20"
        >
          <ArrowUpRight size={18} />
          SAÍDA
        </button>
        <button 
          onClick={onStockInClick}
          className="flex-shrink-0 flex items-center gap-2 px-4 py-2 text-sm font-bold text-emerald-600 bg-emerald-50 rounded-xl hover:bg-emerald-100 transition-colors dark:bg-emerald-500/10 dark:text-emerald-400 dark:hover:bg-emerald-500/20"
        >
          <ArrowDownLeft size={18} />
          ENTRADA
        </button>
        <button 
          onClick={onNewProductClick}
          className="flex-shrink-0 flex items-center gap-2 px-4 py-2 text-sm font-bold text-white bg-zinc-900 rounded-xl hover:bg-zinc-800 transition-colors shadow-lg shadow-zinc-900/10 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200 dark:shadow-none"
        >
          <Plus size={18} />
          NOVO PRODUTO
        </button>
      </>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <button 
        onClick={onExportMovementsPdf}
        className="flex-shrink-0 flex items-center gap-2 px-4 py-2 text-sm font-bold text-zinc-600 bg-zinc-100 rounded-xl hover:bg-zinc-200 transition-colors dark:text-zinc-300 dark:bg-zinc-800 dark:hover:bg-zinc-700"
      >
        <FileText size={18} />
        PDF
      </button>
      <button 
        onClick={onExportMovementsCsv}
        className="flex-shrink-0 flex items-center gap-2 px-4 py-2 text-sm font-bold text-zinc-600 bg-zinc-100 rounded-xl hover:bg-zinc-200 transition-colors dark:text-zinc-300 dark:bg-zinc-800 dark:hover:bg-zinc-700"
      >
        <Download size={18} />
        CSV
      </button>
    </div>
  );
};
