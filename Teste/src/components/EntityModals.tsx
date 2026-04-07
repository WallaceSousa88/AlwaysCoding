import React, { useState, useEffect } from 'react';
import { X, AlertTriangle, User, CreditCard, Calendar, Briefcase, FileText, Phone, Mail, MapPin, Globe } from 'lucide-react';
import { Modal, Input, Button } from './Common';
import { Client, Supplier, Asset } from '../types';
import { maskCPF, maskCNPJ, maskPhone, maskCEP } from '../lib/masks';

interface ClientModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: any) => void;
  editingClient?: Client | null;
  fieldErrors?: Record<string, string>;
}

export const ClientModal = ({ isOpen, onClose, onSubmit, editingClient, fieldErrors = {} }: ClientModalProps) => {
  const [formData, setFormData] = useState<Partial<Client>>({
    tipo_cliente: 'PF',
    name: '',
    cpf: '',
    rg: '',
    data_nascimento: '',
    razao_social: '',
    cnpj: '',
    nome_fantasia: '',
    ie: '',
    im: '',
    contato_responsavel: '',
    endereco: '',
    complemento: '',
    bairro: '',
    cep: '',
    cidade: '',
    telefone1: '',
    telefone2: '',
    email: ''
  });

  useEffect(() => {
    if (editingClient) {
      setFormData(editingClient);
    } else {
      setFormData({
        tipo_cliente: 'PF',
        name: '',
        cpf: '',
        rg: '',
        data_nascimento: '',
        razao_social: '',
        cnpj: '',
        nome_fantasia: '',
        ie: '',
        im: '',
        contato_responsavel: '',
        endereco: '',
        complemento: '',
        bairro: '',
        cep: '',
        cidade: '',
        telefone1: '',
        telefone2: '',
        email: ''
      });
    }
  }, [editingClient, isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={editingClient ? 'EDITAR CLIENTE' : 'NOVO CLIENTE'} noPadding>
      <form onSubmit={handleSubmit} noValidate className="p-6 space-y-4 flex-1 overflow-y-auto custom-scrollbar">
        <div className="flex gap-6 mb-6 p-4 bg-zinc-50 dark:bg-zinc-900/50 rounded-xl border border-zinc-100 dark:border-zinc-800">
          <label className="flex items-center gap-2 cursor-pointer group">
            <input 
              type="radio" 
              name="tipo_cliente" 
              value="PF" 
              checked={formData.tipo_cliente === 'PF'} 
              onChange={() => setFormData({ ...formData, tipo_cliente: 'PF' })}
              className="w-4 h-4 text-zinc-900 focus:ring-zinc-900 border-zinc-300"
            />
            <span className="text-sm font-bold text-zinc-700 dark:text-zinc-300 group-hover:text-zinc-900 dark:group-hover:text-zinc-100 transition-colors uppercase">PESSOA FÍSICA</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer group">
            <input 
              type="radio" 
              name="tipo_cliente" 
              value="PJ" 
              checked={formData.tipo_cliente === 'PJ'} 
              onChange={() => setFormData({ ...formData, tipo_cliente: 'PJ' })}
              className="w-4 h-4 text-zinc-900 focus:ring-zinc-900 border-zinc-300"
            />
            <span className="text-sm font-bold text-zinc-700 dark:text-zinc-300 group-hover:text-zinc-900 dark:group-hover:text-zinc-100 transition-colors uppercase">PESSOA JURÍDICA</span>
          </label>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {formData.tipo_cliente === 'PF' ? (
            <>
              <div className="md:col-span-2">
                <Input 
                  label="NOME COMPLETO" 
                  icon={<User size={18} />}
                  required 
                  value={formData.name} 
                  onChange={(e: any) => setFormData({ ...formData, name: e.target.value.toUpperCase() })}
                  error={fieldErrors.name}
                />
              </div>
              <Input 
                label="CPF" 
                icon={<CreditCard size={18} />}
                required 
                value={formData.cpf} 
                onChange={(e: any) => setFormData({ ...formData, cpf: maskCPF(e.target.value) })}
                error={fieldErrors.cpf}
              />
              <Input 
                label="RG" 
                icon={<FileText size={18} />}
                value={formData.rg} 
                onChange={(e: any) => setFormData({ ...formData, rg: e.target.value })}
              />
              <Input 
                label="DATA NASCIMENTO" 
                icon={<Calendar size={18} />}
                type="date" 
                value={formData.data_nascimento} 
                onChange={(e: any) => setFormData({ ...formData, data_nascimento: e.target.value })}
              />
            </>
          ) : (
            <>
              <div className="md:col-span-2">
                <Input 
                  label="RAZÃO SOCIAL" 
                  icon={<Briefcase size={18} />}
                  required 
                  value={formData.razao_social} 
                  onChange={(e: any) => setFormData({ ...formData, razao_social: e.target.value.toUpperCase() })}
                  error={fieldErrors.razao_social}
                />
              </div>
              <Input 
                label="CNPJ" 
                icon={<CreditCard size={18} />}
                required 
                value={formData.cnpj} 
                onChange={(e: any) => setFormData({ ...formData, cnpj: maskCNPJ(e.target.value) })}
                error={fieldErrors.cnpj}
              />
              <Input 
                label="NOME FANTASIA" 
                icon={<Briefcase size={18} />}
                value={formData.nome_fantasia} 
                onChange={(e: any) => setFormData({ ...formData, nome_fantasia: e.target.value.toUpperCase() })}
              />
              <Input 
                label="RG/IE" 
                icon={<FileText size={18} />}
                value={formData.ie} 
                onChange={(e: any) => setFormData({ ...formData, ie: e.target.value })}
              />
              <Input 
                label="IM" 
                icon={<FileText size={18} />}
                value={formData.im} 
                onChange={(e: any) => setFormData({ ...formData, im: e.target.value })}
              />
              <div className="md:col-span-2">
                <Input 
                  label="CONTATO / RESPONSÁVEL" 
                  icon={<User size={18} />}
                  value={formData.contato_responsavel} 
                  onChange={(e: any) => setFormData({ ...formData, contato_responsavel: e.target.value.toUpperCase() })}
                />
              </div>
            </>
          )}

          <div className="md:col-span-2 pt-2 border-t border-zinc-100 dark:border-zinc-800">
            <Input 
              label="ENDEREÇO" 
              icon={<MapPin size={18} />}
              value={formData.endereco} 
              onChange={(e: any) => setFormData({ ...formData, endereco: e.target.value.toUpperCase() })}
              error={fieldErrors.endereco}
            />
          </div>
          <Input 
            label="COMPLEMENTO" 
            icon={<MapPin size={18} />}
            value={formData.complemento} 
            onChange={(e: any) => setFormData({ ...formData, complemento: e.target.value.toUpperCase() })}
          />
          <Input 
            label="BAIRRO" 
            icon={<MapPin size={18} />}
            value={formData.bairro} 
            onChange={(e: any) => setFormData({ ...formData, bairro: e.target.value.toUpperCase() })}
          />
          <Input 
            label="CEP" 
            icon={<MapPin size={18} />}
            value={formData.cep} 
            onChange={(e: any) => setFormData({ ...formData, cep: maskCEP(e.target.value) })}
          />
          <Input 
            label="CIDADE" 
            icon={<MapPin size={18} />}
            value={formData.cidade} 
            onChange={(e: any) => setFormData({ ...formData, cidade: e.target.value.toUpperCase() })}
          />
          <Input 
            label="TELEFONE 1" 
            icon={<Phone size={18} />}
            value={formData.telefone1} 
            onChange={(e: any) => setFormData({ ...formData, telefone1: maskPhone(e.target.value) })}
            error={fieldErrors.telefone1}
          />
          <Input 
            label="TELEFONE 2" 
            icon={<Phone size={18} />}
            value={formData.telefone2} 
            onChange={(e: any) => setFormData({ ...formData, telefone2: maskPhone(e.target.value) })}
          />
          <div className="md:col-span-2">
            <Input 
              label="EMAIL" 
              icon={<Mail size={18} />}
              type="email" 
              value={formData.email} 
              onChange={(e: any) => setFormData({ ...formData, email: e.target.value.toLowerCase() })}
              error={fieldErrors.email}
            />
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-6 border-t border-zinc-100 dark:border-zinc-800">
          <button type="button" onClick={onClose} className="px-6 py-2 text-sm font-bold text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100 transition-colors uppercase">
            CANCELAR
          </button>
          <Button type="submit">
            {editingClient ? 'ATUALIZAR' : 'SALVAR'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};

interface SupplierModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: any) => void;
  editingSupplier?: Supplier | null;
  fieldErrors?: Record<string, string>;
}

export const SupplierModal = ({ isOpen, onClose, onSubmit, editingSupplier, fieldErrors = {} }: SupplierModalProps) => {
  const [formData, setFormData] = useState<Partial<Supplier>>({
    tipo: 'PF',
    name: '',
    cpf: '',
    rg: '',
    data_nascimento: '',
    razao_social: '',
    cnpj: '',
    nome_fantasia: '',
    ie: '',
    im: '',
    contato_responsavel: '',
    endereco: '',
    complemento: '',
    bairro: '',
    cep: '',
    cidade: '',
    telefone1: '',
    telefone2: '',
    email: '',
    website: ''
  });

  useEffect(() => {
    if (editingSupplier) {
      setFormData(editingSupplier);
    } else {
      setFormData({
        tipo: 'PF',
        name: '',
        cpf: '',
        rg: '',
        data_nascimento: '',
        razao_social: '',
        cnpj: '',
        nome_fantasia: '',
        ie: '',
        im: '',
        contato_responsavel: '',
        endereco: '',
        complemento: '',
        bairro: '',
        cep: '',
        cidade: '',
        telefone1: '',
        telefone2: '',
        email: '',
        website: ''
      });
    }
  }, [editingSupplier, isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={editingSupplier ? 'EDITAR FORNECEDOR' : 'NOVO FORNECEDOR'} noPadding>
      <form onSubmit={handleSubmit} noValidate className="p-6 space-y-4 flex-1 overflow-y-auto custom-scrollbar">
        <div className="flex gap-6 mb-6 p-4 bg-zinc-50 dark:bg-zinc-900/50 rounded-xl border border-zinc-100 dark:border-zinc-800">
          <label className="flex items-center gap-2 cursor-pointer group">
            <input 
              type="radio" 
              name="tipo" 
              value="PF" 
              checked={formData.tipo === 'PF'} 
              onChange={() => setFormData({ ...formData, tipo: 'PF' })}
              className="w-4 h-4 text-zinc-900 focus:ring-zinc-900 border-zinc-300"
            />
            <span className="text-sm font-bold text-zinc-700 dark:text-zinc-300 group-hover:text-zinc-900 dark:group-hover:text-zinc-100 transition-colors uppercase">PESSOA FÍSICA</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer group">
            <input 
              type="radio" 
              name="tipo" 
              value="PJ" 
              checked={formData.tipo === 'PJ'} 
              onChange={() => setFormData({ ...formData, tipo: 'PJ' })}
              className="w-4 h-4 text-zinc-900 focus:ring-zinc-900 border-zinc-300"
            />
            <span className="text-sm font-bold text-zinc-700 dark:text-zinc-300 group-hover:text-zinc-900 dark:group-hover:text-zinc-100 transition-colors uppercase">PESSOA JURÍDICA</span>
          </label>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {formData.tipo === 'PF' ? (
            <>
              <div className="md:col-span-2">
                <Input 
                  label="NOME COMPLETO" 
                  icon={<User size={18} />}
                  required 
                  value={formData.name} 
                  onChange={(e: any) => setFormData({ ...formData, name: e.target.value.toUpperCase() })}
                  error={fieldErrors.name}
                />
              </div>
              <Input 
                label="CPF" 
                icon={<CreditCard size={18} />}
                required 
                value={formData.cpf} 
                onChange={(e: any) => setFormData({ ...formData, cpf: maskCPF(e.target.value) })}
                error={fieldErrors.cpf}
              />
              <Input 
                label="RG" 
                icon={<FileText size={18} />}
                value={formData.rg} 
                onChange={(e: any) => setFormData({ ...formData, rg: e.target.value })}
              />
              <Input 
                label="DATA NASCIMENTO" 
                icon={<Calendar size={18} />}
                type="date" 
                value={formData.data_nascimento} 
                onChange={(e: any) => setFormData({ ...formData, data_nascimento: e.target.value })}
              />
            </>
          ) : (
            <>
              <div className="md:col-span-2">
                <Input 
                  label="RAZÃO SOCIAL" 
                  icon={<Briefcase size={18} />}
                  required 
                  value={formData.razao_social} 
                  onChange={(e: any) => setFormData({ ...formData, razao_social: e.target.value.toUpperCase() })}
                  error={fieldErrors.razao_social}
                />
              </div>
              <Input 
                label="CNPJ" 
                icon={<CreditCard size={18} />}
                required 
                value={formData.cnpj} 
                onChange={(e: any) => setFormData({ ...formData, cnpj: maskCNPJ(e.target.value) })}
                error={fieldErrors.cnpj}
              />
              <Input 
                label="NOME FANTASIA" 
                icon={<Briefcase size={18} />}
                value={formData.nome_fantasia} 
                onChange={(e: any) => setFormData({ ...formData, nome_fantasia: e.target.value.toUpperCase() })}
              />
              <Input 
                label="RG/IE" 
                icon={<FileText size={18} />}
                value={formData.ie} 
                onChange={(e: any) => setFormData({ ...formData, ie: e.target.value })}
              />
              <Input 
                label="IM" 
                icon={<FileText size={18} />}
                value={formData.im} 
                onChange={(e: any) => setFormData({ ...formData, im: e.target.value })}
              />
              <div className="md:col-span-2">
                <Input 
                  label="CONTATO / RESPONSÁVEL" 
                  icon={<User size={18} />}
                  value={formData.contato_responsavel} 
                  onChange={(e: any) => setFormData({ ...formData, contato_responsavel: e.target.value.toUpperCase() })}
                />
              </div>
            </>
          )}

          <div className="md:col-span-2 pt-2 border-t border-zinc-100 dark:border-zinc-800">
            <Input 
              label="ENDEREÇO" 
              icon={<MapPin size={18} />}
              required
              value={formData.endereco} 
              onChange={(e: any) => setFormData({ ...formData, endereco: e.target.value.toUpperCase() })}
              error={fieldErrors.endereco}
            />
          </div>
          <Input 
            label="COMPLEMENTO" 
            icon={<MapPin size={18} />}
            value={formData.complemento} 
            onChange={(e: any) => setFormData({ ...formData, complemento: e.target.value.toUpperCase() })}
          />
          <Input 
            label="BAIRRO" 
            icon={<MapPin size={18} />}
            value={formData.bairro} 
            onChange={(e: any) => setFormData({ ...formData, bairro: e.target.value.toUpperCase() })}
          />
          <Input 
            label="CEP" 
            icon={<MapPin size={18} />}
            value={formData.cep} 
            onChange={(e: any) => setFormData({ ...formData, cep: maskCEP(e.target.value) })}
          />
          <Input 
            label="CIDADE" 
            icon={<MapPin size={18} />}
            value={formData.cidade} 
            onChange={(e: any) => setFormData({ ...formData, cidade: e.target.value.toUpperCase() })}
          />
          <Input 
            label="TELEFONE 1" 
            icon={<Phone size={18} />}
            required
            value={formData.telefone1} 
            onChange={(e: any) => setFormData({ ...formData, telefone1: maskPhone(e.target.value) })}
            error={fieldErrors.telefone1}
          />
          <Input 
            label="TELEFONE 2" 
            icon={<Phone size={18} />}
            value={formData.telefone2} 
            onChange={(e: any) => setFormData({ ...formData, telefone2: maskPhone(e.target.value) })}
          />
          <Input 
            label="EMAIL" 
            icon={<Mail size={18} />}
            required
            type="email" 
            value={formData.email} 
            onChange={(e: any) => setFormData({ ...formData, email: e.target.value.toLowerCase() })}
            error={fieldErrors.email}
          />
          <Input 
            label="WEBSITE" 
            icon={<Globe size={18} />}
            value={formData.website} 
            onChange={(e: any) => setFormData({ ...formData, website: e.target.value.toLowerCase() })}
          />
        </div>

        <div className="flex justify-end gap-3 pt-6 border-t border-zinc-100 dark:border-zinc-800">
          <button type="button" onClick={onClose} className="px-6 py-2 text-sm font-bold text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100 transition-colors uppercase">
            CANCELAR
          </button>
          <Button type="submit">
            {editingSupplier ? 'ATUALIZAR' : 'SALVAR'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};

