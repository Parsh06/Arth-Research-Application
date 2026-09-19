import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Home, AlertCircle } from 'lucide-react';

export default function NotFoundPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-neo-bg flex items-center justify-center p-4 bg-[radial-gradient(#000_1px,transparent_1px)] [background-size:16px_16px]">
      <motion.div 
        initial={{ y: 50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="max-w-xl mx-auto w-full text-center"
      >
        <div className="bg-white border-8 border-black p-12 shadow-neo relative overflow-hidden">
          {/* Decorative warning background */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-neo-danger border-b-8 border-l-8 border-black transform translate-x-16 -translate-y-16 rotate-45 opacity-20"></div>

          <motion.div 
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
            className="w-32 h-32 bg-neo-danger border-8 border-black mx-auto flex items-center justify-center shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] mb-8 transform -rotate-3 hover:rotate-3 transition-transform"
          >
            <AlertCircle className="w-16 h-16 text-white stroke-[4]" />
          </motion.div>

          <h1 className="text-6xl sm:text-8xl font-black text-black uppercase tracking-tighter mb-4 drop-shadow-[4px_4px_0px_rgba(255,144,232,1)]">
            404
          </h1>
          <h2 className="text-2xl font-black uppercase text-black mb-4">
            System Route Not Found
          </h2>
          <p className="text-lg font-bold text-slate-600 mb-10 border-b-4 border-black pb-8">
            The terminal page you are looking for does not exist or access has been restricted.
          </p>

          <button
            onClick={() => navigate('/')}
            className="w-full bg-black text-white py-4 px-6 font-black uppercase tracking-wider text-xl border-4 border-black hover:bg-neo-primary hover:text-black transition-colors flex items-center justify-center gap-3 shadow-[8px_8px_0px_0px_rgba(255,223,0,1)] hover:shadow-neo-pressed hover:translate-y-2"
          >
            <Home className="w-6 h-6 stroke-[3]" />
            Return to Terminal
          </button>
        </div>
      </motion.div>
    </div>
  );
}
