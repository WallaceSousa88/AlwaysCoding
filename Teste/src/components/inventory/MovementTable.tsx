import React from 'react';
import { ArrowDownLeft, ArrowUpRight, FileText } from 'lucide-react';
import { Movement } from '../../types';
import { cn } from '../Common';

interface MovementTableProps {
  movements: Movement[];
}

export const MovementTable = ({ movements }: MovementTableProps) => {
  return (
    <table className="w-full text-left border-collapse">
      <thead>
        <tr className="bg-zinc-50/50 dark:bg-zinc-800/50">
          <th className="px-6 py-3 text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Data</th>
          <th className="px-6 py-3 text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Tipo</th>
          <th className="px-6 py-3 text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Produto</th>
          <th className="px-6 py-3 text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Quantidade</th>
          <th className="px-6 py-3 text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Origem/Destino</th>
          <th className="px-6 py-3 text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Documento/Motivo</th>
        </tr>
      </thead>
      <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
        {movements.map((m) => (
          <tr key={m.id} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-800/50 transition-colors">
            <td className="px-6 py-4 text-sm text-zinc-500 dark:text-zinc-400">
              {new Date(m.date).toLocaleString('pt-BR', { 
                day: '2-digit', 
                month: '2-digit', 
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              })}
            </td>
            <td className="px-6 py-4">
              <span className={cn(
                "inline-flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-bold uppercase",
                m.type === 'IN' 
                  ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400" 
                  : "bg-rose-100 text-rose-700 dark:bg-rose-500/20 dark:text-rose-400"
              )}>
                {m.type === 'IN' ? <ArrowDownLeft size={10} /> : <ArrowUpRight size={10} />}
                {m.type === 'IN' ? 'ENTRADA' : 'SAÍDA'}
              </span>
            </td>
            <td className="px-6 py-4 text-sm font-medium text-zinc-900 dark:text-zinc-100">{m.product_name}</td>
            <td className="px-6 py-4 text-sm text-zinc-900 dark:text-zinc-100 font-bold">{m.quantity}</td>
            <td className="px-6 py-4 text-sm text-zinc-500 dark:text-zinc-400">
              {m.type === 'IN' ? (m.supplier_name || m.location || '-') : (m.destination || '-')}
            </td>
            <td className="px-6 py-4 text-sm text-zinc-500 dark:text-zinc-400">
              {m.type === 'IN' ? (m.doc_number || '-') : (m.reason || '-')}
            </td>
          </tr>
        ))}
        {movements.length === 0 && (
          <tr>
            <td colSpan={6} className="px-6 py-8 text-center text-zinc-400 dark:text-zinc-500 text-sm italic uppercase font-bold">
              NENHUMA MOVIMENTAÇÃO ENCONTRADA.
            </td>
          </tr>
        )}
      </tbody>
    </table>
  );
};
