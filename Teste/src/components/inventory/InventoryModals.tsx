import React, { useState, useRef, useEffect } from 'react';
import { X, Camera, Package, AlertTriangle, Plus, Edit, Trash2, ArrowDownLeft, ArrowUpRight, Search, ChevronDown, Barcode, FileText, Tag, Hash, MapPin, User } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Html5Qrcode } from 'html5-qrcode';
import { Product, Supplier, Order, Movement } from '../../types';
import { Card, cn, Input, Select, Button, Modal, ConfirmModal, ErrorAlert } from '../Common';
import { useDebounce } from '../../hooks/useDebounce';

interface ProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  editingProduct: Product | null;
  formData: any;
  setFormData: any;
  onSubmit: (e: React.FormEvent) => void;
  categories: any[];
  units: any[];
  isAddingCategory: boolean;
  setIsAddingCategory: (val: boolean) => void;
  newCategoryName: string;
  setNewCategoryName: (val: string) => void;
  onAddCategory: () => void;
  isAddingUnit: boolean;
  setIsAddingUnit: (val: boolean) => void;
  newUnitName: string;
  setNewUnitName: (val: string) => void;
  onAddUnit: () => void;
  productError: string | null;
  fieldErrors: { [key: string]: string };
  fileInputRef: React.RefObject<HTMLInputElement>;
  handleFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onClear: () => void;
}

export const ProductModal = ({ 
  isOpen, 
  onClose, 
  editingProduct, 
  formData, 
  setFormData, 
  onSubmit, 
  categories, 
  units,
  isAddingCategory, 
  setIsAddingCategory, 
  newCategoryName, 
  setNewCategoryName, 
  onAddCategory,
  isAddingUnit,
  setIsAddingUnit,
  newUnitName,
  setNewUnitName,
  onAddUnit,
  productError,
  fieldErrors,
  fileInputRef,
  handleFileChange,
  onClear
}: ProductModalProps) => (
  <Modal isOpen={isOpen} onClose={onClose} title={editingProduct ? 'EDITAR PRODUTO' : 'NOVO PRODUTO'} noPadding>
    <form onSubmit={onSubmit} noValidate className="p-6 space-y-6 overflow-y-auto flex-1">
      {productError && <ErrorAlert>{productError}</ErrorAlert>}
      <div className="flex flex-col items-center gap-4">
        <div className="relative group">
          <div className="w-24 h-24 rounded-2xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center overflow-hidden border-2 border-dashed border-zinc-200 dark:border-zinc-700 group-hover:border-zinc-400 transition-colors">
            {formData.photo ? (
              <img src={formData.photo} alt="Preview" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
            ) : (
              <Camera className="text-zinc-400" size={32} />
            )}
          </div>
          <button 
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="absolute -bottom-2 -right-2 p-2 bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 rounded-xl shadow-lg hover:scale-110 transition-transform"
          >
            <Plus size={16} />
          </button>
          <input 
            type="file" 
            ref={fileInputRef}
            onChange={handleFileChange}
            accept="image/*"
            className="hidden"
          />
        </div>
        <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Foto do Produto</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="md:col-span-2">
          <Input 
            label="Nome do Produto" 
            icon={<Package size={18} />}
            value={formData.name}
            onChange={(e: any) => setFormData({ ...formData, name: e.target.value.toUpperCase() })}
            required
            error={fieldErrors.name}
          />
        </div>
        <div className="flex gap-2 items-end">
          <div className="flex-1">
            <Select 
              label="Categoria" 
              icon={<Tag size={18} />}
              value={formData.category}
              onChange={(e: any) => setFormData({ ...formData, category: e.target.value })}
              options={[
                { value: '', label: 'SELECIONE' },
                ...categories.map((c: any) => ({ value: c.name, label: c.name.toUpperCase() }))
              ]}
              required
              error={fieldErrors.category}
            />
          </div>
          <button 
            type="button"
            onClick={() => setIsAddingCategory(true)}
            className="p-2.5 bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 rounded-xl hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors mb-[1px]"
          >
            <Plus size={20} />
          </button>
        </div>
        <div className="flex gap-2 items-end">
          <div className="flex-1">
            <Select 
              label="Unidade" 
              icon={<FileText size={18} />}
              value={formData.unit}
              onChange={(e: any) => setFormData({ ...formData, unit: e.target.value })}
              options={[
                { value: '', label: 'SELECIONE...' },
                ...(units || []).map((u: any) => ({ value: u.name, label: u.name }))
              ]}
              required
              error={fieldErrors.unit}
            />
          </div>
          <button 
            type="button"
            onClick={() => setIsAddingUnit(true)}
            className="p-2.5 bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 rounded-xl hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors mb-[1px]"
          >
            <Plus size={20} />
          </button>
        </div>
        <div className="md:col-span-2">
          <Input 
            label="Estoque Mínimo (Opcional)" 
            icon={<AlertTriangle size={18} />}
            type="number"
            min="0"
            step="0.01"
            value={formData.min_quantity === null ? '' : formData.min_quantity}
            onChange={(e: any) => setFormData({ ...formData, min_quantity: e.target.value === '' ? null : parseFloat(e.target.value) })}
            error={fieldErrors.min_quantity}
          />
        </div>
      </div>

      <div className="flex justify-end gap-3 pt-4 border-t border-zinc-100 dark:border-zinc-800">
        <button 
          type="button"
          onClick={onClear}
          className="px-4 py-2 text-sm font-bold text-zinc-400 hover:text-zinc-600 dark:text-zinc-500 dark:hover:text-zinc-300 transition-colors mr-auto uppercase"
        >
          Limpar Campos
        </button>
        <button 
          type="button"
          onClick={onClose}
          className="px-6 py-2 text-sm font-bold text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100 transition-colors uppercase"
        >
          Cancelar
        </button>
        <Button type="submit">
          {editingProduct ? 'ATUALIZAR' : 'SALVAR'}
        </Button>
      </div>

      <Modal isOpen={isAddingCategory} onClose={() => setIsAddingCategory(false)} title="Nova Categoria" zIndex={300}>
        <div className="p-6 space-y-4">
          <Input 
            label="Nome da Categoria" 
            icon={<Tag size={18} />}
            value={newCategoryName}
            onChange={(e: any) => setNewCategoryName(e.target.value.toUpperCase())}
            autoFocus
            required
          />
          <div className="flex justify-end gap-3 pt-4 border-t border-zinc-100 dark:border-zinc-800">
            <button 
              type="button"
              onClick={() => setIsAddingCategory(false)}
              className="px-4 py-2 text-sm font-bold text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100 transition-colors uppercase"
            >
              Cancelar
            </button>
            <Button onClick={onAddCategory}>
              Salvar Categoria
            </Button>
          </div>
        </div>
      </Modal>

      <Modal isOpen={isAddingUnit} onClose={() => setIsAddingUnit(false)} title="Nova Unidade" zIndex={300}>
        <div className="p-6 space-y-4">
          <Input 
            label="Nome da Unidade" 
            icon={<FileText size={18} />}
            value={newUnitName}
            onChange={(e: any) => setNewUnitName(e.target.value.toUpperCase())}
            autoFocus
            required
          />
          <div className="flex justify-end gap-3 pt-4 border-t border-zinc-100 dark:border-zinc-800">
            <button 
              type="button"
              onClick={() => setIsAddingUnit(false)}
              className="px-4 py-2 text-sm font-bold text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100 transition-colors uppercase"
            >
              Cancelar
            </button>
            <Button onClick={onAddUnit}>
              Salvar Unidade
            </Button>
          </div>
        </div>
      </Modal>
    </form>
  </Modal>
);

