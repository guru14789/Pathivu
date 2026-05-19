import { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  Filter, 
  Plus, 
  Scan, 
  AlertTriangle, 
  ArrowUpRight, 
  ArrowDownRight, 
  Barcode,
  X,
  Printer,
  ArrowRightLeft,
  Trash2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import { cn } from '../../lib/utils';
import axios from 'axios';
import toast from 'react-hot-toast';
import ConfirmDialog from '../../components/ConfirmDialog';

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
  const { user: _user } = useAuth();
  const [scanValue, setScanValue] = useState('');
  const [highlightedPart, setHighlightedPart] = useState<string | null>(null);
  const [selectedPart, setSelectedPart] = useState<Part | null>(null);
  const [isStockModalOpen, setIsStockModalOpen] = useState(false);
  const [deactivateId, setDeactivateId] = useState<string | null>(null);
  const scanInputRef = useRef<HTMLInputElement>(null);

  // --- Queries ---
  const { data: parts } = useQuery({
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

  const queryClient = useQueryClient();

  const deactivateMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await axios.put(`/api/inventory/${id}`, { is_active: false });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory-parts'] });
      toast.success('Inventory item deactivated successfully');
      setDeactivateId(null);
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Failed to deactivate inventory item');
      setDeactivateId(null);
    },
  });

  return (
    <div className="space-y-8 pb-32">
      {/* 1. Low Stock Alert Bar */}
      <AnimatePresence>
        {lowStockParts.length > 0 && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            className="bg-red-50 border-b border-red-200 p-4 flex items-center justify-between"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-red-600 text-white flex items-center justify-center animate-pulse">
                <AlertTriangle size={16} />
              </div>
              <p className="text-sm font-black text-red-600 uppercase tracking-widest">
                Procurement Alert: {lowStockParts.length} items below safety threshold
              </p>
            </div>
            <button className="text-[10px] font-black text-red-700 uppercase border border-red-300 px-3 py-1 rounded-lg hover:bg-red-600 hover:text-white transition-all">
               View Reorder List
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header & Scanning Hub */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8">
        <div>
          <h1 className="text-4xl font-black text-gray-900 tracking-tighter">Warehouse Operations</h1>
          <p className="text-gray-500 font-medium text-sm">Spare parts inventory, barcode auditing & stock forecasting.</p>
        </div>
        
        {/* 4. Barcode Scan Input */}
        <div className="flex-1 max-w-md relative group">
           <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <Scan className="text-[#6A1B9A] group-focus-within:animate-bounce" size={20} />
           </div>
           <input 
             ref={scanInputRef}
             value={scanValue}
             onChange={(e) => setScanValue(e.target.value)}
             placeholder="Scan barcode for instant lookup..."
             className="w-full bg-white border-2 border-gray-200 rounded-2xl py-4 pl-12 pr-4 text-sm text-gray-900 placeholder:text-gray-400 outline-none focus:border-[#6A1B9A] focus:ring-4 focus:ring-[#6A1B9A]/10 transition-all"
           />
           <div className="absolute right-4 top-4 px-2 py-1 bg-gray-100 border border-gray-200 rounded text-[8px] font-black text-gray-500 uppercase">
              Auto-Audit Ready
           </div>
        </div>

        <button className="bg-[#6A1B9A] hover:bg-[#7B1FA2] text-white px-8 py-4 rounded-2xl text-sm font-black flex items-center gap-2 transition-all">
          <Plus size={20} /> Register New Part
        </button>
      </div>

      {/* 2. Parts Table */}
      <div className="bg-white border border-gray-200 rounded-[40px] overflow-hidden">
        <div className="p-8 border-b border-gray-200 bg-gray-50 flex flex-col md:flex-row gap-6 justify-between items-center">
           <div className="flex gap-4">
              <div className="p-4 bg-gray-50 border border-gray-200 rounded-2xl text-center min-w-[120px]">
                 <p className="text-[10px] font-black text-gray-500 uppercase mb-1">Total SKU</p>
                 <p className="text-xl font-black text-gray-900">{parts?.length || 0}</p>
              </div>
              <div className="p-4 bg-gray-50 border border-gray-200 rounded-2xl text-center min-w-[120px]">
                 <p className="text-[10px] font-black text-gray-500 uppercase mb-1">Stock Value</p>
                 <p className="text-xl font-black text-emerald-500">₹ 8.2L</p>
              </div>
           </div>
           <div className="flex gap-2">
              <button className="p-3 bg-gray-100 border border-gray-200 rounded-xl text-gray-500 hover:text-gray-900 transition-all"><Filter size={18} /></button>
              <button className="p-3 bg-gray-100 border border-gray-200 rounded-xl text-gray-500 hover:text-gray-900 transition-all"><Printer size={18} /></button>
           </div>
        </div>

        <table className="w-full">
          <thead>
            <tr className="text-left border-b border-gray-200">
              <th className="px-8 py-6 text-[10px] font-black text-gray-500 uppercase tracking-widest">Spare Part & Barcode</th>
              <th className="px-8 py-6 text-[10px] font-black text-gray-500 uppercase tracking-widest">Inventory Level</th>
              <th className="px-8 py-6 text-[10px] font-black text-gray-500 uppercase tracking-widest text-center">Reorder T-Hold</th>
              <th className="px-8 py-6 text-[10px] font-black text-gray-500 uppercase tracking-widest">Unit Cost</th>
              <th className="px-8 py-6 text-[10px] font-black text-gray-500 uppercase tracking-widest text-right">Actions</th>
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
                    "border-b border-gray-100 last:border-0 hover:bg-gray-50 transition-all",
                    isHighlighted && "bg-[#6A1B9A]/10 ring-2 ring-[#6A1B9A]/50"
                  )}
                >
                  <td className="px-8 py-5">
                    <div className="flex items-center gap-4">
                       <div className="w-10 h-10 rounded-xl bg-gray-50 border border-gray-200 flex items-center justify-center text-gray-400">
                         <Barcode size={20} />
                       </div>
                       <div>
                         <p className="text-sm font-bold text-gray-900 hover:text-[#6A1B9A] transition-colors">{part.name}</p>
                         <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">{part.barcode}</p>
                       </div>
                    </div>
                  </td>
                  <td className="px-8 py-5">
                    {/* 3. Stock Indicator */}
                    <div className="space-y-2 max-w-[140px]">
                       <div className="flex justify-between items-center text-[10px] font-black uppercase">
                          <span className="text-gray-500">{part.quantity} Units</span>
                          <span className={cn(indicator.text === 'Healthy' ? 'text-emerald-600' : 'text-red-600')}>{indicator.text}</span>
                       </div>
                       <div className="h-1.5 w-full bg-gray-200 rounded-full overflow-hidden">
                          <div 
                            className={cn("h-full transition-all", indicator.color)} 
                            style={{ width: `${Math.min((part.quantity / (part.threshold * 2)) * 100, 100)}%` }} 
                          />
                       </div>
                    </div>
                  </td>
                  <td className="px-8 py-5 text-center">
                    <span className="px-3 py-1 rounded-lg bg-gray-50 border border-gray-200 text-[10px] font-black text-gray-500 uppercase">
                      Min: {part.threshold}
                    </span>
                  </td>
                  <td className="px-8 py-5">
                    <span className="text-sm font-bold text-gray-900 tracking-tight">₹ {part.unit_cost.toLocaleString()}</span>
                  </td>
                  <td className="px-8 py-5 text-right">
                    <div className="flex justify-end gap-2">
                       <button 
                        onClick={() => { setSelectedPart(part); setIsStockModalOpen(true); }}
                        className="p-2.5 bg-gray-100 text-gray-400 hover:text-gray-900 rounded-xl border border-gray-200 transition-all flex items-center gap-2"
                       >
                          <ArrowRightLeft size={16} />
                       </button>
                       <button
                         onClick={() => setDeactivateId(part.id)}
                         className="p-2.5 bg-gray-100 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-xl border border-gray-200 transition-all"
                       >
                         <Trash2 size={16} />
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
              className="absolute inset-0 bg-black/30 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="relative w-full max-w-lg bg-white border border-gray-200 rounded-[40px] p-10 space-y-8"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-black text-gray-900 tracking-tighter">Stock Adjustment</h2>
                  <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest">{selectedPart.name}</p>
                </div>
                <button onClick={() => setIsStockModalOpen(false)} className="p-2 hover:bg-gray-50 rounded-xl transition-all text-gray-400"><X size={24} /></button>
              </div>

              <div className="grid grid-cols-2 gap-4">
                 <button className="p-6 bg-gray-50 border border-gray-200 rounded-3xl flex flex-col items-center gap-3 hover:border-emerald-500/50 transition-all group">
                    <div className="w-12 h-12 rounded-2xl bg-emerald-100 flex items-center justify-center text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white transition-all">
                       <ArrowUpRight size={24} />
                    </div>
                    <span className="text-xs font-black text-gray-900 uppercase">Add Stock (PO)</span>
                 </button>
                 <button className="p-6 bg-gray-50 border border-gray-200 rounded-3xl flex flex-col items-center gap-3 hover:border-red-500/50 transition-all group">
                    <div className="w-12 h-12 rounded-2xl bg-red-100 flex items-center justify-center text-red-600 group-hover:bg-red-600 group-hover:text-white transition-all">
                       <ArrowDownRight size={24} />
                    </div>
                    <span className="text-xs font-black text-gray-900 uppercase">Deduct (Job)</span>
                 </button>
              </div>

              <div className="space-y-4 pt-4 border-t border-gray-200">
                <div className="space-y-2">
                   <label className="text-[10px] font-black text-gray-500 uppercase ml-1">Adjustment Quantity</label>
                   <input type="number" placeholder="Enter units..." className="w-full bg-gray-50 border border-gray-200 rounded-2xl p-4 text-gray-900 font-black" />
                </div>
                <div className="space-y-2">
                   <label className="text-[10px] font-black text-gray-500 uppercase ml-1">Reference (PO / Job Card #)</label>
                   <input placeholder="JC-2024-8812" className="w-full bg-gray-50 border border-gray-200 rounded-2xl p-4 text-gray-900 font-bold" />
                </div>
              </div>

              <button className="w-full py-5 bg-[#6A1B9A] text-white rounded-2xl font-black text-sm hover:bg-[#7B1FA2] transition-all">
                Commit Stock Update
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <ConfirmDialog open={deactivateId !== null} title="Deactivate Inventory Item" message="Are you sure you want to deactivate this inventory item?" variant="danger" confirmLabel="Deactivate Item" onConfirm={() => deactivateMutation.mutate(deactivateId!)} onCancel={() => setDeactivateId(null)} isLoading={deactivateMutation.isPending} />
    </div>
  );
}
