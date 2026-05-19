import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Search,
  Plus,
  Download,
  QrCode,
  Trash2,
  ChevronDown,
  ExternalLink,
  Tag as TagIcon,
  MapPin,
  ShieldAlert,
  ArrowUpDown,
  X,
  SlidersHorizontal,
  Package,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import { cn } from '../../lib/utils';
import axios from 'axios';
import toast from 'react-hot-toast';
import ConfirmDialog from '../../components/ConfirmDialog';

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

const StatusBadge = ({ status }: { status: string }) => {
  const styles: Record<string, string> = {
    active: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    maintenance: 'bg-amber-50 text-amber-700 border-amber-200',
    condemned: 'bg-red-50 text-red-700 border-red-200',
  };
  return (
    <span className={cn('px-2 py-0.5 rounded-md text-[10px] font-semibold uppercase tracking-wider border', styles[status])}>
      {status}
    </span>
  );
};

const ConditionBadge = ({ condition }: { condition: string }) => {
  const dotStyles: Record<string, string> = {
    good: 'bg-[#8BC34A]',
    fair: 'bg-gray-400',
    poor: 'bg-[#F39C12]',
    critical: 'bg-[#E53935]',
  };
  const textStyles: Record<string, string> = {
    good: 'text-emerald-700',
    fair: 'text-gray-600',
    poor: 'text-amber-700',
    critical: 'text-red-700',
  };
  return (
    <div className="flex items-center gap-1.5">
      <div className={cn('w-1.5 h-1.5 rounded-full', dotStyles[condition])} />
      <span className={cn('text-[10px] font-semibold uppercase', textStyles[condition])}>
        {condition}
      </span>
    </div>
  );
};

