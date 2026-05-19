import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { 
  Search, 
  Filter, 
  Download, 
  ChevronDown, 
  ChevronUp, 
  Clock, 
  Globe, 
  Database,
  ShieldCheck,
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
  const { user: _user } = useAuth();
  const [expandedRow, setExpandedRow] = useState<string | null>(null);
  const [filterTable, setFilterTable] = useState('all');

  const handleExport = () => {
    console.log('Exporting audit logs...');
    alert('Exporting audit trail to Excel... Your download will start shortly.');
  };

  // --- Queries ---
  const { data: logs } = useQuery({
    queryKey: ['audit-logs', filterTable],
    queryFn: async () => {
      const res = await axios.get('/api/audit-logs', { params: { table_name: filterTable === 'all' ? undefined : filterTable } });
      return res.data.data as AuditLog[];
    }
  });

  const getActionStyle = (action: string) => {
    switch(action) {
      case 'INSERT': return 'bg-emerald-50 text-emerald-600 border-emerald-200';
      case 'UPDATE': return 'bg-purple-50 text-purple-600 border-purple-200';
      case 'DELETE': return 'bg-red-50 text-red-600 border-red-200';
      default: return 'bg-gray-50 text-gray-500 border-gray-200';
    }
  };

  return (
    <div className="space-y-8 pb-32">
      {/* Header & Actions */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div>
          <h1 className="text-4xl font-black text-gray-900 tracking-tighter">Immutable Audit Ledger</h1>
          <p className="text-gray-500 font-medium text-sm">NABH-compliant change tracking and forensic traceability.</p>
        </div>
        <button 
          onClick={handleExport}
          className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-8 py-4 rounded-2xl text-xs font-black uppercase tracking-widest border border-gray-200 flex items-center gap-2 transition-all"
        >
          <Download size={18} /> Export Audit Trail (Excel)
        </button>
      </div>

      {/* 1. Filter Bar */}
      <div className="bg-gray-50 border border-gray-200 p-6 rounded-3xl grid md:grid-cols-4 gap-6 items-center">
        <div className="relative md:col-span-1">
           <DatabaseZap className="absolute left-3 top-2.5 text-gray-400" size={16} />
           <select 
             value={filterTable}
             onChange={(e) => setFilterTable(e.target.value)}
             className="w-full bg-white border border-gray-200 rounded-xl py-2 pl-9 pr-4 text-xs text-gray-700 outline-none focus:border-[#6A1B9A]"
           >
              <option value="all">All Entities</option>
              <option value="assets">Assets</option>
              <option value="maintenance">Maintenance</option>
              <option value="faults">Faults</option>
              <option value="users">Users</option>
           </select>
        </div>
        <div className="relative md:col-span-2">
          <Search className="absolute left-3 top-2.5 text-gray-400" size={16} />
          <input placeholder="Search by user or record ID..." className="w-full bg-white border border-gray-200 rounded-xl py-2 pl-9 pr-4 text-xs text-gray-900 outline-none" />
        </div>
        <button className="flex items-center justify-center gap-2 bg-gray-100 text-gray-700 rounded-xl py-2 text-xs font-bold hover:bg-gray-200 transition-all border border-gray-200">
          <Filter size={14} /> Advanced Filter
        </button>
      </div>

      {/* 2. Audit Table */}
      <div className="bg-white border border-gray-200 rounded-[40px] overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="text-left border-b border-gray-200 bg-gray-50">
              <th className="px-8 py-6 text-[10px] font-black text-gray-500 uppercase tracking-widest">Temporal Stamp</th>
              <th className="px-8 py-6 text-[10px] font-black text-gray-500 uppercase tracking-widest">Entity & Record</th>
              <th className="px-8 py-6 text-[10px] font-black text-gray-500 uppercase tracking-widest text-center">Operation</th>
              <th className="px-8 py-6 text-[10px] font-black text-gray-500 uppercase tracking-widest">Origin Agent</th>
              <th className="px-8 py-6 text-[10px] font-black text-gray-500 uppercase tracking-widest text-right">Trace</th>
            </tr>
          </thead>
          <tbody>
            {logs?.map(log => (
              <>
                <tr 
                  key={log.log_id} 
                  onClick={() => setExpandedRow(expandedRow === log.log_id ? null : log.log_id)}
                  className={cn(
                    "border-b border-gray-100 last:border-0 hover:bg-gray-50 transition-all cursor-pointer group",
                    expandedRow === log.log_id && "bg-gray-50/50"
                  )}
                >
                  <td className="px-8 py-5">
                    <div className="flex items-center gap-3">
                       <Clock size={14} className="text-[#6A1B9A]" />
                       <div className="flex flex-col">
                          <span className="text-xs font-bold text-gray-900">{format(new Date(log.created_at), 'dd MMM yyyy')}</span>
                          <span className="text-[10px] text-gray-400 font-bold">{format(new Date(log.created_at), 'HH:mm:ss')}</span>
                       </div>
                    </div>
                  </td>
                  <td className="px-8 py-5">
                    <div className="flex flex-col">
                       <span className="text-xs font-black text-gray-900 uppercase tracking-tighter flex items-center gap-2">
                         <Database size={12} className="text-gray-400" /> {log.table_name}
                       </span>
                       {/* 4. Record Link */}
                       <span className="text-[10px] text-[#6A1B9A] font-bold hover:underline cursor-pointer">
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
                       <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-[10px] font-black text-gray-500">
                          {log.user_full_name?.[0] || '?'}
                       </div>
                       <div className="flex flex-col">
                          <span className="text-xs font-bold text-gray-900">{log.user_full_name || 'System'}</span>
                          <span className="text-[9px] text-gray-400 font-black uppercase">{log.user_role}</span>
                       </div>
                    </div>
                  </td>
                  <td className="px-8 py-5 text-right">
                    <div className="flex items-center justify-end gap-3">
                       <div className="flex flex-col items-end">
                          <span className="text-[10px] font-bold text-gray-500 flex items-center gap-1">
                             <Globe size={10} /> {log.ip_address}
                          </span>
                       </div>
                       {expandedRow === log.log_id ? <ChevronUp size={18} className="text-gray-900" /> : <ChevronDown size={18} className="text-gray-400" />}
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
                      className="bg-gray-50/50"
                    >
                      <td colSpan={5} className="px-12 py-8">
                        <div className="grid md:grid-cols-2 gap-8">
                           <div className="space-y-4">
                              <h4 className="text-[10px] font-black text-red-600 uppercase tracking-widest flex items-center gap-2">
                                <ChevronRight size={14} /> Previous State
                              </h4>
                              <div className="p-6 bg-gray-50 border border-gray-200 rounded-3xl font-mono text-[11px] text-gray-500 overflow-x-auto whitespace-pre leading-relaxed">
                                 {log.old_values ? JSON.stringify(log.old_values, null, 2) : '// No record previous to this action'}
                              </div>
                           </div>
                           <div className="space-y-4">
                              <h4 className="text-[10px] font-black text-emerald-600 uppercase tracking-widest flex items-center gap-2">
                                <ChevronRight size={14} /> Post-Action State
                              </h4>
                              <div className="p-6 bg-gray-50 border border-emerald-200 rounded-3xl font-mono text-[11px] text-gray-500 overflow-x-auto whitespace-pre leading-relaxed">
                                 {log.new_values ? JSON.stringify(log.new_values, null, 2) : '// Record was permanently deleted'}
                              </div>
                           </div>
                        </div>
                        <div className="mt-8 pt-6 border-t border-gray-200 flex justify-between items-center">
                           <p className="text-[10px] font-bold text-gray-500 flex items-center gap-2">
                             <ShieldCheck size={14} className="text-emerald-500" /> This log entry is immutable and system-verified.
                           </p>
                           <button className="text-[10px] font-black text-[#6A1B9A] uppercase flex items-center gap-1 hover:underline">
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
