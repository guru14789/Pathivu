import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { 
  History, 
  Search, 
  Filter, 
  Download, 
  ChevronDown, 
  ChevronUp, 
  User, 
  Clock, 
  Globe, 
  Database,
  ArrowRight,
  ShieldCheck,
  Building2,
  ExternalLink,
  ChevronRight,
  DatabaseZap
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import { cn } from '../../lib/utils';
import axios from 'axios';
import { format } from 'date-fns';

// --- Types ---
interface AuditLog {
  log_id: string;
  created_at: string;
  table_name: string;
  record_id: string;
  action: 'INSERT' | 'UPDATE' | 'DELETE';
  user_full_name: string;
  user_role: string;
  hospital_name: string;
  ip_address: string;
  old_values: Record<string, any> | null;
  new_values: Record<string, any> | null;
}

export default function AuditLogsPage() {
  const { user } = useAuth();
  const [expandedRow, setExpandedRow] = useState<string | null>(null);
  const [filterTable, setFilterTable] = useState('all');

  const handleExport = () => {
    // In a real app, this would call an API to generate and download Excel
    console.log('Exporting audit logs...');
    alert('Exporting audit trail to Excel... Your download will start shortly.');
  };

  // --- Queries ---
  const { data: logs, isLoading } = useQuery({
    queryKey: ['audit-logs', filterTable],
    queryFn: async () => {
      const res = await axios.get('/api/audit-logs', { params: { table_name: filterTable === 'all' ? undefined : filterTable } });
      return res.data.data as AuditLog[];
    }
  });

  const getActionStyle = (action: string) => {
    switch(action) {
      case 'INSERT': return 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20';
      case 'UPDATE': return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
      case 'DELETE': return 'bg-red-500/10 text-red-500 border-red-500/20';
      default: return 'bg-slate-500/10 text-slate-500 border-slate-500/20';
    }
  };

  return (
    <div className="space-y-8 pb-32">
      {/* Header & Actions */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div>
          <h1 className="text-4xl font-black text-white tracking-tighter">Immutable Audit Ledger</h1>
          <p className="text-slate-400 font-medium text-sm text-glow-sm">NABH-compliant change tracking and forensic traceability.</p>
        </div>
        <button 
          onClick={handleExport}
          className="bg-slate-800 hover:bg-slate-700 text-white px-8 py-4 rounded-2xl text-xs font-black uppercase tracking-widest border border-slate-700 flex items-center gap-2 transition-all"
        >
          <Download size={18} /> Export Audit Trail (Excel)
        </button>
      </div>

      {/* 1. Filter Bar */}
      <div className="bg-slate-900/50 border border-slate-800 p-6 rounded-3xl grid md:grid-cols-4 gap-6 items-center backdrop-blur-md">
        <div className="relative md:col-span-1">
           <DatabaseZap className="absolute left-3 top-2.5 text-slate-500" size={16} />
           <select 
             value={filterTable}
             onChange={(e) => setFilterTable(e.target.value)}
             className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2 pl-9 pr-4 text-xs text-white outline-none"
           >
              <option value="all">All Entities</option>
              <option value="assets">Assets</option>
              <option value="maintenance">Maintenance</option>
              <option value="faults">Faults</option>
              <option value="users">Users</option>
           </select>
        </div>
        <div className="relative md:col-span-2">
          <Search className="absolute left-3 top-2.5 text-slate-500" size={16} />
          <input placeholder="Search by user or record ID..." className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2 pl-9 pr-4 text-xs text-white outline-none" />
        </div>
        <button className="flex items-center justify-center gap-2 bg-slate-800 text-white rounded-xl py-2 text-xs font-bold hover:bg-slate-700 transition-all border border-slate-700">
          <Filter size={14} /> Advanced Filter
        </button>
      </div>

      {/* 2. Audit Table */}
      <div className="bg-slate-900/30 border border-slate-800 rounded-[40px] overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="text-left border-b border-slate-800 bg-slate-900/50">
              <th className="px-8 py-6 text-[10px] font-black text-slate-500 uppercase tracking-widest">Temporal Stamp</th>
              <th className="px-8 py-6 text-[10px] font-black text-slate-500 uppercase tracking-widest">Entity & Record</th>
              <th className="px-8 py-6 text-[10px] font-black text-slate-500 uppercase tracking-widest text-center">Operation</th>
              <th className="px-8 py-6 text-[10px] font-black text-slate-500 uppercase tracking-widest">Origin Agent</th>
              <th className="px-8 py-6 text-[10px] font-black text-slate-500 uppercase tracking-widest text-right">Trace</th>
            </tr>
          </thead>
          <tbody>
            {logs?.map(log => (
              <>
                <tr 
                  key={log.log_id} 
                  onClick={() => setExpandedRow(expandedRow === log.log_id ? null : log.log_id)}
                  className={cn(
                    "border-b border-slate-800/50 last:border-0 hover:bg-slate-800/30 transition-all cursor-pointer group",
                    expandedRow === log.log_id && "bg-slate-800/50"
                  )}
                >
                  <td className="px-8 py-5">
                    <div className="flex items-center gap-3">
                       <Clock size={14} className="text-blue-500" />
                       <div className="flex flex-col">
                          <span className="text-xs font-bold text-white">{format(new Date(log.created_at), 'dd MMM yyyy')}</span>
                          <span className="text-[10px] text-slate-500 font-bold">{format(new Date(log.created_at), 'HH:mm:ss')}</span>
                       </div>
                    </div>
                  </td>
                  <td className="px-8 py-5">
                    <div className="flex flex-col">
                       <span className="text-xs font-black text-white uppercase tracking-tighter flex items-center gap-2">
                         <Database size={12} className="text-slate-600" /> {log.table_name}
                       </span>
                       {/* 4. Record Link */}
                       <span className="text-[10px] text-blue-500 font-bold hover:underline cursor-pointer">
                         ID: {log.record_id}
                       </span>
                    </div>
                  </td>
                  <td className="px-8 py-5 text-center">
                    <span className={cn("px-3 py-1 rounded-full text-[10px] font-black uppercase border", getActionStyle(log.action))}>
                      {log.action}
                    </span>
                  </td>
                  <td className="px-8 py-5">
                    <div className="flex items-center gap-3">
                       <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-[10px] font-black text-slate-500">
                          {log.user_full_name?.[0] || '?'}
                       </div>
                       <div className="flex flex-col">
                          <span className="text-xs font-bold text-white">{log.user_full_name || 'System'}</span>
                          <span className="text-[9px] text-slate-500 font-black uppercase">{log.user_role}</span>
                       </div>
                    </div>
                  </td>
                  <td className="px-8 py-5 text-right">
                    <div className="flex items-center justify-end gap-3">
                       <div className="flex flex-col items-end">
                          <span className="text-[10px] font-bold text-slate-500 flex items-center gap-1">
                             <Globe size={10} /> {log.ip_address}
                          </span>
                       </div>
                       {expandedRow === log.log_id ? <ChevronUp size={18} className="text-white" /> : <ChevronDown size={18} className="text-slate-600" />}
                    </div>
                  </td>
                </tr>

                {/* 3. Change Diff (Expanded Row) */}
                <AnimatePresence>
                  {expandedRow === log.log_id && (
                    <motion.tr 
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="bg-slate-950/50"
                    >
                      <td colSpan={5} className="px-12 py-8">
                        <div className="grid md:grid-cols-2 gap-8">
                           <div className="space-y-4">
                              <h4 className="text-[10px] font-black text-red-500 uppercase tracking-widest flex items-center gap-2">
                                <ChevronRight size={14} /> Previous State
                              </h4>
                              <div className="p-6 bg-slate-900 border border-slate-800 rounded-3xl font-mono text-[11px] text-slate-400 overflow-x-auto whitespace-pre leading-relaxed">
                                 {log.old_values ? JSON.stringify(log.old_values, null, 2) : '// No record previous to this action'}
                              </div>
                           </div>
                           <div className="space-y-4">
                              <h4 className="text-[10px] font-black text-emerald-500 uppercase tracking-widest flex items-center gap-2">
                                <ChevronRight size={14} /> Post-Action State
                              </h4>
                              <div className="p-6 bg-slate-900 border border-emerald-500/20 rounded-3xl font-mono text-[11px] text-slate-300 overflow-x-auto whitespace-pre leading-relaxed">
                                 {log.new_values ? JSON.stringify(log.new_values, null, 2) : '// Record was permanently deleted'}
                              </div>
                           </div>
                        </div>
                        <div className="mt-8 pt-6 border-t border-slate-800 flex justify-between items-center">
                           <p className="text-[10px] font-bold text-slate-500 flex items-center gap-2">
                             <ShieldCheck size={14} className="text-emerald-500" /> This log entry is immutable and system-verified.
                           </p>
                           <button className="text-[10px] font-black text-blue-500 uppercase flex items-center gap-1 hover:underline">
                             View Associated Record <ExternalLink size={12} />
                           </button>
                        </div>
                      </td>
                    </motion.tr>
                  )}
                </AnimatePresence>
              </>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
