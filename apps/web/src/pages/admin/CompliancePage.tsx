import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
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
  Printer,
  Trash2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../../lib/utils';
import axios from 'axios';
import { format, differenceInDays } from 'date-fns';
import toast from 'react-hot-toast';
import ConfirmDialog from '../../components/ConfirmDialog';

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
  const [deleteId, setDeleteId] = useState<string | null>(null);

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
      case 'expired': return 'bg-red-50 text-red-600 border-red-200';
      case 'expiring': return 'bg-amber-50 text-amber-600 border-amber-200';
      default: return 'bg-emerald-50 text-emerald-600 border-emerald-200';
    }
  };

  const filteredCerts = certs?.filter(c => filterStatus === 'all' || c.status === filterStatus) || [];

  const queryClient = useQueryClient();

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await axios.delete(`/api/compliance/${id}`);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['compliance-certs'] });
      toast.success('Compliance document deleted successfully');
      setDeleteId(null);
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Failed to delete compliance document');
      setDeleteId(null);
    },
  });

  return (
    <div className="space-y-8 pb-32">
      {/* 1. RAG Summary Cards */}
      <div className="grid md:grid-cols-3 gap-6">
        {[
          { label: 'Expired Documents', count: certs?.filter(c => c.status === 'expired').length || 0, status: 'expired', icon: AlertCircle, color: 'text-red-600', bg: 'bg-red-100' },
          { label: 'Expiring < 30 Days', count: certs?.filter(c => c.status === 'expiring').length || 0, status: 'expiring', icon: Clock, color: 'text-amber-600', bg: 'bg-amber-100' },
          { label: 'Audit Ready / Valid', count: certs?.filter(c => c.status === 'valid').length || 0, status: 'valid', icon: ShieldCheck, color: 'text-emerald-600', bg: 'bg-emerald-100' },
        ].map((stat, i) => (
          <button 
            key={i}
            onClick={() => setFilterStatus(stat.status as any)}
            className={cn(
              "p-8 rounded-[40px] border flex items-center justify-between transition-all hover:scale-[1.02] active:scale-[0.98]",
              filterStatus === stat.status ? "bg-white border-[#6A1B9A]/50 shadow-lg shadow-purple-900/10" : "bg-white border-gray-200 shadow-sm"
            )}
          >
            <div className="space-y-2 text-left">
              <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest">{stat.label}</p>
              <p className="text-4xl font-black text-gray-900">{stat.count}</p>
            </div>
            <div className={cn("w-16 h-16 rounded-3xl flex items-center justify-center", stat.bg)}>
              <stat.icon size={32} className={stat.color} />
            </div>
          </button>
        ))}
      </div>

      {/* Header & Actions */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div className="space-y-2">
          <h1 className="text-4xl font-black text-gray-900 tracking-tighter">Compliance Intelligence</h1>
          <p className="text-gray-500 font-medium text-sm">NABH audit readiness & regulatory document repository.</p>
        </div>
        <div className="flex gap-3">
          <button className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-6 py-4 rounded-2xl text-xs font-black uppercase tracking-widest border border-gray-200 flex items-center gap-2 transition-all">
            <Printer size={18} /> Export Compliance Snapshot
          </button>
          <button 
            className="bg-[#6A1B9A] hover:bg-[#7B1FA2] text-white px-8 py-4 rounded-2xl text-sm font-black shadow-lg shadow-purple-900/20 flex items-center gap-2 transition-all"
          >
            <Plus size={20} /> Upload Certificate
          </button>
        </div>
      </div>

      {/* 2. Compliance Table & 3. Cert Type Filter */}
      <div className="bg-white border border-gray-200 rounded-[40px] overflow-hidden">
        <div className="p-8 border-b border-gray-200 bg-gray-50 flex flex-col md:flex-row gap-6 justify-between">
           <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2">
              {['All', 'NABH', 'AERB', 'Fire NOC', 'Calibration', 'Electrical'].map(type => (
                <button key={type} className="px-5 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest bg-gray-100 border border-gray-200 text-gray-500 hover:text-gray-900 transition-all">
                  {type}
                </button>
              ))}
           </div>
           <div className="relative w-full md:w-64">
              <Search className="absolute left-3 top-2.5 text-gray-400" size={16} />
              <input placeholder="Search certificate..." className="w-full bg-white border border-gray-200 rounded-xl py-2 pl-9 pr-4 text-xs text-gray-900" />
           </div>
        </div>

        <table className="w-full">
          <thead>
            <tr className="text-left border-b border-gray-200">
              <th className="px-8 py-6 text-[10px] font-black text-gray-500 uppercase tracking-widest">Document Registry</th>
              <th className="px-8 py-6 text-[10px] font-black text-gray-500 uppercase tracking-widest">Entity Target</th>
              <th className="px-8 py-6 text-[10px] font-black text-gray-500 uppercase tracking-widest text-center">Remaining</th>
              <th className="px-8 py-6 text-[10px] font-black text-gray-500 uppercase tracking-widest">Status</th>
              <th className="px-8 py-6 text-[10px] font-black text-gray-500 uppercase tracking-widest text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredCerts.map(cert => {
              const daysLeft = differenceInDays(new Date(cert.expiry_date), new Date());
              return (
                <tr key={cert.id} className="border-b border-gray-100 last:border-0 hover:bg-gray-50 transition-all group">
                  <td className="px-8 py-5">
                    <div className="flex items-center gap-4">
                       <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center text-[#6A1B9A]">
                         <FileBadge size={20} />
                       </div>
                       <div>
                         <p className="text-sm font-bold text-gray-900 group-hover:text-[#6A1B9A] transition-colors">{cert.type}</p>
                         <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Issued By: {cert.issued_by}</p>
                       </div>
                    </div>
                  </td>
                  <td className="px-8 py-5">
                    <div className="flex flex-col">
                       <span className="text-xs font-bold text-gray-900">{cert.asset_name || cert.hospital_name}</span>
                       <span className="text-[10px] text-gray-400 font-black uppercase tracking-tighter">{cert.asset_tag || 'Hospital Wide'}</span>
                    </div>
                  </td>
                  <td className="px-8 py-5 text-center">
                    <div className={cn(
                      "inline-flex flex-col items-center justify-center min-w-[60px] p-2 rounded-2xl border",
                      daysLeft < 0 ? "border-red-200 bg-red-50" : "border-gray-200 bg-gray-50"
                    )}>
                      <span className={cn("text-xs font-black", daysLeft < 0 ? "text-red-600" : "text-gray-900")}>{daysLeft}</span>
                      <span className="text-[8px] font-black text-gray-400 uppercase">Days</span>
                    </div>
                  </td>
                  <td className="px-8 py-5">
                    <span className={cn("px-3 py-1 rounded-full text-[10px] font-black uppercase border", getStatusStyle(cert.status))}>
                      {cert.status}
                    </span>
                  </td>
                  <td className="px-8 py-5 text-right">
                    <div className="flex justify-end gap-2">
                       <button onClick={() => setSelectedCert(cert)} className="p-2.5 bg-gray-100 text-gray-400 hover:text-gray-900 rounded-xl border border-gray-200 transition-all">
                          <Eye size={16} />
                       </button>
                       <button className="p-2.5 bg-gray-100 text-gray-400 hover:text-gray-900 rounded-xl border border-gray-200 transition-all">
                          <Download size={16} />
                       </button>
                       {(cert.status === 'expired' || cert.status === 'expiring') && (
                         <button className="p-2.5 bg-purple-100 text-[#6A1B9A] hover:bg-[#6A1B9A] hover:text-white rounded-xl border border-purple-200 transition-all">
                            <RefreshCcw size={16} />
                         </button>
                       )}
                       <button
                         onClick={() => setDeleteId(cert.id)}
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

      {/* 5. Document Viewer Drawer & 7. Alert History */}
      <AnimatePresence>
        {selectedCert && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedCert(null)}
              className="fixed inset-0 bg-black/30 backdrop-blur-sm z-[100]"
            />
            <motion.div 
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              className="fixed top-0 right-0 h-screen w-full max-w-xl bg-white border-l border-gray-200 z-[101] p-10 overflow-y-auto"
            >
              <div className="flex items-center justify-between mb-12">
                <h2 className="text-2xl font-black text-gray-900 tracking-tighter leading-none">Compliance Audit View</h2>
                <button onClick={() => setSelectedCert(null)} className="p-2 hover:bg-gray-100 rounded-xl transition-all text-gray-400">
                  <X size={24} />
                </button>
              </div>

              <div className="space-y-10">
                {/* PDF Placeholder */}
                <div className="aspect-[3/4] bg-gray-50 rounded-[40px] border border-gray-200 flex flex-col items-center justify-center space-y-4 text-gray-300">
                   <FileText size={64} />
                   <p className="text-[10px] font-black uppercase tracking-[0.3em]">Encrypted Document Stream</p>
                   <button className="px-6 py-2 bg-white text-xs font-bold text-gray-500 rounded-xl border border-gray-200">Preview via R2</button>
                </div>

                <div className="grid grid-cols-2 gap-6">
                   <div className="p-6 bg-gray-50 border border-gray-200 rounded-3xl space-y-1">
                      <p className="text-[10px] font-black text-gray-500 uppercase">Expiry Date</p>
                      <p className="text-sm font-bold text-gray-900">{format(new Date(selectedCert.expiry_date), 'dd MMMM yyyy')}</p>
                   </div>
                   <div className="p-6 bg-gray-50 border border-gray-200 rounded-3xl space-y-1">
                      <p className="text-[10px] font-black text-gray-500 uppercase">Hospital Branch</p>
                      <p className="text-sm font-bold text-gray-900 uppercase">{selectedCert.hospital_name}</p>
                   </div>
                </div>

                {/* 7. Alert History Log */}
                <div className="space-y-4">
                   <h3 className="text-[10px] font-black text-gray-500 uppercase tracking-widest flex items-center gap-2">
                     <History size={14} className="text-amber-500" /> Sentinel Alert Log
                   </h3>
                   <div className="space-y-3">
                      {[
                        { label: '60-Day Pre-Forecast Alert', date: '12 Sep 2024', status: selectedCert.alerts.sent_60d },
                        { label: '30-Day Critical Renewal Alert', date: '12 Oct 2024', status: selectedCert.alerts.sent_30d },
                      ].map((log, i) => (
                        <div key={i} className="flex items-center justify-between p-4 bg-gray-50/50 rounded-2xl border border-gray-200">
                           <div className="flex items-center gap-3">
                              <ShieldCheck size={14} className={log.status ? "text-emerald-600" : "text-gray-300"} />
                              <span className="text-[10px] font-bold text-gray-900 uppercase tracking-tighter">{log.label}</span>
                           </div>
                           <span className="text-[10px] text-gray-500 font-bold">{log.status ? `Sent: ${log.date}` : 'Pending'}</span>
                        </div>
                      ))}
                   </div>
                </div>

                <div className="pt-8 flex gap-4">
                  <button className="flex-1 py-4 bg-[#6A1B9A] text-white rounded-2xl font-black text-sm shadow-lg shadow-purple-900/20 hover:bg-[#7B1FA2] transition-all">
                    Download Full PDF
                  </button>
                  <button className="flex-1 py-4 bg-gray-100 text-gray-700 rounded-2xl font-black text-sm border border-gray-200 hover:bg-gray-200 transition-all">
                    Mark as Renewed
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <ConfirmDialog open={deleteId !== null} title="Delete Compliance Document" message="Are you sure you want to delete this compliance document? This action cannot be undone." variant="danger" confirmLabel="Delete Document" onConfirm={() => deleteMutation.mutate(deleteId!)} onCancel={() => setDeleteId(null)} isLoading={deleteMutation.isPending} />
    </div>
  );
}
