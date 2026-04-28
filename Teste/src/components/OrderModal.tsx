import React, { useState, useEffect, useRef } from 'react';
import { X, ChevronLeft, ChevronRight, Plus, Trash2, Check, AlertTriangle, Type, User, Calendar, FileText, Thermometer, Box, Briefcase, Package, Upload, Paperclip, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Client, Order, OrderStatus, OrderDetails, ProductionItem, ServiceEntry, ProductionProduct } from '../types';
import { KANBAN_COLUMNS } from '../constants';
import { cn, Input, Select, Button, Modal, ErrorAlert, TextArea } from './Common';

interface OrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: any) => void;
  editingOrder?: Order | null;
  clients: Client[];
  orders: Order[];
  serviceEntries: ServiceEntry[];
}

const IMPRESSION_OPTIONS = ['Impressão 3D', 'Impressão Digital', 'Plotter'];
const CUTS_FOLDS_OPTIONS = ['Chaparia', 'Gabarito Instalação', 'Metalon', 'Dobra', 'Gabarito Produção', 'Router ACM', 'Acrílico', 'Corte Plasma', 'Laser Acrílico', 'Router MDF'];
const WELDS_OPTIONS = ['Branca', 'Eletrodo', 'MIG', 'TIG'];
const ROUGH_FINISH_OPTIONS = ['Desbaste', 'Fino'];
const PAINTING_OPTIONS = ['Automotiva', 'Acetinado / Semi-Brilho', 'Laca', 'Eletrostática', 'Brilhante', 'Poliéster', 'Fosco', 'PU'];
const FINAL_FINISH_OPTIONS = ['ACM', 'Lixamento / Preparação', 'Acrílico', 'MDF', 'Adesivo', 'Pintura', 'Impressão'];
const LIGHTING_OPTIONS = ['Fita LED', 'LED / Soldagem / Fiação', 'RGB', 'Haste', 'Módulo LED', 'Lâmpada Tubular / Fiação', 'Refletor / Fiação'];
const ACCESSORIES_OPTIONS = ['Barra Roscada', 'Cantoneiras', 'Fita VHB', 'Parabolt', 'Pino Fixador', 'Sikadur', 'Bucha', 'Fiação', 'Fonte', 'Parafuso', 'Prolongador', 'Vidros', 'Canaleta de LED', 'Interruptor LD', 'Mão Amiga', 'Perfil Alumínio', 'Sapata Regulável'];
const GLUING_OPTIONS = ['ACM', 'Módulo de LED', 'Acrílico', 'Primmer', 'Cola / Cianocrilato', 'Silicone / Vedação', 'Fita de Borda'];

