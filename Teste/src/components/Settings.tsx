import React, { useState, useRef } from 'react';
import { Download, ShieldCheck, Database as DbIcon, Loader2, Upload, Users as UsersIcon, Plus, Edit, Trash2, Key } from 'lucide-react';
import { Card, ConfirmModal, ErrorAlert, Modal, Input, Select, Button, cn } from './Common';
import { motion, AnimatePresence } from 'motion/react';
import { apiService } from '../services/apiService';
import { User, Permission } from '../types';

const PERMISSIONS_LIST: { id: Permission; label: string }[] = [
  { id: 'dashboard', label: 'PAINEL / DASHBOARD' },
  { id: 'kanban', label: 'KANBAN DE PRODUÇÃO' },
  { id: 'service_entry', label: 'ENTRADA DE SERVIÇO' },
  { id: 'production', label: 'ORDENS DE PRODUÇÃO' },
  { id: 'clients', label: 'GESTÃO DE CLIENTES' },
  { id: 'suppliers', label: 'GESTÃO DE FORNECEDORES' },
  { id: 'assets', label: 'GESTÃO DE PATRIMÔNIOS' },
  { id: 'inventory', label: 'CONTROLE DE ESTOQUE' },
  { id: 'financial', label: 'CONTROLE FINANCEIRO' },
  { id: 'settings', label: 'CONFIGURAÇÕES DO SISTEMA' },
  { id: 'audit', label: 'HISTÓRICO DE AÇÕES' },
];

interface SettingsProps {
  users: User[];
  onAddUser: (data: any) => Promise<void>;
  onUpdateUser: (id: string | number, data: any) => Promise<void>;
  onDeleteUser: (id: string | number) => Promise<void>;
}

