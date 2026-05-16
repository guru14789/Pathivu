import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { 
  ArrowLeft, 
  Clock, 
  User, 
  MapPin, 
  Wrench, 
  AlertCircle, 
  CheckCircle2, 
  History, 
  DollarSign, 
  Info,
  ShieldCheck,
  ChevronRight,
  MessageSquare,
  AlertTriangle,
  FileText
} from 'lucide-react';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import { useAuth } from '../../context/AuthContext';
import { cn } from '../../lib/utils';
import axios from 'axios';

export default function MaintenanceDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [status, setStatus] = useState('in_progress');

  const isAdmin = ['super_admin', 'branch_admin', 'supervisor'].includes(user?.role || '');

  // --- Queries ---
  const { data: job, isLoading } = useQuery({
    queryKey: ['maintenance-job', id],
    queryFn: async () => {
      const res = await axios.get(`/api/maintenance/${id}`);
      return res.data.data;
    }
  });

  if (isLoading) return <div className="flex items-center justify-center min-h-screen text-slate-500">Retrieving job card...</div>;
  if (!job) return <div className="flex items-center justify-center min-h-screen text-red-500">Job card not found.</div>;

  return (
    <div className="space-y-8 pb-32">
      {/* 1. Job Card Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div className="flex items-start gap-5">
          <button onClick={() => navigate(-1)} className="mt-1 p-2 bg-slate-900 border border-slate-800 rounded-xl text-slate-400 hover:text-white transition-all">
            <ArrowLeft size={20} />
          </button>
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <span className="text-[10px] font-black text-blue-500 bg-blue-500/10 border border-blue-500/20 px-2 py-0.5 rounded uppercase tracking-widest">
                #{job.id.slice(0, 8)}
              </span>
              <span className={cn(
                "px-2 py-0.5 rounded text-[10px] font-black uppercase border",
                job.priority === 'P1' ? 'bg-red-500/10 text-red-500 border-red-500/20' : 'bg-amber-500/10 text-amber-500 border-amber-500/20'
              )}>
                {job.priority} Priority
              </span>
            </div>
            <h1 className="text-4xl font-black text-white tracking-tighter leading-none">Maintenance Job Card</h1>
            <p className="text-slate-400 font-medium">Asset: {job.asset_name} • <span className="text-blue-500 font-bold">{job.asset_tag}</span></p>
          </div>
        </div>
        
        {/* Supervisor actions */}
        {isAdmin && (
          <div className="flex gap-3">
            <button className="px-6 py-3 bg-slate-800 text-white rounded-2xl text-sm font-bold border border-slate-700 hover:bg-slate-700 transition-all flex items-center gap-2">
              <User size={18} /> Reassign
            </button>
            <button className="px-6 py-3 bg-red-500/10 text-red-500 rounded-2xl text-sm font-bold border border-red-500/20 hover:bg-red-500/20 transition-all">
              Cancel Job
            </button>
          </div>
        )}
      </div>

      <div className="grid lg:grid-cols-12 gap-8">
        <div className="lg:col-span-8 space-y-8">
          {/* 4. Timeline Section */}
          <div className="bg-slate-900/50 border border-slate-800 rounded-3xl p-8">
             <h3 className="text-sm font-black text-slate-500 uppercase tracking-widest mb-8 flex items-center gap-2">
               <History size={16} className="text-blue-500" /> Operational Lifecycle
             </h3>
             <div className="flex justify-between relative">
               <div className="absolute top-4 left-0 right-0 h-0.5 bg-slate-800 z-0" />
               {[
                 { label: 'Created', date: '12 Oct, 09:00', icon: Info, color: 'text-emerald-500' },
                 { label: 'Assigned', date: '12 Oct, 10:30', icon: User, color: 'text-emerald-500' },
                 { label: 'Started', date: '12 Oct, 14:15', icon: Wrench, color: 'text-blue-500' },
                 { label: 'Completed', date: 'Pending', icon: CheckCircle2, color: 'text-slate-600' },
               ].map((step, i) => (
                 <div key={i} className="flex flex-col items-center gap-3 relative z-10">
                   <div className={cn("w-9 h-9 rounded-full bg-slate-950 border border-slate-800 flex items-center justify-center", step.color)}>
                     <step.icon size={18} />
                   </div>
                   <div className="text-center">
                     <p className="text-[10px] font-black text-white uppercase">{step.label}</p>
                     <p className="text-[10px] text-slate-500 font-bold">{step.date}</p>
                   </div>
                 </div>
               ))}
             </div>
          </div>

          {/* 6. Technician Update Form */}
          <div className="bg-slate-900/30 border border-slate-800 rounded-3xl p-8 space-y-8">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                <FileText size={16} className="text-amber-500" /> Maintenance Report
              </h3>
              <span className="text-[10px] font-black text-emerald-500 bg-emerald-500/10 px-3 py-1 rounded-full uppercase">In Progress</span>
            </div>
            
            <div className="grid md:grid-cols-2 gap-8">
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-400">Current Status</label>
                <select className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-sm text-white">
                  <option value="in_progress">In Progress</option>
                  <option value="completed">Work Finished (Awaiting Approval)</option>
                  <option value="blocked">Blocked (Needs Parts)</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-400">Downtime Incurred (Hours)</label>
                <input type="number" placeholder="e.g. 2.5" className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-sm text-white" />
              </div>
              <div className="md:col-span-2 space-y-2">
                <label className="text-xs font-bold text-slate-400">Technician Remarks & Observations</label>
                <textarea rows={4} placeholder="Describe the findings and the fix implemented..." className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-sm text-white outline-none focus:border-blue-500" />
              </div>
              <div className="md:col-span-2 flex justify-end gap-4">
                <button className="px-8 py-3 bg-slate-800 text-white rounded-2xl text-sm font-bold hover:bg-slate-700 transition-all border border-slate-700">
                  Save Progress
                </button>
                <button className="px-8 py-3 bg-blue-600 text-white rounded-2xl text-sm font-bold shadow-lg shadow-blue-900/20 hover:bg-blue-500 transition-all">
                  Submit for Approval
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="lg:col-span-4 space-y-8">
          {/* 2. Asset Snapshot */}
          <div className="bg-slate-900/50 border border-slate-800 rounded-3xl p-6 space-y-6">
            <h3 className="text-sm font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
              <Info size={16} className="text-blue-500" /> Asset Intelligence
            </h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black text-slate-500 uppercase">Current Condition</span>
                <span className="text-[10px] font-black text-amber-500 bg-amber-500/10 px-2 py-0.5 rounded uppercase">Fair</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black text-slate-500 uppercase">Location</span>
                <span className="text-xs font-bold text-white">Emergency Ward • Block B</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black text-slate-500 uppercase">Serial Number</span>
                <span className="text-xs font-bold text-white">{job.serial_number || 'BW-9021-X'}</span>
              </div>
            </div>
            <div className="pt-6 border-t border-slate-800">
              <p className="text-[10px] font-black text-slate-500 uppercase mb-4">Last 3 Service History</p>
              <div className="space-y-3">
                {[1, 2].map(i => (
                  <div key={i} className="flex items-center gap-3">
                    <div className="w-1 h-8 bg-slate-800 rounded-full" />
                    <div>
                      <p className="text-[10px] font-bold text-white uppercase">PPM Calibration</p>
                      <p className="text-[8px] text-slate-500 font-bold uppercase">12 Sep 2024 • Completed</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* 3. Assignment Block */}
          <div className="bg-slate-900/50 border border-slate-800 rounded-3xl p-6 space-y-6">
            <h3 className="text-sm font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
              <User size={16} className="text-emerald-500" /> Assignment Hub
            </h3>
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-blue-500/10 rounded-2xl flex items-center justify-center text-blue-500 font-black">
                SK
              </div>
              <div>
                <p className="text-sm font-bold text-white">{job.technician_name}</p>
                <p className="text-[10px] text-slate-500 uppercase font-black">Lead Bio-Medical Technician</p>
              </div>
            </div>
            <div className="pt-4 border-t border-slate-800 grid grid-cols-2 gap-4 text-center">
               <div className="space-y-1">
                 <p className="text-[9px] font-black text-slate-500 uppercase">Assigned By</p>
                 <p className="text-xs text-white font-bold">Admin John</p>
               </div>
               <div className="space-y-1">
                 <p className="text-[9px] font-black text-slate-500 uppercase">Assignment Date</p>
                 <p className="text-xs text-white font-bold">12 Oct 2024</p>
               </div>
            </div>
          </div>

          {/* 8. Cost Summary */}
          <div className="bg-slate-900/50 border border-slate-800 rounded-3xl p-6 space-y-6">
             <h3 className="text-sm font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
               <DollarSign size={16} className="text-amber-500" /> Financial Impact
             </h3>
             <div className="space-y-4">
               <div className="flex items-center justify-between">
                 <span className="text-[10px] font-black text-slate-500 uppercase">Estimated Parts Cost</span>
                 <span className="text-xs font-bold text-white">₹ 4,500</span>
               </div>
               <div className="flex items-center justify-between">
                 <span className="text-[10px] font-black text-slate-500 uppercase">Actual Cost</span>
                 <span className="text-xs font-bold text-white">₹ 4,200</span>
               </div>
               <div className="p-3 bg-emerald-500/5 border border-emerald-500/10 rounded-2xl flex items-center gap-3">
                 <ShieldCheck size={20} className="text-emerald-500" />
                 <div>
                   <p className="text-[10px] font-black text-emerald-500 uppercase">AMC Coverage Active</p>
                   <p className="text-[8px] text-slate-500 font-medium">This repair is fully covered under the vendor SLA.</p>
                 </div>
               </div>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
}
