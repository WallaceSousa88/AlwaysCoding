import React, { useState, useMemo } from 'react';
import { Search, ChevronRight, Plus, Edit, Trash2, CheckCircle2, User } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Order, OrderStatus, OrderDetails, ServiceEntry } from '../types';
import { KANBAN_COLUMNS } from '../constants';
import { cn, SearchBar, Card } from './Common';
import { Briefcase, MapPin, DollarSign, Calendar } from 'lucide-react';

interface KanbanProps {
  orders: Order[];
  serviceEntries: ServiceEntry[];
  onUpdateStatus: (id: string | number, status: OrderStatus) => void;
  onEdit: (order: Order) => void;
  onDelete: (id: string | number) => void;
  onAdd: () => void;
  onItemClick: (order: Order) => void;
  onError?: (message: string) => void;
  isAdmin?: boolean;
}

export const Kanban = ({ orders, serviceEntries, onUpdateStatus, onEdit, onDelete, onAdd, onItemClick, onError, isAdmin = false }: KanbanProps) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [draggedOrderId, setDraggedOrderId] = useState<string | number | null>(null);
  const [draggedOverColumn, setDraggedOverColumn] = useState<string | null>(null);

  const getOrderProgress = (order: Order) => {
    if (!order.details) return 0;
    try {
      let details: OrderDetails = typeof order.details === 'string' ? JSON.parse(order.details) : order.details;
      
      // Handle potential double-encoding
      if (typeof details === 'string') {
        details = JSON.parse(details);
      }

      const sections = [
        'impression_3d', 'cuts_folds', 'welds', 'rough_finish', 
        'painting', 'final_finish', 'lighting', 'accessories', 'gluing'
      ];
      
      let totalItems = 0;
      sections.forEach(section => {
        totalItems += (details[section as keyof OrderDetails] as any)?.items?.length || 0;
      });

      if (totalItems === 0) return 0;
      
      const completedCount = details.completed_items?.length || 0;
      return Math.min(Math.round((completedCount / totalItems) * 100), 100);
    } catch (e) {
      return 0;
    }
  };

  const validateStatusChange = (orderId: string | number, newStatus: OrderStatus) => {
    const order = orders.find(o => o.id === orderId);
    if (!order) return false;

    const statusIndex = KANBAN_COLUMNS.indexOf(newStatus);
    const finalizationIndex = KANBAN_COLUMNS.indexOf('REVISÃO PRODUÇÃO');

    if (statusIndex >= finalizationIndex) {
      const progress = getOrderProgress(order);
      if (progress < 100) {
        if (onError) {
          onError(`BLOQUEADO: Não é possível mover para "${newStatus}". Todos os itens do Processo de Produção devem estar concluídos (100%).`);
        }
        return false;
      }
    }
    return true;
  };

  const filteredOrders = useMemo(() => {
    return orders.filter(o => 
      Object.values(o).some(val => 
        val !== null && val !== undefined && val.toString().toLowerCase().includes(searchTerm.toLowerCase())
      )
    );
  }, [orders, searchTerm]);

  const filteredServiceEntries = useMemo(() => {
    // Only show service entries that are NOT linked to any order
    const linkedEntryIds = orders.map(o => o.service_entry_id?.toString()).filter(Boolean);
    return serviceEntries.filter(entry => 
      !linkedEntryIds.includes(entry.id.toString()) &&
      (entry.obra.toLowerCase().includes(searchTerm.toLowerCase()) || 
       entry.client_name?.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  }, [serviceEntries, orders, searchTerm]);

  const handleDragStart = (e: React.DragEvent, orderId: string | number) => {
    setDraggedOrderId(orderId);
    e.dataTransfer.setData('orderId', orderId.toString());
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent, col: string) => {
    e.preventDefault();
    setDraggedOverColumn(col);
  };

  const handleDragLeave = () => {
    setDraggedOverColumn(null);
  };

  const handleDrop = (e: React.DragEvent, status: OrderStatus) => {
    e.preventDefault();
    setDraggedOverColumn(null);
    
    const orderId = draggedOrderId || e.dataTransfer.getData('orderId');
    if (orderId) {
      if (validateStatusChange(orderId, status)) {
        onUpdateStatus(orderId, status);
      }
    }
    setDraggedOrderId(null);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <SearchBar 
          value={searchTerm}
          onChange={setSearchTerm}
        />
        <button 
          onClick={onAdd}
          className="flex items-center gap-2 px-4 py-2 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 text-sm font-bold rounded-xl hover:bg-zinc-800 dark:hover:bg-zinc-200 transition-all shadow-lg shadow-zinc-900/10 uppercase"
        >
          <Plus size={18} />
          NOVA ORDEM DE PRODUÇÃO
        </button>
      </div>
      <div className="flex gap-4 overflow-x-auto pb-4 min-h-[calc(100vh-16rem)] items-start">
        {/* Service Entries Column */}
        <div className="flex-shrink-0 w-64 lg:w-72 flex flex-col gap-3 self-stretch">
          <div className="flex items-center justify-between px-1">
            <h3 className="text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-widest">ENTRADA DE SERVIÇO</h3>
            <span className="bg-zinc-200 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 text-[10px] font-bold px-2 py-0.5 rounded-full">
              {filteredServiceEntries.length}
            </span>
          </div>
          <div className="flex-1 rounded-xl p-2 space-y-3 border bg-zinc-100/50 dark:bg-zinc-900/50 border-zinc-200/50 dark:border-zinc-800/50 min-h-[150px]">
            {filteredServiceEntries.map((entry) => (
              <motion.div
                key={entry.id}
                whileHover={{ scale: 1.02 }}
                className="bg-white dark:bg-zinc-900 p-4 rounded-lg shadow-sm border border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700 transition-all"
              >
                <div className="flex justify-between items-start mb-2">
                  <span className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase">ENTRADA #{entry.id}</span>
                </div>
                <h4 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 mb-1 uppercase">{entry.obra}</h4>
                <div className="space-y-2 mt-3">
                  <div className="flex items-center gap-2 text-[10px] text-zinc-500 uppercase">
                    <User size={12} />
                    {entry.client_name}
                  </div>
                  <div className="flex items-center gap-2 text-[10px] text-zinc-500 uppercase">
                    <MapPin size={12} />
                    {entry.local}
                  </div>
                  <div className="flex items-center justify-end pt-2 border-t border-zinc-50 dark:border-zinc-800">
                    <div className="flex items-center gap-1 text-zinc-400 text-[9px]">
                      <Calendar size={12} />
                      {(() => {
                        try {
                          const d = new Date(entry.date);
                          if (isNaN(d.getTime())) return '-';
                          return d.toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo' });
                        } catch (e) {
                          return '-';
                        }
                      })()}
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {KANBAN_COLUMNS.map((col) => (
          <div 
            key={col} 
            className="flex-shrink-0 w-64 lg:w-72 flex flex-col gap-3 self-stretch"
            onDragOver={(e) => handleDragOver(e, col)}
            onDragLeave={(e) => {
              // Only clear if we are actually leaving the column container
              const rect = e.currentTarget.getBoundingClientRect();
              if (
                e.clientX <= rect.left ||
                e.clientX >= rect.right ||
                e.clientY <= rect.top ||
                e.clientY >= rect.bottom
              ) {
                handleDragLeave();
              }
            }}
            onDrop={(e) => handleDrop(e, col as OrderStatus)}
          >
            <div className="flex items-center justify-between px-1">
              <h3 className="text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-widest">{col}</h3>
              <span className="bg-zinc-200 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 text-[10px] font-bold px-2 py-0.5 rounded-full">
                {filteredOrders.filter(o => o.status === col).length}
              </span>
            </div>
            <div className={cn(
              "flex-1 rounded-xl p-2 space-y-3 border transition-colors duration-200 min-h-[150px]",
              draggedOverColumn === col 
                ? "bg-zinc-200/50 dark:bg-zinc-800/50 border-zinc-400 dark:border-zinc-500 border-dashed" 
                : "bg-zinc-100/50 dark:bg-zinc-900/50 border-zinc-200/50 dark:border-zinc-800/50"
            )}>
              {filteredOrders.filter(o => o.status === col).map((order) => (
                <motion.div
                  key={order.id}
                  draggable
                  onDragStart={(e) => handleDragStart(e, order.id)}
                  onDragEnd={() => {
                    setDraggedOrderId(null);
                    setDraggedOverColumn(null);
                  }}
                  onClick={() => onItemClick(order)}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98, cursor: 'grabbing' }}
                  className={cn(
                    "bg-white dark:bg-zinc-900 p-4 rounded-lg shadow-sm border border-zinc-200 dark:border-zinc-800 cursor-pointer hover:border-zinc-300 dark:hover:border-zinc-700 transition-all",
                    draggedOrderId === order.id && "opacity-50 border-dashed border-zinc-400"
                  )}
                >
                <div className="flex justify-between items-start mb-2">
                  <span className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase">#{order.id}</span>
                </div>
                <h4 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 mb-1 uppercase">{order.title}</h4>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-3 line-clamp-2 uppercase">{order.description || 'SEM DESCRIÇÃO'}</p>
                
                {/* Progress Indicator */}
                <div className="mb-4 space-y-1.5">
                  <div className="flex justify-between items-center">
                    <span className="text-[9px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-tighter">PROGRESSO DE PRODUÇÃO</span>
                    <span className={cn(
                      "text-[10px] font-bold",
                      getOrderProgress(order) === 100 ? "text-emerald-500" : "text-zinc-900 dark:text-zinc-100"
                    )}>
                      {getOrderProgress(order)}%
                    </span>
                  </div>
                  <div className="h-1.5 w-full bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${getOrderProgress(order)}%` }}
                      className={cn(
                        "h-full transition-all duration-500",
                        getOrderProgress(order) === 100 ? "bg-emerald-500" : "bg-zinc-900 dark:bg-zinc-100"
                      )}
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-zinc-50 dark:border-zinc-800">
                  <div className="flex items-center gap-1.5">
                    <div className="w-5 h-5 rounded-full bg-zinc-900 dark:bg-zinc-100 flex items-center justify-center text-[8px] text-white dark:text-zinc-900 font-bold">
                      {order.client_name?.charAt(0) || 'C'}
                    </div>
                    <span className="text-[10px] font-medium text-zinc-600 dark:text-zinc-400 uppercase">{order.client_name}</span>
                  </div>
                  <div className="flex gap-1">
                    {KANBAN_COLUMNS.indexOf(col) < KANBAN_COLUMNS.length - 1 && (
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          const nextStatus = KANBAN_COLUMNS[KANBAN_COLUMNS.indexOf(col) + 1];
                          if (validateStatusChange(order.id, nextStatus)) {
                            onUpdateStatus(order.id, nextStatus);
                          }
                        }}
                        className="p-1 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100"
                      >
                        <ChevronRight size={14} />
                      </button>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      ))}
      </div>
    </div>
  );
};
