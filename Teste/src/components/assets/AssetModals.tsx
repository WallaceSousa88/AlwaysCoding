import React, { useState, useEffect, useRef } from 'react';
import { X, Camera, Calendar, DollarSign, Percent, Tag, FileText, Hash, ArrowDownLeft, ArrowUpRight, Plus } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Asset } from '../../types';
import { Modal, Input, Select, Button, cn } from '../Common';
import { maskCurrency, parseCurrency } from '../../lib/masks';

interface AssetModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (formData: FormData) => void;
  asset?: Asset | null;
  categories: { id: string | number, name: string }[];
  fieldErrors?: Record<string, string>;
}

export const AssetModal = ({ isOpen, onClose, onSave, asset, categories, fieldErrors = {} }: AssetModalProps) => {
  const [formData, setFormData] = useState({
    description: '',
    asset_number: '',
    category: '',
    purchase_date: new Date().toISOString().split('T')[0],
    purchase_value: '',
    depreciation_type: 'MENSAL',
    depreciation_percentage: '',
  });
  const [photo, setPhoto] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('environment');
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const startCamera = async (mode: 'user' | 'environment' = facingMode) => {
    try {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          facingMode: mode,
          width: { ideal: 1280 },
          height: { ideal: 720 }
        } 
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      streamRef.current = stream;
      setFacingMode(mode);
      setIsCameraOpen(true);
    } catch (err) {
      console.error("Error accessing camera:", err);
      alert("Não foi possível acessar a câmera. Verifique as permissões.");
    }
  };

  const flipCamera = () => {
    const newMode = facingMode === 'user' ? 'environment' : 'user';
    startCamera(newMode);
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setIsCameraOpen(false);
  };

  const takePhoto = () => {
    if (videoRef.current) {
      const canvas = document.createElement('canvas');
      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(videoRef.current, 0, 0);
        const photoData = canvas.toDataURL('image/jpeg');
        
        // Convert base64 to File object
        fetch(photoData)
          .then(res => res.blob())
          .then(blob => {
            const file = new File([blob], "asset_photo.jpg", { type: "image/jpeg" });
            setPhoto(file);
            setPhotoPreview(photoData);
          });
          
        stopCamera();
      }
    }
  };

  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  useEffect(() => {
    if (asset) {
      setFormData({
        description: asset.description,
        asset_number: asset.asset_number || '',
        category: asset.category || '',
        purchase_date: asset.purchase_date || new Date().toISOString().split('T')[0],
        purchase_value: maskCurrency(asset.purchase_value.toString().replace('.', ',')),
        depreciation_type: asset.depreciation_type || 'MENSAL',
        depreciation_percentage: asset.depreciation_percentage.toString(),
      });
      setPhotoPreview(asset.photo || null);
    } else {
      setFormData({
        description: '',
        asset_number: '',
        category: '',
        purchase_date: new Date().toISOString().split('T')[0],
        purchase_value: '',
        depreciation_type: 'MENSAL',
        depreciation_percentage: '',
      });
      setPhoto(null);
      setPhotoPreview(null);
    }
  }, [asset, isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const data = new FormData();
    Object.entries(formData).forEach(([key, value]) => {
      if (value !== null && value !== undefined) {
        if (key === 'purchase_value') {
          data.append(key, parseCurrency(value.toString()).toString());
        } else {
          data.append(key, String(value));
        }
      }
    });
    if (photo) data.append('photo', photo);
    onSave(data);
  };

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setPhoto(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const onClear = () => {
    setFormData({
      description: '',
      asset_number: '',
      category: '',
      purchase_date: new Date().toISOString().split('T')[0],
      purchase_value: '',
      depreciation_type: 'MENSAL',
      depreciation_percentage: '',
    });
    setPhoto(null);
    setPhotoPreview(null);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={asset ? 'EDITAR PATRIMÔNIO' : 'NOVO PATRIMÔNIO'} noPadding>
      <form onSubmit={handleSubmit} noValidate className="p-6 space-y-6 overflow-y-auto flex-1">
        <div className="flex flex-col items-center gap-4">
          <div className="relative group">
            <div className="w-24 h-24 rounded-2xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center overflow-hidden border-2 border-dashed border-zinc-200 dark:border-zinc-700 group-hover:border-zinc-400 transition-colors">
              {photoPreview ? (
                <img src={photoPreview} alt="Preview" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
              ) : (
                <Camera className="text-zinc-400" size={32} />
              )}
            </div>
            <div className="absolute -bottom-2 -right-2 flex gap-1">
              <button 
                type="button"
                onClick={() => startCamera()}
                className="p-2 bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 rounded-xl shadow-lg hover:scale-110 transition-transform"
                title="Tirar Foto"
              >
                <Camera size={16} />
              </button>
              <button 
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="p-2 bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 rounded-xl shadow-lg hover:scale-110 transition-transform"
                title="Upload de Arquivo"
              >
                <Plus size={16} />
              </button>
            </div>
            <input 
              type="file" 
              ref={fileInputRef}
              onChange={handlePhotoChange}
              accept="image/*,application/pdf"
              className="hidden"
            />
          </div>
          <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Foto do Patrimônio</p>
        </div>

        <AnimatePresence>
          {isCameraOpen && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[500] bg-black flex flex-col items-center justify-center pt-safe pb-safe"
            >
              <video 
                ref={videoRef} 
                autoPlay 
                playsInline 
                className="w-full h-full object-cover"
              />
              
              <div className="absolute top-0 left-0 right-0 p-6 bg-gradient-to-b from-black/60 to-transparent flex items-center justify-between">
                <span className="text-white text-sm font-bold tracking-widest uppercase">Câmera SkySmart</span>
                <button 
                  type="button"
                  onClick={stopCamera}
                  className="p-2 text-white hover:bg-white/10 rounded-full transition-colors"
                >
                  <X size={24} />
                </button>
              </div>

              <div className="absolute bottom-12 left-0 right-0 flex items-center justify-around px-12">
                <button 
                  type="button"
                  onClick={flipCamera}
                  className="p-4 bg-white/20 hover:bg-white/30 text-white rounded-full backdrop-blur-xl border border-white/20 transition-all flex items-center justify-center"
                  title="Alternar Câmera"
                >
                  <motion.div
                    animate={{ rotate: facingMode === 'user' ? 180 : 0 }}
                    transition={{ type: "spring", stiffness: 260, damping: 20 }}
                  >
                    <Plus size={24} className="rotate-45" />
                  </motion.div>
                </button>

                <button 
                  type="button"
                  onClick={takePhoto}
                  className="w-20 h-20 bg-white rounded-full flex items-center justify-center shadow-2xl active:scale-95 transition-all p-1"
                >
                  <div className="w-full h-full rounded-full border-4 border-zinc-900/10 flex items-center justify-center">
                    <div className="w-[85%] h-[85%] rounded-full bg-white border-2 border-zinc-900" />
                  </div>
                </button>

                <button 
                  type="button"
                  onClick={stopCamera}
                  className="p-4 bg-rose-500/80 hover:bg-rose-600 text-white rounded-full backdrop-blur-xl border border-rose-400/20 transition-all"
                >
                  <X size={24} />
                </button>
              </div>

              <div className="absolute top-20 left-0 right-0 flex justify-center pointer-events-none">
                <div className="bg-black/40 backdrop-blur-md px-4 py-1.5 rounded-full border border-white/10">
                  <p className="text-[10px] text-white/80 font-bold uppercase tracking-widest">
                    {facingMode === 'environment' ? 'Câmera Traseira - Ideal para patrimônio' : 'Câmera Frontal'}
                  </p>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2">
            <Input 
              label="Descrição" 
              icon={<FileText size={18} />}
              value={formData.description}
              onChange={(e: any) => setFormData({ ...formData, description: e.target.value.toUpperCase() })}
              error={fieldErrors.description}
              required
            />
          </div>
          <Input 
            label="Número Patrimônio" 
            icon={<Hash size={18} />}
            value={formData.asset_number}
            onChange={(e: any) => setFormData({ ...formData, asset_number: e.target.value.toUpperCase() })}
            error={fieldErrors.asset_number}
            required
          />
          <Select 
            label="Categoria" 
            icon={<Tag size={18} />}
            value={formData.category}
            onChange={(e: any) => setFormData({ ...formData, category: e.target.value })}
            options={[
              { value: '', label: 'SELECIONE' },
              ...categories.map(c => ({ value: c.name, label: c.name.toUpperCase() }))
            ]}
            error={fieldErrors.category}
            required
          />
          <Input 
            label="Data Compra" 
            icon={<Calendar size={18} />}
            type="date"
            value={formData.purchase_date}
            onChange={(e: any) => setFormData({ ...formData, purchase_date: e.target.value })}
            error={fieldErrors.purchase_date}
            required
          />
          <Input 
            label="Valor Compra (R$)" 
            icon={<DollarSign size={18} />}
            value={formData.purchase_value}
            onChange={(e: any) => setFormData({ ...formData, purchase_value: maskCurrency(e.target.value) })}
            error={fieldErrors.purchase_value}
            required
          />
          <Select 
            label="Tipo Depreciação" 
            icon={<Percent size={18} />}
            value={formData.depreciation_type}
            onChange={(e: any) => setFormData({ ...formData, depreciation_type: e.target.value })}
            options={[
              { value: 'DIARIA', label: 'DIÁRIA' },
              { value: 'MENSAL', label: 'MENSAL' },
              { value: 'ANUAL', label: 'ANUAL' }
            ]}
            error={fieldErrors.depreciation_type}
            required
          />
          <Input 
            label="% Depreciação" 
            icon={<Percent size={18} />}
            type="number"
            step="0.01"
            value={formData.depreciation_percentage}
            onChange={(e: any) => setFormData({ ...formData, depreciation_percentage: e.target.value })}
            error={fieldErrors.depreciation_percentage}
            required
          />
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t border-zinc-100 dark:border-zinc-800">
          <Button 
            type="button"
            variant="ghost"
            onClick={onClear}
            className="mr-auto"
          >
            Limpar Campos
          </Button>
          <Button 
            type="button"
            variant="ghost"
            onClick={onClose}
          >
            Cancelar
          </Button>
          <Button type="submit">
            {asset ? 'ATUALIZAR' : 'SALVAR'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};

interface AssetDisposalModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (data: { disposal_type: string, disposal_date: string, disposal_value: number, asset_id?: string | number }) => void;
  asset: Asset | null;
  assets?: Asset[];
  fieldErrors?: Record<string, string>;
}

export const AssetDisposalModal = ({ isOpen, onClose, onConfirm, asset, assets = [], fieldErrors = {} }: AssetDisposalModalProps) => {
  const [selectedAssetId, setSelectedAssetId] = useState<string>('');
  const [disposalType, setDisposalType] = useState('DESCARTE');
  const [disposalDate, setDisposalDate] = useState(new Date().toISOString().split('T')[0]);
  const [calculatedValue, setCalculatedValue] = useState(0);

  const currentAsset = asset || assets.find(a => a.id === selectedAssetId) || null;

  useEffect(() => {
    if (currentAsset && isOpen) {
      const value = calculateDepreciation(
        currentAsset.purchase_value,
        currentAsset.purchase_date,
        disposalDate,
        currentAsset.depreciation_type,
        currentAsset.depreciation_percentage
      );
      setCalculatedValue(value);
    }
  }, [currentAsset, disposalDate, isOpen]);

  const calculateDepreciation = (purchaseValue: number, purchaseDate: string, disposalDate: string, type: string, percentage: number) => {
    const start = new Date(purchaseDate);
    const end = new Date(disposalDate);
    const diffTime = Math.max(0, end.getTime() - start.getTime());
    
    let periods = 0;
    if (type === 'DIARIA') {
      periods = diffTime / (1000 * 60 * 60 * 24);
    } else if (type === 'MENSAL') {
      periods = diffTime / (1000 * 60 * 60 * 24 * 30.44);
    } else if (type === 'ANUAL') {
      periods = diffTime / (1000 * 60 * 60 * 24 * 365.25);
    }

    const totalDepreciation = (purchaseValue * (percentage / 100)) * periods;
    return Math.max(0, purchaseValue - totalDepreciation);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentAsset) return;
    onConfirm({
      disposal_type: disposalType,
      disposal_date: disposalDate,
      disposal_value: calculatedValue,
      asset_id: currentAsset.id
    });
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="BAIXA DE PATRIMÔNIO" noPadding>
      <form onSubmit={handleSubmit} noValidate className="p-6 space-y-6 overflow-y-auto flex-1">
        {!asset ? (
          <Select 
            label="Selecionar Patrimônio" 
            icon={<ArrowDownLeft size={18} />}
            value={selectedAssetId}
            onChange={(e: any) => setSelectedAssetId(e.target.value)}
            options={[
              { value: '', label: 'SELECIONE UM PATRIMÔNIO ATIVO' },
              ...assets.filter(a => a.status === 'ATIVO').map(a => ({
                value: a.id.toString(),
                label: `${a.description} (${a.asset_number || 'S/N'})`.toUpperCase()
              }))
            ]}
            error={fieldErrors.asset_id}
            required
          />
        ) : (
          <div className="p-4 bg-zinc-50 dark:bg-zinc-900/50 rounded-xl border border-zinc-100 dark:border-zinc-800">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-zinc-200 dark:bg-zinc-700 flex items-center justify-center text-zinc-500">
                <ArrowDownLeft size={20} />
              </div>
              <div>
                <p className="text-xs font-bold text-zinc-400 uppercase tracking-widest">Patrimônio Selecionado</p>
                <p className="text-sm font-bold text-zinc-900 dark:text-zinc-100">{asset.description.toUpperCase()}</p>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Select 
            label="Tipo de Baixa" 
            icon={<Tag size={18} />}
            value={disposalType}
            onChange={(e: any) => setDisposalType(e.target.value)}
            options={[
              { value: 'DESCARTE', label: 'DESCARTE' },
              { value: 'DOAÇÃO', label: 'DOAÇÃO' },
              { value: 'VENDA', label: 'VENDA' },
              { value: 'OUTRO', label: 'OUTRO' }
            ]}
            error={fieldErrors.disposal_type}
            required
          />
          <Input 
            label="Data da Baixa" 
            icon={<Calendar size={18} />}
            type="date"
            value={disposalDate}
            onChange={(e: any) => setDisposalDate(e.target.value)}
            error={fieldErrors.disposal_date}
            required
          />
          <div className="md:col-span-2">
            <Input 
              label="Valor da Baixa (Calculado)" 
              icon={<DollarSign size={18} />}
              value={`R$ ${calculatedValue.toFixed(2)}`}
              readOnly
              className="font-bold text-emerald-600 dark:text-emerald-400"
            />
            <p className="mt-2 text-[10px] text-zinc-400 uppercase tracking-widest font-bold">
              * Valor calculado automaticamente com base na depreciação ({asset?.depreciation_percentage}% {asset?.depreciation_type.toLowerCase()})
            </p>
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t border-zinc-100 dark:border-zinc-800">
          <Button 
            type="button"
            variant="ghost"
            onClick={onClose}
          >
            Cancelar
          </Button>
          <Button type="submit" variant="danger">
            Confirmar Baixa
          </Button>
        </div>
      </form>
    </Modal>
  );
};
