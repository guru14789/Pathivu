import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { 
  ShieldCheck, 
  AlertCircle, 
  Clock, 
  FileText, 
  Plus, 
  Download, 
  Eye, 
  RefreshCcw, 
  History,
  FileBadge,
  Search,
  X,
  Printer
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../../lib/utils';
import axios from 'axios';
import { format, differenceInDays } from 'date-fns';

// --- Types ---
interface ComplianceCert {
  id: string;
  type: 'NABH' | 'AERB' | 'Fire NOC' | 'Calibration' | 'Electrical' | 'Biomedical Waste';
  asset_tag: string | null;
  asset_name: string | null;
  hospital_name: string;
  issued_by: string;
  expiry_date: string;
  document_url: string;
  status: 'valid' | 'expiring' | 'expired';
  alerts: {
    sent_30d: boolean;
    sent_60d: boolean;
  };
}

export default function CompliancePage() {
  const [filterStatus, setFilterStatus] = useState<'all' | 'valid' | 'expiring' | 'expired'>('all');
  const [selectedCert, setSelectedCert] = useState<ComplianceCert | null>(null);

  // --- Queries ---
  const { data: certs } = useQuery({
    queryKey: ['compliance-certs', filterStatus],
    queryFn: async () => {
      const res = await axios.get('/api/compliance');
      return res.data.data as ComplianceCert[];
    }
  });

  const getStatusStyle = (status: string) => {
    switch(status) {
      case 'expired': return 'bg-red-500/10 text-red-500 border-red-500/20';
      case 'expiring': return 'bg-amber-500/10 text-amber-500 border-amber-500/20';
      default: return 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20';
    }
  };

  const filteredCerts = certs?.filter(c => filterStatus === 'all' || c.status === filterStatus) || [];

  return (
    <div className="space-y-8 pb-32">
      {/* 1. RAG Summary Cards */}
      <div className="grid md:grid-cols-3 gap-6">
        {[
          { label: 'Expired Documents', count: certs?.filter(c => c.status === 'expired').length || 0, status: 'expired', icon: AlertCircle, color: 'text-red-500', bg: 'bg-red-500/10' },
          { label: 'Expiring < 30 Days', count: certs?.filter(c => c.status === 'expiring').length || 0, status: 'expiring', icon: Clock, color: 'text-amber-500', bg: 'bg-amber-500/10' },
          { label: 'Audit Ready / Valid', count: certs?.filter(c => c.status === 'valid').length || 0, status: 'valid', icon: ShieldCheck, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
        ].map((stat, i) => (
          <button 
            key={i}
            onClick={() => setFilterStatus(stat.status as any)}
            className={cn(
              "p-8 rounded-[40px] border flex items-center justify-between transition-all hover:scale-[1.02] active:scale-[0.98]",
              filterStatus === stat.status ? "bg-slate-900 border-blue-500/50 shadow-2xl shadow-blue-900/20" : "bg-slate-900/50 border-slate-800"
            )}
          >
            <div className="space-y-2 text-left">
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{stat.label}</p>
              <p className="text-4xl font-black text-white">{stat.count}</p>
            </div>
            <div className={cn("w-16 h-16 rounded-3xl flex items-center justify-center bg-opacity-10", stat.bg)}>
              <stat.icon size={32} className={stat.color} />
            </div>
          </button>
        ))}
      </div>

      {/* Header & Actions */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div className="space-y-2">
          <h1 className="text-4xl font-black text-white tracking-tighter">Compliance Intelligence</h1>
          <p className="text-slate-400 font-medium text-sm">NABH audit readiness & regulatory document repository.</p>
        </div>
        <div className="flex gap-3">
          <button className="bg-slate-800 hover:bg-slate-700 text-white px-6 py-4 rounded-2xl text-xs font-black uppercase tracking-widest border border-slate-700 flex items-center gap-2 transition-all">
            <Printer size={18} /> Export Compliance Snapshot
          </button>
          <button 
            className="bg-blue-600 hover:bg-blue-500 text-white px-8 py-4 rounded-2xl text-sm font-black shadow-xl shadow-blue-900/20 flex items-center gap-2 transition-all"
          >
            <Plus size={20} /> Upload Certificate
          </button>
        </div>
      </div>

      {/* 2. Compliance Table & 3. Cert Type Filter */}
      <div className="bg-slate-900/30 border border-slate-800 rounded-[40px] overflow-hidden backdrop-blur-md">
        <div className="p-8 border-b border-slate-800 bg-slate-900/50 flex flex-col md:flex-row gap-6 justify-between">
           <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2">
              {['All', 'NABH', 'AERB', 'Fire NOC', 'Calibration', 'Electrical'].map(type => (
                <button key={type} className="px-5 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest bg-slate-950 border border-slate-800 text-slate-500 hover:text-white transition-all">
                  {type}
                </button>
              ))}
           </div>
           <div className="relative w-full md:w-64">
              <Search className="absolute left-3 top-2.5 text-slate-500" size={16} />
              <input placeholder="Search certificate..." className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2 pl-9 pr-4 text-xs text-white" />
           </div>
        </div>

        <table className="w-full">
          <thead>
            <tr className="text-left border-b border-slate-800">
              <th className="px-8 py-6 text-[10px] font-black text-slate-500 uppercase tracking-widest">Document Registry</th>
              <th className="px-8 py-6 text-[10px] font-black text-slate-500 uppercase tracking-widest">Entity Target</th>
              <th className="px-8 py-6 text-[10px] font-black text-slate-500 uppercase tracking-widest text-center">Remaining</th>
              <th className="px-8 py-6 text-[10px] font-black text-slate-500 uppercase tracking-widest">Status</th>
              <th className="px-8 py-6 text-[10px] font-black text-slate-500 uppercase tracking-widest text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredCerts.map(cert => {
              const daysLeft = differenceInDays(new Date(cert.expiry_date), new Date());
              return (
                <tr key={cert.id} className="border-b border-slate-800/50 last:border-0 hover:bg-slate-800/30 transition-all group">
                  <td className="px-8 py-5">
                    <div className="flex items-center gap-4">
                       <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-500">
                         <FileBadge size={20} />
                       </div>
                       <div>
                         <p className="text-sm font-bold text-white group-hover:text-blue-400 transition-colors">{cert.type}</p>
                         <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Issued By: {cert.issued_by}</p>
                       </div>
                    </div>
                  </td>
                  <td className="px-8 py-5">
                    <div className="flex flex-col">
                       <span className="text-xs font-bold text-white">{cert.asset_name || cert.hospital_name}</span>
                       <span className="text-[10px] text-slate-500 font-black uppercase tracking-tighter">{cert.asset_tag || 'Hospital Wide'}</span>
                    </div>
                  </td>
                  <td className="px-8 py-5 text-center">
                    <div className={cn(
                      "inline-flex flex-col items-center justify-center min-w-[60px] p-2 rounded-2xl border",
                      daysLeft < 0 ? "border-red-500/20 bg-red-500/5" : "border-slate-800 bg-slate-950"
                    )}>
                      <span className={cn("text-xs font-black", daysLeft < 0 ? "text-red-500" : "text-white")}>{daysLeft}</span>
                      <span className="text-[8px] font-black text-slate-500 uppercase">Days</span>
                    </div>
                  </td>
                  <td className="px-8 py-5">
                    <span className={cn("px-3 py-1 rounded-full text-[10px] font-black uppercase border", getStatusStyle(cert.status))}>
                      {cert.status}
                    </span>
                  </td>
                  <td className="px-8 py-5 text-right">
                    <div className="flex justify-end gap-2">
                       <button onClick={() => setSelectedCert(cert)} className="p-2.5 bg-slate-800 text-slate-400 hover:text-white rounded-xl border border-slate-700 transition-all">
                          <Eye size={16} />
                       </button>
                       <button className="p-2.5 bg-slate-800 text-slate-400 hover:text-blue-500 rounded-xl border border-slate-700 transition-all">
                          <Download size={16} />
                       </button>
                       {(cert.status === 'expired' || cert.status === 'expiring') && (
                         <button className="p-2.5 bg-blue-600/10 text-blue-500 hover:bg-blue-600 hover:text-white rounded-xl border border-blue-500/20 transition-all">
                            <RefreshCcw size={16} />
                         </button>
                       )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* 5. Document Viewer Drawer & 7. Alert History */}
      <AnimatePresence>
        {selectedCert && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedCert(null)}
              className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-[100]"
            />
            <motion.div 
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              className="fixed top-0 right-0 h-screen w-full max-w-xl bg-slate-900 border-l border-slate-800 z-[101] shadow-2xl p-10 overflow-y-auto"
            >
              <div className="flex items-center justify-between mb-12">
                <h2 className="text-2xl font-black text-white tracking-tighter leading-none">Compliance Audit View</h2>
                <button onClick={() => setSelectedCert(null)} className="p-2 hover:bg-slate-800 rounded-xl transition-all text-slate-500">
                  <X size={24} />
                </button>
              </div>

              <div className="space-y-10">
                {/* PDF Placeholder */}
                <div className="aspect-[3/4] bg-slate-950 rounded-[40px] border border-slate-800 flex flex-col items-center justify-center space-y-4 text-slate-700">
                   <FileText size={64} />
                   <p className="text-[10px] font-black uppercase tracking-[0.3em]">Encrypted Document Stream</p>
                   <button className="px-6 py-2 bg-slate-900 text-xs font-bold text-slate-400 rounded-xl border border-slate-800">Preview via R2</button>
                </div>

                <div className="grid grid-cols-2 gap-6">
                   <div className="p-6 bg-slate-950 border border-slate-800 rounded-3xl space-y-1">
                      <p className="text-[10px] font-black text-slate-500 uppercase">Expiry Date</p>
                      <p className="text-sm font-bold text-white">{format(new Date(selectedCert.expiry_date), 'dd MMMM yyyy')}</p>
                   </div>
                   <div className="p-6 bg-slate-950 border border-slate-800 rounded-3xl space-y-1">
                      <p className="text-[10px] font-black text-slate-500 uppercase">Hospital Branch</p>
                      <p className="text-sm font-bold text-white uppercase">{selectedCert.hospital_name}</p>
                   </div>
                </div>

                {/* 7. Alert History Log */}
                <div className="space-y-4">
                   <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                     <History size={14} className="text-amber-500" /> Sentinel Alert Log
                   </h3>
                   <div className="space-y-3">
                      {[
                        { label: '60-Day Pre-Forecast Alert', date: '12 Sep 2024', status: selectedCert.alerts.sent_60d },
                        { label: '30-Day Critical Renewal Alert', date: '12 Oct 2024', status: selectedCert.alerts.sent_30d },
                      ].map((log, i) => (
                        <div key={i} className="flex items-center justify-between p-4 bg-slate-950/50 rounded-2xl border border-slate-800/50">
                           <div className="flex items-center gap-3">
                              <ShieldCheck size={14} className={log.status ? "text-emerald-500" : "text-slate-700"} />
                              <span className="text-[10px] font-bold text-white uppercase tracking-tighter">{log.label}</span>
                           </div>
                           <span className="text-[10px] text-slate-500 font-bold">{log.status ? `Sent: ${log.date}` : 'Pending'}</span>
                        </div>
                      ))}
                   </div>
                </div>

                <div className="pt-8 flex gap-4">
                  <button className="flex-1 py-4 bg-blue-600 text-white rounded-2xl font-black text-sm shadow-xl shadow-blue-900/20 hover:bg-blue-500 transition-all">
                    Download Full PDF
                  </button>
                  <button className="flex-1 py-4 bg-slate-800 text-white rounded-2xl font-black text-sm border border-slate-700 hover:bg-slate-700 transition-all">
                    Mark as Renewed
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
