import { 
  collection, 
  getDocs, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  setDoc,
  query, 
  where, 
  orderBy, 
  limit, 
  getDoc,
  runTransaction,
  serverTimestamp,
  Timestamp,
  deleteField
} from 'firebase/firestore';
import { db, auth } from '../firebase';
import { Product, Client, Supplier, Asset, Order, Movement, OrderStatus } from '../types';
import { convertPdfToWebP } from '../lib/pdfUtils';

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

async function isDuplicate(collectionName: string, data: any) {
  try {
    const collRef = collection(db, collectionName);
    let q = query(collRef);
    
    // Build query with all fields
    // Note: We skip fields that are objects/arrays as Firestore 'where' has limitations there
    // and we skip fields that are likely to be unique like timestamps if they were already added
    Object.keys(data).forEach(key => {
      const value = data[key];
      if (value !== undefined && value !== null && typeof value !== 'object' && key !== 'created_at') {
        q = query(q, where(key, '==', value));
      }
    });

    const snap = await getDocs(q);
    
    // If we have potential matches, we do a deeper check for objects/arrays if necessary
    if (!snap.empty) {
      return snap.docs.some(doc => {
        const docData = doc.data();
        return Object.keys(data).every(key => {
          if (key === 'created_at') return true;
          const val1 = data[key];
          const val2 = docData[key];
          if (typeof val1 === 'object' && val1 !== null) {
            return JSON.stringify(val1) === JSON.stringify(val2);
          }
          return val1 === val2;
        });
      });
    }
    return false;
  } catch (error) {
    console.error(`Error checking duplicate in ${collectionName}:`, error);
    return false; // Fallback to allow if check fails
  }
}

import firebaseConfig from '../../firebase-applet-config.json';

const FIREBASE_API_KEY = firebaseConfig.apiKey;

