import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  LayoutDashboard, 
  Package, 
  Users, 
  Truck, 
  HardDrive, 
  ClipboardList, 
  Menu, 
  X, 
  Settings, 
  DollarSign, 
  FileText,
  RotateCcw,
  Edit,
  Trash2,
  Loader2,
  ShieldCheck,
  Eye,
  EyeOff,
  Briefcase
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  onAuthStateChanged, 
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  User as FirebaseUser
} from 'firebase/auth';
import { 
  collection, 
  query, 
  orderBy, 
  Timestamp 
} from 'firebase/firestore';
import { auth, db } from './firebase';
import { Product, Client, Supplier, Asset, Order, Movement, OrderStatus, OrderDetails, User, ServiceEntry as ServiceEntryType, ProductionProduct } from './types';
import { apiService } from './services/apiService';
import { KANBAN_COLUMNS } from './constants';
import { Dashboard } from './components/Dashboard';
import { Inventory } from './components/Inventory';
import { Kanban } from './components/Kanban';
import { ServiceEntry } from './components/ServiceEntry';
import { GenericList } from './components/GenericList';
import { Settings as SettingsView } from './components/Settings';
import { Assets } from './components/Assets';
import { SidebarItem, cn, ErrorAlert, Button } from './components/Common';
import { OrderModal } from './components/OrderModal';
import { OrderDetailModal } from './components/OrderDetailModal';
import { ClientModal, SupplierModal } from './components/EntityModals';
import { AssetModal } from './components/assets/AssetModals';
import { validateEmail, validateCPF, validateCNPJ, validatePhone, validateCEP } from './lib/validation';
import { FinancialDetailModal } from './components/FinancialDetailModal';
import { ConfirmModal } from './components/Common';

// --- Login Component ---

