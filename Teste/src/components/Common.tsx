import React from 'react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { motion, AnimatePresence } from 'motion/react';
import { X, ChevronDown, AlertTriangle, Search, Loader2 } from 'lucide-react';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const SidebarItem: React.FC<{ icon: any, label: string, active: boolean, onClick: () => void, isCollapsed?: boolean }> = ({ icon: Icon, label, active, onClick, isCollapsed }) => (
  <button
    onClick={onClick}
    className={cn(
      "flex items-center w-full gap-3 transition-all duration-300 rounded-xl",
      isCollapsed ? "justify-center px-0 py-3" : "px-4 py-3",
      active 
        ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900" 
        : "text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:text-zinc-100 dark:hover:bg-zinc-800/50"
    )}
    title={isCollapsed ? label : undefined}
  >
    <Icon size={18} className="flex-shrink-0" />
    {!isCollapsed && <span className="text-sm font-medium truncate uppercase">{label}</span>}
  </button>
);

export const Card = ({ children, className, title, onClick, noPadding = false }: { children: React.ReactNode, className?: string, title?: string, onClick?: () => void, noPadding?: boolean }) => (
  <div 
    onClick={onClick}
    className={cn("bg-white border border-zinc-200 rounded-xl overflow-hidden shadow-sm dark:bg-zinc-900 dark:border-zinc-800/50", className)}
  >
    {title && (
      <div className="px-6 py-4 border-b border-zinc-100 dark:border-zinc-800">
        <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">{title.toUpperCase()}</h3>
      </div>
    )}
    <div className={cn(noPadding ? "" : "p-6")}>{children}</div>
  </div>
);

