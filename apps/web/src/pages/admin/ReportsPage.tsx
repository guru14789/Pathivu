import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { 
  BarChart3, 
  FileText, 
  Download, 
  ShieldCheck, 
  AlertTriangle, 
  Zap, 
  QrCode, 
  History, 
  Building2, 
  ChevronRight,
  FileSpreadsheet,
  X,
  Play,
  TrendingDown,
  Loader2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import { cn } from '../../lib/utils';
import axios from 'axios';


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
  { id: 'asset-register', label: 'Asset Register', icon: Building2, color: 'text-blue-600', bg: 'bg-blue-100', desc: 'Full inventory with depreciation' },
  { id: 'maintenance-history', label: 'Maintenance Audit', icon: History, color: 'text-emerald-600', bg: 'bg-emerald-100', desc: 'All job cards & technician activity' },
  { id: 'compliance-status', label: 'Compliance Ledger', icon: ShieldCheck, color: 'text-amber-600', bg: 'bg-amber-100', desc: 'Certificates status & RAG audit' },
  { id: 'fault-analysis', label: 'Fault Analytics', icon: AlertTriangle, color: 'text-red-600', bg: 'bg-red-100', desc: 'MTTR, breakdown trends & MTBF' },
  { id: 'depreciation-schedule', label: 'Depreciation (Sch II)', icon: TrendingDown, color: 'text-purple-600', bg: 'bg-purple-100', desc: 'Financial valuation & asset life' },
  { id: 'qr-print-sheet', label: 'QR Batch Builder', icon: QrCode, color: 'text-pink-600', bg: 'bg-pink-100', desc: 'A4 print-ready sheets' },
];

