import React from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  AlertCircle, 
  History, 
  Wrench, 
  Clock, 
  MapPin, 
  ShieldCheck, 
  Info,
  Calendar,
  Building2,
  ChevronRight,
  User,
  ExternalLink,
  CreditCard,
  Eye,
  LogOut,
  ArrowRight
} from 'lucide-react';
import { format } from 'date-fns';
import { useAuth } from '../../context/AuthContext';
import { cn } from '../../lib/utils';
import axios from 'axios';

export default function PublicScanPage() {
  const { assetTag } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  const { data: asset, isLoading, error } = useQuery({
    queryKey: ['scan', assetTag],
    queryFn: async () => {
      const res = await axios.get(`/api/qr/scan/${assetTag}`);
      return res.data.data;
    },
    retry: false
  });

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-[#0f172a] text-white">
        <motion.div 
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="mb-4"
        >
          <ShieldCheck className="w-12 h-12 text-blue-500" />
        </motion.div>
        <p className="text-slate-400 font-medium">Fetching asset identity...</p>
      </div>
    );
  }

  if (error || !asset) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-[#0f172a] p-6 text-center">
        <AlertCircle className="w-16 h-16 text-red-500 mb-4" />
        <h1 className="text-2xl font-bold text-white mb-2">Asset Not Found</h1>
        <p className="text-slate-400 mb-8">The QR code you scanned may be invalid or the asset has been decommissioned.</p>
        <button 
          onClick={() => navigate('/login')}
          className="px-8 py-3 bg-blue-600 text-white rounded-xl font-bold"
        >
          Return to Portal
        </button>
      </div>
    );
  }

  const role = user?.role || 'public';
  const isAdmin = ['super_admin', 'branch_admin'].includes(role);
  const isSupervisor = isAdmin || role === 'supervisor';
  const isAuditor = role === 'auditor' || role === 'super_admin';

  return (
    <div className="min-h-screen bg-[#0f172a] text-slate-200 pb-24">
      {/* 1. Asset Identity Block */}
      <header className="relative bg-slate-900/50 backdrop-blur-xl border-b border-slate-800 px-6 pt-12 pb-8 overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-blue-600/10 rounded-full blur-3xl" />
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative z-10 flex flex-col items-center text-center space-y-4"
        >
          <div className="w-20 h-20 bg-slate-800 rounded-2xl flex items-center justify-center shadow-inner border border-slate-700">
            <Wrench className="w-10 h-10 text-blue-500" />
          </div>
          <div>
            <div className="flex items-center justify-center gap-2 mb-1">
              <span className="text-xs font-bold tracking-widest text-blue-400 uppercase bg-blue-400/10 px-2 py-0.5 rounded">
                {asset.asset_tag}
              </span>
            </div>
            <h1 className="text-2xl font-bold text-white tracking-tight">{asset.name}</h1>
            <p className="text-slate-400 text-sm mt-1">{asset.category || 'General Equipment'}</p>
          </div>
        </motion.div>
      </header>

      <main className="px-6 py-8 space-y-8 max-w-lg mx-auto">
        
        {/* 2. Condition Badge */}
        <section className="flex items-center justify-between bg-slate-900/40 p-4 rounded-2xl border border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-slate-800 rounded-lg">
              <Info className="w-5 h-5 text-slate-400" />
            </div>
            <span className="text-sm font-medium text-slate-400 uppercase tracking-wider">Current Condition</span>
          </div>
          <span className={cn(
            "px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-tighter shadow-lg",
            asset.condition === 'good' ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30" :
            asset.condition === 'fair' ? "bg-amber-500/20 text-amber-400 border border-amber-500/30" :
            asset.condition === 'poor' ? "bg-orange-500/20 text-orange-400 border border-orange-500/30" :
            "bg-red-500/20 text-red-400 border border-red-500/30"
          )}>
            {asset.condition || 'Unknown'}
          </span>
        </section>

        {/* 3. Location Breadcrumb */}
        <section className="space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-widest text-slate-500 ml-1">Asset Location</h3>
          <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-5 space-y-4">
            <div className="flex items-start gap-4">
              <div className="p-2 bg-blue-500/10 rounded-lg mt-1">
                <Building2 className="w-5 h-5 text-blue-500" />
              </div>
              <div className="flex-1 space-y-1">
                <p className="text-xs text-slate-500 font-medium">Placement</p>
                <div className="flex flex-wrap items-center gap-1 text-sm font-semibold text-white leading-tight">
                  <span>BeWell Main</span>
                  <ChevronRight size={14} className="text-slate-600" />
                  <span className="text-slate-400 font-normal">{asset.location?.split(' - ')[0] || 'Block A'}</span>
                  <ChevronRight size={14} className="text-slate-600" />
                  <span className="text-slate-400 font-normal">{asset.location?.split(' - ')[1] || 'Floor 1'}</span>
                </div>
                <div className="mt-2 flex items-center gap-2 text-xs text-blue-400 bg-blue-400/5 px-2 py-1 rounded w-fit">
                  <MapPin size={12} />
                  {asset.location?.split(' - ')[2] || 'Emergency Ward'}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 4. Last Service Date */}
        <section className="bg-gradient-to-br from-slate-900/60 to-slate-900/40 border border-slate-800 rounded-2xl p-5 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="p-2 bg-purple-500/10 rounded-lg">
              <Calendar className="w-5 h-5 text-purple-500" />
            </div>
            <div>
              <p className="text-xs text-slate-500 font-medium uppercase tracking-widest">Last Maintenance</p>
              <p className="text-lg font-bold text-white">{asset.last_service_date || 'Oct 12, 2024'}</p>
            </div>
          </div>
          <History className="w-5 h-5 text-slate-700" />
        </section>

        {/* 10. Login Prompt (Unauthenticated) */}
        {!user && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-blue-600 border border-blue-500 rounded-2xl p-6 shadow-xl shadow-blue-600/20"
          >
            <div className="flex items-start gap-4">
              <div className="p-3 bg-white/10 rounded-xl">
                <User className="w-6 h-6 text-white" />
              </div>
              <div className="space-y-3">
                <h4 className="text-white font-bold leading-tight">Gated Access</h4>
                <p className="text-blue-100 text-sm">Log in as a hospital staff member to see detailed history and take maintenance actions.</p>
                <Link 
                  to="/login"
                  className="inline-flex items-center gap-2 bg-white text-blue-600 px-4 py-2 rounded-lg text-sm font-bold shadow-lg"
                >
                  Log In Now <ArrowRight size={16} />
                </Link>
              </div>
            </div>
          </motion.div>
        )}

        {/* Gated Sections */}
        {user && (
          <AnimatePresence>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="space-y-8"
            >
              {/* 5. Service Log Timeline (Supervisor+) */}
              {isSupervisor && (
                <section className="space-y-3">
                  <h3 className="text-xs font-bold uppercase tracking-widest text-slate-500 ml-1">Service History</h3>
                  <div className="bg-slate-900/40 border border-slate-800 rounded-2xl overflow-hidden">
                    {[1, 2, 3].map((item, idx) => (
                      <div key={item} className={cn(
                        "p-4 flex items-center justify-between",
                        idx !== 2 && "border-b border-slate-800"
                      )}>
                        <div className="flex gap-3">
                          <div className="w-1 bg-blue-500 rounded-full my-1" />
                          <div>
                            <p className="text-sm font-bold text-white">Periodic Calibration</p>
                            <p className="text-[10px] text-slate-500 uppercase">Oct 12, 2024 • Tech-ID: BEW-902</p>
                          </div>
                        </div>
                        <span className="text-[10px] font-black uppercase text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded">Verified</span>
                      </div>
                    ))}
                    <button className="w-full p-4 text-xs font-bold text-blue-400 bg-slate-800/30 hover:bg-slate-800/50 transition-colors">
                      View Full Maintenance Log
                    </button>
                  </div>
                </section>
              )}

              {/* 6. Vendor Section (Branch Admin+) */}
              {isAdmin && (
                <section className="space-y-3">
                  <h3 className="text-xs font-bold uppercase tracking-widest text-slate-500 ml-1">Vendor & Support</h3>
                  <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-5">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-slate-800 rounded-lg flex items-center justify-center border border-slate-700">
                          <Building2 size={20} className="text-slate-400" />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-white">MedTech Solutions Inc.</p>
                          <p className="text-xs text-emerald-500 font-medium">AMC Active (Premium)</p>
                        </div>
                      </div>
                      <button className="p-2 bg-blue-500/10 text-blue-500 rounded-lg">
                        <ExternalLink size={18} />
                      </button>
                    </div>
                    <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-800">
                      <div className="space-y-1">
                        <p className="text-[10px] text-slate-500 uppercase font-bold">Contact Person</p>
                        <p className="text-xs text-white">Rajesh Kumar</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-[10px] text-slate-500 uppercase font-bold">Priority Line</p>
                        <p className="text-xs text-blue-400">+91 98765 43210</p>
                      </div>
                    </div>
                  </div>
                </section>
              )}

              {/* 7. Financial Section (Admin+) */}
              {isAdmin && (
                <section className="space-y-3">
                  <h3 className="text-xs font-bold uppercase tracking-widest text-slate-500 ml-1">Financial Identity</h3>
                  <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-5 space-y-5">
                    <div className="flex items-center gap-4">
                      <div className="p-3 bg-amber-500/10 rounded-xl">
                        <CreditCard className="w-6 h-6 text-amber-500" />
                      </div>
                      <div>
                        <p className="text-xs text-slate-500 font-medium uppercase tracking-widest leading-none mb-1">Purchase Value</p>
                        <p className="text-xl font-black text-white">₹ 1,45,000</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-6 pt-4 border-t border-slate-800">
                      <div className="space-y-1">
                        <p className="text-[10px] text-slate-500 uppercase font-bold">Warranty Expiry</p>
                        <p className="text-xs text-white">Dec 2026</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-[10px] text-slate-500 uppercase font-bold">Depreciated Value</p>
                        <p className="text-xs text-red-400">₹ 82,400</p>
                      </div>
                    </div>
                  </div>
                </section>
              )}

              {/* 8. All Scan History (Auditor + Super Admin) */}
              {isAuditor && (
                <section className="space-y-3">
                  <h3 className="text-xs font-bold uppercase tracking-widest text-slate-500 ml-1">Audit Trail (Recent Scans)</h3>
                  <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-4 space-y-4">
                    {[1, 2].map((scan) => (
                      <div key={scan} className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-slate-800 rounded-full flex items-center justify-center text-xs text-slate-400 border border-slate-700">
                          {scan}
                        </div>
                        <div className="flex-1">
                          <div className="flex justify-between text-xs">
                            <span className="text-white font-medium">Suresh Kumar (Admin)</span>
                            <span className="text-slate-500">2h ago</span>
                          </div>
                          <p className="text-[10px] text-slate-600">IP: 192.168.1.104 • Device: iPhone 15 Pro</p>
                        </div>
                      </div>
                    ))}
                    <button className="w-full pt-2 text-xs font-bold text-slate-400 border-t border-slate-800 flex items-center justify-center gap-2">
                      <Eye size={14} /> See Detailed Scan Analytics
                    </button>
                  </div>
                </section>
              )}
            </motion.div>
          </AnimatePresence>
        )}
      </main>

      {/* 9. Action Buttons */}
      <div className="fixed bottom-0 left-0 right-0 bg-slate-900/80 backdrop-blur-2xl border-t border-slate-800 p-6 flex gap-4 z-50">
        <button 
          onClick={() => navigate(`/fault/${assetTag}`)}
          className="flex-1 bg-red-600 hover:bg-red-500 active:scale-95 text-white font-bold py-4 rounded-2xl transition-all shadow-lg shadow-red-900/20 flex items-center justify-center gap-3"
        >
          <AlertCircle size={20} />
          Report Fault
        </button>
        {user && ['technician', 'supervisor', 'branch_admin', 'super_admin'].includes(user.role) && (
          <button className="w-16 bg-slate-800 hover:bg-slate-700 text-white rounded-2xl flex items-center justify-center border border-slate-700 transition-all">
            <Clock size={20} />
          </button>
        )}
        {user && ['branch_admin', 'super_admin'].includes(user.role) && (
          <button className="w-16 bg-slate-800 hover:bg-slate-700 text-white rounded-2xl flex items-center justify-center border border-slate-700 transition-all">
            <ShieldCheck size={20} />
          </button>
        )}
      </div>

      {/* Logout button for staff */}
      {user && (
        <div className="fixed top-4 right-4 z-50">
          <button 
            onClick={() => useAuth().logout()}
            className="w-10 h-10 bg-slate-900/80 backdrop-blur-lg border border-slate-800 rounded-full flex items-center justify-center text-red-500 shadow-xl"
          >
            <LogOut size={18} />
          </button>
        </div>
      )}
    </div>
  );
}
