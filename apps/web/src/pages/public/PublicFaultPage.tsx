import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  AlertCircle, 
  Camera, 
  CheckCircle2, 
  ChevronLeft, 
  X, 
  Loader2, 
  ShieldAlert,
  ArrowRight,
  Info
} from 'lucide-react';
import { useQuery, useMutation } from '@tanstack/react-query';
import axios from 'axios';
import { cn } from '../../lib/utils';

const faultSchema = z.object({
  fault_type: z.string().min(1, 'Please select a fault type'),
  severity: z.enum(['low', 'medium', 'high', 'critical']),
  description: z.string().min(20, 'Please provide more detail (min 20 characters)'),
  photo: z.any().optional(),
});

type FaultFormValues = z.infer<typeof faultSchema>;

export default function PublicFaultPage() {
  const { assetTag } = useParams();
  const navigate = useNavigate();
  const [submittedData, setSubmittedData] = useState<{ id: string } | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);

  const { data: asset } = useQuery({
    queryKey: ['scan', assetTag],
    queryFn: async () => {
      const res = await axios.get(`/api/qr/scan/${assetTag}`);
      return res.data.data;
    }
  });

  const {
    control,
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<FaultFormValues>({
    resolver: zodResolver(faultSchema),
    defaultValues: {
      severity: 'medium',
    }
  });

  const selectedSeverity = watch('severity');

  const mutation = useMutation({
    mutationFn: async (data: any) => {
      // In production, use FormData for photo upload
      const res = await axios.post(`/api/faults/report`, {
        ...data,
        asset_tag: assetTag,
        hospital_id: asset?.hospital_id
      });
      return res.data.data;
    },
    onSuccess: (data) => setSubmittedData(data),
  });

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreview(reader.result as string);
        setValue('photo', file);
      };
      reader.readAsDataURL(file);
    }
  };

  const removePhoto = () => {
    setPhotoPreview(null);
    setValue('photo', undefined);
  };

  // 7. Confirmation Screen
  if (submittedData) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-[#0f172a] p-8 text-center">
        <motion.div 
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="space-y-6 max-w-sm"
        >
          <div className="w-24 h-24 bg-emerald-500/20 text-emerald-500 rounded-full flex items-center justify-center mx-auto shadow-2xl shadow-emerald-500/20 border border-emerald-500/20">
            <CheckCircle2 size={56} />
          </div>
          <div className="space-y-2">
            <h1 className="text-3xl font-bold text-white tracking-tight">Report Submitted</h1>
            <p className="text-slate-400">The maintenance team has been alerted.</p>
          </div>
          
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-inner">
            <p className="text-xs text-slate-500 font-bold uppercase tracking-widest mb-1">Ticket Reference</p>
            <p className="text-2xl font-mono font-bold text-blue-400">#{submittedData.id.slice(0, 8).toUpperCase()}</p>
          </div>

          <div className="flex items-center gap-2 text-xs text-slate-500 bg-slate-900/50 p-3 rounded-xl border border-slate-800">
            <Info size={14} className="shrink-0" />
            <p className="text-left">An engineer will be assigned based on severity. Average response time for {selectedSeverity} is 4 hours.</p>
          </div>

          <button 
            onClick={() => navigate(`/scan/${assetTag}`)}
            className="w-full bg-slate-800 hover:bg-slate-700 text-white font-bold py-4 rounded-2xl transition-all"
          >
            Done
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0f172a] pb-32">
      {/* 1. Asset Context Bar (Pinned) */}
      <div className="sticky top-0 z-50 bg-[#0f172a]/80 backdrop-blur-xl border-b border-slate-800 px-6 py-4 flex items-center justify-between shadow-xl">
        <button onClick={() => navigate(-1)} className="p-2 -ml-2 text-slate-400 hover:text-white">
          <ChevronLeft size={24} />
        </button>
        <div className="flex-1 px-4 text-center">
          <h2 className="text-sm font-bold text-white truncate">{asset?.name || 'Loading Asset...'}</h2>
          <p className="text-[10px] text-slate-500 font-bold tracking-tighter uppercase">{assetTag} • {asset?.location || 'Unknown Location'}</p>
        </div>
        <div className="w-10" /> {/* Spacer */}
      </div>

      <main className="px-6 py-8 max-w-lg mx-auto space-y-8">
        <div className="space-y-1">
          <h1 className="text-2xl font-black text-white tracking-tight">Report Fault</h1>
          <p className="text-slate-400 text-sm">Please provide accurate details for the technician.</p>
        </div>

        <form onSubmit={handleSubmit((data) => mutation.mutate(data))} className="space-y-8">
          
          {/* 2. Fault Type Dropdown */}
          <div className="space-y-3">
            <label className="text-xs font-black uppercase tracking-widest text-slate-500 ml-1">Fault Type</label>
            <div className="relative">
              <select 
                {...register('fault_type')}
                className={cn(
                  "w-full p-4 bg-slate-900/50 border border-slate-800 text-white rounded-2xl appearance-none focus:outline-none focus:ring-2 focus:ring-blue-500/40 transition-all",
                  errors.fault_type && "border-red-500/50"
                )}
              >
                <option value="" className="bg-slate-900 text-slate-600">Select type...</option>
                <option value="Electrical" className="bg-slate-900">Electrical</option>
                <option value="Mechanical" className="bg-slate-900">Mechanical</option>
                <option value="Software" className="bg-slate-900">Software</option>
                <option value="Physical Damage" className="bg-slate-900">Physical Damage</option>
                <option value="Calibration" className="bg-slate-900">Calibration</option>
                <option value="Other" className="bg-slate-900">Other</option>
              </select>
              <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-500">
                <ChevronLeft size={20} className="-rotate-90" />
              </div>
            </div>
            {errors.fault_type && <p className="text-xs text-red-400 ml-1">{errors.fault_type.message}</p>}
          </div>

          {/* 3. Severity Selector (Card-style) */}
          <div className="space-y-3">
            <label className="text-xs font-black uppercase tracking-widest text-slate-500 ml-1">Severity Level</label>
            <Controller
              name="severity"
              control={control}
              render={({ field }) => (
                <div className="grid grid-cols-2 gap-3">
                  {(['low', 'medium', 'high', 'critical'] as const).map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => field.onChange(s)}
                      className={cn(
                        "p-4 rounded-2xl border-2 text-left transition-all relative overflow-hidden",
                        field.value === s 
                          ? s === 'critical' ? "border-red-500 bg-red-500/10" : "border-blue-500 bg-blue-500/10"
                          : "border-slate-800 bg-slate-900/40 opacity-60"
                      )}
                    >
                      <p className={cn(
                        "text-xs font-black uppercase tracking-widest mb-1",
                        field.value === s 
                          ? s === 'critical' ? "text-red-400" : "text-blue-400"
                          : "text-slate-500"
                      )}>
                        {s}
                      </p>
                      <p className="text-[10px] text-slate-400 font-medium leading-tight">
                        {s === 'low' && 'Minor issue, non-essential'}
                        {s === 'medium' && 'Reduced performance'}
                        {s === 'high' && 'Functional failure'}
                        {s === 'critical' && 'Patient safety risk!'}
                      </p>
                      {field.value === s && (
                        <div className={cn(
                          "absolute top-2 right-2 w-2 h-2 rounded-full",
                          s === 'critical' ? "bg-red-500 animate-pulse" : "bg-blue-500"
                        )} />
                      )}
                    </button>
                  ))}
                </div>
              )}
            />
          </div>

          {/* 4. Description Textarea */}
          <div className="space-y-3">
            <label className="text-xs font-black uppercase tracking-widest text-slate-500 ml-1">Detailed Description</label>
            <textarea 
              {...register('description')}
              placeholder='e.g., "Ventilator alarm not sounding even when pressure drops..."'
              className={cn(
                "w-full p-5 bg-slate-900/50 border border-slate-800 text-white rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500/40 transition-all min-h-[160px] resize-none placeholder:text-slate-600",
                errors.description && "border-red-500/50"
              )}
            />
            {errors.description && <p className="text-xs text-red-400 ml-1">{errors.description.message}</p>}
          </div>

          {/* 5. Photo Capture */}
          <div className="space-y-3">
            <label className="text-xs font-black uppercase tracking-widest text-slate-500 ml-1">Photo Evidence (Optional)</label>
            <AnimatePresence mode="wait">
              {photoPreview ? (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className="relative aspect-video rounded-2xl overflow-hidden border-2 border-blue-500/30"
                >
                  <img src={photoPreview} alt="Preview" className="w-full h-full object-cover" />
                  <button 
                    type="button"
                    onClick={removePhoto}
                    className="absolute top-2 right-2 p-2 bg-black/60 backdrop-blur-md rounded-full text-white"
                  >
                    <X size={20} />
                  </button>
                </motion.div>
              ) : (
                <motion.label 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex flex-col items-center justify-center p-8 bg-slate-900/40 border-2 border-dashed border-slate-800 rounded-3xl hover:bg-slate-900/60 transition-all cursor-pointer group"
                >
                  <input type="file" accept="image/*" capture="environment" className="hidden" onChange={handlePhotoChange} />
                  <div className="p-4 bg-slate-800 rounded-2xl group-hover:bg-blue-600/20 transition-all mb-4">
                    <Camera className="w-8 h-8 text-slate-400 group-hover:text-blue-500" />
                  </div>
                  <p className="text-sm font-bold text-white">Capture Photo</p>
                  <p className="text-xs text-slate-500 mt-1">Directly from camera</p>
                </motion.label>
              )}
            </AnimatePresence>
          </div>

          {/* 6. Submit Button (Fixed at bottom) */}
          <div className="fixed bottom-0 left-0 right-0 bg-[#0f172a]/80 backdrop-blur-2xl border-t border-slate-800 p-6 z-50">
            <button 
              type="submit"
              disabled={isSubmitting || mutation.isPending}
              className={cn(
                "w-full py-4 rounded-2xl font-black text-lg transition-all shadow-xl flex items-center justify-center gap-3",
                selectedSeverity === 'critical' 
                  ? "bg-red-600 hover:bg-red-500 shadow-red-900/20" 
                  : "bg-blue-600 hover:bg-blue-500 shadow-blue-900/20",
                (isSubmitting || mutation.isPending) && "opacity-50 cursor-not-allowed"
              )}
            >
              {(isSubmitting || mutation.isPending) ? (
                <>
                  <Loader2 className="w-6 h-6 animate-spin" />
                  <span>Submitting...</span>
                </>
              ) : (
                <>
                  <span>Submit Fault Report</span>
                  <ArrowRight size={20} />
                </>
              )}
            </button>
          </div>
        </form>
      </main>
    </div>
  );
}
