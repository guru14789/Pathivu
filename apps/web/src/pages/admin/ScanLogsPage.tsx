import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { 
  Filter, 
  Download, 
  Activity, 
  MapPin, 
  User, 
  Clock, 
  ExternalLink, 
  Search,
  Zap,
  ZapOff,
  ChevronRight,
  Globe,
  ShieldAlert,
  Info
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { socket } from '../../lib/socket';
import { useAuth } from '../../context/AuthContext';
import { cn } from '../../lib/utils';
import axios from 'axios';
import { format } from 'date-fns';

// --- Types ---
interface ScanEvent {
  id: string;
  asset_tag: string;
  asset_name: string;
  scanned_by: string | null;
  role: string | null;
  timestamp: string;
  action_taken: 'viewed' | 'fault_logged' | 'condition_updated';
  location: string | null;
  ip_address: string;
  hospital_name: string;
}

export default function ScanLogsPage() {
  const { user } = useAuth();
  const [isLive, setIsLive] = useState(false);
  const [liveEvents, setLiveEvents] = useState<ScanEvent[]>([]);
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState({
    action: '',
    hospital: '',
  });

  // --- Queries ---
  const { data: logsData, isLoading } = useQuery({
    queryKey: ['scan-logs', filters, search],
    queryFn: async () => {
      const res = await axios.get('/api/scans/logs', { params: { ...filters, search } });
      return res.data.data;
    }
  });

  const { data: hospitals } = useQuery({
    queryKey: ['hospitals-list'],
    queryFn: async () => {
      const res = await axios.get('/api/hospitals');
      return res.data.data;
    }
  });

  // --- Real-time Logic ---
  useEffect(() => {
    if (isLive) {
      socket.connect();
      socket.on('scan:new', (event: ScanEvent) => {
        setLiveEvents(prev => [event, ...prev].slice(0, 50));
      });
    } else {
      socket.off('scan:new');
    }
    return () => { socket.off('scan:new'); };
  }, [isLive]);

  const displayLogs = isLive ? liveEvents : (logsData || []);

  const getActionBadge = (action: string) => {
    const styles: any = {
      viewed: "bg-blue-500/10 text-blue-400 border-blue-500/20",
      fault_logged: "bg-red-500/10 text-red-500 border-red-500/20",
      condition_updated: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
    };
    return cn("px-2 py-0.5 rounded text-[10px] font-black uppercase border", styles[action] || "bg-slate-500/10 text-slate-400");
  };

  return (
    <div className="space-y-8 pb-32">
      {/* Header & Export */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-4xl font-black text-white tracking-tighter">Scan Audit Intelligence</h1>
          <p className="text-slate-400 font-medium text-sm">Real-time oversight of all asset interactions and unauthorized scans.</p>
        </div>
        <div className="flex items-center gap-3">
          {/* 3. Live Feed Toggle */}
          <button 
            onClick={() => setIsLive(!isLive)}
            className={cn(
              "flex items-center gap-2 px-5 py-3 rounded-2xl text-sm font-bold transition-all border",
              isLive 
                ? "bg-emerald-500/10 border-emerald-500 text-emerald-500 shadow-lg shadow-emerald-900/20" 
                : "bg-slate-900 border-slate-800 text-slate-500"
            )}
          >
            {isLive ? <Zap className="animate-pulse" size={18} /> : <ZapOff size={18} />}
            {isLive ? "Live Feed Active" : "Go Live"}
          </button>
          {/* 5. Export Button */}
          <button className="flex items-center gap-2 px-5 py-3 bg-slate-800 text-white rounded-2xl text-sm font-bold border border-slate-700 hover:bg-slate-700 transition-all">
            <Download size={18} /> Export Excel
          </button>
        </div>
      </div>

      {/* 1. Filter Bar */}
      <div className="bg-slate-900/50 border border-slate-800 p-6 rounded-3xl grid md:grid-cols-4 gap-6">
        <div className="relative">
          <Search className="absolute left-3 top-3 text-slate-500" size={18} />
          <input 
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search asset or user..."
            className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2.5 pl-10 pr-4 text-xs text-white focus:border-blue-500 outline-none transition-all"
          />
        </div>
        <select 
          value={filters.hospital}
          onChange={e => setFilters(prev => ({ ...prev, hospital: e.target.value }))}
          className="bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white outline-none focus:border-blue-500"
        >
          <option value="">All Hospitals</option>
          {hospitals?.map((h: any) => <option key={h.hospital_id} value={h.hospital_id}>{h.name}</option>)}
        </select>
        <select 
          value={filters.action}
          onChange={e => setFilters(prev => ({ ...prev, action: e.target.value }))}
          className="bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white outline-none focus:border-blue-500"
        >
          <option value="">All Actions</option>
          <option value="viewed">Viewed</option>
          <option value="fault_logged">Fault Logged</option>
          <option value="condition_updated">Condition Updated</option>
        </select>
        <button className="flex items-center justify-center gap-2 bg-blue-600 text-white rounded-xl py-2.5 text-xs font-bold hover:bg-blue-500 transition-all">
          <Filter size={14} /> Apply Advanced Filters
        </button>
      </div>

      {/* 2. Scan Events Table */}
      <div className="bg-slate-900/30 border border-slate-800 rounded-3xl overflow-hidden backdrop-blur-md">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-slate-900/50 text-left">
                <th className="px-6 py-5 text-[10px] font-black text-slate-500 uppercase tracking-widest">Digital Identity</th>
                <th className="px-6 py-5 text-[10px] font-black text-slate-500 uppercase tracking-widest">Interacted By</th>
                <th className="px-6 py-5 text-[10px] font-black text-slate-500 uppercase tracking-widest">Role / Context</th>
                <th className="px-6 py-5 text-[10px] font-black text-slate-500 uppercase tracking-widest">Action Taken</th>
                <th className="px-6 py-5 text-[10px] font-black text-slate-500 uppercase tracking-widest">Origin Intelligence</th>
                <th className="px-6 py-5 text-[10px] font-black text-slate-500 uppercase tracking-widest">Timestamp</th>
                <th className="px-6 py-5 text-[10px] font-black text-slate-500 uppercase tracking-widest text-right">Drill-down</th>
              </tr>
            </thead>
            <tbody>
              <AnimatePresence initial={false}>
                {displayLogs.map((log: ScanEvent) => (
                  <motion.tr 
                    key={log.id}
                    initial={{ opacity: 0, x: isLive ? -20 : 0 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="border-b border-slate-800/50 last:border-0 hover:bg-slate-800/30 transition-all group"
                  >
                    {/* 4. Asset Drill-down */}
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="text-xs font-black text-blue-500 uppercase">{log.asset_tag}</span>
                        <span className="text-xs font-bold text-white group-hover:text-blue-400 transition-colors cursor-pointer">{log.asset_name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className={cn(
                          "w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-black border",
                          log.scanned_by ? "bg-blue-500/10 text-blue-500 border-blue-500/20" : "bg-red-500/10 text-red-500 border-red-500/20"
                        )}>
                          {log.scanned_by ? <User size={14} /> : <ShieldAlert size={14} />}
                        </div>
                        <span className={cn("text-xs font-bold", log.scanned_by ? "text-white" : "text-red-400")}>
                          {log.scanned_by || "Anonymous Scan"}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                        {log.role || "Public Visitor"}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={getActionBadge(log.action_taken)}>
                        {log.action_taken.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-1.5 text-xs text-slate-400">
                          <Globe size={12} className="text-slate-600" />
                          <span>{log.ip_address}</span>
                        </div>
                        {log.location && (
                          <div className="flex items-center gap-1.5 text-[10px] text-slate-500 font-medium">
                            <MapPin size={10} className="text-slate-600" />
                            <span>{log.location}</span>
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="text-xs font-bold text-white">{format(new Date(log.timestamp), 'HH:mm:ss')}</span>
                        <span className="text-[10px] text-slate-500 uppercase">{format(new Date(log.timestamp), 'dd MMM yyyy')}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button className="p-2 text-slate-600 hover:text-blue-500 hover:bg-blue-500/10 rounded-lg transition-all">
                        <ChevronRight size={18} />
                      </button>
                    </td>
                  </motion.tr>
                ))}
              </AnimatePresence>
            </tbody>
          </table>
          {isLoading && (
            <div className="py-20 flex flex-col items-center justify-center space-y-4">
              <Loader2 className="animate-spin text-blue-500" size={32} />
              <p className="text-xs font-black text-slate-500 uppercase tracking-widest">Syncing Audit Stream...</p>
            </div>
          )}
          {!isLoading && displayLogs.length === 0 && (
            <div className="py-20 flex flex-col items-center justify-center space-y-4 opacity-50">
               <ShieldAlert size={64} className="text-slate-800" />
               <p className="text-slate-500 font-bold uppercase tracking-widest text-xs">No Scan Events Found</p>
            </div>
          )}
        </div>
      </div>

      {/* Analytics Summary */}
      <div className="grid md:grid-cols-3 gap-8">
        <div className="bg-slate-900/50 border border-slate-800 p-6 rounded-3xl flex items-center gap-5">
           <div className="w-12 h-12 bg-blue-500/10 text-blue-500 rounded-2xl flex items-center justify-center">
              <Activity size={24} />
           </div>
           <div>
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Total Scans Today</p>
              <p className="text-2xl font-black text-white">1,402</p>
           </div>
        </div>
        <div className="bg-slate-900/50 border border-slate-800 p-6 rounded-3xl flex items-center gap-5">
           <div className="w-12 h-12 bg-red-500/10 text-red-500 rounded-2xl flex items-center justify-center">
              <ShieldAlert size={24} />
           </div>
           <div>
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Anonymous Interactions</p>
              <p className="text-2xl font-black text-white">42</p>
           </div>
        </div>
        <div className="bg-slate-900/50 border border-slate-800 p-6 rounded-3xl flex items-center gap-5">
           <div className="w-12 h-12 bg-emerald-500/10 text-emerald-500 rounded-2xl flex items-center justify-center">
              <Zap size={24} />
           </div>
           <div>
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Conversion to Fault</p>
              <p className="text-2xl font-black text-white">8.4%</p>
           </div>
        </div>
      </div>
    </div>
  );
}
