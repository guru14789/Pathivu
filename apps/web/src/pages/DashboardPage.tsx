import {
  AlertTriangle,
  CheckCircle,
  Package,
  Clock,
  ShieldAlert,
  Zap,
  Plus,
  Wrench,
  QrCode,
  Eye,
  History,
  MapPin,
  Calendar,
  ArrowUpRight,
  TrendingUp,
  Activity,
  Building2,

} from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '../lib/utils';

const StatCard = ({ label, value, change, icon: Icon, color }: any) => (
  <motion.div
    initial={{ opacity: 0, y: 16 }}
    animate={{ opacity: 1, y: 0 }}
    whileHover={{ y: -2 }}
    className="bg-white rounded-xl border border-gray-200 p-5 card-premium group"
  >
    <div className="flex items-center justify-between mb-4">
      <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center", color)}>
        <Icon size={18} className="text-white" />
      </div>
      {change !== undefined && (
        <span className={cn(
          "flex items-center gap-0.5 text-[11px] font-semibold px-2 py-0.5 rounded-full",
          change >= 0 ? "text-emerald-700 bg-emerald-50" : "text-red-700 bg-red-50"
        )}>
          <TrendingUp size={12} />
          {change > 0 ? '+' : ''}{change}%
        </span>
      )}
    </div>
    <p className="text-2xl font-bold text-gray-900 mb-0.5">{value}</p>
    <p className="text-xs font-medium text-gray-500">{label}</p>
  </motion.div>
);

const QuickAction = ({ label, icon: Icon, onClick }: any) => (
  <motion.button
    whileHover={{ y: -2 }}
    whileTap={{ scale: 0.98 }}
    onClick={onClick}
    className="bg-white rounded-xl border border-gray-200 p-4 flex flex-col items-center gap-3 group hover:border-[#6A1B9A]/20 hover:shadow-md transition-all cursor-pointer"
  >
    <div className="w-10 h-10 rounded-lg bg-[#6A1B9A]/8 flex items-center justify-center group-hover:bg-[#6A1B9A]/15 transition-all">
      <Icon size={18} className="text-[#6A1B9A]" />
    </div>
    <span className="text-[11px] font-semibold text-gray-500 group-hover:text-gray-700 transition-colors">{label}</span>
  </motion.button>
);

const ActivityItem = ({ title, description, time, type }: any) => {
  const config: Record<string, { dot: string; bg: string }> = {
    fault: { dot: 'bg-[#E53935]', bg: 'bg-[#E53935]/8' },
    maintenance: { dot: 'bg-[#F39C12]', bg: 'bg-[#F39C12]/8' },
    compliance: { dot: 'bg-[#8BC34A]', bg: 'bg-[#8BC34A]/8' },
    default: { dot: 'bg-[#5BC0DE]', bg: 'bg-[#5BC0DE]/8' },
  };
  const c = config[type] || config.default;
  return (
    <div className="flex items-start gap-3 py-3 group cursor-pointer">
      <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5", c.bg)}>
        <Activity size={14} className={c.dot.replace('bg-', 'text-')} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-gray-800 group-hover:text-gray-900 transition-colors">{title}</p>
        <p className="text-xs text-gray-500 mt-0.5">{description}</p>
      </div>
      <span className="text-[11px] text-gray-400 shrink-0">{time}</span>
    </div>
  );
};

