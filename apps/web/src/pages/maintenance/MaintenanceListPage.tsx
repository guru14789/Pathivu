import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { 
  LayoutGrid, 
  List, 
  Filter, 
  Plus, 
  Clock, 
  ChevronRight,
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
  const { data: jobs } = useQuery({
    queryKey: ['maintenance-jobs', activePriority],
    queryFn: async () => {
      const res = await axios.get('/api/maintenance');
      return res.data.data as JobCard[];
    }
  });

  const getPriorityColor = (p: string) => {
    switch(p) {
      case 'P1': return 'bg-red-50 text-red-600 border-red-200';
      case 'P2': return 'bg-amber-50 text-amber-600 border-amber-200';
      default: return 'bg-purple-50 text-purple-600 border-purple-200';
    }
  };

  const filteredJobs = jobs?.filter(j => activePriority === 'all' || j.priority === activePriority) || [];

  const columns = [
    { id: 'open', title: 'Open Registry', icon: Clock, color: 'text-[#6A1B9A]' },
    { id: 'in_progress', title: 'Active Repairs', icon: Wrench, color: 'text-amber-500' },
    { id: 'completed', title: 'Quality Assurance', icon: CheckCircle2, color: 'text-emerald-500' },
  ];

  return (
    <div className="space-y-8 pb-32">
      {/* Header & Priority Tabs */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div className="space-y-4">
          <h1 className="text-4xl font-black text-gray-900 tracking-tighter">Maintenance Operations</h1>
          <div className="flex p-1 bg-gray-50 border border-gray-200 rounded-2xl w-fit">
            {(['all', 'P1', 'P2', 'P3'] as const).map(p => (
              <button 
                key={p}
                onClick={() => setActivePriority(p)}
                className={cn(
                  "px-6 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all relative",
                  activePriority === p ? "bg-white text-gray-900 border border-gray-200 shadow-sm" : "text-gray-500 hover:text-gray-700"
                )}
              >
                {p}
                {p === 'P1' && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[8px] flex items-center justify-center rounded-full border border-white">
                    2
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* View Toggle */}
          <div className="flex p-1 bg-gray-50 border border-gray-200 rounded-2xl">
            <button 
              onClick={() => setView('kanban')}
              className={cn("p-2 rounded-xl transition-all", view === 'kanban' ? "bg-purple-50 text-[#6A1B9A]" : "text-gray-500")}
            >
              <LayoutGrid size={20} />
            </button>
            <button 
              onClick={() => setView('table')}
              className={cn("p-2 rounded-xl transition-all", view === 'table' ? "bg-purple-50 text-[#6A1B9A]" : "text-gray-500")}
            >
              <List size={20} />
            </button>
          </div>
          {isSupervisor && (
            <button className="bg-[#6A1B9A] hover:bg-[#7B1FA2] text-white px-6 py-3 rounded-2xl text-sm font-bold shadow-lg shadow-purple-900/20 flex items-center gap-2 transition-all">
              <Plus size={18} /> New Job Card
            </button>
          )}
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-gray-50 border border-gray-200 p-6 rounded-3xl grid md:grid-cols-4 gap-6 items-center">
        <div className="relative">
          <Search className="absolute left-3 top-3 text-gray-400" size={18} />
          <input 
            placeholder="Search by tag or asset..."
            className="w-full bg-white border border-gray-200 rounded-xl py-2.5 pl-10 pr-4 text-xs text-gray-900 placeholder:text-gray-400 focus:border-[#6A1B9A] outline-none transition-all"
          />
        </div>
        <select className="bg-white border border-gray-200 rounded-xl px-4 py-2.5 text-xs text-gray-700 outline-none">
          <option>All Types (PPM/Breakdown)</option>
        </select>
        <select className="bg-white border border-gray-200 rounded-xl px-4 py-2.5 text-xs text-gray-700 outline-none">
          <option>Assigned To: All Technicians</option>
        </select>
        <button className="flex items-center justify-center gap-2 bg-gray-100 text-gray-700 rounded-xl py-2.5 text-xs font-bold hover:bg-gray-200 transition-all border border-gray-200">
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
                    <div className={cn("p-2 rounded-lg bg-gray-50 border border-gray-200", col.color)}>
                      <col.icon size={18} />
                    </div>
                    <h3 className="text-sm font-black text-gray-500 uppercase tracking-widest">{col.title}</h3>
                  </div>
                  <span className="text-xs font-bold text-gray-500 bg-gray-100 px-3 py-1 rounded-full border border-gray-200">
                    {filteredJobs.filter(j => j.status === col.id).length}
                  </span>
                </div>
                
                <div className="space-y-4 min-h-[500px] p-2 rounded-3xl bg-gray-50 border border-dashed border-gray-200">
                  {filteredJobs.filter(j => j.status === col.id).map(job => (
                    <motion.div 
                      key={job.id}
                      layoutId={job.id}
                      onClick={() => navigate(`/maintenance/${job.id}`)}
                      className="bg-white border border-gray-200 p-5 rounded-2xl space-y-4 cursor-pointer hover:border-purple-500/30 hover:shadow-lg transition-all group"
                    >
                      <div className="flex items-center justify-between">
                        <span className={cn("px-2 py-0.5 rounded text-[10px] font-black uppercase border", getPriorityColor(job.priority))}>
                          {job.priority}
                        </span>
                        <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{job.type}</span>
                      </div>
                      
                      <div>
                        <h4 className="text-sm font-bold text-gray-900 group-hover:text-[#6A1B9A] transition-colors">{job.asset_name}</h4>
                        <p className="text-xs text-gray-500 font-medium uppercase mt-1">{job.asset_tag}</p>
                      </div>

                      <div className="pt-4 border-t border-gray-100 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-purple-50 flex items-center justify-center text-[8px] font-black text-[#6A1B9A] border border-purple-200">
                            {job.technician_name.split(' ').map(n => n[0]).join('')}
                          </div>
                          <span className="text-[10px] font-bold text-gray-500">{job.technician_name}</span>
                        </div>
                        <div className="flex flex-col items-end">
                          <span className="text-[10px] font-bold text-gray-400 uppercase">Due Date</span>
                          <span className="text-[10px] text-gray-900 font-black">{format(new Date(job.scheduled_date), 'dd MMM')}</span>
                        </div>
                      </div>

                      {differenceInDays(new Date(), new Date(job.scheduled_date)) > 0 && job.status !== 'completed' && (
                        <div className="flex items-center gap-1.5 text-red-600 mt-2">
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
            className="bg-white border border-gray-200 rounded-3xl overflow-hidden"
          >
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 text-left">
                  <th className="px-6 py-5 text-[10px] font-black text-gray-500 uppercase tracking-widest">Job ID</th>
                  <th className="px-6 py-5 text-[10px] font-black text-gray-500 uppercase tracking-widest">Asset Details</th>
                  <th className="px-6 py-5 text-[10px] font-black text-gray-500 uppercase tracking-widest">Priority</th>
                  <th className="px-6 py-5 text-[10px] font-black text-gray-500 uppercase tracking-widest">Status</th>
                  <th className="px-6 py-5 text-[10px] font-black text-gray-500 uppercase tracking-widest">Technician</th>
                  <th className="px-6 py-5 text-[10px] font-black text-gray-500 uppercase tracking-widest text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredJobs.map(job => (
                  <tr key={job.id} className="border-b border-gray-100 last:border-0 hover:bg-gray-50 transition-all">
                    <td className="px-6 py-4 font-mono text-xs text-[#6A1B9A]">#{job.id.slice(0, 8)}</td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="text-sm font-bold text-gray-900">{job.asset_name}</span>
                        <span className="text-[10px] text-gray-500 uppercase font-black">{job.asset_tag}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={cn("px-2 py-0.5 rounded text-[10px] font-black uppercase border", getPriorityColor(job.priority))}>
                        {job.priority}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">{job.status.replace('_', ' ')}</span>
                    </td>
                    <td className="px-6 py-4 text-xs text-gray-900 font-bold">{job.technician_name}</td>
                    <td className="px-6 py-4 text-right">
                      <button onClick={() => navigate(`/maintenance/${job.id}`)} className="p-2 text-gray-400 hover:text-[#6A1B9A] hover:bg-purple-50 rounded-lg transition-all">
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
