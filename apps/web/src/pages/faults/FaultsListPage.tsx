import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { 
  AlertTriangle, 
  Search, 
  Filter, 
  Clock, 
  User, 
  ExternalLink, 
  MessageSquare, 
  ChevronRight,
  ShieldAlert,
  Loader2,
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
  const { user } = useAuth();
  const [selectedFault, setSelectedFault] = useState<FaultReport | null>(null);
  const [liveAlert, setLiveAlert] = useState<FaultReport | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const isAdmin = ['super_admin', 'branch_admin', 'supervisor'].includes(user?.role || '');

  // --- Queries ---
  const { data: faults, isLoading } = useQuery({
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
      case 'P1': return 'bg-red-500 text-white border-red-600 shadow-lg shadow-red-900/20';
      case 'P2': return 'bg-amber-500/10 text-amber-500 border-amber-500/20';
      default: return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
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
            className="bg-red-600 text-white px-6 py-4 rounded-3xl flex items-center justify-between shadow-2xl shadow-red-900/40 relative z-50 overflow-hidden"
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
          <h1 className="text-4xl font-black text-white tracking-tighter">Emergency Fault Control</h1>
          <p className="text-slate-400 font-medium text-sm">Centralized intake and resolution for all breakdown reports.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="bg-slate-900 border border-slate-800 px-4 py-2 rounded-2xl flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Live Monitoring</span>
          </div>
          <button className="p-3 bg-slate-800 text-white rounded-2xl border border-slate-700 hover:bg-slate-700 transition-all">
            <Download size={20} />
          </button>
        </div>
      </div>

      {/* 2. Filter Bar */}
      <div className="bg-slate-900/50 border border-slate-800 p-6 rounded-3xl grid md:grid-cols-4 gap-6">
        <div className="relative">
          <Search className="absolute left-3 top-3 text-slate-500" size={18} />
          <input placeholder="Search fault ID or asset..." className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2.5 pl-10 pr-4 text-xs text-white" />
        </div>
        <select className="bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white outline-none">
          <option>All Severities</option>
          <option>P1 Critical</option>
          <option>P2 Standard</option>
          <option>P3 Low</option>
        </select>
        <select className="bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white outline-none">
          <option>All Statuses</option>
          <option>Open</option>
          <option>In Progress</option>
          <option>Resolved</option>
        </select>
        <button className="flex items-center justify-center gap-2 bg-blue-600 text-white rounded-xl py-2.5 text-xs font-bold hover:bg-blue-500 transition-all">
          <Filter size={14} /> Advanced Filters
        </button>
      </div>

      {/* 3. Faults Table */}
      <div className="bg-slate-900/30 border border-slate-800 rounded-3xl overflow-hidden backdrop-blur-md">
        <table className="w-full">
          <thead>
            <tr className="bg-slate-900/50 text-left">
              <th className="px-6 py-5 text-[10px] font-black text-slate-500 uppercase tracking-widest">Fault ID</th>
              <th className="px-6 py-5 text-[10px] font-black text-slate-500 uppercase tracking-widest">Asset Details</th>
              <th className="px-6 py-5 text-[10px] font-black text-slate-500 uppercase tracking-widest text-center">Severity</th>
              <th className="px-6 py-5 text-[10px] font-black text-slate-500 uppercase tracking-widest">Response SLA</th>
              <th className="px-6 py-5 text-[10px] font-black text-slate-500 uppercase tracking-widest">Reporter</th>
              <th className="px-6 py-5 text-[10px] font-black text-slate-500 uppercase tracking-widest text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {faults?.map(f => {
              const sla = getSLATime(f.reported_at, f.severity);
              return (
                <tr 
                  key={f.id} 
                  onClick={() => { setSelectedFault(f); setIsDrawerOpen(true); }}
                  className="border-b border-slate-800/50 last:border-0 hover:bg-slate-800/30 transition-all cursor-pointer group"
                >
                  <td className="px-6 py-4 font-mono text-xs text-blue-400">#{f.id.slice(0, 8)}</td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col">
                      <span className="text-sm font-bold text-white group-hover:text-blue-400 transition-colors">{f.asset_name}</span>
                      <span className="text-[10px] text-slate-500 uppercase font-black">{f.asset_tag}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className={cn("px-2.5 py-1 rounded text-[10px] font-black uppercase border", getSeverityStyle(f.severity))}>
                      {f.severity}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    {/* 4. SLA Indicator */}
                    <div className="flex flex-col gap-1">
                      <div className="w-32 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                        <div 
                          className={cn("h-full transition-all", sla.isOverdue ? "bg-red-500" : "bg-emerald-500")}
                          style={{ width: `${Math.min((sla.elapsed / sla.limit) * 100, 100)}%` }}
                        />
                      </div>
                      <span className={cn("text-[8px] font-black uppercase tracking-widest", sla.isOverdue ? "text-red-500" : "text-slate-500")}>
                        {sla.elapsed}h Elapsed / {sla.limit}h Target
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-[10px] font-black text-slate-400">
                        {f.reported_by.split(' ').map(n => n[0]).join('')}
                      </div>
                      <div className="flex flex-col">
                        <span className="text-xs font-bold text-white">{f.reported_by}</span>
                        <span className="text-[9px] text-slate-500 font-bold uppercase">{f.department}</span>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button className="p-2 text-slate-600 hover:text-blue-500 hover:bg-blue-500/10 rounded-lg transition-all">
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
              className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-[100]"
            />
            <motion.div 
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              className="fixed top-0 right-0 h-screen w-full max-w-lg bg-slate-900 border-l border-slate-800 z-[101] shadow-2xl p-8 overflow-y-auto"
            >
              <div className="flex items-center justify-between mb-10">
                <h2 className="text-2xl font-black text-white tracking-tighter">Fault Investigation</h2>
                <button onClick={() => setIsDrawerOpen(false)} className="p-2 hover:bg-slate-800 rounded-xl transition-all text-slate-500">
                  <X size={24} />
                </button>
              </div>

              <div className="space-y-8">
                <div className="flex items-center gap-4 p-4 bg-slate-950 border border-slate-800 rounded-3xl">
                   <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center font-black", getSeverityStyle(selectedFault.severity))}>
                     {selectedFault.severity}
                   </div>
                   <div>
                     <p className="text-xs font-black text-blue-500 uppercase">{selectedFault.asset_tag}</p>
                     <h3 className="text-lg font-bold text-white">{selectedFault.asset_name}</h3>
                   </div>
                </div>

                <div className="space-y-4">
                  <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Fault Description</p>
                  <p className="text-sm text-slate-300 leading-relaxed bg-slate-950/50 p-6 rounded-3xl border border-slate-800">
                    {selectedFault.description}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-6">
                   <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl">
                      <p className="text-[9px] font-black text-slate-500 uppercase mb-1">Status</p>
                      <p className="text-xs font-bold text-white uppercase">{selectedFault.status}</p>
                   </div>
                   <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl">
                      <p className="text-[9px] font-black text-slate-500 uppercase mb-1">Reported At</p>
                      <p className="text-xs font-bold text-white uppercase">{format(new Date(selectedFault.reported_at), 'dd MMM, HH:mm')}</p>
                   </div>
                </div>

                <div className="space-y-4 pt-8">
                  <button className="w-full py-4 bg-blue-600 text-white rounded-2xl font-black text-sm shadow-xl shadow-blue-900/20 hover:bg-blue-500 transition-all flex items-center justify-center gap-2">
                    <CheckCircle2 size={20} /> Resolve Fault
                  </button>
                  <button className="w-full py-4 bg-slate-800 text-white rounded-2xl font-black text-sm border border-slate-700 hover:bg-slate-700 transition-all flex items-center justify-center gap-2">
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