export const StatCard = ({ label, value, icon: Icon, trend, color, onClick }: { label: string, value: string | number, icon: any, trend?: string, color: string, onClick?: () => void }) => (
  <Card 
    className={cn("flex flex-col gap-1 transition-all", onClick && "cursor-pointer hover:border-zinc-400 dark:hover:border-zinc-600 active:scale-[0.98]")}
    onClick={onClick}
  >
    <div className="flex items-center justify-between">
      <span className="text-xs font-medium text-zinc-500 uppercase tracking-wider dark:text-zinc-400">{label.toUpperCase()}</span>
      <div className={cn("p-2 rounded-xl", color)}>
        <Icon size={16} className="text-white" />
      </div>
    </div>
    <div className="flex items-end gap-2 mt-2">
      <span className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">{value}</span>
      {trend && <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400 mb-1">{trend}</span>}
    </div>
  </Card>
);

export const Modal = ({ isOpen, onClose, title, children, zIndex = 200, noPadding = false }: { isOpen: boolean, onClose: () => void, title: string, children: React.ReactNode, zIndex?: number, noPadding?: boolean }) => (
  <AnimatePresence>
    {isOpen && (
      <div className={cn("fixed inset-0 flex items-center justify-center p-4 sm:p-6", zIndex === 200 ? "z-[200]" : "z-[300]")}>
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-zinc-900/60 backdrop-blur-sm"
        />
        <motion.div 
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative w-full md:w-[85%] h-[85%] bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl overflow-hidden flex flex-col"
        >
          <div className="px-6 py-4 border-b border-zinc-100 dark:border-zinc-800 flex items-center justify-between flex-shrink-0">
            <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100 uppercase tracking-widest">{title}</h2>
            <button onClick={onClose} className="text-zinc-400 hover:text-zinc-600 dark:text-zinc-500 dark:hover:text-zinc-300">
              <X size={20} />
            </button>
          </div>
          <div className={cn("overflow-y-auto flex-1 custom-scrollbar", !noPadding && "p-6")}>
            {children}
          </div>
        </motion.div>
      </div>
    )}
  </AnimatePresence>
);

export const ConfirmModal = ({ 
  isOpen, 
  onClose, 
  onConfirm, 
  title, 
  message, 
  confirmText = "CONFIRMAR", 
  cancelText = "CANCELAR", 
  variant = "danger", 
  isLoading = false 
}: { 
  isOpen: boolean, 
  onClose: () => void, 
  onConfirm: () => void, 
  title: string, 
  message: string, 
  confirmText?: string, 
  cancelText?: string, 
  variant?: "primary" | "danger", 
  isLoading?: boolean 
}) => (
  <AnimatePresence>
    {isOpen && (
      <div className="fixed inset-0 z-[300] flex items-center justify-center p-4">
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-zinc-900/60 backdrop-blur-sm"
        />
        <motion.div 
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative w-full max-w-md bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl p-6 overflow-hidden"
        >
          <div className="flex flex-col gap-4">
            <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100 uppercase tracking-widest">{title}</h3>
            <p className="text-sm text-zinc-500 dark:text-zinc-400 leading-relaxed uppercase">{message}</p>
            <div className="flex gap-3 mt-4">
              <Button 
                variant="ghost" 
                onClick={onClose} 
                className="flex-1"
                disabled={isLoading}
              >
                {cancelText}
              </Button>
              <Button 
                variant={variant} 
                onClick={onConfirm} 
                className="flex-1"
                disabled={isLoading}
              >
                {isLoading ? "PROCESSANDO..." : confirmText}
              </Button>
            </div>
          </div>
        </motion.div>
      </div>
    )}
  </AnimatePresence>
);

export const ErrorText = ({ children, className }: { children: React.ReactNode, className?: string }) => (
  <p className={cn("text-[10px] font-bold text-rose-500 ml-1 uppercase tracking-wider animate-in fade-in slide-in-from-top-1", className)}>
    {children}
  </p>
);

export const ErrorAlert = ({ children, className }: { children: React.ReactNode, className?: string }) => (
  <div className={cn(
    "p-3 bg-rose-50 dark:bg-rose-500/10 border border-rose-100 dark:border-rose-500/20 rounded-xl flex items-center gap-3 text-rose-600 dark:text-rose-400 animate-in fade-in slide-in-from-top-2",
    className
  )}>
    <AlertTriangle size={18} className="flex-shrink-0" />
    <span className="text-[10px] font-bold uppercase tracking-wider leading-tight">{children}</span>
  </div>
);

export const Input = ({ label, icon, onIconClick, className, error, required, ...props }: any) => (
  <div className="space-y-1.5 flex-1">
    {label && (
      <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest ml-1">
        {label}
        {required && <span className="text-rose-500 ml-0.5">*</span>}
      </label>
    )}
    <div className="relative group">
      {icon && (
        <div 
          onClick={onIconClick}
          className={cn(
            "absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 transition-colors",
            onIconClick ? "cursor-pointer hover:text-zinc-900 dark:hover:text-zinc-100" : "group-focus-within:text-zinc-900 dark:group-focus-within:text-zinc-100"
          )}
        >
          {icon}
        </div>
      )}
      <input 
        className={cn(
          "w-full bg-zinc-50 border border-zinc-200 rounded-xl py-2.5 text-sm text-zinc-900 transition-all focus:ring-2 focus:ring-zinc-900/5 focus:border-zinc-900 dark:bg-zinc-800/50 dark:border-zinc-800 dark:text-zinc-100 dark:focus:border-zinc-100",
          icon ? "pl-10 pr-4" : "px-4",
          error && "border-rose-500 focus:border-rose-500 focus:ring-rose-500/5",
          className
        )}
        {...props}
      />
    </div>
    {error && <ErrorText>{error}</ErrorText>}
  </div>
);

export const Select = ({ label, icon, options, className, error, required, ...props }: any) => (
  <div className="space-y-1.5 flex-1">
    {label && (
      <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest ml-1">
        {label}
        {required && <span className="text-rose-500 ml-0.5">*</span>}
      </label>
    )}
    <div className="relative group">
      {icon && <div className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 group-focus-within:text-zinc-900 dark:group-focus-within:text-zinc-100 transition-colors pointer-events-none">{icon}</div>}
      <select 
        className={cn(
          "w-full bg-zinc-50 border border-zinc-200 rounded-xl py-2.5 text-sm text-zinc-900 transition-all focus:ring-2 focus:ring-zinc-900/5 focus:border-zinc-900 dark:bg-zinc-800/50 dark:border-zinc-800 dark:text-zinc-100 dark:focus:border-zinc-100 appearance-none",
          icon ? "pl-10 pr-10" : "px-4 pr-10",
          error && "border-rose-500 focus:border-rose-500 focus:ring-rose-500/5",
          className
        )}
        {...props}
      >
        {options.map((opt: any) => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
      </select>
      <div className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none">
        <ChevronDown size={16} />
      </div>
    </div>
    {error && <ErrorText>{error}</ErrorText>}
  </div>
);

export const TextArea = ({ label, icon, className, error, required, ...props }: any) => (
  <div className="space-y-1.5 flex-1">
    {label && (
      <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest ml-1 flex items-center gap-2">
        {icon}
        {label}
        {required && <span className="text-rose-500 ml-0.5">*</span>}
      </label>
    )}
    <textarea 
      className={cn(
        "w-full bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-2.5 text-sm transition-all focus:ring-2 focus:ring-zinc-900/5 focus:border-zinc-900 dark:bg-zinc-800/50 dark:border-zinc-800 dark:text-zinc-100 dark:focus:border-zinc-100 min-h-[100px] uppercase",
        error && "border-rose-500 focus:border-rose-500 focus:ring-rose-500/5",
        className
      )}
      {...props}
    />
    {error && <ErrorText>{error}</ErrorText>}
  </div>
);

export const SearchBar = ({ value, onChange, placeholder = "BUSCAR...", className }: { value: string, onChange: (val: string) => void, placeholder?: string, className?: string }) => (
  <div className={cn("relative flex-1 max-w-xs", className)}>
    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 dark:text-zinc-500" size={14} />
    <input 
      type="text" 
      placeholder={placeholder}
      value={value}
      onChange={(e) => onChange(e.target.value.toUpperCase())}
      className="w-full pl-9 pr-10 py-1.5 text-xs border border-zinc-200 dark:border-zinc-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:focus:ring-zinc-100 focus:border-transparent bg-white dark:bg-black text-zinc-900 dark:text-zinc-100 uppercase transition-all"
    />
    {value && (
      <button 
        onClick={() => onChange('')}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-rose-600 transition-colors"
      >
        <X size={14} />
      </button>
    )}
  </div>
);

export const Button = ({ children, variant = 'primary', className, isLoading, ...props }: any) => {
  const variants = {
    primary: "bg-zinc-900 text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200",
    secondary: "bg-zinc-100 text-zinc-600 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700",
    danger: "bg-rose-600 text-white hover:bg-rose-700 dark:bg-rose-500 dark:hover:bg-rose-600",
    outline: "bg-transparent border border-zinc-200 text-zinc-600 hover:bg-zinc-50 dark:border-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-800/50",
    ghost: "bg-transparent text-zinc-500 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800/50"
  };

  return (
    <button 
      className={cn(
        "px-4 py-2.5 rounded-xl text-sm font-bold transition-all active:scale-95 disabled:opacity-50 disabled:pointer-events-none uppercase tracking-wider flex items-center justify-center gap-2",
        variants[variant as keyof typeof variants],
        className
      )}
      disabled={props.disabled || isLoading}
      {...props}
    >
      {isLoading && <Loader2 className="animate-spin" size={16} />}
      {children}
    </button>
  );
};
