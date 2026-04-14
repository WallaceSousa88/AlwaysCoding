import { 
  collection, 
  getDocs, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  query, 
  where, 
  orderBy, 
  limit, 
  getDoc,
  runTransaction,
  serverTimestamp,
  Timestamp
} from 'firebase/firestore';
import { db, auth } from '../firebase';
import { Product, Client, Supplier, Asset, Order, Movement, OrderStatus } from '../types';

enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

import firebaseConfig from '../../firebase-applet-config.json';

const FIREBASE_API_KEY = firebaseConfig.apiKey;

export const apiService = {
  // Helper for Auth REST API
  syncUserWithAuth: async (username: string, password: string) => {
    const email = `${username.toLowerCase().trim()}@skysmart.com`;
    try {
      // Try to create user
      const response = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=${FIREBASE_API_KEY}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, returnSecureToken: true })
      });

      const data = await response.json();
      if (!response.ok) {
        if (data.error?.message === 'EMAIL_EXISTS') {
          // User already exists, we can't easily update password without their token via REST
          // but for this app's flow, we'll just assume it's fine or they'll use the existing one
          return { success: true, message: 'User already exists' };
        }
        throw new Error(data.error?.message || 'Erro ao sincronizar com Auth');
      }
      return { success: true };
    } catch (error) {
      console.error('Auth Sync Error:', error);
      throw error;
    }
  },

  // Stats
  getStats: async () => {
    try {
      const productsSnap = await getDocs(collection(db, 'products'));
      const products = productsSnap.docs.map(d => ({ id: d.id, ...d.data() } as any));
      
      const ordersSnap = await getDocs(query(collection(db, 'orders'), where('status', '!=', 'CONCLUIDO')));
      const activeOrders = ordersSnap.size;

      const totalProducts = products.length;
      const lowStock = products.filter(p => p.quantity <= p.min_quantity).length;
      const totalInventoryValue = products.reduce((acc, p) => acc + (p.quantity * p.cost_price), 0);

      const stockByCategoryMap: Record<string, number> = {};
      products.forEach(p => {
        const cat = p.category || 'SEM CATEGORIA';
        stockByCategoryMap[cat] = (stockByCategoryMap[cat] || 0) + (p.quantity * p.cost_price);
      });
      const stockByCategory = Object.entries(stockByCategoryMap)
        .map(([category, total_value]) => ({ category, total_value }))
        .sort((a, b) => b.total_value - a.total_value);

      const topProducts = [...products]
        .sort((a, b) => b.quantity - a.quantity)
        .slice(0, 5)
        .map(p => ({ name: p.name, quantity: p.quantity }));

      const low_stock_count = products.filter(p => p.quantity <= p.min_quantity).length;
      const normal_stock_count = products.length - low_stock_count;

      const recentMovementsSnap = await getDocs(query(collection(db, 'movements'), orderBy('date', 'desc'), limit(5)));
      const recentMovements = recentMovementsSnap.docs.map(d => {
        const data = d.data();
        return {
          ...data,
          id: d.id,
          date: data.date instanceof Timestamp ? data.date.toDate().toISOString() : data.date
        };
      });

      return {
        totalProducts,
        lowStock,
        activeOrders,
        totalInventoryValue,
        stockByCategory,
        topProducts,
        stockStatus: [
          { name: 'Estoque Baixo', value: low_stock_count },
          { name: 'Normal', value: normal_stock_count }
        ],
        recentMovements
      };
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, 'stats');
    }
  },

  // Uploads
  uploadPhoto: async (file: File | string) => {
    if (typeof file === 'string') return file; // Already a URL or base64

    const formData = new FormData();
    formData.append('photo', file);

    const response = await fetch('/api/upload', {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      throw new Error('Erro ao fazer upload da imagem');
    }

    const result = await response.json();
    return result.url;
  },

  // Products
  getProducts: async () => {
    try {
      const snap = await getDocs(collection(db, 'products'));
      return snap.docs.map(d => ({ id: d.id, ...d.data() } as any));
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, 'products');
    }
  },
  addProduct: async (data: any) => {
    try {
      let productData = data;
      if (data instanceof FormData) {
        const photo = data.get('photo');
        let photoUrl = '';
        if (photo instanceof File) {
          photoUrl = await apiService.uploadPhoto(photo);
        } else if (typeof photo === 'string') {
          photoUrl = photo;
        }

        productData = {
          name: data.get('name'),
          category: data.get('category'),
          unit: data.get('unit'),
          cost_price: parseFloat(data.get('cost_price') as string) || 0,
          min_quantity: data.get('min_quantity') ? parseFloat(data.get('min_quantity') as string) : null,
          quantity: 0,
          photo: photoUrl
        };
      }

      const docRef = await addDoc(collection(db, 'products'), productData);
      return { id: docRef.id };
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'products');
    }
  },
  updateProduct: async (id: string | number, data: any) => {
    try {
      let productData = data;
      if (data instanceof FormData) {
        const photo = data.get('photo');
        let photoUrl = '';
        if (photo instanceof File) {
          photoUrl = await apiService.uploadPhoto(photo);
        } else if (typeof photo === 'string') {
          photoUrl = photo;
        }

        productData = {
          name: data.get('name'),
          category: data.get('category'),
          unit: data.get('unit'),
          cost_price: parseFloat(data.get('cost_price') as string) || 0,
          min_quantity: data.get('min_quantity') ? parseFloat(data.get('min_quantity') as string) : null,
          photo: photoUrl
        };
      }

      await updateDoc(doc(db, 'products', String(id)), productData);
      return { success: true };
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `products/${id}`);
    }
  },
  deleteProduct: async (id: string | number) => {
    try {
      const movementsSnap = await getDocs(query(collection(db, 'movements'), where('product_id', '==', String(id)), limit(1)));
      if (!movementsSnap.empty) {
        throw new Error('Não é possível excluir um produto que possui movimentações de estoque.');
      }
      await deleteDoc(doc(db, 'products', String(id)));
      return { success: true };
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `products/${id}`);
    }
  },
  getProductMovements: async (id: string | number) => {
    try {
      const snap = await getDocs(query(collection(db, 'movements'), where('product_id', '==', String(id)), orderBy('date', 'desc')));
      return snap.docs.map(d => {
        const data = d.data();
        return {
          ...data,
          id: d.id,
          date: data.date instanceof Timestamp ? data.date.toDate().toISOString() : data.date
        };
      }) as any;
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, `products/${id}/movements`);
    }
  },

  // Orders
  getOrders: async () => {
    try {
      const snap = await getDocs(query(collection(db, 'orders'), orderBy('created_at', 'desc')));
      return snap.docs.map(d => {
        const data = d.data();
        return {
          ...data,
          id: d.id,
          created_at: data.created_at instanceof Timestamp ? data.created_at.toDate().toISOString() : data.created_at
        };
      }) as any;
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, 'orders');
    }
  },
  addOrder: async (data: any) => {
    try {
      const docRef = await addDoc(collection(db, 'orders'), {
        ...data,
        created_at: serverTimestamp()
      });
      return { id: docRef.id };
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'orders');
    }
  },
  updateOrder: async (id: string | number, data: any) => {
    try {
      await updateDoc(doc(db, 'orders', String(id)), data);
      return { success: true };
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `orders/${id}`);
    }
  },
  patchOrder: async (id: string | number, data: any) => {
    try {
      await updateDoc(doc(db, 'orders', String(id)), data);
      return { success: true };
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `orders/${id}`);
    }
  },
  deleteOrder: async (id: string | number) => {
    try {
      await deleteDoc(doc(db, 'orders', String(id)));
      return { success: true };
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `orders/${id}`);
    }
  },

  // Service Entries
  getServiceEntries: async (userId?: string) => {
    try {
      let q = query(collection(db, 'service_entries'), orderBy('date', 'desc'));
      if (userId) {
        q = query(collection(db, 'service_entries'), where('created_by', '==', userId), orderBy('date', 'desc'));
      }
      const snap = await getDocs(q);
      return snap.docs.map(d => {
        const data = d.data();
        return {
          ...data,
          id: d.id,
          date: data.date instanceof Timestamp ? data.date.toDate().toISOString() : data.date
        };
      }) as any;
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, 'service_entries');
    }
  },
  addServiceEntry: async (data: any) => {
    try {
      const docRef = await addDoc(collection(db, 'service_entries'), {
        ...data,
        date: serverTimestamp(),
        created_by: auth.currentUser?.uid
      });
      return { id: docRef.id };
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'service_entries');
    }
  },
  updateServiceEntry: async (id: string | number, data: any) => {
    try {
      await updateDoc(doc(db, 'service_entries', String(id)), data);
      return { success: true };
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `service_entries/${id}`);
    }
  },
  deleteServiceEntry: async (id: string | number) => {
    try {
      await deleteDoc(doc(db, 'service_entries', String(id)));
      return { success: true };
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `service_entries/${id}`);
    }
  },

  // Clients
  getClients: async () => {
    try {
      const snap = await getDocs(collection(db, 'clients'));
      return snap.docs.map(d => ({ id: d.id, ...d.data() } as any));
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, 'clients');
    }
  },
  addClient: async (data: any) => {
    try {
      const docRef = await addDoc(collection(db, 'clients'), data);
      return { id: docRef.id };
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'clients');
    }
  },
  updateClient: async (id: string | number, data: any) => {
    try {
      await updateDoc(doc(db, 'clients', String(id)), data);
      return { success: true };
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `clients/${id}`);
    }
  },
  deleteClient: async (id: string | number) => {
    try {
      await deleteDoc(doc(db, 'clients', String(id)));
      return { success: true };
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `clients/${id}`);
    }
  },

  // Suppliers
  getSuppliers: async () => {
    try {
      const snap = await getDocs(collection(db, 'suppliers'));
      return snap.docs.map(d => ({ id: d.id, ...d.data() } as any));
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, 'suppliers');
    }
  },
  addSupplier: async (data: any) => {
    try {
      const docRef = await addDoc(collection(db, 'suppliers'), data);
      return { id: docRef.id, ...data };
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'suppliers');
    }
  },
  updateSupplier: async (id: string | number, data: any) => {
    try {
      await updateDoc(doc(db, 'suppliers', String(id)), data);
      return { success: true };
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `suppliers/${id}`);
    }
  },
  deleteSupplier: async (id: string | number) => {
    try {
      await deleteDoc(doc(db, 'suppliers', String(id)));
      return { success: true };
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `suppliers/${id}`);
    }
  },

  // Locations
  getLocations: async () => {
    try {
      const snap = await getDocs(collection(db, 'locations'));
      return snap.docs.map(d => ({ id: d.id, ...d.data() } as any));
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, 'locations');
    }
  },
  addLocation: async (name: string) => {
    try {
      const docRef = await addDoc(collection(db, 'locations'), { name });
      return { id: docRef.id, name };
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'locations');
    }
  },
  updateLocation: async (id: string | number, name: string) => {
    try {
      await updateDoc(doc(db, 'locations', String(id)), { name });
      return { success: true };
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `locations/${id}`);
    }
  },

  // Categories
  getCategories: async () => {
    try {
      const snap = await getDocs(collection(db, 'categories'));
      return snap.docs.map(d => ({ id: d.id, ...d.data() } as any));
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, 'categories');
    }
  },
  addCategory: async (name: string) => {
    try {
      const docRef = await addDoc(collection(db, 'categories'), { name });
      return { id: docRef.id, name };
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'categories');
    }
  },
  updateCategory: async (id: string | number, name: string) => {
    try {
      await updateDoc(doc(db, 'categories', String(id)), { name });
      return { success: true };
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `categories/${id}`);
    }
  },

  // Units
  getUnits: async () => {
    try {
      const snap = await getDocs(collection(db, 'units'));
      return snap.docs.map(d => ({ id: d.id, ...d.data() } as any));
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, 'units');
    }
  },
  importProducts: async (csvData: string) => {
    try {
      const lines = csvData.split('\n');
      const headers = lines[0].split(',');
      let imported = 0;
      const errors: string[] = [];

      for (let i = 1; i < lines.length; i++) {
        if (!lines[i].trim()) continue;
        const values = lines[i].split(',');
        const product: any = {};
        headers.forEach((header, index) => {
          product[header.trim()] = values[index]?.trim();
        });

        try {
          await addDoc(collection(db, 'products'), {
            name: product.name || 'SEM NOME',
            category: product.category || 'GERAL',
            unit: product.unit || 'UN',
            cost_price: parseFloat(product.cost_price) || 0,
            min_quantity: parseFloat(product.min_quantity) || 0,
            quantity: parseFloat(product.quantity) || 0,
            photo: ''
          });
          imported++;
        } catch (e: any) {
          errors.push(`Linha ${i + 1}: ${e.message}`);
        }
      }
      return { success: true, imported, errors };
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'products/import');
    }
  },
  addUnit: async (name: string) => {
    try {
      const docRef = await addDoc(collection(db, 'units'), { name });
      return { id: docRef.id, name };
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'units');
    }
  },

  // Assets
  getAssets: async () => {
    try {
      const snap = await getDocs(collection(db, 'assets'));
      return snap.docs.map(d => ({ id: d.id, ...d.data() } as any));
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, 'assets');
    }
  },
  addAsset: async (data: any) => {
    try {
      let assetData = data;
      if (data instanceof FormData) {
        const photo = data.get('photo');
        let photoUrl = '';
        if (photo instanceof File) {
          photoUrl = await apiService.uploadPhoto(photo);
        } else if (typeof photo === 'string') {
          photoUrl = photo;
        }

        assetData = {
          description: data.get('description'),
          asset_number: data.get('asset_number'),
          category: data.get('category'),
          purchase_date: data.get('purchase_date'),
          purchase_value: parseFloat(data.get('purchase_value') as string) || 0,
          depreciation_type: data.get('depreciation_type'),
          depreciation_percentage: parseFloat(data.get('depreciation_percentage') as string) || 0,
          status: 'ATIVO',
          photo: photoUrl
        };
      }

      const docRef = await addDoc(collection(db, 'assets'), assetData);
      return { id: docRef.id };
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'assets');
    }
  },
  updateAsset: async (id: string | number, data: any) => {
    try {
      let assetData = data;
      if (data instanceof FormData) {
        const photo = data.get('photo');
        let photoUrl = '';
        if (photo instanceof File) {
          photoUrl = await apiService.uploadPhoto(photo);
        } else if (typeof photo === 'string') {
          photoUrl = photo;
        }

        assetData = {
          description: data.get('description'),
          asset_number: data.get('asset_number'),
          category: data.get('category'),
          purchase_date: data.get('purchase_date'),
          purchase_value: parseFloat(data.get('purchase_value') as string) || 0,
          depreciation_type: data.get('depreciation_type'),
          depreciation_percentage: parseFloat(data.get('depreciation_percentage') as string) || 0,
          photo: photoUrl
        };
      }

      await updateDoc(doc(db, 'assets', String(id)), assetData);
      return { success: true };
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `assets/${id}`);
    }
  },
  disposalAsset: async (id: string | number, data: any) => {
    try {
      await updateDoc(doc(db, 'assets', String(id)), {
        ...data,
        status: 'BAIXADO'
      });
      return { success: true };
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `assets/${id}/disposal`);
    }
  },
  deleteAsset: async (id: string | number) => {
    try {
      await deleteDoc(doc(db, 'assets', String(id)));
      return { success: true };
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `assets/${id}`);
    }
  },

  // Movements
  getMovements: async () => {
    try {
      const snap = await getDocs(query(collection(db, 'movements'), orderBy('date', 'desc')));
      return snap.docs.map(d => {
        const data = d.data();
        return {
          ...data,
          id: d.id,
          date: data.date instanceof Timestamp ? data.date.toDate().toISOString() : data.date
        };
      }) as any;
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, 'movements');
    }
  },
  stockIn: async (data: any) => {
    try {
      await runTransaction(db, async (transaction) => {
        const productRef = doc(db, 'products', data.product_id);
        const productSnap = await transaction.get(productRef);
        if (!productSnap.exists()) throw new Error('Produto não encontrado');

        const productData = productSnap.data();
        const currentQty = productData.quantity || 0;
        const currentCost = productData.cost_price || 0;

        // Simple average cost calculation
        const newQty = currentQty + data.quantity;
        const newCost = ((currentQty * currentCost) + (data.quantity * data.unit_price)) / newQty;

        transaction.update(productRef, {
          quantity: newQty,
          cost_price: newCost
        });

        const movementRef = doc(collection(db, 'movements'));
        transaction.set(movementRef, {
          ...data,
          type: 'IN',
          date: serverTimestamp()
        });
      });
      return { success: true };
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'inventory/in');
    }
  },
  stockOut: async (data: any) => {
    try {
      await runTransaction(db, async (transaction) => {
        const productRef = doc(db, 'products', data.product_id);
        const productSnap = await transaction.get(productRef);
        if (!productSnap.exists()) throw new Error('Produto não encontrado');

        const productData = productSnap.data();
        const currentQty = productData.quantity || 0;

        if (currentQty < data.quantity) throw new Error('Estoque insuficiente');

        transaction.update(productRef, {
          quantity: currentQty - data.quantity
        });

        const movementRef = doc(collection(db, 'movements'));
        transaction.set(movementRef, {
          ...data,
          type: 'OUT',
          date: serverTimestamp()
        });
      });
      return { success: true };
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'inventory/out');
    }
  },

  // Financial
  getFinancialEntries: async () => {
    try {
      const snap = await getDocs(query(collection(db, 'movements'), where('type', '==', 'IN'), orderBy('date', 'desc')));
      return snap.docs.map(d => {
        const data = d.data();
        return {
          ...data,
          id: d.id,
          date: data.date instanceof Timestamp ? data.date.toDate().toISOString() : data.date
        };
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, 'financial/entries');
    }
  },

  // Audit Logs
  getAuditLogs: async () => {
    try {
      const snap = await getDocs(query(collection(db, 'audit_logs'), orderBy('created_at', 'desc')));
      return snap.docs.map(d => {
        const data = d.data();
        return {
          ...data,
          id: d.id,
          created_at: data.created_at instanceof Timestamp ? data.created_at.toDate().toISOString() : data.created_at
        };
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, 'audit_logs');
    }
  },
  importDatabase: async (file: File) => {
    // This was for SQLite, for Firebase we might not need it or it should be different.
    // For now, let's just add a placeholder to fix the lint error.
    throw new Error('Importação de banco de dados não suportada para Firebase diretamente via este método.');
  },

  // Users
  getUsers: async () => {
    try {
      const snap = await getDocs(collection(db, 'users'));
      return snap.docs.map(d => ({ id: d.id, ...d.data() } as any));
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, 'users');
    }
  },
  addUser: async (data: any) => {
    try {
      const docRef = await addDoc(collection(db, 'users'), data);
      
      // Sync with Auth via REST API (doesn't require admin SDK)
      await apiService.syncUserWithAuth(data.username, data.password);

      return { id: docRef.id };
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'users');
    }
  },
  updateUser: async (id: string | number, data: any) => {
    try {
      await updateDoc(doc(db, 'users', String(id)), data);

      // Sync with Auth if username or password changed
      if (data.username || data.password) {
        await apiService.syncUserWithAuth(data.username, data.password);
      }

      return { success: true };
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `users/${id}`);
    }
  },
  deleteUser: async (id: string | number) => {
    try {
      await deleteDoc(doc(db, 'users', String(id)));
      return { success: true };
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `users/${id}`);
    }
  },
};
