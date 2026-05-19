import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  UserPlus, 
  Search, 
  Filter, 
  MoreVertical, 
  Shield, 
  ShieldCheck, 
  ShieldAlert,
  X,
  UserCheck,
  UserMinus,
  Key
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import { cn } from '../../lib/utils';
import axios from 'axios';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import ConfirmDialog from '../../components/ConfirmDialog';

// --- Types ---
interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: 'super_admin' | 'branch_admin' | 'supervisor' | 'technician' | 'auditor' | 'vendor';
  hospital_name: string;
  department: string;
  status: 'active' | 'inactive';
  last_login: string | null;
  created_at: string;
  created_by: string;
}

export default function UsersPage() {
  const { user: currentUser } = useAuth();
  const [activeTab, setActiveTab] = useState('all');
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [deactivateUserId, setDeactivateUserId] = useState<string | null>(null);

  const isSuperAdmin = currentUser?.role === 'super_admin';

  // --- Queries ---
  const { data: users } = useQuery({
    queryKey: ['users-list', activeTab],
    queryFn: async () => {
      const res = await axios.get('/api/users');
      return res.data.data as UserProfile[];
    }
  });

  const getRoleBadge = (role: string) => {
    switch(role) {
      case 'super_admin': return { label: 'Super Admin', color: 'text-purple-500', bg: 'bg-purple-500/10', icon: ShieldAlert };
      case 'branch_admin': return { label: 'Admin', color: 'text-blue-500', bg: 'bg-blue-500/10', icon: ShieldCheck };
      case 'technician': return { label: 'Technician', color: 'text-amber-500', bg: 'bg-amber-500/10', icon: Shield };
      default: return { label: role.replace('_', ' '), color: 'text-slate-500', bg: 'bg-slate-500/10', icon: Shield };
    }
  };

  const filteredUsers = users?.filter(u => activeTab === 'all' || u.role === activeTab) || [];

  const queryClient = useQueryClient();

  const deactivateMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await axios.put(`/api/users/${id}`, { is_active: false });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users-list'] });
      toast.success('User deactivated successfully');
      setDeactivateUserId(null);
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Failed to deactivate user');
      setDeactivateUserId(null);
    },
  });

  return (
    <div className="space-y-8 pb-32">
      {/* Header & Add Button */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tighter">Identity Management</h1>
          <p className="text-slate-500 font-medium text-sm">Managing staff access and security protocols.</p>
        </div>
        <button 
          onClick={() => setIsAddModalOpen(true)}
          className="bg-primary-purple hover:bg-secondary-purple text-white px-8 py-4 rounded-2xl text-sm font-black shadow-xl shadow-primary-purple/20 flex items-center gap-2 transition-all"
        >
          <UserPlus size={20} /> Add New Member
        </button>
      </div>

      {/* Role Tabs */}
      <div className="flex overflow-x-auto pb-2 gap-2 no-scrollbar">
        {[
          { id: 'all', label: 'All Staff' },
          { id: 'branch_admin', label: 'Administrators' },
          { id: 'supervisor', label: 'Supervisors' },
          { id: 'technician', label: 'Technicians' },
          { id: 'auditor', label: 'Auditors' },
          { id: 'vendor', label: 'Vendors' },
        ].map(tab => (
          <button 
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              "px-6 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all whitespace-nowrap border",
              activeTab === tab.id 
                ? "bg-primary-purple text-white border-primary-purple shadow-sm shadow-primary-purple/15" 
                : "bg-slate-50 text-slate-500 hover:text-slate-900 border-slate-100/80 hover:bg-slate-100/50"
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Filter Bar */}
      <div className="bg-slate-50/50 border border-slate-100 p-6 rounded-[32px] grid md:grid-cols-4 gap-6 items-center shadow-sm">
        <div className="relative md:col-span-2">
          <Search className="absolute left-3 top-3.5 text-slate-400" size={18} />
          <input 
            placeholder="Search by name, email or department..." 
            className="w-full bg-white border border-slate-200 rounded-xl py-2.5 pl-10 pr-4 text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-purple/20 focus:border-primary-purple transition-all" 
          />
        </div>
        {isSuperAdmin && (
          <select className="bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-700 outline-none focus:ring-2 focus:ring-primary-purple/20 focus:border-primary-purple transition-all">
            <option>All Hospitals</option>
          </select>
        )}
        <button className="flex items-center justify-center gap-2 bg-white text-slate-700 rounded-xl py-2.5 text-xs font-bold hover:bg-slate-50 transition-all border border-slate-200 shadow-sm">
          <Filter size={14} /> More Filters
        </button>
      </div>

      {/* Users Table */}
      <div className="bg-white border border-slate-100 rounded-[32px] overflow-hidden shadow-sm">
        <table className="w-full">
          <thead>
            <tr className="bg-slate-50/75 text-left border-b border-slate-100">
              <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Team Member</th>
              <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Access Role</th>
              <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Entity & Dept</th>
              <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Status</th>
              <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Last Auth</th>
              <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredUsers.map(u => {
              const role = getRoleBadge(u.role);
              return (
                <tr 
                  key={u.id} 
                  onClick={() => setSelectedUser(u)}
                  className="border-b border-slate-50 last:border-0 hover:bg-slate-50/40 transition-all cursor-pointer group"
                >
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-2xl bg-primary-purple/10 flex items-center justify-center text-primary-purple font-black text-xs">
                        {u.name.split(' ').map(n => n[0]).join('')}
                      </div>
                      <div className="flex flex-col">
                        <span className="text-sm font-bold text-slate-800 group-hover:text-primary-purple transition-colors">{u.name}</span>
                        <span className="text-[10px] text-slate-400 font-medium">{u.email}</span>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className={cn("inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase border", role.color, role.bg, "border-current/20")}>
                      <role.icon size={12} />
                      {role.label}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col">
                      <span className="text-xs font-bold text-slate-800">{u.hospital_name}</span>
                      <span className="text-[10px] text-slate-400 font-black uppercase">{u.department}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className={cn("px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase border", u.status === 'active' ? 'text-emerald-600 border-emerald-200 bg-emerald-50' : 'text-slate-500 border-slate-200 bg-slate-100')}>
                      {u.status}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-[10px] font-bold text-slate-500">
                      {u.last_login ? format(new Date(u.last_login), 'dd MMM, HH:mm') : 'Never'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                     <button className="p-2 text-slate-400 hover:text-slate-700 transition-all">
                        <MoreVertical size={18} />
                     </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* User Detail Drawer */}
      <AnimatePresence>
        {selectedUser && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedUser(null)}
              className="fixed inset-0 bg-slate-950/40 backdrop-blur-sm z-[100]"
            />
            <motion.div 
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              className="fixed top-0 right-0 h-screen w-full max-w-md bg-white border-l border-slate-100 z-[101] shadow-2xl p-8 overflow-y-auto"
            >
              <div className="flex items-center justify-between mb-10">
                <h2 className="text-2xl font-black text-slate-900 tracking-tighter">Staff Profile</h2>
                <button onClick={() => setSelectedUser(null)} className="p-2 hover:bg-slate-50 rounded-xl transition-all text-slate-400 hover:text-slate-600">
                  <X size={24} />
                </button>
              </div>

              <div className="space-y-8">
                <div className="flex flex-col items-center text-center space-y-4 py-8 bg-slate-50/50 rounded-[32px] border border-slate-100">
                   <div className="w-24 h-24 rounded-[32px] bg-primary-purple text-white flex items-center justify-center text-4xl font-black shadow-2xl shadow-primary-purple/40">
                     {selectedUser.name[0]}
                   </div>
                   <div>
                     <h3 className="text-2xl font-black text-slate-900">{selectedUser.name}</h3>
                     <p className="text-sm font-medium text-slate-500">{selectedUser.email}</p>
                   </div>
                   <div className={cn("px-4 py-1.5 rounded-full text-[10px] font-black uppercase border", getRoleBadge(selectedUser.role).color, getRoleBadge(selectedUser.role).bg, "border-current/20")}>
                      {getRoleBadge(selectedUser.role).label}
                   </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                   <div className="p-4 bg-white border border-slate-100 rounded-2xl shadow-sm">
                      <p className="text-[9px] font-black text-slate-400 uppercase mb-1">Entity</p>
                      <p className="text-xs font-bold text-slate-800 uppercase">{selectedUser.hospital_name}</p>
                   </div>
                   <div className="p-4 bg-white border border-slate-100 rounded-2xl shadow-sm">
                      <p className="text-[9px] font-black text-slate-400 uppercase mb-1">Dept</p>
                      <p className="text-xs font-bold text-slate-800 uppercase">{selectedUser.department}</p>
                   </div>
                </div>

                {/* Permissions Summary */}
                <div className="space-y-4">
                   <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Active Permissions</p>
                   <div className="grid grid-cols-1 gap-2">
                      {[
                        { label: 'View Asset Registry', active: true },
                        { label: 'Bulk Export Data', active: selectedUser.role.includes('admin') },
                        { label: 'Approve Maintenance', active: ['branch_admin', 'supervisor'].includes(selectedUser.role) },
                        { label: 'Delete Records', active: selectedUser.role === 'super_admin' },
                      ].map((p, i) => (
                        <div key={i} className="flex items-center justify-between p-3.5 bg-slate-50/50 rounded-2xl border border-slate-100/80">
                           <span className="text-[10px] font-bold text-slate-700">{p.label}</span>
                           {p.active ? <ShieldCheck size={14} className="text-emerald-500" /> : <Shield size={14} className="text-slate-300" />}
                        </div>
                      ))}
                   </div>
                </div>

                <div className="space-y-3 pt-8">
                  <button className="w-full py-4 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-2xl font-black text-sm border border-slate-200/55 transition-all flex items-center justify-center gap-3">
                    <Key size={18} /> Reset Password
                  </button>
                  {selectedUser.status === 'active' ? (
                    <button 
                      onClick={() => setDeactivateUserId(selectedUser.id)}
                      className="w-full py-4 bg-red-50 hover:bg-red-100 text-red-600 rounded-2xl font-black text-sm border border-red-200/60 transition-all flex items-center justify-center gap-3"
                    >
                      <UserMinus size={18} /> Deactivate User
                    </button>
                  ) : (
                    <button className="w-full py-4 bg-emerald-50 hover:bg-emerald-100 text-emerald-600 rounded-2xl font-black text-sm border border-emerald-200/60 transition-all flex items-center justify-center gap-3">
                      <UserCheck size={18} /> Reactivate User
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Add User Modal */}
      <AnimatePresence>
        {isAddModalOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsAddModalOpen(false)}
              className="fixed inset-0 bg-slate-950/40 backdrop-blur-md z-[100]"
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="fixed inset-0 m-auto w-full max-w-xl h-fit bg-white border border-slate-100 rounded-[40px] z-[101] p-10 shadow-2xl space-y-8"
            >
              <div>
                <h2 className="text-3xl font-black text-slate-900 tracking-tighter">Add Team Member</h2>
                <p className="text-slate-500 text-sm">Provision access for a new hospital staff member.</p>
              </div>

              <div className="space-y-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Full Name</label>
                  <input className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-3.5 px-4 text-sm text-slate-800 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary-purple/20 focus:border-primary-purple transition-all" placeholder="John Doe" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Email Address</label>
                    <input className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-3.5 px-4 text-sm text-slate-800 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary-purple/20 focus:border-primary-purple transition-all" placeholder="name@bewell.in" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Role</label>
                    <select className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-3.5 px-4 text-sm text-slate-700 outline-none focus:bg-white focus:ring-2 focus:ring-primary-purple/20 focus:border-primary-purple transition-all">
                      <option>Technician</option>
                      <option>Supervisor</option>
                      <option>Admin</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="flex gap-4">
                <button onClick={() => setIsAddModalOpen(false)} className="flex-1 py-4 bg-slate-100 hover:bg-slate-200 border border-slate-200/60 text-slate-700 rounded-2xl font-black text-sm transition-all">Cancel</button>
                <button className="flex-1 py-4 bg-primary-purple hover:bg-secondary-purple text-white rounded-2xl font-black text-sm shadow-xl shadow-primary-purple/20 transition-all">Add Member</button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <ConfirmDialog open={deactivateUserId !== null} title="Deactivate User" message="Are you sure you want to deactivate this user?" variant="danger" confirmLabel="Deactivate User" onConfirm={() => deactivateMutation.mutate(deactivateUserId!)} onCancel={() => setDeactivateUserId(null)} isLoading={deactivateMutation.isPending} />
    </div>
  );
}
