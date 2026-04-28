import React, { useEffect, useState } from 'react';
import { X, Edit, Trash2, ClipboardList, User, Calendar, CheckCircle2, Info, Check, AlertTriangle, Box, Download, FileSymlink, ShieldCheck, Mail, Phone, MapPin, Paperclip } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Order, OrderDetails, ProductionItem, ServiceEntry, Client } from '../types';
import { apiService } from '../services/apiService';
import { Modal, ConfirmModal, Button, cn } from './Common';

interface OrderDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  order: Order | null;
  serviceEntries: ServiceEntry[];
  isAdmin?: boolean;
  onEdit: (order: Order) => void;
  onDelete: (id: string | number) => void;
  onUpdate?: () => void;
}

export const OrderDetailModal = ({ 
  isOpen, 
  onClose, 
  order, 
  serviceEntries,
  isAdmin = false,
  onEdit,
  onDelete,
  onUpdate
}: OrderDetailModalProps) => {
  const [confirmingItem, setConfirmingItem] = useState<{ section: string, item: string } | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [clientData, setClientData] = useState<Client | null>(null);

  useEffect(() => {
    if (isOpen && order?.client_id) {
      const fetchClient = async () => {
        try {
          const client = await apiService.getClient(order.client_id);
          setClientData(client || null);
        } catch (error) {
          console.error("Error fetching client", error);
        }
      };
      fetchClient();
    } else {
      setClientData(null);
    }
  }, [isOpen, order?.client_id]);

  if (!order) return null;

  const linkedEntry = order.service_entry_id 
    ? serviceEntries.find(e => e.id.toString() === order.service_entry_id?.toString()) 
    : null;

  let details: OrderDetails | null = null;
  try {
    if (order.details) {
      details = typeof order.details === 'string' 
        ? JSON.parse(order.details) 
        : order.details;
      
      // Handle potential double-encoding
      if (typeof details === 'string') {
        details = JSON.parse(details);
      }
    }
  } catch (e) {
    console.error("Error parsing order details", e);
  }

  const handleCheckItem = async (section: string, itemName: string) => {
    if (!details || !order) return;
    
    setIsUpdating(true);
    try {
      const itemKey = `${section}|${itemName}`;
      const completedItems = details.completed_items || [];
      
      if (completedItems.includes(itemKey)) return;

      const updatedDetails: OrderDetails = {
        ...details,
        completed_items: [...completedItems, itemKey]
      };

      await apiService.updateOrder(order.id, {
        ...order,
        details: updatedDetails as any // Pass as object, backend handles stringification
      });

      if (onUpdate) onUpdate();
      setConfirmingItem(null);
    } catch (error) {
      console.error("Error updating checklist", error);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDelete = async () => {
    if (!order) return;
    try {
      await onDelete(order.id);
      onClose();
    } catch (error) {
      console.error("Error deleting order", error);
    }
  };

  const renderSection = (title: string, items: ProductionItem[], extra?: React.ReactNode) => {
    if (items.length === 0 && !extra) return null;
    return (
      <div className="space-y-3">
        <div className="flex items-center gap-2 px-1">
          <div className="w-1 h-4 bg-zinc-900 dark:bg-zinc-100 rounded-full" />
          <h4 className="text-[10px] font-bold text-zinc-900 dark:text-zinc-100 uppercase tracking-widest">{title}</h4>
        </div>
        <div className="grid grid-cols-1 gap-1.5 ml-3">
          {items.map((itemObj, idx) => {
            const item = typeof itemObj === 'string' ? itemObj : itemObj.name;
            const quantity = typeof itemObj === 'string' ? null : itemObj.quantity;
            const itemKey = `${title}|${item}`;
            const isCompleted = details?.completed_items?.includes(itemKey);

            return (
              <div key={idx} className="flex items-center justify-between group pr-2">
                <div className="flex items-center gap-3">
                  <button
                    disabled={isCompleted || isUpdating}
                    onClick={() => !isCompleted && setConfirmingItem({ section: title, item })}
                    className={cn(
                      "w-5 h-5 rounded-md flex items-center justify-center transition-all duration-200",
                      isCompleted 
                        ? "bg-emerald-500 text-white cursor-default" 
                        : "bg-zinc-100 dark:bg-zinc-800 text-transparent hover:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700 border border-zinc-200 dark:border-zinc-700"
                    )}
                  >
                    <Check size={12} strokeWidth={3} className={cn(isCompleted ? "opacity-100" : "opacity-0 group-hover:opacity-100")} />
                  </button>
                  <span className={cn(
                    "text-xs font-bold uppercase tracking-tight transition-colors",
                    isCompleted ? "text-zinc-400 dark:text-zinc-500 line-through" : "text-zinc-700 dark:text-zinc-300"
                  )}>
                    {item}
                  </span>
                </div>
                {quantity !== null && (
                  <span className="text-[10px] font-bold text-zinc-400 bg-zinc-100 dark:bg-zinc-800 px-1.5 py-0.5 rounded">
                    {quantity.toString().replace('.', ',')} UN
                  </span>
                )}
              </div>
            );
          })}
          {items.length === 0 && <span className="text-[10px] text-zinc-400 italic ml-8">NENHUM ITEM SELECIONADO</span>}
          {extra && <div className="mt-2 ml-8">{extra}</div>}
        </div>
      </div>
    );
  };

  return (
    <>
      <Modal isOpen={isOpen} onClose={onClose} title="Checklist de Produção">
        <div className="space-y-8">
          {/* Header Actions */}
          <div className="flex items-center justify-end gap-2 -mt-4 mb-4">
            <Button 
              variant="ghost" 
              onClick={() => onEdit(order)}
              className="h-9 w-9 p-0 flex items-center justify-center"
              title="Editar"
            >
              <Edit size={18} />
            </Button>
            {isAdmin && (
              <Button 
                variant="ghost" 
                onClick={handleDelete}
                className="h-9 w-9 p-0 flex items-center justify-center text-rose-600 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-500/10"
                title="Excluir"
              >
                <Trash2 size={18} />
              </Button>
            )}
          </div>

          {/* Title & Status */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex-1">
              <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 uppercase leading-tight">{order.title}</h1>
              <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1 uppercase">{order.description || 'Sem descrição.'}</p>
            </div>
            <div className="flex flex-col items-end">
              <span className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest mb-1">Status Atual</span>
              <span className="px-3 py-1 bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 rounded-full text-xs font-bold uppercase">
                {order.status}
              </span>
            </div>
          </div>

          {/* Linked Service Entry Product Details */}
          {linkedEntry && linkedEntry.product_category && (
            <div className="p-5 bg-zinc-900 text-white rounded-3xl space-y-4 shadow-xl">
              <div className="flex items-center gap-2 border-b border-white/10 pb-3">
                <Box size={18} className="text-zinc-400" />
                <h3 className="text-xs font-bold uppercase tracking-[0.2em]">Especificações da Obra</h3>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div>
                  <p className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest">Produto</p>
                  <p className="text-sm font-bold uppercase mt-1">{linkedEntry.product_category}</p>
                </div>
                {linkedEntry.product_subcategory && (
                  <div>
                    <p className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest">Tipo / Opção</p>
                    <p className="text-sm font-bold uppercase mt-1">{linkedEntry.product_subcategory}</p>
                  </div>
                )}
                {linkedEntry.product_variant && (
                  <div>
                    <p className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest">Material / Acabamento</p>
                    <p className="text-sm font-bold uppercase mt-1">{linkedEntry.product_variant}</p>
                  </div>
                )}
                {linkedEntry.agencia && (
                  <div>
                    <p className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest">Agência</p>
                    <p className="text-sm font-bold uppercase mt-1">{linkedEntry.agencia}</p>
                  </div>
                )}
              </div>

              {(linkedEntry.altura || linkedEntry.largura || linkedEntry.profundidade) && (
                <div className="grid grid-cols-3 gap-4 pt-2">
                  {linkedEntry.altura && (
                    <div className="bg-white/5 p-3 rounded-2xl border border-white/5">
                      <p className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest">Altura</p>
                      <p className="text-sm font-bold mt-0.5">{linkedEntry.altura}m</p>
                    </div>
                  )}
                  {linkedEntry.largura && (
                    <div className="bg-white/5 p-3 rounded-2xl border border-white/5">
                      <p className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest">Largura</p>
                      <p className="text-sm font-bold mt-0.5">{linkedEntry.largura}m</p>
                    </div>
                  )}
                  {linkedEntry.profundidade && (
                    <div className="bg-white/5 p-3 rounded-2xl border border-white/5">
                      <p className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest">Profundidade</p>
                      <p className="text-sm font-bold mt-0.5">{linkedEntry.profundidade}m</p>
                    </div>
                  )}
                </div>
              )}

              {linkedEntry.observacao && (
                <div className="bg-white/5 p-4 rounded-2xl border border-white/5">
                  <p className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest mb-1">Observações Técnicas</p>
                  <p className="text-xs font-medium leading-relaxed italic">{linkedEntry.observacao}</p>
                </div>
              )}
            </div>
          )}

          {/* Info Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="p-5 bg-zinc-50 dark:bg-zinc-800/50 rounded-3xl border border-zinc-100 dark:border-zinc-800 space-y-4 shadow-sm">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest flex items-center gap-2">
                  <User size={14} /> Informações do Cliente
                </h3>
                {clientData?.tipo_cliente && (
                   <span className="text-[10px] font-bold px-2 py-0.5 bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 rounded-md">
                     {clientData.tipo_cliente}
                   </span>
                )}
              </div>
              
              <div className="space-y-3">
                <div>
                  <p className="text-sm font-bold text-zinc-900 dark:text-zinc-100 uppercase leading-tight">
                    {clientData?.name || clientData?.razao_social || order.client_name || 'NÃO INFORMADO'}
                  </p>
                  {clientData?.nome_fantasia && (
                    <p className="text-[10px] font-bold text-zinc-500 uppercase mt-0.5">{clientData.nome_fantasia}</p>
                  )}
                </div>

                <div className="grid grid-cols-1 gap-2 pt-1">
                  {(clientData?.cnpj || clientData?.cpf) && (
                    <div className="flex items-center gap-2 text-zinc-600 dark:text-zinc-400">
                      <ShieldCheck size={14} className="text-zinc-400" />
                      <span className="text-[11px] font-medium uppercase">
                        {clientData.tipo_cliente === 'PJ' ? `CNPJ: ${clientData.cnpj}` : `CPF: ${clientData.cpf}`}
                      </span>
                    </div>
                  )}
                  
                  {clientData?.telefone1 && (
                    <div className="flex items-center gap-2 text-zinc-600 dark:text-zinc-400">
                      <Phone size={14} className="text-zinc-400" />
                      <span className="text-[11px] font-medium">{clientData.telefone1}</span>
                    </div>
                  )}

                  {clientData?.email && (
                    <div className="flex items-center gap-2 text-zinc-600 dark:text-zinc-400">
                      <Mail size={14} className="text-zinc-400" />
                      <span className="text-[11px] font-medium lowercase truncate max-w-[200px]">{clientData.email}</span>
                    </div>
                  )}

                  {(clientData?.cidade || clientData?.endereco) && (
                    <div className="flex items-start gap-2 text-zinc-600 dark:text-zinc-400">
                      <MapPin size={14} className="text-zinc-400 mt-0.5 flex-shrink-0" />
                      <span className="text-[11px] font-medium uppercase leading-tight">
                        {clientData.endereco && `${clientData.endereco}, `}
                        {clientData.bairro && `${clientData.bairro} - `}
                        {clientData.cidade || 'CIDADE NÃO INFORMADA'}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="p-4 bg-zinc-50 dark:bg-zinc-800/50 rounded-2xl border border-zinc-100 dark:border-zinc-800 space-y-4">
              <h3 className="text-xs font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest flex items-center gap-2">
                <Calendar size={14} /> Datas e Prazos
              </h3>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <p className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase">ENTRADA</p>
                  <p className="text-xs font-medium text-zinc-900 dark:text-zinc-100">
                    {details?.entry_date ? new Date(details.entry_date).toLocaleDateString('pt-BR') : '-'}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase">ENTREGA</p>
                  <p className="text-xs font-medium text-emerald-600 dark:text-emerald-400 font-bold">
                    {details?.delivery_date ? new Date(details.delivery_date).toLocaleDateString('pt-BR') : '-'}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase">CRIAÇÃO</p>
                  <p className="text-xs font-medium text-zinc-900 dark:text-zinc-100">
                    {order.created_at ? new Date(order.created_at).toLocaleDateString('pt-BR') : '-'}
                  </p>
                </div>
              </div>
            </div>
          </div>
          
          {/* Products Section */}
          {details?.products && details.products.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-xs font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest flex items-center gap-2">
                <Box size={14} /> PRODUTOS SELECIONADOS
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {details.products.map((p, idx) => (
                  <div key={idx} className="flex items-center justify-between p-3 bg-zinc-50 dark:bg-zinc-800/50 rounded-xl border border-zinc-100 dark:border-zinc-800">
                    <span className="text-xs font-bold text-zinc-700 dark:text-zinc-300 uppercase">{p.name}</span>
                    <span className="text-[10px] font-bold text-zinc-400 bg-white dark:bg-zinc-900 px-2 py-1 rounded-md border border-zinc-100 dark:border-zinc-800">
                      {p.quantity} UN
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Technical Details - Production Checklist */}
          {details && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-widest flex items-center gap-2">
                  <Info size={14} /> PROCESSO DE PRODUÇÃO
                </h3>
                <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase bg-emerald-50 dark:bg-emerald-500/10 px-2 py-1 rounded-md">
                  Itens Selecionados
                </span>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-10 p-6 bg-white dark:bg-zinc-900/50 border border-zinc-100 dark:border-zinc-800 rounded-3xl shadow-sm">
                {renderSection('1. IMPRESSÃO 3D', details.impression_3d?.items || [])}
                {renderSection('2. CORTES / DOBRA', details.cuts_folds?.items || [])}
                {renderSection('3. SOLDAS', details.welds?.items || [])}
                {renderSection('4. ACABAMENTO GROSSO', details.rough_finish?.items || [])}
                {renderSection('5. PINTURA', details.painting?.items || [], details.painting?.shipping_date && (
                  <div className="mt-2 p-2 bg-zinc-100 dark:bg-zinc-800 rounded-lg">
                    <p className="text-[9px] font-bold text-zinc-400 uppercase">DATA DE ENVIO</p>
                    <p className="text-[10px] font-bold text-zinc-900 dark:text-zinc-100">{new Date(details.painting.shipping_date).toLocaleDateString('pt-BR')}</p>
                  </div>
                ))}
                {renderSection('6. ACABAMENTO FINAL', details.final_finish?.items || [])}
                {renderSection('7. ILUMINAÇÃO', details.lighting?.items || [], (details.lighting?.temperature || details.lighting?.model) && (
                  <div className="mt-2 p-2 bg-zinc-100 dark:bg-zinc-800 rounded-lg grid grid-cols-2 gap-2">
                    {details.lighting.temperature && <div><p className="text-[9px] font-bold text-zinc-400 uppercase">TEMP</p><p className="text-[10px] font-bold">{details.lighting.temperature}K</p></div>}
                    {details.lighting.model && <div><p className="text-[9px] font-bold text-zinc-400 uppercase">MODELO</p><p className="text-[10px] font-bold uppercase truncate">{details.lighting.model}</p></div>}
                  </div>
                ))}
                {renderSection('8. ACESSÓRIOS', details.accessories?.items || [])}
                {renderSection('9. COLAGEM', details.gluing?.items || [])}
              </div>
            </div>
          )}

          {/* Progress Bar */}
          <div className="space-y-4 pt-4">
            <h3 className="text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-widest">STATUS DA PRODUÇÃO</h3>
            <div className="relative h-3 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
              <motion.div 
                className="absolute inset-y-0 left-0 bg-zinc-900 dark:bg-zinc-100"
                initial={{ width: 0 }}
                animate={{ 
                  width: order.status === 'CONCLUIDO' ? '100%' :
                         order.status === 'REVISÃO INSTALAÇÃO' ? '85%' : 
                         order.status === 'INSTALAÇÃO' ? '72%' : 
                         order.status === 'REVISÃO PRODUÇÃO' ? '58%' : 
                         order.status === 'PRODUÇÃO' ? '44%' : 
                         order.status === 'SEPARAÇÃO DE MATERIAL' ? '30%' : '15%' 
                }}
                transition={{ duration: 0.8, ease: "easeOut" }}
              />
            </div>
            <div className="flex justify-between text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-tighter">
              <span>INÍCIO</span>
              <span>PRODUÇÃO</span>
              <span>CONCLUÍDO</span>
            </div>
          </div>

          {/* Project Attachments Download */}
          {((details?.attachments && details.attachments.length > 0) || details?.attachment) && (
            <div className="pt-8 border-t border-zinc-100 dark:border-zinc-800 space-y-4">
              <h3 className="text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-widest flex items-center gap-2 px-1">
                <FileSymlink size={14} /> Arquivos e Documentos do Projeto
              </h3>
              
              <div className="grid grid-cols-1 gap-3">
                {(details?.attachments || (details?.attachment ? [{ url: details.attachment, name: details.attachment_name || 'Projeto Digital' }] : [])).map((file: any, idx: number) => (
                  <div key={idx} className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 bg-gradient-to-br from-zinc-50 to-white dark:from-zinc-800/30 dark:to-zinc-900 border border-zinc-200 dark:border-zinc-700/50 rounded-3xl group transition-all hover:border-zinc-400 dark:hover:border-zinc-600 shadow-sm">
                    <div className="flex items-center gap-4 flex-1 min-w-0">
                      <div className="w-10 h-10 rounded-2xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-500 shadow-sm">
                        <Paperclip size={18} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold text-zinc-900 dark:text-zinc-100 uppercase truncate">
                          {file.name || `Arquivo ${idx + 1}`}
                        </p>
                      </div>
                    </div>
                    
                    <a 
                      href={file.url} 
                      download={file.name} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="flex items-center justify-center gap-2 px-6 py-2.5 bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 rounded-2xl text-[10px] font-bold uppercase tracking-widest hover:scale-[1.02] active:scale-[0.98] transition-all shadow-md flex-shrink-0"
                    >
                      <Download size={14} />
                      Baixar
                    </a>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </Modal>

      <ConfirmModal 
        isOpen={!!confirmingItem}
        onClose={() => setConfirmingItem(null)}
        onConfirm={() => handleCheckItem(confirmingItem!.section, confirmingItem!.item)}
        title="CONFIRMAR REVISÃO"
        message={`VOCÊ ESTÁ PRESTES A MARCAR "${confirmingItem?.item}" COMO CONCLUÍDO. ESTA AÇÃO É IRREVERSÍVEL E FICARÁ REGISTRADA NO HISTÓRICO DO SISTEMA.`}
        isLoading={isUpdating}
      />
    </>
  );
};
