import { useState } from 'react';
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
  FileCheck,
  Box,
  BarChart3,
  History,
  Bell,
  Search,
  Menu,
  X,
  ChevronDown,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
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
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  if (!user) return null;

  const currentNav = navItems.find(item => location.pathname === item.path || location.pathname.startsWith(item.path + '/'));
  const breadcrumbLabel = currentNav?.label || 'Dashboard';

  return (
    <div className="flex h-screen bg-[#F8FAFC] overflow-hidden">
      {/* Mobile overlay */}
      <AnimatePresence>
        {mobileSidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setMobileSidebarOpen(false)}
            className="fixed inset-0 bg-black/30 z-40 lg:hidden"
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <motion.aside
        layout
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        className={cn(
          "hidden lg:flex flex-col bg-white border-r border-gray-200 relative z-30 shadow-sm",
          sidebarCollapsed ? "w-[72px]" : "w-[240px]"
        )}
      >
        {/* Logo */}
        <div className={cn(
          "flex items-center h-[72px] border-b border-gray-100 px-4",
          sidebarCollapsed ? "justify-center" : "justify-between"
        )}>
          {!sidebarCollapsed ? (
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-[#6A1B9A] flex items-center justify-center shadow-sm">
                <span className="text-xs font-bold text-white">BA</span>
              </div>
              <div>
                <span className="text-base font-bold text-gray-900 tracking-tight">BeWell</span>
                <span className="text-[10px] font-semibold text-[#6A1B9A] block leading-none -mt-0.5">AssetIQ</span>
              </div>
            </div>
          ) : (
            <div className="w-9 h-9 rounded-xl bg-[#6A1B9A] flex items-center justify-center shadow-sm">
              <span className="text-xs font-bold text-white">BA</span>
            </div>
          )}
          {!sidebarCollapsed && (
            <button
              onClick={() => setSidebarCollapsed(true)}
              className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-all"
            >
              <ChevronDown size={16} className="rotate-90" />
            </button>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto no-scrollbar py-4 px-3 space-y-0.5">
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
            const isActive = location.pathname === item.path || location.pathname.startsWith(item.path + '/');
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setMobileSidebarOpen(false)}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-150 group relative",
                  sidebarCollapsed && "justify-center px-0",
                  isActive
                    ? "bg-[#6A1B9A]/8 text-[#6A1B9A] font-semibold"
                    : "text-gray-500 hover:text-gray-700 hover:bg-gray-100"
                )}
              >
                {isActive && (
                  <motion.div
                    layoutId="navPill"
                    className="absolute left-0 w-1 h-6 bg-[#6A1B9A] rounded-r-full"
                    transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                  />
                )}
                <div className={cn(
                  "relative z-10 flex items-center justify-center shrink-0",
                  isActive ? "text-[#6A1B9A]" : "text-gray-400 group-hover:text-gray-600"
                )}>
                  <item.icon size={20} />
                </div>
                {!sidebarCollapsed && (
                  <span className={cn(
                    "relative z-10 text-sm",
                    isActive ? "text-[#6A1B9A]" : "text-gray-500 group-hover:text-gray-700"
                  )}>
                    {item.label}
                  </span>
                )}
                {sidebarCollapsed && (
                  <div className="absolute left-full ml-3 px-2.5 py-1.5 bg-white border border-gray-200 rounded-lg text-xs font-medium text-gray-700 whitespace-nowrap opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all pointer-events-none z-50 shadow-lg">
                    {item.label}
                  </div>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        <div className={cn(
          "border-t border-gray-100 p-3 space-y-1",
          sidebarCollapsed && "flex flex-col items-center"
        )}>
          <Link
            to="/settings"
            className={cn(
              "flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all text-gray-500 hover:text-gray-700 hover:bg-gray-100",
              sidebarCollapsed && "justify-center px-0"
            )}
          >
            <Settings size={20} className="shrink-0" />
            {!sidebarCollapsed && <span className="text-sm">Settings</span>}
          </Link>

          <button
            onClick={handleLogout}
            className={cn(
              "flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all text-gray-500 hover:text-red-600 hover:bg-red-50 w-full",
              sidebarCollapsed && "justify-center px-0"
            )}
          >
            <LogOut size={20} className="shrink-0" />
            {!sidebarCollapsed && <span className="text-sm">Logout</span>}
          </button>

          {!sidebarCollapsed && (
            <div className="flex items-center gap-3 px-3 py-3 mt-2 border-t border-gray-100">
              <div className="w-8 h-8 rounded-lg bg-[#6A1B9A] flex items-center justify-center text-xs font-bold text-white shrink-0">
                {user?.full_name?.charAt(0)?.toUpperCase() || 'U'}
              </div>
              <div className="min-w-0">
                <p className="text-xs font-semibold text-gray-800 truncate">{user?.full_name || 'User'}</p>
                <p className="text-[10px] font-medium text-gray-500 truncate capitalize">{user?.role?.replace('_', ' ') || ''}</p>
              </div>
            </div>
          )}
        </div>
      </motion.aside>

      {/* Mobile sidebar */}
      <AnimatePresence>
        {mobileSidebarOpen && (
          <motion.aside
            initial={{ x: -280 }}
            animate={{ x: 0 }}
            exit={{ x: -280 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="fixed inset-y-0 left-0 w-[260px] bg-white border-r border-gray-200 z-50 flex flex-col lg:hidden shadow-xl"
          >
            <div className="flex items-center justify-between h-[72px] px-4 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-[#6A1B9A] flex items-center justify-center shadow-sm">
                  <span className="text-[10px] font-bold text-white">BA</span>
                </div>
                <div>
                  <span className="text-sm font-bold text-gray-900">BeWell</span>
                  <span className="text-[9px] font-semibold text-[#6A1B9A] block leading-none">AssetIQ</span>
                </div>
              </div>
              <button onClick={() => setMobileSidebarOpen(false)} className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-all">
                <X size={18} />
              </button>
            </div>
            <nav className="flex-1 overflow-y-auto no-scrollbar py-4 px-3 space-y-0.5">
              {navItems.map((item) => {
                const isActive = location.pathname === item.path;
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={() => setMobileSidebarOpen(false)}
                    className={cn(
                      "flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all",
                      isActive ? "bg-[#6A1B9A]/8 text-[#6A1B9A] font-semibold" : "text-gray-500 hover:text-gray-700 hover:bg-gray-100"
                    )}
                  >
                    <item.icon size={20} />
                    <span className="text-sm">{item.label}</span>
                  </Link>
                );
              })}
            </nav>
          </motion.aside>
        )}
      </AnimatePresence>

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top navbar */}
        <header className="h-[72px] flex items-center justify-between px-6 lg:px-8 border-b border-gray-200 bg-white sticky top-0 z-20">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setMobileSidebarOpen(true)}
              className="lg:hidden p-2 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-all"
            >
              <Menu size={20} />
            </button>

            {/* Breadcrumb */}
            <nav className="hidden lg:flex items-center gap-2 text-sm">
              <span className="text-gray-400">Pages</span>
              <ChevronDown size={12} className="text-gray-300 -rotate-90" />
              <span className="font-semibold text-gray-800">{breadcrumbLabel}</span>
            </nav>

            {/* Search */}
            <div className="relative hidden md:block w-72 lg:w-80 ml-6">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
              <input
                placeholder="Search assets, team, reports..."
                className="w-full bg-gray-50 border border-gray-200 rounded-xl py-2 pl-10 pr-4 text-sm text-gray-700 placeholder:text-gray-400 focus:outline-none focus:border-[#6A1B9A]/30 focus:bg-white focus:ring-1 focus:ring-[#6A1B9A]/10 transition-all"
              />
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button className="relative p-2.5 rounded-xl text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-all">
              <Bell size={18} />
              <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-[#E53935] border-2 border-white" />
            </button>
            <div className="flex items-center gap-3 pl-3 border-l border-gray-200">
              <div className="hidden sm:block text-right">
                <p className="text-sm font-semibold text-gray-800">{user?.full_name || 'User'}</p>
                <p className="text-[10px] font-medium text-gray-500 capitalize">{user?.role?.replace('_', ' ') || ''}</p>
              </div>
              <div className="w-9 h-9 rounded-lg bg-[#6A1B9A] flex items-center justify-center text-xs font-bold text-white">
                {user?.full_name?.charAt(0)?.toUpperCase() || 'U'}
              </div>
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-y-auto no-scrollbar bg-[#F8FAFC]">
          <div className="p-6 lg:p-8 max-w-[1440px] mx-auto">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

export default Layout;