export const OrderModal = ({ 
  isOpen, 
  onClose, 
  onSubmit, 
  editingOrder, 
  clients,
  orders,
  serviceEntries
}: OrderModalProps) => {
  const [step, setStep] = useState(1);
  const [error, setError] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<{ [key: string]: string }>({});
  const formRef = useRef<HTMLFormElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    client_id: '',
    service_entry_id: '',
    status: 'ORDENS DE PRODUÇÃO' as OrderStatus,
    details: {
      entry_date: new Date().toISOString().split('T')[0],
      delivery_date: '',
      attachments: [],
      attachment: '',
      attachment_name: '',
      impression_3d: { items: [] },
      cuts_folds: { items: [] },
      welds: { items: [] },
      rough_finish: { items: [] },
      painting: { items: [], shipping_date: '' },
      final_finish: { items: [] },
      lighting: { items: [], temperature: '', model: '' },
      accessories: { items: [] },
      gluing: { items: [] }
    } as OrderDetails
  });

  const [customItems, setCustomItems] = useState<{ [key: string]: string[] }>({
    impression_3d: [],
    cuts_folds: [],
    welds: [],
    rough_finish: [],
    painting: [],
    final_finish: [],
    lighting: [],
    accessories: [],
    gluing: []
  });

  useEffect(() => {
    if (editingOrder && isOpen) {
      let details: OrderDetails;
      if (typeof editingOrder.details === 'string') {
        try {
          details = JSON.parse(editingOrder.details);
        } catch (e) {
          console.error("Error parsing details string:", e);
          details = null as any;
        }
      } else {
        details = editingOrder.details as OrderDetails;
      }

      const initialDetails: OrderDetails = {
        entry_date: details?.entry_date || new Date().toISOString().split('T')[0],
        delivery_date: details?.delivery_date || '',
        attachments: details?.attachments || (details?.attachment ? [{ url: details.attachment, name: details.attachment_name || 'Projeto' }] : []),
        attachment: details?.attachment || '',
        attachment_name: details?.attachment_name || '',
        impression_3d: details?.impression_3d ? { items: details.impression_3d.items.map((i: any) => typeof i === 'string' ? { name: i, quantity: 1 } : i) } : { items: [] },
        cuts_folds: details?.cuts_folds ? { items: details.cuts_folds.items.map((i: any) => typeof i === 'string' ? { name: i, quantity: 1 } : i) } : { items: [] },
        welds: details?.welds ? { items: details.welds.items.map((i: any) => typeof i === 'string' ? { name: i, quantity: 1 } : i) } : { items: [] },
        rough_finish: details?.rough_finish ? { items: details.rough_finish.items.map((i: any) => typeof i === 'string' ? { name: i, quantity: 1 } : i) } : { items: [] },
        painting: details?.painting ? { items: details.painting.items.map((i: any) => typeof i === 'string' ? { name: i, quantity: 1 } : i), shipping_date: details.painting.shipping_date || '' } : { items: [], shipping_date: '' },
        final_finish: details?.final_finish ? { items: details.final_finish.items.map((i: any) => typeof i === 'string' ? { name: i, quantity: 1 } : i) } : { items: [] },
        lighting: details?.lighting ? { items: details.lighting.items.map((i: any) => typeof i === 'string' ? { name: i, quantity: 1 } : i), temperature: details.lighting.temperature || '', model: details.lighting.model || '' } : { items: [], temperature: '', model: '' },
        accessories: details?.accessories ? { items: details.accessories.items.map((i: any) => typeof i === 'string' ? { name: i, quantity: 1 } : i) } : { items: [] },
        gluing: details?.gluing ? { items: details.gluing.items.map((i: any) => typeof i === 'string' ? { name: i, quantity: 1 } : i) } : { items: [] },
        completed_items: details?.completed_items || [],
        products: details?.products || []
      };

      setFormData({
        title: editingOrder.title,
        description: editingOrder.description || '',
        client_id: editingOrder.client_id?.toString() || '',
        service_entry_id: editingOrder.service_entry_id?.toString() || '',
        status: editingOrder.status,
        details: initialDetails
      });

      // Identify custom items
      const newCustomItems: { [key: string]: string[] } = {};
      
      const checkCustom = (key: string, options: string[], items: ProductionItem[]) => {
        const upperOptions = options.map(o => o.toUpperCase());
        newCustomItems[key] = items
          .filter(item => !upperOptions.includes(item.name.toUpperCase()))
          .map(item => item.name);
      };

      checkCustom('impression_3d', IMPRESSION_OPTIONS, initialDetails.impression_3d.items);
      checkCustom('cuts_folds', CUTS_FOLDS_OPTIONS, initialDetails.cuts_folds.items);
      checkCustom('welds', WELDS_OPTIONS, initialDetails.welds.items);
      checkCustom('rough_finish', ROUGH_FINISH_OPTIONS, initialDetails.rough_finish.items);
      checkCustom('painting', PAINTING_OPTIONS, initialDetails.painting.items);
      checkCustom('final_finish', FINAL_FINISH_OPTIONS, initialDetails.final_finish.items);
      checkCustom('lighting', LIGHTING_OPTIONS, initialDetails.lighting.items);
      checkCustom('accessories', ACCESSORIES_OPTIONS, initialDetails.accessories.items);
      checkCustom('gluing', GLUING_OPTIONS, initialDetails.gluing.items);

      setCustomItems(newCustomItems);
      setStep(1);
    } else if (!editingOrder && isOpen) {
      setFormData({
        title: '',
        description: '',
        client_id: '',
        service_entry_id: '',
        status: 'ORDENS DE PRODUÇÃO',
        details: {
          entry_date: new Date().toISOString().split('T')[0],
          delivery_date: '',
          attachments: [],
          attachment: '',
          attachment_name: '',
          impression_3d: { items: [] },
          cuts_folds: { items: [] },
          welds: { items: [] },
          rough_finish: { items: [] },
          painting: { items: [], shipping_date: '' },
          final_finish: { items: [] },
          lighting: { items: [], temperature: '', model: '' },
          accessories: { items: [] },
          gluing: { items: [] }
        }
      });
      setCustomItems({
        impression_3d: [],
        cuts_folds: [],
        welds: [],
        rough_finish: [],
        painting: [],
        final_finish: [],
        lighting: [],
        accessories: [],
        gluing: []
      });
      setStep(1);
    }
  }, [editingOrder, isOpen]);

  const uploadFiles = async (files: FileList | File[]) => {
    setIsUploading(true);
    setError(null);

    const newAttachments = [...(formData.details.attachments || [])];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const formDataUpload = new FormData();
      formDataUpload.append('file', file);
      formDataUpload.append('category', 'projects');

      try {
        const response = await fetch('/api/upload', {
          method: 'POST',
          body: formDataUpload
        });

        if (!response.ok) throw new Error(`Falha no upload do arquivo ${file.name}`);

        const data = await response.json();
        newAttachments.push({ url: data.url, name: data.name });
      } catch (err) {
        console.error(err);
        setError(`ERRO AO ENVIAR ${file.name.toUpperCase()}. ALGUNS ARQUIVOS PODEM NÃO TER SIDO ENVIADOS.`);
      }
    }

    setFormData(prev => ({
      ...prev,
      details: {
        ...prev.details,
        attachments: newAttachments,
        // Mantém retrocompatibilidade para o primeiro anexo se não houver um principal
        attachment: newAttachments[0]?.url || '',
        attachment_name: newAttachments[0]?.name || ''
      }
    }));
    
    setIsUploading(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      uploadFiles(e.target.files);
    }
  };

  const [isDragging, setIsDragging] = useState(false);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      uploadFiles(e.dataTransfer.files);
    }
  };

  const removeAttachment = (index: number) => {
    setFormData(prev => {
      const newAttachments = (prev.details.attachments || []).filter((_, i) => i !== index);
      return {
        ...prev,
        details: {
          ...prev.details,
          attachments: newAttachments,
          attachment: newAttachments[0]?.url || '',
          attachment_name: newAttachments[0]?.name || ''
        }
      };
    });
  };

  const handleNext = () => {
    setError(null);
    if (formRef.current && !formRef.current.reportValidity()) {
      return;
    }
    if (validateStep()) {
      setStep(prev => Math.min(prev + 1, 11));
    }
  };

  const handleBack = () => {
    setError(null);
    setStep(prev => Math.max(prev - 1, 1));
  };

  const validateStep = () => {
    setError(null);
    setFieldErrors({});
    const newFieldErrors: { [key: string]: string } = {};

    if (step === 1) {
      let hasError = false;
      if (!formData.title) {
        newFieldErrors.title = 'POR FAVOR, INFORME O TÍTULO DA ORDEM.';
        hasError = true;
      } else {
        const isDuplicate = orders.some(o => 
          o.id !== editingOrder?.id && 
          o.title.toUpperCase() === formData.title.toUpperCase()
        );
        if (isDuplicate) {
          newFieldErrors.title = 'TÍTULO JÁ CADASTRADO EM OUTRA ORDEM';
          hasError = true;
        }
      }
      if (!formData.client_id) {
        newFieldErrors.client_id = 'POR FAVOR, SELECIONE UM CLIENTE.';
        hasError = true;
      }
      if (!formData.details.delivery_date) {
        newFieldErrors.delivery_date = 'POR FAVOR, INFORME A DATA DE ENTREGA.';
        hasError = true;
      }
      
      if (hasError) {
        setFieldErrors(newFieldErrors);
        setError('POR FAVOR, PREENCHA TODOS OS CAMPOS OBRIGATÓRIOS.');
        return false;
      }
      
      const entry = new Date(formData.details.entry_date);
      const delivery = new Date(formData.details.delivery_date);
      
      if (delivery < entry) {
        newFieldErrors.delivery_date = 'A DATA DE ENTREGA NÃO PODE SER ANTERIOR À DATA DE ENTRADA.';
        setFieldErrors(newFieldErrors);
        setError('A DATA DE ENTREGA NÃO PODE SER ANTERIOR À DATA DE ENTRADA.');
        return false;
      }
    }

    // Steps 3-11 are mostly checkboxes, but custom items must have names
    const keys = [
      '', '', 'impression_3d', 'cuts_folds', 'welds', 'rough_finish', 
      'painting', 'final_finish', 'lighting', 'accessories', 'gluing'
    ];
    const key = keys[step - 1];
    if (key) {
      const custom = customItems[key];
      if (custom.some(item => !item.trim())) {
        setError('POR FAVOR, INFORME O NOME DE TODOS OS ITENS PERSONALIZADOS ADICIONADOS.');
        return false;
      }
    }
    return true;
  };

  const toggleItem = (key: keyof OrderDetails, itemName: string) => {
    setError(null);
    const currentItems = (formData.details[key] as any).items as ProductionItem[];
    const isSelected = currentItems.some(i => i.name === itemName);
    
    const newItems = isSelected
      ? currentItems.filter(i => i.name !== itemName)
      : [...currentItems, { name: itemName, quantity: 1 }];
    
    setFormData(prev => ({
      ...prev,
      details: {
        ...prev.details,
        [key]: {
          ...(prev.details[key] as any),
          items: newItems
        }
      }
    }));
  };

  const updateItemQuantity = (key: keyof OrderDetails, itemName: string, quantity: number) => {
    const currentItems = (formData.details[key] as any).items as ProductionItem[];
    const newItems = currentItems.map(i => 
      i.name === itemName ? { ...i, quantity: Math.max(0, quantity) } : i
    );

    setFormData(prev => ({
      ...prev,
      details: {
        ...prev.details,
        [key]: {
          ...(prev.details[key] as any),
          items: newItems
        }
      }
    }));
  };

  const syncItems = (key: string, customList: string[]) => {
    // Get current predefined options for this key
    const stepConfigs: { [key: number]: { key: keyof OrderDetails, options: string[] } } = {
      3: { key: 'impression_3d', options: IMPRESSION_OPTIONS },
      4: { key: 'cuts_folds', options: CUTS_FOLDS_OPTIONS },
      5: { key: 'welds', options: WELDS_OPTIONS },
      6: { key: 'rough_finish', options: ROUGH_FINISH_OPTIONS },
      7: { key: 'painting', options: PAINTING_OPTIONS },
      8: { key: 'final_finish', options: FINAL_FINISH_OPTIONS },
      9: { key: 'lighting', options: LIGHTING_OPTIONS },
      10: { key: 'accessories', options: ACCESSORIES_OPTIONS },
      11: { key: 'gluing', options: GLUING_OPTIONS },
    };

    const config = Object.values(stepConfigs).find(c => c.key === key);
    if (!config) return;

    const currentItems = (formData.details[config.key] as any).items as ProductionItem[];
    const upperOptions = config.options.map(o => o.toUpperCase());
    
    // Keep only predefined items that were already selected
    const predefinedSelected = currentItems.filter(item => 
      config.options.includes(item.name) || upperOptions.includes(item.name.toUpperCase())
    );

    // Filter out any predefined items from the custom list to avoid duplicates
    const actualCustomNames = customList.filter(name => 
      name.trim() !== '' && !upperOptions.includes(name.toUpperCase())
    );

    // Merge: keep existing quantities for custom items if they already existed
    const newCustomItems = actualCustomNames.map(name => {
      const existing = currentItems.find(i => i.name.toUpperCase() === name.toUpperCase());
      return existing || { name: name.toUpperCase(), quantity: 1 };
    });

    const newItems = [...predefinedSelected, ...newCustomItems];

    setFormData(prev => ({
      ...prev,
      details: {
        ...prev.details,
        [key]: {
          ...(prev.details[config.key] as any),
          items: newItems
        }
      }
    }));
  };

  const addCustomItem = (key: string) => {
    setError(null);
    setCustomItems(prev => ({
      ...prev,
      [key]: [...prev[key], '']
    }));
  };

  const updateCustomItem = (key: string, index: number, value: string) => {
    const newCustom = [...customItems[key]];
    newCustom[index] = value.toUpperCase();
    setCustomItems(prev => ({ ...prev, [key]: newCustom }));
    syncItems(key, newCustom);
  };

  const removeCustomItem = (key: string, index: number) => {
    setError(null);
    const newCustom = customItems[key].filter((_, i) => i !== index);
    setCustomItems(prev => ({ ...prev, [key]: newCustom }));
    syncItems(key, newCustom);
  };

  const handleServiceEntryChange = (entryId: string) => {
    const entry = serviceEntries.find(e => e.id.toString() === entryId);
    if (entry) {
      setFormData(prev => ({
        ...prev,
        service_entry_id: entryId,
        title: entry.obra.toUpperCase(),
        client_id: entry.client_id.toString()
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        service_entry_id: ''
      }));
    }
  };

  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <div className="space-y-4">
            <Select
              label="Vincular Entrada de Serviço (Opcional)"
              icon={<Briefcase size={18} />}
              value={formData.service_entry_id}
              onChange={e => handleServiceEntryChange(e.target.value)}
              options={[
                { value: '', label: 'NÃO VINCULAR' },
                ...serviceEntries.map(e => ({ value: e.id.toString(), label: `${e.obra} - ${e.client_name}`.toUpperCase() }))
              ]}
            />
            <Input
              label="Título da Ordem"
              icon={<Type size={18} />}
              required
              value={formData.title}
              onChange={e => setFormData({...formData, title: e.target.value.toUpperCase()})}
              error={fieldErrors.title}
            />

            <Select
              label="Cliente"
              icon={<User size={18} />}
              required
              value={formData.client_id}
              onChange={e => setFormData({...formData, client_id: e.target.value})}
              options={[
                { value: '', label: 'SELECIONE O CLIENTE' },
                ...clients.map(c => ({ value: c.id.toString(), label: (c.tipo_cliente === 'PF' ? c.name : c.razao_social).toUpperCase() }))
              ]}
              error={fieldErrors.client_id}
            />

            <div className="grid grid-cols-2 gap-4">
              <Input
                label="DATA DE ENTRADA"
                icon={<Calendar size={18} />}
                type="date"
                required
                value={formData.details.entry_date}
                onChange={e => setFormData({...formData, details: {...formData.details, entry_date: e.target.value}})}
                error={fieldErrors.entry_date}
              />
              <Input
                label="DATA DE ENTREGA"
                icon={<Calendar size={18} />}
                type="date"
                required
                value={formData.details.delivery_date}
                onChange={e => setFormData({...formData, details: {...formData.details, delivery_date: e.target.value}})}
                error={fieldErrors.delivery_date}
              />
            </div>

            <TextArea
              label="DESCRIÇÃO"
              icon={<FileText size={14} />}
              required
              value={formData.description}
              onChange={(e: any) => setFormData({...formData, description: e.target.value.toUpperCase()})}
              error={fieldErrors.description}
            />

            <div className="space-y-4">
              <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest ml-1">
                Anexos do Projeto (Opcional)
              </label>
              
              <div 
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={cn(
                  "w-full py-8 border-2 border-dashed rounded-3xl transition-all flex flex-col items-center justify-center gap-2 cursor-pointer group",
                  isDragging 
                    ? "border-zinc-900 bg-zinc-50 dark:border-zinc-100 dark:bg-zinc-800/50" 
                    : "border-zinc-200 dark:border-zinc-800 hover:border-zinc-400 dark:hover:border-zinc-600"
                )}
              >
                <input 
                  type="file" 
                  ref={fileInputRef}
                  className="hidden" 
                  multiple
                  onChange={handleFileChange}
                />
                
                {isUploading ? (
                  <>
                    <Loader2 size={32} className="animate-spin text-zinc-400" />
                    <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Enviando arquivos...</span>
                  </>
                ) : (
                  <>
                    <div className="w-12 h-12 rounded-2xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-500 group-hover:scale-110 group-hover:bg-zinc-900 group-hover:text-white dark:group-hover:bg-zinc-100 dark:group-hover:text-zinc-900 transition-all">
                      <Upload size={24} />
                    </div>
                    <div className="text-center">
                      <span className="block text-[10px] font-bold uppercase tracking-widest text-zinc-900 dark:text-zinc-100">
                        Arraste ou clique para anexar
                      </span>
                      <span className="block text-[9px] font-medium text-zinc-400 uppercase mt-1">
                        Aceita múltiplos arquivos e formatos
                      </span>
                    </div>
                  </>
                )}
              </div>

              {formData.details.attachments && formData.details.attachments.length > 0 && (
                <div className="space-y-2">
                  {formData.details.attachments.map((file, idx) => (
                    <div key={idx} className="flex items-center justify-between p-3 bg-zinc-50 dark:bg-zinc-800/50 rounded-2xl border border-zinc-100 dark:border-zinc-700/50 animate-in fade-in slide-in-from-top-1">
                      <div className="flex items-center gap-3 overflow-hidden">
                        <div className="p-2 bg-white dark:bg-zinc-900 rounded-lg shadow-sm border border-zinc-100 dark:border-zinc-800">
                          <Paperclip size={14} className="text-zinc-500" />
                        </div>
                        <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100 truncate uppercase">
                          {file.name}
                        </span>
                      </div>
                      <button 
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          removeAttachment(idx);
                        }}
                        className="p-2 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-xl transition-colors"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        );
      case 2:
        return (
          <div className="space-y-6">
            <div className="space-y-3">
              <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest ml-1">
                Status Kanban (Selecione 1) <span className="text-rose-500 ml-0.5">*</span>
              </label>
              <div className="grid grid-cols-1 gap-2">
                {KANBAN_COLUMNS.map(col => (
                  <label key={col} className={cn(
                    "flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all",
                    formData.status === col 
                      ? "bg-zinc-900 text-white border-zinc-900 dark:bg-zinc-100 dark:text-zinc-900 dark:border-zinc-100" 
                      : "bg-white dark:bg-black border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 hover:border-zinc-400"
                  )}>
                    <input 
                      type="radio" 
                      name="kanban_status"
                      required
                      className="hidden"
                      checked={formData.status === col}
                      onChange={() => setFormData({...formData, status: col as OrderStatus})}
                    />
                    <div className={cn(
                      "w-4 h-4 rounded-full border flex items-center justify-center",
                      formData.status === col ? "border-white dark:border-zinc-900" : "border-zinc-300"
                    )}>
                      {formData.status === col && <div className="w-2 h-2 rounded-full bg-white dark:bg-zinc-900" />}
                    </div>
                    <span className="text-sm font-bold uppercase">{col}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>
        );
      default:
        const stepConfigs: { [key: number]: { key: keyof OrderDetails, title: string, options: string[] } } = {
          3: { key: 'impression_3d', title: 'Impressão', options: IMPRESSION_OPTIONS },
          4: { key: 'cuts_folds', title: 'Cortes / Dobra', options: CUTS_FOLDS_OPTIONS },
          5: { key: 'welds', title: 'Soldas', options: WELDS_OPTIONS },
          6: { key: 'rough_finish', title: 'Acabamento Grosso', options: ROUGH_FINISH_OPTIONS },
          7: { key: 'painting', title: 'Pintura', options: PAINTING_OPTIONS },
          8: { key: 'final_finish', title: 'Acabamento Final', options: FINAL_FINISH_OPTIONS },
          9: { key: 'lighting', title: 'Iluminação', options: LIGHTING_OPTIONS },
          10: { key: 'accessories', title: 'Acessórios', options: ACCESSORIES_OPTIONS },
          11: { key: 'gluing', title: 'Colagem', options: GLUING_OPTIONS },
        };
        const config = stepConfigs[step];
        if (!config) return null;

        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 gap-3">
              {config.options.map(opt => {
                const selectedItem = (formData.details[config.key] as any).items.find((i: any) => i.name === opt);
                const isSelected = !!selectedItem;

                return (
                  <div key={opt} className="flex gap-2">
                    <label className={cn(
                      "flex-1 flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all",
                      isSelected
                        ? "bg-zinc-900 text-white border-zinc-900 dark:bg-zinc-100 dark:text-zinc-900 dark:border-zinc-100" 
                        : "bg-white dark:bg-black border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 hover:border-zinc-400"
                    )}>
                      <input 
                        type="checkbox" 
                        className="hidden"
                        checked={isSelected}
                        onChange={() => toggleItem(config.key, opt)}
                      />
                      <div className={cn(
                        "w-4 h-4 rounded border flex items-center justify-center",
                        isSelected ? "border-white dark:border-zinc-900 bg-white dark:bg-zinc-900" : "border-zinc-300"
                      )}>
                        {isSelected && <Check size={12} className="text-zinc-900 dark:text-zinc-100" />}
                      </div>
                      <span className="text-xs font-bold uppercase">{opt}</span>
                    </label>

                    {isSelected && (
                      <div className="w-24 flex items-center gap-2 bg-zinc-100 dark:bg-zinc-800 rounded-xl px-3 border border-zinc-200 dark:border-zinc-700">
                        <span className="text-[10px] font-bold text-zinc-400 uppercase">Qtd</span>
                        <input 
                          type="number"
                          step="any"
                          min="0"
                          value={selectedItem.quantity}
                          onChange={(e) => updateItemQuantity(config.key, opt, parseFloat(e.target.value) || 0)}
                          className="w-full bg-transparent border-none outline-none text-xs font-bold text-zinc-900 dark:text-zinc-100"
                        />
                      </div>
                    )}
                  </div>
                );
              })}
              
              {customItems[config.key].map((item, idx) => {
                const selectedItem = (formData.details[config.key] as any).items.find((i: any) => i.name === item);
                
                return (
                  <div key={idx} className="flex gap-2">
                    <div className={cn(
                      "flex-1 flex items-center gap-3 p-3 rounded-xl border bg-zinc-900 text-white border-zinc-900 dark:bg-zinc-100 dark:text-zinc-900 dark:border-zinc-100"
                    )}>
                      <Check size={16} />
                      <input 
                        type="text"
                        value={item}
                        onChange={(e) => updateCustomItem(config.key, idx, e.target.value)}
                        className="flex-1 bg-transparent border-none outline-none text-xs font-bold uppercase"
                        autoFocus={!item}
                      />
                    </div>

                    {selectedItem && (
                      <div className="w-24 flex items-center gap-2 bg-zinc-100 dark:bg-zinc-800 rounded-xl px-3 border border-zinc-200 dark:border-zinc-700">
                        <span className="text-[10px] font-bold text-zinc-400 uppercase">Qtd</span>
                        <input 
                          type="number"
                          step="any"
                          min="0"
                          value={selectedItem.quantity}
                          onChange={(e) => updateItemQuantity(config.key, item, parseFloat(e.target.value) || 0)}
                          className="w-full bg-transparent border-none outline-none text-xs font-bold text-zinc-900 dark:text-zinc-100"
                        />
                      </div>
                    )}

                    <button 
                      type="button"
                      onClick={() => removeCustomItem(config.key, idx)}
                      className="p-3 text-rose-500 bg-rose-50 dark:bg-rose-500/10 rounded-xl hover:bg-rose-100 transition-colors"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                );
              })}
            </div>

            <button 
              type="button"
              onClick={() => addCustomItem(config.key)}
              className="w-full py-3 border-2 border-dashed border-zinc-200 dark:border-zinc-800 rounded-xl text-zinc-400 hover:text-zinc-600 hover:border-zinc-400 transition-all flex items-center justify-center gap-2 font-bold text-xs uppercase"
            >
              <Plus size={18} />
              ADICIONAR ITEM PERSONALIZADO
            </button>

            {step === 7 && (
              <Input
                label="DATA DE ENVIO"
                icon={<Calendar size={18} />}
                type="date"
                value={formData.details.painting.shipping_date}
                onChange={e => setFormData({...formData, details: {...formData.details, painting: {...formData.details.painting, shipping_date: e.target.value}}})}
              />
            )}

            {step === 9 && (
              <div className="pt-4 border-t border-zinc-100 dark:border-zinc-800 grid grid-cols-2 gap-4">
                <Input
                  label="TEMPERATURA (K)"
                  icon={<Thermometer size={18} />}
                  type="number"
                  min="0"
                  value={formData.details.lighting.temperature}
                  onChange={e => setFormData({...formData, details: {...formData.details, lighting: {...formData.details.lighting, temperature: e.target.value}}})}
                />
                <Input
                  label="MODELO"
                  icon={<Box size={18} />}
                  type="text"
                  value={formData.details.lighting.model}
                  onChange={e => setFormData({...formData, details: {...formData.details, lighting: {...formData.details.lighting, model: e.target.value.toUpperCase()}}})}
                />
              </div>
            )}
          </div>
        );
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={editingOrder ? 'EDITAR ORDEM DE PRODUÇÃO' : 'NOVA ORDEM DE PRODUÇÃO'} noPadding>
      <div className="flex flex-col h-full overflow-hidden">
        <div className="w-full h-1 bg-zinc-100 dark:bg-zinc-800">
          <motion.div 
            className="h-full bg-zinc-900 dark:bg-zinc-100"
            initial={{ width: 0 }}
            animate={{ width: `${(step / 11) * 100}%` }}
          />
        </div>

        <form ref={formRef} noValidate onSubmit={(e) => e.preventDefault()} className="p-6 space-y-6 overflow-y-auto flex-1">
          {error && <ErrorAlert>{error}</ErrorAlert>}
          <div className="min-h-[300px]">
            <AnimatePresence mode="wait">
              <motion.div
                key={step}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
              >
                <div className="mb-6">
                  <h3 className="text-xl font-bold text-zinc-900 dark:text-zinc-100 uppercase">
                    {step === 1 && 'DADOS INICIAIS'}
                    {step === 2 && 'KANBAN'}
                    {step === 3 && 'IMPRESSÃO'}
                    {step === 4 && 'CORTES / DOBRA'}
                    {step === 5 && 'SOLDAS'}
                    {step === 6 && 'ACABAMENTO GROSSO'}
                    {step === 7 && 'PINTURA'}
                    {step === 8 && 'ACABAMENTO FINAL'}
                    {step === 9 && 'ILUMINAÇÃO'}
                    {step === 10 && 'ACESSÓRIOS'}
                    {step === 11 && 'COLAGEM'}
                  </h3>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 uppercase mt-1">
                    {step === 1 && 'PREENCHA AS INFORMAÇÕES BÁSICAS DA ORDEM.'}
                    {step === 2 && 'SELECIONE O STATUS INICIAL NO QUADRO KANBAN.'}
                    {step > 2 && 'SELECIONE OS ITENS NECESSÁRIOS PARA ESTA ETAPA.'}
                  </p>
                </div>
                {renderStep()}
              </motion.div>
            </AnimatePresence>
          </div>

          <div className="flex justify-between items-center pt-6 border-t border-zinc-100 dark:border-zinc-800">
            <Button 
              variant="ghost"
              onClick={handleBack}
              disabled={step === 1}
              className="flex items-center gap-2"
            >
              <ChevronLeft size={18} />
              ANTERIOR
            </Button>
            
            <div className="flex gap-3">
              {step < 11 ? (
                <Button 
                  variant="primary"
                  onClick={handleNext}
                  className="flex items-center gap-2 px-8"
                >
                  PRÓXIMO
                  <ChevronRight size={18} />
                </Button>
              ) : (
                <Button 
                  variant="primary"
                  onClick={() => {
                    if (validateStep()) {
                      onSubmit(formData);
                      onClose();
                    }
                  }}
                  className="px-10"
                >
                  FINALIZAR E CRIAR ORDEM
                </Button>
              )}
            </div>
          </div>
        </form>
      </div>
    </Modal>
  );
};
