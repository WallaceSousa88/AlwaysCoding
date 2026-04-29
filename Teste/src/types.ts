export type Permission = 'dashboard' | 'kanban' | 'service_entry' | 'production' | 'clients' | 'suppliers' | 'assets' | 'inventory' | 'financial' | 'settings' | 'audit' | 'values';

export interface User {
  id: string | number;
  name: string;
  email: string;
  username?: string;
  password?: string;
  role: string;
  permissions?: Permission[];
}

export interface Product {
  id: string | number;
  name: string;
  category: string;
  unit: string;
  cost_price: number;
  quantity: number;
  min_quantity: number | null;
  photo?: string;
  last_supplier?: string;
}

export interface Client {
  id: string | number;
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
  id: string | number;
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
  id: string | number;
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

export type OrderStatus = 'ENTRADA DE SERVIÇO' | 'ORDENS DE PRODUÇÃO' | 'SEPARAÇÃO DE MATERIAL' | 'PRODUÇÃO' | 'REVISÃO PRODUÇÃO' | 'INSTALAÇÃO' | 'REVISÃO INSTALAÇÃO' | 'CONCLUIDO';

export interface Order {
  id: string | number;
  title: string;
  description: string;
  status: OrderStatus;
  client_id: string | number;
  client_name?: string;
  created_at: string;
  details?: string; // JSON string containing OrderDetails
  service_entry_id?: string | number;
}

export interface ProductionProduct {
  id: string | number;
  name: string;
}

export interface ProductionItem {
  name: string;
  quantity: number;
}

export interface Attachment {
  url: string;
  name: string;
}

export interface OrderDetails {
  entry_date: string;
  delivery_date: string;
  attachments?: Attachment[];
  attachment?: string;
  attachment_name?: string;
  products?: { name: string; quantity: number }[];
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

export interface ServiceEntry {
  id: string | number;
  client_id: string | number;
  client_name?: string;
  obra: string;
  local: 'Sky 1' | 'Sky 2';
  valor: number;
  agencia?: string;
  product_category?: string;
  product_subcategory?: string;
  product_variant?: string;
  altura?: string;
  largura?: string;
  profundidade?: string;
  observacao?: string;
  date: string;
  created_by?: string;
}

export interface Movement {
  id: string | number;
  product_id: string | number;
  product_name?: string;
  type: 'IN' | 'OUT';
  quantity: number;
  date: string;
  supplier_id?: string | number;
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
