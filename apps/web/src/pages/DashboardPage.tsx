import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { 
  AlertTriangle, 
  CheckCircle, 
  Package, 
  Clock, 
  ShieldAlert, 
  TrendingUp, 
  UserCheck,
  Zap,
  History,
  ArrowUpRight,
  ChevronRight,
  Eye,
  Plus,
  Wrench,
  QrCode,
  Search,
  MoreHorizontal,
  PlusCircle,
  MapPin,
  Calendar
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { socket } from '../lib/socket';
import { cn } from '../lib/utils';
import axios from 'axios';

// --- Components ---

const QuickAction = ({ label, icon: Icon, color }: any) => (
  <motion.button 
    whileHover={{ y: -5, scale: 1.02 }}
    whileTap={{ scale: 0.98 }}
    className="bg-white border border-slate-50 p-6 rounded-[32px] flex flex-col items-center justify-center gap-4 group transition-all card-shadow"
  >
    <div className={cn("w-14 h-14 rounded-2xl flex items-center justify-center transition-all", color)}>
       <Icon size={24} className="text-slate-800" />
    </div>
    <span className="text-[13px] font-bold text-slate-900 group-hover:text-pink-500 transition-colors">{label}</span>
  </motion.button>
);

const OperationalCard = ({ label, value, icon: Icon, color, bg }: any) => (
  <motion.div 
    whileHover={{ y: -5 }}
    className={cn("p-6 rounded-[32px] flex flex-col gap-4 card-shadow relative overflow-hidden", bg)}
  >
    <div className="flex items-center gap-3 relative z-10">
       <div className="w-10 h-10 rounded-xl bg-white/40 flex items-center justify-center">
          <Icon size={20} className="text-slate-900" />
       </div>
       <span className="text-[13px] font-bold text-slate-900">{label}</span>
    </div>
    <div className="relative z-10">
       <p className="text-3xl font-black text-slate-900">{value}</p>
    </div>
    
    {/* Decorative background shape */}
    <div className="absolute -bottom-4 -right-4 w-20 h-20 bg-black/5 rounded-full blur-2xl" />
  </motion.div>
);

const TaskCard = ({ title, subTitle, type, tech, date, time }: any) => (
  <motion.div 
    whileHover={{ y: -5 }}
    className="bg-white rounded-[40px] p-8 card-shadow flex flex-col gap-6"
  >
    <div className="flex items-center gap-4">
       <div className="w-14 h-14 rounded-2xl overflow-hidden shadow-md">
          <img src={`https://ui-avatars.com/api/?name=${tech}&background=random&bold=true`} className="w-full h-full" alt="Tech" />
       </div>
       <div>
          <h4 className="text-lg font-black text-slate-900 tracking-tight leading-none">{tech}</h4>
          <p className="text-[12px] font-medium text-slate-500 mt-1">{subTitle}</p>
       </div>
    </div>

    <div className="bg-pink-50 rounded-2xl p-4 flex flex-col gap-1">
       <span className="text-[12px] font-bold text-pink-500">{title}</span>
       <span className="text-[10px] font-black text-pink-300 uppercase tracking-widest">{type}</span>
    </div>

    <div className="flex items-center justify-between px-2">
       <div>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Date</p>
          <p className="text-[13px] font-black text-slate-900">{date}</p>
       </div>
       <div>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Time</p>
          <p className="text-[13px] font-black text-slate-900">{time}</p>
       </div>
    </div>

    <div className="flex items-center justify-center gap-3 pt-2">
       <button className="w-10 h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center shadow-lg"><MapPin size={16} /></button>
       <button className="w-10 h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center shadow-lg"><Calendar size={16} /></button>
       <button className="w-10 h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center shadow-lg"><History size={16} /></button>
    </div>
  </motion.div>
);

// --- Main Dashboard Page ---

import { useRealtimeFaults } from '../hooks/useRealtimeFaults';
import { useNavigate } from 'react-router-dom';

const DashboardPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  useRealtimeFaults();

  return (
    <div className="grid lg:grid-cols-12 gap-12">
      {/* Left Column: Actions & Services */}
      <div className="lg:col-span-4 space-y-12">
         <div className="space-y-4">
            <h2 className="text-3xl font-black text-slate-900 tracking-tighter">What do you need?</h2>
            <p className="text-sm font-medium text-slate-500">Rapid access to asset operational tools.</p>
         </div>

         <div className="grid grid-cols-2 gap-6">
            <div onClick={() => navigate('/assets/new')}>
              <QuickAction label="Add Asset" icon={Plus} color="bg-slate-50" />
            </div>
            <div onClick={() => navigate('/maintenance')}>
              <QuickAction label="Maintenance" icon={Wrench} color="bg-slate-50" />
            </div>
            <div onClick={() => navigate('/faults')}>
              <QuickAction label="Fault Report" icon={AlertTriangle} color="bg-slate-50" />
            </div>
            <div onClick={() => navigate('/inventory')}>
              <QuickAction label="Inventory" icon={Package} color="bg-slate-50" />
            </div>
            <div onClick={() => navigate('/qr-generator')}>
              <QuickAction label="QR Manager" icon={QrCode} color="bg-slate-50" />
            </div>
            <div onClick={() => navigate('/reports')}>
              <QuickAction label="Reports" icon={History} color="bg-slate-50" />
            </div>
            <div onClick={() => navigate('/compliance')}>
              <QuickAction label="Compliance" icon={ShieldAlert} color="bg-slate-50" />
            </div>
            <div onClick={() => navigate('/scan-logs')}>
              <QuickAction label="Scan Logs" icon={Eye} color="bg-slate-50" />
            </div>
         </div>
      </div>

      {/* Right Column: Status & Tasks */}
      <div className="lg:col-span-8 space-y-12">
         {/* Operational Overview */}
         <section className="space-y-8">
            <div className="flex items-center justify-between">
               <div className="space-y-1">
                  <h3 className="text-3xl font-black text-slate-900 tracking-tighter leading-none">Operational Status</h3>
                  <p className="text-sm font-medium text-slate-500">Live network health & compliance oversight.</p>
               </div>
               <button className="text-slate-400 hover:text-slate-900 transition-colors"><MoreHorizontal size={24} /></button>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
               <OperationalCard label="Compliance" value="98.2%" icon={ShieldAlert} bg="bg-[#FFF4DE]" />
               <OperationalCard label="Critical Faults" value="03" icon={AlertTriangle} bg="bg-[#FFECEE]" />
               <OperationalCard label="Total Assets" value="1,284" icon={Package} bg="bg-[#E1F1FF]" />
               <OperationalCard label="PPM Efficiency" value="94%" icon={CheckCircle} bg="bg-[#E6F8EF]" />
               <OperationalCard label="MTTR" value="4.2h" icon={Zap} bg="bg-[#F3E8FF]" />
               <OperationalCard label="Open Tickets" value="18" icon={Clock} bg="bg-[#FEF3D9]" />
            </div>
         </section>

         {/* Upcoming Tasks */}
         <section className="space-y-8">
            <div className="flex items-center justify-between">
               <div className="space-y-1">
                  <h3 className="text-3xl font-black text-slate-900 tracking-tighter leading-none">Critical Tasks</h3>
                  <p className="text-sm font-medium text-slate-500">Pending maintenance and urgent repairs.</p>
               </div>
               <button className="text-sm font-bold text-pink-500 hover:text-pink-600 transition-colors">View All Schedule</button>
            </div>

            <div className="grid md:grid-cols-2 gap-8">
               <TaskCard 
                 tech="Suresh Kumar" 
                 subTitle="Senior Biomedical Tech" 
                 title="MRI Scanner Calibration" 
                 type="Quarterly PPM" 
                 date="14 Aug 2024" 
                 time="01:00 PM" 
               />
               <TaskCard 
                 tech="Anita Rao" 
                 subTitle="Electronics Specialist" 
                 title="Ventilator Circuit Repair" 
                 type="Emergency Fault" 
                 date="21 Aug 2024" 
                 time="10:30 AM" 
               />
            </div>
         </section>
      </div>
    </div>
  );
};

export default DashboardPage;
