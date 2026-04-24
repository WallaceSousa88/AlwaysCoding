import React, { useState } from 'react';
import { Key, ShieldCheck, User as UserIcon, X, Loader2, LogOut, Check, Eye, EyeOff } from 'lucide-react';
import { Modal, Input, Button, ErrorAlert } from './Common';
import { auth, db } from '../firebase';
import { updatePassword, signOut } from 'firebase/auth';
import { doc, updateDoc, collection, query, where, getDocs, deleteField } from 'firebase/firestore';
import { User } from '../types';
import { motion, AnimatePresence } from 'motion/react';

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: User | null;
  firebaseUser: any;
}

export const ProfileModal = ({ isOpen, onClose, currentUser, firebaseUser }: ProfileModalProps) => {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const isMasterAdmin = firebaseUser?.email === 'admin@skysmart.com' || firebaseUser?.email === 'Diesel.087@gmail.com';

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isMasterAdmin) return;
    
    if (newPassword.length < 6) {
      setError('A SENHA DEVE TER NO MÍNIMO 6 CARACTERES.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('AS SENHAS NÃO CONFEREM.');
      return;
    }

    setIsLoading(true);
    setError(null);
    setSuccess(false);

    try {
      // 1. Update in Firebase Auth
      await updatePassword(firebaseUser, newPassword);

      // 2. Update in Firestore users collection (if found)
      if (currentUser?.id) {
        await updateDoc(doc(db, 'users', String(currentUser.id)), {
          last_password_change: new Date().toISOString(),
          password: deleteField() // Ensure no plain text password exists
        });
      } else {
        // Find user by email/username if ID not available
        const q = query(collection(db, 'users'), where('email', '==', firebaseUser.email));
        const snap = await getDocs(q);
        if (!snap.empty) {
          await updateDoc(snap.docs[0].ref, {
            last_password_change: new Date().toISOString(),
            password: deleteField() // Ensure no plain text password exists
          });
        }
      }

      setSuccess(true);
      setNewPassword('');
      setConfirmPassword('');
      
      // Auto-close success message after 3 seconds
      setTimeout(() => {
        setSuccess(false);
      }, 3000);

    } catch (err: any) {
      console.error('Password update error:', err);
      if (err.code === 'auth/requires-recent-login') {
        setError('POR SEGURANÇA, REALIZE LOGIN NOVAMENTE PARA ALTERAR SUA SENHA.');
      } else {
        setError('FALHA AO ATUALIZAR SENHA. TENTE NOVAMENTE.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      window.location.reload();
    } catch (err) {
      console.error('Logout error:', err);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="MINHA CONTA">
      <div className="p-6 space-y-6">
        {/* User Info Card */}
        <div className="flex items-center gap-4 p-4 bg-zinc-50 dark:bg-zinc-900 rounded-2xl border border-zinc-100 dark:border-zinc-800">
          <div className="w-12 h-12 bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 rounded-xl flex items-center justify-center font-bold text-lg">
            {currentUser?.name?.charAt(0) || firebaseUser?.email?.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-zinc-900 dark:text-white uppercase truncate">
              {currentUser?.name || 'Usuário'}
            </p>
            <p className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold">
              {currentUser?.role || 'Acesso Limitado'}
            </p>
          </div>
          <button 
            onClick={handleLogout}
            className="p-2 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-lg transition-colors group"
            title="SAIR DO SISTEMA"
          >
            <LogOut size={20} className="group-hover:scale-110 transition-transform" />
          </button>
        </div>

        {/* Password Change Section */}
        {!isMasterAdmin ? (
          <div className="space-y-4 pt-2 border-t border-zinc-100 dark:border-zinc-800">
            <div className="flex items-center gap-2 mb-2">
              <Key size={16} className="text-zinc-400" />
              <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-[0.2em]">Alterar Minha Senha</h3>
            </div>

            <form onSubmit={handleChangePassword} className="space-y-4">
              {error && <ErrorAlert>{error}</ErrorAlert>}
              
              <AnimatePresence>
                {success && (
                  <motion.div 
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-100 dark:border-emerald-500/20 p-3 rounded-xl flex items-center gap-3"
                  >
                    <div className="w-6 h-6 bg-emerald-500 rounded-full flex items-center justify-center text-white shrink-0">
                      <Check size={14} />
                    </div>
                    <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-widest">
                      Senha alterada com sucesso!
                    </span>
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input 
                  label="Nova Senha"
                  type={showPassword ? "text" : "password"}
                  value={newPassword}
                  onChange={(e: any) => setNewPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  endIcon={showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  onEndIconClick={() => setShowPassword(!showPassword)}
                />
                <Input 
                  label="Confirmar Senha"
                  type={showPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e: any) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  endIcon={showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  onEndIconClick={() => setShowPassword(!showPassword)}
                />
              </div>

              <Button 
                type="submit" 
                isLoading={isLoading}
                className="w-full flex items-center justify-center gap-2"
                variant="primary"
              >
                {!isLoading && <ShieldCheck size={18} />}
                Atualizar Senha
              </Button>
            </form>
          </div>
        ) : (
          <div className="p-4 bg-zinc-100 dark:bg-zinc-800/50 rounded-xl border border-zinc-200 dark:border-zinc-700">
            <p className="text-[10px] text-center font-bold text-zinc-500 uppercase tracking-widest">
              A alteração de senha para a conta Administradora deve ser feita através do gerenciamento central de segurança.
            </p>
          </div>
        )}
      </div>
    </Modal>
  );
};
