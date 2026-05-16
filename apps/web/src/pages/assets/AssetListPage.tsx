import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { 
  Search, 
  Filter, 
  Plus, 
  Download, 
  QrCode, 
  AlertCircle, 
  ChevronDown,
  ExternalLink,
  Tag as TagIcon,
  MapPin,
  ShieldAlert,
  ArrowUpDown
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import { cn } from '../../lib/utils';
import axios from 'axios';

// --- Types ---
interface Asset {
  asset_id: string;
  asset_tag: string;
  name: string;
  category: string;
  location: string;
  status: 'active' | 'maintenance' | 'condemned';
  condition: 'good' | 'fair' | 'poor' | 'critical';
  last_service_date: string;
  warranty_expiry: string;
  hospital_name: string;
}

// --- Components ---

const StatusBadge = ({ status }: { status: string }) => {
  const styles = {
    active: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    maintenance: "bg-amber-500/10 text-amber-400 border-amber-500/20",
    condemned: "bg-red-500/10 text-red-400 border-red-500/20",
  };
  return (
    <span className={cn("px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest border", styles[status as keyof typeof styles])}>
      {status}
    </span>
  );
};

const ConditionBadge = ({ condition }: { condition: string }) => {
  const styles = {
    good: "bg-blue-500/10 text-blue-400",
    fair: "bg-slate-500/10 text-slate-400",
    poor: "bg-orange-500/10 text-orange-400",
    critical: "bg-red-500/10 text-red-500 animate-pulse",
  };
  return (
    <div className="flex items-center gap-1.5">
      <div className={cn("w-1.5 h-1.5 rounded-full", styles[condition as keyof typeof styles].split(' ')[0])} />
      <span className={cn("text-[11px] font-bold uppercase", styles[condition as keyof typeof styles].split(' ')[1])}>
        {condition}
      </span>
    </div>
  );
};

export default function AssetListPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [filters, setFilters] = useState({
    hospital_id: '',
    categories: [] as string[],
    status: [] as string[],
    condition: [] as string[],
    is_critical: false,
  });
  const [sorting, setSorting] = useState({ field: 'name', order: 'asc' });
  const [pagination, setPagination] = useState({ page: 1, limit: 20 });
  const [selectedAssets, setSelectedAssets] = useState<string[]>([]);
  const [showFilters, setShowFilters] = useState(false);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(timer);
  }, [search]);

  // Roles
  const isSuperAdmin = user?.role === 'super_admin';
  const isAdmin = ['super_admin', 'branch_admin'].includes(user?.role || '');
  const canAdd = isAdmin;
  const canExport = isAdmin || user?.role === 'auditor';

  const { data: hospitals } = useQuery({
    queryKey: ['hospitals'],
    queryFn: async () => {
      const res = await axios.get('/api/hospitals');
      return res.data.data;
    },
    enabled: isSuperAdmin
  });

  const { data: assetsData, isLoading } = useQuery({
    queryKey: ['assets', debouncedSearch, filters, sorting, pagination],
    queryFn: async () => {
      const params = new URLSearchParams({
        search: debouncedSearch,
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
        sortField: sorting.field,
        sortOrder: sorting.order,
        ...(filters.hospital_id && { hospital_id: filters.hospital_id }),
        ...(filters.is_critical && { is_critical: 'true' }),
      });
      
      filters.categories.forEach(c => params.append('categories[]', c));
      filters.status.forEach(s => params.append('status[]', s));
      filters.condition.forEach(c => params.append('condition[]', c));

      const res = await axios.get(`/api/assets?${params.toString()}`);
      return res.data;
    }
  });

  const assets: Asset[] = assetsData?.data || [];
  const totalCount = assetsData?.meta?.total || 0;

  // Handlers
  const toggleSelectAll = () => {
    if (selectedAssets.length === assets.length) setSelectedAssets([]);
    else setSelectedAssets(assets.map(a => a.asset_id));
  };

  const toggleSelect = (id: string) => {
    if (selectedAssets.includes(id)) setSelectedAssets(selectedAssets.filter(sid => sid !== id));
    else setSelectedAssets([...selectedAssets, id]);
  };

  const toggleFilter = (type: keyof typeof filters, value: string) => {
    setFilters(prev => {
      const current = prev[type] as string[];
      if (current.includes(value)) return { ...prev, [type]: current.filter(v => v !== value) };
      return { ...prev, [type]: [...current, value] };
    });
    setPagination({ ...pagination, page: 1 });
  };

  const handleExport = async () => {
    // Implement Excel export logic
    console.log('Exporting as Excel...');
  };

  return (
    <div className="space-y-6">
      {/* 8. Top Header & Add Asset Button */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-black text-white tracking-tighter">Asset Register</h2>
          <p className="text-slate-500 font-medium mt-1">Manage and track lifecycle of hospital infrastructure.</p>
        </div>
        <div className="flex items-center gap-3">
          {canExport && (
            <button 
              onClick={handleExport}
              className="bg-slate-800 hover:bg-slate-700 text-white px-4 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center gap-2 border border-slate-700"
            >
              <Download size={18} /> Export
            </button>
          )}
          {canAdd && (
            <button 
              onClick={() => navigate('/assets/new')}
              className="bg-blue-600 hover:bg-blue-500 text-white px-5 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center gap-2 shadow-lg shadow-blue-900/40"
            >
              <Plus size={18} /> Add Asset
            </button>
          )}
        </div>
      </div>

      {/* 1 & 2. Filter Bar & Search Box */}
      <div className="bg-slate-900/40 backdrop-blur-xl border border-slate-800 p-4 rounded-3xl space-y-4">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
            <input 
              type="text" 
              placeholder="Search by tag, name, serial or model..."
              className="w-full bg-slate-950/50 border border-slate-800 rounded-2xl py-3 pl-12 pr-4 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500/40 transition-all"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-2">
            <button 
              onClick={() => setShowFilters(!showFilters)}
              className={cn(
                "px-4 py-3 rounded-2xl border text-sm font-bold flex items-center gap-2 transition-all",
                showFilters ? "bg-blue-600 border-blue-500 text-white" : "bg-slate-800 border-slate-700 text-slate-400 hover:bg-slate-700"
              )}
            >
              <Filter size={18} /> Filters {(filters.categories.length + filters.status.length + filters.condition.length) > 0 && `(${(filters.categories.length + filters.status.length + filters.condition.length)})`}
            </button>
            <div className="h-10 w-px bg-slate-800 mx-2 hidden lg:block" />
            <div className="flex items-center gap-3">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-widest whitespace-nowrap">Show Critical</span>
              <button 
                onClick={() => setFilters({ ...filters, is_critical: !filters.is_critical })}
                className={cn(
                  "w-12 h-6 rounded-full transition-all relative p-1",
                  filters.is_critical ? "bg-red-600" : "bg-slate-800"
                )}
              >
                <div className={cn("w-4 h-4 rounded-full bg-white transition-all", filters.is_critical ? "translate-x-6" : "translate-x-0")} />
              </button>
            </div>
          </div>
        </div>

        <AnimatePresence>
          {showFilters && (
            <motion.div 
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <div className="pt-4 border-t border-slate-800 grid gap-6 md:grid-cols-3">
                {/* Hospital Filter (Super Admin) */}
                {isSuperAdmin && (
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-1">Hospital</label>
                    <select 
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white outline-none"
                      value={filters.hospital_id}
                      onChange={(e) => setFilters({ ...filters, hospital_id: e.target.value })}
                    >
                      <option value="">All Hospitals</option>
                      {hospitals?.map((h: any) => <option key={h.hospital_id} value={h.hospital_id}>{h.name}</option>)}
                    </select>
                  </div>
                )}

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-1">Condition</label>
                  <div className="flex flex-wrap gap-2">
                    {['good', 'fair', 'poor', 'critical'].map(c => (
                      <button 
                        key={c}
                        onClick={() => toggleFilter('condition', c)}
                        className={cn(
                          "px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase transition-all",
                          filters.condition.includes(c) ? "bg-blue-600 text-white" : "bg-slate-800 text-slate-400 hover:bg-slate-700"
                        )}
                      >
                        {c}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-1">Status</label>
                  <div className="flex flex-wrap gap-2">
                    {['active', 'maintenance', 'condemned'].map(s => (
                      <button 
                        key={s}
                        onClick={() => toggleFilter('status', s)}
                        className={cn(
                          "px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase transition-all",
                          filters.status.includes(s) ? "bg-blue-600 text-white" : "bg-slate-800 text-slate-400 hover:bg-slate-700"
                        )}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* 3, 4, 6, 7. Asset Table & Bulk Actions */}
      <div className="bg-slate-900/40 border border-slate-800 rounded-3xl overflow-hidden backdrop-blur-sm">
        {selectedAssets.length > 0 && (
          <div className="bg-blue-600 px-6 py-3 flex items-center justify-between">
            <span className="text-sm font-bold text-white">{selectedAssets.length} assets selected</span>
            <div className="flex items-center gap-3">
              <button className="bg-white/10 hover:bg-white/20 text-white px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-2">
                <QrCode size={14} /> Bulk QR
              </button>
              <button className="bg-white/10 hover:bg-white/20 text-white px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-2">
                <ShieldAlert size={14} /> Mark Maintenance
              </button>
            </div>
          </div>
        )}
        
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-950/20">
                <th className="p-5 w-10">
                  <input 
                    type="checkbox" 
                    className="rounded border-slate-700 bg-slate-900"
                    checked={selectedAssets.length === assets.length && assets.length > 0}
                    onChange={toggleSelectAll}
                  />
                </th>
                <th className="p-5 text-[10px] font-black text-slate-500 uppercase tracking-widest cursor-pointer group" onClick={() => setSorting({ field: 'asset_tag', order: sorting.order === 'asc' ? 'desc' : 'asc' })}>
                  <div className="flex items-center gap-2">Asset Tag <ArrowUpDown size={12} className="opacity-0 group-hover:opacity-100 transition-all" /></div>
                </th>
                <th className="p-5 text-[10px] font-black text-slate-500 uppercase tracking-widest cursor-pointer group" onClick={() => setSorting({ field: 'name', order: sorting.order === 'asc' ? 'desc' : 'asc' })}>
                  <div className="flex items-center gap-2">Name <ArrowUpDown size={12} className="opacity-0 group-hover:opacity-100 transition-all" /></div>
                </th>
                <th className="p-5 text-[10px] font-black text-slate-500 uppercase tracking-widest">Category</th>
                <th className="p-5 text-[10px] font-black text-slate-500 uppercase tracking-widest">Location</th>
                <th className="p-5 text-[10px] font-black text-slate-500 uppercase tracking-widest">Status</th>
                <th className="p-5 text-[10px] font-black text-slate-500 uppercase tracking-widest">Condition</th>
                <th className="p-5 text-[10px] font-black text-slate-500 uppercase tracking-widest text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {isLoading ? (
                [1, 2, 3, 4, 5].map(i => (
                  <tr key={i} className="animate-pulse">
                    <td colSpan={8} className="p-8 bg-slate-900/20" />
                  </tr>
                ))
              ) : assets.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-12 text-center text-slate-500 font-medium">No assets found matching the criteria.</td>
                </tr>
              ) : (
                assets.map((asset) => (
                  <motion.tr 
                    key={asset.asset_id}
                    layout
                    whileHover={{ backgroundColor: 'rgba(30, 41, 59, 0.4)' }}
                    className="group transition-colors"
                  >
                    <td className="p-5">
                      <input 
                        type="checkbox" 
                        className="rounded border-slate-700 bg-slate-900"
                        checked={selectedAssets.includes(asset.asset_id)}
                        onChange={() => toggleSelect(asset.asset_id)}
                      />
                    </td>
                    <td className="p-5">
                      <span className="text-[11px] font-black font-mono text-blue-500 bg-blue-500/10 px-2 py-0.5 rounded">
                        {asset.asset_tag}
                      </span>
                    </td>
                    <td className="p-5">
                      <div>
                        <p className="text-sm font-bold text-white leading-tight">{asset.name}</p>
                        <p className="text-[10px] text-slate-500 font-medium mt-0.5">{asset.hospital_name || 'Main Unit'}</p>
                      </div>
                    </td>
                    <td className="p-5">
                      <div className="flex items-center gap-2 text-xs text-slate-400">
                        <TagIcon size={12} className="text-slate-600" />
                        {asset.category}
                      </div>
                    </td>
                    <td className="p-5">
                      <div className="flex items-center gap-2 text-xs text-slate-400">
                        <MapPin size={12} className="text-slate-600" />
                        {asset.location}
                      </div>
                    </td>
                    <td className="p-5"><StatusBadge status={asset.status} /></td>
                    <td className="p-5"><ConditionBadge condition={asset.condition} /></td>
                    <td className="p-5 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button 
                          onClick={() => navigate(`/assets/${asset.asset_id}`)}
                          className="p-2 text-slate-500 hover:text-white hover:bg-slate-800 rounded-lg transition-all"
                        >
                          <ExternalLink size={16} />
                        </button>
                        <button className="p-2 text-slate-500 hover:text-blue-500 hover:bg-blue-500/10 rounded-lg transition-all">
                          <QrCode size={16} />
                        </button>
                        <button className="p-2 text-slate-500 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-all">
                          <AlertCircle size={16} />
                        </button>
                      </div>
                    </td>
                  </motion.tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 5. Pagination */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-2">
        <p className="text-xs text-slate-500 font-bold uppercase tracking-widest">
          Showing <span className="text-white">{Math.min((pagination.page - 1) * pagination.limit + 1, totalCount)}</span> to <span className="text-white">{Math.min(pagination.page * pagination.limit, totalCount)}</span> of <span className="text-white">{totalCount}</span> Assets
        </p>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 bg-slate-900/50 border border-slate-800 rounded-xl px-3 py-1">
            <span className="text-[10px] font-black text-slate-600 uppercase">Per Page:</span>
            <select 
              className="bg-transparent text-xs text-white outline-none font-bold"
              value={pagination.limit}
              onChange={(e) => setPagination({ ...pagination, limit: Number(e.target.value), page: 1 })}
            >
              <option value="20">20</option>
              <option value="50">50</option>
              <option value="100">100</option>
            </select>
          </div>
          <div className="flex items-center gap-1">
            <button 
              disabled={pagination.page === 1}
              onClick={() => setPagination({ ...pagination, page: pagination.page - 1 })}
              className="p-2 bg-slate-900 border border-slate-800 rounded-lg text-slate-400 disabled:opacity-30 hover:bg-slate-800"
            >
              <ChevronDown className="rotate-90" size={16} />
            </button>
            <div className="flex items-center gap-1 px-4">
              <span className="text-sm font-black text-white">{pagination.page}</span>
              <span className="text-sm font-bold text-slate-600">/ {Math.ceil(totalCount / pagination.limit) || 1}</span>
            </div>
            <button 
              disabled={pagination.page >= Math.ceil(totalCount / pagination.limit)}
              onClick={() => setPagination({ ...pagination, page: pagination.page + 1 })}
              className="p-2 bg-slate-900 border border-slate-800 rounded-lg text-slate-400 disabled:opacity-30 hover:bg-slate-800"
            >
              <ChevronDown className="-rotate-90" size={16} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
