import React from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  LayoutDashboard, 
  Package, 
  Users, 
  Settings, 
  LogOut, 
  Wrench, 
  AlertCircle, 
  Calendar, 
  QrCode, 
  Building2, 
  Truck, 
  FileCheck, 
  Box, 
  BarChart3, 
  History,
  ScanLine,
  Menu,
  Grid,
  PlusCircle,
  Bell,
  Search,
  ChevronRight
} from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '../lib/utils';
import { ability } from '../lib/ability';

const navItems = [
  { icon: LayoutDashboard, path: '/dashboard', label: 'Dashboard' },
  { icon: Package, path: '/assets', label: 'Assets' },
  { icon: QrCode, path: '/qr-generator', label: 'QR Manager' },
  { icon: AlertCircle, path: '/faults', label: 'Faults' },
  { icon: Wrench, path: '/maintenance', label: 'Maintenance' },
  { icon: Calendar, path: '/schedules', label: 'PPM' },
  { icon: Building2, path: '/hospitals', label: 'Branches' },
  { icon: Users, path: '/users', label: 'Team' },
  { icon: FileCheck, path: '/compliance', label: 'Compliance' },
  { icon: Box, path: '/inventory', label: 'Inventory' },
  { icon: BarChart3, path: '/reports', label: 'Reports' },
  { icon: History, path: '/audit-logs', label: 'Audit' },
];

const Layout = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  if (!user) return null;

  return (
    <div className="flex h-screen bg-[#F5F7FA] p-6 gap-6 overflow-hidden">
      {/* Sidebar - Matching the Dark Rounded Sidebar in Image */}
      <aside className="w-20 bg-[#1A1C24] rounded-[40px] flex flex-col items-center py-8 shadow-2xl relative">
        {/* Logo */}
        <div className="mb-10">
          <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-lg transform rotate-45">
            <div className="w-6 h-6 bg-[#1A1C24] rounded-lg -rotate-45" />
          </div>
        </div>

        <nav className="flex-1 flex flex-col gap-4 no-scrollbar overflow-y-auto px-2">
          {navItems.filter(item => {
            if (item.path === '/dashboard') return true;
            if (item.path === '/assets') return ability.can('read', 'Asset');
            if (item.path === '/qr-generator') return ability.can('manage', 'QrCode');
            if (item.path === '/faults') return ability.can('read', 'FaultReport');
            if (item.path === '/maintenance') return ability.can('read', 'MaintenanceLog');
            if (item.path === '/schedules') return ability.can('read', 'MaintenanceSchedule');
            if (item.path === '/hospitals') return ability.can('read', 'Hospital');
            if (item.path === '/users') return ability.can('read', 'User');
            if (item.path === '/compliance') return ability.can('read', 'ComplianceDoc');
            if (item.path === '/inventory') return ability.can('read', 'SparePart');
            if (item.path === '/reports') return ability.can('read', 'Report');
            if (item.path === '/audit-logs') return ability.can('read', 'AuditLog');
            return true;
          }).map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link 
                key={item.path}
                to={item.path} 
                className={cn(
                  "relative sidebar-icon group",
                  isActive ? "text-white" : "text-slate-500 hover:text-slate-300"
                )}
              >
                {isActive && (
                  <motion.div 
                    layoutId="activeNav"
                    className="absolute inset-0 bg-[#FF8C94] rounded-2xl shadow-[0_0_20px_rgba(255,140,148,0.4)]"
                  />
                )}
                <item.icon size={22} className="relative z-10" />
                
                {/* Tooltip */}
                <div className="absolute left-24 bg-[#1A1C24] text-white text-[10px] font-bold px-3 py-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50 uppercase tracking-widest shadow-xl">
                  {item.label}
                </div>
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="mt-auto flex flex-col gap-6 items-center">
          <button className="text-slate-500 hover:text-white transition-colors">
            <Settings size={22} />
          </button>
          
          <div className="w-12 h-12 rounded-2xl overflow-hidden border-2 border-[#FF8C94]/20 p-0.5">
            <img 
              src={`https://ui-avatars.com/api/?name=${user?.full_name || "Guest User"}&background=FF8C94&color=fff&bold=true`} 
              className="w-full h-full rounded-[14px]"
              alt="Avatar"
            />
          </div>

          <button 
            onClick={handleLogout}
            className="w-12 h-12 bg-[#FF8C94]/10 text-[#FF8C94] rounded-2xl flex items-center justify-center hover:bg-[#FF8C94] hover:text-white transition-all shadow-lg shadow-[#FF8C94]/10"
          >
            <LogOut size={20} />
          </button>
        </div>
      </aside>

      {/* Main Content - Floating White Panel */}
      <main className="flex-1 bg-white rounded-[40px] shadow-[0_8px_40px_rgba(0,0,0,0.04)] overflow-hidden flex flex-col">
        {/* Header */}
        <header className="h-24 px-10 flex items-center justify-between border-b border-slate-50">
           <div className="flex items-center gap-12">
              <div className="relative w-96">
                 <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                 <input 
                   placeholder="Search assets, faults or team members..."
                   className="w-full bg-[#F5F7FA] border-none rounded-2xl py-3 pl-12 pr-4 text-sm font-medium focus:ring-2 focus:ring-[#FF8C94]/20 transition-all"
                 />
              </div>
           </div>

           <div className="flex items-center gap-6">
              <button className="w-12 h-12 bg-[#F5F7FA] rounded-2xl flex items-center justify-center text-slate-500 hover:bg-slate-100 transition-all relative">
                 <Bell size={20} />
                 <span className="absolute top-3 right-3 w-2.5 h-2.5 bg-[#FF8C94] rounded-full border-2 border-white shadow-sm" />
              </button>
              
              <div className="flex items-center gap-4 pl-4 border-l border-slate-100">
                 <div className="text-right">
                    <p className="text-sm font-bold text-slate-900">{user?.full_name || "Guest User"}</p>
                    <p className="text-[10px] font-black text-[#FF8C94] uppercase tracking-widest">{user?.role || "User"}</p>
                 </div>
                 <div className="w-12 h-12 bg-[#F5F7FA] rounded-2xl flex items-center justify-center text-[#FF8C94] font-black">
                    {user?.full_name?.charAt(0) || "U"}
                 </div>
              </div>
           </div>
        </header>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto no-scrollbar p-10">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default Layout;