export const apiService = {
  // Helper for Auth via Admin SDK (via server side route)
  syncUserWithAuth: async (username: string, password: string) => {
    const normalizedUsername = username.toLowerCase().replace(/\s+/g, '');
    
    // We generate a unique internal email to avoid conflicts and allow password "resets" 
    // by simply creating a new auth entry if the project doesn't allow admin overrides.
    // We use a prefix plus the username and a short random string.
    const uniqueId = Math.random().toString(36).substring(2, 7);
    const internalEmail = `user_${normalizedUsername}_${uniqueId}@skysmart.auth`;
    
    console.log(`[AuthSync] Synchronizing ${username} with internal ID...`);
    
    try {
      // Create a new auth entry for this user version
      const response = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=${FIREBASE_API_KEY}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: internalEmail, password, returnSecureToken: true })
      });

      const data = await response.json();

      if (!response.ok) {
        console.error('[AuthSync] Auth Error:', data);
        if (data.error?.message === 'API_DISABLED') {
          // Point to Firebase Console instead of GCP console for easier activation
          throw new Error(`API_DISABLED: O serviço de autenticação está desativado. Para que o reset de senhas funcione, você precisa: 
1. Acessar: https://console.firebase.google.com/project/${firebaseConfig.projectId}/authentication 
2. Clicar em "Primeiros Passos" (Get Started)
3. Ativar o método "E-mail/Senha"`);
        }
        throw new Error(data.error?.message || 'Erro ao criar conta de acesso');
      }
      
      console.log(`[AuthSync] Successfully synchronized ${username}`);
      return { 
        success: true, 
        internalId: data.localId, 
        auth_email: internalEmail, // We MUST store this in Firestore to know which email to login with
        status: 'verified' 
      };
    } catch (error) {
      console.error('[AuthSync] Auth Sync Error:', error);
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
  uploadFile: async (file: File | string) => {
    if (typeof file === 'string') return file; // Already a URL or base64

    let fileToUpload = file;
    if (file.type === 'application/pdf') {
      try {
        fileToUpload = await convertPdfToWebP(file);
      } catch (error) {
        console.error('Error converting PDF to WebP:', error);
        // Fallback to original file if conversion fails
      }
    }

    try {
      const formData = new FormData();
      formData.append('file', fileToUpload);

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
        credentials: 'include',
      });

      if (!response.ok) {
        const text = await response.text();
        console.error(`Upload failed (Status ${response.status}):`, text);
        throw new Error(`Erro ao fazer upload (Status ${response.status})`);
      }

      const result = await response.json();
      return result.url;
    } catch (error) {
      console.error('Error uploading file:', error);
      throw error;
    }
  },

  uploadPhoto: async (file: File | string) => {
    return apiService.uploadFile(file);
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

      if (await isDuplicate('products', productData)) {
        throw new Error('Este produto já está cadastrado com os mesmos dados.');
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
      if (await isDuplicate('orders', data)) {
        throw new Error('Esta ordem já está cadastrada com os mesmos dados.');
      }
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

  // Production Products
  getProductionProducts: async () => {
    try {
      const snap = await getDocs(collection(db, 'production_products'));
      return snap.docs.map(d => ({ id: d.id, ...d.data() } as any));
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, 'production_products');
    }
  },
  addProductionProduct: async (name: string) => {
    try {
      if (await isDuplicate('production_products', { name })) {
        throw new Error('Este produto já está cadastrado.');
      }
      const docRef = await addDoc(collection(db, 'production_products'), { name });
      return { id: docRef.id, name };
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'production_products');
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
      if (await isDuplicate('service_entries', data)) {
        throw new Error('Esta entrada de serviço já está cadastrada com os mesmos dados.');
      }
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
      if (await isDuplicate('clients', data)) {
        throw new Error('Este cliente já está cadastrado com os mesmos dados.');
      }
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
  getClient: async (id: string | number) => {
    try {
      const docRef = doc(db, 'clients', String(id));
      const snap = await getDoc(docRef);
      if (snap.exists()) {
        return { id: snap.id, ...snap.data() } as Client;
      }
      return null;
    } catch (error) {
      handleFirestoreError(error, OperationType.GET, `clients/${id}`);
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
      if (await isDuplicate('suppliers', data)) {
        throw new Error('Este fornecedor já está cadastrado com os mesmos dados.');
      }
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
      if (await isDuplicate('locations', { name })) {
        throw new Error('Esta localização já está cadastrada.');
      }
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
  deleteLocation: async (id: string | number) => {
    try {
      await deleteDoc(doc(db, 'locations', String(id)));
      return { success: true };
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `locations/${id}`);
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
      if (await isDuplicate('categories', { name })) {
        throw new Error('Esta categoria já está cadastrada.');
      }
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
  deleteCategory: async (id: string | number) => {
    try {
      await deleteDoc(doc(db, 'categories', String(id)));
      return { success: true };
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `categories/${id}`);
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
          const productData = {
            name: product.name || 'SEM NOME',
            category: product.category || 'GERAL',
            unit: product.unit || 'UN',
            cost_price: parseFloat(product.cost_price) || 0,
            min_quantity: parseFloat(product.min_quantity) || 0,
            quantity: parseFloat(product.quantity) || 0,
            photo: ''
          };

          if (await isDuplicate('products', productData)) {
            errors.push(`Linha ${i + 1}: Produto já cadastrado.`);
            continue;
          }

          await addDoc(collection(db, 'products'), productData);
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
      if (await isDuplicate('units', { name })) {
        throw new Error('Esta unidade já está cadastrada.');
      }
      const docRef = await addDoc(collection(db, 'units'), { name });
      return { id: docRef.id, name };
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'units');
    }
  },
  updateUnit: async (id: string | number, name: string) => {
    try {
      await updateDoc(doc(db, 'units', String(id)), { name });
      return { success: true };
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `units/${id}`);
    }
  },
  deleteUnit: async (id: string | number) => {
    try {
      await deleteDoc(doc(db, 'units', String(id)));
      return { success: true };
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `units/${id}`);
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
          location_or_responsible: data.get('location_or_responsible'),
          category: data.get('category'),
          purchase_date: data.get('purchase_date'),
          purchase_value: parseFloat(data.get('purchase_value') as string) || 0,
          depreciation_type: data.get('depreciation_type'),
          depreciation_percentage: parseFloat(data.get('depreciation_percentage') as string) || 0,
          status: 'ATIVO',
          photo: photoUrl
        };
      }

      if (await isDuplicate('assets', assetData)) {
        throw new Error('Este patrimônio já está cadastrado com os mesmos dados.');
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
          location_or_responsible: data.get('location_or_responsible'),
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
        let date = data.date;
        
        if (date instanceof Timestamp) {
          date = date.toDate().toISOString();
        } else if (!date && data.issue_date) {
          // Fallback to issue_date if date is missing
          date = data.issue_date;
        } else if (!date) {
          // Final fallback to current date to avoid 1969
          date = new Date().toISOString();
        }

        return {
          ...data,
          id: d.id,
          date
        };
      }) as any;
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, 'movements');
    }
  },
  stockIn: async (data: any) => {
    try {
      if (await isDuplicate('movements', { ...data, type: 'IN' })) {
        throw new Error('Esta entrada de estoque já foi registrada.');
      }
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
          cost_price: newCost,
          last_supplier: data.supplier_name
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
      if (await isDuplicate('movements', { ...data, type: 'OUT' })) {
        throw new Error('Esta saída de estoque já foi registrada.');
      }
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
        let date = data.date;
        
        if (date instanceof Timestamp) {
          date = date.toDate().toISOString();
        } else if (!date && data.issue_date) {
          date = data.issue_date;
        } else if (!date) {
          date = new Date().toISOString();
        }

        return {
          ...data,
          id: d.id,
          date
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
        let created_at = data.created_at;
        
        if (created_at instanceof Timestamp) {
          created_at = created_at.toDate().toISOString();
        } else if (!created_at) {
          created_at = new Date().toISOString();
        }

        return {
          ...data,
          id: d.id,
          created_at
        };
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, 'audit_logs');
    }
  },
  createAuditLog: async (action: string, details: string, userName?: string) => {
    try {
      await addDoc(collection(db, 'audit_logs'), {
        user_id: auth.currentUser?.uid || 'system',
        user_name: userName || auth.currentUser?.email || 'Sistema',
        action,
        details,
        created_at: serverTimestamp()
      });
    } catch (error) {
      console.error('Error creating audit log:', error);
      // Don't throw here to avoid breaking the main operation
    }
  },
  resetDatabase: async () => {
    const collectionsToClear = [
      'products', 'movements', 'clients', 'suppliers', 
      'assets', 'orders', 'categories', 'locations', 
      'units', 'audit_logs', 'service_entries', 'users', 'public_auth_map'
    ];

    for (const collName of collectionsToClear) {
      try {
        const snap = await getDocs(collection(db, collName));
        const deletePromises = snap.docs.map(doc => deleteDoc(doc.ref));
        await Promise.all(deletePromises);
      } catch (error) {
        console.error(`Error clearing collection ${collName}:`, error);
      }
    }
  },
  getFullDatabase: async () => {
    const collectionsToExport = [
      'products', 'movements', 'clients', 'suppliers', 
      'assets', 'orders', 'categories', 'locations', 
      'units', 'audit_logs', 'service_entries', 'users', 'public_auth_map'
    ];
    
    const fullData: Record<string, any[]> = {};
    
    for (const collName of collectionsToExport) {
      try {
        const snap = await getDocs(collection(db, collName));
        fullData[collName] = snap.docs.map(d => ({ 
          _id: d.id, 
          ...d.data() 
        }));
      } catch (error) {
        console.error(`Error exporting collection ${collName}:`, error);
        fullData[collName] = [];
      }
    }
    
    return fullData;
  },
  importDatabase: async (file: File) => {
    // We send the zip to the server to extract it and return the database.json
    const formData = new FormData();
    formData.append('file', file);
    
    try {
      const response = await fetch('/api/restore', {
        method: 'POST',
        body: formData
      });
      
      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || 'Falha ao processar arquivo de backup');
      }
      
      const { data, filesRestored } = await response.json();
      
      if (!data) throw new Error('Arquivo de backup inválido ou sem dados.');
      
      // Clear current data
      await apiService.resetDatabase();
      
      // Import collections
      const collections = Object.keys(data);
      for (const collName of collections) {
        const items = data[collName];
        for (const item of items) {
          const { _id, ...docData } = item;
          // Use setDoc to preserve old IDs
          await setDoc(doc(db, collName, _id), docData);
        }
      }
      
      return { success: true, filesRestored };
    } catch (error: any) {
      console.error('Error importing database:', error);
      throw error;
    }
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
      console.log('[UserService] Adding new user:', data.username);
      // Check for duplicate username
      const q = query(collection(db, 'users'), where('username', '==', String(data.username).toLowerCase()));
      const snap = await getDocs(q);
      if (!snap.empty) {
        throw new Error('Este nome de usuário já está em uso no banco de perfis.');
      }

      // Sync with Auth via REST API
      const password = String(data.password || '').trim();
      if (!password) throw new Error('Senha é obrigatória para novos usuários.');
      if (password.length < 6) throw new Error('A senha deve ter pelo menos 6 caracteres.');
      
      const authResult = await apiService.syncUserWithAuth(data.username, password);

      // Save to Firestore without the password for better security
      const { password: _, ...firestoreData } = data;
      const cleanData = {
         ...firestoreData,
        uid: authResult.internalId || null, // Store the Auth UID (internalId from our new sync)
        auth_email: authResult.auth_email || null, // CRITICAL: Store the internal email used for Auth
        auth_sync_status: authResult.status, 
        username: String(data.username).toLowerCase().replace(/\s+/g, ''),
        updated_at: serverTimestamp(),
        created_at: serverTimestamp(),
        encryption_status: 'auth_managed'
      };
      
      // Use setDoc with the uid as the document ID to match security rules expectations
      const userDocId = authResult.internalId || `temp_${Date.now()}`;
      await setDoc(doc(db, 'users', userDocId), cleanData);
      
      // Update the public auth map for login lookups
      if (authResult.auth_email) {
        await setDoc(doc(db, 'public_auth_map', cleanData.username), {
          auth_email: authResult.auth_email,
          updated_at: serverTimestamp()
        });
      }
      
      console.log('[UserService] User created successfully with ID:', userDocId);
      
      return { id: userDocId };
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'users');
    }
  },
  updateUser: async (id: string | number, data: any) => {
    try {
      // Sync with Auth if password is provided
      if (data.password && String(data.password).trim() !== '') {
        const password = String(data.password).trim();
        const authResult = await apiService.syncUserWithAuth(data.username || '', password);
        
        if (authResult.internalId) {
          (data as any).uid = authResult.internalId;
        }
        if (authResult.auth_email) {
          (data as any).auth_email = authResult.auth_email;
        }
        (data as any).auth_sync_status = authResult.status;
      }

      // Save to Firestore without the password
      // We also use deleteField() concept or just omit it to ensure no leak
      const { password, ...firestoreData } = data;
      await updateDoc(doc(db, 'users', String(id)), {
        ...firestoreData,
        password: deleteField(),
        updated_at: serverTimestamp()
      });

      // Update public auth map if email changed (reset)
      if ((data as any).auth_email && data.username) {
        await setDoc(doc(db, 'public_auth_map', String(data.username).toLowerCase().replace(/\s+/g, '')), {
          auth_email: (data as any).auth_email,
          updated_at: serverTimestamp()
        });
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
