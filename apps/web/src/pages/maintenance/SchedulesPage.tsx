import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { 
  Calendar as CalendarIcon, 
  List, 
  Plus, 
  CheckCircle2, 
  ChevronLeft, 
  ChevronRight,
  Download,
  Mail,
  Search,
  AlertCircle,
  Bell
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { cn } from '../../lib/utils';
import axios from 'axios';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, addMonths, subMonths } from 'date-fns';

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
  const { data: schedules } = useQuery({
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
      case 'overdue': return 'bg-red-50 text-red-600 border-red-200';
      case 'completed': return 'bg-emerald-50 text-emerald-600';
      default: return 'bg-purple-50 text-purple-600 border-purple-200';
    }
  };

  return (
    <div className="space-y-8 pb-32">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-4xl font-black text-gray-900 tracking-tighter">Asset Lifecycle Schedules</h1>
          <p className="text-gray-500 font-medium text-sm">Preventive Maintenance, Calibration & Statutory Compliance Roadmap.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex p-1 bg-gray-50 border border-gray-200 rounded-2xl">
            <button 
              onClick={() => setView('calendar')}
              className={cn("p-2 rounded-xl transition-all", view === 'calendar' ? "bg-purple-50 text-[#6A1B9A]" : "text-gray-400")}
            >
              <CalendarIcon size={20} />
            </button>
            <button 
              onClick={() => setView('list')}
              className={cn("p-2 rounded-xl transition-all", view === 'list' ? "bg-purple-50 text-[#6A1B9A]" : "text-gray-400")}
            >
              <List size={20} />
            </button>
          </div>
          {isAdmin && (
            <button className="bg-[#6A1B9A] hover:bg-[#7B1FA2] text-white px-6 py-3 rounded-2xl text-sm font-bold shadow-lg shadow-purple-900/20 flex items-center gap-2 transition-all">
              <Plus size={18} /> Plan New Schedule
            </button>
          )}
        </div>
      </div>

      <div className="grid lg:grid-cols-12 gap-8">
        {/* Left Column: Calendar or List */}
        <div className="lg:col-span-8 space-y-8">
          {view === 'calendar' ? (
            <div className="bg-white border border-gray-200 shadow-sm rounded-3xl overflow-hidden">
              <div className="p-6 border-b border-gray-200 flex items-center justify-between bg-gray-50">
                <h3 className="text-lg font-black text-gray-900">{format(currentDate, 'MMMM yyyy')}</h3>
                <div className="flex items-center gap-2">
                  <button onClick={() => setCurrentDate(subMonths(currentDate, 1))} className="p-2 hover:bg-gray-100 rounded-xl transition-all text-gray-400">
                    <ChevronLeft size={20} />
                  </button>
                  <button onClick={() => setCurrentDate(new Date())} className="px-4 py-2 text-xs font-black uppercase text-[#6A1B9A] hover:bg-purple-50 rounded-xl transition-all">
                    Today
                  </button>
                  <button onClick={() => setCurrentDate(addMonths(currentDate, 1))} className="p-2 hover:bg-gray-100 rounded-xl transition-all text-gray-400">
                    <ChevronRight size={20} />
                  </button>
                </div>
              </div>
              <div className="grid grid-cols-7 border-b border-gray-200">
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
                  <div key={d} className="py-4 text-center text-[10px] font-black text-gray-500 uppercase tracking-widest border-r border-gray-200 last:border-0">
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
                        "p-2 border-r border-b border-gray-100 hover:bg-gray-50 transition-all group",
                        i % 7 === 6 && "border-r-0"
                      )}
                    >
                      <span className={cn(
                        "text-xs font-bold",
                        isSameDay(day, new Date()) ? "text-[#6A1B9A]" : "text-gray-400 group-hover:text-gray-600"
                      )}>
                        {format(day, 'd')}
                      </span>
                      <div className="mt-2 space-y-1">
                        {daySchedules.map(s => (
                          <div key={s.id} className="flex items-center gap-1.5 p-1 bg-purple-50 border border-purple-200 rounded text-[8px] font-black text-[#6A1B9A] uppercase truncate">
                            <div className="w-1 h-1 rounded-full bg-[#6A1B9A]" />
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
            <div className="bg-white border border-gray-200 shadow-sm rounded-3xl overflow-hidden">
              <div className="p-6 border-b border-gray-200 bg-gray-50 flex items-center justify-between">
                 <div className="relative w-64">
                   <Search className="absolute left-3 top-2.5 text-gray-400" size={16} />
                   <input 
                     value={search}
                     onChange={e => setSearch(e.target.value)}
                     placeholder="Filter assets..."
                     className="w-full bg-white border border-gray-200 rounded-xl py-2 pl-9 pr-4 text-xs text-gray-900 placeholder:text-gray-400"
                   />
                 </div>
                 <button className="text-xs font-black text-gray-500 uppercase flex items-center gap-2 hover:text-gray-700 transition-all">
                    <Download size={16} /> Export CSV
                 </button>
              </div>
              <table className="w-full">
                <thead>
                  <tr className="text-left border-b border-gray-200">
                    <th className="px-6 py-5 text-[10px] font-black text-gray-500 uppercase tracking-widest">Asset Entity</th>
                    <th className="px-6 py-5 text-[10px] font-black text-gray-500 uppercase tracking-widest">Type / Cycle</th>
                    <th className="px-6 py-5 text-[10px] font-black text-gray-500 uppercase tracking-widest">Next Due</th>
                    <th className="px-6 py-5 text-[10px] font-black text-gray-500 uppercase tracking-widest">Status</th>
                    <th className="px-6 py-5 text-[10px] font-black text-gray-500 uppercase tracking-widest text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {schedules?.map(s => (
                    <tr key={s.id} className="border-b border-gray-100 last:border-0 hover:bg-gray-50 transition-all">
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                          <span className="text-xs font-black text-[#6A1B9A] uppercase">{s.asset_tag}</span>
                          <span className="text-xs font-bold text-gray-900">{s.asset_name}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                          <span className="text-[10px] font-black text-gray-900 uppercase tracking-widest">{s.type}</span>
                          <span className="text-[10px] text-gray-500 font-bold uppercase">{s.frequency}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                         <span className="text-xs font-bold text-gray-900">{format(new Date(s.next_due_date), 'dd MMM yyyy')}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={cn("px-2 py-0.5 rounded text-[10px] font-black uppercase border", getStatusColor(s.status))}>
                          {s.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button className="p-2 text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-all">
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
          <div className="bg-white border border-gray-200 shadow-sm rounded-3xl p-6 space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-black text-gray-500 uppercase tracking-widest flex items-center gap-2">
                <AlertCircle size={16} className="text-red-500" /> Overdue Priority
              </h3>
              <span className="bg-red-500 text-white text-[10px] font-black px-2 py-0.5 rounded-full">4</span>
            </div>
            <div className="space-y-4">
              {schedules?.filter(s => s.status === 'overdue').map(s => (
                <div key={s.id} className="p-4 bg-gray-50 border border-gray-200 rounded-2xl group cursor-pointer hover:border-red-300 transition-all">
                  <div className="flex justify-between items-start mb-2">
                    <span className="text-[10px] font-black text-[#6A1B9A] uppercase tracking-tighter">{s.asset_tag}</span>
                    <span className="text-[8px] font-black text-red-600 uppercase bg-red-50 px-2 py-0.5 rounded border border-red-200">Critical Delay</span>
                  </div>
                  <h4 className="text-xs font-bold text-gray-900 group-hover:text-[#6A1B9A] transition-colors">{s.asset_name}</h4>
                  <div className="mt-3 flex items-center justify-between text-[10px]">
                    <span className="text-gray-500 font-bold uppercase">Was Due: {format(new Date(s.next_due_date), 'dd MMM')}</span>
                    <button className="text-[#6A1B9A] font-black flex items-center gap-1">
                      Action <ChevronRight size={12} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 7. Alert Status Indicators */}
          <div className="bg-white border border-gray-200 shadow-sm rounded-3xl p-6 space-y-6">
            <h3 className="text-sm font-black text-gray-500 uppercase tracking-widest flex items-center gap-2">
              <Bell size={16} className="text-amber-500" /> Automated Sentinel
            </h3>
            <div className="space-y-4">
               {[
                 { label: '30-Day Critical Alert', sent: 12, pending: 4, icon: Mail, color: 'text-[#6A1B9A]' },
                 { label: '60-Day Forecast Alert', sent: 28, pending: 0, icon: Mail, color: 'text-gray-400' },
               ].map((alert, i) => (
                 <div key={i} className="flex items-center justify-between p-3 bg-gray-50 border border-gray-200 rounded-2xl">
                    <div className="flex items-center gap-3">
                      <div className={cn("p-2 rounded-lg bg-gray-100", alert.color)}>
                        <alert.icon size={16} />
                      </div>
                      <div>
                        <p className="text-[10px] font-black text-gray-900 uppercase">{alert.label}</p>
                        <p className="text-[10px] text-gray-500 font-medium">Auto-sent to HODs</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] font-black text-gray-900">{alert.sent}</p>
                      <p className="text-[10px] text-gray-500 font-black uppercase">Sent</p>
                    </div>
                 </div>
               ))}
            </div>
            <button className="w-full py-3 bg-gray-100 text-gray-500 text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-gray-200 transition-all border border-gray-200">
              Trigger Manual Resync
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
