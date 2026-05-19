import { useState } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  Search, 
  Filter, 
  Plus, 
  Star, 
  Package, 
  FileText, 
  Phone, 
  ChevronRight,
  Building2,
  User,
  Trash2
} from 'lucide-react';
import { motion } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import { cn } from '../../lib/utils';
import axios from 'axios';
import toast from 'react-hot-toast';
import ConfirmDialog from '../../components/ConfirmDialog';

// --- Types ---
interface Vendor {
  id: string;
  vendor_code: string;
  name: string;
  contact_person: string;
  email: string;
  phone: string;
  gst_number: string;
  rating: number; // 1-5
  stats: {
    active_amcs: number;
    assets_covered: number;
    completion_rate: number;
  };
}

export default function VendorsPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [search, setSearch] = useState('');
  const [deactivateId, setDeactivateId] = useState<string | null>(null);

  // Technician Role Check
  if (user?.role === 'technician') {
    return <Navigate to="/dashboard" replace />;
  }

  // --- Queries ---
  const { data: vendors } = useQuery({
    queryKey: ['vendors-list', search],
    queryFn: async () => {
      const res = await axios.get('/api/vendors');
      return res.data.data as Vendor[];
    }
  });

  const queryClient = useQueryClient();

  const deactivateMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await axios.put(`/api/vendors/${id}`, { is_active: false });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vendors-list'] });
      toast.success('Vendor deactivated successfully');
      setDeactivateId(null);
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Failed to deactivate vendor');
      setDeactivateId(null);
    },
  });

  return (
    <div className="space-y-8 pb-32">
      {/* Header & Add Button */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-4xl font-black text-gray-900 tracking-tighter">Vendor Ecosystem</h1>
          <p className="text-gray-500 font-medium text-sm">Managing partners, service contracts & performance audits.</p>
        </div>
        <button className="bg-[#6A1B9A] hover:bg-[#7B1FA2] text-white px-8 py-4 rounded-2xl text-sm font-black shadow-lg shadow-purple-900/20 flex items-center gap-2 transition-all">
          <Plus size={20} /> Register New Vendor
        </button>
      </div>

      {/* Filter Bar */}
      <div className="bg-gray-50 border border-gray-200 p-6 rounded-3xl grid md:grid-cols-4 gap-6 items-center">
        <div className="relative md:col-span-2">
          <Search className="absolute left-3 top-3 text-gray-400" size={18} />
          <input 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by vendor name or code..." 
            className="w-full bg-white border border-gray-200 rounded-xl py-2.5 pl-10 pr-4 text-xs text-gray-900 placeholder:text-gray-400 outline-none focus:border-[#6A1B9A]" 
          />
        </div>
        <select className="bg-white border border-gray-200 rounded-xl px-4 py-2.5 text-xs text-gray-700 outline-none">
          <option>All Ratings</option>
          <option>4+ Stars (Premium)</option>
          <option>3+ Stars (Standard)</option>
        </select>
        <button className="flex items-center justify-center gap-2 bg-gray-100 text-gray-700 rounded-xl py-2.5 text-xs font-bold hover:bg-gray-200 transition-all border border-gray-200">
          <Filter size={14} /> Advanced Filters
        </button>
      </div>

      {/* Vendor Cards Grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
        {vendors?.map((vendor, i) => (
          <motion.div 
            key={vendor.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            onClick={() => navigate(`/vendors/${vendor.id}`)}
            className="bg-white border border-gray-200 p-8 rounded-[40px] space-y-6 cursor-pointer hover:border-purple-500/30 transition-all group relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 p-4 flex items-center gap-2">
               <button 
                 onClick={(e) => { e.stopPropagation(); setDeactivateId(vendor.id); }}
                 className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
               >
                 <Trash2 size={14} />
               </button>
               <span className="text-[10px] font-black text-gray-500 bg-gray-100 px-2 py-1 rounded-lg border border-gray-200 uppercase tracking-widest">
                 {vendor.vendor_code}
               </span>
            </div>

            <div className="space-y-4">
              <div className="w-16 h-16 rounded-3xl bg-purple-100 flex items-center justify-center text-[#6A1B9A] border-purple-100">
                <Building2 size={32} />
              </div>
              <div>
                <h3 className="text-xl font-black text-gray-900 group-hover:text-[#6A1B9A] transition-colors leading-tight">{vendor.name}</h3>
                <div className="flex items-center gap-1 mt-2">
                  {[...Array(5)].map((_, i) => (
                    <Star 
                      key={i} 
                      size={12} 
                      className={cn(
                        i < Math.floor(vendor.rating) ? "text-amber-500 fill-current" : "text-gray-200"
                      )} 
                    />
                  ))}
                  <span className="ml-2 text-[10px] font-black text-gray-500 uppercase">{vendor.rating} Rating</span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 py-4 border-y border-gray-100">
              <div className="space-y-1">
                 <p className="text-[10px] font-black text-gray-400 uppercase tracking-tighter">Active AMCs</p>
                 <div className="flex items-center gap-2">
                    <FileText size={14} className="text-[#6A1B9A]" />
                    <span className="text-sm font-black text-gray-900">{vendor.stats.active_amcs}</span>
                 </div>
              </div>
              <div className="space-y-1">
                 <p className="text-[10px] font-black text-gray-400 uppercase tracking-tighter">Assets Covered</p>
                 <div className="flex items-center gap-2">
                    <Package size={14} className="text-emerald-600" />
                    <span className="text-sm font-black text-gray-900">{vendor.stats.assets_covered}</span>
                 </div>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center gap-3 text-xs text-gray-500 font-medium">
                <User size={14} className="text-gray-400" />
                {vendor.contact_person}
              </div>
              <div className="flex items-center gap-3 text-xs text-gray-500 font-medium">
                <Phone size={14} className="text-gray-400" />
                {vendor.phone}
              </div>
            </div>

            <div className="pt-2">
               <button className="w-full py-3 bg-gray-50 text-gray-500 text-[10px] font-black uppercase tracking-widest rounded-2xl group-hover:bg-[#6A1B9A] group-hover:text-white transition-all flex items-center justify-center gap-2 border border-gray-200 group-hover:border-[#6A1B9A]">
                 View Partner Profile <ChevronRight size={14} />
               </button>
            </div>
          </motion.div>
        ))}
      </div>

      <ConfirmDialog open={deactivateId !== null} title="Deactivate Vendor" message="Are you sure you want to deactivate this vendor?" variant="danger" confirmLabel="Deactivate Vendor" onConfirm={() => deactivateMutation.mutate(deactivateId!)} onCancel={() => setDeactivateId(null)} isLoading={deactivateMutation.isPending} />
    </div>
  );
}
