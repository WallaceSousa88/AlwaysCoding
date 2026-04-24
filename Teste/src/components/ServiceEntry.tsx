import React, { useState, useMemo } from 'react';
import { 
  Settings, 
  ChevronUp, 
  ChevronDown, 
  Edit, 
  Trash2, 
  Plus,
  Search,
  FileText,
  User,
  MapPin,
  DollarSign,
  Briefcase,
  Building2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { ServiceEntry as ServiceEntryType, Client } from '../types';
import { Card, cn, Input, Select, Button, Modal, ConfirmModal, TextArea } from './Common';
import { maskCurrency, parseCurrency } from '../lib/masks';
import { GenericList } from './GenericList';
import { exportGenericToCSV, exportGenericToPDF } from '../services/exportService';

interface ServiceEntryProps {
  serviceEntries: ServiceEntryType[];
  clients: Client[];
  isAdmin?: boolean;
  currentUserId?: string;
  onAdd: (data: any) => Promise<void>;
  onUpdate: (id: string | number, data: any) => Promise<void>;
  onDelete: (id: string | number) => Promise<void>;
  onMenuClick?: (e: React.MouseEvent, id: string | number) => void;
  isModalOpen: boolean;
  setIsModalOpen: (open: boolean) => void;
  editingEntry: ServiceEntryType | null;
  setEditingEntry: (entry: ServiceEntryType | null) => void;
}

export const ServiceEntry = ({ 
  serviceEntries, 
  clients, 
  isAdmin = false,
  currentUserId,
  onAdd,
  onUpdate,
  onDelete,
  onMenuClick,
  isModalOpen,
  setIsModalOpen,
  editingEntry,
  setEditingEntry
}: ServiceEntryProps) => {
  const filteredEntries = useMemo(() => {
    if (isAdmin) return serviceEntries;
    return serviceEntries.filter(entry => entry.created_by === currentUserId);
  }, [serviceEntries, isAdmin, currentUserId]);

  const handleOpenModal = (entry?: ServiceEntryType) => {
    setEditingEntry(entry || null);
    setIsModalOpen(true);
  };

  const handleSave = async (data: any) => {
    if (editingEntry) {
      await onUpdate(editingEntry.id, data);
    } else {
      await onAdd(data);
    }
    setIsModalOpen(false);
  };

  return (
    <div className="space-y-6">
      <GenericList 
        title="ENTRADAS DE SERVIÇO"
        hideTitle={true}
        items={filteredEntries}
        columns={[
          { key: 'id', label: 'ID', mono: true },
          { 
            key: 'date', 
            label: 'DATA',
            render: (val) => {
              try {
                const d = new Date(val);
                if (isNaN(d.getTime())) return '-';
                return d.toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo' });
              } catch (e) {
                return '-';
              }
            }
          },
          { key: 'client_name', label: 'CLIENTE' },
          { key: 'obra', label: 'OBRA' },
          { 
            key: 'local', 
            label: 'LOCAL',
            render: (val) => (
              <span className={cn(
                "px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider",
                val === 'Sky 1' ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400" : "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400"
              )}>
                {val}
              </span>
            )
          },
          { 
            key: 'valor', 
            label: 'VALOR',
            render: (val) => (
              <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400">
                R$ {val.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </span>
            )
          }
        ]}
        onAdd={() => handleOpenModal()}
        addButtonLabel="NOVA ENTRADA DE SERVIÇO"
        onItemClick={(entry) => handleOpenModal(entry)}
        showActions={true}
        onMenuClick={onMenuClick}
      />

      <ServiceEntryModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleSave}
        editingEntry={editingEntry}
        clients={clients}
      />
    </div>
  );
};

interface ServiceEntryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: any) => Promise<void>;
  editingEntry: ServiceEntryType | null;
  clients: Client[];
}