const TaskCard = ({ title, tech, role, date, type }: any) => (
  <motion.div
    initial={{ opacity: 0, y: 16 }}
    animate={{ opacity: 1, y: 0 }}
    whileHover={{ y: -2 }}
    className="bg-white rounded-xl border border-gray-200 p-4 group hover:shadow-elevated transition-all"
  >
    <div className="flex items-center gap-3 mb-3">
      <div className="w-9 h-9 rounded-lg bg-[#6A1B9A] flex items-center justify-center text-xs font-bold text-white shrink-0">
        {tech?.charAt(0) || 'T'}
      </div>
      <div className="min-w-0">
        <p className="text-sm font-semibold text-gray-800 truncate">{tech}</p>
        <p className="text-[10px] text-gray-500 font-medium">{role}</p>
      </div>
      <span className={cn(
        "ml-auto text-[10px] font-semibold px-2 py-0.5 rounded-full",
        type === 'Emergency' ? 'bg-red-50 text-[#C62828] border border-red-100' : 'bg-[#6A1B9A]/8 text-[#6A1B9A] border border-[#6A1B9A]/15'
      )}>
        {type}
      </span>
    </div>
    <h4 className="text-sm font-bold text-gray-900 mb-3">{title}</h4>
    <div className="flex items-center justify-between text-xs">
      <div className="flex items-center gap-1.5 text-gray-500">
        <Calendar size={12} />
        <span>{date}</span>
      </div>
      <div className="flex gap-1">
        <button className="p-1.5 rounded-lg text-gray-400 hover:text-[#6A1B9A] hover:bg-[#6A1B9A]/8 transition-all">
          <MapPin size={14} />
        </button>
        <button className="p-1.5 rounded-lg text-gray-400 hover:text-[#6A1B9A] hover:bg-[#6A1B9A]/8 transition-all">
          <ArrowUpRight size={14} />
        </button>
      </div>
    </div>
  </motion.div>
);

import { useRealtimeFaults } from '../hooks/useRealtimeFaults';
import { useNavigate } from 'react-router-dom';

