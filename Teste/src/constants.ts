import { OrderStatus } from './types';

export const KANBAN_COLUMNS: OrderStatus[] = [
  'ORDENS DE PRODUÇÃO',
  'SEPARAÇÃO DE MATERIAL',
  'PRODUÇÃO',
  'REVISÃO PRODUÇÃO',
  'INSTALAÇÃO',
  'REVISÃO INSTALAÇÃO',
  'CONCLUIDO'
];

export const ROLES = ['Admin', 'Almoxarifado', 'Vendas', 'Instalação'];
