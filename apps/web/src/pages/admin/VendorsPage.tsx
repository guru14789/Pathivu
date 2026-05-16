import { useState } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { 
  Truck, 
  Search, 
  Filter, 
  Plus, 
  Star, 
  Package, 
  FileText, 
  Phone, 
  Mail, 
  MapPin, 
  ChevronRight,
  TrendingUp,
  AlertCircle,
  Building2
} from 'lucide-react';
import { motion } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import { cn } from '../../lib/utils';
import axios from 'axios';

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

  // Technician Role Check
  if (user?.role === 'technician') {
    return <Navigate to="/dashboard" replace />;
  }

  // --- Queries ---
  const { data: vendors, isLoading } = useQuery({
    queryKey: ['vendors-list', search],
    queryFn: async () => {
      const res = await axios.get('/api/vendors');
      return res.data.data as Vendor[];
    }
  });

  const getRatingColor = (rating: number) => {
    if (rating >= 4) return 'text-emerald-500';
    if (rating >= 3) return 'text-amber-500';
    return 'text-red-500';
  };

  return (
    <div className="space-y-8 pb-32">
      {/* Header & Add Button */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-4xl font-black text-white tracking-tighter text-glow">Vendor Ecosystem</h1>
          <p className="text-slate-400 font-medium text-sm">Managing partners, service contracts & performance audits.</p>
        </div>
        <button className="bg-blue-600 hover:bg-blue-500 text-white px-8 py-4 rounded-2xl text-sm font-black shadow-xl shadow-blue-900/20 flex items-center gap-2 transition-all">
          <Plus size={20} /> Register New Vendor
        </button>
      </div>

      {/* Filter Bar */}
      <div className="bg-slate-900/50 border border-slate-800 p-6 rounded-3xl grid md:grid-cols-4 gap-6 items-center">
        <div className="relative md:col-span-2">
          <Search className="absolute left-3 top-3 text-slate-500" size={18} />
          <input 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by vendor name or code..." 
            className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2.5 pl-10 pr-4 text-xs text-white outline-none focus:border-blue-500" 
          />
        </div>
        <select className="bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white outline-none">
          <option>All Ratings</option>
          <option>4+ Stars (Premium)</option>
          <option>3+ Stars (Standard)</option>
        </select>
        <button className="flex items-center justify-center gap-2 bg-slate-800 text-white rounded-xl py-2.5 text-xs font-bold hover:bg-slate-700 transition-all border border-slate-700">
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
            className="bg-slate-900/50 border border-slate-800 p-8 rounded-[40px] space-y-6 cursor-pointer hover:border-blue-500/30 transition-all group relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 p-4">
               <span className="text-[10px] font-black text-slate-500 bg-slate-950 px-2 py-1 rounded-lg border border-slate-800 uppercase tracking-widest">
                 {vendor.vendor_code}
               </span>
            </div>

            <div className="space-y-4">
              <div className="w-16 h-16 rounded-3xl bg-blue-500/10 flex items-center justify-center text-blue-500 border border-blue-500/10">
                <Building2 size={32} />
              </div>
              <div>
                <h3 className="text-xl font-black text-white group-hover:text-blue-400 transition-colors leading-tight">{vendor.name}</h3>
                <div className="flex items-center gap-1 mt-2">
                  {[...Array(5)].map((_, i) => (
                    <Star 
                      key={i} 
                      size={12} 
                      className={cn(
                        i < Math.floor(vendor.rating) ? getRatingColor(vendor.rating) : "text-slate-800",
                        i < Math.floor(vendor.rating) && "fill-current"
                      )} 
                    />
                  ))}
                  <span className="ml-2 text-[10px] font-black text-slate-500 uppercase">{vendor.rating} Rating</span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 py-4 border-y border-slate-800/50">
              <div className="space-y-1">
                 <p className="text-[10px] font-black text-slate-500 uppercase tracking-tighter">Active AMCs</p>
                 <div className="flex items-center gap-2">
                    <FileText size={14} className="text-blue-500" />
                    <span className="text-sm font-black text-white">{vendor.stats.active_amcs}</span>
                 </div>
              </div>
              <div className="space-y-1">
                 <p className="text-[10px] font-black text-slate-500 uppercase tracking-tighter">Assets Covered</p>
                 <div className="flex items-center gap-2">
                    <Package size={14} className="text-emerald-500" />
                    <span className="text-sm font-black text-white">{vendor.stats.assets_covered}</span>
                 </div>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center gap-3 text-xs text-slate-400 font-medium">
                <User size={14} className="text-slate-600" />
                {vendor.contact_person}
              </div>
              <div className="flex items-center gap-3 text-xs text-slate-400 font-medium">
                <Phone size={14} className="text-slate-600" />
                {vendor.phone}
              </div>
            </div>

            <div className="pt-2">
               <button className="w-full py-3 bg-slate-950 text-slate-500 text-[10px] font-black uppercase tracking-widest rounded-2xl group-hover:bg-blue-600 group-hover:text-white transition-all flex items-center justify-center gap-2 border border-slate-800 group-hover:border-blue-600">
                 View Partner Profile <ChevronRight size={14} />
               </button>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