const Login = ({ onLogin }: { onLogin: () => void }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    const normalizedUsername = username.toLowerCase().trim();
    const normalizedPassword = password.toLowerCase().trim(); // User specifically asked for admin/admin lowercase

    let email = normalizedUsername;
    let pass = normalizedPassword;

    // Special handling for admin/admin
    if (normalizedUsername === 'admin' && normalizedPassword === 'admin') {
      email = 'admin@skysmart.com';
      pass = 'adminadmin';
    } else if (!normalizedUsername.includes('@')) {
      // If it's a simple username, append a domain to make it an email for Firebase Auth
      email = `${normalizedUsername}@skysmart.com`;
    }

    try {
      try {
        await signInWithEmailAndPassword(auth, email, pass);
      } catch (err: any) {
        // Modern Firebase Auth returns 'auth/invalid-credential' for both not found and wrong password
        if (err.code === 'auth/user-not-found' || err.code === 'auth/invalid-credential') {
          // Special case for bootstrap admin
          if (normalizedUsername === 'admin' && normalizedPassword === 'admin') {
            try {
              await createUserWithEmailAndPassword(auth, email, pass);
            } catch (createErr: any) {
              // If creation fails (e.g. user already exists but password was wrong), throw original error
              throw err;
            }
          } else {
            throw err;
          }
        } else {
          throw err;
        }
      }
      onLogin();
    } catch (err: any) {
      console.error('Login error:', err);
      if (err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
        setError('USUÁRIO OU SENHA INCORRETOS');
      } else {
        setError('ERRO AO REALIZAR LOGIN. TENTE NOVAMENTE.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-50 dark:bg-zinc-950 p-4">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full bg-white dark:bg-zinc-900 p-8 rounded-3xl shadow-2xl border border-zinc-100 dark:border-zinc-800"
      >
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-zinc-900 dark:bg-white rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg">
            <HardDrive className="text-white dark:text-zinc-900" size={40} />
          </div>
          <h1 className="text-3xl font-black text-zinc-900 dark:text-white mb-2 tracking-tight uppercase">SKYSMART</h1>
          <p className="text-zinc-500 dark:text-zinc-400 uppercase text-xs font-bold tracking-widest">Gestão Inteligente</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          {error && <ErrorAlert>{error}</ErrorAlert>}
          
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest ml-1">Usuário</label>
            <div className="relative">
              <div className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400">
                <Users size={18} />
              </div>
              <input 
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-zinc-50 dark:bg-zinc-800 border border-zinc-100 dark:border-zinc-700 rounded-xl focus:ring-2 focus:ring-zinc-900 dark:focus:ring-zinc-100 outline-none transition-all text-sm font-medium"
                required
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest ml-1">Senha</label>
            <div className="relative">
              <div className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400">
                <ShieldCheck size={18} />
              </div>
              <input 
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-12 py-3 bg-zinc-50 dark:bg-zinc-800 border border-zinc-100 dark:border-zinc-700 rounded-xl focus:ring-2 focus:ring-zinc-900 dark:focus:ring-zinc-100 outline-none transition-all text-sm font-medium"
                placeholder="••••••••"
                required
              />
              {password.length > 0 && (
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 transition-colors"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              )}
            </div>
          </div>

          <Button 
            type="submit"
            variant="primary" 
            disabled={isLoading}
            className="w-full py-4 flex items-center justify-center gap-3 text-sm font-bold uppercase tracking-widest"
          >
            {isLoading ? <Loader2 className="animate-spin" size={20} /> : 'Acessar Sistema'}
          </Button>
        </form>
        
        <p className="mt-8 text-center text-[10px] text-zinc-400 dark:text-zinc-500 uppercase tracking-widest font-bold">
          SkySmart v1.0 • 2026
        </p>
      </motion.div>
    </div>
  );
};

// --- Main App ---

export default function App() {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [isAuthReady, setIsAuthReady] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        // If it's the bootstrap admin, they are always allowed
        if (firebaseUser.email === 'admin@skysmart.com' || firebaseUser.email === 'Diesel.087@gmail.com') {
          setUser(firebaseUser);
        } else {
          // For other users, we should ideally check if they exist in the users collection
          // Since we have systemUsers state, we can use it, but it might not be ready.
          // However, the firestore rules will block them anyway if they try to read/write.
          // To be safe, we can do a quick check here if systemUsers is already populated.
          setUser(firebaseUser);
        }
      } else {
        setUser(null);
      }
      setIsAuthReady(true);
    });
    return () => unsubscribe();
  }, []);

  const [isDarkMode, setIsDarkMode] = useState(() => {
    if (typeof window !== 'undefined') {
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    return false;
  });

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = (e: MediaQueryListEvent) => setIsDarkMode(e.matches);
    
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  useEffect(() => {
    const lockOrientation = async () => {
      try {
        if (screen.orientation && (screen.orientation as any).lock) {
          await (screen.orientation as any).lock('landscape');
        }
      } catch (err) {
        // This often fails if not in fullscreen or not supported, which is expected
      }
    };
    lockOrientation();
  }, []);

  const [activeTab, setActiveTab] = useState('dashboard');
  const [inventorySearchTerm, setInventorySearchTerm] = useState('');
  const [stats, setStats] = useState<any>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [serviceEntries, setServiceEntries] = useState<ServiceEntryType[]>([]);
  const [systemUsers, setSystemUsers] = useState<User[]>([]);

  const currentUserProfile = systemUsers.find(u => 
    u.email === user?.email || 
    (u.username && user?.email && u.username.toLowerCase() === user.email.split('@')[0].toLowerCase())
  );
  const isAdmin = (user?.email === 'admin@skysmart.com' || user?.email === 'Diesel.087@gmail.com' || currentUserProfile?.role === 'Administrador');
  const userPermissions = isAdmin
    ? ['dashboard', 'kanban', 'service_entry', 'production', 'clients', 'suppliers', 'assets', 'inventory', 'financial', 'audit', 'settings']
    : (currentUserProfile?.permissions || []);
  
  const logAction = async (action: string, details: string) => {
    await apiService.createAuditLog(action, details, currentUserProfile?.name || user?.email || undefined);
  };

  const sidebarItems = [
    { id: 'dashboard', icon: LayoutDashboard, label: "Painel" },
    { id: 'kanban', icon: ClipboardList, label: "Kanban" },
    { id: 'service_entry', icon: Briefcase, label: "Entrada de Serviço" },
    { id: 'production', icon: FileText, label: "Ordem de Produção" },
    { id: 'clients', icon: Users, label: "Clientes" },
    { id: 'suppliers', icon: Truck, label: "Fornecedores" },
    { id: 'assets', icon: HardDrive, label: "Patrimônios" },
    { id: 'inventory', icon: Package, label: "Estoque" },
    { id: 'financial', icon: DollarSign, label: "Financeiro" },
    { id: 'audit', icon: RotateCcw, label: "Histórico" },
    { id: 'settings', icon: Settings, label: "Configurações" },
  ];

  // Redirect to first available tab if current is not allowed
  useEffect(() => {
    if (user && userPermissions.length > 0 && !userPermissions.includes(activeTab as any)) {
      const firstAvailable = sidebarItems.find(item => userPermissions.includes(item.id as any));
      if (firstAvailable) {
        setActiveTab(firstAvailable.id as any);
      }
    }
  }, [user, userPermissions, activeTab]);

  const visibleSidebarItems = sidebarItems.filter(item => userPermissions.includes(item.id as any));
  const [categories, setCategories] = useState<{id: string | number, name: string}[]>([]);
  const [locations, setLocations] = useState<{id: string | number, name: string}[]>([]);
  const [units, setUnits] = useState<{id: string | number, name: string}[]>([]);
  const [productionProducts, setProductionProducts] = useState<ProductionProduct[]>([]);
  const [movements, setMovements] = useState<Movement[]>([]);
  const [financialEntries, setFinancialEntries] = useState<any[]>([]);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [lastScrollY, setLastScrollY] = useState(0);
  const [globalError, setGlobalError] = useState<string | null>(null);
  const [isFetching, setIsFetching] = useState(false);
  const mainContentRef = useRef<HTMLDivElement>(null);

  // Handle window resize to ensure sidebar state is consistent
  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      if (width >= 1024) {
        // On desktop, ensure sidebar is "open" (drawer state)
        setIsSidebarOpen(true);
        // On desktop, we generally want the sidebar expanded unless scrolling down
        // Resetting it here ensures that when returning from mobile it's in a clean state
        setIsSidebarCollapsed(false);
      } else {
        // On mobile/tablet, default to closed drawer
        setIsSidebarOpen(false);
        setIsSidebarCollapsed(false);
      }
    };

    window.addEventListener('resize', handleResize);
    // Initial check
    handleResize();
    
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      if (!mainContentRef.current) return;
      const currentScrollY = mainContentRef.current.scrollTop;
      
      // Only trigger collapse on screens below 1280px (xl)
      if (window.innerWidth < 1280) {
        if (currentScrollY > lastScrollY && currentScrollY > 50) {
          // Scrolling down - collapse
          setIsSidebarCollapsed(true);
          // Also close mobile drawer if it's open
          if (window.innerWidth < 1024 && isSidebarOpen) {
            setIsSidebarOpen(false);
          }
        } else if (currentScrollY < lastScrollY || currentScrollY <= 10) {
          // Scrolling up or at top - expand
          setIsSidebarCollapsed(false);
        }
      }
      setLastScrollY(currentScrollY);
    };

    const container = mainContentRef.current;
    if (container) {
      container.addEventListener('scroll', handleScroll);
    }
    return () => {
      if (container) {
        container.removeEventListener('scroll', handleScroll);
      }
    };
  }, [lastScrollY, isSidebarOpen]);

  const [isOrderModalOpen, setIsOrderModalOpen] = useState(false);
  const [editingOrder, setEditingOrder] = useState<Order | null>(null);
  const [isClientModalOpen, setIsClientModalOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [clientFieldErrors, setClientFieldErrors] = useState<Record<string, string>>({});
  const [isSupplierModalOpen, setIsSupplierModalOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
  const [supplierFieldErrors, setSupplierFieldErrors] = useState<Record<string, string>>({});
  const [assetFieldErrors, setAssetFieldErrors] = useState<Record<string, string>>({});

  const validateEntityData = (data: any, isSupplier: boolean = false, editingId?: string | number) => {
    const errors: Record<string, string> = {};
    const typeField = isSupplier ? 'tipo' : 'tipo_cliente';
    const list = isSupplier ? suppliers : clients;
    
    if (data[typeField] === 'PF') {
      if (!data.name) {
        errors.name = 'NOME É OBRIGATÓRIO';
      } else {
        const isDuplicate = list.some(item => 
          item.id !== editingId && 
          (isSupplier ? (item as Supplier).name : (item as Client).name)?.toUpperCase() === data.name.toUpperCase()
        );
        if (isDuplicate) errors.name = 'NOME JÁ CADASTRADO';
      }

      if (!data.cpf) {
        errors.cpf = 'CPF É OBRIGATÓRIO';
      } else if (!validateCPF(data.cpf)) {
        errors.cpf = 'CPF INVÁLIDO';
      } else {
        const isDuplicate = list.some(item => item.id !== editingId && item.cpf === data.cpf);
        if (isDuplicate) errors.cpf = 'CPF JÁ CADASTRADO';
      }
    } else {
      if (!data.razao_social) {
        errors.razao_social = 'RAZÃO SOCIAL É OBRIGATÓRIA';
      } else {
        const isDuplicate = list.some(item => 
          item.id !== editingId && 
          item.razao_social?.toUpperCase() === data.razao_social.toUpperCase()
        );
        if (isDuplicate) errors.razao_social = 'RAZÃO SOCIAL JÁ CADASTRADA';
      }

      if (!data.cnpj) {
        errors.cnpj = 'CNPJ É OBRIGATÓRIO';
      } else if (!validateCNPJ(data.cnpj)) {
        errors.cnpj = 'CNPJ INVÁLIDO';
      } else {
        const isDuplicate = list.some(item => item.id !== editingId && item.cnpj === data.cnpj);
        if (isDuplicate) errors.cnpj = 'CNPJ JÁ CADASTRADO';
      }
    }

    // Email uniqueness (required for suppliers)
    if (data.email) {
      if (!validateEmail(data.email)) {
        errors.email = 'EMAIL INVÁLIDO';
      } else {
        const isDuplicate = list.some(item => item.id !== editingId && item.email?.toLowerCase() === data.email.toLowerCase());
        if (isDuplicate) errors.email = 'EMAIL JÁ CADASTRADO';
      }
    }

    // Telefone 1 uniqueness
    if (data.telefone1) {
      if (!validatePhone(data.telefone1)) {
        errors.telefone1 = 'TELEFONE INVÁLIDO';
      } else {
        const isDuplicate = list.some(item => item.id !== editingId && item.telefone1 === data.telefone1);
        if (isDuplicate) errors.telefone1 = 'TELEFONE JÁ CADASTRADO';
      }
    }

    // Endereco uniqueness
    if (data.endereco) {
      const isDuplicate = list.some(item => 
        item.id !== editingId && 
        item.endereco?.toUpperCase() === data.endereco.toUpperCase()
      );
      if (isDuplicate) errors.endereco = 'ENDEREÇO JÁ CADASTRADO';
    }

    if (data.cep && !validateCEP(data.cep)) {
      errors.cep = 'CEP INVÁLIDO';
    }

    return errors;
  };

  const validateAssetData = (data: any, editingId?: string | number) => {
    const errors: Record<string, string> = {};
    
    if (!data.description) {
      errors.description = 'DESCRIÇÃO É OBRIGATÓRIA';
    } else {
      const isDuplicate = assets.some(a => a.id !== editingId && a.description.toUpperCase() === data.description.toUpperCase());
      if (isDuplicate) errors.description = 'DESCRIÇÃO JÁ CADASTRADA';
    }

    if (!data.asset_number) {
      errors.asset_number = 'NÚMERO É OBRIGATÓRIO';
    } else {
      const isDuplicate = assets.some(a => a.id !== editingId && a.asset_number === data.asset_number);
      if (isDuplicate) errors.asset_number = 'NÚMERO JÁ CADASTRADO';
    }

    if (!data.category) errors.category = 'CATEGORIA É OBRIGATÓRIA';
    if (!data.purchase_date) errors.purchase_date = 'DATA É OBRIGATÓRIA';
    if (!data.purchase_value) errors.purchase_value = 'VALOR É OBRIGATÓRIO';
    if (!data.depreciation_type) errors.depreciation_type = 'TIPO É OBRIGATÓRIO';
    if (!data.depreciation_percentage) errors.depreciation_percentage = 'PERCENTUAL É OBRIGATÓRIO';

    return errors;
  };
  const [isAssetModalOpen, setIsAssetModalOpen] = useState(false);
  const [editingAsset, setEditingAsset] = useState<Asset | null>(null);
  const [isServiceEntryModalOpen, setIsServiceEntryModalOpen] = useState(false);
  const [editingServiceEntry, setEditingServiceEntry] = useState<ServiceEntryType | null>(null);
  const [selectedOrderForDetail, setSelectedOrderForDetail] = useState<Order | null>(null);
  const [selectedFinancialEntry, setSelectedFinancialEntry] = useState<any | null>(null);
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
    variant?: 'primary' | 'danger';
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {},
  });

  const showConfirm = (title: string, message: string, onConfirm: () => void, variant: 'primary' | 'danger' = 'danger') => {
    setConfirmModal({
      isOpen: true,
      title,
      message,
      onConfirm: () => {
        onConfirm();
        setConfirmModal(prev => ({ ...prev, isOpen: false }));
      },
      variant
    });
  };

  const [activeGenericMenuId, setActiveGenericMenuId] = useState<string | number | null>(null);
  const [genericMenuPosition, setGenericMenuPosition] = useState<{ top: number, left: number } | null>(null);

  const handleGenericMenuClick = (e: React.MouseEvent, id: string | number) => {
    e.stopPropagation();
    const rect = e.currentTarget.getBoundingClientRect();
    setGenericMenuPosition({ top: rect.bottom + window.scrollY, left: rect.right - 160 + window.scrollX });
    setActiveGenericMenuId(id);
  };

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user]);

  const fetchData = async () => {
    if (!user || isFetching) return;
    setIsFetching(true);
    try {
      const [
        statsData,
        productsData,
        ordersData,
        clientsData,
        suppliersData,
        assetsData,
        categoriesData,
        locationsData,
        unitsData,
        productionProductsData,
        movementsData,
        auditLogsData,
        usersData,
        serviceEntriesData
      ] = await Promise.all([
        apiService.getStats(),
        apiService.getProducts(),
        apiService.getOrders(),
        apiService.getClients(),
        apiService.getSuppliers(),
        apiService.getAssets(),
        apiService.getCategories(),
        apiService.getLocations(),
        apiService.getUnits(),
        apiService.getProductionProducts(),
        apiService.getMovements(),
        apiService.getAuditLogs(),
        apiService.getUsers(),
        apiService.getServiceEntries()
      ]);

      setStats(statsData);
      setProducts(productsData || []);
      setOrders(ordersData || []);
      setClients(clientsData || []);
      setSuppliers(suppliersData || []);
      setAssets(assetsData || []);
      setCategories(categoriesData || []);
      setLocations(locationsData || []);
      setUnits(unitsData || []);
      setProductionProducts(productionProductsData || []);
      const movements = movementsData || [];
      setMovements(movements);
      
      // Populate financial entries from IN movements
      const financial = movements
        .filter((m: any) => m.type === 'IN')
        .map((m: any) => {
          const product = (productsData || []).find((p: any) => p.id.toString() === m.product_id.toString());
          return {
            ...m,
            product_name: product ? product.name : 'PRODUTO NÃO ENCONTRADO'
          };
        });
      setFinancialEntries(financial);

      setAuditLogs(auditLogsData || []);
      setSystemUsers(usersData || []);
      setServiceEntries(serviceEntriesData || []);
    } catch (err) {
      console.error('Error fetching data:', err);
      setGlobalError('ERRO AO ATUALIZAR DADOS. TENTE NOVAMENTE.');
    } finally {
      setIsFetching(false);
    }
  };

  const updateOrderStatus = async (id: string | number, status: OrderStatus) => {
    try {
      const order = orders.find(o => o.id === id);
      if (order) {
        const statusIndex = KANBAN_COLUMNS.indexOf(status);
        const finalizationIndex = KANBAN_COLUMNS.indexOf('REVISÃO PRODUÇÃO');

        if (statusIndex >= finalizationIndex) {
          let progress = 0;
          if (order.details) {
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
              if (totalItems > 0) {
                const completedCount = details.completed_items?.length || 0;
                progress = Math.min(Math.round((completedCount / totalItems) * 100), 100);
              } else {
                progress = 100; // No items to complete
              }
            } catch (e) {
              progress = 0;
            }
          }

          if (progress < 100) {
            setGlobalError(`BLOQUEADO: Não é possível mover para "${status}". Todos os itens do Processo de Produção devem estar concluídos (100%).`);
            return;
          }
        }
      }

      await apiService.patchOrder(id, { status });
      logAction('ATUALIZAR STATUS ORDEM', `ORDEM: ${order?.title || id}, NOVO STATUS: ${status}`);
      fetchData();
    } catch (err) {
      console.error('Error updating order:', err);
    }
  };

  const addOrder = async (data: any) => {
    try {
      await apiService.addOrder(data);
      logAction('ADICIONAR ORDEM', `ORDEM: ${data.title}`);
      fetchData();
    } catch (err) {
      console.error('Error adding order:', err);
    }
  };

  const updateOrder = async (id: string | number, data: any) => {
    try {
      await apiService.updateOrder(id, data);
      logAction('ATUALIZAR ORDEM', `ORDEM: ${data.title || id}`);
      fetchData();
    } catch (err) {
      console.error('Error updating order:', err);
    }
  };

  const deleteOrder = async (id: string | number) => {
    try {
      const order = orders.find(o => o.id === id);
      await apiService.deleteOrder(id);
      logAction('EXCLUIR ORDEM', `ORDEM: ${order?.title || id}`);
      fetchData();
    } catch (err) {
      console.error('Error deleting order:', err);
    }
  };

  const handleDeleteOrder = async (id: string | number) => {
    showConfirm(
      'EXCLUIR ORDEM',
      'TEM CERTEZA QUE DESEJA EXCLUIR ESTA ORDEM DE PRODUÇÃO? ESTA AÇÃO NÃO PODE SER DESFEITA.',
      () => deleteOrder(id)
    );
  };

  const addClient = async (data: any) => {
    const errors = validateEntityData(data);

    if (Object.keys(errors).length > 0) {
      setClientFieldErrors(errors);
      return;
    }

    try {
      await apiService.addClient(data);
      logAction('ADICIONAR CLIENTE', `CLIENTE: ${data.name || data.razao_social}`);
      fetchData();
      setIsClientModalOpen(false);
      setClientFieldErrors({});
    } catch (err: any) {
      setGlobalError(err.message || 'Erro ao adicionar cliente');
      console.error('Error adding client:', err);
    }
  };

  const updateClient = async (id: string | number, data: any) => {
    const errors = validateEntityData(data, false, id);

    if (Object.keys(errors).length > 0) {
      setClientFieldErrors(errors);
      return;
    }

    try {
      await apiService.updateClient(id, data);
      logAction('ATUALIZAR CLIENTE', `CLIENTE: ${data.name || data.razao_social}`);
      fetchData();
      setIsClientModalOpen(false);
      setClientFieldErrors({});
    } catch (err: any) {
      setGlobalError(err.message || 'Erro ao atualizar cliente');
      console.error('Error updating client:', err);
    }
  };

  const deleteClient = async (id: string | number) => {
    try {
      const client = clients.find(c => c.id === id);
      await apiService.deleteClient(id);
      logAction('EXCLUIR CLIENTE', `CLIENTE: ${client?.name || client?.razao_social || id}`);
      fetchData();
    } catch (err) {
      console.error('Error deleting client:', err);
    }
  };

  const handleDeleteClient = async (id: string | number) => {
    showConfirm(
      'EXCLUIR CLIENTE',
      'TEM CERTEZA QUE DESEJA EXCLUIR ESTE CLIENTE? ESTA AÇÃO NÃO PODE SER DESFEITA.',
      () => deleteClient(id)
    );
  };

  const updateSupplierEntity = async (id: string | number, data: any) => {
    const errors = validateEntityData(data, true, id);

    if (Object.keys(errors).length > 0) {
      setSupplierFieldErrors(errors);
      return;
    }

    try {
      await apiService.updateSupplier(id, data);
      logAction('ATUALIZAR FORNECEDOR', `FORNECEDOR: ${data.name || data.razao_social}`);
      fetchData();
      setIsSupplierModalOpen(false);
      setSupplierFieldErrors({});
    } catch (err: any) {
      setGlobalError(err.message || 'Erro ao atualizar fornecedor');
      console.error('Error updating supplier:', err);
    }
  };

  const deleteSupplier = async (id: string | number) => {
    try {
      const supplier = suppliers.find(s => s.id === id);
      await apiService.deleteSupplier(id);
      logAction('EXCLUIR FORNECEDOR', `FORNECEDOR: ${supplier?.name || supplier?.razao_social || id}`);
      fetchData();
    } catch (err) {
      console.error('Error deleting supplier:', err);
    }
  };

  const handleDeleteSupplier = async (id: string | number) => {
    showConfirm(
      'EXCLUIR FORNECEDOR',
      'TEM CERTEZA QUE DESEJA EXCLUIR ESTE FORNECEDOR? ESTA AÇÃO NÃO PODE SER DESFEITA.',
      () => deleteSupplier(id)
    );
  };

  const addAsset = async (formData: FormData) => {
    const data: any = {};
    formData.forEach((value, key) => {
      data[key] = value;
    });

    const errors = validateAssetData(data);
    if (Object.keys(errors).length > 0) {
      setAssetFieldErrors(errors);
      return;
    }

    try {
      await apiService.addAsset(formData);
      logAction('ADICIONAR PATRIMÔNIO', `PATRIMÔNIO: ${formData.get('description')}`);
      fetchData();
      setIsAssetModalOpen(false);
    } catch (err) {
      console.error('Error adding asset:', err);
    }
  };

  const updateAsset = async (id: string | number, formData: FormData) => {
    const data: any = {};
    formData.forEach((value, key) => {
      data[key] = value;
    });

    const errors = validateAssetData(data, id);
    if (Object.keys(errors).length > 0) {
      setAssetFieldErrors(errors);
      return;
    }

    try {
      await apiService.updateAsset(id, formData);
      logAction('ATUALIZAR PATRIMÔNIO', `PATRIMÔNIO: ${formData.get('description')}`);
      fetchData();
      setIsAssetModalOpen(false);
      setEditingAsset(null);
    } catch (err) {
      console.error('Error updating asset:', err);
    }
  };

  const handleDisposalAsset = async (id: string | number, data: any) => {
    try {
      const asset = assets.find(a => a.id === id);
      await apiService.disposalAsset(id, data);
      logAction('BAIXA DE PATRIMÔNIO', `PATRIMÔNIO: ${asset?.description || id}, TIPO: ${data.disposal_type}`);
      fetchData();
    } catch (err) {
      console.error('Error in asset disposal:', err);
    }
  };

  const deleteAsset = async (id: string | number) => {
    try {
      const asset = assets.find(a => a.id === id);
      await apiService.deleteAsset(id);
      logAction('EXCLUIR PATRIMÔNIO', `PATRIMÔNIO: ${asset?.description || id}`);
      fetchData();
    } catch (err) {
      console.error('Error deleting asset:', err);
    }
  };

  const handleDeleteAsset = async (id: string | number) => {
    showConfirm(
      'EXCLUIR PATRIMÔNIO',
      'TEM CERTEZA QUE DESEJA EXCLUIR ESTE PATRIMÔNIO? ESTA AÇÃO NÃO PODE SER DESFEITA.',
      () => deleteAsset(id)
    );
  };

  const addServiceEntry = async (data: any) => {
    try {
      await apiService.addServiceEntry(data);
      logAction('ADICIONAR ENTRADA DE SERVIÇO', `CLIENTE: ${data.client_name}, OBRA: ${data.obra}, VALOR: R$ ${data.valor}`);
      fetchData();
    } catch (err) {
      console.error('Error adding service entry:', err);
    }
  };

  const updateServiceEntry = async (id: string | number, data: any) => {
    try {
      await apiService.updateServiceEntry(id, data);
      logAction('ATUALIZAR ENTRADA DE SERVIÇO', `CLIENTE: ${data.client_name}, OBRA: ${data.obra}, VALOR: R$ ${data.valor}`);
      fetchData();
    } catch (err) {
      console.error('Error updating service entry:', err);
    }
  };

  const deleteServiceEntry = async (id: string | number) => {
    try {
      const entry = serviceEntries.find(e => e.id === id);
      await apiService.deleteServiceEntry(id);
      logAction('EXCLUIR ENTRADA DE SERVIÇO', `CLIENTE: ${entry?.client_name}, OBRA: ${entry?.obra}`);
      fetchData();
    } catch (err) {
      console.error('Error deleting service entry:', err);
    }
  };

  const addProduct = async (formData: FormData) => {
    try {
      await apiService.addProduct(formData);
      logAction('ADICIONAR PRODUTO', `PRODUTO: ${formData.get('name')}`);
      fetchData();
    } catch (err: any) {
      setGlobalError(err.message || 'Erro ao adicionar produto');
      console.error('Error adding product:', err);
    }
  };

  const addCategory = async (name: string) => {
    try {
      await apiService.addCategory(name);
      logAction('ADICIONAR CATEGORIA', `CATEGORIA: ${name}`);
      fetchData();
    } catch (err) {
      console.error('Error adding category:', err);
    }
  };

  const addUnit = async (name: string) => {
    try {
      await apiService.addUnit(name);
      logAction('ADICIONAR UNIDADE', `UNIDADE: ${name}`);
      fetchData();
    } catch (err) {
      console.error('Error adding unit:', err);
    }
  };

  const updateCategory = async (id: string | number, name: string) => {
    try {
      await apiService.updateCategory(id, name);
      logAction('ATUALIZAR CATEGORIA', `CATEGORIA: ${name}`);
      fetchData();
    } catch (err) {
      console.error('Error updating category:', err);
    }
  };

  const deleteCategory = async (id: string | number) => {
    try {
      const category = categories.find(c => c.id === id);
      await apiService.deleteCategory(id);
      logAction('EXCLUIR CATEGORIA', `CATEGORIA: ${category?.name || id}`);
      fetchData();
    } catch (err) {
      console.error('Error deleting category:', err);
    }
  };

  const updateUnit = async (id: string | number, name: string) => {
    try {
      await apiService.updateUnit(id, name);
      logAction('ATUALIZAR UNIDADE', `UNIDADE: ${name}`);
      fetchData();
    } catch (err) {
      console.error('Error updating unit:', err);
    }
  };

  const deleteUnit = async (id: string | number) => {
    try {
      const unit = units.find(u => u.id === id);
      await apiService.deleteUnit(id);
      logAction('EXCLUIR UNIDADE', `UNIDADE: ${unit?.name || id}`);
      fetchData();
    } catch (err) {
      console.error('Error deleting unit:', err);
    }
  };

  const addSupplier = async (data: any) => {
    const errors = validateEntityData(data, true);

    if (Object.keys(errors).length > 0) {
      setSupplierFieldErrors(errors);
      return;
    }
    try {
      const payload = typeof data === 'string' ? { name: data, contact: '', tipo: 'PF' } : data;
      
      // If it's a simple string (from quick add), we still check uniqueness
      if (typeof data === 'string') {
        const isDuplicate = suppliers.some(s => s.name?.toUpperCase() === data.toUpperCase());
        if (isDuplicate) {
          setGlobalError('FORNECEDOR JÁ CADASTRADO COM ESTE NOME');
          return;
        }
      }

      await apiService.addSupplier(payload);
      logAction('ADICIONAR FORNECEDOR', `FORNECEDOR: ${payload.name || payload.razao_social}`);
      fetchData();
      setIsSupplierModalOpen(false);
      setSupplierFieldErrors({});
    } catch (err: any) {
      setGlobalError(err.message || 'Erro ao adicionar fornecedor');
      console.error('Error adding supplier:', err);
    }
  };

  const addLocation = async (name: string) => {
    try {
      await apiService.addLocation(name);
      logAction('ADICIONAR LOCALIZAÇÃO', `LOCALIZAÇÃO: ${name}`);
      fetchData();
    } catch (err) {
      console.error('Error adding location:', err);
    }
  };

  const updateLocation = async (id: string | number, name: string) => {
    try {
      await apiService.updateLocation(id, name);
      fetchData();
    } catch (err) {
      console.error('Error updating location:', err);
    }
  };

  const handleStockIn = async (data: any) => {
    try {
      const product = products.find(p => p.id === parseInt(data.product_id));
      
      // Upload invoices if they are File objects
      let invoiceUrls = [];
      if (data.invoices && data.invoices.length > 0) {
        for (const file of data.invoices) {
          if (file instanceof File) {
            const url = await apiService.uploadFile(file);
            const name = file.type === 'application/pdf' ? file.name.replace(/\.pdf$/i, '.webp') : file.name;
            invoiceUrls.push({ name, url });
          } else {
            // If it's already an object with name and url/data (though in this flow it should be File)
            invoiceUrls.push(file);
          }
        }
      }

      const submissionData = {
        ...data,
        invoice_pdf: invoiceUrls.length > 0 ? JSON.stringify(invoiceUrls) : ''
      };
      // Remove the raw File objects from submissionData
      delete (submissionData as any).invoices;

      await apiService.stockIn(submissionData);
      logAction('ENTRADA DE ESTOQUE', `PRODUTO: ${product?.name || data.product_id}, QTD: ${data.quantity}`);
      fetchData();
    } catch (err: any) {
      setGlobalError(err.message || 'Erro ao processar entrada de estoque');
      console.error('Error in stock in:', err);
    }
  };

  const handleStockOut = async (data: any) => {
    try {
      const product = products.find(p => p.id === parseInt(data.product_id));
      await apiService.stockOut(data);
      logAction('SAÍDA DE ESTOQUE', `PRODUTO: ${product?.name || data.product_id}, QTD: ${data.quantity}, MOTIVO: ${data.reason}`);
      fetchData();
    } catch (err: any) {
      setGlobalError(err.message || 'Erro ao processar saída');
      console.error('Error in stock out:', err);
    }
  };

  const handleUpdateProduct = async (id: string | number, formData: FormData) => {
    try {
      await apiService.updateProduct(id, formData);
      logAction('ATUALIZAR PRODUTO', `PRODUTO: ${formData.get('name')}`);
      fetchData();
    } catch (err: any) {
      setGlobalError(err.message || 'Erro ao atualizar produto');
      console.error('Error updating product:', err);
    }
  };

  const deleteProduct = async (id: string | number) => {
    try {
      const product = products.find(p => p.id === id);
      await apiService.deleteProduct(id);
      logAction('EXCLUIR PRODUTO', `PRODUTO: ${product?.name || id}`);
      fetchData();
    } catch (err: any) {
      setGlobalError(err.message || 'Erro ao excluir produto');
      console.error('Error deleting product:', err);
    }
  };

  const handleDeleteProduct = async (id: string | number) => {
    showConfirm(
      'EXCLUIR PRODUTO',
      'TEM CERTEZA QUE DESEJA EXCLUIR ESTE PRODUTO? ESTA AÇÃO NÃO PODE SER DESFEITA.',
      () => deleteProduct(id)
    );
  };

  const renderContent = () => {
    if (!userPermissions.includes(activeTab as any)) {
      return (
        <div className="flex flex-col items-center justify-center h-full text-zinc-400 space-y-4">
          <ShieldCheck size={48} />
          <p className="text-sm font-bold uppercase tracking-widest">Acesso Restrito</p>
          <p className="text-xs uppercase">Você não tem permissão para acessar esta tela.</p>
          <Button onClick={() => {
            const firstAvailable = sidebarItems.find(item => userPermissions.includes(item.id as any));
            if (firstAvailable) setActiveTab(firstAvailable.id as any);
          }}>
            VOLTAR PARA INÍCIO
          </Button>
        </div>
      );
    }

    switch (activeTab) {
      case 'dashboard': return (
        <Dashboard 
          stats={stats} 
          isDarkMode={isDarkMode} 
          onNavigate={(tab, search) => {
            setActiveTab(tab);
            if (search !== undefined) setInventorySearchTerm(search);
          }} 
        />
      );
      case 'inventory': return (
        <Inventory 
          products={products} 
          categories={categories} 
          units={units}
          suppliers={suppliers}
          locations={locations}
          orders={orders}
          movements={movements}
          isAdmin={isAdmin}
          onAddProduct={addProduct} 
          onUpdateProduct={handleUpdateProduct}
          onDeleteProduct={deleteProduct}
          onAddCategory={addCategory} 
          onAddUnit={addUnit}
          onUpdateCategory={updateCategory}
          onAddSupplier={addSupplier}
          onAddLocation={addLocation}
          onUpdateLocation={updateLocation}
          onStockIn={handleStockIn}
          onStockOut={handleStockOut}
          initialSearchTerm={inventorySearchTerm}
          onSearchTermChange={setInventorySearchTerm}
        />
      );
      case 'production': return (
        <GenericList 
          title="ORDENS DE PRODUÇÃO" 
          hideTitle={true}
          items={orders} 
          columns={[
            { key: 'id', label: 'ID', mono: true },
            { key: 'title', label: 'TÍTULO' },
            { key: 'status', label: 'STATUS' },
            { key: 'client_name', label: 'CLIENTE' }
          ]} 
          onAdd={() => {
            setEditingOrder(null);
            setIsOrderModalOpen(true);
          }}
          addButtonLabel="NOVA ORDEM DE PRODUÇÃO"
          onItemClick={(order) => setSelectedOrderForDetail(order)}
        />
      );
      case 'kanban': return (
        <Kanban 
          orders={orders} 
          serviceEntries={serviceEntries}
          onUpdateStatus={updateOrderStatus} 
          onEdit={(order) => {
            setEditingOrder(order);
            setIsOrderModalOpen(true);
            setSelectedOrderForDetail(null);
          }}
          onDelete={handleDeleteOrder}
          onAdd={() => {
            setEditingOrder(null);
            setIsOrderModalOpen(true);
          }}
          onItemClick={(order) => setSelectedOrderForDetail(order)}
          onError={setGlobalError}
          isAdmin={isAdmin}
        />
      );
      case 'service_entry': return (
        <ServiceEntry 
          serviceEntries={serviceEntries}
          clients={clients}
          isAdmin={isAdmin}
          currentUserId={user?.uid}
          onAdd={addServiceEntry}
          onUpdate={updateServiceEntry}
          onDelete={deleteServiceEntry}
          onMenuClick={handleGenericMenuClick}
          isModalOpen={isServiceEntryModalOpen}
          setIsModalOpen={setIsServiceEntryModalOpen}
          editingEntry={editingServiceEntry}
          setEditingEntry={setEditingServiceEntry}
        />
      );
      case 'clients': return (
        <GenericList 
          title="CLIENTES" 
          hideTitle={true}
          items={clients.map(c => ({
            ...c,
            display_name: c.tipo_cliente === 'PF' ? c.name : c.razao_social,
            document: c.tipo_cliente === 'PF' ? c.cpf : c.cnpj
          }))} 
          columns={[
            { key: 'tipo_cliente', label: 'TIPO' },
            { key: 'display_name', label: 'NOME / RAZÃO SOCIAL' },
            { key: 'document', label: 'CPF / CNPJ' },
            { key: 'email', label: 'E-MAIL' },
            { key: 'telefone1', label: 'TELEFONE' },
            { key: 'cidade', label: 'CIDADE' }
          ]} 
          onAdd={() => {
            setEditingClient(null);
            setIsClientModalOpen(true);
          }}
          addButtonLabel="NOVO CLIENTE"
          onItemClick={(client) => {
            setEditingClient(client);
            setIsClientModalOpen(true);
          }}
          showActions={true}
          onMenuClick={handleGenericMenuClick}
        />
      );
      case 'suppliers': return (
        <GenericList 
          title="FORNECEDORES" 
          hideTitle={true}
          items={suppliers.map(s => ({
            ...s,
            display_name: s.tipo === 'PF' ? s.name : s.razao_social,
            document: s.tipo === 'PF' ? s.cpf : s.cnpj
          }))} 
          columns={[
            { key: 'tipo', label: 'TIPO' },
            { key: 'display_name', label: 'NOME / RAZÃO SOCIAL' },
            { key: 'document', label: 'CPF / CNPJ' },
            { key: 'email', label: 'E-MAIL' },
            { key: 'telefone1', label: 'TELEFONE' },
            { key: 'cidade', label: 'CIDADE' }
          ]} 
          onAdd={() => {
            setEditingSupplier(null);
            setIsSupplierModalOpen(true);
          }}
          addButtonLabel="NOVO FORNECEDOR"
          onItemClick={(supplier) => {
            setEditingSupplier(supplier);
            setIsSupplierModalOpen(true);
          }}
          showActions={true}
          onMenuClick={handleGenericMenuClick}
        />
      );
      case 'assets': return (
        <Assets 
          assets={assets}
          categories={categories}
          hideTitle={true}
          isAdmin={isAdmin}
          onAddAsset={addAsset}
          onUpdateAsset={updateAsset}
          onDeleteAsset={deleteAsset}
          onDisposalAsset={handleDisposalAsset}
        />
      );
      case 'financial': return (
        <GenericList 
          title="FINANCEIRO (ENTRADAS DE ESTOQUE)" 
          hideTitle={true}
          showAddButton={false}
          showActions={false}
          items={financialEntries.map(e => ({
            ...e,
            total_value: `R$ ${(e.quantity * e.unit_price).toFixed(2)}`,
            unit_price_fmt: `R$ ${e.unit_price.toFixed(2)}`,
            issue_date_fmt: e.issue_date ? new Date(e.issue_date + 'T12:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' }) : '-',
            date_fmt: new Date(e.date).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })
          }))} 
          columns={[
            { key: 'issue_date_fmt', label: 'DATA EMISSÃO' },
            { key: 'date_fmt', label: 'DATA MOVIMENTO' },
            { key: 'doc_number', label: 'DOC. FISCAL' },
            { key: 'supplier_name', label: 'FORNECEDOR' },
            { key: 'product_name', label: 'PRODUTO' },
            { key: 'quantity', label: 'QUANTIDADE' },
            { key: 'unit_price_fmt', label: 'V. UNITÁRIO' },
            { key: 'total_value', label: 'V. TOTAL' }
          ]} 
          onItemClick={(entry) => setSelectedFinancialEntry(entry)}
        />
      );
      case 'audit': return (
        <GenericList 
          title="HISTÓRICO DE AÇÕES NO SISTEMA" 
          hideTitle={true}
          showAddButton={false}
          showActions={false}
          items={auditLogs.map(l => ({
            ...l,
            created_at_fmt: new Date(l.created_at).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })
          }))} 
          columns={[
            { key: 'created_at_fmt', label: 'DATA/HORA' },
            { key: 'user_name', label: 'USUÁRIO' },
            { key: 'action', label: 'AÇÃO' },
            { key: 'details', label: 'DETALHES' }
          ]} 
        />
      );
      case 'settings': return (
        <SettingsView 
          users={systemUsers}
          currentUserEmail={user?.email}
          categories={categories}
          units={units}
          onAddUser={async (data) => {
            await apiService.addUser(data);
            fetchData();
          }}
          onUpdateUser={async (id, data) => {
            await apiService.updateUser(id, data);
            fetchData();
          }}
          onDeleteUser={async (id) => {
            await apiService.deleteUser(id);
            fetchData();
          }}
          onUpdateCategory={updateCategory}
          onDeleteCategory={deleteCategory}
          onUpdateUnit={updateUnit}
          onDeleteUnit={deleteUnit}
        />
      );
      default: return <div className="flex items-center justify-center h-64 text-zinc-400">Em desenvolvimento...</div>;
    }
  };

  if (!isAuthReady) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-50 dark:bg-zinc-950">
        <Loader2 className="animate-spin text-zinc-900 dark:text-white" size={40} />
      </div>
    );
  }

  if (!user) {
    return <Login onLogin={() => fetchData()} />;
  }

  return (
    <>
      <div id="portrait-warning">
        <div className="bg-zinc-800/50 p-6 rounded-3xl border border-zinc-700/50 shadow-2xl backdrop-blur-xl">
          <div className="w-20 h-20 bg-zinc-100 rounded-2xl flex items-center justify-center mx-auto mb-6 animate-bounce">
            <RotateCcw className="text-zinc-900" size={40} />
          </div>
          <h2 className="text-2xl font-bold mb-3 uppercase">Gire seu dispositivo</h2>
          <p className="text-zinc-400 text-sm max-w-[240px] mx-auto leading-relaxed uppercase">
            Esta aplicação foi otimizada para visualização em modo <span className="text-white font-semibold">paisagem (deitado)</span> para oferecer a melhor experiência de gestão.
          </p>
        </div>
      </div>

      <div className="flex h-screen bg-white font-sans text-zinc-900 dark:bg-black dark:text-zinc-100 transition-colors duration-300">
      {/* Mobile Overlay */}
      <AnimatePresence>
        {isSidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsSidebarOpen(false)}
            className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <aside className={cn(
        "fixed inset-y-0 left-0 z-50 bg-white border-r border-zinc-200 transition-all duration-300 lg:relative lg:translate-x-0 dark:bg-zinc-950 dark:border-zinc-800 flex-shrink-0",
        isSidebarCollapsed ? "w-20" : "w-64 md:w-56 lg:w-64",
        !isSidebarOpen && "-translate-x-full lg:translate-x-0"
      )}>
        <div className="flex flex-col h-full overflow-hidden">
          <div className={cn("p-6 flex items-center justify-between", isSidebarCollapsed && "px-0 justify-center")}>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-zinc-900 rounded-lg flex items-center justify-center dark:bg-zinc-100 flex-shrink-0">
                <Package className="text-white dark:text-zinc-900" size={20} />
              </div>
              {!isSidebarCollapsed && <span className="font-bold text-lg tracking-tight dark:text-white truncate">SkySmart</span>}
            </div>
            {!isSidebarCollapsed && (
              <button onClick={() => setIsSidebarOpen(false)} className="lg:hidden text-zinc-400 dark:text-zinc-500">
                <X size={20} />
              </button>
            )}
          </div>

          <nav className="flex-1 px-4 space-y-1 overflow-y-auto custom-scrollbar overflow-x-hidden">
            {visibleSidebarItems.map((item) => (
              <SidebarItem 
                key={item.id}
                icon={item.icon} 
                label={item.label} 
                active={activeTab === item.id} 
                isCollapsed={isSidebarCollapsed} 
                onClick={() => { setActiveTab(item.id as any); setIsSidebarOpen(false); }} 
              />
            ))}
          </nav>

          <div className="p-4 border-t border-zinc-100 dark:border-zinc-800">
            <div className={cn("flex items-center gap-3 px-2 py-3 rounded-lg bg-zinc-50 dark:bg-zinc-900/50", isSidebarCollapsed && "justify-center px-0")}>
              {user?.photoURL ? (
                <img src={user.photoURL} alt={user.displayName || ''} className="w-8 h-8 rounded-full flex-shrink-0" referrerPolicy="no-referrer" />
              ) : (
                <div className="w-8 h-8 rounded-full bg-zinc-200 dark:bg-zinc-700 flex items-center justify-center text-xs font-bold text-zinc-600 dark:text-zinc-300 flex-shrink-0">
                  {user?.displayName?.charAt(0) || 'U'}
                </div>
              )}
              {!isSidebarCollapsed && (
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100 truncate uppercase">{user?.displayName || 'Usuário'}</p>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 truncate">{user?.email}</p>
                </div>
              )}
              {!isSidebarCollapsed && (
                <button 
                  onClick={() => signOut(auth)}
                  className="p-1.5 text-zinc-400 hover:text-rose-500 transition-colors"
                  title="Sair"
                >
                  <X size={18} />
                </button>
              )}
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        <AnimatePresence>
          {globalError && (
            <div className="absolute top-4 left-1/2 -translate-x-1/2 z-[500] w-full max-w-md px-4">
              <ErrorAlert className="shadow-2xl border-rose-200 dark:border-rose-500/30">
                <div className="flex items-center justify-between w-full">
                  <span>{globalError}</span>
                  <button onClick={() => setGlobalError(null)} className="ml-2 hover:text-rose-800 dark:hover:text-rose-200">
                    <X size={14} />
                  </button>
                </div>
              </ErrorAlert>
            </div>
          )}
        </AnimatePresence>
        <header className="h-16 bg-white border-b border-zinc-200 flex items-center justify-between px-6 flex-shrink-0 dark:bg-zinc-950 dark:border-zinc-800">
          <div className="flex items-center gap-4">
            <button onClick={() => setIsSidebarOpen(true)} className="lg:hidden text-zinc-400 dark:text-zinc-500">
              <Menu size={20} />
            </button>
            <h1 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
              {activeTab === 'dashboard' && 'PAINEL'}
              {activeTab === 'kanban' && 'KANBAN'}
              {activeTab === 'service_entry' && 'ENTRADA DE SERVIÇO'}
              {activeTab === 'production' && 'ORDENS DE PRODUÇÃO'}
              {activeTab === 'clients' && 'CLIENTES'}
              {activeTab === 'suppliers' && 'FORNECEDORES'}
              {activeTab === 'assets' && 'PATRIMÔNIOS'}
              {activeTab === 'inventory' && 'ESTOQUE'}
              {activeTab === 'financial' && 'FINANCEIRO'}
              {activeTab === 'settings' && 'CONFIGURAÇÕES'}
              {activeTab === 'audit' && 'HISTÓRICO DE AÇÕES'}
            </h1>
          </div>
          <div className="flex items-center gap-4">
            <button 
              onClick={() => fetchData()}
              disabled={isFetching}
              className={cn(
                "flex items-center gap-2 px-3 py-1.5 bg-zinc-100 dark:bg-zinc-800 rounded-full text-xs font-medium text-zinc-600 dark:text-zinc-400 uppercase transition-all hover:bg-zinc-200 dark:hover:bg-zinc-700",
                isFetching && "opacity-50 cursor-not-allowed"
              )}
            >
              <RotateCcw className={cn("w-3 h-3", isFetching && "animate-spin")} />
              {isFetching ? 'Atualizando...' : 'Atualizar Dados'}
            </button>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-6" ref={mainContentRef}>
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              {renderContent()}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>

      <OrderModal 
        isOpen={isOrderModalOpen}
        onClose={() => {
          setIsOrderModalOpen(false);
          setEditingOrder(null);
        }}
        onSubmit={(data) => {
          if (editingOrder) {
            updateOrder(editingOrder.id, data);
          } else {
            addOrder(data);
          }
        }}
        editingOrder={editingOrder}
        clients={clients}
        orders={orders}
        serviceEntries={serviceEntries}
        productionProducts={productionProducts}
        onAddProductionProduct={async (name) => {
          await apiService.addProductionProduct(name);
          fetchData();
        }}
      />

      <OrderDetailModal 
        isOpen={!!selectedOrderForDetail}
        onClose={() => setSelectedOrderForDetail(null)}
        order={selectedOrderForDetail}
        isAdmin={isAdmin}
        onEdit={(order) => {
          setEditingOrder(order);
          setIsOrderModalOpen(true);
          setSelectedOrderForDetail(null);
        }}
        onDelete={handleDeleteOrder}
        onUpdate={fetchData}
      />

      <ClientModal 
        isOpen={isClientModalOpen}
        onClose={() => {
          setIsClientModalOpen(false);
          setEditingClient(null);
          setClientFieldErrors({});
        }}
        onSubmit={(data) => {
          if (editingClient) {
            updateClient(editingClient.id, data);
          } else {
            addClient(data);
          }
        }}
        editingClient={editingClient}
        fieldErrors={clientFieldErrors}
      />

      <SupplierModal 
        isOpen={isSupplierModalOpen}
        onClose={() => {
          setIsSupplierModalOpen(false);
          setEditingSupplier(null);
          setSupplierFieldErrors({});
        }}
        onSubmit={(data) => {
          if (editingSupplier) {
            updateSupplierEntity(editingSupplier.id, data);
          } else {
            addSupplier(data);
          }
        }}
        editingSupplier={editingSupplier}
        fieldErrors={supplierFieldErrors}
      />

      <AssetModal 
        isOpen={isAssetModalOpen}
        onClose={() => {
          setIsAssetModalOpen(false);
          setEditingAsset(null);
        }}
        onSave={(data) => {
          if (editingAsset) {
            updateAsset(editingAsset.id, data);
          } else {
            addAsset(data);
          }
        }}
        asset={editingAsset}
        categories={categories}
        fieldErrors={assetFieldErrors}
      />

      <AnimatePresence>
        {activeGenericMenuId && genericMenuPosition && (
          <>
            <div className="fixed inset-0 z-[150]" onClick={() => setActiveGenericMenuId(null)} />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              style={{ top: genericMenuPosition.top, left: genericMenuPosition.left }}
              className="absolute w-40 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-xl z-[160] overflow-hidden p-1"
            >
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  if (activeTab === 'production') {
                    const item = orders.find(o => o.id === activeGenericMenuId);
                    if (item) {
                      setEditingOrder(item);
                      setIsOrderModalOpen(true);
                    }
                  } else if (activeTab === 'service_entry') {
                    const item = serviceEntries.find(s => s.id === activeGenericMenuId);
                    if (item) {
                      setEditingServiceEntry(item);
                      setIsServiceEntryModalOpen(true);
                    }
                  } else if (activeTab === 'clients') {
                    const item = clients.find(c => c.id === activeGenericMenuId);
                    if (item) {
                      setEditingClient(item);
                      setIsClientModalOpen(true);
                    }
                  } else if (activeTab === 'suppliers') {
                    const item = suppliers.find(s => s.id === activeGenericMenuId);
                    if (item) {
                      setEditingSupplier(item);
                      setIsSupplierModalOpen(true);
                    }
                  } else if (activeTab === 'assets') {
                    const item = assets.find(a => a.id === activeGenericMenuId);
                    if (item) {
                      setEditingAsset(item);
                      setIsAssetModalOpen(true);
                    }
                  }
                  setActiveGenericMenuId(null);
                }}
                className={cn(
                  "flex items-center gap-2 w-full px-3 py-2 text-xs font-medium rounded-lg transition-colors",
                  ['production', 'service_entry', 'clients', 'suppliers', 'assets'].includes(activeTab)
                    ? "text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800" 
                    : "text-zinc-300 dark:text-zinc-600 cursor-not-allowed"
                )}
                disabled={!['production', 'service_entry', 'clients', 'suppliers', 'assets'].includes(activeTab)}
              >
                <Edit size={14} />
                EDITAR
              </button>
              {isAdmin && (
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    const idToDelete = activeGenericMenuId;
                    const title = activeTab === 'production' ? 'EXCLUIR ORDEM' :
                                  activeTab === 'service_entry' ? 'EXCLUIR ENTRADA' :
                                  activeTab === 'clients' ? 'EXCLUIR CLIENTE' :
                                  activeTab === 'suppliers' ? 'EXCLUIR FORNECEDOR' : 'EXCLUIR ITEM';
                    
                    showConfirm(
                      title,
                      'TEM CERTEZA QUE DESEJA EXCLUIR ESTE ITEM? ESTA AÇÃO NÃO PODE SER DESFEITA.',
                      () => {
                        if (activeTab === 'production') deleteOrder(idToDelete!);
                        else if (activeTab === 'service_entry') deleteServiceEntry(idToDelete!);
                        else if (activeTab === 'clients') deleteClient(idToDelete!);
                        else if (activeTab === 'suppliers') deleteSupplier(idToDelete!);
                        else if (activeTab === 'assets') deleteAsset(idToDelete!);
                      }
                    );
                    setActiveGenericMenuId(null);
                  }}
                  className="flex items-center gap-2 w-full px-3 py-2 text-xs font-medium text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-lg transition-colors"
                >
                  <Trash2 size={14} />
                  EXCLUIR
                </button>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
      <FinancialDetailModal 
        isOpen={!!selectedFinancialEntry}
        onClose={() => setSelectedFinancialEntry(null)}
        entry={selectedFinancialEntry}
      />

      <ConfirmModal 
        isOpen={confirmModal.isOpen}
        onClose={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
        onConfirm={confirmModal.onConfirm}
        title={confirmModal.title}
        message={confirmModal.message}
        variant={confirmModal.variant}
      />
    </>
  );
}
