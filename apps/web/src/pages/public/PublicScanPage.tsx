
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
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50">
        <motion.div 
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="mb-4"
        >
          <ShieldCheck className="w-12 h-12 text-[#6A1B9A]" />
        </motion.div>
        <p className="text-gray-500 font-medium">Fetching asset identity...</p>
      </div>
    );
  }

  if (error || !asset) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 p-6 text-center">
        <AlertCircle className="w-16 h-16 text-red-500 mb-4" />
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Asset Not Found</h1>
        <p className="text-gray-500 mb-8">The QR code you scanned may be invalid or the asset has been decommissioned.</p>
        <button 
          onClick={() => navigate('/login')}
          className="px-8 py-3 bg-[#6A1B9A] text-white rounded-xl font-bold"
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
    <div className="min-h-screen bg-gray-50 text-gray-700 pb-24">
      {/* 1. Asset Identity Block */}
      <header className="bg-white border-b border-gray-200 px-6 pt-12 pb-8 overflow-hidden">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col items-center text-center space-y-4"
        >
          <div className="w-20 h-20 bg-gray-100 border-gray-200 rounded-2xl flex items-center justify-center border">
            <Wrench className="w-10 h-10 text-[#6A1B9A]" />
          </div>
          <div>
            <div className="flex items-center justify-center gap-2 mb-1">
              <span className="text-xs font-bold tracking-widest bg-purple-100 text-[#6A1B9A] uppercase px-2 py-0.5 rounded">
                {asset.asset_tag}
              </span>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">{asset.name}</h1>
            <p className="text-gray-500 text-sm mt-1">{asset.category || 'General Equipment'}</p>
          </div>
        </motion.div>
      </header>

      <main className="px-6 py-8 space-y-8 max-w-lg mx-auto">
        
        {/* 2. Condition Badge */}
        <section className="flex items-center justify-between bg-white p-4 rounded-2xl border border-gray-200">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gray-100 rounded-lg">
              <Info className="w-5 h-5 text-gray-400" />
            </div>
            <span className="text-sm font-medium text-gray-500 uppercase tracking-wider">Current Condition</span>
          </div>
          <span className={cn(
            "px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-tighter",
            asset.condition === 'good' ? "bg-emerald-100 text-emerald-700 border border-emerald-200" :
            asset.condition === 'fair' ? "bg-amber-100 text-amber-700 border border-amber-200" :
            asset.condition === 'poor' ? "bg-orange-100 text-orange-700 border border-orange-200" :
            "bg-red-100 text-red-700 border border-red-200"
          )}>
            {asset.condition || 'Unknown'}
          </span>
        </section>

        {/* 3. Location Breadcrumb */}
        <section className="space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-widest text-gray-500 ml-1">Asset Location</h3>
          <div className="bg-white border border-gray-200 rounded-2xl p-5 space-y-4">
            <div className="flex items-start gap-4">
              <div className="p-2 bg-purple-100 rounded-lg mt-1">
                <Building2 className="w-5 h-5 text-[#6A1B9A]" />
              </div>
              <div className="flex-1 space-y-1">
                <p className="text-xs text-gray-500 font-medium">Placement</p>
                <div className="flex flex-wrap items-center gap-1 text-sm font-semibold text-gray-900 leading-tight">
                  <span>BeWell Main</span>
                  <ChevronRight size={14} className="text-gray-400" />
                  <span className="text-gray-500 font-normal">{asset.location?.split(' - ')[0] || 'Block A'}</span>
                  <ChevronRight size={14} className="text-gray-400" />
                  <span className="text-gray-500 font-normal">{asset.location?.split(' - ')[1] || 'Floor 1'}</span>
                </div>
                <div className="mt-2 flex items-center gap-2 text-xs bg-purple-50 text-[#6A1B9A] px-2 py-1 rounded w-fit">
                  <MapPin size={12} />
                  {asset.location?.split(' - ')[2] || 'Emergency Ward'}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 4. Last Service Date */}
        <section className="bg-white border border-gray-200 rounded-2xl p-5 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Calendar className="w-5 h-5 text-[#6A1B9A]" />
            </div>
            <div>
              <p className="text-xs text-gray-500 font-medium uppercase tracking-widest">Last Maintenance</p>
              <p className="text-lg font-bold text-gray-900">{asset.last_service_date || 'Oct 12, 2024'}</p>
            </div>
          </div>
          <History className="w-5 h-5 text-gray-300" />
        </section>

        {/* 10. Login Prompt (Unauthenticated) */}
        {!user && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-[#6A1B9A] border-[#6A1B9A] rounded-2xl p-6"
          >
            <div className="flex items-start gap-4">
              <div className="p-3 bg-white/10 rounded-xl">
                <User className="w-6 h-6 text-white" />
              </div>
              <div className="space-y-3">
                <h4 className="text-white font-bold leading-tight">Gated Access</h4>
                <p className="text-purple-100 text-sm">Log in as a hospital staff member to see detailed history and take maintenance actions.</p>
                <Link 
                  to="/login"
                  className="inline-flex items-center gap-2 bg-white text-[#6A1B9A] px-4 py-2 rounded-lg text-sm font-bold shadow-lg"
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
                  <h3 className="text-xs font-bold uppercase tracking-widest text-gray-500 ml-1">Service History</h3>
                  <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
                    {[1, 2, 3].map((item, idx) => (
                      <div key={item} className={cn(
                        "p-4 flex items-center justify-between",
                        idx !== 2 && "border-b border-gray-100"
                      )}>
                        <div className="flex gap-3">
                          <div className="w-1 bg-[#6A1B9A] rounded-full my-1" />
                          <div>
                            <p className="text-sm font-bold text-gray-900">Periodic Calibration</p>
                            <p className="text-[10px] text-gray-500 uppercase">Oct 12, 2024 • Tech-ID: BEW-902</p>
                          </div>
                        </div>
                        <span className="text-[10px] font-black uppercase bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded">Verified</span>
                      </div>
                    ))}
                    <button className="w-full p-4 text-xs font-bold bg-gray-50 text-[#6A1B9A] hover:bg-gray-100 transition-colors">
                      View Full Maintenance Log
                    </button>
                  </div>
                </section>
              )}

              {/* 6. Vendor Section (Branch Admin+) */}
              {isAdmin && (
                <section className="space-y-3">
                  <h3 className="text-xs font-bold uppercase tracking-widest text-gray-500 ml-1">Vendor & Support</h3>
                  <div className="bg-white border border-gray-200 rounded-2xl p-5">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center border border-gray-200">
                          <Building2 size={20} className="text-gray-400" />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-gray-900">MedTech Solutions Inc.</p>
                          <p className="text-xs text-emerald-600 font-medium">AMC Active (Premium)</p>
                        </div>
                      </div>
                      <button className="p-2 bg-purple-100 text-[#6A1B9A] rounded-lg">
                        <ExternalLink size={18} />
                      </button>
                    </div>
                    <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-200">
                      <div className="space-y-1">
                        <p className="text-[10px] text-gray-400 uppercase font-bold">Contact Person</p>
                        <p className="text-xs text-gray-900">Rajesh Kumar</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-[10px] text-gray-400 uppercase font-bold">Priority Line</p>
                        <p className="text-xs text-[#6A1B9A]">+91 98765 43210</p>
                      </div>
                    </div>
                  </div>
                </section>
              )}

              {/* 7. Financial Section (Admin+) */}
              {isAdmin && (
                <section className="space-y-3">
                  <h3 className="text-xs font-bold uppercase tracking-widest text-gray-500 ml-1">Financial Identity</h3>
                  <div className="bg-white border border-gray-200 rounded-2xl p-5 space-y-5">
                    <div className="flex items-center gap-4">
                      <div className="p-3 bg-amber-100 rounded-xl">
                        <CreditCard className="w-6 h-6 text-amber-600" />
                      </div>
                      <div>
                        <p className="text-xs text-gray-400 font-medium uppercase tracking-widest leading-none mb-1">Purchase Value</p>
                        <p className="text-xl font-black text-gray-900">₹ 1,45,000</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-6 pt-4 border-t border-gray-200">
                      <div className="space-y-1">
                        <p className="text-[10px] text-gray-400 uppercase font-bold">Warranty Expiry</p>
                        <p className="text-xs text-gray-900">Dec 2026</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-[10px] text-gray-400 uppercase font-bold">Depreciated Value</p>
                        <p className="text-xs text-red-600">₹ 82,400</p>
                      </div>
                    </div>
                  </div>
                </section>
              )}

              {/* 8. All Scan History (Auditor + Super Admin) */}
              {isAuditor && (
                <section className="space-y-3">
                  <h3 className="text-xs font-bold uppercase tracking-widest text-gray-500 ml-1">Audit Trail (Recent Scans)</h3>
                  <div className="bg-white border border-gray-200 rounded-2xl p-4 space-y-4">
                    {[1, 2].map((scan) => (
                      <div key={scan} className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center text-xs text-gray-500 border border-gray-200">
                          {scan}
                        </div>
                        <div className="flex-1">
                          <div className="flex justify-between text-xs">
                            <span className="text-gray-900 font-medium">Suresh Kumar (Admin)</span>
                            <span className="text-gray-400">2h ago</span>
                          </div>
                          <p className="text-[10px] text-gray-400">IP: 192.168.1.104 • Device: iPhone 15 Pro</p>
                        </div>
                      </div>
                    ))}
                    <button className="w-full pt-2 text-xs font-bold text-gray-500 border-t border-gray-200 flex items-center justify-center gap-2">
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
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-6 flex gap-4 z-50">
        <button 
          onClick={() => navigate(`/fault/${assetTag}`)}
          className="flex-1 bg-red-600 hover:bg-red-500 active:scale-95 text-white font-bold py-4 rounded-2xl transition-all shadow-lg shadow-red-900/20 flex items-center justify-center gap-3"
        >
          <AlertCircle size={20} />
          Report Fault
        </button>
        {user && ['technician', 'supervisor', 'branch_admin', 'super_admin'].includes(user.role) && (
          <button className="w-16 bg-gray-100 text-gray-700 rounded-2xl flex items-center justify-center border border-gray-200 hover:bg-gray-200 transition-all">
            <Clock size={20} />
          </button>
        )}
        {user && ['branch_admin', 'super_admin'].includes(user.role) && (
          <button className="w-16 bg-gray-100 text-gray-700 rounded-2xl flex items-center justify-center border border-gray-200 hover:bg-gray-200 transition-all">
            <ShieldCheck size={20} />
          </button>
        )}
      </div>

      {/* Logout button for staff */}
      {user && (
        <div className="fixed top-4 right-4 z-50">
          <button 
            onClick={() => useAuth().logout()}
            className="w-10 h-10 bg-white/80 border border-gray-200 rounded-full flex items-center justify-center text-red-600 shadow-sm"
          >
            <LogOut size={18} />
          </button>
        </div>
      )}
    </div>
  );
}