export const Settings = ({ users, onAddUser, onUpdateUser, onDeleteUser }: SettingsProps) => {
  const [isBackingUp, setIsBackingUp] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [showConfirmRestore, setShowConfirmRestore] = useState(false);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // User Management State
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [userFormData, setUserFormData] = useState({
    name: '',
    username: '',
    password: '',
    role: 'Usuário',
    permissions: [] as Permission[]
  });
  const [isDeletingUser, setIsDeletingUser] = useState<User | null>(null);
  const [isSavingUser, setIsSavingUser] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  const handleSyncUsers = async () => {
    setIsSyncing(true);
    setError(null);
    try {
      let successCount = 0;
      for (const user of users) {
        if (user.username && user.password) {
          try {
            await apiService.syncUserWithAuth(user.username, user.password);
            successCount++;
          } catch (e) {
            console.error(`Error syncing ${user.username}:`, e);
          }
        }
      }
      alert(`Sincronização concluída! ${successCount} usuários processados.`);
    } catch (err: any) {
      setError('Erro na sincronização: ' + err.message);
    } finally {
      setIsSyncing(false);
    }
  };

  const handleBackup = async () => {
    setIsBackingUp(true);
    setError(null);
    try {
      const response = await fetch('/api/backup');
      if (!response.ok) throw new Error('Falha ao baixar backup');
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      const date = new Date().toISOString().split('T')[0];
      link.setAttribute('download', `backup_skysmart_${date}.zip`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Erro no backup:', error);
      setError('Erro ao realizar backup do banco de dados.');
    } finally {
      setIsBackingUp(false);
    }
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.zip')) {
      setError('Por favor, selecione um arquivo .zip de backup válido.');
      return;
    }

    setPendingFile(file);
    setShowConfirmRestore(true);
    e.target.value = '';
  };

  const confirmRestore = async () => {
    if (!pendingFile) return;

    setIsImporting(true);
    setShowConfirmRestore(false);
    setError(null);
    try {
      await apiService.importDatabase(pendingFile);
      window.location.reload();
    } catch (error: any) {
      console.error('Erro na importação:', error);
      setError('Erro ao importar banco de dados: ' + error.message);
    } finally {
      setIsImporting(false);
      setPendingFile(null);
    }
  };

  const handleUserSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingUser(true);
    try {
      // Ensure email is set based on username for Auth matching
      const userData = {
        ...userFormData,
        email: userFormData.username.includes('@') 
          ? userFormData.username 
          : `${userFormData.username.toLowerCase().trim()}@skysmart.com`
      };

      if (editingUser) {
        await onUpdateUser(editingUser.id, userData);
      } else {
        await onAddUser(userData);
      }
      setIsUserModalOpen(false);
      setEditingUser(null);
      setUserFormData({ name: '', username: '', password: '', role: 'Almoxarifado', permissions: [] });
    } catch (err: any) {
      setError('Erro ao salvar usuário: ' + err.message);
    } finally {
      setIsSavingUser(false);
    }
  };

  const handleEditUser = (user: User) => {
    setEditingUser(user);
    setUserFormData({
      name: user.name,
      username: (user as any).username || '',
      password: (user as any).password || '',
      role: user.role || 'Usuário',
      permissions: user.permissions || []
    });
    setIsUserModalOpen(true);
  };

  const handleDeleteUser = async () => {
    if (!isDeletingUser) return;
    try {
      await onDeleteUser(isDeletingUser.id);
      setIsDeletingUser(null);
    } catch (err: any) {
      setError('Erro ao excluir usuário: ' + err.message);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-1">
        <h2 className="text-2xl font-bold tracking-tight uppercase">Configurações</h2>
        <p className="text-zinc-500 dark:text-zinc-400 uppercase">Gerencie as preferências e segurança do sistema.</p>
      </div>

      {error && <ErrorAlert className="max-w-2xl">{error}</ErrorAlert>}

      <div className="max-w-4xl space-y-6">
        {/* User Management Section */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-zinc-100 dark:bg-zinc-800 rounded-2xl flex items-center justify-center flex-shrink-0">
                <UsersIcon className="text-zinc-900 dark:text-zinc-100" size={24} />
              </div>
              <div>
                <h3 className="text-lg font-bold uppercase">GESTÃO DE USUÁRIOS</h3>
                <p className="text-sm text-zinc-500 dark:text-zinc-400 uppercase">CONTROLE QUEM TEM ACESSO AO SISTEMA E SUAS PERMISSÕES.</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button 
                variant="secondary" 
                onClick={handleSyncUsers} 
                disabled={isSyncing}
                className="flex items-center gap-2"
              >
                {isSyncing ? <Loader2 className="animate-spin" size={18} /> : <ShieldCheck size={18} />}
                SINCRONIZAR AUTH
              </Button>
              <Button onClick={() => {
                setEditingUser(null);
                setUserFormData({ 
                  name: '', 
                  username: '', 
                  password: '', 
                  role: 'Usuário',
                  permissions: []
                });
                setIsUserModalOpen(true);
              }} className="flex items-center gap-2">
                <Plus size={18} />
                NOVO USUÁRIO
              </Button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-zinc-100 dark:border-zinc-800">
                  <th className="py-3 px-4 text-[10px] font-bold text-zinc-400 uppercase tracking-widest">NOME</th>
                  <th className="py-3 px-4 text-[10px] font-bold text-zinc-400 uppercase tracking-widest">USUÁRIO</th>
                  <th className="py-3 px-4 text-[10px] font-bold text-zinc-400 uppercase tracking-widest">CARGO/PERMISSÃO</th>
                  <th className="py-3 px-4 text-[10px] font-bold text-zinc-400 uppercase tracking-widest text-right">AÇÕES</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user.id} className="border-b border-zinc-50 dark:border-zinc-900/50 hover:bg-zinc-50/50 dark:hover:bg-zinc-900/30 transition-colors">
                    <td className="py-3 px-4 text-sm font-medium uppercase">{user.name}</td>
                    <td className="py-3 px-4 text-sm text-zinc-500 dark:text-zinc-400 uppercase">{(user as any).username || '-'}</td>
                    <td className="py-3 px-4">
                      <div className="flex flex-wrap gap-1">
                        {user.permissions && user.permissions.length > 0 ? (
                          user.permissions.length === PERMISSIONS_LIST.length ? (
                            <span className="px-2 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider bg-zinc-900 text-white dark:bg-white dark:text-zinc-900">
                              ACESSO TOTAL
                            </span>
                          ) : (
                            <span className="px-2 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400">
                              {user.permissions.length} TELAS
                            </span>
                          )
                        ) : (
                          <span className="px-2 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider bg-rose-50 text-rose-600 dark:bg-rose-500/10 dark:text-rose-400">
                            SEM ACESSO
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button 
                          onClick={() => handleEditUser(user)}
                          className="p-2 text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors"
                        >
                          <Edit size={16} />
                        </button>
                        <button 
                          onClick={() => setIsDeletingUser(user)}
                          className="p-2 text-zinc-400 hover:text-rose-600 transition-colors"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {users.length === 0 && (
                  <tr>
                    <td colSpan={4} className="py-8 text-center text-zinc-400 text-sm uppercase italic">NENHUM USUÁRIO CADASTRADO</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="p-6">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-zinc-100 dark:bg-zinc-800 rounded-2xl flex items-center justify-center flex-shrink-0">
              <DbIcon className="text-zinc-900 dark:text-zinc-100" size={24} />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-bold mb-1 uppercase">Backup do Banco de Dados</h3>
              <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-6 uppercase">
                Baixe uma cópia completa do banco de dados em formato comprimido (.zip). 
              </p>
              
              <button
                onClick={handleBackup}
                disabled={isBackingUp}
                className="flex items-center gap-2 px-4 py-2 bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 rounded-xl font-bold text-sm hover:opacity-90 transition-opacity disabled:opacity-50 uppercase"
              >
                {isBackingUp ? (
                  <Loader2 className="animate-spin" size={18} />
                ) : (
                  <Download size={18} />
                )}
                {isBackingUp ? 'GERANDO BACKUP...' : 'BAIXAR BACKUP (.ZIP)'}
              </button>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-rose-50 dark:bg-rose-500/10 rounded-2xl flex items-center justify-center flex-shrink-0">
              <Upload className="text-rose-600 dark:text-rose-400" size={24} />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-bold mb-1 uppercase">Importar Banco de Dados</h3>
              <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-6 uppercase">
                Restaure o sistema a partir de um arquivo de backup (.zip). <span className="text-rose-600 font-bold">AVISO: Isso substituirá todos os dados atuais!</span>
              </p>
              
              <input 
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept=".zip"
                className="hidden"
              />

              <button
                onClick={handleImportClick}
                disabled={isImporting}
                className="flex items-center gap-2 px-4 py-2 bg-rose-600 text-white rounded-xl font-bold text-sm hover:bg-rose-700 transition-colors disabled:opacity-50 uppercase"
              >
                {isImporting ? (
                  <Loader2 className="animate-spin" size={18} />
                ) : (
                  <Upload size={18} />
                )}
                {isImporting ? 'IMPORTANDO...' : 'IMPORTAR BACKUP (.ZIP)'}
              </button>
            </div>
          </div>
        </Card>
      </div>
    </div>

    <Modal 
        isOpen={isUserModalOpen} 
        onClose={() => setIsUserModalOpen(false)} 
        title={editingUser ? 'EDITAR USUÁRIO' : 'NOVO USUÁRIO'}
      >
        <form onSubmit={handleUserSubmit} className="p-6 space-y-4">
          <Input 
            label="Nome Completo"
            value={userFormData.name}
            onChange={(e: any) => setUserFormData({ ...userFormData, name: e.target.value.toUpperCase() })}
            placeholder="EX: JOÃO DA SILVA"
            required
          />
          <div className="grid grid-cols-2 gap-4">
            <Input 
              label="Usuário (Login)"
              value={userFormData.username}
              onChange={(e: any) => setUserFormData({ ...userFormData, username: e.target.value })}
              placeholder="EX: joao.silva"
              required
            />
            <Input 
              label="Senha"
              type="password"
              value={userFormData.password}
              onChange={(e: any) => setUserFormData({ ...userFormData, password: e.target.value })}
              placeholder="••••••••"
              required
            />
          </div>
          <div className="space-y-3">
            <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest ml-1">Permissões de Acesso</label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-4 bg-zinc-50 dark:bg-zinc-800/50 rounded-2xl border border-zinc-100 dark:border-zinc-800">
              {PERMISSIONS_LIST.map((perm) => (
                <label key={perm.id} className="flex items-center gap-3 cursor-pointer group">
                  <div className="relative flex items-center">
                    <input 
                      type="checkbox"
                      className="peer h-5 w-5 appearance-none rounded-md border border-zinc-300 dark:border-zinc-700 checked:bg-zinc-900 dark:checked:bg-zinc-100 transition-all cursor-pointer"
                      checked={userFormData.permissions.includes(perm.id)}
                      onChange={(e) => {
                        const newPerms = e.target.checked 
                          ? [...userFormData.permissions, perm.id]
                          : userFormData.permissions.filter(p => p !== perm.id);
                        setUserFormData({ ...userFormData, permissions: newPerms });
                      }}
                    />
                    <div className="absolute text-white dark:text-zinc-900 opacity-0 peer-checked:opacity-100 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </div>
                  </div>
                  <span className="text-xs font-bold text-zinc-600 dark:text-zinc-400 group-hover:text-zinc-900 dark:group-hover:text-zinc-100 transition-colors uppercase tracking-tight">
                    {perm.label}
                  </span>
                </label>
              ))}
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-4">
            <Button variant="secondary" onClick={() => setIsUserModalOpen(false)}>Cancelar</Button>
            <Button type="submit" isLoading={isSavingUser}>Salvar Usuário</Button>
          </div>
        </form>
      </Modal>

      <ConfirmModal 
        isOpen={!!isDeletingUser}
        onClose={() => setIsDeletingUser(null)}
        onConfirm={handleDeleteUser}
        title="EXCLUIR USUÁRIO"
        message={`Tem certeza que deseja excluir o usuário ${isDeletingUser?.name}? Esta ação não pode ser desfeita.`}
        confirmText="EXCLUIR"
        variant="danger"
      />

      <ConfirmModal 
        isOpen={showConfirmRestore}
        onClose={() => setShowConfirmRestore(false)}
        onConfirm={confirmRestore}
        title="RESTAURAR BACKUP"
        message="ATENÇÃO: A importação irá SUBSTITUIR TODO o banco de dados atual. Esta ação não pode ser desfeita. Deseja continuar?"
        confirmText="RESTAURAR AGORA"
        cancelText="CANCELAR"
        variant="danger"
        isLoading={isImporting}
      />
    </div>
  );
};
