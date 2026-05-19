import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { 
  ArrowLeft, 
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
  Plus
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
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

  if (isLoading) return <div className="flex items-center justify-center min-h-screen text-gray-500">Retrieving partner profile...</div>;
  if (!vendor) return <div className="flex items-center justify-center min-h-screen text-red-500">Vendor not found.</div>;

  return (
    <div className="space-y-8 pb-32">
      {/* Header Section */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div className="flex items-start gap-5">
          <button onClick={() => navigate(-1)} className="mt-1 p-2 bg-white border border-gray-200 rounded-xl text-gray-400 hover:text-gray-900 shadow-sm transition-all">
            <ArrowLeft size={20} />
          </button>
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <span className="text-[10px] font-black text-[#6A1B9A] bg-purple-50 border border-purple-200 px-2 py-0.5 rounded uppercase tracking-widest">
                {vendor.vendor_code}
              </span>
              <div className="flex items-center gap-1">
                 {[...Array(5)].map((_, i) => (
                   <Star key={i} size={10} className={cn(i < Math.floor(vendor.rating) ? "text-amber-500 fill-current" : "text-gray-200")} />
                 ))}
                 <span className="text-[10px] font-black text-gray-500 uppercase ml-1">{vendor.rating} Performance</span>
              </div>
            </div>
            <h1 className="text-4xl font-black text-gray-900 tracking-tighter leading-none">{vendor.name}</h1>
            <p className="text-gray-500 font-medium flex items-center gap-2">
              <MapPin size={14} className="text-[#6A1B9A]" /> {vendor.address}
            </p>
          </div>
        </div>
        
        <div className="flex gap-3">
           <button className="px-6 py-3 bg-gray-100 text-gray-700 border border-gray-200 hover:bg-gray-200 rounded-2xl text-sm font-bold transition-all flex items-center gap-2">
             <Plus size={18} /> Add AMC Contract
           </button>
           <button className="px-6 py-3 bg-[#6A1B9A] hover:bg-[#7B1FA2] text-white rounded-2xl text-sm font-bold shadow-lg shadow-purple-900/20 transition-all flex items-center gap-2">
             <TrendingUp size={18} /> Performance Audit
           </button>
        </div>
      </div>

      <div className="grid lg:grid-cols-12 gap-8">
        {/* Left Column: Stats & Performance */}
        <div className="lg:col-span-4 space-y-8">
           {/* Performance Breakdown */}
           <div className="bg-white border border-gray-200 shadow-sm rounded-[40px] p-8 space-y-8">
              <h3 className="text-sm font-black text-gray-500 uppercase tracking-widest flex items-center gap-2">
                <TrendingUp size={16} className="text-[#6A1B9A]" /> Scoring Metrics
              </h3>
              
              <div className="space-y-6">
                {[
                  { label: 'SLA Response Time', score: vendor.rating_breakdown.sla_score, color: 'bg-emerald-500' },
                  { label: 'Job Completion Rate', score: vendor.rating_breakdown.completion_rate, color: 'bg-[#6A1B9A]' },
                  { label: 'Fault Recurrence (Low)', score: vendor.rating_breakdown.recurrence_rate, color: 'bg-amber-500' },
                ].map((m, i) => (
                  <div key={i} className="space-y-2">
                    <div className="flex justify-between text-[10px] font-black uppercase">
                      <span className="text-gray-500">{m.label}</span>
                      <span className="text-gray-900">{m.score}%</span>
                    </div>
                    <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${m.score}%` }}
                        className={cn("h-full transition-all", m.color)}
                      />
                    </div>
                  </div>
                ))}
              </div>

              <div className="pt-6 border-t border-gray-200 grid grid-cols-2 gap-4">
                 <div className="p-4 bg-gray-50 border border-gray-200 rounded-2xl">
                    <p className="text-[10px] font-black text-gray-500 uppercase">GST Number</p>
                    <p className="text-xs font-bold text-gray-900 mt-1 uppercase">{vendor.gst_number}</p>
                 </div>
                 <div className="p-4 bg-gray-50 border border-gray-200 rounded-2xl">
                    <p className="text-[10px] font-black text-gray-500 uppercase">P1 SLA</p>
                    <p className="text-xs font-bold text-gray-900 mt-1 uppercase">4 Hours</p>
                 </div>
              </div>
           </div>

           {/* Contact Hub */}
           <div className="bg-white border border-gray-200 shadow-sm rounded-[40px] p-8 space-y-6">
              <h3 className="text-sm font-black text-gray-500 uppercase tracking-widest flex items-center gap-2">
                <Phone size={16} className="text-emerald-600" /> Partner Contacts
              </h3>
              <div className="space-y-4">
                 <div className="flex items-center gap-4 p-4 bg-gray-50 border border-gray-200 rounded-2xl">
                    <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center text-[#6A1B9A]">
                       <Mail size={18} />
                    </div>
                    <div>
                       <p className="text-[10px] font-black text-gray-500 uppercase">Email Address</p>
                       <p className="text-xs font-bold text-gray-900">{vendor.email}</p>
                    </div>
                 </div>
                 <div className="flex items-center gap-4 p-4 bg-gray-50 border border-gray-200 rounded-2xl">
                    <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-600">
                       <Phone size={18} />
                    </div>
                    <div>
                       <p className="text-[10px] font-black text-gray-500 uppercase">Contact Phone</p>
                       <p className="text-xs font-bold text-gray-900">{vendor.phone}</p>
                    </div>
                 </div>
              </div>
           </div>
        </div>

        {/* Right Column: AMCs & Content */}
        <div className="lg:col-span-8 space-y-8">
           <div className="bg-white border border-gray-200 shadow-sm rounded-[40px] overflow-hidden">
              <div className="flex border-b border-gray-200 p-2 gap-2">
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
                      activeTab === tab.id ? "bg-gray-100 text-gray-900" : "text-gray-500 hover:text-gray-700"
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
                        <div key={amc.id} className="p-6 bg-gray-50/50 border border-gray-200 rounded-3xl flex items-center justify-between group hover:border-purple-500/30 transition-all">
                           <div className="flex items-center gap-5">
                              <div className="w-12 h-12 bg-purple-50 rounded-2xl flex items-center justify-center text-[#6A1B9A]">
                                 <ShieldCheck size={24} />
                              </div>
                              <div>
                                 <h4 className="text-sm font-black text-gray-900 group-hover:text-[#6A1B9A] transition-colors">{amc.asset_name}</h4>
                                 <div className="flex items-center gap-3 mt-1 text-[10px] font-bold text-gray-500 uppercase">
                                    <span>{amc.asset_tag}</span>
                                    <span>•</span>
                                    <span className={amc.status === 'active' ? 'text-emerald-600' : 'text-red-600'}>{amc.status}</span>
                                 </div>
                              </div>
                           </div>
                           
                           <div className="flex items-center gap-12">
                              <div className="text-right">
                                 <p className="text-[10px] font-black text-gray-500 uppercase">Value</p>
                                 <p className="text-xs font-bold text-gray-900">₹ {amc.value.toLocaleString()}</p>
                              </div>
                              <div className="text-right">
                                 <p className="text-[10px] font-black text-gray-500 uppercase">Expiry</p>
                                 <p className="text-xs font-bold text-gray-900">{format(new Date(amc.end_date), 'dd MMM yyyy')}</p>
                              </div>
                              <button className="p-3 bg-gray-100 border border-gray-200 rounded-xl text-gray-400 hover:text-gray-900 transition-all">
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