export default function ReportsPage() {
  const { user: _user } = useAuth();
  const [selectedReport, setSelectedReport] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  // --- Queries ---
  const { data: _history } = useQuery({
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
        <h1 className="text-4xl font-black text-gray-900 tracking-tighter">Intelligence Hub</h1>
        <p className="text-gray-500 font-medium text-sm">Generate executive reports and NABH-compliant documentation.</p>
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
                "bg-white border border-gray-200 p-8 rounded-[40px] space-y-6 cursor-pointer hover:border-purple-500/30 transition-all group relative overflow-hidden shadow-sm",
                selectedReport === type.id && "border-[#6A1B9A]/50 ring-2 ring-[#6A1B9A]/20"
              )}
            >
              <div className="flex items-center justify-between">
                <div className={cn("w-14 h-14 rounded-2xl flex items-center justify-center", type.bg)}>
                   <type.icon size={28} className={type.color} />
                </div>
                <div className="flex -space-x-1">
                   <div className="w-8 h-8 rounded-full bg-gray-100 border-2 border-gray-200 flex items-center justify-center">
                     <FileSpreadsheet size={14} className="text-emerald-500" />
                   </div>
                   <div className="w-8 h-8 rounded-full bg-gray-100 border-2 border-gray-200 flex items-center justify-center">
                     <FileText size={14} className="text-red-500" />
                   </div>
                </div>
              </div>
              <div>
                <h3 className="text-xl font-black text-gray-900 group-hover:text-[#6A1B9A] transition-colors">{type.label}</h3>
                <p className="text-xs text-gray-500 font-medium mt-1 leading-relaxed">{type.desc}</p>
              </div>
              <button className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2 group-hover:text-gray-900 transition-all">
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
                 className="bg-white border border-gray-200 rounded-[40px] p-8 space-y-8 sticky top-8"
               >
                 <div className="flex items-center justify-between">
                    <h2 className="text-sm font-black text-gray-500 uppercase tracking-[0.3em]">Configure Run</h2>
                    <button onClick={() => setSelectedReport(null)} className="text-gray-400 hover:text-gray-700"><X size={20} /></button>
                 </div>

                 <div className="space-y-6">
                    <div className="space-y-2">
                       <label className="text-[10px] font-black text-gray-500 uppercase ml-1">Target Entity / Hospital</label>
                       <select className="w-full bg-gray-50 border border-gray-200 rounded-2xl p-4 text-xs text-gray-700 outline-none">
                          <option>All Hospital Branches</option>
                          <option>City Central Hospital</option>
                       </select>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                       <div className="space-y-2">
                          <label className="text-[10px] font-black text-gray-500 uppercase ml-1">From Date</label>
                          <input type="date" className="w-full bg-gray-50 border border-gray-200 rounded-2xl p-4 text-[10px] text-gray-700" />
                       </div>
                       <div className="space-y-2">
                          <label className="text-[10px] font-black text-gray-500 uppercase ml-1">To Date</label>
                          <input type="date" className="w-full bg-gray-50 border border-gray-200 rounded-2xl p-4 text-[10px] text-gray-700" />
                       </div>
                    </div>

                    <div className="space-y-2">
                       <label className="text-[10px] font-black text-gray-500 uppercase ml-1">Output Format</label>
                       <div className="grid grid-cols-2 gap-3">
                          <button className="flex items-center justify-center gap-2 p-4 bg-gray-50 border-2 border-emerald-200 rounded-2xl group transition-all hover:border-emerald-500">
                             <FileSpreadsheet size={18} className="text-emerald-500" />
                             <span className="text-[10px] font-black text-gray-700">XLSX</span>
                          </button>
                          <button className="flex items-center justify-center gap-2 p-4 bg-gray-50 border-2 border-red-200 rounded-2xl group transition-all hover:border-red-500">
                             <FileText size={18} className="text-red-500" />
                             <span className="text-[10px] font-black text-gray-700">PDF</span>
                          </button>
                       </div>
                    </div>

                    <div className="p-4 bg-purple-50 border border-purple-200 rounded-3xl space-y-2">
                       <div className="flex items-center gap-2 text-purple-700">
                          <Zap size={14} />
                          <span className="text-[10px] font-black uppercase">Background Job</span>
                       </div>
                       <p className="text-[10px] text-purple-700 font-medium leading-relaxed">Large reports are processed via BullMQ. You will receive an alert once ready.</p>
                    </div>

                    <button 
                      onClick={() => setIsGenerating(true)}
                      className="w-full py-5 bg-[#6A1B9A] hover:bg-[#7B1FA2] text-white rounded-3xl font-black text-sm shadow-lg shadow-purple-900/20 flex items-center justify-center gap-3 transition-all"
                    >
                      {isGenerating ? <Loader2 size={20} className="animate-spin" /> : <Play size={20} />}
                      {isGenerating ? 'Processing Data...' : 'Generate Intelligence'}
                    </button>
                 </div>
               </motion.div>
             ) : (
               <div className="h-[500px] bg-gray-50/50 border-2 border-dashed border-gray-200 rounded-[40px] flex flex-col items-center justify-center space-y-4 text-gray-400">
                  <BarChart3 size={64} />
                  <p className="text-xs font-black uppercase tracking-[0.3em]">Select a report to begin</p>
               </div>
             )}
           </AnimatePresence>
        </div>
      </div>

      {/* 7. Download History */}
      <div className="space-y-6 pt-10 border-t border-gray-200">
         <div className="flex items-center justify-between">
           <h2 className="text-2xl font-black text-gray-900 tracking-tighter">Report Vault</h2>
           <button className="text-[10px] font-black text-gray-400 uppercase hover:text-gray-900 transition-all">Clear History</button>
         </div>
         
         <div className="grid md:grid-cols-2 gap-6">
            {[1, 2].map(i => (
              <div key={i} className="bg-white border border-gray-200 p-6 rounded-3xl flex items-center justify-between group hover:border-purple-500/20 transition-all">
                <div className="flex items-center gap-4">
                   <div className="w-12 h-12 bg-gray-50 border border-gray-200 rounded-2xl flex items-center justify-center text-emerald-600">
                     <FileSpreadsheet size={24} />
                   </div>
                   <div>
                     <p className="text-sm font-bold text-gray-900 uppercase">Asset_Registry_Full_Oct24.xlsx</p>
                     <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Generated 2h ago • 4.2 MB</p>
                   </div>
                </div>
                <button className="w-10 h-10 rounded-xl bg-gray-100 text-gray-400 hover:bg-[#6A1B9A] hover:text-white flex items-center justify-center transition-all">
                  <Download size={18} />
                </button>
              </div>
            ))}
         </div>
      </div>
    </div>
  );
}
