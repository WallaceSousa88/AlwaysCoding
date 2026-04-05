export type Role = 'Admin' | 'Almoxarifado' | 'Vendas' | 'Instalação';

export interface User {
  id: number;
  name: string;
  email: string;
  role: Role;
}

export interface Product {
  id: number;
  name: string;
  category: string;
  unit: string;
  cost_price: number;
  quantity: number;
  min_quantity: number | null;
  photo?: string;
}

export interface Client {
  id: number;
  tipo_cliente: 'PF' | 'PJ';
  // Pessoa Física
  name: string; // NOME COMPLETO
  cpf?: string;
  rg?: string;
  data_nascimento?: string;
  // Pessoa Jurídica
  razao_social?: string;
  cnpj?: string;
  nome_fantasia?: string;
  ie?: string; // RG/IE
  im?: string;
  contato_responsavel?: string;
  // Common
  endereco?: string;
  complemento?: string;
  bairro?: string;
  cep?: string;
  cidade?: string;
  telefone1?: string;
  telefone2?: string;
  email?: string;
}

export interface Supplier {
  id: number;
  tipo: 'PF' | 'PJ';
  // Pessoa Física
  name?: string; // NOME COMPLETO
  cpf?: string;
  rg?: string;
  data_nascimento?: string;
  // Pessoa Jurídica
  razao_social?: string;
  cnpj?: string;
  nome_fantasia?: string;
  ie?: string; // RG/IE
  im?: string;
  contato_responsavel?: string;
  // Common
  endereco?: string;
  complemento?: string;
  bairro?: string;
  cep?: string;
  cidade?: string;
  telefone1?: string;
  telefone2?: string;
  email?: string;
  website?: string;
}

export interface Asset {
  id: number;
  description: string;
  asset_number: string;
  category: string;
  purchase_date: string;
  purchase_value: number;
  depreciation_type: 'DIARIA' | 'MENSAL' | 'ANUAL';
  depreciation_percentage: number;
  photo?: string;
  status: 'ATIVO' | 'BAIXADO';
  disposal_type?: 'DESCARTE' | 'DOAÇÃO' | 'VENDA' | 'OUTRO';
  disposal_date?: string;
  disposal_value?: number;
}

export type OrderStatus = 'ORDENS DE PRODUÇÃO' | 'SEPARAÇÃO DE MATERIAL' | 'PRODUÇÃO' | 'FINALIZAÇÃO' | 'REVISÃO' | 'CONCLUIDO';

export interface Order {
  id: number;
  title: string;
  description: string;
  status: OrderStatus;
  client_id: number;
  client_name?: string;
  created_at: string;
  details?: string; // JSON string containing OrderDetails
}

export interface ProductionItem {
  name: string;
  quantity: number;
}

export interface OrderDetails {
  entry_date: string;
  delivery_date: string;
  kanban_description?: string;
  completed_items?: string[]; // Array of item names that are finished
  impression_3d: { items: ProductionItem[] };
  cuts_folds: { items: ProductionItem[] };
  welds: { items: ProductionItem[] };
  rough_finish: { items: ProductionItem[] };
  painting: { items: ProductionItem[]; shipping_date?: string };
  final_finish: { items: ProductionItem[] };
  lighting: { items: ProductionItem[]; temperature?: string; model?: string };
  accessories: { items: ProductionItem[] };
  gluing: { items: ProductionItem[] };
}

export interface Movement {
  id: number;
  product_id: number;
  product_name?: string;
  type: 'IN' | 'OUT';
  quantity: number;
  date: string;
  supplier_id?: number;
  supplier_name?: string;
  doc_number?: string;
  issue_date?: string;
  location?: string;
  unit_price?: number;
  reason?: string;
  destination?: string;
  xml?: string;
  invoice_pdf?: string;
}
