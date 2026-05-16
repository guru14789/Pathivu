import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { 
  Building2, 
  MapPin, 
  Users, 
  Package, 
  AlertTriangle, 
  ShieldCheck, 
  Plus, 
  ChevronRight, 
  ExternalLink,
  Bed,
  Phone,
  User,
  Search,
  ArrowRightLeft,
  History,
  TrendingUp,
  X
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import { cn } from '../../lib/utils';
import axios from 'axios';

// --- Types ---
interface Hospital {
  hospital_id: string;
  name: string;
  city: string;
  address: string;
  bed_count: number;
  contact_person: string;
  phone: string;
  stats: {
    total_assets: number;
    open_faults: number;
    compliance_score: number; // 0-100
  };
  admins: string[];
}

export default function HospitalsPage() {
  const { user } = useAuth();
  const [selectedHospital, setSelectedHospital] = useState<Hospital | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // --- Queries ---
  const { data: hospitals, isLoading } = useQuery({
    queryKey: ['hospitals-management'],
    queryFn: async () => {
      const res = await axios.get('/api/hospitals/manage');
      return res.data.data as Hospital[];
    }
  });

  const { data: chainStats } = useQuery({
    queryKey: ['chain-summary'],
    queryFn: async () => {
      const res = await axios.get('/api/hospitals/chain-summary');
      return res.data.data;
    }
  });

  const getComplianceStatus = (score: number) => {
    if (score >= 90) return { label: 'Compliant', color: 'text-emerald-500', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20' };
    if (score >= 75) return { label: 'At Risk', color: 'text-amber-500', bg: 'bg-amber-500/10', border: 'border-amber-500/20' };
    return { label: 'Non-Compliant', color: 'text-red-500', bg: 'bg-red-500/10', border: 'border-red-500/20' };
  };

  return (
    <div className="space-y-10 pb-32">
      {/* 2. Chain Summary Bar */}
      <div className="grid md:grid-cols-4 gap-6">
        {[
          { label: 'Total Chain Assets', value: chainStats?.total_assets || '4,281', icon: Package, color: 'text-blue-500' },
          { label: 'Total Open Faults', value: chainStats?.total_faults || '124', icon: AlertTriangle, color: 'text-red-500' },
          { label: 'Expiring Certificates', value: chainStats?.expiring_soon || '32', icon: ShieldCheck, color: 'text-amber-500' },
          { label: 'Active Transfers', value: '14', icon: ArrowRightLeft, color: 'text-emerald-500' },
        ].map((stat, i) => (
          <div key={i} className="bg-slate-900/50 border border-slate-800 p-6 rounded-3xl flex items-center gap-5">
            <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center bg-opacity-10", stat.color.replace('text-', 'bg-'))}>
              <stat.icon size={24} className={stat.color} />
            </div>
            <div>
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{stat.label}</p>
              <p className="text-2xl font-black text-white">{stat.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Header & Add Button */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-black text-white tracking-tighter">Hospital Network Control</h1>
          <p className="text-slate-400 font-medium text-sm">Managing operational health across all 10 branches.</p>
        </div>
        <button 
          onClick={() => setIsAddModalOpen(true)}
          className="bg-blue-600 hover:bg-blue-500 text-white px-8 py-4 rounded-2xl text-sm font-black shadow-xl shadow-blue-900/20 flex items-center gap-2 transition-all"
        >
          <Plus size={20} /> Add New Branch
        </button>
      </div>

      <div className="grid lg:grid-cols-12 gap-8">
        {/* 1. Hospital Cards Grid */}
        <div className="lg:col-span-8 grid md:grid-cols-2 gap-8">
          {hospitals?.map(hospital => {
            const status = getComplianceStatus(hospital.stats.compliance_score);
            return (
              <motion.div 
                key={hospital.hospital_id}
                layoutId={hospital.hospital_id}
                onClick={() => setSelectedHospital(hospital)}
                className={cn(
                  "bg-slate-900/50 border border-slate-800 p-8 rounded-[40px] space-y-6 cursor-pointer hover:border-blue-500/30 transition-all group relative overflow-hidden",
                  selectedHospital?.hospital_id === hospital.hospital_id && "border-blue-500/50 ring-2 ring-blue-500/20"
                )}
              >
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <h3 className="text-xl font-black text-white group-hover:text-blue-400 transition-colors">{hospital.name}</h3>
                    <div className="flex items-center gap-2 text-slate-500 text-xs font-bold">
                       <MapPin size={14} /> {hospital.city}
                    </div>
                  </div>
                  <div className={cn("px-3 py-1 rounded-full text-[10px] font-black uppercase border", status.color, status.bg, status.border)}>
                    {status.label}
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4 pt-4">
                  <div className="space-y-1">
                    <p className="text-[10px] font-black text-slate-500 uppercase">Assets</p>
                    <p className="text-lg font-black text-white">{hospital.stats.total_assets}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] font-black text-slate-500 uppercase">Faults</p>
                    <p className="text-lg font-black text-red-500">{hospital.stats.open_faults}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] font-black text-slate-500 uppercase">Beds</p>
                    <p className="text-lg font-black text-emerald-500">{hospital.bed_count}</p>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-6 border-t border-slate-800/50">
                   <div className="flex -space-x-2">
                     {hospital.admins.map((admin, i) => (
                       <div key={i} className="w-8 h-8 rounded-full bg-slate-800 border-2 border-slate-900 flex items-center justify-center text-[10px] font-black text-blue-500">
                         {admin[0]}
                       </div>
                     ))}
                   </div>
                   <button className="text-xs font-black text-slate-500 uppercase hover:text-white transition-all flex items-center gap-1">
                      Manage <ChevronRight size={14} />
                   </button>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* 3. Hospital Detail Panel */}
        <div className="lg:col-span-4">
          <AnimatePresence mode="wait">
            {selectedHospital ? (
              <motion.div 
                key="detail"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="bg-slate-900 border border-slate-800 rounded-[40px] p-8 space-y-8 sticky top-8"
              >
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-black text-slate-500 uppercase tracking-widest">Branch Profile</h3>
                  <button onClick={() => setSelectedHospital(null)} className="text-slate-500 hover:text-white"><X size={20} /></button>
                </div>

                <div className="space-y-6">
                  <div className="space-y-2">
                    <h2 className="text-3xl font-black text-white tracking-tighter">{selectedHospital.name}</h2>
                    <p className="text-sm text-slate-400 font-medium leading-relaxed">{selectedHospital.address}</p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 bg-slate-950 border border-slate-800 rounded-3xl space-y-2">
                       <User size={18} className="text-blue-500" />
                       <p className="text-[10px] font-black text-slate-500 uppercase">Contact Person</p>
                       <p className="text-sm font-bold text-white">{selectedHospital.contact_person}</p>
                    </div>
                    <div className="p-4 bg-slate-950 border border-slate-800 rounded-3xl space-y-2">
                       <Phone size={18} className="text-emerald-500" />
                       <p className="text-[10px] font-black text-slate-500 uppercase">Contact Phone</p>
                       <p className="text-sm font-bold text-white">{selectedHospital.phone}</p>
                    </div>
                  </div>

                  {/* 5. Assign Branch Admin */}
                  <div className="space-y-4">
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Branch Administrators</p>
                    <div className="space-y-2">
                      {selectedHospital.admins.map((admin, i) => (
                        <div key={i} className="flex items-center justify-between p-3 bg-slate-950/50 border border-slate-800 rounded-2xl">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-500 font-black text-[10px]">
                              {admin[0]}
                            </div>
                            <span className="text-xs font-bold text-white">{admin}</span>
                          </div>
                          <button className="text-[10px] font-black text-red-500 uppercase">Revoke</button>
                        </div>
                      ))}
                      <button className="w-full py-3 border border-dashed border-slate-800 rounded-2xl text-[10px] font-black text-slate-500 uppercase hover:border-blue-500/50 hover:text-blue-500 transition-all flex items-center justify-center gap-2">
                        <Plus size={14} /> Assign New Admin
                      </button>
                    </div>
                  </div>

                  <div className="space-y-4">
                     <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Asset Transfer History</p>
                     <div className="space-y-3">
                        {[1, 2].map(i => (
                          <div key={i} className="flex items-center gap-3 p-3 bg-slate-950/50 rounded-2xl">
                             <History size={14} className="text-slate-600" />
                             <div>
                                <p className="text-[10px] font-bold text-white">MRI Machine 041 → City Branch</p>
                                <p className="text-[8px] text-slate-500 font-bold uppercase">Approved by Suresh K. • 12 Oct</p>
                             </div>
                          </div>
                        ))}
                     </div>
                  </div>

                  <div className="pt-4 flex gap-4">
                     <button className="flex-1 bg-slate-800 text-white py-4 rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-slate-700 transition-all">View Assets</button>
                     <button className="flex-1 bg-slate-800 text-white py-4 rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-slate-700 transition-all">View Faults</button>
                  </div>
                </div>
              </motion.div>
            ) : (
              <div className="h-[600px] bg-slate-900/20 border-2 border-dashed border-slate-800 rounded-[40px] flex flex-col items-center justify-center space-y-4 text-slate-600">
                 <Building2 size={64} />
                 <p className="text-xs font-black uppercase tracking-widest">Select a hospital for details</p>
              </div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* 4. Add Hospital Modal */}
      <AnimatePresence>
        {isAddModalOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsAddModalOpen(false)}
              className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-[100]"
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="fixed inset-0 m-auto w-full max-w-xl h-fit bg-slate-900 border border-slate-800 rounded-[40px] z-[101] p-10 shadow-2xl space-y-8"
            >
              <div>
                <h2 className="text-3xl font-black text-white tracking-tighter">Add New Branch</h2>
                <p className="text-slate-400 text-sm">Register a new hospital unit into the AssetIQ network.</p>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Branch Name</label>
                    <input className="w-full bg-slate-950 border border-slate-800 rounded-2xl py-3 px-4 text-sm text-white" placeholder="e.g. City Hospital" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Code</label>
                    <input className="w-full bg-slate-950 border border-slate-800 rounded-2xl py-3 px-4 text-sm text-white" placeholder="e.g. CHN" maxLength={3} />
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Address</label>
                  <input className="w-full bg-slate-950 border border-slate-800 rounded-2xl py-3 px-4 text-sm text-white" placeholder="Full street address" />
                </div>
              </div>

              <div className="flex gap-4">
                <button onClick={() => setIsAddModalOpen(false)} className="flex-1 py-4 bg-slate-800 text-white rounded-2xl font-black text-sm">Cancel</button>
                <button className="flex-1 py-4 bg-blue-600 text-white rounded-2xl font-black text-sm shadow-xl shadow-blue-900/20">Register Branch</button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