export const StockInModal = ({
  isOpen,
  onClose,
  stockInData,
  setStockInData,
  onSubmit,
  suppliers,
  isAddingSupplier,
  setIsAddingSupplier,
  newSupplierName,
  setNewSupplierName,
  onAddSupplier,
  locations,
  isAddingLocation,
  setIsAddingLocation,
  newLocationName,
  setNewLocationName,
  onAddLocation,
  products,
  stockInError,
  fieldErrors,
  onClear
}: any) => {
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearchTerm = useDebounce(searchTerm, 300);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const scannerRef = useRef<Html5Qrcode | null>(null);

  const handleStartScanning = async () => {
    setCameraError(null);
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error("Seu navegador não suporta acesso à câmera ou a conexão não é segura (HTTPS).");
      }
      
      const devices = await Html5Qrcode.getCameras();
      if (!devices || devices.length === 0) {
        throw new Error("Nenhuma câmera encontrada neste dispositivo. Verifique se a webcam está conectada e permitida.");
      }
      
      setIsScanning(true);
    } catch (err: any) {
      console.error("Erro ao acessar câmera:", err);
      setCameraError(err.message || "Não foi possível acessar a câmera.");
    }
  };

  useEffect(() => {
    if (isScanning) {
      const html5QrCode = new Html5Qrcode("scanner-container");
      scannerRef.current = html5QrCode;
      
      const config = { fps: 10, qrbox: { width: 250, height: 150 } };
      
      html5QrCode.start(
        { facingMode: "environment" }, 
        config, 
        (decodedText) => {
          setStockInData({ ...stockInData, xml: decodedText });
          stopScanning();
        },
        (errorMessage) => {
          // ignore error
        }
      ).catch((err) => {
        console.error("Erro ao iniciar scanner:", err);
        setCameraError("Erro ao iniciar a captura de vídeo. Verifique as permissões da câmera.");
        setIsScanning(false);
      });
    }

    return () => {
      if (scannerRef.current && scannerRef.current.isScanning) {
        scannerRef.current.stop().then(() => {
          scannerRef.current?.clear();
        }).catch(err => console.error("Erro ao parar scanner:", err));
      }
    };
  }, [isScanning]);

  const stopScanning = () => {
    if (scannerRef.current && scannerRef.current.isScanning) {
      scannerRef.current.stop().then(() => {
        scannerRef.current?.clear();
        setIsScanning(false);
      }).catch(err => {
        console.error("Erro ao parar scanner:", err);
        setIsScanning(false);
      });
    } else {
      setIsScanning(false);
    }
  };

  const filteredProducts = products.filter((p: Product) => 
    p.name.toLowerCase().includes(debouncedSearchTerm.toLowerCase())
  );

  const selectedProduct = products.find((p: Product) => p.id.toString() === stockInData.product_id);

  useEffect(() => {
    if (!stockInData.product_id) {
      setSearchTerm('');
    }
  }, [stockInData.product_id]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="ENTRADA DE ESTOQUE" noPadding>
      <form onSubmit={onSubmit} noValidate className="p-6 space-y-4 overflow-y-auto flex-1">
        {stockInError && <ErrorAlert>{stockInError}</ErrorAlert>}

        <AnimatePresence>
          {(isScanning || cameraError) && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="relative bg-black rounded-xl overflow-hidden mb-4"
            >
              {isScanning ? (
                <>
                  <div id="scanner-container" className="w-full aspect-video"></div>
                  <button 
                    type="button"
                    onClick={stopScanning}
                    className="absolute top-2 right-2 p-2 bg-white/20 hover:bg-white/40 text-white rounded-full backdrop-blur-md transition-colors"
                  >
                    <X size={20} />
                  </button>
                  <div className="absolute bottom-4 left-0 right-0 text-center">
                    <p className="text-white text-[10px] font-bold uppercase tracking-widest bg-black/50 inline-block px-3 py-1 rounded-full">
                      Aponte para o código de barras da NF-e
                    </p>
                  </div>
                </>
              ) : (
                <div className="p-8 text-center space-y-4">
                  <div className="w-16 h-16 bg-rose-500/20 rounded-full flex items-center justify-center mx-auto">
                    <AlertTriangle className="text-rose-500" size={32} />
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-white font-bold uppercase tracking-wider">Erro de Hardware</h3>
                    <p className="text-zinc-400 text-sm max-w-xs mx-auto">
                      {cameraError}
                    </p>
                  </div>
                  <button 
                    type="button"
                    onClick={() => setCameraError(null)}
                    className="px-6 py-2 bg-white/10 hover:bg-white/20 text-white text-xs font-bold rounded-lg transition-colors uppercase"
                  >
                    Fechar Aviso
                  </button>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        <div className="space-y-4">
          {/* Linha 1: Produto */}
          <div className="space-y-1.5 relative" ref={dropdownRef}>
            <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest ml-1">
              Produto <span className="text-rose-500 ml-0.5">*</span>
            </label>
            <div className="relative">
              <div 
                className="w-full px-3 py-2 text-sm border border-zinc-200 dark:border-zinc-800 rounded-lg focus-within:ring-2 focus-within:ring-zinc-900 dark:focus-within:ring-zinc-100 outline-none bg-white dark:bg-black text-zinc-900 dark:text-zinc-100 flex items-center gap-2 cursor-pointer"
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              >
                <Search size={16} className="text-zinc-400" />
                <input 
                  type="text"
                  value={isDropdownOpen ? searchTerm : (selectedProduct ? selectedProduct.name : '')}
                  onChange={e => {
                    setSearchTerm(e.target.value.toUpperCase());
                    setIsDropdownOpen(true);
                  }}
                  onFocus={() => setIsDropdownOpen(true)}
                  className="flex-1 bg-transparent outline-none text-sm"
                />
                <ChevronDown size={16} className={cn("text-zinc-400 transition-transform", isDropdownOpen && "rotate-180")} />
              </div>

              <AnimatePresence>
                {isDropdownOpen && (
                  <motion.div 
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="absolute z-[210] left-0 right-0 mt-1 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-xl max-h-60 overflow-y-auto custom-scrollbar"
                  >
                    {filteredProducts.length > 0 ? (
                      filteredProducts.map((p: Product) => (
                        <button
                          key={p.id}
                          type="button"
                          onClick={() => {
                            setStockInData({...stockInData, product_id: p.id.toString()});
                            setSearchTerm('');
                            setIsDropdownOpen(false);
                          }}
                          className={cn(
                            "w-full px-4 py-2 text-left text-sm hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors flex items-center justify-between",
                            stockInData.product_id === p.id.toString() && "bg-zinc-50 dark:bg-zinc-800 font-bold"
                          )}
                        >
                          <div className="flex flex-col">
                            <span className="text-zinc-900 dark:text-zinc-100">{p.name}</span>
                          </div>
                          <span className="text-xs text-zinc-400 uppercase">Saldo: {p.quantity}</span>
                        </button>
                      ))
                    ) : (
                      <div className="px-4 py-3 text-sm text-zinc-500 text-center">Nenhum produto encontrado</div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            {fieldErrors.product_id && (
              <p className="text-[10px] font-bold text-rose-500 uppercase tracking-wider mt-1">
                {fieldErrors.product_id}
              </p>
            )}
            <input type="hidden" required value={stockInData.product_id} />
          </div>

          {/* Linha 2: Quantidade e Localização */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input 
              label="QUANTIDADE" 
              icon={<Hash size={18} />}
              required
              type="number" 
              min="0.01"
              step="0.01"
              value={stockInData.quantity || ''}
              onChange={(e: any) => setStockInData({...stockInData, quantity: parseFloat(e.target.value) || 0})}
              error={fieldErrors.quantity}
            />
            <div className="flex gap-2 items-end">
              <div className="flex-1">
                <Select 
                  label="LOCALIZAÇÃO" 
                  icon={<MapPin size={18} />}
                  required
                  value={stockInData.location}
                  onChange={(e: any) => setStockInData({...stockInData, location: e.target.value})}
                  options={[
                    { value: '', label: 'SELECIONE' },
                    ...locations.map((l: any) => ({ value: l.name, label: l.name.toUpperCase() }))
                  ]}
                  error={fieldErrors.location}
                />
              </div>
              <button 
                type="button"
                onClick={() => setIsAddingLocation(true)}
                className="p-2.5 bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 rounded-xl hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors mb-[1px]"
              >
                <Plus size={20} />
              </button>
            </div>
          </div>

          {/* Linha 3: Fornecedor e Documento Fiscal */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex gap-2 items-end">
              <div className="flex-1">
                <Select 
                  label="FORNECEDOR" 
                  icon={<User size={18} />}
                  required
                  value={stockInData.supplier_id}
                  onChange={(e: any) => setStockInData({...stockInData, supplier_id: e.target.value})}
                  options={[
                    { value: '', label: 'SELECIONE' },
                    ...suppliers.map((s: Supplier) => ({ value: s.id.toString(), label: s.name.toUpperCase() }))
                  ]}
                  error={fieldErrors.supplier_id}
                />
              </div>
              <button 
                type="button"
                onClick={() => setIsAddingSupplier(true)}
                className="p-2.5 bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 rounded-xl hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors mb-[1px]"
              >
                <Plus size={20} />
              </button>
            </div>
            <Input 
              label="DOCUMENTO FISCAL" 
              icon={<FileText size={18} />}
              value={stockInData.doc_number}
              onChange={(e: any) => setStockInData({...stockInData, doc_number: e.target.value.toUpperCase()})}
            />
          </div>

          {/* Linha 4: Nota Fiscal (PDF) e XML */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase">Nota Fiscal (PDF)</label>
              <div className="space-y-2">
                <div className="flex gap-2">
                  <input 
                    type="file" 
                    multiple
                    accept=".pdf"
                    className="hidden"
                    id="invoice-upload"
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                      const files = Array.from(e.target.files || []);
                      files.forEach((file: File) => {
                        const reader = new FileReader();
                        reader.onloadend = () => {
                          setStockInData((prev: any) => ({
                            ...prev,
                            invoices: [...(prev.invoices || []), { name: file.name, data: reader.result as string }]
                          }));
                        };
                        reader.readAsDataURL(file);
                      });
                      e.target.value = ''; // Reset input to allow same file selection
                    }}
                  />
                  <label 
                    htmlFor="invoice-upload"
                    className="flex-1 flex items-center justify-center gap-2 px-3 py-2 text-sm border-2 border-dashed border-zinc-200 dark:border-zinc-800 rounded-lg text-zinc-500 hover:border-zinc-400 dark:hover:border-zinc-700 transition-colors cursor-pointer"
                  >
                    <FileText size={18} />
                    <span>ADICIONAR PDF</span>
                  </label>
                </div>
                
                {stockInData.invoices && stockInData.invoices.length > 0 && (
                  <div className="space-y-1 max-h-32 overflow-y-auto custom-scrollbar pr-1">
                    {stockInData.invoices.map((file: any, index: number) => (
                      <div key={index} className="flex items-center justify-between px-3 py-1.5 bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-100 dark:border-zinc-800 rounded-lg text-[11px]">
                        <div className="flex items-center gap-2 truncate">
                          <FileText size={14} className="text-zinc-400 flex-shrink-0" />
                          <span className="text-zinc-600 dark:text-zinc-300 truncate">{file.name}</span>
                        </div>
                        <button 
                          type="button"
                          onClick={() => {
                            const newInvoices = [...stockInData.invoices];
                            newInvoices.splice(index, 1);
                            setStockInData({...stockInData, invoices: newInvoices});
                          }}
                          className="text-rose-500 hover:text-rose-600 p-1"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
            <div className="space-y-1.5">
              <Input
                label="XML (Chave de Acesso)"
                value={stockInData.xml}
                onChange={e => setStockInData({...stockInData, xml: e.target.value.toUpperCase()})}
                icon={<Barcode size={20} />}
                onIconClick={handleStartScanning}
              />
            </div>
          </div>

          {/* Linha 5: Data de Emissão e Valor Unitário */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Data de Emissão"
              required
              type="date"
              value={stockInData.issue_date}
              onChange={e => setStockInData({...stockInData, issue_date: e.target.value})}
              error={fieldErrors.issue_date}
            />
            <Input
              label="Valor Unitário (R$)"
              type="number"
              min="0"
              step="0.01"
              value={stockInData.unit_price || ''}
              onChange={e => setStockInData({...stockInData, unit_price: parseFloat(e.target.value) || 0})}
            />
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t border-zinc-100 dark:border-zinc-800">
          <Button 
            variant="ghost"
            onClick={() => {
              setCameraError(null);
              onClear();
            }}
            className="mr-auto"
          >
            Limpar Campos
          </Button>
          <Button 
            variant="secondary"
            onClick={() => {
              setCameraError(null);
              onClose();
            }}
          >
            Cancelar
          </Button>
          <Button 
            type="submit"
            variant="primary"
            className="bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/10"
          >
            CONFIRMAR ENTRADA
          </Button>
        </div>

        <Modal isOpen={isAddingLocation} onClose={() => setIsAddingLocation(false)} title="Nova Localização" zIndex={300}>
          <div className="p-6 space-y-4">
            <Input
              label="Nome da Localização"
              required
              value={newLocationName}
              onChange={e => setNewLocationName(e.target.value.toUpperCase())}
              autoFocus
            />
            <div className="flex justify-end gap-3 pt-4 border-t border-zinc-100 dark:border-zinc-800">
              <Button 
                variant="secondary"
                onClick={() => setIsAddingLocation(false)}
              >
                Cancelar
              </Button>
              <Button 
                variant="primary"
                className="bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/10"
                onClick={onAddLocation}
              >
                Salvar Localização
              </Button>
            </div>
          </div>
        </Modal>

        <Modal isOpen={isAddingSupplier} onClose={() => setIsAddingSupplier(false)} title="Novo Fornecedor" zIndex={300}>
          <div className="p-6 space-y-4">
            <Input
              label="Nome do Fornecedor"
              required
              value={newSupplierName}
              onChange={e => setNewSupplierName(e.target.value.toUpperCase())}
              autoFocus
            />
            <div className="flex justify-end gap-3 pt-4 border-t border-zinc-100 dark:border-zinc-800">
              <Button 
                variant="secondary"
                onClick={() => setIsAddingSupplier(false)}
              >
                Cancelar
              </Button>
              <Button 
                variant="primary"
                className="bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/10"
                onClick={onAddSupplier}
              >
                Salvar Fornecedor
              </Button>
            </div>
          </div>
        </Modal>
      </form>
    </Modal>
  );
};

export const StockOutModal = ({
  isOpen,
  onClose,
  stockOutData,
  setStockOutData,
  onSubmit,
  products,
  orders,
  stockOutError,
  setStockOutError,
  fieldErrors,
  onClear
}: any) => {
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearchTerm = useDebounce(searchTerm, 300);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const filteredProducts = products.filter((p: Product) => 
    p.name.toLowerCase().includes(debouncedSearchTerm.toLowerCase())
  );

  const selectedProduct = products.find((p: Product) => p.id.toString() === stockOutData.product_id);

  useEffect(() => {
    if (!stockOutData.product_id) {
      setSearchTerm('');
    }
  }, [stockOutData.product_id]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="SAÍDA DE ESTOQUE" noPadding>
      <form onSubmit={onSubmit} noValidate className="p-6 space-y-4 overflow-y-auto flex-1">
        {stockOutError && <ErrorAlert>{stockOutError}</ErrorAlert>}
        
        <div className="space-y-1.5 relative" ref={dropdownRef}>
          <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest ml-1">
            Produto <span className="text-rose-500 ml-0.5">*</span> {selectedProduct && (
              <span className="ml-2 text-zinc-400 uppercase">
                (Saldo: {selectedProduct.quantity > 0 ? selectedProduct.quantity : '-'})
              </span>
            )}
          </label>
          <div className="relative">
            <div 
              className="w-full px-3 py-2 text-sm border border-zinc-200 dark:border-zinc-800 rounded-lg focus-within:ring-2 focus-within:ring-zinc-900 dark:focus-within:ring-zinc-100 outline-none bg-white dark:bg-black text-zinc-900 dark:text-zinc-100 flex items-center gap-2 cursor-pointer"
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            >
              <Search size={16} className="text-zinc-400" />
              <input 
                type="text"
                value={isDropdownOpen ? searchTerm : (selectedProduct ? selectedProduct.name : '')}
                onChange={e => {
                  setSearchTerm(e.target.value.toUpperCase());
                  setIsDropdownOpen(true);
                }}
                onFocus={() => setIsDropdownOpen(true)}
                className="flex-1 bg-transparent outline-none text-sm"
              />
              <ChevronDown size={16} className={cn("text-zinc-400 transition-transform", isDropdownOpen && "rotate-180")} />
            </div>

            <AnimatePresence>
              {isDropdownOpen && (
                <motion.div 
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="absolute z-[210] left-0 right-0 mt-1 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-xl max-h-60 overflow-y-auto custom-scrollbar"
                >
                  {filteredProducts.length > 0 ? (
                    filteredProducts.map((p: Product) => (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => {
                          setStockOutData({...stockOutData, product_id: p.id.toString()});
                          setStockOutError(null);
                          setSearchTerm('');
                          setIsDropdownOpen(false);
                        }}
                        className={cn(
                          "w-full px-4 py-2 text-left text-sm hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors flex items-center justify-between",
                          stockOutData.product_id === p.id.toString() && "bg-zinc-50 dark:bg-zinc-800 font-bold"
                        )}
                      >
                        <div className="flex flex-col">
                          <span className="text-zinc-900 dark:text-zinc-100">{p.name}</span>
                        </div>
                        <span className="text-xs text-zinc-400">Saldo: {p.quantity > 0 ? p.quantity : '-'}</span>
                      </button>
                    ))
                  ) : (
                    <div className="px-4 py-3 text-sm text-zinc-500 text-center">Nenhum produto encontrado</div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          <input type="hidden" required value={stockOutData.product_id} />
        </div>

        <Input
          label="Quantidade"
          required
          type="number"
          min="0.01"
          step="0.01"
          value={stockOutData.quantity || ''}
          onChange={e => {
            setStockOutData({...stockOutData, quantity: parseFloat(e.target.value) || 0});
            setStockOutError(null);
          }}
        />

        <Select
          label="MOTIVO DA SAÍDA"
          required
          value={stockOutData.reason}
          onChange={e => setStockOutData({...stockOutData, reason: e.target.value, destination: ''})}
          options={[
            { value: 'venda', label: 'VENDA' },
            { value: 'consumo interno', label: 'CONSUMO INTERNO' },
            { value: 'devolução', label: 'DEVOLUÇÃO' },
            { value: 'perda/dano', label: 'PERDA/DANO' },
          ]}
        />

        {stockOutData.reason === 'venda' ? (
          <Select
            label="Destino / Ordem de Produção"
            required
            value={stockOutData.destination}
            onChange={e => setStockOutData({...stockOutData, destination: e.target.value})}
            options={[
              ...orders.map((order: Order) => ({
                value: order.title,
                label: `${order.title.toUpperCase()} (#${order.id})`
              }))
            ]}
          />
        ) : (
          <Input
            label="Destino / Ordem de Produção"
            required
            value={stockOutData.destination}
            onChange={e => setStockOutData({...stockOutData, destination: e.target.value.toUpperCase()})}
          />
        )}

        <div className="flex justify-end gap-3 pt-4 border-t border-zinc-100 dark:border-zinc-800">
          <Button 
            variant="ghost"
            onClick={onClear}
            className="mr-auto"
          >
            Limpar Campos
          </Button>
          <Button 
            variant="secondary"
            onClick={onClose}
          >
            Cancelar
          </Button>
          <Button 
            type="submit"
            variant="primary"
            className="bg-rose-600 hover:bg-rose-700 shadow-rose-600/10"
          >
            CONFIRMAR SAÍDA
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export const PdfOptionsModal = ({
  isOpen,
  onClose,
  selectedPdfFields,
  setSelectedPdfFields,
  onExport,
  ALL_COLUMNS,
  onClear
}: any) => (
  <Modal isOpen={isOpen} onClose={onClose} title="Opções de Exportação PDF">
    <div className="p-6 space-y-6">
      <div className="space-y-3">
        <label className="text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-widest">Colunas para incluir</label>
        <div className="grid grid-cols-2 gap-2">
            {ALL_COLUMNS.map((col: any) => {
              const selectedIndex = selectedPdfFields.indexOf(col.id);
              const isSelected = selectedIndex !== -1;
              
              return (
                <label key={col.id} className={cn(
                  "flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-all",
                  isSelected 
                    ? "border-zinc-900 bg-zinc-50 dark:border-zinc-100 dark:bg-zinc-800/50" 
                    : "border-zinc-100 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800"
                )}>
                  <div className="flex items-center gap-3">
                    <input 
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => {
                        if (isSelected) {
                          setSelectedPdfFields(selectedPdfFields.filter((f: string) => f !== col.id));
                        } else {
                          setSelectedPdfFields([...selectedPdfFields, col.id]);
                        }
                      }}
                      className="w-4 h-4 rounded border-zinc-300 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 focus:ring-zinc-900 dark:focus:ring-zinc-100"
                    />
                    <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300 uppercase">{col.label}</span>
                  </div>
                  {isSelected && (
                    <div className="flex items-center justify-center w-5 h-5 rounded-full bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 text-[10px] font-bold">
                      {selectedIndex + 1}
                    </div>
                  )}
                </label>
              );
            })}
        </div>
      </div>

      <div className="flex justify-end gap-3 pt-4 border-t border-zinc-100 dark:border-zinc-800">
        <button 
          type="button"
          onClick={onClear}
          className="px-4 py-2 text-sm font-bold text-zinc-400 hover:text-zinc-600 dark:text-zinc-500 dark:hover:text-zinc-300 transition-colors mr-auto uppercase"
        >
          Limpar Campos
        </button>
        <button 
          type="button"
          onClick={onClose}
          className="px-6 py-2 text-sm font-bold text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100 transition-colors uppercase"
        >
          Cancelar
        </button>
        <button 
          onClick={onExport}
          className="px-8 py-2 bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 text-sm font-bold rounded-xl hover:bg-zinc-800 dark:hover:bg-zinc-200 transition-all shadow-lg shadow-zinc-900/10 uppercase"
        >
          Gerar PDF
        </button>
      </div>
    </div>
  </Modal>
);

export const ProductDetailModal = ({
  isOpen,
  onClose,
  product,
  movements,
  isLoading,
  isAdmin = false,
  onEdit,
  onDelete
}: any) => {
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);
  
  return (
    <>
      <AnimatePresence>
        {isOpen && product && (
      <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 sm:p-6">
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-zinc-900/60 backdrop-blur-sm"
        />
        <motion.div 
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative w-full md:w-[66.666667%] max-w-5xl bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        >
          <div className="px-6 py-4 border-b border-zinc-100 dark:border-zinc-800 flex items-center justify-between flex-shrink-0 bg-zinc-50/50 dark:bg-zinc-800/50">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-zinc-900 dark:bg-zinc-100 flex items-center justify-center text-white dark:text-zinc-900">
                <Package size={20} />
              </div>
              <div>
                <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100 uppercase tracking-tight">{product.name}</h2>
                <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Detalhes do Produto</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button 
                onClick={() => onEdit(product)}
                className="p-2 text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg transition-colors shadow-sm"
                title="Editar"
              >
                <Edit size={18} />
              </button>
              {isAdmin && (
                <button 
                  onClick={() => setShowConfirmDelete(true)}
                  className="p-2 text-rose-600 hover:text-rose-700 bg-rose-50 dark:bg-rose-500/10 border border-rose-100 dark:border-rose-500/20 rounded-lg transition-colors shadow-sm"
                  title="Excluir"
                >
                  <Trash2 size={18} />
                </button>
              )}
              <button onClick={onClose} className="p-2 text-zinc-400 hover:text-zinc-600 dark:text-zinc-500 dark:hover:text-zinc-300 ml-2">
                <X size={20} />
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-6 space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="md:col-span-1">
                {product.photo ? (
                  <img 
                    src={product.photo} 
                    alt={product.name} 
                    className="w-full aspect-square rounded-xl object-cover border border-zinc-200 dark:border-zinc-800 shadow-sm"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="w-full aspect-square rounded-xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-800 border-dashed flex flex-col items-center justify-center text-zinc-400 dark:text-zinc-500 gap-2">
                    <Package size={48} strokeWidth={1} />
                    <span className="text-xs font-medium">Sem foto</span>
                  </div>
                )}
              </div>
              <div className="md:col-span-2 grid grid-cols-2 gap-y-6 gap-x-4">
                <div>
                  <p className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider mb-1">Categoria</p>
                  <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">{product.category}</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider mb-1">Unidade</p>
                  <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">{product.unit}</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider mb-1">Estoque Atual</p>
                  <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                    {product.quantity} {product.unit}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider mb-1">Estoque Mínimo</p>
                  <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">{product.min_quantity ?? 'Não definido'} {product.min_quantity !== null ? product.unit : ''}</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider mb-1">Valor Unitário (Média)</p>
                  <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                    {(() => {
                      const inMovements = movements.filter((m: Movement) => m.type === 'IN' && m.unit_price > 0);
                      if (inMovements.length === 0) return `R$ ${product.cost_price.toFixed(2)}`;
                      const sum = inMovements.reduce((acc: number, m: Movement) => acc + m.unit_price, 0);
                      const avg = sum / inMovements.length;
                      return `R$ ${avg.toFixed(2)}`;
                    })()}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider mb-1">Valor Total</p>
                  <p className="text-sm font-bold text-emerald-600 dark:text-emerald-400">
                    {(() => {
                      const inMovements = movements.filter((m: Movement) => m.type === 'IN' && m.unit_price > 0);
                      const avgPrice = inMovements.length > 0 
                        ? inMovements.reduce((acc: number, m: Movement) => acc + m.unit_price, 0) / inMovements.length 
                        : product.cost_price;
                      return `R$ ${(product.quantity * avgPrice).toFixed(2)}`;
                    })()}
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-widest">Histórico de Movimentações</h3>
              </div>
              <div className="border border-zinc-100 dark:border-zinc-800 rounded-xl overflow-hidden">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-zinc-50/50 dark:bg-zinc-800/50">
                      <th className="px-4 py-2 text-[10px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Data</th>
                      <th className="px-4 py-2 text-[10px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Tipo</th>
                      <th className="px-4 py-2 text-[10px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Qtd</th>
                      <th className="px-4 py-2 text-[10px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">V. Unitário</th>
                      <th className="px-4 py-2 text-[10px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Origem/Destino</th>
                      <th className="px-4 py-2 text-[10px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Doc/Motivo</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                    {isLoading ? (
                      <tr>
                        <td colSpan={6} className="px-4 py-8 text-center text-zinc-400 dark:text-zinc-500 text-xs">Carregando histórico...</td>
                      </tr>
                    ) : movements.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="px-4 py-8 text-center text-zinc-400 dark:text-zinc-500 text-xs">Nenhuma movimentação encontrada.</td>
                      </tr>
                    ) : (
                      movements.map((m: Movement) => (
                        <tr key={m.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors">
                          <td className="px-4 py-3 text-xs text-zinc-500 dark:text-zinc-400">
                            {new Date(m.date).toLocaleString('pt-BR', { 
                              day: '2-digit', 
                              month: '2-digit', 
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </td>
                          <td className="px-4 py-3">
                            <span className={cn(
                              "inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase",
                              m.type === 'IN' 
                                ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400" 
                                : "bg-rose-100 text-rose-700 dark:bg-rose-500/20 dark:text-rose-400"
                            )}>
                              {m.type === 'IN' ? <ArrowDownLeft size={8} /> : <ArrowUpRight size={8} />}
                              {m.type === 'IN' ? 'ENTRADA' : 'SAÍDA'}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-xs font-bold text-zinc-900 dark:text-zinc-100">{m.quantity}</td>
                          <td className="px-4 py-3 text-xs text-zinc-500 dark:text-zinc-400">
                            {m.unit_price > 0 ? `R$ ${m.unit_price.toFixed(2)}` : '-'}
                          </td>
                          <td className="px-4 py-3 text-xs text-zinc-500 dark:text-zinc-400 truncate max-w-[100px]">
                            {m.type === 'IN' ? (m.supplier_name || m.location || '-') : (m.destination || '-')}
                          </td>
                          <td className="px-4 py-3 text-xs text-zinc-500 dark:text-zinc-400 truncate max-w-[100px]">
                            {m.type === 'IN' ? (m.doc_number || '-') : (m.reason || '-')}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    )}
  </AnimatePresence>

  <ConfirmModal 
    isOpen={showConfirmDelete}
    onClose={() => setShowConfirmDelete(false)}
    onConfirm={() => {
      if (product) {
        onDelete(product.id);
        setShowConfirmDelete(false);
        onClose();
      }
    }}
    title="EXCLUIR PRODUTO"
    message={`Tem certeza que deseja excluir o produto "${product?.name}"? Esta ação não pode ser desfeita.`}
    confirmText="EXCLUIR AGORA"
    cancelText="CANCELAR"
    variant="danger"
    />
  </>
);
};
