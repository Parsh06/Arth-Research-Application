import { useToastStore } from '../stores/toastStore';
import { motion, AnimatePresence } from 'framer-motion';
import { X, CheckCircle2, AlertCircle, Info } from 'lucide-react';

export default function ToastContainer() {
  const { toasts, removeToast } = useToastStore();

  return (
    <div className="fixed bottom-5 right-5 z-[9999] flex flex-col gap-2.5 pointer-events-none max-w-sm w-full">
      <AnimatePresence>
        {toasts.map((toast) => {
          let icon = <Info className="w-4 h-4 text-blue-500" />;
          
          if (toast.type === 'success') {
            icon = <CheckCircle2 className="w-4 h-4 text-emerald-500" />;
          } else if (toast.type === 'error') {
            icon = <AlertCircle className="w-4 h-4 text-rose-500" />;
          } else if (toast.type === 'warning') {
            icon = <AlertCircle className="w-4 h-4 text-amber-500" />;
          }

          return (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, y: 15, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, x: 20, scale: 0.95 }}
              className="bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-slate-800 p-4 rounded-2xl shadow-xl flex items-start gap-3 pointer-events-auto backdrop-blur-md"
            >
              <div className="mt-0.5 shrink-0">{icon}</div>
              <div className="flex-1 text-xs font-semibold text-slate-800 dark:text-slate-200 leading-relaxed">
                {toast.message}
              </div>
              <button 
                onClick={() => removeToast(toast.id)} 
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors p-0.5 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
