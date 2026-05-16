import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { 
  Calendar as CalendarIcon, 
  List, 
  Plus, 
  Clock, 
  AlertCircle, 
  CheckCircle2, 
  ChevronLeft, 
  ChevronRight,
  Filter,
  Download,
  Mail,
  RefreshCcw,
  Bell,
  Search
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import { cn } from '../../lib/utils';
import axios from 'axios';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths } from 'date-fns';

// --- Types ---
interface Schedule {
  id: string;
  asset_tag: string;
  asset_name: string;
  type: 'PPM' | 'calibration' | 'statutory';
  frequency: 'monthly' | 'quarterly' | 'biannual' | 'annual';
  last_service_date: string | null;
  next_due_date: string;
  status: 'active' | 'overdue' | 'completed';
  alerts_sent: {
    '30d': boolean;
    '60d': boolean;
  };
}

export default function SchedulesPage() {
  const { user } = useAuth();
  const [view, setView] = useState<'calendar' | 'list'>('calendar');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [search, setSearch] = useState('');

  const isAdmin = ['super_admin', 'branch_admin', 'supervisor'].includes(user?.role || '');

  // --- Queries ---
  const { data: schedules, isLoading } = useQuery({
    queryKey: ['schedules', view, search],
    queryFn: async () => {
      const res = await axios.get('/api/schedules');
      return res.data.data as Schedule[];
    }
  });

  // --- Calendar Helpers ---
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(monthStart);
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });

  const getSchedulesForDay = (date: Date) => {
    return schedules?.filter(s => isSameDay(new Date(s.next_due_date), date)) || [];
  };

  const getStatusColor = (status: string) => {
    switch(status) {
      case 'overdue': return 'bg-red-500/10 text-red-500 border-red-500/20';
      case 'completed': return 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20';
      default: return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
    }
  };

  return (
    <div className="space-y-8 pb-32">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-4xl font-black text-white tracking-tighter">Asset Lifecycle Schedules</h1>
          <p className="text-slate-400 font-medium text-sm">Preventive Maintenance, Calibration & Statutory Compliance Roadmap.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex p-1 bg-slate-900 border border-slate-800 rounded-2xl">
            <button 
              onClick={() => setView('calendar')}
              className={cn("p-2 rounded-xl transition-all", view === 'calendar' ? "bg-slate-800 text-blue-500" : "text-slate-500")}
            >
              <CalendarIcon size={20} />
            </button>
            <button 
              onClick={() => setView('list')}
              className={cn("p-2 rounded-xl transition-all", view === 'list' ? "bg-slate-800 text-blue-500" : "text-slate-500")}
            >
              <List size={20} />
            </button>
          </div>
          {isAdmin && (
            <button className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-3 rounded-2xl text-sm font-bold shadow-lg shadow-blue-900/20 flex items-center gap-2 transition-all">
              <Plus size={18} /> Plan New Schedule
            </button>
          )}
        </div>
      </div>

      <div className="grid lg:grid-cols-12 gap-8">
        {/* Left Column: Calendar or List */}
        <div className="lg:col-span-8 space-y-8">
          {view === 'calendar' ? (
            <div className="bg-slate-900/50 border border-slate-800 rounded-3xl overflow-hidden backdrop-blur-md">
              <div className="p-6 border-b border-slate-800 flex items-center justify-between bg-slate-900/50">
                <h3 className="text-lg font-black text-white">{format(currentDate, 'MMMM yyyy')}</h3>
                <div className="flex items-center gap-2">
                  <button onClick={() => setCurrentDate(subMonths(currentDate, 1))} className="p-2 hover:bg-slate-800 rounded-xl transition-all text-slate-400">
                    <ChevronLeft size={20} />
                  </button>
                  <button onClick={() => setCurrentDate(new Date())} className="px-4 py-2 text-xs font-black uppercase text-blue-500 hover:bg-blue-500/10 rounded-xl transition-all">
                    Today
                  </button>
                  <button onClick={() => setCurrentDate(addMonths(currentDate, 1))} className="p-2 hover:bg-slate-800 rounded-xl transition-all text-slate-400">
                    <ChevronRight size={20} />
                  </button>
                </div>
              </div>
              <div className="grid grid-cols-7 border-b border-slate-800">
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
                  <div key={d} className="py-4 text-center text-[10px] font-black text-slate-500 uppercase tracking-widest border-r border-slate-800 last:border-0">
                    {d}
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-7 auto-rows-[120px]">
                {days.map((day, i) => {
                  const daySchedules = getSchedulesForDay(day);
                  return (
                    <div 
                      key={i} 
                      className={cn(
                        "p-2 border-r border-b border-slate-800 hover:bg-slate-800/20 transition-all group",
                        i % 7 === 6 && "border-r-0"
                      )}
                    >
                      <span className={cn(
                        "text-xs font-bold",
                        isSameDay(day, new Date()) ? "text-blue-500" : "text-slate-600 group-hover:text-slate-400"
                      )}>
                        {format(day, 'd')}
                      </span>
                      <div className="mt-2 space-y-1">
                        {daySchedules.map(s => (
                          <div key={s.id} className="flex items-center gap-1.5 p-1 bg-blue-500/10 border border-blue-500/20 rounded text-[8px] font-black text-blue-400 uppercase truncate">
                            <div className="w-1 h-1 rounded-full bg-blue-500" />
                            {s.asset_tag}
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="bg-slate-900/30 border border-slate-800 rounded-3xl overflow-hidden backdrop-blur-md">
              <div className="p-6 border-b border-slate-800 bg-slate-900/50 flex items-center justify-between">
                 <div className="relative w-64">
                   <Search className="absolute left-3 top-2.5 text-slate-500" size={16} />
                   <input 
                     value={search}
                     onChange={e => setSearch(e.target.value)}
                     placeholder="Filter assets..."
                     className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2 pl-9 pr-4 text-xs text-white"
                   />
                 </div>
                 <button className="text-xs font-black text-slate-500 uppercase flex items-center gap-2 hover:text-white transition-all">
                    <Download size={16} /> Export CSV
                 </button>
              </div>
              <table className="w-full">
                <thead>
                  <tr className="text-left border-b border-slate-800">
                    <th className="px-6 py-5 text-[10px] font-black text-slate-500 uppercase tracking-widest">Asset Entity</th>
                    <th className="px-6 py-5 text-[10px] font-black text-slate-500 uppercase tracking-widest">Type / Cycle</th>
                    <th className="px-6 py-5 text-[10px] font-black text-slate-500 uppercase tracking-widest">Next Due</th>
                    <th className="px-6 py-5 text-[10px] font-black text-slate-500 uppercase tracking-widest">Status</th>
                    <th className="px-6 py-5 text-[10px] font-black text-slate-500 uppercase tracking-widest text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {schedules?.map(s => (
                    <tr key={s.id} className="border-b border-slate-800/50 last:border-0 hover:bg-slate-800/30 transition-all">
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                          <span className="text-xs font-black text-blue-500 uppercase">{s.asset_tag}</span>
                          <span className="text-xs font-bold text-white">{s.asset_name}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                          <span className="text-[10px] font-black text-white uppercase tracking-widest">{s.type}</span>
                          <span className="text-[10px] text-slate-500 font-bold uppercase">{s.frequency}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                         <span className="text-xs font-bold text-white">{format(new Date(s.next_due_date), 'dd MMM yyyy')}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={cn("px-2 py-0.5 rounded text-[10px] font-black uppercase border", getStatusColor(s.status))}>
                          {s.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button className="p-2 text-slate-600 hover:text-emerald-500 hover:bg-emerald-500/10 rounded-lg transition-all">
                          <CheckCircle2 size={18} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Right Column: Overdue & Alerts */}
        <div className="lg:col-span-4 space-y-8">
          {/* Overdue Section */}
          <div className="bg-slate-900/50 border border-slate-800 rounded-3xl p-6 space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                <AlertCircle size={16} className="text-red-500" /> Overdue Priority
              </h3>
              <span className="bg-red-500 text-white text-[10px] font-black px-2 py-0.5 rounded-full">4</span>
            </div>
            <div className="space-y-4">
              {schedules?.filter(s => s.status === 'overdue').map(s => (
                <div key={s.id} className="p-4 bg-slate-950 border border-slate-800 rounded-2xl group cursor-pointer hover:border-red-500/30 transition-all">
                  <div className="flex justify-between items-start mb-2">
                    <span className="text-[10px] font-black text-blue-500 uppercase tracking-tighter">{s.asset_tag}</span>
                    <span className="text-[8px] font-black text-red-500 uppercase bg-red-500/10 px-2 py-0.5 rounded border border-red-500/20">Critical Delay</span>
                  </div>
                  <h4 className="text-xs font-bold text-white group-hover:text-blue-400 transition-colors">{s.asset_name}</h4>
                  <div className="mt-3 flex items-center justify-between text-[10px]">
                    <span className="text-slate-500 font-bold uppercase">Was Due: {format(new Date(s.next_due_date), 'dd MMM')}</span>
                    <button className="text-blue-500 font-black flex items-center gap-1">
                      Action <ChevronRight size={12} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 7. Alert Status Indicators */}
          <div className="bg-slate-900/50 border border-slate-800 rounded-3xl p-6 space-y-6">
            <h3 className="text-sm font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
              <Bell size={16} className="text-amber-500" /> Automated Sentinel
            </h3>
            <div className="space-y-4">
               {[
                 { label: '30-Day Critical Alert', sent: 12, pending: 4, icon: Mail, color: 'text-blue-400' },
                 { label: '60-Day Forecast Alert', sent: 28, pending: 0, icon: Mail, color: 'text-slate-400' },
               ].map((alert, i) => (
                 <div key={i} className="flex items-center justify-between p-3 bg-slate-950 border border-slate-800 rounded-2xl">
                    <div className="flex items-center gap-3">
                      <div className={cn("p-2 rounded-lg bg-slate-900", alert.color)}>
                        <alert.icon size={16} />
                      </div>
                      <div>
                        <p className="text-[10px] font-black text-white uppercase">{alert.label}</p>
                        <p className="text-[10px] text-slate-500 font-medium">Auto-sent to HODs</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] font-black text-white">{alert.sent}</p>
                      <p className="text-[10px] text-slate-500 font-black uppercase">Sent</p>
                    </div>
                 </div>
               ))}
            </div>
            <button className="w-full py-3 bg-slate-800 text-slate-400 text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-slate-700 hover:text-white transition-all border border-slate-700">
              Trigger Manual Resync
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
