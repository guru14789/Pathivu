import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  Building2, 
  MapPin, 
  Package, 
  AlertTriangle, 
  ShieldCheck, 
  Plus, 
  ChevronRight, 
  Phone,
  User,
  ArrowRightLeft,
  History,
  X,
  Trash2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import { cn } from '../../lib/utils';
import axios from 'axios';
import toast from 'react-hot-toast';
import ConfirmDialog from '../../components/ConfirmDialog';

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
  const { user: _user } = useAuth();
  const [selectedHospital, setSelectedHospital] = useState<Hospital | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [deactivateId, setDeactivateId] = useState<string | null>(null);

  // --- Queries ---
  const { data: hospitals } = useQuery({
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
    if (score >= 90) return { label: 'Compliant', color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-200' };
    if (score >= 75) return { label: 'At Risk', color: 'text-amber-600', bg: 'bg-amber-50', border: '' };
    return { label: 'Non-Compliant', color: 'text-red-600', bg: 'bg-red-50', border: '' };
  };

  const queryClient = useQueryClient();

  const deactivateMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await axios.put(`/api/hospitals/${id}`, { is_active: false });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hospitals-management'] });
      toast.success('Hospital deactivated successfully');
      setDeactivateId(null);
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Failed to deactivate hospital');
      setDeactivateId(null);
    },
  });

  return (
    <div className="space-y-10 pb-32">
      {/* 2. Chain Summary Bar */}
      <div className="grid md:grid-cols-4 gap-6">
        {[
          { label: 'Total Chain Assets', value: chainStats?.total_assets || '4,281', icon: Package, containerBg: 'bg-purple-100', iconColor: 'text-[#6A1B9A]' },
          { label: 'Total Open Faults', value: chainStats?.total_faults || '124', icon: AlertTriangle, containerBg: 'bg-red-100', iconColor: 'text-red-600' },
          { label: 'Expiring Certificates', value: chainStats?.expiring_soon || '32', icon: ShieldCheck, containerBg: 'bg-amber-100', iconColor: 'text-amber-600' },
          { label: 'Active Transfers', value: '14', icon: ArrowRightLeft, containerBg: 'bg-emerald-100', iconColor: 'text-emerald-600' },
        ].map((stat, i) => (
          <div key={i} className="bg-white border border-gray-200 p-6 rounded-3xl flex items-center gap-5 shadow-sm">
            <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center", stat.containerBg)}>
              <stat.icon size={24} className={stat.iconColor} />
            </div>
            <div>
              <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest">{stat.label}</p>
              <p className="text-2xl font-black text-gray-900">{stat.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Header & Add Button */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-black text-gray-900 tracking-tighter">Hospital Network Control</h1>
          <p className="text-gray-500 font-medium text-sm">Managing operational health across all 10 branches.</p>
        </div>
        <button 
          onClick={() => setIsAddModalOpen(true)}
          className="bg-[#6A1B9A] hover:bg-[#7B1FA2] text-white px-8 py-4 rounded-2xl text-sm font-black shadow-lg shadow-purple-900/20 flex items-center gap-2 transition-all"
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
                  "bg-white border border-gray-200 p-8 rounded-[40px] space-y-6 cursor-pointer hover:border-[#6A1B9A]/30 transition-all group relative overflow-hidden",
                  selectedHospital?.hospital_id === hospital.hospital_id && "ring-2 ring-[#6A1B9A]/20 border-[#6A1B9A]/50"
                )}
              >
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <h3 className="text-xl font-black text-gray-900 group-hover:text-[#6A1B9A] transition-colors">{hospital.name}</h3>
                    <div className="flex items-center gap-2 text-gray-500 text-xs font-bold">
                       <MapPin size={14} /> {hospital.city}
                    </div>
                  </div>
                  <div className={cn("px-3 py-1 rounded-full text-[10px] font-black uppercase border", status.color, status.bg, status.border)}>
                    {status.label}
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4 pt-4">
                  <div className="space-y-1">
                    <p className="text-[10px] font-black text-gray-500 uppercase">Assets</p>
                    <p className="text-lg font-black text-gray-900">{hospital.stats.total_assets}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] font-black text-gray-500 uppercase">Faults</p>
                    <p className="text-lg font-black text-red-500">{hospital.stats.open_faults}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] font-black text-gray-500 uppercase">Beds</p>
                    <p className="text-lg font-black text-emerald-500">{hospital.bed_count}</p>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-6 border-t border-gray-100">
                   <div className="flex -space-x-2">
                     {hospital.admins.map((admin, i) => (
                       <div key={i} className="w-8 h-8 rounded-full bg-gray-100 border-2 border-white flex items-center justify-center text-[10px] font-black text-[#6A1B9A]">
                         {admin[0]}
                       </div>
                     ))}
                   </div>
                   <button className="text-xs font-black text-gray-400 uppercase hover:text-gray-900 transition-all flex items-center gap-1">
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
                className="bg-white border border-gray-200 rounded-[40px] p-8 space-y-8 sticky top-8"
              >
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-black text-gray-500 uppercase tracking-widest">Branch Profile</h3>
                  <button onClick={() => setSelectedHospital(null)} className="text-gray-400 hover:text-gray-700"><X size={20} /></button>
                </div>

                <div className="space-y-6">
                  <div className="space-y-2">
                    <h2 className="text-3xl font-black text-gray-900 tracking-tighter">{selectedHospital.name}</h2>
                    <p className="text-sm text-gray-500 font-medium leading-relaxed">{selectedHospital.address}</p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 bg-gray-50 border border-gray-200 rounded-3xl space-y-2">
                       <User size={18} className="text-[#6A1B9A]" />
                       <p className="text-[10px] font-black text-gray-500 uppercase">Contact Person</p>
                       <p className="text-sm font-bold text-gray-900">{selectedHospital.contact_person}</p>
                    </div>
                    <div className="p-4 bg-gray-50 border border-gray-200 rounded-3xl space-y-2">
                       <Phone size={18} className="text-emerald-600" />
                       <p className="text-[10px] font-black text-gray-500 uppercase">Contact Phone</p>
                       <p className="text-sm font-bold text-gray-900">{selectedHospital.phone}</p>
                    </div>
                  </div>

                  {/* 5. Assign Branch Admin */}
                  <div className="space-y-4">
                    <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Branch Administrators</p>
                    <div className="space-y-2">
                      {selectedHospital.admins.map((admin, i) => (
                        <div key={i} className="flex items-center justify-between p-3 bg-gray-50/50 border border-gray-100 rounded-2xl">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-[#6A1B9A] font-black text-[10px]">
                              {admin[0]}
                            </div>
                            <span className="text-xs font-bold text-gray-900">{admin}</span>
                          </div>
                          <button className="text-[10px] font-black text-red-500 uppercase">Revoke</button>
                        </div>
                      ))}
                      <button className="w-full py-3 border border-dashed border-gray-200 rounded-2xl text-[10px] font-black text-gray-400 uppercase hover:border-purple-500/50 hover:text-[#6A1B9A] transition-all flex items-center justify-center gap-2">
                        <Plus size={14} /> Assign New Admin
                      </button>
                    </div>
                  </div>

                  <div className="space-y-4">
                     <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Asset Transfer History</p>
                     <div className="space-y-3">
                        {[1, 2].map(i => (
                          <div key={i} className="flex items-center gap-3 p-3 bg-gray-50/50 rounded-2xl">
                             <History size={14} className="text-gray-400" />
                             <div>
                                <p className="text-[10px] font-bold text-gray-900">MRI Machine 041 → City Branch</p>
                                <p className="text-[8px] text-gray-500 font-bold uppercase">Approved by Suresh K. • 12 Oct</p>
                             </div>
                          </div>
                        ))}
                     </div>
                  </div>

                  <div className="pt-4 flex gap-4">
                     <button className="flex-1 bg-gray-100 text-gray-700 py-4 rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-gray-200 transition-all">View Assets</button>
                     <button className="flex-1 bg-gray-100 text-gray-700 py-4 rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-gray-200 transition-all">View Faults</button>
                  </div>

                  <button
                    onClick={() => setDeactivateId(selectedHospital.hospital_id)}
                    className="w-full py-4 bg-red-50 text-red-600 rounded-2xl text-xs font-black uppercase tracking-widest border border-red-200 hover:bg-red-600 hover:text-white transition-all flex items-center justify-center gap-2"
                  >
                    <Trash2 size={16} /> Deactivate Hospital
                  </button>
                </div>
              </motion.div>
            ) : (
              <div className="h-[600px] bg-gray-50/50 border-2 border-dashed border-gray-200 rounded-[40px] flex flex-col items-center justify-center space-y-4 text-gray-400">
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
              className="fixed inset-0 bg-black/30 backdrop-blur-sm z-[100]"
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="fixed inset-0 m-auto w-full max-w-xl h-fit bg-white border border-gray-200 rounded-[40px] z-[101] p-10 space-y-8"
            >
              <div>
                <h2 className="text-3xl font-black text-gray-900 tracking-tighter">Add New Branch</h2>
                <p className="text-gray-500 text-sm">Register a new hospital unit into the AssetIQ network.</p>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Branch Name</label>
                    <input className="w-full bg-gray-50 border border-gray-200 rounded-2xl py-3 px-4 text-sm text-gray-900 placeholder:text-gray-400" placeholder="e.g. City Hospital" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Code</label>
                    <input className="w-full bg-gray-50 border border-gray-200 rounded-2xl py-3 px-4 text-sm text-gray-900 placeholder:text-gray-400" placeholder="e.g. CHN" maxLength={3} />
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Address</label>
                  <input className="w-full bg-gray-50 border border-gray-200 rounded-2xl py-3 px-4 text-sm text-gray-900 placeholder:text-gray-400" placeholder="Full street address" />
                </div>
              </div>

              <div className="flex gap-4">
                <button onClick={() => setIsAddModalOpen(false)} className="flex-1 py-4 bg-gray-100 text-gray-700 rounded-2xl font-black text-sm hover:bg-gray-200">Cancel</button>
                <button className="flex-1 py-4 bg-[#6A1B9A] hover:bg-[#7B1FA2] text-white rounded-2xl font-black text-sm shadow-lg shadow-purple-900/20">Register Branch</button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <ConfirmDialog open={deactivateId !== null} title="Deactivate Hospital" message="Are you sure you want to deactivate this hospital?" variant="danger" confirmLabel="Deactivate Hospital" onConfirm={() => deactivateMutation.mutate(deactivateId!)} onCancel={() => setDeactivateId(null)} isLoading={deactivateMutation.isPending} />
    </div>
  );
}