const DashboardPage = () => {
  const navigate = useNavigate();
  useRealtimeFaults();

  const quickActions = [
    { label: 'Add Asset', icon: Plus, onClick: () => navigate('/assets/new') },
    { label: 'Maintenance', icon: Wrench, onClick: () => navigate('/maintenance') },
    { label: 'Fault Report', icon: AlertTriangle, onClick: () => navigate('/faults') },
    { label: 'Inventory', icon: Package, onClick: () => navigate('/inventory') },
    { label: 'QR Manager', icon: QrCode, onClick: () => navigate('/qr-generator') },
    { label: 'Reports', icon: History, onClick: () => navigate('/reports') },
    { label: 'Compliance', icon: ShieldAlert, onClick: () => navigate('/compliance') },
    { label: 'Scan Logs', icon: Eye, onClick: () => navigate('/scan-logs') },
  ];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="space-y-8"
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 tracking-tight">Dashboard</h1>
          <p className="text-sm text-gray-500 mt-1">Real-time operational overview of your hospital network.</p>
        </div>
        <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-50 border border-emerald-200">
          <div className="w-2 h-2 rounded-full bg-emerald-500" />
          <span className="text-xs font-semibold text-emerald-700">All Systems Normal</span>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <StatCard label="Total Assets" value="1,284" change={12} icon={Package} color="bg-[#6A1B9A]" />
        <StatCard label="Compliance" value="98.2%" change={2.4} icon={ShieldAlert} color="bg-[#8BC34A]" />
        <StatCard label="Critical Faults" value="3" change={-15} icon={AlertTriangle} color="bg-[#E53935]" />
        <StatCard label="PPM Efficiency" value="94%" change={5.1} icon={CheckCircle} color="bg-[#5BC0DE]" />
        <StatCard label="MTTR" value="4.2h" change={-8} icon={Zap} color="bg-[#F39C12]" />
        <StatCard label="Open Tickets" value="18" change={0} icon={Clock} color="bg-gray-600" />
      </div>

      {/* Main grid */}
      <div className="grid lg:grid-cols-12 gap-6">
        {/* Quick Actions */}
        <div className="lg:col-span-3 space-y-4">
          <div>
            <h2 className="text-sm font-semibold text-gray-800">Quick Actions</h2>
            <p className="text-xs text-gray-500 mt-0.5">Frequently used tools.</p>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {quickActions.map((action) => (
              <QuickAction key={action.label} {...action} />
            ))}
          </div>
        </div>

        {/* Activity */}
        <div className="lg:col-span-5 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-semibold text-gray-800">Recent Activity</h2>
              <p className="text-xs text-gray-500 mt-0.5">Latest events across the network.</p>
            </div>
            <button className="text-xs font-semibold text-[#6A1B9A] hover:text-[#7B1FA2] transition-colors">View all</button>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-4 divide-y divide-gray-100">
            <ActivityItem title="MRI Scanner calibrated" description="Quarterly PPM completed at Main Hospital" time="2m ago" type="maintenance" />
            <ActivityItem title="Ventilator fault reported" description="ICU Wing B — urgent repair required" time="15m ago" type="fault" />
            <ActivityItem title="Compliance docs approved" description="Fire safety certificate for Block A" time="1h ago" type="compliance" />
            <ActivityItem title="New asset registered" description="Defibrillator — serial DEF-2024-8842" time="2h ago" type="default" />
            <ActivityItem title="Spare parts inventory low" description="5 items below reorder threshold" time="3h ago" type="fault" />
          </div>
        </div>

        {/* Tasks */}
        <div className="lg:col-span-4 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-semibold text-gray-800">Critical Tasks</h2>
              <p className="text-xs text-gray-500 mt-0.5">Pending maintenance & repairs.</p>
            </div>
            <button className="text-xs font-semibold text-[#6A1B9A] hover:text-[#7B1FA2] transition-colors">All tasks</button>
          </div>
          <div className="space-y-3">
            <TaskCard tech="Suresh Kumar" role="Senior Biomedical Tech" title="MRI Scanner Calibration" date="14 Aug 2024" type="PPM" />
            <TaskCard tech="Anita Rao" role="Electronics Specialist" title="Ventilator Circuit Repair" date="21 Aug 2024" type="Emergency" />
            <TaskCard tech="Rajesh Patel" role="Biomedical Engineer" title="CT Scan Tube Replacement" date="28 Aug 2024" type="PPM" />
          </div>
        </div>
      </div>

      {/* Hospital Overview */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <div>
            <h2 className="text-sm font-semibold text-gray-800">Hospital Overview</h2>
            <p className="text-xs text-gray-500 mt-0.5">Quick snapshot of all branches.</p>
          </div>
          <button onClick={() => navigate('/hospitals')} className="text-xs font-semibold text-[#6A1B9A] hover:text-[#7B1FA2] transition-colors flex items-center gap-1">
            Manage branches <ArrowUpRight size={12} />
          </button>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 divide-x-0 sm:divide-x divide-y sm:divide-y-0 divide-gray-100">
          {[
            { name: 'Main Hospital', assets: '486', compliance: '99%', status: 'optimal' },
            { name: 'North Wing', assets: '312', compliance: '97%', status: 'good' },
            { name: 'South Campus', assets: '274', compliance: '94%', status: 'attention' },
            { name: 'East Clinic', assets: '212', compliance: '88%', status: 'warning' },
          ].map((branch) => (
            <div key={branch.name} className="p-5 hover:bg-gray-50 transition-colors cursor-pointer">
              <div className="flex items-center gap-2 mb-3">
                <Building2 size={14} className="text-gray-400" />
                <h3 className="text-sm font-semibold text-gray-800">{branch.name}</h3>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-500">{branch.assets} assets</span>
                <span className={cn(
                  "font-semibold",
                  branch.status === 'optimal' ? 'text-emerald-600' :
                  branch.status === 'good' ? 'text-[#5BC0DE]' :
                  branch.status === 'attention' ? 'text-[#F39C12]' : 'text-[#E53935]'
                )}>
                  {branch.compliance} compliance
                </span>
              </div>
              <div className="mt-2 h-1.5 rounded-full bg-gray-100 overflow-hidden">
                <div className={cn(
                  "h-full rounded-full transition-all",
                  branch.status === 'optimal' ? 'w-[99%] bg-emerald-500' :
                  branch.status === 'good' ? 'w-[97%] bg-[#5BC0DE]' :
                  branch.status === 'attention' ? 'w-[94%] bg-[#F39C12]' : 'w-[88%] bg-[#E53935]'
                )} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );
};

export default DashboardPage;
