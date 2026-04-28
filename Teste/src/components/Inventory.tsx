import React, { useState, useMemo, useEffect, useRef } from 'react';
import { 
  Settings, 
  ChevronUp, 
  ChevronDown, 
  Edit, 
  Trash2, 
  ArrowUpRight, 
  ArrowDownLeft, 
  RotateCcw,
  AlertTriangle,
  X
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Product, Supplier, Order, Movement } from '../types';
import { apiService } from '../services/apiService';
import { Card, cn, ErrorAlert } from './Common';
import { ProductTable } from './inventory/ProductTable';
import { MovementTable } from './inventory/MovementTable';
import { InventoryFilters } from './inventory/InventoryFilters';
import { ExportButtons } from './inventory/ExportButtons';
import { 
  ProductModal, 
  StockInModal, 
  StockOutModal, 
  PdfOptionsModal, 
  ProductDetailModal 
} from './inventory/InventoryModals';
import { maskCurrency, parseCurrency } from '../lib/masks';
import { 
  exportToCSV, 
  exportToPDF, 
  exportMovementsToPDF, 
  exportMovementsToCSV 
} from '../services/exportService';

interface InventoryProps {
  products: Product[];
  categories: {id: string | number, name: string}[];
  units: {id: string | number, name: string}[];
  suppliers: Supplier[];
  locations: {id: string | number, name: string}[];
  orders: Order[];
  movements: Movement[];
  isAdmin?: boolean;
  onAddProduct: (p: FormData) => void;
  onUpdateProduct: (id: string | number, p: FormData) => Promise<void>;
  onDeleteProduct: (id: string | number) => Promise<void>;
  onAddCategory: (name: string) => Promise<void>;
  onAddUnit: (name: string) => Promise<void>;
  onUpdateCategory: (id: string | number, name: string) => Promise<void>;
  onAddSupplier: (name: string) => Promise<void>;
  onAddLocation: (name: string) => Promise<void>;
  onUpdateLocation: (id: string | number, name: string) => Promise<void>;
  onStockIn: (data: any) => Promise<void>;
  onStockOut: (data: any) => Promise<void>;
  initialSearchTerm?: string;
  onSearchTermChange?: (val: string) => void;
}

