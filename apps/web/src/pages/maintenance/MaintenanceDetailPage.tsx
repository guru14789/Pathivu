import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { 
  ArrowLeft, 
  User, 
  Wrench, 
  CheckCircle2, 
  History, 
  DollarSign, 
  Info,
  ShieldCheck,
  FileText
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { cn } from '../../lib/utils';
import axios from 'axios';

export default function MaintenanceDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [_status, _setStatus] = useState('in_progress');

  const isAdmin = ['super_admin', 'branch_admin', 'supervisor'].includes(user?.role || '');

  // --- Queries ---
  const { data: job, isLoading } = useQuery({
    queryKey: ['maintenance-job', id],
    queryFn: async () => {
      const res = await axios.get(`/api/maintenance/${id}`);
      return res.data.data;
    }
  });

  if (isLoading) return <div className="flex items-center justify-center min-h-screen text-gray-400">Retrieving job card...</div>;
  if (!job) return <div className="flex items-center justify-center min-h-screen text-red-500">Job card not found.</div>;

  return (
    <div className="space-y-8 pb-32">
      {/* 1. Job Card Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div className="flex items-start gap-5">
          <button onClick={() => navigate(-1)} className="mt-1 p-2 bg-white border border-gray-200 rounded-xl text-gray-400 hover:text-gray-900 shadow-sm transition-all">
            <ArrowLeft size={20} />
          </button>
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <span className="text-[10px] font-black text-[#6A1B9A] bg-purple-50 border border-purple-200 px-2 py-0.5 rounded uppercase tracking-widest">
                #{job.id.slice(0, 8)}
              </span>
              <span className={cn(
                "px-2 py-0.5 rounded text-[10px] font-black uppercase border",
                job.priority === 'P1' ? 'bg-red-50 text-red-600 border-red-200' : 'bg-amber-50 text-amber-600 border-amber-200'
              )}>
                {job.priority} Priority
              </span>
            </div>
            <h1 className="text-4xl font-black text-gray-900 tracking-tighter leading-none">Maintenance Job Card</h1>
            <p className="text-gray-500 font-medium">Asset: {job.asset_name} • <span className="text-[#6A1B9A] font-bold">{job.asset_tag}</span></p>
          </div>
        </div>
        
        {/* Supervisor actions */}
        {isAdmin && (
          <div className="flex gap-3">
            <button className="px-6 py-3 bg-gray-100 text-gray-700 rounded-2xl text-sm font-bold border border-gray-200 hover:bg-gray-200 transition-all flex items-center gap-2">
              <User size={18} /> Reassign
            </button>
            <button className="px-6 py-3 bg-red-50 text-red-600 rounded-2xl text-sm font-bold border border-red-200 hover:bg-red-100 transition-all">
              Cancel Job
            </button>
          </div>
        )}
      </div>

      <div className="grid lg:grid-cols-12 gap-8">
        <div className="lg:col-span-8 space-y-8">
          {/* 4. Timeline Section */}
          <div className="bg-white border border-gray-200 shadow-sm rounded-3xl p-8">
             <h3 className="text-sm font-black text-gray-500 uppercase tracking-widest mb-8 flex items-center gap-2">
               <History size={16} className="text-[#6A1B9A]" /> Operational Lifecycle
             </h3>
             <div className="flex justify-between relative">
               <div className="absolute top-4 left-0 right-0 h-0.5 bg-gray-200 z-0" />
               {[
                 { label: 'Created', date: '12 Oct, 09:00', icon: Info, color: 'text-emerald-500' },
                 { label: 'Assigned', date: '12 Oct, 10:30', icon: User, color: 'text-emerald-500' },
                 { label: 'Started', date: '12 Oct, 14:15', icon: Wrench, color: 'text-[#6A1B9A]' },
                 { label: 'Completed', date: 'Pending', icon: CheckCircle2, color: 'text-gray-400' },
               ].map((step, i) => (
                 <div key={i} className="flex flex-col items-center gap-3 relative z-10">
                   <div className={cn("w-9 h-9 rounded-full bg-white border border-gray-200 flex items-center justify-center", step.color)}>
                     <step.icon size={18} />
                   </div>
                   <div className="text-center">
                     <p className="text-[10px] font-black text-gray-900 uppercase">{step.label}</p>
                     <p className="text-[10px] text-gray-400 font-bold">{step.date}</p>
                   </div>
                 </div>
               ))}
             </div>
          </div>

          {/* 6. Technician Update Form */}
          <div className="bg-white border border-gray-200 shadow-sm rounded-3xl p-8 space-y-8">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-black text-gray-500 uppercase tracking-widest flex items-center gap-2">
                <FileText size={16} className="text-amber-500" /> Maintenance Report
              </h3>
              <span className="text-[10px] font-black text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full uppercase">In Progress</span>
            </div>
            
            <div className="grid md:grid-cols-2 gap-8">
              <div className="space-y-2">
                <label className="text-gray-700 font-semibold text-sm">Current Status</label>
                <select className="w-full bg-white border border-gray-200 rounded-xl p-3 text-sm text-gray-900 focus:ring-2 focus:ring-[#6A1B9A]/20 focus:border-[#6A1B9A]">
                  <option value="in_progress">In Progress</option>
                  <option value="completed">Work Finished (Awaiting Approval)</option>
                  <option value="blocked">Blocked (Needs Parts)</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-gray-700 font-semibold text-sm">Downtime Incurred (Hours)</label>
                <input type="number" placeholder="e.g. 2.5" className="w-full bg-white border border-gray-200 rounded-xl p-3 text-sm text-gray-900 placeholder:text-gray-400 focus:ring-2 focus:ring-[#6A1B9A]/20 focus:border-[#6A1B9A]" />
              </div>
              <div className="md:col-span-2 space-y-2">
                <label className="text-gray-700 font-semibold text-sm">Technician Remarks & Observations</label>
                <textarea rows={4} placeholder="Describe the findings and the fix implemented..." className="w-full bg-white border border-gray-200 rounded-xl p-3 text-sm text-gray-900 placeholder:text-gray-400 outline-none focus:ring-2 focus:ring-[#6A1B9A]/20 focus:border-[#6A1B9A]" />
              </div>
              <div className="md:col-span-2 flex justify-end gap-4">
                <button className="px-8 py-3 bg-gray-100 text-gray-700 rounded-2xl text-sm font-bold border border-gray-200 hover:bg-gray-200 transition-all">
                  Save Progress
                </button>
                <button className="px-8 py-3 bg-[#6A1B9A] hover:bg-[#7B1FA2] text-white rounded-2xl text-sm font-bold shadow-lg shadow-purple-900/20 transition-all">
                  Submit for Approval
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="lg:col-span-4 space-y-8">
          {/* 2. Asset Snapshot */}
          <div className="bg-white border border-gray-200 shadow-sm rounded-3xl p-6 space-y-6">
            <h3 className="text-sm font-black text-gray-500 uppercase tracking-widest flex items-center gap-2">
              <Info size={16} className="text-[#6A1B9A]" /> Asset Intelligence
            </h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black text-gray-500 uppercase">Current Condition</span>
                <span className="text-[10px] font-black text-amber-600 bg-amber-50 px-2 py-0.5 rounded uppercase">Fair</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black text-gray-500 uppercase">Location</span>
                <span className="text-xs font-bold text-gray-900">Emergency Ward • Block B</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black text-gray-500 uppercase">Serial Number</span>
                <span className="text-xs font-bold text-gray-900">{job.serial_number || 'BW-9021-X'}</span>
              </div>
            </div>
            <div className="pt-6 border-t border-gray-200">
              <p className="text-[10px] font-black text-gray-500 uppercase mb-4">Last 3 Service History</p>
              <div className="space-y-3">
                {[1, 2].map(i => (
                  <div key={i} className="flex items-center gap-3">
                    <div className="w-1 h-8 bg-gray-200 rounded-full" />
                    <div>
                      <p className="text-[10px] font-bold text-gray-900 uppercase">PPM Calibration</p>
                      <p className="text-[8px] text-gray-400 font-bold uppercase">12 Sep 2024 • Completed</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* 3. Assignment Block */}
          <div className="bg-white border border-gray-200 shadow-sm rounded-3xl p-6 space-y-6">
            <h3 className="text-sm font-black text-gray-500 uppercase tracking-widest flex items-center gap-2">
              <User size={16} className="text-emerald-500" /> Assignment Hub
            </h3>
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-purple-100 text-[#6A1B9A] rounded-2xl flex items-center justify-center font-black">
                SK
              </div>
              <div>
                <p className="text-sm font-bold text-gray-900">{job.technician_name}</p>
                <p className="text-[10px] text-gray-500 uppercase font-black">Lead Bio-Medical Technician</p>
              </div>
            </div>
            <div className="pt-4 border-t border-gray-200 grid grid-cols-2 gap-4 text-center">
               <div className="space-y-1">
                 <p className="text-[9px] font-black text-gray-500 uppercase">Assigned By</p>
                 <p className="text-xs text-gray-900 font-bold">Admin John</p>
               </div>
               <div className="space-y-1">
                 <p className="text-[9px] font-black text-gray-500 uppercase">Assignment Date</p>
                 <p className="text-xs text-gray-900 font-bold">12 Oct 2024</p>
               </div>
            </div>
          </div>

          {/* 8. Cost Summary */}
          <div className="bg-white border border-gray-200 shadow-sm rounded-3xl p-6 space-y-6">
             <h3 className="text-sm font-black text-gray-500 uppercase tracking-widest flex items-center gap-2">
               <DollarSign size={16} className="text-amber-500" /> Financial Impact
             </h3>
             <div className="space-y-4">
               <div className="flex items-center justify-between">
                 <span className="text-[10px] font-black text-gray-500 uppercase">Estimated Parts Cost</span>
                 <span className="text-xs font-bold text-gray-900">₹ 4,500</span>
               </div>
               <div className="flex items-center justify-between">
                 <span className="text-[10px] font-black text-gray-500 uppercase">Actual Cost</span>
                 <span className="text-xs font-bold text-gray-900">₹ 4,200</span>
               </div>
               <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center gap-3">
                 <ShieldCheck size={20} className="text-emerald-700" />
                 <div>
                   <p className="text-[10px] font-black text-emerald-700 uppercase">AMC Coverage Active</p>
                   <p className="text-[8px] text-gray-500 font-medium">This repair is fully covered under the vendor SLA.</p>
                 </div>
               </div>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
}
