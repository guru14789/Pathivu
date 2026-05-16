import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useForm, useFieldArray, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useQuery } from '@tanstack/react-query';
import { 
  ArrowLeft, 
  Save, 
  QrCode, 
  Plus, 
  Trash2, 
  Upload, 
  Info, 
  AlertCircle,
  Building2,
  Tag as TagIcon,
  DollarSign,
  X,
  Loader2
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { cn } from '../../lib/utils';
import axios from 'axios';

// --- Schema ---
const assetSchema = z.object({
  name: z.string().min(1, 'Name is required').max(150),
  category_id: z.string().min(1, 'Category is required'),
  type: z.string().optional(),
  manufacturer: z.string().optional(),
  model: z.string().optional(),
  serial_number: z.string().min(1, 'Serial number is required'),
  hospital_id: z.string().min(1, 'Hospital is required'),
  building_id: z.string().optional(),
  floor_id: z.string().optional(),
  room_id: z.string().optional(),
  department: z.string().optional(),
  purchase_date: z.string().min(1, 'Purchase date is required'),
  purchase_cost: z.number().min(0),
  vendor_id: z.string().optional(),
  warranty_expiry: z.string().optional(),
  useful_life: z.number().min(1),
  salvage_value: z.number().min(0),
  depreciation_method: z.enum(['SLM', 'WDV']),
  is_critical: z.boolean().default(false),
  status: z.enum(['active', 'maintenance', 'condemned']).default('active'),
  condition: z.enum(['good', 'fair', 'poor', 'critical']).default('good'),
  custom_attributes: z.array(z.object({
    key: z.string().min(1, 'Key required'),
    value: z.string().min(1, 'Value required'),
  })).optional(),
});

type AssetFormValues = z.infer<typeof assetSchema>;

export default function AssetFormPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = !!id;

  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [serialError, setSerialError] = useState<string | null>(null);

  // --- Form Setup ---
  const {
    register,
    control,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<AssetFormValues>({
    resolver: zodResolver(assetSchema) as any,
    defaultValues: {
      depreciation_method: 'SLM',
      is_critical: false,
      status: 'active',
      condition: 'good',
      useful_life: 5,
      salvage_value: 0,
      custom_attributes: [],
    }
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "custom_attributes"
  });

  // --- Queries ---
  const { data: categories } = useQuery({ queryKey: ['categories'], queryFn: () => axios.get('/api/categories').then(r => r.data.data) });
  const { data: hospitals } = useQuery({ queryKey: ['hospitals'], queryFn: () => axios.get('/api/hospitals').then(r => r.data.data) });
  const { data: vendors } = useQuery({ queryKey: ['vendors'], queryFn: () => axios.get('/api/vendors').then(r => r.data.data) });

  const watchedHospital = watch('hospital_id');
  const watchedCategory = watch('category_id');
  const watchedPurchaseCost = watch('purchase_cost');
  const watchedUsefulLife = watch('useful_life');
  const watchedSalvageValue = watch('salvage_value');

  // Edit Mode Pre-fill
  useEffect(() => {
    if (isEdit) {
      axios.get(`/api/assets/${id}`).then(res => {
        const asset = res.data.data;
        Object.keys(asset).forEach(key => {
          if (key in assetSchema.shape) {
            setValue(key as any, asset[key]);
          }
        });
      });
    }
  }, [isEdit, id, setValue]);

  // --- Tag Generation Preview ---
  const [tagPreview, setTagPreview] = useState('BW-NEW-ASSET');
  useEffect(() => {
    if (watchedHospital && watchedCategory) {
      const h = hospitals?.find((h: any) => h.hospital_id === watchedHospital)?.name.slice(0, 3).toUpperCase() || 'HOS';
      const c = categories?.find((c: any) => c.category_id === watchedCategory)?.name.slice(0, 3).toUpperCase() || 'CAT';
      setTagPreview(`BW-${h}-${c}-XXXX`);
    }
  }, [watchedHospital, watchedCategory, hospitals, categories]);

  // --- handlers ---
  const validateSerial = async (e: React.FocusEvent<HTMLInputElement>) => {
    const val = e.target.value;
    if (!val) return;
    try {
      const res = await axios.get(`/api/assets/validate-serial/${val}?exclude=${id || ''}`);
      if (!res.data.data.available) setSerialError('Serial number already in use');
      else setSerialError(null);
    } catch (err) { /* ignore */ }
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setPhotoPreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const onSubmit = async (data: AssetFormValues) => {
    if (serialError) return;
    try {
      if (isEdit) await axios.patch(`/api/assets/${id}`, data);
      else await axios.post('/api/assets', data);
      navigate('/assets');
    } catch (err) {
      console.error(err);
    }
  };

  // --- Calc Depreciation Preview ---
  const annualDep = watchedPurchaseCost && watchedUsefulLife 
    ? ((watchedPurchaseCost - (watchedSalvageValue || 0)) / watchedUsefulLife).toFixed(2)
    : '0.00';

  return (
    <div className="max-w-5xl mx-auto space-y-10 pb-32">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-start gap-5">
          <button onClick={() => navigate(-1)} className="mt-1 p-2 bg-slate-900 border border-slate-800 rounded-xl text-slate-400 hover:text-white transition-all">
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-4xl font-black text-white tracking-tighter">{isEdit ? 'Edit Asset Profile' : 'Register New Asset'}</h1>
            <p className="text-slate-400 font-medium">{isEdit ? `Modifying ${id}` : 'Create a new digital asset identity for the chain.'}</p>
          </div>
        </div>

        {/* 7. Tag Preview */}
        <div className="bg-slate-900/50 border border-slate-800 p-4 rounded-2xl flex flex-col items-center">
          <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Generated Asset Tag</span>
          <span className="text-xl font-mono font-black text-blue-500 tracking-tighter">{tagPreview}</span>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-12">
        {/* 1. Basic Info */}
        <section className="bg-slate-900/30 border border-slate-800 rounded-3xl p-8 space-y-8">
          <h3 className="text-sm font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
            <Info size={16} className="text-blue-500" /> Basic Information
          </h3>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-400">Asset Name *</label>
              <input {...register('name')} className={cn("w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-sm text-white", errors.name && "border-red-500")} />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-400">Category *</label>
              <select {...register('category_id')} className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-sm text-white">
                <option value="">Select...</option>
                {categories?.map((c: any) => <option key={c.category_id} value={c.category_id}>{c.name}</option>)}
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-400">Serial Number *</label>
              <input {...register('serial_number')} onBlur={validateSerial} className={cn("w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-sm text-white", (errors.serial_number || serialError) && "border-red-500")} />
              {serialError && <p className="text-[10px] text-red-500 font-bold">{serialError}</p>}
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-400">Manufacturer</label>
              <input {...register('manufacturer')} className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-sm text-white" />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-400">Model</label>
              <input {...register('model')} className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-sm text-white" />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-400">Type</label>
              <input {...register('type')} className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-sm text-white" />
            </div>
          </div>
        </section>

        {/* 2. Location Section */}
        <section className="bg-slate-900/30 border border-slate-800 rounded-3xl p-8 space-y-8">
          <h3 className="text-sm font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
            <Building2 size={16} className="text-emerald-500" /> Physical Location
          </h3>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-400">Hospital *</label>
              <select {...register('hospital_id')} className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-sm text-white">
                <option value="">Select...</option>
                {hospitals?.map((h: any) => <option key={h.hospital_id} value={h.hospital_id}>{h.name}</option>)}
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-400">Building / Block</label>
              <input {...register('building_id')} className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-sm text-white" />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-400">Floor</label>
              <input {...register('floor_id')} className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-sm text-white" />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-400">Room / Ward</label>
              <input {...register('room_id')} className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-sm text-white" />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-400">Department</label>
              <input {...register('department')} className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-sm text-white" />
            </div>
          </div>
        </section>

        {/* 3. Purchase Details */}
        <section className="bg-slate-900/30 border border-slate-800 rounded-3xl p-8 space-y-8">
          <h3 className="text-sm font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
            <DollarSign size={16} className="text-amber-500" /> Procurement & Financials
          </h3>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-400">Purchase Date *</label>
              <input type="date" {...register('purchase_date')} className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-sm text-white" />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-400">Purchase Cost (INR) *</label>
              <input type="number" {...register('purchase_cost', { valueAsNumber: true })} className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-sm text-white" />
            </div>
            <div className="space-y-2 lg:col-span-2">
              <label className="text-xs font-bold text-slate-400">Vendor</label>
              <select {...register('vendor_id')} className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-sm text-white">
                <option value="">Select Vendor...</option>
                {vendors?.map((v: any) => <option key={v.vendor_id} value={v.vendor_id}>{v.name}</option>)}
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-400">Warranty Expiry</label>
              <input type="date" {...register('warranty_expiry')} className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-sm text-white" />
            </div>
          </div>

          {/* 4. Depreciation Preview */}
          <div className="mt-8 p-6 bg-slate-950/50 rounded-2xl border border-slate-800 flex items-center justify-between">
            <div className="flex gap-10">
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-600 uppercase">Useful Life</label>
                <div className="flex items-center gap-3">
                  <input type="number" {...register('useful_life', { valueAsNumber: true })} className="w-16 bg-slate-900 text-white font-bold text-center rounded-lg py-1 outline-none" />
                  <span className="text-xs text-slate-400">Years</span>
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-600 uppercase">Salvage Value</label>
                <input type="number" {...register('salvage_value', { valueAsNumber: true })} className="w-32 bg-slate-900 text-white font-bold rounded-lg px-3 py-1 outline-none" />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-600 uppercase">Method</label>
                <div className="flex gap-4 pt-1">
                  {['SLM', 'WDV'].map(m => (
                    <label key={m} className="flex items-center gap-2 text-xs text-white cursor-pointer">
                      <input type="radio" value={m} {...register('depreciation_method')} className="accent-blue-500" /> {m}
                    </label>
                  ))}
                </div>
              </div>
            </div>
            <div className="text-right">
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Est. Annual Depreciation</p>
              <p className="text-2xl font-black text-white">₹ {annualDep}</p>
            </div>
          </div>
        </section>

        {/* 5. Flags & Custom Attributes */}
        <section className="grid lg:grid-cols-2 gap-8">
          <div className="bg-slate-900/30 border border-slate-800 rounded-3xl p-8 space-y-8">
            <h3 className="text-sm font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
              <TagIcon size={16} className="text-purple-500" /> Attributes & State
            </h3>
            <div className="space-y-6">
              <div className="flex items-center justify-between p-4 bg-slate-950/50 rounded-2xl border border-slate-800">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-red-500/10 text-red-500 rounded-xl flex items-center justify-center">
                    <AlertCircle size={24} />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-white">Critical Asset</p>
                    <p className="text-[10px] text-slate-500 uppercase">High priority maintenance</p>
                  </div>
                </div>
                <Controller 
                  name="is_critical"
                  control={control}
                  render={({ field }) => (
                    <button type="button" onClick={() => field.onChange(!field.value)} className={cn("w-14 h-7 rounded-full transition-all relative p-1", field.value ? "bg-red-600" : "bg-slate-800")}>
                      <div className={cn("w-5 h-5 rounded-full bg-white transition-all", field.value ? "translate-x-7" : "translate-x-0")} />
                    </button>
                  )}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-400">Status</label>
                  <select {...register('status')} className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-sm text-white">
                    <option value="active">Active</option>
                    <option value="maintenance">Maintenance</option>
                    <option value="condemned">Condemned</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-400">Condition</label>
                  <select {...register('condition')} className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-sm text-white">
                    <option value="good">Good</option>
                    <option value="fair">Fair</option>
                    <option value="poor">Poor</option>
                    <option value="critical">Critical</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-slate-900/30 border border-slate-800 rounded-3xl p-8 space-y-6">
             <div className="flex items-center justify-between">
                <h3 className="text-sm font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">Custom Attributes</h3>
                <button type="button" onClick={() => append({ key: '', value: '' })} className="text-blue-500 p-2 hover:bg-blue-500/10 rounded-lg transition-all"><Plus size={20} /></button>
             </div>
             <div className="space-y-3">
               {fields.map((field, index) => (
                 <div key={field.id} className="flex gap-2">
                   <input {...register(`custom_attributes.${index}.key`)} placeholder="Key (e.g. OS)" className="flex-1 bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white" />
                   <input {...register(`custom_attributes.${index}.value`)} placeholder="Value (e.g. Linux)" className="flex-1 bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white" />
                   <button type="button" onClick={() => remove(index)} className="p-2 text-slate-500 hover:text-red-500"><Trash2 size={16} /></button>
                 </div>
               ))}
             </div>
          </div>
        </section>

        {/* 6. Photo Upload */}
        <section className="bg-slate-900/30 border border-slate-800 rounded-3xl p-8 space-y-6">
           <h3 className="text-sm font-black text-slate-500 uppercase tracking-widest">Asset Photography</h3>
           <div className="flex gap-8">
             <label className="flex-1 h-48 bg-slate-950/50 border-2 border-dashed border-slate-800 rounded-3xl flex flex-col items-center justify-center cursor-pointer hover:bg-slate-900/50 transition-all group">
                <input type="file" className="hidden" accept="image/*" onChange={handlePhotoUpload} />
                <Upload className="w-10 h-10 text-slate-500 group-hover:text-blue-500 mb-2 transition-all" />
                <p className="text-sm font-bold text-white">Upload Asset Image</p>
                <p className="text-xs text-slate-500">Drag and drop or click to browse</p>
             </label>
             {photoPreview && (
               <div className="relative w-48 h-48 rounded-3xl overflow-hidden border border-slate-700 shadow-xl">
                 <img src={photoPreview} alt="Preview" className="w-full h-full object-cover" />
                 <button onClick={() => setPhotoPreview(null)} className="absolute top-2 right-2 p-1.5 bg-black/60 rounded-full text-white"><X size={16} /></button>
               </div>
             )}
           </div>
        </section>

        {/* 8. Form Actions */}
        <div className="fixed bottom-0 left-0 right-0 bg-slate-900/80 backdrop-blur-2xl border-t border-slate-800 p-6 z-50">
          <div className="max-w-5xl mx-auto flex items-center justify-end gap-4">
             <button type="button" onClick={() => navigate(-1)} className="px-8 py-3 text-slate-400 font-bold hover:text-white transition-all">Cancel</button>
             <button type="submit" disabled={isSubmitting} className="bg-slate-800 hover:bg-slate-700 text-white px-8 py-3 rounded-2xl font-bold flex items-center gap-2 border border-slate-700 transition-all">
                {isSubmitting ? <Loader2 className="animate-spin" size={20} /> : <Save size={20} />} Save Profile
             </button>
             {!isEdit && (
               <button type="submit" className="bg-blue-600 hover:bg-blue-500 text-white px-8 py-3 rounded-2xl font-bold flex items-center gap-2 shadow-lg shadow-blue-900/40 transition-all">
                  <QrCode size={20} /> Save & Generate QR
               </button>
             )}
          </div>
        </div>
      </form>
    </div>
  );
}
