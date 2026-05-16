import { useState, useEffect, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { 
  Package, 
  Search, 
  Filter, 
  Plus, 
  Scan, 
  AlertTriangle, 
  ArrowUpRight, 
  ArrowDownRight, 
  MoreVertical, 
  Building2, 
  Barcode,
  TrendingDown,
  ChevronRight,
  History,
  X,
  Printer,
  ArrowRightLeft
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import { cn } from '../../lib/utils';
import axios from 'axios';

// --- Types ---
interface Part {
  id: string;
  name: string;
  part_number: string;
  barcode: string;
  vendor_name: string;
  quantity: number;
  threshold: number;
  unit_cost: number;
  location: string;
}

export default function InventoryPage() {
  const { user } = useAuth();
  const [scanValue, setScanValue] = useState('');
  const [highlightedPart, setHighlightedPart] = useState<string | null>(null);
  const [selectedPart, setSelectedPart] = useState<Part | null>(null);
  const [isStockModalOpen, setIsStockModalOpen] = useState(false);
  const scanInputRef = useRef<HTMLInputElement>(null);

  // --- Queries ---
  const { data: parts, isLoading } = useQuery({
    queryKey: ['inventory-parts'],
    queryFn: async () => {
      const res = await axios.get('/api/inventory');
      return res.data.data as Part[];
    }
  });

  const lowStockParts = parts?.filter(p => p.quantity <= p.threshold) || [];

  // Barcode Scanning Logic (Keyboard Wedge Mode)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Enter' && scanValue) {
        const part = parts?.find(p => p.barcode === scanValue);
        if (part) {
          setHighlightedPart(part.id);
          setTimeout(() => setHighlightedPart(null), 3000);
          // Scroll to row logic could go here
        }
        setScanValue('');
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [scanValue, parts]);

  const getStockIndicator = (quantity: number, threshold: number) => {
    const ratio = quantity / threshold;
    if (quantity <= threshold) return { color: 'bg-red-500', text: 'Critical', border: 'border-red-500/20', bg: 'bg-red-500/10' };
    if (ratio <= 1.2) return { color: 'bg-amber-500', text: 'Low', border: 'border-amber-500/20', bg: 'bg-amber-500/10' };
    return { color: 'bg-emerald-500', text: 'Healthy', border: 'border-emerald-500/20', bg: 'bg-emerald-500/10' };
  };

  return (
    <div className="space-y-8 pb-32">
      {/* 1. Low Stock Alert Bar */}
      <AnimatePresence>
        {lowStockParts.length > 0 && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            className="bg-red-600/10 border-b border-red-600/20 p-4 flex items-center justify-between group cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-red-600 text-white flex items-center justify-center animate-pulse">
                <AlertTriangle size={16} />
              </div>
              <p className="text-sm font-black text-red-500 uppercase tracking-widest">
                Procurement Alert: {lowStockParts.length} items below safety threshold
              </p>
            </div>
            <button className="text-[10px] font-black text-red-600 uppercase border border-red-600/30 px-3 py-1 rounded-lg group-hover:bg-red-600 group-hover:text-white transition-all">
               View Reorder List
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header & Scanning Hub */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8">
        <div>
          <h1 className="text-4xl font-black text-white tracking-tighter">Warehouse Operations</h1>
          <p className="text-slate-400 font-medium text-sm">Spare parts inventory, barcode auditing & stock forecasting.</p>
        </div>
        
        {/* 4. Barcode Scan Input */}
        <div className="flex-1 max-w-md relative group">
           <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <Scan className="text-blue-500 group-focus-within:animate-bounce" size={20} />
           </div>
           <input 
             ref={scanInputRef}
             value={scanValue}
             onChange={(e) => setScanValue(e.target.value)}
             placeholder="Scan barcode for instant lookup..."
             className="w-full bg-slate-900 border-2 border-slate-800 rounded-2xl py-4 pl-12 pr-4 text-sm text-white placeholder-slate-600 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all"
           />
           <div className="absolute right-4 top-4 px-2 py-1 bg-slate-950 border border-slate-800 rounded text-[8px] font-black text-slate-500 uppercase">
              Auto-Audit Ready
           </div>
        </div>

        <button className="bg-blue-600 hover:bg-blue-500 text-white px-8 py-4 rounded-2xl text-sm font-black shadow-xl shadow-blue-900/20 flex items-center gap-2 transition-all">
          <Plus size={20} /> Register New Part
        </button>
      </div>

      {/* 2. Parts Table */}
      <div className="bg-slate-900/30 border border-slate-800 rounded-[40px] overflow-hidden backdrop-blur-md">
        <div className="p-8 border-b border-slate-800 bg-slate-900/50 flex flex-col md:flex-row gap-6 justify-between items-center">
           <div className="flex gap-4">
              <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl text-center min-w-[120px]">
                 <p className="text-[10px] font-black text-slate-500 uppercase mb-1">Total SKU</p>
                 <p className="text-xl font-black text-white">{parts?.length || 0}</p>
              </div>
              <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl text-center min-w-[120px]">
                 <p className="text-[10px] font-black text-slate-500 uppercase mb-1">Stock Value</p>
                 <p className="text-xl font-black text-emerald-500">₹ 8.2L</p>
              </div>
           </div>
           <div className="flex gap-2">
              <button className="p-3 bg-slate-950 border border-slate-800 rounded-xl text-slate-500 hover:text-white transition-all"><Filter size={18} /></button>
              <button className="p-3 bg-slate-950 border border-slate-800 rounded-xl text-slate-500 hover:text-white transition-all"><Printer size={18} /></button>
           </div>
        </div>

        <table className="w-full">
          <thead>
            <tr className="text-left border-b border-slate-800">
              <th className="px-8 py-6 text-[10px] font-black text-slate-500 uppercase tracking-widest">Spare Part & Barcode</th>
              <th className="px-8 py-6 text-[10px] font-black text-slate-500 uppercase tracking-widest">Inventory Level</th>
              <th className="px-8 py-6 text-[10px] font-black text-slate-500 uppercase tracking-widest text-center">Reorder T-Hold</th>
              <th className="px-8 py-6 text-[10px] font-black text-slate-500 uppercase tracking-widest">Unit Cost</th>
              <th className="px-8 py-6 text-[10px] font-black text-slate-500 uppercase tracking-widest text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {parts?.map(part => {
              const indicator = getStockIndicator(part.quantity, part.threshold);
              const isHighlighted = highlightedPart === part.id;
              return (
                <tr 
                  key={part.id} 
                  className={cn(
                    "border-b border-slate-800/50 last:border-0 hover:bg-slate-800/30 transition-all group",
                    isHighlighted && "bg-blue-600/10 ring-2 ring-blue-500/50"
                  )}
                >
                  <td className="px-8 py-5">
                    <div className="flex items-center gap-4">
                       <div className="w-10 h-10 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-center text-slate-500">
                         <Barcode size={20} />
                       </div>
                       <div>
                         <p className="text-sm font-bold text-white group-hover:text-blue-400 transition-colors">{part.name}</p>
                         <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">{part.barcode}</p>
                       </div>
                    </div>
                  </td>
                  <td className="px-8 py-5">
                    {/* 3. Stock Indicator */}
                    <div className="space-y-2 max-w-[140px]">
                       <div className="flex justify-between items-center text-[10px] font-black uppercase">
                          <span className="text-slate-400">{part.quantity} Units</span>
                          <span className={cn(indicator.text === 'Healthy' ? 'text-emerald-500' : 'text-red-500')}>{indicator.text}</span>
                       </div>
                       <div className="h-1.5 w-full bg-slate-950 rounded-full overflow-hidden">
                          <div 
                            className={cn("h-full transition-all", indicator.color)} 
                            style={{ width: `${Math.min((part.quantity / (part.threshold * 2)) * 100, 100)}%` }} 
                          />
                       </div>
                    </div>
                  </td>
                  <td className="px-8 py-5 text-center">
                    <span className="px-3 py-1 rounded-lg bg-slate-950 border border-slate-800 text-[10px] font-black text-slate-400 uppercase">
                      Min: {part.threshold}
                    </span>
                  </td>
                  <td className="px-8 py-5">
                    <span className="text-sm font-bold text-white tracking-tight">₹ {part.unit_cost.toLocaleString()}</span>
                  </td>
                  <td className="px-8 py-5 text-right">
                    <div className="flex justify-end gap-2">
                       <button 
                        onClick={() => { setSelectedPart(part); setIsStockModalOpen(true); }}
                        className="p-2.5 bg-slate-800 text-slate-400 hover:text-white rounded-xl border border-slate-700 transition-all flex items-center gap-2"
                       >
                          <ArrowRightLeft size={16} />
                       </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* 5. Stock Update Modal */}
      <AnimatePresence>
        {isStockModalOpen && selectedPart && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsStockModalOpen(false)}
              className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="relative w-full max-w-lg bg-slate-900 border border-slate-800 rounded-[40px] shadow-2xl p-10 space-y-8"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-black text-white tracking-tighter">Stock Adjustment</h2>
                  <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{selectedPart.name}</p>
                </div>
                <button onClick={() => setIsStockModalOpen(false)} className="p-2 hover:bg-slate-800 rounded-xl transition-all text-slate-500"><X size={24} /></button>
              </div>

              <div className="grid grid-cols-2 gap-4">
                 <button className="p-6 bg-slate-950 border border-slate-800 rounded-3xl flex flex-col items-center gap-3 hover:border-emerald-500/50 transition-all group">
                    <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-500 group-hover:bg-emerald-500 group-hover:text-white transition-all">
                       <ArrowUpRight size={24} />
                    </div>
                    <span className="text-xs font-black text-white uppercase">Add Stock (PO)</span>
                 </button>
                 <button className="p-6 bg-slate-950 border border-slate-800 rounded-3xl flex flex-col items-center gap-3 hover:border-red-500/50 transition-all group">
                    <div className="w-12 h-12 rounded-2xl bg-red-500/10 flex items-center justify-center text-red-500 group-hover:bg-red-500 group-hover:text-white transition-all">
                       <ArrowDownRight size={24} />
                    </div>
                    <span className="text-xs font-black text-white uppercase">Deduct (Job)</span>
                 </button>
              </div>

              <div className="space-y-4 pt-4 border-t border-slate-800">
                <div className="space-y-2">
                   <label className="text-[10px] font-black text-slate-500 uppercase ml-1">Adjustment Quantity</label>
                   <input type="number" placeholder="Enter units..." className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-4 text-white font-black" />
                </div>
                <div className="space-y-2">
                   <label className="text-[10px] font-black text-slate-500 uppercase ml-1">Reference (PO / Job Card #)</label>
                   <input placeholder="JC-2024-8812" className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-4 text-white font-bold" />
                </div>
              </div>

              <button className="w-full py-5 bg-blue-600 text-white rounded-2xl font-black text-sm shadow-xl shadow-blue-900/20 hover:bg-blue-500 transition-all">
                Commit Stock Update
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