const FilterChip = ({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) => (
  <button
    onClick={onClick}
    className={cn(
      'px-2.5 py-1 rounded-lg text-[10px] font-semibold uppercase tracking-wider transition-all',
      active
        ? 'bg-[#6A1B9A]/8 text-[#6A1B9A] border border-[#6A1B9A]/20'
        : 'bg-gray-100 text-gray-500 border border-transparent hover:text-gray-700 hover:bg-gray-200'
    )}
  >
    {label}
  </button>
);

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
  const [deleteId, setDeleteId] = useState<string | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(timer);
  }, [search]);

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
    enabled: isSuperAdmin,
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
    },
  });

  const assets: Asset[] = assetsData?.data || [];
  const totalCount = assetsData?.meta?.total || 0;

  const queryClient = useQueryClient();

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await axios.delete(`/api/assets/${id}`);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assets'] });
      toast.success('Asset deleted successfully');
      setDeleteId(null);
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Failed to delete asset');
      setDeleteId(null);
    },
  });

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

  const activeFilterCount = filters.categories.length + filters.status.length + filters.condition.length;

  const clearFilters = () => {
    setFilters({ hospital_id: '', categories: [], status: [], condition: [], is_critical: false });
    setPagination({ ...pagination, page: 1 });
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl lg:text-2xl font-bold text-gray-900 tracking-tight">Asset Register</h1>
          <p className="text-sm text-gray-500 mt-0.5">Manage and track lifecycle of hospital infrastructure.</p>
        </div>
        <div className="flex items-center gap-2">
          {canExport && (
            <button className="px-3 py-2 rounded-xl border border-gray-200 bg-white text-gray-600 hover:text-gray-800 hover:bg-gray-50 text-xs font-semibold transition-all flex items-center gap-2">
              <Download size={14} /> Export
            </button>
          )}
          {canAdd && (
            <button
              onClick={() => navigate('/assets/new')}
              className="px-4 py-2 rounded-xl bg-[#6A1B9A] hover:bg-[#7B1FA2] text-white text-xs font-semibold transition-all flex items-center gap-2 shadow-sm"
            >
              <Plus size={14} /> Add Asset
            </button>
          )}
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="bg-white rounded-xl border border-gray-200 p-3 space-y-3">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
            <input
              type="text"
              placeholder="Search by tag, name, serial or model..."
              className="w-full bg-gray-50 border border-gray-200 rounded-lg py-2 pl-9 pr-4 text-sm text-gray-700 placeholder:text-gray-400 focus:outline-none focus:border-[#6A1B9A]/30 focus:bg-white focus:ring-1 focus:ring-[#6A1B9A]/10 transition-all"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={cn(
                'px-3 py-2 rounded-lg border text-xs font-semibold flex items-center gap-2 transition-all',
                showFilters
                  ? 'bg-[#6A1B9A] border-[#6A1B9A] text-white'
                  : 'bg-white border-gray-200 text-gray-500 hover:text-gray-700 hover:bg-gray-50'
              )}
            >
              <SlidersHorizontal size={14} /> Filters
              {activeFilterCount > 0 && (
                <span className="ml-0.5 w-5 h-5 rounded-full bg-[#6A1B9A] text-white text-[9px] font-bold flex items-center justify-center">
                  {activeFilterCount}
                </span>
              )}
            </button>
            <div className="flex items-center gap-2 pl-2 border-l border-gray-200">
              <span className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Critical</span>
              <button
                onClick={() => setFilters({ ...filters, is_critical: !filters.is_critical })}
                className={cn(
                  'w-9 h-5 rounded-full transition-all relative p-0.5',
                  filters.is_critical ? 'bg-[#E53935]' : 'bg-gray-200'
                )}
              >
                <div className={cn('w-4 h-4 rounded-full bg-white transition-all shadow-sm', filters.is_critical ? 'translate-x-4' : 'translate-x-0')} />
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
              <div className="pt-3 border-t border-gray-100 space-y-3">
                {isSuperAdmin && (
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider shrink-0 w-16">Hospital</span>
                    <select
                      className="flex-1 bg-gray-50 border border-gray-200 rounded-lg p-2 text-xs text-gray-700 outline-none focus:border-[#6A1B9A]/30 focus:bg-white transition-all"
                      value={filters.hospital_id}
                      onChange={(e) => setFilters({ ...filters, hospital_id: e.target.value })}
                    >
                      <option value="">All Hospitals</option>
                      {hospitals?.map((h: any) => (
                        <option key={h.hospital_id} value={h.hospital_id}>{h.name}</option>
                      ))}
                    </select>
                  </div>
                )}
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Condition</span>
                  {['good', 'fair', 'poor', 'critical'].map(c => (
                    <FilterChip key={c} label={c} active={filters.condition.includes(c)} onClick={() => toggleFilter('condition', c)} />
                  ))}
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Status</span>
                  {['active', 'maintenance', 'condemned'].map(s => (
                    <FilterChip key={s} label={s} active={filters.status.includes(s)} onClick={() => toggleFilter('status', s)} />
                  ))}
                </div>
                {activeFilterCount > 0 && (
                  <button onClick={clearFilters} className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-700 transition-colors">
                    <X size={12} /> Clear all filters
                  </button>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Bulk Action Bar */}
      <AnimatePresence>
        {selectedAssets.length > 0 && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="rounded-xl bg-[#6A1B9A]/8 border border-[#6A1B9A]/20 px-4 py-3 flex items-center justify-between">
              <span className="text-sm font-semibold text-[#6A1B9A]">{selectedAssets.length} asset{selectedAssets.length > 1 ? 's' : ''} selected</span>
              <div className="flex items-center gap-2">
                <button className="px-3 py-1.5 rounded-lg bg-white border border-gray-200 text-gray-600 hover:text-gray-800 hover:bg-gray-50 text-xs font-semibold transition-all flex items-center gap-1.5">
                  <QrCode size={12} /> Bulk QR
                </button>
                <button className="px-3 py-1.5 rounded-lg bg-white border border-gray-200 text-gray-600 hover:text-gray-800 hover:bg-gray-50 text-xs font-semibold transition-all flex items-center gap-1.5">
                  <ShieldAlert size={12} /> Mark Maintenance
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/50">
                <th className="p-4 w-10">
                  <input
                    type="checkbox"
                    className="rounded border-gray-300 text-[#6A1B9A] focus:ring-[#6A1B9A]/30"
                    checked={selectedAssets.length === assets.length && assets.length > 0}
                    onChange={toggleSelectAll}
                  />
                </th>
                <th className="p-4 text-[10px] font-semibold text-gray-500 uppercase tracking-wider cursor-pointer group" onClick={() => setSorting({ field: 'asset_tag', order: sorting.order === 'asc' ? 'desc' : 'asc' })}>
                  <div className="flex items-center gap-1.5">Tag <ArrowUpDown size={10} className="opacity-0 group-hover:opacity-100 transition-all" /></div>
                </th>
                <th className="p-4 text-[10px] font-semibold text-gray-500 uppercase tracking-wider cursor-pointer group" onClick={() => setSorting({ field: 'name', order: sorting.order === 'asc' ? 'desc' : 'asc' })}>
                  <div className="flex items-center gap-1.5">Name <ArrowUpDown size={10} className="opacity-0 group-hover:opacity-100 transition-all" /></div>
                </th>
                <th className="p-4 text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Category</th>
                <th className="p-4 text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Location</th>
                <th className="p-4 text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                <th className="p-4 text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Condition</th>
                <th className="p-4 text-[10px] font-semibold text-gray-500 uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i}>
                    <td colSpan={8} className="p-8">
                      <div className="skeleton-pulse h-4 rounded w-full" />
                    </td>
                  </tr>
                ))
              ) : assets.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-12 text-center">
                    <div className="flex flex-col items-center gap-2">
                      <Package size={24} className="text-gray-300" />
                      <p className="text-sm text-gray-500 font-medium">No assets found matching the criteria.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                assets.map((asset) => (
                  <motion.tr
                    key={asset.asset_id}
                    layout
                    whileHover={{ backgroundColor: 'rgba(0,0,0,0.02)' }}
                    className="group transition-colors cursor-pointer"
                    onClick={() => navigate(`/assets/${asset.asset_id}`)}
                  >
                    <td className="p-4" onClick={(e) => e.stopPropagation()}>
                      <input
                        type="checkbox"
                        className="rounded border-gray-300 text-[#6A1B9A] focus:ring-[#6A1B9A]/30"
                        checked={selectedAssets.includes(asset.asset_id)}
                        onChange={() => toggleSelect(asset.asset_id)}
                      />
                    </td>
                    <td className="p-4">
                      <span className="text-[11px] font-mono font-semibold text-[#6A1B9A] bg-[#6A1B9A]/8 px-1.5 py-0.5 rounded">
                        {asset.asset_tag}
                      </span>
                    </td>
                    <td className="p-4">
                      <p className="text-sm font-semibold text-gray-800">{asset.name}</p>
                      <p className="text-[11px] text-gray-500 mt-0.5">{asset.hospital_name || 'Main Unit'}</p>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-1.5 text-xs text-gray-500">
                        <TagIcon size={12} className="text-gray-400" />
                        {asset.category}
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-1.5 text-xs text-gray-500">
                        <MapPin size={12} className="text-gray-400" />
                        {asset.location}
                      </div>
                    </td>
                    <td className="p-4"><StatusBadge status={asset.status} /></td>
                    <td className="p-4"><ConditionBadge condition={asset.condition} /></td>
                    <td className="p-4 text-right" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => navigate(`/assets/${asset.asset_id}`)}
                          className="p-1.5 rounded-lg text-gray-400 hover:text-[#6A1B9A] hover:bg-[#6A1B9A]/8 transition-all"
                        >
                          <ExternalLink size={14} />
                        </button>
                        <button className="p-1.5 rounded-lg text-gray-400 hover:text-[#6A1B9A] hover:bg-[#6A1B9A]/8 transition-all">
                          <QrCode size={14} />
                        </button>
                        <button
                          onClick={() => setDeleteId(asset.asset_id)}
                          className="p-1.5 rounded-lg text-gray-400 hover:text-[#E53935] hover:bg-red-50 transition-all"
                        >
                          <Trash2 size={14} />
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

      {/* Pagination */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <p className="text-xs text-gray-500 font-medium">
          Showing <span className="text-gray-700">{Math.min((pagination.page - 1) * pagination.limit + 1, totalCount)}</span>
          {' '}to{' '}
          <span className="text-gray-700">{Math.min(pagination.page * pagination.limit, totalCount)}</span>
          {' '}of{' '}
          <span className="text-gray-700">{totalCount}</span> Assets
        </p>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-2.5 py-1">
            <span className="text-[10px] font-semibold text-gray-500 uppercase">Per page:</span>
            <select
              className="bg-transparent text-xs text-gray-700 outline-none font-semibold"
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
              className="p-1.5 rounded-lg border border-gray-200 bg-white text-gray-400 disabled:opacity-30 hover:text-gray-600 hover:bg-gray-50 transition-all"
            >
              <ChevronDown className="rotate-90" size={14} />
            </button>
            <span className="text-xs font-semibold text-gray-700 px-2">
              {pagination.page} / {Math.ceil(totalCount / pagination.limit) || 1}
            </span>
            <button
              disabled={pagination.page >= Math.ceil(totalCount / pagination.limit)}
              onClick={() => setPagination({ ...pagination, page: pagination.page + 1 })}
              className="p-1.5 rounded-lg border border-gray-200 bg-white text-gray-400 disabled:opacity-30 hover:text-gray-600 hover:bg-gray-50 transition-all"
            >
              <ChevronDown className="-rotate-90" size={14} />
            </button>
          </div>
        </div>
      </div>

      <ConfirmDialog
        open={deleteId !== null}
        title="Delete Asset"
        message="Are you sure you want to delete this asset? This action cannot be undone."
        variant="danger"
        confirmLabel="Delete Asset"
        onConfirm={() => deleteMutation.mutate(deleteId!)}
        onCancel={() => setDeleteId(null)}
        isLoading={deleteMutation.isPending}
      />
    </div>
  );
}
