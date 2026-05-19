import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { 
  Search, 
  Filter, 
  ChevronRight,
  Bell,
  Download,
  CheckCircle2,
  X,
  Wrench
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import { socket } from '../../lib/socket';
import { cn } from '../../lib/utils';
import axios from 'axios';
import { format, differenceInHours } from 'date-fns';

// --- Types ---
interface FaultReport {
  id: string;
  asset_tag: string;
  asset_name: string;
  severity: 'P1' | 'P2' | 'P3';
  status: 'open' | 'in_progress' | 'resolved';
  reported_by: string;
  reported_at: string;
  department: string;
  description: string;
}

export default function FaultsListPage() {
  const { user: _user } = useAuth();
  const [selectedFault, setSelectedFault] = useState<FaultReport | null>(null);
  const [liveAlert, setLiveAlert] = useState<FaultReport | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);



  // --- Queries ---
  const { data: faults } = useQuery({
    queryKey: ['faults-list'],
    queryFn: async () => {
      const res = await axios.get('/api/faults');
      return res.data.data as FaultReport[];
    }
  });

  // --- Socket.io Real-time ---
  useEffect(() => {
    socket.connect();
    socket.on('fault:new', (fault: FaultReport) => {
      if (fault.severity === 'P1') {
        setLiveAlert(fault);
      }
      // Query cache invalidation would happen here
    });
    return () => { socket.disconnect(); };
  }, []);

  const getSeverityStyle = (s: string) => {
    switch(s) {
      case 'P1': return 'bg-red-600 text-white';
      case 'P2': return 'bg-amber-50 text-amber-600 border-amber-200';
      default: return 'bg-purple-50 text-purple-600 border-purple-200';
    }
  };

  const getSLATime = (date: string, severity: string) => {
    const elapsed = differenceInHours(new Date(), new Date(date));
    const thresholds: any = { P1: 4, P2: 24, P3: 72 };
    const limit = thresholds[severity];
    
    return {
      elapsed,
      limit,
      isOverdue: elapsed > limit
    };
  };

  return (
    <div className="space-y-8 pb-32 relative">
      {/* 1. Live Alert Banner (P1) */}
      <AnimatePresence>
        {liveAlert && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="bg-red-600 text-white px-6 py-4 rounded-3xl flex items-center justify-between relative z-50 overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-64 h-full bg-white/10 blur-3xl -rotate-12 translate-x-32" />
            <div className="flex items-center gap-4 relative z-10">
              <div className="p-3 bg-white/20 rounded-2xl animate-pulse">
                <Bell size={24} />
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-80">Urgent P1 Fault Reported</p>
                <h3 className="text-lg font-black">{liveAlert.asset_name} ({liveAlert.asset_tag})</h3>
              </div>
            </div>
            <div className="flex items-center gap-4 relative z-10">
              <button className="bg-white text-red-600 px-6 py-2 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-slate-100 transition-all">
                Respond Now
              </button>
              <button onClick={() => setLiveAlert(null)} className="p-2 hover:bg-white/10 rounded-lg transition-all">
                <X size={20} />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-4xl font-black text-gray-900 tracking-tighter">Emergency Fault Control</h1>
          <p className="text-gray-500 font-medium text-sm">Centralized intake and resolution for all breakdown reports.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="bg-green-50 border border-green-200 px-4 py-2 rounded-2xl flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-ping" />
            <span className="text-[10px] font-black text-green-700 uppercase tracking-widest">Live Monitoring</span>
          </div>
          <button className="p-3 bg-gray-100 text-gray-700 rounded-2xl border border-gray-200 hover:bg-gray-200 transition-all">
            <Download size={20} />
          </button>
        </div>
      </div>

      {/* 2. Filter Bar */}
      <div className="bg-gray-50 border border-gray-200 p-6 rounded-3xl grid md:grid-cols-4 gap-6">
        <div className="relative">
          <Search className="absolute left-3 top-3 text-gray-400" size={18} />
          <input placeholder="Search fault ID or asset..." className="w-full bg-white border border-gray-200 rounded-xl py-2.5 pl-10 pr-4 text-xs text-gray-900 placeholder:text-gray-400" />
        </div>
        <select className="bg-white border border-gray-200 rounded-xl px-4 py-2.5 text-xs text-gray-700 outline-none">
          <option>All Severities</option>
          <option>P1 Critical</option>
          <option>P2 Standard</option>
          <option>P3 Low</option>
        </select>
        <select className="bg-white border border-gray-200 rounded-xl px-4 py-2.5 text-xs text-gray-700 outline-none">
          <option>All Statuses</option>
          <option>Open</option>
          <option>In Progress</option>
          <option>Resolved</option>
        </select>
        <button className="flex items-center justify-center gap-2 bg-[#6A1B9A] text-white rounded-xl py-2.5 text-xs font-bold hover:bg-[#7B1FA2] transition-all">
          <Filter size={14} /> Advanced Filters
        </button>
      </div>

      {/* 3. Faults Table */}
      <div className="bg-white border border-gray-200 rounded-3xl overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="bg-gray-50 text-left">
              <th className="px-6 py-5 text-[10px] font-black text-gray-500 uppercase tracking-widest">Fault ID</th>
              <th className="px-6 py-5 text-[10px] font-black text-gray-500 uppercase tracking-widest">Asset Details</th>
              <th className="px-6 py-5 text-[10px] font-black text-gray-500 uppercase tracking-widest text-center">Severity</th>
              <th className="px-6 py-5 text-[10px] font-black text-gray-500 uppercase tracking-widest">Response SLA</th>
              <th className="px-6 py-5 text-[10px] font-black text-gray-500 uppercase tracking-widest">Reporter</th>
              <th className="px-6 py-5 text-[10px] font-black text-gray-500 uppercase tracking-widest text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {faults?.map(f => {
              const sla = getSLATime(f.reported_at, f.severity);
              return (
                <tr 
                  key={f.id} 
                  onClick={() => { setSelectedFault(f); setIsDrawerOpen(true); }}
                  className="border-b border-gray-100 last:border-0 hover:bg-gray-50 transition-all cursor-pointer group"
                >
                  <td className="px-6 py-4 font-mono text-xs text-[#6A1B9A]">#{f.id.slice(0, 8)}</td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col">
                      <span className="text-sm font-bold text-gray-900 group-hover:text-[#6A1B9A] transition-colors">{f.asset_name}</span>
                      <span className="text-[10px] text-gray-500 uppercase font-black">{f.asset_tag}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className={cn("px-2.5 py-1 rounded text-[10px] font-black uppercase border", getSeverityStyle(f.severity))}>
                      {f.severity}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col gap-1">
                      <div className="w-32 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                        <div 
                          className={cn("h-full transition-all", sla.isOverdue ? "bg-red-500" : "bg-emerald-500")}
                          style={{ width: `${Math.min((sla.elapsed / sla.limit) * 100, 100)}%` }}
                        />
                      </div>
                      <span className={cn("text-[8px] font-black uppercase tracking-widest", sla.isOverdue ? "text-red-600" : "text-gray-400")}>
                        {sla.elapsed}h Elapsed / {sla.limit}h Target
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-[10px] font-black text-gray-500">
                        {f.reported_by.split(' ').map(n => n[0]).join('')}
                      </div>
                      <div className="flex flex-col">
                        <span className="text-xs font-bold text-gray-900">{f.reported_by}</span>
                        <span className="text-[9px] text-gray-500 font-bold uppercase">{f.department}</span>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button className="p-2 text-gray-400 hover:text-[#6A1B9A] hover:bg-purple-50 rounded-lg transition-all">
                      <ChevronRight size={18} />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* 5. Fault Detail Drawer */}
      <AnimatePresence>
        {isDrawerOpen && selectedFault && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsDrawerOpen(false)}
              className="fixed inset-0 bg-black/30 z-[100]"
            />
            <motion.div 
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              className="fixed top-0 right-0 h-screen w-full max-w-lg bg-white border-l border-gray-200 z-[101] p-8 overflow-y-auto"
            >
              <div className="flex items-center justify-between mb-10">
                <h2 className="text-2xl font-black text-gray-900 tracking-tighter">Fault Investigation</h2>
                <button onClick={() => setIsDrawerOpen(false)} className="p-2 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-xl transition-all">
                  <X size={24} />
                </button>
              </div>

              <div className="space-y-8">
                <div className="flex items-center gap-4 p-4 bg-gray-50 border border-gray-200 rounded-3xl">
                   <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center font-black", getSeverityStyle(selectedFault.severity))}>
                     {selectedFault.severity}
                   </div>
                   <div>
                     <p className="text-xs font-black text-[#6A1B9A] uppercase">{selectedFault.asset_tag}</p>
                     <h3 className="text-lg font-bold text-gray-900">{selectedFault.asset_name}</h3>
                   </div>
                </div>

                <div className="space-y-4">
                  <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Fault Description</p>
                  <p className="text-sm text-gray-700 leading-relaxed bg-gray-50 p-6 rounded-3xl border border-gray-200">
                    {selectedFault.description}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-6">
                   <div className="p-4 bg-gray-50 border border-gray-200 rounded-2xl">
                      <p className="text-[9px] font-black text-gray-500 uppercase mb-1">Status</p>
                      <p className="text-xs font-bold text-gray-900 uppercase">{selectedFault.status}</p>
                   </div>
                   <div className="p-4 bg-gray-50 border border-gray-200 rounded-2xl">
                      <p className="text-[9px] font-black text-gray-500 uppercase mb-1">Reported At</p>
                      <p className="text-xs font-bold text-gray-900 uppercase">{format(new Date(selectedFault.reported_at), 'dd MMM, HH:mm')}</p>
                   </div>
                </div>

                <div className="space-y-4 pt-8">
                  <button className="w-full py-4 bg-[#6A1B9A] text-white rounded-2xl font-black text-sm shadow-lg shadow-purple-900/20 hover:bg-[#7B1FA2] transition-all flex items-center justify-center gap-2">
                    <CheckCircle2 size={20} /> Resolve Fault
                  </button>
                  <button className="w-full py-4 bg-gray-100 text-gray-700 rounded-2xl font-black text-sm border border-gray-200 hover:bg-gray-200 transition-all flex items-center justify-center gap-2">
                    <Wrench size={20} /> Create Maintenance Job
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
