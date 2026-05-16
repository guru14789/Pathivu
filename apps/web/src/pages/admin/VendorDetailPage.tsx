import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { 
  ArrowLeft, 
  Building2, 
  Phone, 
  Mail, 
  MapPin, 
  Star, 
  ShieldCheck, 
  FileText, 
  Package, 
  History, 
  TrendingUp,
  Download,
  Plus,
  AlertCircle,
  ExternalLink,
  ChevronRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import { cn } from '../../lib/utils';
import axios from 'axios';
import { format } from 'date-fns';

// --- Types ---
interface AMC {
  id: string;
  asset_tag: string;
  asset_name: string;
  value: number;
  start_date: string;
  end_date: string;
  sla_hours: number;
  status: 'active' | 'expired';
}

interface VendorDetail {
  id: string;
  vendor_code: string;
  name: string;
  contact_person: string;
  email: string;
  phone: string;
  gst_number: string;
  address: string;
  rating: number;
  rating_breakdown: {
    sla_score: number;
    completion_rate: number;
    recurrence_rate: number;
  };
  amcs: AMC[];
}

export default function VendorDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'amcs' | 'assets' | 'history'>('amcs');

  // --- Queries ---
  const { data: vendor, isLoading } = useQuery({
    queryKey: ['vendor-detail', id],
    queryFn: async () => {
      const res = await axios.get(`/api/vendors/${id}`);
      return res.data.data as VendorDetail;
    }
  });

  if (isLoading) return <div className="flex items-center justify-center min-h-screen text-slate-500">Retrieving partner profile...</div>;
  if (!vendor) return <div className="flex items-center justify-center min-h-screen text-red-500">Vendor not found.</div>;

  return (
    <div className="space-y-8 pb-32">
      {/* Header Section */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div className="flex items-start gap-5">
          <button onClick={() => navigate(-1)} className="mt-1 p-2 bg-slate-900 border border-slate-800 rounded-xl text-slate-400 hover:text-white transition-all">
            <ArrowLeft size={20} />
          </button>
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <span className="text-[10px] font-black text-blue-500 bg-blue-500/10 border border-blue-500/20 px-2 py-0.5 rounded uppercase tracking-widest">
                {vendor.vendor_code}
              </span>
              <div className="flex items-center gap-1">
                 {[...Array(5)].map((_, i) => (
                   <Star key={i} size={10} className={cn(i < Math.floor(vendor.rating) ? "text-amber-500 fill-current" : "text-slate-800")} />
                 ))}
                 <span className="text-[10px] font-black text-slate-500 uppercase ml-1">{vendor.rating} Performance</span>
              </div>
            </div>
            <h1 className="text-4xl font-black text-white tracking-tighter leading-none">{vendor.name}</h1>
            <p className="text-slate-400 font-medium flex items-center gap-2">
              <MapPin size={14} className="text-blue-500" /> {vendor.address}
            </p>
          </div>
        </div>
        
        <div className="flex gap-3">
           <button className="px-6 py-3 bg-slate-800 text-white rounded-2xl text-sm font-bold border border-slate-700 hover:bg-slate-700 transition-all flex items-center gap-2">
             <Plus size={18} /> Add AMC Contract
           </button>
           <button className="px-6 py-3 bg-blue-600 text-white rounded-2xl text-sm font-bold shadow-lg shadow-blue-900/20 hover:bg-blue-500 transition-all flex items-center gap-2">
             <TrendingUp size={18} /> Performance Audit
           </button>
        </div>
      </div>

      <div className="grid lg:grid-cols-12 gap-8">
        {/* Left Column: Stats & Performance */}
        <div className="lg:col-span-4 space-y-8">
           {/* Performance Breakdown */}
           <div className="bg-slate-900/50 border border-slate-800 rounded-[40px] p-8 space-y-8">
              <h3 className="text-sm font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                <TrendingUp size={16} className="text-blue-500" /> Scoring Metrics
              </h3>
              
              <div className="space-y-6">
                {[
                  { label: 'SLA Response Time', score: vendor.rating_breakdown.sla_score, color: 'bg-emerald-500' },
                  { label: 'Job Completion Rate', score: vendor.rating_breakdown.completion_rate, color: 'bg-blue-500' },
                  { label: 'Fault Recurrence (Low)', score: vendor.rating_breakdown.recurrence_rate, color: 'bg-amber-500' },
                ].map((m, i) => (
                  <div key={i} className="space-y-2">
                    <div className="flex justify-between text-[10px] font-black uppercase">
                      <span className="text-slate-500">{m.label}</span>
                      <span className="text-white">{m.score}%</span>
                    </div>
                    <div className="h-2 bg-slate-950 rounded-full overflow-hidden">
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${m.score}%` }}
                        className={cn("h-full transition-all", m.color)}
                      />
                    </div>
                  </div>
                ))}
              </div>

              <div className="pt-6 border-t border-slate-800 grid grid-cols-2 gap-4">
                 <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800">
                    <p className="text-[10px] font-black text-slate-500 uppercase">GST Number</p>
                    <p className="text-xs font-bold text-white mt-1 uppercase">{vendor.gst_number}</p>
                 </div>
                 <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800">
                    <p className="text-[10px] font-black text-slate-500 uppercase">P1 SLA</p>
                    <p className="text-xs font-bold text-white mt-1 uppercase">4 Hours</p>
                 </div>
              </div>
           </div>

           {/* Contact Hub */}
           <div className="bg-slate-900/50 border border-slate-800 rounded-[40px] p-8 space-y-6">
              <h3 className="text-sm font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                <Phone size={16} className="text-emerald-500" /> Partner Contacts
              </h3>
              <div className="space-y-4">
                 <div className="flex items-center gap-4 p-4 bg-slate-950 rounded-2xl border border-slate-800">
                    <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-500">
                       <Mail size={18} />
                    </div>
                    <div>
                       <p className="text-[10px] font-black text-slate-500 uppercase">Email Address</p>
                       <p className="text-xs font-bold text-white">{vendor.email}</p>
                    </div>
                 </div>
                 <div className="flex items-center gap-4 p-4 bg-slate-950 rounded-2xl border border-slate-800">
                    <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-500">
                       <Phone size={18} />
                    </div>
                    <div>
                       <p className="text-[10px] font-black text-slate-500 uppercase">Contact Phone</p>
                       <p className="text-xs font-bold text-white">{vendor.phone}</p>
                    </div>
                 </div>
              </div>
           </div>
        </div>

        {/* Right Column: AMCs & Content */}
        <div className="lg:col-span-8 space-y-8">
           <div className="bg-slate-900/30 border border-slate-800 rounded-[40px] overflow-hidden backdrop-blur-md">
              <div className="flex border-b border-slate-800 p-2 gap-2">
                {[
                  { id: 'amcs', label: 'AMC Contracts', icon: FileText },
                  { id: 'assets', label: 'Covered Assets', icon: Package },
                  { id: 'history', label: 'Service History', icon: History },
                ].map(tab => (
                  <button 
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={cn(
                      "flex items-center gap-2 px-6 py-3 rounded-2xl text-xs font-black uppercase tracking-widest transition-all",
                      activeTab === tab.id ? "bg-slate-800 text-white" : "text-slate-500 hover:text-slate-300"
                    )}
                  >
                    <tab.icon size={16} />
                    {tab.label}
                  </button>
                ))}
              </div>

              <div className="p-8">
                <AnimatePresence mode="wait">
                  {activeTab === 'amcs' && (
                    <motion.div 
                      key="amcs"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="space-y-4"
                    >
                      {vendor.amcs.map(amc => (
                        <div key={amc.id} className="p-6 bg-slate-950/50 border border-slate-800 rounded-3xl flex items-center justify-between group hover:border-blue-500/30 transition-all">
                           <div className="flex items-center gap-5">
                              <div className="w-12 h-12 bg-blue-500/5 rounded-2xl flex items-center justify-center text-blue-500">
                                 <ShieldCheck size={24} />
                              </div>
                              <div>
                                 <h4 className="text-sm font-black text-white group-hover:text-blue-400 transition-colors">{amc.asset_name}</h4>
                                 <div className="flex items-center gap-3 mt-1 text-[10px] font-bold text-slate-500 uppercase">
                                    <span>{amc.asset_tag}</span>
                                    <span>•</span>
                                    <span className={amc.status === 'active' ? 'text-emerald-500' : 'text-red-500'}>{amc.status}</span>
                                 </div>
                              </div>
                           </div>
                           
                           <div className="flex items-center gap-12">
                              <div className="text-right">
                                 <p className="text-[10px] font-black text-slate-500 uppercase">Value</p>
                                 <p className="text-xs font-bold text-white">₹ {amc.value.toLocaleString()}</p>
                              </div>
                              <div className="text-right">
                                 <p className="text-[10px] font-black text-slate-500 uppercase">Expiry</p>
                                 <p className="text-xs font-bold text-white">{format(new Date(amc.end_date), 'dd MMM yyyy')}</p>
                              </div>
                              <button className="p-3 bg-slate-900 border border-slate-800 rounded-xl text-slate-400 hover:text-white transition-all">
                                 <Download size={18} />
                              </button>
                           </div>
                        </div>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
}
