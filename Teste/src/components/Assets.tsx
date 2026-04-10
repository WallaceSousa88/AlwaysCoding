import React, { useState, useMemo, useEffect, useRef } from 'react';
import { 
  Settings, 
  ChevronUp, 
  ChevronDown, 
  Edit, 
  Trash2, 
  ArrowUpRight, 
  ArrowDownLeft, 
  X,
  Plus,
  FileText,
  Download
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Asset } from '../types';
import { apiService } from '../services/apiService';
import { Card, cn, Button, SearchBar } from './Common';
import { AssetTable } from './assets/AssetTable';
import { AssetModal, AssetDisposalModal } from './assets/AssetModals';
import { PdfOptionsModal } from './inventory/InventoryModals';
import { exportGenericToCSV, exportGenericToPDF } from '../services/exportService';

interface AssetsProps {
  assets: Asset[];
  categories: {id: string | number, name: string}[];
  hideTitle?: boolean;
  isAdmin?: boolean;
  onAddAsset: (formData: FormData) => Promise<void>;
  onUpdateAsset: (id: string | number, formData: FormData) => Promise<void>;
  onDeleteAsset: (id: string | number) => Promise<void>;
  onDisposalAsset: (id: string | number, data: any) => Promise<void>;
}

export const Assets = ({ 
  assets, 
  categories,
  hideTitle = false,
  isAdmin = false,
  onAddAsset, 
  onUpdateAsset,
  onDeleteAsset,
  onDisposalAsset
}: AssetsProps) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDisposalModalOpen, setIsDisposalModalOpen] = useState(false);
  const [assetFieldErrors, setAssetFieldErrors] = useState<Record<string, string>>({});
  const [disposalFieldErrors, setDisposalFieldErrors] = useState<Record<string, string>>({});
  const [isPdfOptionsModalOpen, setIsPdfOptionsModalOpen] = useState(false);
  const [selectedPdfFields, setSelectedPdfFields] = useState<string[]>([]);
  const [editingAsset, setEditingAsset] = useState<Asset | null>(null);
  const [selectedAssetForDisposal, setSelectedAssetForDisposal] = useState<Asset | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState<{ key: keyof Asset | 'status'; direction: 'asc' | 'desc' } | null>(null);
  const [visibleColumns, setVisibleColumns] = useState<string[]>(['description', 'asset_number', 'category', 'purchase_value', 'status']);
  const [isColumnSelectorOpen, setIsColumnSelectorOpen] = useState(false);
  const columnSelectorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (columnSelectorRef.current && !columnSelectorRef.current.contains(event.target as Node)) {
        setIsColumnSelectorOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const ALL_COLUMNS = [
    { id: 'id', label: 'ID' },
    { id: 'description', label: 'Descrição' },
    { id: 'asset_number', label: 'Nº Patrimônio' },
    { id: 'category', label: 'Categoria' },
    { id: 'purchase_date', label: 'Data Compra' },
    { id: 'purchase_value', label: 'Valor Compra' },
    { id: 'depreciation_type', label: 'Tipo Deprec.' },
    { id: 'depreciation_percentage', label: '% Deprec.' },
    { id: 'status', label: 'Status' },
    { id: 'disposal_type', label: 'Tipo Baixa' },
    { id: 'disposal_date', label: 'Data Baixa' },
    { id: 'disposal_value', label: 'Valor Baixa' }
  ];

  const filteredAssets = useMemo(() => {
    let result = assets.filter(a => 
      Object.values(a).some(val => 
        val !== null && val !== undefined && val.toString().toLowerCase().includes(searchTerm.toLowerCase())
      )
    );

    if (sortConfig) {
      result.sort((a, b) => {
        const aValue = a[sortConfig.key] ?? '';
        const bValue = b[sortConfig.key] ?? '';

        if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
        if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }

    return result;
  }, [assets, searchTerm, sortConfig]);

  const requestSort = (key: keyof Asset | 'status') => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const getSortIcon = (key: keyof Asset | 'status') => {
    if (!sortConfig || sortConfig.key !== key) return <ChevronDown size={12} className="opacity-0 group-hover:opacity-50" />;
    return sortConfig.direction === 'asc' ? <ChevronUp size={12} /> : <ChevronDown size={12} />;
  };

  const handleExportPdf = () => {
    const columns = selectedPdfFields.map(field => {
      const labels: Record<string, string> = {
        id: 'ID',
        description: 'Descrição',
        asset_number: 'Nº Patrimônio',
        category: 'Categoria',
        purchase_date: 'Data Compra',
        purchase_value: 'Valor Compra',
        status: 'Status'
      };
      return { key: field, label: labels[field] || field };
    });
    exportGenericToPDF(filteredAssets, columns, 'Relatório de Patrimônio', 'patrimonio');
    setIsPdfOptionsModalOpen(false);
  };

  const handleExportCsv = () => {
    const columns = [
      { key: 'id', label: 'ID' },
      { key: 'description', label: 'Descrição' },
      { key: 'asset_number', label: 'Nº Patrimônio' },
      { key: 'category', label: 'Categoria' },
      { key: 'purchase_date', label: 'Data Compra' },
      { key: 'purchase_value', label: 'Valor Compra' },
      { key: 'status', label: 'Status' }
    ];
    exportGenericToCSV(filteredAssets, columns, 'patrimonio');
  };

  return (
    <>
      <Card className="p-0 overflow-visible">
        <div className="px-6 py-4 border-b border-zinc-100 dark:border-zinc-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4 flex-1">
            {!hideTitle && <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 whitespace-nowrap uppercase">Gestão de Patrimônio</h3>}
            <SearchBar 
              value={searchTerm}
              onChange={setSearchTerm}
            />
          </div>

          <div className="flex items-center gap-3 flex-wrap">
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
                      {ALL_COLUMNS.map(col => (
                        <label key={col.id} className="flex items-center gap-3 px-3 py-2 hover:bg-zinc-50 dark:hover:bg-zinc-800 rounded-lg cursor-pointer transition-colors group">
                          <input 
                            type="checkbox"
                            checked={visibleColumns.includes(col.id)}
                            onChange={() => {
                              if (visibleColumns.includes(col.id)) {
                                if (visibleColumns.length > 1) {
                                  setVisibleColumns(visibleColumns.filter(c => c !== col.id));
                                }
                              } else {
                                setVisibleColumns([...visibleColumns, col.id]);
                              }
                            }}
                            className="w-4 h-4 rounded border-zinc-300 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 focus:ring-zinc-900 dark:focus:ring-zinc-100"
                          />
                          <span className="text-sm text-zinc-600 dark:text-zinc-400 group-hover:text-zinc-900 dark:group-hover:text-zinc-100 transition-colors">{col.label}</span>
                        </label>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <button 
              onClick={() => { setSelectedPdfFields([]); setIsPdfOptionsModalOpen(true); }}
              className="flex items-center gap-2 px-4 py-2 text-sm font-bold text-zinc-600 bg-zinc-100 rounded-xl hover:bg-zinc-200 transition-colors dark:text-zinc-300 dark:bg-zinc-800 dark:hover:bg-zinc-700 uppercase"
            >
              <FileText size={18} />
              PDF
            </button>

            <button 
              onClick={handleExportCsv}
              className="flex items-center gap-2 px-4 py-2 text-sm font-bold text-zinc-600 bg-zinc-100 rounded-xl hover:bg-zinc-200 transition-colors dark:text-zinc-300 dark:bg-zinc-800 dark:hover:bg-zinc-700 uppercase"
            >
              <Download size={18} />
              CSV
            </button>

            <button 
              onClick={() => { setSelectedAssetForDisposal(null); setIsDisposalModalOpen(true); }}
              className="flex items-center gap-2 px-4 py-2 text-sm font-bold text-rose-600 bg-rose-50 rounded-xl hover:bg-rose-100 transition-colors dark:text-rose-400 dark:bg-rose-500/10 dark:hover:bg-rose-500/20 uppercase"
            >
              <ArrowUpRight size={18} />
              SAÍDA
            </button>

            <button 
              onClick={() => { setEditingAsset(null); setIsModalOpen(true); }}
              className="flex items-center gap-2 px-4 py-2 text-sm font-bold text-emerald-600 bg-emerald-50 rounded-xl hover:bg-emerald-100 transition-colors dark:text-emerald-400 dark:bg-emerald-500/10 dark:hover:bg-emerald-500/20 uppercase"
            >
              <ArrowDownLeft size={18} />
              ENTRADA
            </button>

            <button 
              onClick={() => { setEditingAsset(null); setIsModalOpen(true); }}
              className="flex items-center gap-2 px-4 py-2 text-sm font-bold text-white bg-zinc-900 rounded-xl hover:bg-zinc-800 transition-colors dark:bg-zinc-100 dark:text-zinc-900 uppercase"
            >
              <Plus size={18} />
              NOVO PATRIMÔNIO
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <AssetTable 
            assets={filteredAssets}
            visibleColumns={visibleColumns}
            requestSort={requestSort}
            getSortIcon={getSortIcon}
            onAssetClick={(asset) => { 
              if (isAdmin) {
                setEditingAsset(asset); 
                setIsModalOpen(true); 
              }
            }}
            onEdit={(asset) => { setEditingAsset(asset); setIsModalOpen(true); }}
            onDelete={onDeleteAsset}
            isAdmin={isAdmin}
          />
        </div>
      </Card>

      <AssetModal 
        isOpen={isModalOpen}
        onClose={() => { 
          setIsModalOpen(false); 
          setEditingAsset(null);
          setAssetFieldErrors({});
        }}
        onSave={async (formData) => {
          const errors: Record<string, string> = {};
          const description = formData.get('description') as string;
          const assetNumber = formData.get('asset_number') as string;

          if (!description) {
            errors.description = 'DESCRIÇÃO É OBRIGATÓRIA';
          } else {
            const isDuplicate = assets.some(a => 
              a.id !== editingAsset?.id && 
              a.description.toUpperCase() === description.toUpperCase()
            );
            if (isDuplicate) errors.description = 'PATRIMÔNIO JÁ CADASTRADO COM ESTA DESCRIÇÃO';
          }

          if (!assetNumber) {
            errors.asset_number = 'Nº PATRIMÔNIO É OBRIGATÓRIO';
          } else {
            const isDuplicate = assets.some(a => 
              a.id !== editingAsset?.id && 
              a.asset_number?.toUpperCase() === assetNumber.toUpperCase()
            );
            if (isDuplicate) errors.asset_number = 'Nº PATRIMÔNIO JÁ CADASTRADO';
          }

          if (!formData.get('purchase_value')) errors.purchase_value = 'VALOR DE COMPRA É OBRIGATÓRIO';
          if (!formData.get('depreciation_percentage')) errors.depreciation_percentage = 'PERCENTUAL É OBRIGATÓRIO';

          if (Object.keys(errors).length > 0) {
            setAssetFieldErrors(errors);
            return;
          }

          try {
            if (editingAsset) {
              await onUpdateAsset(editingAsset.id, formData);
            } else {
              await onAddAsset(formData);
            }
            setIsModalOpen(false);
            setEditingAsset(null);
            setAssetFieldErrors({});
          } catch (err: any) {
            // Error handled by parent or global handler
          }
        }}
        asset={editingAsset}
        categories={categories}
        fieldErrors={assetFieldErrors}
      />

      <AssetDisposalModal 
        isOpen={isDisposalModalOpen}
        onClose={() => { 
          setIsDisposalModalOpen(false); 
          setSelectedAssetForDisposal(null);
          setDisposalFieldErrors({});
        }}
        onConfirm={async (data) => {
          const errors: Record<string, string> = {};
          if (!data.asset_id) errors.asset_id = 'PATRIMÔNIO É OBRIGATÓRIO';
          if (!data.disposal_date) errors.disposal_date = 'DATA É OBRIGATÓRIA';

          if (Object.keys(errors).length > 0) {
            setDisposalFieldErrors(errors);
            return;
          }

          try {
            const id = data.asset_id || selectedAssetForDisposal?.id;
            if (id) {
              await onDisposalAsset(id, data);
            }
            setIsDisposalModalOpen(false);
            setSelectedAssetForDisposal(null);
            setDisposalFieldErrors({});
          } catch (err: any) {
            // Error handled by parent or global handler
          }
        }}
        asset={selectedAssetForDisposal}
        assets={assets}
        fieldErrors={disposalFieldErrors}
      />

      <PdfOptionsModal 
        isOpen={isPdfOptionsModalOpen}
        onClose={() => setIsPdfOptionsModalOpen(false)}
        selectedPdfFields={selectedPdfFields}
        setSelectedPdfFields={setSelectedPdfFields}
        onExport={handleExportPdf}
        ALL_COLUMNS={ALL_COLUMNS}
        onClear={() => setSelectedPdfFields([])}
      />
    </>
  );
};
