import { Product, Client, Supplier, Asset, Order, Movement, OrderStatus } from '../types';

const API_BASE = '/api';

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
    throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
  }
  return response.json();
}

export const apiService = {
  // Stats
  getStats: () => fetch(`${API_BASE}/stats`).then(handleResponse),

  // Products
  getProducts: () => fetch(`${API_BASE}/products`).then(handleResponse<Product[]>),
  addProduct: (formData: FormData) => fetch(`${API_BASE}/products`, {
    method: 'POST',
    body: formData
  }).then(handleResponse<{ id: number }>),
  updateProduct: (id: number, formData: FormData) => fetch(`${API_BASE}/products/${id}`, {
    method: 'PUT',
    body: formData
  }).then(handleResponse<{ success: boolean }>),
  deleteProduct: (id: number) => fetch(`${API_BASE}/products/${id}`, {
    method: 'DELETE'
  }).then(handleResponse<{ success: boolean }>),
  getProductMovements: (id: number) => fetch(`${API_BASE}/products/${id}/movements`).then(handleResponse<Movement[]>),
  importProducts: (csvData: string) => fetch(`${API_BASE}/products/import`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ csvData })
  }).then(handleResponse<{ success: boolean, imported: number, errors: string[] }>),

  // Orders
  getOrders: () => fetch(`${API_BASE}/orders`).then(handleResponse<Order[]>),
  addOrder: (data: Partial<Order>) => fetch(`${API_BASE}/orders`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  }).then(handleResponse<{ id: number }>),
  updateOrder: (id: number, data: Partial<Order>) => fetch(`${API_BASE}/orders/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  }).then(handleResponse<{ success: boolean }>),
  patchOrder: (id: number, data: { status: OrderStatus }) => fetch(`${API_BASE}/orders/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  }).then(handleResponse<{ success: boolean }>),
  deleteOrder: (id: number) => fetch(`${API_BASE}/orders/${id}`, {
    method: 'DELETE'
  }).then(handleResponse<{ success: boolean }>),

  // Clients
  getClients: () => fetch(`${API_BASE}/clients`).then(handleResponse<Client[]>),
  addClient: (data: Partial<Client>) => fetch(`${API_BASE}/clients`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  }).then(handleResponse<{ id: number }>),
  updateClient: (id: number, data: Partial<Client>) => fetch(`${API_BASE}/clients/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  }).then(handleResponse<{ success: boolean }>),
  deleteClient: (id: number) => fetch(`${API_BASE}/clients/${id}`, {
    method: 'DELETE'
  }).then(handleResponse<{ success: boolean }>),

  // Suppliers
  getSuppliers: () => fetch(`${API_BASE}/suppliers`).then(handleResponse<Supplier[]>),
  addSupplier: (data: Partial<Supplier>) => fetch(`${API_BASE}/suppliers`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  }).then(handleResponse<Supplier>),
  updateSupplier: (id: number, data: Partial<Supplier>) => fetch(`${API_BASE}/suppliers/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  }).then(handleResponse<{ success: boolean }>),
  deleteSupplier: (id: number) => fetch(`${API_BASE}/suppliers/${id}`, {
    method: 'DELETE'
  }).then(handleResponse<{ success: boolean }>),

  // Locations
  getLocations: () => fetch(`${API_BASE}/locations`).then(handleResponse<{ id: number, name: string }[]>),
  addLocation: (name: string) => fetch(`${API_BASE}/locations`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name })
  }).then(handleResponse<{ id: number, name: string }>),
  updateLocation: (id: number, name: string) => fetch(`${API_BASE}/locations/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name })
  }).then(handleResponse<{ success: boolean }>),

  // Categories
  getCategories: () => fetch(`${API_BASE}/categories`).then(handleResponse<{ id: number, name: string }[]>),
  addCategory: (name: string) => fetch(`${API_BASE}/categories`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name })
  }).then(handleResponse<{ id: number, name: string }>),
  updateCategory: (id: number, name: string) => fetch(`${API_BASE}/categories/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name })
  }).then(handleResponse<{ success: boolean }>),

  // Units
  getUnits: () => fetch(`${API_BASE}/units`).then(handleResponse<{ id: number, name: string }[]>),
  addUnit: (name: string) => fetch(`${API_BASE}/units`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name })
  }).then(handleResponse<{ id: number, name: string }>),

  // Assets
  getAssets: () => fetch(`${API_BASE}/assets`).then(handleResponse<Asset[]>),
  addAsset: (formData: FormData) => fetch(`${API_BASE}/assets`, {
    method: 'POST',
    body: formData
  }).then(handleResponse<{ id: number }>),
  updateAsset: (id: number, formData: FormData) => fetch(`${API_BASE}/assets/${id}`, {
    method: 'PUT',
    body: formData
  }).then(handleResponse<{ success: boolean }>),
  disposalAsset: (id: number, data: any) => fetch(`${API_BASE}/assets/${id}/disposal`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  }).then(handleResponse<{ success: boolean }>),
  deleteAsset: (id: number) => fetch(`${API_BASE}/assets/${id}`, {
    method: 'DELETE'
  }).then(handleResponse<{ success: boolean }>),

  // Movements
  getMovements: () => fetch(`${API_BASE}/movements`).then(handleResponse<Movement[]>),
  stockIn: (data: any) => fetch(`${API_BASE}/inventory/in`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  }).then(handleResponse<{ success: boolean }>),
  stockOut: (data: any) => fetch(`${API_BASE}/inventory/out`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  }).then(handleResponse<{ success: boolean }>),

  // Financial
  getFinancialEntries: () => fetch(`${API_BASE}/financial/entries`).then(handleResponse<any[]>),

  // Audit Logs
  getAuditLogs: () => fetch(`${API_BASE}/audit-logs`).then(handleResponse<any[]>),

  // Database
  importDatabase: (file: File) => {
    const formData = new FormData();
    formData.append('backup', file);
    return fetch(`${API_BASE}/restore`, {
      method: 'POST',
      body: formData
    }).then(handleResponse<{ success: boolean }>);
  },
};