export const Inventory = ({ 
  products, 
  categories, 
  units,
  suppliers,
  locations,
  orders,
  movements,
  isAdmin = false,
  onAddProduct, 
  onUpdateProduct,
  onDeleteProduct,
  onAddCategory,
  onAddUnit,
  onUpdateCategory,
  onAddSupplier,
  onAddLocation,
  onUpdateLocation,
  onStockIn,
  onStockOut,
  initialSearchTerm = '',
  onSearchTermChange
}: InventoryProps) => {
  const [activeSubTab, setActiveSubTab] = useState<'products' | 'movements'>('products');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isStockInModalOpen, setIsStockInModalOpen] = useState(false);
  const [isStockOutModalOpen, setIsStockOutModalOpen] = useState(false);
  const [isPdfOptionsModalOpen, setIsPdfOptionsModalOpen] = useState(false);
  const [selectedPdfFields, setSelectedPdfFields] = useState<string[]>([]);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [stockOutError, setStockOutError] = useState<string | null>(null);
  const [productError, setProductError] = useState<string | null>(null);
  const [stockInError, setStockInError] = useState<string | null>(null);
  const [productFieldErrors, setProductFieldErrors] = useState<{ [key: string]: string }>({});
  const [stockInFieldErrors, setStockInFieldErrors] = useState<{ [key: string]: string }>({});
  const [stockOutFieldErrors, setStockOutFieldErrors] = useState<{ [key: string]: string }>({});
  const [isAddingCategory, setIsAddingCategory] = useState(false);
  const [isAddingUnit, setIsAddingUnit] = useState(false);
  const [isEditingCategory, setIsEditingCategory] = useState(false);
  const [editingCategoryId, setEditingCategoryId] = useState<string | number | null>(null);
  const [isAddingSupplier, setIsAddingSupplier] = useState(false);
  const [isAddingLocation, setIsAddingLocation] = useState(false);
  const [isEditingLocation, setIsEditingLocation] = useState(false);
  const [editingLocationId, setEditingLocationId] = useState<string | number | null>(null);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newUnitName, setNewUnitName] = useState('');
  const [newSupplierName, setNewSupplierName] = useState('');
  const [newLocationName, setNewLocationName] = useState('');
  const [searchTerm, setSearchTerm] = useState(initialSearchTerm);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setSearchTerm(initialSearchTerm);
  }, [initialSearchTerm]);

  const handleSearchChange = (val: string) => {
    setSearchTerm(val);
    if (onSearchTermChange) onSearchTermChange(val);
  };
  const [sortConfig, setSortConfig] = useState<{ key: keyof Product | 'status'; direction: 'asc' | 'desc' } | null>(null);
  const [selectedProductForDetail, setSelectedProductForDetail] = useState<Product | null>(null);
  const [productMovements, setProductMovements] = useState<Movement[]>([]);
  const [isLoadingMovements, setIsLoadingMovements] = useState(false);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [movementTypeFilter, setMovementTypeFilter] = useState<'ALL' | 'IN' | 'OUT'>('ALL');
  const [movementLocationFilter, setMovementLocationFilter] = useState<string>('ALL');
  const DEFAULT_COLUMNS = ['name', 'category', 'quantity', 'total_value', 'min_quantity', 'status'];
  const [visibleColumns, setVisibleColumns] = useState<string[]>(() => {
    const saved = localStorage.getItem('inventory_visible_columns');
    return saved ? JSON.parse(saved) : DEFAULT_COLUMNS;
  });

  const DEFAULT_MOVEMENT_COLUMNS = ['date', 'type', 'product_name', 'quantity', 'supplier_name', 'location_destination', 'doc_reason', 'xml', 'attachments'];
  const [visibleMovementColumns, setVisibleMovementColumns] = useState<string[]>(() => {
    const saved = localStorage.getItem('inventory_movement_visible_columns');
    return saved ? JSON.parse(saved) : DEFAULT_MOVEMENT_COLUMNS;
  });

  useEffect(() => {
    localStorage.setItem('inventory_visible_columns', JSON.stringify(visibleColumns));
  }, [visibleColumns]);

  useEffect(() => {
    localStorage.setItem('inventory_movement_visible_columns', JSON.stringify(visibleMovementColumns));
  }, [visibleMovementColumns]);

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
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const importFileInputRef = useRef<HTMLInputElement>(null);

  const ALL_COLUMNS = [
    { id: 'id', label: 'ID' },
    { id: 'name', label: 'Produto' },
    { id: 'category', label: 'Categoria' },
    { id: 'quantity', label: 'Estoque' },
    { id: 'unit', label: 'Unidade' },
    { id: 'cost_price', label: 'V. Unitário' },
    { id: 'total_value', label: 'Valor Total' },
    { id: 'min_quantity', label: 'Mínimo' },
    { id: 'status', label: 'Status' }
  ];

  const ALL_MOVEMENT_COLUMNS = [
    { id: 'id', label: 'ID' },
    { id: 'date', label: 'Data' },
    { id: 'type', label: 'Tipo' },
    { id: 'product_name', label: 'Produto' },
    { id: 'quantity', label: 'Quantidade' },
    { id: 'supplier_name', label: 'Fornecedor' },
    { id: 'location_destination', label: 'Origem/Destino' },
    { id: 'doc_reason', label: 'Doc/Motivo' },
    { id: 'xml', label: 'XML' },
    { id: 'attachments', label: 'Anexos' }
  ];
  
  const [formData, setFormData] = useState({
    name: '',
    category: '',
    unit: 'un',
    photo: '',
    cost_price: '',
    min_quantity: null as number | null
  });

  useEffect(() => {
    if (editingProduct) {
      setFormData({
        name: editingProduct.name,
        category: editingProduct.category,
        unit: editingProduct.unit,
        photo: editingProduct.photo || '',
        cost_price: maskCurrency(editingProduct.cost_price.toString().replace('.', ',')),
        min_quantity: editingProduct.min_quantity
      });
    } else {
      setFormData({
        name: '',
        category: '',
        unit: 'un',
        photo: '',
        cost_price: '',
        min_quantity: null
      });
    }
  }, [editingProduct]);

  const [stockInData, setStockInData] = useState({
    supplier_id: '',
    doc_number: '',
    issue_date: new Date().toISOString().split('T')[0],
    product_id: '',
    location: '',
    quantity: 0,
    unit_price: '',
    xml: '',
    invoices: [] as { name: string, data: string }[]
  });

  const [stockOutData, setStockOutData] = useState({
    product_id: '',
    quantity: 0,
    reason: '',
    destination: ''
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        setProductError('A imagem deve ter no máximo 2MB.');
        return;
      }
      setSelectedFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData({ ...formData, photo: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setProductError(null);
    setProductFieldErrors({});
    const newFieldErrors: { [key: string]: string } = {};

    // Manual validation
    let hasError = false;
    if (!formData.name) {
      newFieldErrors.name = 'O nome do produto é obrigatório.';
      hasError = true;
    } else {
      const isDuplicate = products.some(p => 
        p.id !== editingProduct?.id && 
        p.name.toUpperCase() === formData.name.toUpperCase()
      );
      if (isDuplicate) {
        newFieldErrors.name = 'PRODUTO JÁ CADASTRADO COM ESTE NOME';
        hasError = true;
      }
    }
    if (!formData.category) {
      newFieldErrors.category = 'A categoria é obrigatória.';
      hasError = true;
    }
    if (!formData.unit) {
      newFieldErrors.unit = 'A unidade é obrigatória.';
      hasError = true;
    }

    if (hasError) {
      setProductFieldErrors(newFieldErrors);
      setProductError('Por favor, preencha todos os campos obrigatórios (*).');
      return;
    }

    const data = new FormData();
    data.append('name', formData.name);
    data.append('category', formData.category);
    data.append('unit', formData.unit);
    data.append('cost_price', parseCurrency(formData.cost_price).toString());
    
    if (formData.min_quantity !== null && formData.min_quantity !== undefined) {
      data.append('min_quantity', formData.min_quantity.toString());
    } else {
      data.append('min_quantity', '');
    }

    if (selectedFile) {
      data.append('photo', selectedFile);
    } else {
      data.append('photo', formData.photo);
    }

    if (editingProduct) {
      onUpdateProduct(editingProduct.id, data);
    } else {
      onAddProduct(data);
    }
    setIsModalOpen(false);
    setEditingProduct(null);
    setSelectedFile(null);
  };

  const resetStockInForm = () => {
    setStockInData({
      supplier_id: '',
      doc_number: '',
      issue_date: new Date().toISOString().split('T')[0],
      product_id: '',
      location: '',
      quantity: 0,
      unit_price: '',
      xml: '',
      invoices: []
    });
    setIsAddingSupplier(false);
    setIsAddingLocation(false);
    setStockInError(null);
    setNewSupplierName('');
    setNewLocationName('');
  };

  const resetProductForm = () => {
    if (editingProduct) {
      setFormData({
        name: editingProduct.name,
        category: editingProduct.category,
        unit: editingProduct.unit,
        photo: editingProduct.photo || '',
        cost_price: editingProduct.cost_price,
        min_quantity: editingProduct.min_quantity
      });
    } else {
      setFormData({
        name: '',
        category: '',
        unit: 'un',
        photo: '',
        cost_price: 0,
        min_quantity: null
      });
    }
    setProductError(null);
    setSelectedFile(null);
  };

  const resetStockOutForm = () => {
    setStockOutData({
      product_id: '',
      quantity: 0,
      reason: '',
      destination: ''
    });
    setStockOutError(null);
  };

  const resetPdfOptions = () => {
    setSelectedPdfFields([]);
  };

  const handleStockInSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setStockInError(null);
    setStockInFieldErrors({});
    const newFieldErrors: { [key: string]: string } = {};

    let hasError = false;
    if (!stockInData.product_id) {
      newFieldErrors.product_id = 'O produto é obrigatório.';
      hasError = true;
    }
    if (!stockInData.quantity || stockInData.quantity <= 0) {
      newFieldErrors.quantity = 'A quantidade deve ser maior que zero.';
      hasError = true;
    }
    if (!stockInData.location) {
      newFieldErrors.location = 'A localização é obrigatória.';
      hasError = true;
    }
    if (!stockInData.supplier_id) {
      newFieldErrors.supplier_id = 'O fornecedor é obrigatório.';
      hasError = true;
    }
    if (stockInData.doc_number) {
      const isDuplicate = movements.some(m => 
        m.type === 'IN' && 
        m.doc_number === stockInData.doc_number && 
        m.supplier_id === parseInt(stockInData.supplier_id)
      );
      if (isDuplicate) {
        newFieldErrors.doc_number = 'Nº DOCUMENTO JÁ CADASTRADO PARA ESTE FORNECEDOR';
        hasError = true;
      }
    }
    if (!stockInData.issue_date) {
      newFieldErrors.issue_date = 'A data de emissão é obrigatória.';
      hasError = true;
    }

    if (hasError) {
      setStockInFieldErrors(newFieldErrors);
      setStockInError('Por favor, preencha todos os campos obrigatórios (*).');
      return;
    }

    const product = products.find(p => p.id === parseInt(stockInData.product_id));
    const supplier = suppliers.find(s => s.id.toString() === stockInData.supplier_id.toString());
    const supplierName = supplier ? (supplier.tipo === 'PF' ? supplier.name : supplier.razao_social) : '';

    onStockIn({
      ...stockInData,
      unit_price: parseCurrency(stockInData.unit_price.toString()),
      product_name: product?.name || '',
      supplier_name: supplierName || ''
    });
    setIsStockInModalOpen(false);
    resetStockInForm();
  };

  const handleStockOutSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setStockOutError(null);
    setStockOutFieldErrors({});
    const newFieldErrors: { [key: string]: string } = {};

    let hasError = false;
    if (!stockOutData.product_id) {
      newFieldErrors.product_id = 'O produto é obrigatório.';
      hasError = true;
    }
    if (!stockOutData.quantity || stockOutData.quantity <= 0) {
      newFieldErrors.quantity = 'A quantidade deve ser maior que zero.';
      hasError = true;
    }

    if (hasError) {
      setStockOutFieldErrors(newFieldErrors);
      setStockOutError('Por favor, preencha todos os campos obrigatórios (*).');
      return;
    }

    const product = products.find(p => p.id === parseInt(stockOutData.product_id));
    if (product && product.quantity < stockOutData.quantity) {
      newFieldErrors.quantity = `Saldo insuficiente (${product.quantity})`;
      setStockOutFieldErrors(newFieldErrors);
      setStockOutError(`Não é possível realizar a saída: Quantidade solicitada (${stockOutData.quantity}) é maior que o saldo atual (${product.quantity}).`);
      return;
    }
    onStockOut(stockOutData);
    setIsStockOutModalOpen(false);
    setStockOutData({
      product_id: '',
      quantity: 0,
      reason: '',
      destination: ''
    });
  };

  const handleAddCategory = async () => {
    if (newCategoryName.trim()) {
      const name = newCategoryName.trim().toUpperCase();
      const isDuplicate = categories.some(c => c.id !== editingCategoryId && c.name.toUpperCase() === name);
      if (isDuplicate) {
        setError('CATEGORIA JÁ CADASTRADA');
        return;
      }

      if (isEditingCategory && editingCategoryId) {
        await onUpdateCategory(editingCategoryId, newCategoryName.trim());
      } else {
        await onAddCategory(newCategoryName.trim());
      }
      setFormData({ ...formData, category: newCategoryName.trim() });
      setNewCategoryName('');
      setIsAddingCategory(false);
      setIsEditingCategory(false);
      setEditingCategoryId(null);
    }
  };

  const handleAddUnit = async () => {
    if (newUnitName.trim()) {
      const name = newUnitName.trim().toUpperCase();
      const isDuplicate = units.some(u => u.name.toUpperCase() === name);
      if (isDuplicate) {
        setError('UNIDADE JÁ CADASTRADA');
        return;
      }

      await onAddUnit(newUnitName.trim().toUpperCase());
      setFormData({ ...formData, unit: newUnitName.trim().toUpperCase() });
      setNewUnitName('');
      setIsAddingUnit(false);
    }
  };

  const handleAddSupplier = async () => {
    if (newSupplierName.trim()) {
      const name = newSupplierName.trim().toUpperCase();
      const isDuplicate = suppliers.some(s => (s.name || s.razao_social)?.toUpperCase() === name);
      if (isDuplicate) {
        setError('FORNECEDOR JÁ CADASTRADO');
        return;
      }

      await onAddSupplier(newSupplierName.trim());
      setNewSupplierName('');
      setIsAddingSupplier(false);
    }
  };

  const handleAddLocation = async () => {
    if (newLocationName.trim()) {
      const name = newLocationName.trim().toUpperCase();
      const isDuplicate = locations.some(l => l.id !== editingLocationId && l.name.toUpperCase() === name);
      if (isDuplicate) {
        setError('LOCALIZAÇÃO JÁ CADASTRADA');
        return;
      }

      if (isEditingLocation && editingLocationId) {
        await onUpdateLocation(editingLocationId, newLocationName.trim());
      } else {
        await onAddLocation(newLocationName.trim());
      }
      setStockInData({ ...stockInData, location: newLocationName.trim() });
      setNewLocationName('');
      setIsAddingLocation(false);
      setIsEditingLocation(false);
      setEditingLocationId(null);
    }
  };

  const handleImportCsv = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      const csvData = event.target?.result as string;
      try {
        const result = await apiService.importProducts(csvData);
        if (result.success) {
          setError(`Importação concluída! ${result.imported} produtos importados.${result.errors.length > 0 ? '\n\nErros:\n' + result.errors.join('\n') : ''}`);
        } else {
          setError(`Erro na importação: ${result.success}`);
        }
      } catch (error: any) {
        console.error('Erro ao importar CSV:', error);
        setError(error.message || 'Erro ao importar arquivo CSV.');
      } finally {
        if (importFileInputRef.current) importFileInputRef.current.value = '';
      }
    };
    reader.readAsText(file);
  };

  const filteredProducts = useMemo(() => {
    let result = products;

    if (searchTerm === 'ESTOQUE BAIXO') {
      result = result.filter(p => p.min_quantity !== null && p.quantity <= p.min_quantity);
    } else {
      result = result.filter(p => 
        Object.values(p).some(val => 
          val !== null && val !== undefined && val.toString().toLowerCase().includes(searchTerm.toLowerCase())
        )
      );
    }

    if (sortConfig) {
      result.sort((a, b) => {
        let aValue: any;
        let bValue: any;

        if (sortConfig.key === 'status') {
          aValue = (a.min_quantity !== null && a.quantity <= a.min_quantity) ? 0 : 1;
          bValue = (b.min_quantity !== null && b.quantity <= b.min_quantity) ? 0 : 1;
        } else {
          aValue = a[sortConfig.key];
          bValue = b[sortConfig.key];
        }

        if (aValue === null || aValue === undefined) return 1;
        if (bValue === null || bValue === undefined) return -1;

        if (typeof aValue === 'string') {
          aValue = aValue.toLowerCase();
          bValue = bValue.toLowerCase();
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
  }, [products, searchTerm, sortConfig]);

  const requestSort = (key: keyof Product | 'status') => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const getSortIcon = (key: keyof Product | 'status') => {
    if (!sortConfig || sortConfig.key !== key) return <ChevronDown size={12} className="opacity-0 group-hover:opacity-50" />;
    return sortConfig.direction === 'asc' ? <ChevronUp size={12} /> : <ChevronDown size={12} />;
  };

  const handleProductClick = async (product: Product) => {
    setSelectedProductForDetail(product);
    setIsLoadingMovements(true);
    try {
      const data = await apiService.getProductMovements(product.id);
      setProductMovements(data);
    } catch (err) {
      console.error('Error fetching movements:', err);
    } finally {
      setIsLoadingMovements(false);
    }
  };

  const filteredMovements = useMemo(() => {
    return movements.filter(m => {
      const matchesSearch = Object.values(m).some(val => 
        val !== null && val !== undefined && val.toString().toLowerCase().includes(searchTerm.toLowerCase())
      );
      
      const movementDate = new Date(m.date);
      const start = startDate ? new Date(startDate.replace(/-/g, '\/')) : null;
      const end = endDate ? new Date(endDate.replace(/-/g, '\/')) : null;
      
      if (start) start.setHours(0, 0, 0, 0);
      if (end) end.setHours(23, 59, 59, 999);
      
      const matchesDate = (!start || movementDate >= start) && (!end || movementDate <= end);
      
      const matchesType = movementTypeFilter === 'ALL' || m.type === movementTypeFilter;
      
      const mLoc = m.type === 'IN' ? m.location : null;
      const matchesLocation = movementLocationFilter === 'ALL' || mLoc === movementLocationFilter;
      
      return matchesSearch && matchesDate && matchesType && matchesLocation;
    });
  }, [movements, searchTerm, startDate, endDate, movementTypeFilter, movementLocationFilter]);

  return (
    <>
      <div className="flex items-center gap-4 mb-6">
        <button 
          onClick={() => setActiveSubTab('products')}
          className={cn(
            "px-4 py-2 text-sm font-bold rounded-xl transition-colors uppercase",
            activeSubTab === 'products' 
              ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 shadow-lg shadow-zinc-900/10 dark:shadow-none" 
              : "text-zinc-500 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800"
          )}
        >
          PRODUTOS
        </button>
        <button 
          onClick={() => setActiveSubTab('movements')}
          className={cn(
            "px-4 py-2 text-sm font-bold rounded-xl transition-colors uppercase",
            activeSubTab === 'movements' 
              ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 shadow-lg shadow-zinc-900/10 dark:shadow-none" 
              : "text-zinc-500 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800"
          )}
        >
          MOVIMENTAÇÕES
        </button>
      </div>
      
      {error && <ErrorAlert className="mb-6">{error}</ErrorAlert>}

      <Card className="p-0 overflow-visible">
        <div className="p-6 border-b border-zinc-100 dark:border-zinc-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <InventoryFilters 
            activeSubTab={activeSubTab}
            searchTerm={searchTerm}
            setSearchTerm={handleSearchChange}
            movementTypeFilter={movementTypeFilter}
            setMovementTypeFilter={setMovementTypeFilter}
            movementLocationFilter={movementLocationFilter}
            setMovementLocationFilter={setMovementLocationFilter}
            locations={locations}
            startDate={startDate}
            setStartDate={setStartDate}
            endDate={endDate}
            setEndDate={setEndDate}
          />
          <div className="flex items-center gap-3 flex-wrap w-full md:w-auto py-1 -mx-2 px-2 md:mx-0 md:px-0">
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
                      {activeSubTab === 'products' ? (
                        ALL_COLUMNS.map(col => (
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
                        ))
                      ) : (
                        ALL_MOVEMENT_COLUMNS.map(col => (
                          <label key={col.id} className="flex items-center gap-3 px-3 py-2 hover:bg-zinc-50 dark:hover:bg-zinc-800 rounded-lg cursor-pointer transition-colors group">
                            <input 
                              type="checkbox"
                              checked={visibleMovementColumns.includes(col.id)}
                              onChange={() => {
                                if (visibleMovementColumns.includes(col.id)) {
                                  if (visibleMovementColumns.length > 1) {
                                    setVisibleMovementColumns(visibleMovementColumns.filter(c => c !== col.id));
                                  }
                                } else {
                                  setVisibleMovementColumns([...visibleMovementColumns, col.id]);
                                }
                              }}
                              className="w-4 h-4 rounded border-zinc-300 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 focus:ring-zinc-900 dark:focus:ring-zinc-100"
                            />
                            <span className="text-sm text-zinc-600 dark:text-zinc-400 group-hover:text-zinc-900 dark:group-hover:text-zinc-100 transition-colors uppercase">{col.label}</span>
                          </label>
                        ))
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            <ExportButtons 
              activeSubTab={activeSubTab}
              onPdfClick={() => {
                setSelectedPdfFields([]);
                setIsPdfOptionsModalOpen(true);
              }}
              onCsvClick={() => exportToCSV(filteredProducts)}
              onImportCsvClick={() => importFileInputRef.current?.click()}
              onStockOutClick={() => setIsStockOutModalOpen(true)}
              onStockInClick={() => { resetStockInForm(); setIsStockInModalOpen(true); }}
              onNewProductClick={() => { setEditingProduct(null); setIsModalOpen(true); }}
              onExportMovementsPdf={() => exportMovementsToPDF(filteredMovements)}
              onExportMovementsCsv={() => exportMovementsToCSV(filteredMovements)}
            />
            <input 
              type="file" 
              ref={importFileInputRef} 
              onChange={handleImportCsv} 
              accept=".csv" 
              className="hidden" 
            />
          </div>
        </div>
        <div className="overflow-x-auto">
          {activeSubTab === 'products' ? (
            <ProductTable 
              products={filteredProducts}
              visibleColumns={visibleColumns}
              requestSort={requestSort}
              getSortIcon={getSortIcon}
              onProductClick={handleProductClick}
              isAdmin={isAdmin}
            />
          ) : (
            <MovementTable 
              movements={filteredMovements} 
              visibleColumns={visibleMovementColumns}
            />
          )}
        </div>
      </Card>

      <ProductModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        editingProduct={editingProduct}
        formData={formData}
        setFormData={setFormData}
        onSubmit={handleSubmit}
        categories={categories}
        units={units}
        isAddingCategory={isAddingCategory}
        setIsAddingCategory={setIsAddingCategory}
        newCategoryName={newCategoryName}
        setNewCategoryName={setNewCategoryName}
        onAddCategory={handleAddCategory}
        onAddUnit={handleAddUnit}
        isAddingUnit={isAddingUnit}
        setIsAddingUnit={setIsAddingUnit}
        newUnitName={newUnitName}
        setNewUnitName={setNewUnitName}
        productError={productError}
        fieldErrors={productFieldErrors}
        fileInputRef={fileInputRef}
        handleFileChange={handleFileChange}
        onClear={resetProductForm}
      />

      <StockInModal 
        isOpen={isStockInModalOpen}
        onClose={() => setIsStockInModalOpen(false)}
        stockInData={stockInData}
        setStockInData={setStockInData}
        onSubmit={handleStockInSubmit}
        suppliers={suppliers}
        isAddingSupplier={isAddingSupplier}
        setIsAddingSupplier={setIsAddingSupplier}
        newSupplierName={newSupplierName}
        setNewSupplierName={setNewSupplierName}
        onAddSupplier={handleAddSupplier}
        locations={locations}
        isAddingLocation={isAddingLocation}
        setIsAddingLocation={setIsAddingLocation}
        newLocationName={newLocationName}
        setNewLocationName={setNewLocationName}
        onAddLocation={handleAddLocation}
        products={products}
        stockInError={stockInError}
        fieldErrors={stockInFieldErrors}
        onClear={resetStockInForm}
      />

      <StockOutModal 
        isOpen={isStockOutModalOpen}
        onClose={() => setIsStockOutModalOpen(false)}
        stockOutData={stockOutData}
        setStockOutData={setStockOutData}
        onSubmit={handleStockOutSubmit}
        products={products}
        orders={orders}
        stockOutError={stockOutError}
        setStockOutError={setStockOutError}
        fieldErrors={stockOutFieldErrors}
        onClear={resetStockOutForm}
      />

      <PdfOptionsModal 
        isOpen={isPdfOptionsModalOpen}
        onClose={() => setIsPdfOptionsModalOpen(false)}
        selectedPdfFields={selectedPdfFields}
        setSelectedPdfFields={setSelectedPdfFields}
        onExport={() => {
          exportToPDF(filteredProducts, selectedPdfFields, false);
          setIsPdfOptionsModalOpen(false);
        }}
        ALL_COLUMNS={ALL_COLUMNS}
        onClear={resetPdfOptions}
      />

      <ProductDetailModal 
        isOpen={!!selectedProductForDetail}
        onClose={() => setSelectedProductForDetail(null)}
        product={selectedProductForDetail}
        movements={productMovements}
        isLoading={isLoadingMovements}
        isAdmin={isAdmin}
        onEdit={(p: any) => {
          setEditingProduct(p);
          setIsModalOpen(true);
          setSelectedProductForDetail(null);
        }}
        onDelete={onDeleteProduct}
      />
    </>
  );
};
