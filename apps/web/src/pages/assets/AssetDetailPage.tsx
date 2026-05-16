import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { 
  ArrowLeft, 
  Settings, 
  QrCode, 
  AlertCircle, 
  UserPlus, 
  Trash2, 
  Printer, 
  Download, 
  RefreshCcw,
  DollarSign,
  ShieldCheck,
  MapPin,
  Building2,
  Wrench,
  FileText,
  History,
  TrendingUp,
  Activity,
  ChevronRight,
  BadgeAlert
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { format } from 'date-fns';
import { useAuth } from '../../context/AuthContext';
import { cn } from '../../lib/utils';
import axios from 'axios';

// --- Sub-components ---

const StatBox = ({ label, value, icon: Icon, color, subValue }: any) => (
  <div className="bg-slate-900/50 border border-slate-800 p-5 rounded-3xl space-y-2">
    <div className="flex items-center gap-2 text-[10px] font-black text-slate-500 uppercase tracking-widest">
      <Icon size={14} className={color} /> {label}
    </div>
    <div className="text-xl font-black text-white">{value}</div>
    {subValue && <p className="text-[10px] text-slate-400 font-medium">{subValue}</p>}
  </div>
);

const TabButton = ({ active, label, icon: Icon, onClick }: any) => (
  <button 
    onClick={onClick}
    className={cn(
      "flex items-center gap-2 px-6 py-4 text-sm font-bold border-b-2 transition-all whitespace-nowrap",
      active ? "border-blue-500 text-blue-500 bg-blue-500/5" : "border-transparent text-slate-500 hover:text-slate-300"
    )}
  >
    <Icon size={16} /> {label}
  </button>
);

// --- Main Page ---

export default function AssetDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('service');

  // Role Helpers
  const role = user?.role || 'public';
  const isAdmin = ['super_admin', 'branch_admin'].includes(role);
  const isAuditor = role === 'auditor';
  const isSuperAdmin = role === 'super_admin';

  // --- Query ---
  const { data: asset, isLoading, error } = useQuery({
    queryKey: ['asset', id],
    queryFn: async () => {
      const res = await axios.get(`/api/assets/${id}`);
      return res.data.data;
    }
  });

  if (isLoading) return <div className="flex items-center justify-center min-h-screen text-slate-500">Retrieving asset profile...</div>;
  if (error || !asset) return <div className="flex flex-col items-center justify-center min-h-screen text-red-500">Asset not found.</div>;

  return (
    <div className="space-y-8 pb-32">
      {/* 1. Header & Breadcrumb */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div className="flex items-start gap-5">
          <button 
            onClick={() => navigate('/assets')}
            className="mt-1 p-2 bg-slate-900 border border-slate-800 rounded-xl text-slate-400 hover:text-white transition-all"
          >
            <ArrowLeft size={20} />
          </button>
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <span className="px-3 py-0.5 bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded-full text-[10px] font-black uppercase tracking-widest">
                {asset.asset_tag}
              </span>
              {asset.is_critical && (
                <span className="px-3 py-0.5 bg-red-500/10 text-red-500 border border-red-500/20 rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-1">
                  <BadgeAlert size={10} /> Critical Asset
                </span>
              )}
            </div>
            <h1 className="text-4xl font-black text-white tracking-tighter leading-none">{asset.name}</h1>
            <p className="text-slate-400 font-medium">{asset.category} • {asset.manufacturer} {asset.model}</p>
          </div>
        </div>

        {/* Action Bar */}
        <div className="flex flex-wrap items-center gap-3">
          <button className="flex-1 lg:flex-none bg-red-600 hover:bg-red-500 text-white px-5 py-3 rounded-2xl text-sm font-bold shadow-lg shadow-red-900/20 flex items-center justify-center gap-2 transition-all">
            <AlertCircle size={18} /> Log Fault
          </button>
          {isAdmin && (
            <>
              <button className="p-3 bg-slate-800 text-slate-300 rounded-2xl border border-slate-700 hover:bg-slate-700 transition-all">
                <Settings size={18} />
              </button>
              <button className="p-3 bg-slate-800 text-slate-300 rounded-2xl border border-slate-700 hover:bg-slate-700 transition-all">
                <UserPlus size={18} />
              </button>
              {isSuperAdmin && (
                <button className="p-3 bg-red-500/10 text-red-500 rounded-2xl border border-red-500/20 hover:bg-red-500/20 transition-all">
                  <Trash2 size={18} />
                </button>
              )}
            </>
          )}
        </div>
      </div>

      {/* 2. Quick Stats Row */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <StatBox 
          label="Initial Cost" 
          value={`₹ ${asset.purchase_cost.toLocaleString()}`} 
          icon={DollarSign} 
          color="text-emerald-500"
          subValue={`Purchased: ${format(new Date(asset.purchase_date), 'dd MMM yyyy')}`}
        />
        <StatBox 
          label="Warranty Status" 
          value={format(new Date(asset.warranty_expiry), 'dd MMM yyyy')} 
          icon={ShieldCheck} 
          color="text-blue-500"
          subValue="Coverage: On-site Extended"
        />
        <StatBox 
          label="Maintenance TCO" 
          value="₹ 12,450" 
          icon={Wrench} 
          color="text-amber-500"
          subValue="6 Total Logged Entries"
        />
        <StatBox 
          label="Asset Lifespan" 
          value="4.2 Years" 
          icon={TrendingUp} 
          color="text-purple-500"
          subValue="Est. Useful Life: 10 Years"
        />
      </div>

      <div className="grid gap-8 lg:grid-cols-12">
        {/* Left Column: Location & QR */}
        <div className="lg:col-span-4 space-y-8">
          {/* 3. Location Card */}
          <div className="bg-slate-900/50 border border-slate-800 rounded-3xl p-6 space-y-5">
            <h3 className="text-sm font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
              <MapPin size={16} className="text-blue-500" /> Live Deployment
            </h3>
            <div className="space-y-4">
              <div className="flex items-start gap-4">
                <div className="p-3 bg-blue-500/10 rounded-2xl text-blue-500">
                  <Building2 size={24} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-slate-500 font-bold uppercase">Location Registry</p>
                  <p className="text-lg font-bold text-white truncate">{asset.location || 'Block A - Floor 1 - Emergency Ward'}</p>
                </div>
              </div>
              <div className="pt-4 border-t border-slate-800">
                <p className="text-xs text-slate-500 font-bold uppercase mb-3">Current Assignment</p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-xs font-black text-blue-500">
                    JD
                  </div>
                  <div>
                    <p className="text-sm font-bold text-white">John Doe</p>
                    <p className="text-[10px] text-slate-500 uppercase">Supervisor • Assigned Since Jan 2024</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 4. Active QR Code */}
          <div className="bg-slate-900/50 border border-slate-800 rounded-3xl p-6 space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                <QrCode size={16} className="text-emerald-500" /> Digital Identity
              </h3>
              <span className="text-[10px] font-bold text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded uppercase">QR Active</span>
            </div>
            <div className="flex flex-col items-center space-y-4">
              <div className="p-4 bg-white rounded-3xl shadow-xl shadow-blue-500/10">
                <img 
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=ASSET-${asset.asset_tag}`} 
                  alt="Asset QR" 
                  className="w-48 h-48"
                />
              </div>
              <p className="text-[10px] text-slate-500 font-medium text-center uppercase tracking-widest">
                Last Generated: 12 Oct 2024 • ID: {asset.qr_id || '9021-X-4'}
              </p>
            </div>
            <div className="grid grid-cols-2 gap-3 pt-2">
              <button className="bg-slate-800 hover:bg-slate-700 text-white py-3 rounded-2xl text-xs font-bold transition-all flex items-center justify-center gap-2 border border-slate-700">
                <Download size={14} /> PNG
              </button>
              <button className="bg-slate-800 hover:bg-slate-700 text-white py-3 rounded-2xl text-xs font-bold transition-all flex items-center justify-center gap-2 border border-slate-700">
                <Printer size={14} /> Print
              </button>
              {isAdmin && (
                <button className="col-span-2 bg-blue-600/10 hover:bg-blue-600/20 text-blue-500 py-3 rounded-2xl text-xs font-bold transition-all flex items-center justify-center gap-2 border border-blue-500/20">
                  <RefreshCcw size={14} /> Regenerate Identity
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Tabs and Details */}
        <div className="lg:col-span-8 bg-slate-900/30 border border-slate-800 rounded-3xl overflow-hidden backdrop-blur-md">
          {/* Navigation Tabs */}
          <div className="flex overflow-x-auto border-b border-slate-800 no-scrollbar">
            <TabButton 
              active={activeTab === 'service'} 
              label="Service Log" 
              icon={Wrench} 
              onClick={() => setActiveTab('service')} 
            />
            <TabButton 
              active={activeTab === 'faults'} 
              label="Fault Reports" 
              icon={AlertCircle} 
              onClick={() => setActiveTab('faults')} 
            />
            <TabButton 
              active={activeTab === 'compliance'} 
              label="Compliance" 
              icon={ShieldCheck} 
              onClick={() => setActiveTab('compliance')} 
            />
            {isAdmin && (
              <TabButton 
                active={activeTab === 'vendor'} 
                label="Vendor & AMC" 
                icon={Building2} 
                onClick={() => setActiveTab('vendor')} 
              />
            )}
            {(isAdmin || isAuditor) && (
              <>
                <TabButton 
                  active={activeTab === 'financial'} 
                  label="Financials" 
                  icon={DollarSign} 
                  onClick={() => setActiveTab('financial')} 
                />
                <TabButton 
                  active={activeTab === 'scans'} 
                  label="Scan History" 
                  icon={Activity} 
                  onClick={() => setActiveTab('scans')} 
                />
              </>
            )}
            {(isSuperAdmin || isAuditor) && (
              <TabButton 
                active={activeTab === 'audit'} 
                label="Audit Trail" 
                icon={History} 
                onClick={() => setActiveTab('audit')} 
              />
            )}
          </div>

          <div className="p-8 min-h-[400px]">
            <AnimatePresence mode="wait">
              {activeTab === 'service' && (
                <motion.div 
                  key="service"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="space-y-6"
                >
                  <div className="flex items-center justify-between">
                    <h4 className="text-lg font-black text-white">Maintenance History</h4>
                    <button className="text-xs font-bold text-blue-500 flex items-center gap-1">
                      New Log Entry <ChevronRight size={14} />
                    </button>
                  </div>
                  <div className="relative before:absolute before:left-[11px] before:top-2 before:bottom-2 before:w-px before:bg-slate-800 space-y-8">
                    {[1, 2, 3].map((entry) => (
                      <div key={entry} className="flex gap-6 relative">
                        <div className="w-6 h-6 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center z-10 shrink-0">
                          <div className="w-2 h-2 rounded-full bg-blue-500" />
                        </div>
                        <div className="bg-slate-900/50 border border-slate-800 p-5 rounded-2xl flex-1 space-y-3">
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                            <h5 className="font-bold text-white">Periodic PPM Calibration</h5>
                            <span className="text-[10px] font-black uppercase text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded w-fit">Completed</span>
                          </div>
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-2 border-t border-slate-800/50">
                            <div className="space-y-1">
                              <p className="text-[10px] text-slate-500 uppercase font-bold">Technician</p>
                              <p className="text-xs text-white">Suresh Kumar</p>
                            </div>
                            <div className="space-y-1">
                              <p className="text-[10px] text-slate-500 uppercase font-bold">Service Date</p>
                              <p className="text-xs text-white">12 Oct 2024</p>
                            </div>
                            <div className="space-y-1">
                              <p className="text-[10px] text-slate-500 uppercase font-bold">Cost</p>
                              <p className="text-xs text-white">₹ 4,500</p>
                            </div>
                            <div className="space-y-1">
                              <p className="text-[10px] text-slate-500 uppercase font-bold">Downtime</p>
                              <p className="text-xs text-red-400">2.5 Hours</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}

              {activeTab === 'faults' && (
                <motion.div 
                  key="faults"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-6"
                >
                  <h4 className="text-lg font-black text-white">Incident Registry</h4>
                  <div className="bg-slate-900/50 border border-slate-800 rounded-2xl overflow-hidden">
                    {[1].map((fault) => (
                      <div key={fault} className="p-5 flex items-center justify-between bg-red-500/5">
                        <div className="flex items-center gap-4">
                          <div className="p-3 bg-red-500/10 text-red-500 rounded-xl">
                            <AlertCircle size={20} />
                          </div>
                          <div>
                            <p className="text-sm font-bold text-white">Software Glitch: Interface Lag</p>
                            <p className="text-[10px] text-slate-500 uppercase font-bold mt-1">Reported by Rajesh K • 2 Days Ago • High Severity</p>
                          </div>
                        </div>
                        <span className="text-[10px] font-black uppercase text-red-500 border border-red-500/30 px-3 py-1 rounded-full">Unresolved</span>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}

              {activeTab === 'compliance' && (
                <motion.div key="compliance" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
                  <h4 className="text-lg font-black text-white">Safety & Compliance Certificates</h4>
                  <div className="grid gap-4">
                    {[
                      { name: 'NABH Calibration Cert', expiry: 'Jan 2026', status: 'valid' },
                      { name: 'Electrical Safety Audit', expiry: 'Dec 2024', status: 'expiring' },
                    ].map((cert) => (
                      <div key={cert.name} className="p-4 bg-slate-900 border border-slate-800 rounded-2xl flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="p-2 bg-slate-800 text-slate-400 rounded-lg">
                            <FileText size={20} />
                          </div>
                          <div>
                            <p className="text-sm font-bold text-white">{cert.name}</p>
                            <p className="text-xs text-slate-500">Expires: {cert.expiry}</p>
                          </div>
                        </div>
                        <button className="text-xs font-bold text-blue-500">View File</button>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}

              {/* Roles: Financial, Scan, Audit - Additional complex views */}
              {activeTab === 'financial' && isAdmin && (
                <motion.div key="financial" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8">
                  <div className="grid grid-cols-2 gap-6">
                    <div className="p-5 bg-blue-500/5 border border-blue-500/10 rounded-2xl">
                      <p className="text-xs text-slate-500 font-bold uppercase tracking-widest mb-1">Current Book Value</p>
                      <p className="text-2xl font-black text-white">₹ 84,300</p>
                      <p className="text-xs text-slate-400 mt-2">Depreciation Rate: 15% Straight Line</p>
                    </div>
                    <div className="p-5 bg-amber-500/5 border border-amber-500/10 rounded-2xl">
                      <p className="text-xs text-slate-500 font-bold uppercase tracking-widest mb-1">Total Ownership Cost</p>
                      <p className="text-2xl font-black text-white">₹ 1,57,450</p>
                      <p className="text-xs text-slate-400 mt-2">Purchase + Cumulative Maintenance</p>
                    </div>
                  </div>
                </motion.div>
              )}

              {activeTab === 'audit' && (isSuperAdmin || isAuditor) && (
                <motion.div key="audit" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
                   <h4 className="text-lg font-black text-white">Mutation History</h4>
                   <div className="space-y-4">
                     {[1, 2].map((i) => (
                       <div key={i} className="p-4 bg-slate-900 border-l-4 border-l-blue-500 rounded-r-2xl">
                         <div className="flex justify-between items-start mb-2">
                            <p className="text-xs font-bold text-white">Status changed: maintenance → active</p>
                            <span className="text-[9px] text-slate-500 font-bold uppercase">2h ago</span>
                         </div>
                         <p className="text-[10px] text-slate-500 uppercase">Actor: Suresh Kumar (Admin) • IP: 192.168.1.1</p>
                       </div>
                     ))}
                   </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
}
