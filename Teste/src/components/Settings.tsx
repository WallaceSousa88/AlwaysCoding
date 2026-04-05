import React, { useState, useRef } from 'react';
import { Download, ShieldCheck, Database as DbIcon, Loader2, Upload } from 'lucide-react';
import { Card, ConfirmModal, ErrorAlert } from './Common';
import { motion } from 'motion/react';
import { apiService } from '../services/apiService';

export const Settings = () => {
  const [isBackingUp, setIsBackingUp] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [showConfirmRestore, setShowConfirmRestore] = useState(false);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-1">
        <h2 className="text-2xl font-bold tracking-tight uppercase">Configurações</h2>
        <p className="text-zinc-500 dark:text-zinc-400 uppercase">Gerencie as preferências e segurança do sistema.</p>
      </div>

      {error && <ErrorAlert className="max-w-2xl">{error}</ErrorAlert>}

      <div className="max-w-2xl space-y-4">
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
