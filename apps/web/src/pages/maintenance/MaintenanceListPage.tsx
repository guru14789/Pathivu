import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { 
  LayoutGrid, 
  List, 
  Filter, 
  Plus, 
  Clock, 
  AlertCircle, 
  User, 
  Calendar,
  ChevronRight,
  ArrowRight,
  MoreVertical,
  Wrench,
  Search,
  CheckCircle2,
  AlertTriangle
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import { cn } from '../../lib/utils';
import axios from 'axios';
import { format, differenceInDays } from 'date-fns';

// --- Types ---
interface JobCard {
  id: string;
  asset_tag: string;
  asset_name: string;
  priority: 'P1' | 'P2' | 'P3';
  type: 'PPM' | 'breakdown' | 'calibration';
  status: 'open' | 'in_progress' | 'completed';
  assigned_to: string;
  scheduled_date: string;
  technician_name: string;
}

export default function MaintenanceListPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [view, setView] = useState<'kanban' | 'table'>('kanban');
  const [activePriority, setActivePriority] = useState<'all' | 'P1' | 'P2' | 'P3'>('all');

  const role = user?.role || 'technician';
  const isSupervisor = ['super_admin', 'branch_admin', 'supervisor'].includes(role);

  // --- Queries ---
  const { data: jobs, isLoading } = useQuery({
    queryKey: ['maintenance-jobs', activePriority],
    queryFn: async () => {
      const res = await axios.get('/api/maintenance');
      return res.data.data as JobCard[];
    }
  });

  const getPriorityColor = (p: string) => {
    switch(p) {
      case 'P1': return 'bg-red-500/10 text-red-500 border-red-500/20';
      case 'P2': return 'bg-amber-500/10 text-amber-500 border-amber-500/20';
      default: return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
    }
  };

  const filteredJobs = jobs?.filter(j => activePriority === 'all' || j.priority === activePriority) || [];

  const columns = [
    { id: 'open', title: 'Open Registry', icon: Clock, color: 'text-blue-500' },
    { id: 'in_progress', title: 'Active Repairs', icon: Wrench, color: 'text-amber-500' },
    { id: 'completed', title: 'Quality Assurance', icon: CheckCircle2, color: 'text-emerald-500' },
  ];

  return (
    <div className="space-y-8 pb-32">
      {/* Header & Priority Tabs */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div className="space-y-4">
          <h1 className="text-4xl font-black text-white tracking-tighter">Maintenance Operations</h1>
          <div className="flex p-1 bg-slate-900 border border-slate-800 rounded-2xl w-fit">
            {(['all', 'P1', 'P2', 'P3'] as const).map(p => (
              <button 
                key={p}
                onClick={() => setActivePriority(p)}
                className={cn(
                  "px-6 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all relative",
                  activePriority === p ? "bg-slate-800 text-white" : "text-slate-500 hover:text-slate-300"
                )}
              >
                {p}
                {p === 'P1' && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[8px] flex items-center justify-center rounded-full border border-slate-900">
                    2
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* View Toggle */}
          <div className="flex p-1 bg-slate-900 border border-slate-800 rounded-2xl">
            <button 
              onClick={() => setView('kanban')}
              className={cn("p-2 rounded-xl transition-all", view === 'kanban' ? "bg-slate-800 text-blue-500" : "text-slate-500")}
            >
              <LayoutGrid size={20} />
            </button>
            <button 
              onClick={() => setView('table')}
              className={cn("p-2 rounded-xl transition-all", view === 'table' ? "bg-slate-800 text-blue-500" : "text-slate-500")}
            >
              <List size={20} />
            </button>
          </div>
          {isSupervisor && (
            <button className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-3 rounded-2xl text-sm font-bold shadow-lg shadow-blue-900/20 flex items-center gap-2 transition-all">
              <Plus size={18} /> New Job Card
            </button>
          )}
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-slate-900/50 border border-slate-800 p-6 rounded-3xl grid md:grid-cols-4 gap-6 items-center">
        <div className="relative">
          <Search className="absolute left-3 top-3 text-slate-500" size={18} />
          <input 
            placeholder="Search by tag or asset..."
            className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2.5 pl-10 pr-4 text-xs text-white focus:border-blue-500 outline-none transition-all"
          />
        </div>
        <select className="bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white outline-none">
          <option>All Types (PPM/Breakdown)</option>
        </select>
        <select className="bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white outline-none">
          <option>Assigned To: All Technicians</option>
        </select>
        <button className="flex items-center justify-center gap-2 bg-slate-800 text-white rounded-xl py-2.5 text-xs font-bold hover:bg-slate-700 transition-all border border-slate-700">
          <Filter size={14} /> Advanced Filters
        </button>
      </div>

      {/* Content Area */}
      <AnimatePresence mode="wait">
        {view === 'kanban' ? (
          <motion.div 
            key="kanban"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="grid lg:grid-cols-3 gap-8"
          >
            {columns.map(col => (
              <div key={col.id} className="space-y-6">
                <div className="flex items-center justify-between px-2">
                  <div className="flex items-center gap-3">
                    <div className={cn("p-2 rounded-lg bg-slate-900 border border-slate-800", col.color)}>
                      <col.icon size={18} />
                    </div>
                    <h3 className="text-sm font-black text-white uppercase tracking-widest">{col.title}</h3>
                  </div>
                  <span className="text-xs font-bold text-slate-500 bg-slate-900 px-3 py-1 rounded-full border border-slate-800">
                    {filteredJobs.filter(j => j.status === col.id).length}
                  </span>
                </div>
                
                <div className="space-y-4 min-h-[500px] p-2 rounded-3xl bg-slate-900/20 border border-dashed border-slate-800">
                  {filteredJobs.filter(j => j.status === col.id).map(job => (
                    <motion.div 
                      key={job.id}
                      layoutId={job.id}
                      onClick={() => navigate(`/maintenance/${job.id}`)}
                      className="bg-slate-900 border border-slate-800 p-5 rounded-2xl space-y-4 cursor-pointer hover:border-slate-700 hover:shadow-xl hover:shadow-blue-900/5 transition-all group"
                    >
                      <div className="flex items-center justify-between">
                        <span className={cn("px-2 py-0.5 rounded text-[10px] font-black uppercase border", getPriorityColor(job.priority))}>
                          {job.priority}
                        </span>
                        <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{job.type}</span>
                      </div>
                      
                      <div>
                        <h4 className="text-sm font-bold text-white group-hover:text-blue-400 transition-colors">{job.asset_name}</h4>
                        <p className="text-xs text-slate-500 font-medium uppercase mt-1">{job.asset_tag}</p>
                      </div>

                      <div className="pt-4 border-t border-slate-800 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-slate-800 flex items-center justify-center text-[8px] font-black text-blue-500 border border-slate-700">
                            {job.technician_name.split(' ').map(n => n[0]).join('')}
                          </div>
                          <span className="text-[10px] font-bold text-slate-400">{job.technician_name}</span>
                        </div>
                        <div className="flex flex-col items-end">
                          <span className="text-[10px] font-bold text-slate-500 uppercase">Due Date</span>
                          <span className="text-[10px] text-white font-black">{format(new Date(job.scheduled_date), 'dd MMM')}</span>
                        </div>
                      </div>

                      {differenceInDays(new Date(), new Date(job.scheduled_date)) > 0 && job.status !== 'completed' && (
                        <div className="flex items-center gap-1.5 text-red-500 mt-2">
                          <AlertTriangle size={12} />
                          <span className="text-[10px] font-black uppercase">Overdue {differenceInDays(new Date(), new Date(job.scheduled_date))} Days</span>
                        </div>
                      )}
                    </motion.div>
                  ))}
                </div>
              </div>
            ))}
          </motion.div>
        ) : (
          <motion.div 
            key="table"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="bg-slate-900/30 border border-slate-800 rounded-3xl overflow-hidden backdrop-blur-md"
          >
            <table className="w-full">
              <thead>
                <tr className="bg-slate-900/50 text-left">
                  <th className="px-6 py-5 text-[10px] font-black text-slate-500 uppercase tracking-widest">Job ID</th>
                  <th className="px-6 py-5 text-[10px] font-black text-slate-500 uppercase tracking-widest">Asset Details</th>
                  <th className="px-6 py-5 text-[10px] font-black text-slate-500 uppercase tracking-widest">Priority</th>
                  <th className="px-6 py-5 text-[10px] font-black text-slate-500 uppercase tracking-widest">Status</th>
                  <th className="px-6 py-5 text-[10px] font-black text-slate-500 uppercase tracking-widest">Technician</th>
                  <th className="px-6 py-5 text-[10px] font-black text-slate-500 uppercase tracking-widest text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredJobs.map(job => (
                  <tr key={job.id} className="border-b border-slate-800/50 last:border-0 hover:bg-slate-800/30 transition-all">
                    <td className="px-6 py-4 font-mono text-xs text-blue-400">#{job.id.slice(0, 8)}</td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="text-sm font-bold text-white">{job.asset_name}</span>
                        <span className="text-[10px] text-slate-500 uppercase font-black">{job.asset_tag}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={cn("px-2 py-0.5 rounded text-[10px] font-black uppercase border", getPriorityColor(job.priority))}>
                        {job.priority}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{job.status.replace('_', ' ')}</span>
                    </td>
                    <td className="px-6 py-4 text-xs text-white font-bold">{job.technician_name}</td>
                    <td className="px-6 py-4 text-right">
                      <button onClick={() => navigate(`/maintenance/${job.id}`)} className="p-2 text-slate-600 hover:text-blue-500 hover:bg-blue-500/10 rounded-lg transition-all">
                        <ChevronRight size={18} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
