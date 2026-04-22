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
  Briefcase
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { ServiceEntry as ServiceEntryType, Client } from '../types';
import { Card, cn, Input, Select, Button, Modal, ConfirmModal } from './Common';
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

export const ServiceEntryModal = ({ isOpen, onClose, onSubmit, editingEntry, clients }: ServiceEntryModalProps) => {
  const [formData, setFormData] = useState({
    client_id: '',
    obra: '',
    local: 'Sky 1' as 'Sky 1' | 'Sky 2',
    valor: ''
  });

  React.useEffect(() => {
    if (editingEntry) {
      setFormData({
        client_id: editingEntry.client_id.toString(),
        obra: editingEntry.obra,
        local: editingEntry.local,
        valor: maskCurrency(editingEntry.valor.toString().replace('.', ','))
      });
    } else {
      setFormData({
        client_id: '',
        obra: '',
        local: 'Sky 1',
        valor: ''
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

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={onClose} 
      title={editingEntry ? 'EDITAR ENTRADA DE SERVIÇO' : 'NOVA ENTRADA DE SERVIÇO'}
    >
      <form onSubmit={handleSubmit} className="p-6 space-y-4">
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
