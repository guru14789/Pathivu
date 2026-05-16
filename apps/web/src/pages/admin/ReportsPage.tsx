import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { 
  BarChart3, 
  FileText, 
  Download, 
  Clock, 
  ShieldCheck, 
  AlertTriangle, 
  Zap, 
  QrCode, 
  History, 
  Calendar, 
  Building2, 
  ChevronRight,
  Filter,
  FileSpreadsheet,
  FileJson,
  X,
  Play,
  Settings2,
  TrendingDown,
  Loader2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import { cn } from '../../lib/utils';
import axios from 'axios';
import { format } from 'date-fns';

// --- Types ---
interface ReportHistory {
  id: string;
  name: string;
  type: string;
  generated_at: string;
  format: 'xlsx' | 'pdf';
  status: 'ready' | 'processing' | 'failed';
  url: string | null;
}

const REPORT_TYPES = [
  { id: 'asset-register', label: 'Asset Register', icon: Building2, color: 'text-blue-500', desc: 'Full inventory with depreciation' },
  { id: 'maintenance-history', label: 'Maintenance Audit', icon: History, color: 'text-emerald-500', desc: 'All job cards & technician activity' },
  { id: 'compliance-status', label: 'Compliance Ledger', icon: ShieldCheck, color: 'text-amber-500', desc: 'Certificates status & RAG audit' },
  { id: 'fault-analysis', label: 'Fault Analytics', icon: AlertTriangle, color: 'text-red-500', desc: 'MTTR, breakdown trends & MTBF' },
  { id: 'depreciation-schedule', label: 'Depreciation (Sch II)', icon: TrendingDown, color: 'text-purple-500', desc: 'Financial valuation & asset life' },
  { id: 'qr-print-sheet', label: 'QR Batch Builder', icon: QrCode, color: 'text-pink-500', desc: 'A4 print-ready sheets' },
];

export default function ReportsPage() {
  const { user } = useAuth();
  const [selectedReport, setSelectedReport] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  // --- Queries ---
  const { data: history } = useQuery({
    queryKey: ['report-history'],
    queryFn: async () => {
      const res = await axios.get('/api/reports/history');
      return res.data.data as ReportHistory[];
    }
  });

  return (
    <div className="space-y-10 pb-32">
      {/* Header */}
      <div>
        <h1 className="text-4xl font-black text-white tracking-tighter">Intelligence Hub</h1>
        <p className="text-slate-400 font-medium text-sm">Generate executive reports and NABH-compliant documentation.</p>
      </div>

      <div className="grid lg:grid-cols-12 gap-10">
        {/* 1. Report Type Cards */}
        <div className="lg:col-span-8 grid md:grid-cols-2 gap-6">
          {REPORT_TYPES.map((type, i) => (
            <motion.div 
              key={type.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              onClick={() => setSelectedReport(type.id)}
              className={cn(
                "bg-slate-900/50 border border-slate-800 p-8 rounded-[40px] space-y-6 cursor-pointer hover:border-blue-500/30 transition-all group relative overflow-hidden",
                selectedReport === type.id && "border-blue-500/50 ring-2 ring-blue-500/20"
              )}
            >
              <div className="flex items-center justify-between">
                <div className={cn("w-14 h-14 rounded-2xl flex items-center justify-center bg-opacity-10", type.color.replace('text-', 'bg-'))}>
                   <type.icon size={28} className={type.color} />
                </div>
                <div className="flex -space-x-1">
                   <div className="w-8 h-8 rounded-full bg-slate-950 border-2 border-slate-900 flex items-center justify-center">
                     <FileSpreadsheet size={14} className="text-emerald-500" />
                   </div>
                   <div className="w-8 h-8 rounded-full bg-slate-950 border-2 border-slate-900 flex items-center justify-center">
                     <FileText size={14} className="text-red-500" />
                   </div>
                </div>
              </div>
              <div>
                <h3 className="text-xl font-black text-white group-hover:text-blue-400 transition-colors">{type.label}</h3>
                <p className="text-xs text-slate-500 font-medium mt-1 leading-relaxed">{type.desc}</p>
              </div>
              <button className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2 group-hover:text-white transition-all">
                Configure Report <ChevronRight size={14} />
              </button>
            </motion.div>
          ))}
        </div>

        {/* 2-6. Dynamic Configuration Forms */}
        <div className="lg:col-span-4">
           <AnimatePresence mode="wait">
             {selectedReport ? (
               <motion.div 
                 key={selectedReport}
                 initial={{ opacity: 0, x: 20 }}
                 animate={{ opacity: 1, x: 0 }}
                 exit={{ opacity: 0, x: 20 }}
                 className="bg-slate-900 border border-slate-800 rounded-[40px] p-8 space-y-8 sticky top-8"
               >
                 <div className="flex items-center justify-between">
                    <h2 className="text-sm font-black text-slate-500 uppercase tracking-[0.3em]">Configure Run</h2>
                    <button onClick={() => setSelectedReport(null)} className="text-slate-500 hover:text-white"><X size={20} /></button>
                 </div>

                 <div className="space-y-6">
                    <div className="space-y-2">
                       <label className="text-[10px] font-black text-slate-500 uppercase ml-1">Target Entity / Hospital</label>
                       <select className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-4 text-xs text-white outline-none">
                          <option>All Hospital Branches</option>
                          <option>City Central Hospital</option>
                       </select>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                       <div className="space-y-2">
                          <label className="text-[10px] font-black text-slate-500 uppercase ml-1">From Date</label>
                          <input type="date" className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-4 text-[10px] text-white" />
                       </div>
                       <div className="space-y-2">
                          <label className="text-[10px] font-black text-slate-500 uppercase ml-1">To Date</label>
                          <input type="date" className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-4 text-[10px] text-white" />
                       </div>
                    </div>

                    <div className="space-y-2">
                       <label className="text-[10px] font-black text-slate-500 uppercase ml-1">Output Format</label>
                       <div className="grid grid-cols-2 gap-3">
                          <button className="flex items-center justify-center gap-2 p-4 bg-slate-950 border-2 border-emerald-500/20 rounded-2xl group transition-all hover:border-emerald-500">
                             <FileSpreadsheet size={18} className="text-emerald-500" />
                             <span className="text-[10px] font-black text-white">XLSX</span>
                          </button>
                          <button className="flex items-center justify-center gap-2 p-4 bg-slate-950 border-2 border-red-500/20 rounded-2xl group transition-all hover:border-red-500">
                             <FileText size={18} className="text-red-500" />
                             <span className="text-[10px] font-black text-white">PDF</span>
                          </button>
                       </div>
                    </div>

                    <div className="p-4 bg-blue-500/5 border border-blue-500/20 rounded-3xl space-y-2">
                       <div className="flex items-center gap-2 text-blue-500">
                          <Zap size={14} />
                          <span className="text-[10px] font-black uppercase">Background Job</span>
                       </div>
                       <p className="text-[10px] text-slate-400 font-medium leading-relaxed">Large reports are processed via BullMQ. You will receive an alert once ready.</p>
                    </div>

                    <button 
                      onClick={() => setIsGenerating(true)}
                      className="w-full py-5 bg-blue-600 hover:bg-blue-500 text-white rounded-3xl font-black text-sm shadow-xl shadow-blue-900/20 flex items-center justify-center gap-3 transition-all"
                    >
                      {isGenerating ? <Loader2 size={20} className="animate-spin" /> : <Play size={20} />}
                      {isGenerating ? 'Processing Data...' : 'Generate Intelligence'}
                    </button>
                 </div>
               </motion.div>
             ) : (
               <div className="h-[500px] bg-slate-900/20 border-2 border-dashed border-slate-800 rounded-[40px] flex flex-col items-center justify-center space-y-4 text-slate-600">
                  <BarChart3 size={64} />
                  <p className="text-xs font-black uppercase tracking-[0.3em]">Select a report to begin</p>
               </div>
             )}
           </AnimatePresence>
        </div>
      </div>

      {/* 7. Download History */}
      <div className="space-y-6 pt-10 border-t border-slate-800/50">
         <div className="flex items-center justify-between">
           <h2 className="text-2xl font-black text-white tracking-tighter">Report Vault</h2>
           <button className="text-[10px] font-black text-slate-500 uppercase hover:text-white transition-all">Clear History</button>
         </div>
         
         <div className="grid md:grid-cols-2 gap-6">
            {[1, 2].map(i => (
              <div key={i} className="bg-slate-900/30 border border-slate-800 p-6 rounded-3xl flex items-center justify-between group hover:border-blue-500/20 transition-all">
                <div className="flex items-center gap-4">
                   <div className="w-12 h-12 bg-slate-950 border border-slate-800 rounded-2xl flex items-center justify-center text-emerald-500">
                     <FileSpreadsheet size={24} />
                   </div>
                   <div>
                     <p className="text-sm font-bold text-white uppercase">Asset_Registry_Full_Oct24.xlsx</p>
                     <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Generated 2h ago • 4.2 MB</p>
                   </div>
                </div>
                <button className="w-10 h-10 rounded-xl bg-slate-800 text-slate-400 hover:bg-blue-600 hover:text-white flex items-center justify-center transition-all">
                  <Download size={18} />
                </button>
              </div>
            ))}
         </div>
      </div>
    </div>
  );
}