const PRODUCT_OPTIONS: any = {
  'ADESIVO': {
    sub: ['LEITOSO', 'TRANSPARENTE', 'JATEADO', 'CALANDRADO', 'LEITOSO BLACKOUT'],
    variants: ['FOSCO', 'BRILHO', 'JATEADO/LAMINADO'],
    fields: ['altura', 'largura']
  },
  'LONA': {
    sub: ['LEITOSO', 'TRANSPARENTE', 'JATEADO', 'CALANDRADO', 'LEITOSO BLACKOUT'],
    variants: ['FOSCO', 'BRILHO', 'JATEADO/LAMINADO'],
    fields: ['altura', 'largura']
  },
  'PAINEL REVESTIMENTO': {
    sub: ['MDF', 'ACM', 'CHAPA', 'TELA', 'VIDRO'],
    fields: ['altura', 'largura', 'profundidade']
  },
  'LETRA CAIXA': {
    sub: ['AÇO GALVANIZADO', 'AÇO INOX', 'IMPRESSÃO 3D', 'PVC EXPANDIDO', 'ACRÍLICO', 'MDF'],
    fields: ['altura', 'largura', 'profundidade']
  },
  'PLACA': {
    sub: ['ILUMINADA', 'SEM ILUMINAÇÃO'],
    dependentSub: {
      'ILUMINADA': ['CHAPA AÇO', 'ACRÍLICO', 'ACM', 'LONA'],
      'SEM ILUMINAÇÃO': ['CHAPA AÇO', 'ACRÍLICO', 'ACM', 'MDF', 'PS', 'PVC']
    },
    fields: ['altura', 'largura', 'profundidade']
  },
  'PAINEL DE LED': {
    fields: ['altura', 'largura']
  }
};

export const ServiceEntryModal = ({ isOpen, onClose, onSubmit, editingEntry, clients }: ServiceEntryModalProps) => {
  const [formData, setFormData] = useState({
    client_id: '',
    obra: '',
    local: 'Sky 1' as 'Sky 1' | 'Sky 2',
    valor: '',
    agencia: '',
    product_category: '',
    product_subcategory: '',
    product_variant: '',
    altura: '',
    largura: '',
    profundidade: '',
    observacao: ''
  });

  React.useEffect(() => {
    if (editingEntry) {
      setFormData({
        client_id: editingEntry.client_id.toString(),
        obra: editingEntry.obra,
        local: editingEntry.local,
        valor: maskCurrency(editingEntry.valor.toString().replace('.', ',')),
        agencia: editingEntry.agencia || '',
        product_category: editingEntry.product_category || '',
        product_subcategory: editingEntry.product_subcategory || '',
        product_variant: editingEntry.product_variant || '',
        altura: editingEntry.altura || '',
        largura: editingEntry.largura || '',
        profundidade: editingEntry.profundidade || '',
        observacao: editingEntry.observacao || ''
      });
    } else {
      setFormData({
        client_id: '',
        obra: '',
        local: 'Sky 1',
        valor: '',
        agencia: '',
        product_category: '',
        product_subcategory: '',
        product_variant: '',
        altura: '',
        largura: '',
        profundidade: '',
        observacao: ''
      });
    }
  }, [editingEntry, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const client = clients.find(c => c.id.toString() === formData.client_id);
    const data = {
      ...formData,
      client_name: client ? (client.razao_social || client.name) : '',
      valor: parseCurrency(formData.valor)
    };
    await onSubmit(data);
  };

  const selectedCategory = PRODUCT_OPTIONS[formData.product_category];

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={onClose} 
      title={editingEntry ? 'EDITAR ENTRADA DE SERVIÇO' : 'NOVA ENTRADA DE SERVIÇO'}
    >
      <form onSubmit={handleSubmit} className="p-6 space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <Select 
            label="CLIENTE" 
            icon={<User size={18} />}
            required
            value={formData.client_id}
            onChange={(e: any) => setFormData({ ...formData, client_id: e.target.value })}
            options={[
              { value: '', label: 'SELECIONE UM CLIENTE' },
              ...clients.map(c => ({ value: c.id.toString(), label: (c.razao_social || c.name).toUpperCase() }))
            ]}
          />
          <Input 
            label="OBRA" 
            icon={<Briefcase size={18} />}
            required
            value={formData.obra}
            onChange={(e: any) => setFormData({ ...formData, obra: e.target.value.toUpperCase() })}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Select 
            label="LOCAL" 
            icon={<MapPin size={18} />}
            required
            value={formData.local}
            onChange={(e: any) => setFormData({ ...formData, local: e.target.value as any })}
            options={[
              { value: 'Sky 1', label: 'SKY 1' },
              { value: 'Sky 2', label: 'SKY 2' }
            ]}
          />
          <Input 
            label="VALOR (R$)" 
            icon={<DollarSign size={18} />}
            required
            value={formData.valor}
            onChange={(e: any) => setFormData({ ...formData, valor: maskCurrency(e.target.value) })}
          />
        </div>

        <Input 
          label="AGÊNCIA (OPCIONAL)" 
          icon={<Building2 size={18} />}
          value={formData.agencia}
          onChange={(e: any) => setFormData({ ...formData, agencia: e.target.value.toUpperCase() })}
        />

        <div className="pt-4 border-t border-zinc-100 dark:border-zinc-800">
          <h4 className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-4">Detalhes do Produto</h4>
          
          <Select 
            label="PRODUTO"
            value={formData.product_category}
            onChange={(e: any) => setFormData({ 
              ...formData, 
              product_category: e.target.value,
              product_subcategory: '',
              product_variant: '',
              altura: '',
              largura: '',
              profundidade: ''
            })}
            options={[
              { value: '', label: 'SELECIONE UM PRODUTO' },
              { value: 'ADESIVO', label: 'ADESIVO' },
              { value: 'LONA', label: 'LONA' },
              { value: 'PAINEL REVESTIMENTO', label: 'PAINEL REVESTIMENTO' },
              { value: 'LETRA CAIXA', label: 'LETRA CAIXA' },
              { value: 'PLACA', label: 'PLACA' },
              { value: 'PAINEL DE LED', label: 'PAINEL DE LED' }
            ]}
          />

          {selectedCategory?.sub && (
            <div className="mt-4">
              <Select 
                label="OPÇÃO"
                value={formData.product_subcategory}
                onChange={(e: any) => setFormData({ 
                  ...formData, 
                  product_subcategory: e.target.value,
                  product_variant: ''
                })}
                options={[
                  { value: '', label: 'SELECIONE UMA OPÇÃO' },
                  ...selectedCategory.sub.map((s: string) => ({ value: s, label: s }))
                ]}
              />
            </div>
          )}

          {formData.product_category === 'PLACA' && formData.product_subcategory && (
            <div className="mt-4">
              <Select 
                label="MATERIAL"
                value={formData.product_variant}
                onChange={(e: any) => setFormData({ ...formData, product_variant: e.target.value })}
                options={[
                  { value: '', label: 'SELECIONE O MATERIAL' },
                  ...(selectedCategory.dependentSub[formData.product_subcategory] || []).map((s: string) => ({ value: s, label: s }))
                ]}
              />
            </div>
          )}

          {(formData.product_category === 'ADESIVO' || formData.product_category === 'LONA') && formData.product_subcategory && (
            <div className="mt-4">
              <Select 
                label="ACABAMENTO"
                value={formData.product_variant}
                onChange={(e: any) => setFormData({ ...formData, product_variant: e.target.value })}
                options={[
                  { value: '', label: 'SELECIONE O ACABAMENTO' },
                  ...selectedCategory.variants.map((v: string) => ({ value: v, label: v }))
                ]}
              />
            </div>
          )}

          {selectedCategory?.fields && (
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
              {selectedCategory.fields.includes('altura') && (
                <Input 
                  label="ALTURA (m)"
                  placeholder="0,00"
                  value={formData.altura}
                  onChange={(e: any) => setFormData({ ...formData, altura: e.target.value })}
                />
              )}
              {selectedCategory.fields.includes('largura') && (
                <Input 
                  label="LARGURA (m)"
                  placeholder="0,00"
                  value={formData.largura}
                  onChange={(e: any) => setFormData({ ...formData, largura: e.target.value })}
                />
              )}
              {selectedCategory.fields.includes('profundidade') && (
                <Input 
                  label="PROFUNDIDADE (m)"
                  placeholder="0,00"
                  value={formData.profundidade}
                  onChange={(e: any) => setFormData({ ...formData, profundidade: e.target.value })}
                />
              )}
            </div>
          )}

          <div className="mt-4">
            <TextArea 
              label="OBSERVAÇÃO"
              value={formData.observacao}
              onChange={(e: any) => setFormData({ ...formData, observacao: e.target.value.toUpperCase() })}
              rows={3}
            />
          </div>
        </div>
        
        <div className="flex justify-end gap-3 pt-4 border-t border-zinc-100 dark:border-zinc-800">
          <button 
            type="button"
            onClick={onClose}
            className="px-6 py-2 text-sm font-bold text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100 transition-colors uppercase"
          >
            CANCELAR
          </button>
          <Button type="submit">
            {editingEntry ? 'ATUALIZAR' : 'SALVAR'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
