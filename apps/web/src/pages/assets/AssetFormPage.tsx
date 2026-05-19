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
import { cn } from '../../lib/utils';
import axios from 'axios';

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

  const { data: categories } = useQuery({ queryKey: ['categories'], queryFn: () => axios.get('/api/categories').then(r => r.data.data) });
  const { data: hospitals } = useQuery({ queryKey: ['hospitals'], queryFn: () => axios.get('/api/hospitals').then(r => r.data.data) });
  const { data: vendors } = useQuery({ queryKey: ['vendors'], queryFn: () => axios.get('/api/vendors').then(r => r.data.data) });

  const watchedHospital = watch('hospital_id');
  const watchedCategory = watch('category_id');
  const watchedPurchaseCost = watch('purchase_cost');
  const watchedUsefulLife = watch('useful_life');
  const watchedSalvageValue = watch('salvage_value');

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

  const [tagPreview, setTagPreview] = useState('BW-NEW-ASSET');
  useEffect(() => {
    if (watchedHospital && watchedCategory) {
      const h = hospitals?.find((h: any) => h.hospital_id === watchedHospital)?.name.slice(0, 3).toUpperCase() || 'HOS';
      const c = categories?.find((c: any) => c.category_id === watchedCategory)?.name.slice(0, 3).toUpperCase() || 'CAT';
      setTagPreview(`BW-${h}-${c}-XXXX`);
    }
  }, [watchedHospital, watchedCategory, hospitals, categories]);

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

  const annualDep = watchedPurchaseCost && watchedUsefulLife 
    ? ((watchedPurchaseCost - (watchedSalvageValue || 0)) / watchedUsefulLife).toFixed(2)
    : '0.00';

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-32">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-start gap-4">
          <button onClick={() => navigate(-1)} className="mt-1 p-2 bg-white border border-gray-200 rounded-lg text-gray-500 hover:text-gray-900 shadow-sm transition-all">
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{isEdit ? 'Edit Asset Profile' : 'Register New Asset'}</h1>
            <p className="text-gray-500 text-sm">{isEdit ? `Modifying ${id}` : 'Create a new digital asset identity for the chain.'}</p>
          </div>
        </div>

        <div className="bg-gray-50 border border-gray-200 p-4 rounded-xl flex flex-col items-center">
          <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1">Generated Asset Tag</span>
          <span className="text-xl font-mono font-bold text-[#6A1B9A] tracking-tighter">{tagPreview}</span>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
        <section className="bg-white border border-gray-200 rounded-xl p-6 space-y-6 shadow-sm">
          <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider flex items-center gap-2">
            <Info size={16} className="text-[#6A1B9A]" /> Basic Information
          </h3>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <label className="text-gray-700 font-semibold text-sm">Asset Name *</label>
              <input {...register('name')} className={cn("w-full bg-white border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:ring-2 focus:ring-[#6A1B9A]/20 focus:border-[#6A1B9A]", errors.name && "border-red-500")} placeholder="Enter asset name" />
            </div>
            <div className="space-y-1.5">
              <label className="text-gray-700 font-semibold text-sm">Category *</label>
              <select {...register('category_id')} className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-gray-900 focus:ring-2 focus:ring-[#6A1B9A]/20 focus:border-[#6A1B9A]">
                <option value="">Select...</option>
                {categories?.map((c: any) => <option key={c.category_id} value={c.category_id}>{c.name}</option>)}
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-gray-700 font-semibold text-sm">Serial Number *</label>
              <input {...register('serial_number')} onBlur={validateSerial} className={cn("w-full bg-white border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:ring-2 focus:ring-[#6A1B9A]/20 focus:border-[#6A1B9A]", (errors.serial_number || serialError) && "border-red-500")} placeholder="Enter serial number" />
              {serialError && <p className="text-[10px] text-red-500 font-semibold">{serialError}</p>}
            </div>
            <div className="space-y-1.5">
              <label className="text-gray-700 font-semibold text-sm">Manufacturer</label>
              <input {...register('manufacturer')} className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:ring-2 focus:ring-[#6A1B9A]/20 focus:border-[#6A1B9A]" placeholder="Enter manufacturer" />
            </div>
            <div className="space-y-1.5">
              <label className="text-gray-700 font-semibold text-sm">Model</label>
              <input {...register('model')} className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:ring-2 focus:ring-[#6A1B9A]/20 focus:border-[#6A1B9A]" placeholder="Enter model" />
            </div>
            <div className="space-y-1.5">
              <label className="text-gray-700 font-semibold text-sm">Type</label>
              <input {...register('type')} className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:ring-2 focus:ring-[#6A1B9A]/20 focus:border-[#6A1B9A]" placeholder="Enter type" />
            </div>
          </div>
        </section>

        <section className="bg-white border border-gray-200 rounded-xl p-6 space-y-6 shadow-sm">
          <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider flex items-center gap-2">
            <Building2 size={16} className="text-[#6A1B9A]" /> Physical Location
          </h3>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <label className="text-gray-700 font-semibold text-sm">Hospital *</label>
              <select {...register('hospital_id')} className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-gray-900 focus:ring-2 focus:ring-[#6A1B9A]/20 focus:border-[#6A1B9A]">
                <option value="">Select...</option>
                {hospitals?.map((h: any) => <option key={h.hospital_id} value={h.hospital_id}>{h.name}</option>)}
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-gray-700 font-semibold text-sm">Building / Block</label>
              <input {...register('building_id')} className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:ring-2 focus:ring-[#6A1B9A]/20 focus:border-[#6A1B9A]" placeholder="Enter building" />
            </div>
            <div className="space-y-1.5">
              <label className="text-gray-700 font-semibold text-sm">Floor</label>
              <input {...register('floor_id')} className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:ring-2 focus:ring-[#6A1B9A]/20 focus:border-[#6A1B9A]" placeholder="Enter floor" />
            </div>
            <div className="space-y-1.5">
              <label className="text-gray-700 font-semibold text-sm">Room / Ward</label>
              <input {...register('room_id')} className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:ring-2 focus:ring-[#6A1B9A]/20 focus:border-[#6A1B9A]" placeholder="Enter room" />
            </div>
            <div className="space-y-1.5">
              <label className="text-gray-700 font-semibold text-sm">Department</label>
              <input {...register('department')} className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:ring-2 focus:ring-[#6A1B9A]/20 focus:border-[#6A1B9A]" placeholder="Enter department" />
            </div>
          </div>
        </section>

        <section className="bg-white border border-gray-200 rounded-xl p-6 space-y-6 shadow-sm">
          <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider flex items-center gap-2">
            <DollarSign size={16} className="text-[#6A1B9A]" /> Procurement & Financials
          </h3>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="space-y-1.5">
              <label className="text-gray-700 font-semibold text-sm">Purchase Date *</label>
              <input type="date" {...register('purchase_date')} className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-gray-900 focus:ring-2 focus:ring-[#6A1B9A]/20 focus:border-[#6A1B9A]" />
            </div>
            <div className="space-y-1.5">
              <label className="text-gray-700 font-semibold text-sm">Purchase Cost (INR) *</label>
              <input type="number" {...register('purchase_cost', { valueAsNumber: true })} className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:ring-2 focus:ring-[#6A1B9A]/20 focus:border-[#6A1B9A]" placeholder="0" />
            </div>
            <div className="space-y-1.5 lg:col-span-2">
              <label className="text-gray-700 font-semibold text-sm">Vendor</label>
              <select {...register('vendor_id')} className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-gray-900 focus:ring-2 focus:ring-[#6A1B9A]/20 focus:border-[#6A1B9A]">
                <option value="">Select Vendor...</option>
                {vendors?.map((v: any) => <option key={v.vendor_id} value={v.vendor_id}>{v.name}</option>)}
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-gray-700 font-semibold text-sm">Warranty Expiry</label>
              <input type="date" {...register('warranty_expiry')} className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-gray-900 focus:ring-2 focus:ring-[#6A1B9A]/20 focus:border-[#6A1B9A]" />
            </div>
          </div>

          <div className="p-4 bg-gray-50 rounded-lg border border-gray-200 flex items-center justify-between">
            <div className="flex gap-6">
              <div className="space-y-1">
                <label className="text-[10px] font-semibold text-gray-400 uppercase">Useful Life</label>
                <div className="flex items-center gap-2">
                  <input type="number" {...register('useful_life', { valueAsNumber: true })} className="w-16 bg-white text-gray-900 font-semibold text-center rounded-lg py-1 border border-gray-200 outline-none focus:ring-2 focus:ring-[#6A1B9A]/20 focus:border-[#6A1B9A]" />
                  <span className="text-xs text-gray-400">Years</span>
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-semibold text-gray-400 uppercase">Salvage Value</label>
                <input type="number" {...register('salvage_value', { valueAsNumber: true })} className="w-28 bg-white text-gray-900 font-semibold rounded-lg px-3 py-1 border border-gray-200 outline-none focus:ring-2 focus:ring-[#6A1B9A]/20 focus:border-[#6A1B9A]" />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-semibold text-gray-400 uppercase">Method</label>
                <div className="flex gap-4 pt-1">
                  {['SLM', 'WDV'].map(m => (
                    <label key={m} className="flex items-center gap-2 text-xs text-gray-700 cursor-pointer">
                      <input type="radio" value={m} {...register('depreciation_method')} className="accent-[#6A1B9A]" /> {m}
                    </label>
                  ))}
                </div>
              </div>
            </div>
            <div className="text-right">
              <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Est. Annual Depreciation</p>
              <p className="text-2xl font-bold text-gray-900">₹ {annualDep}</p>
            </div>
          </div>
        </section>

        <section className="grid lg:grid-cols-2 gap-6">
          <div className="bg-white border border-gray-200 rounded-xl p-6 space-y-6 shadow-sm">
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider flex items-center gap-2">
              <TagIcon size={16} className="text-[#6A1B9A]" /> Attributes & State
            </h3>
            <div className="space-y-6">
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-red-50 text-red-500 rounded-lg flex items-center justify-center">
                    <AlertCircle size={24} />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-900">Critical Asset</p>
                    <p className="text-[10px] text-gray-400 uppercase">High priority maintenance</p>
                  </div>
                </div>
                <Controller 
                  name="is_critical"
                  control={control}
                  render={({ field }) => (
                    <button type="button" onClick={() => field.onChange(!field.value)} className={cn("w-14 h-7 rounded-full transition-all relative p-1", field.value ? "bg-red-500" : "bg-gray-300")}>
                      <div className={cn("w-5 h-5 rounded-full bg-white shadow-sm transition-all", field.value ? "translate-x-7" : "translate-x-0")} />
                    </button>
                  )}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-gray-700 font-semibold text-sm">Status</label>
                  <select {...register('status')} className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-gray-900 focus:ring-2 focus:ring-[#6A1B9A]/20 focus:border-[#6A1B9A]">
                    <option value="active">Active</option>
                    <option value="maintenance">Maintenance</option>
                    <option value="condemned">Condemned</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-gray-700 font-semibold text-sm">Condition</label>
                  <select {...register('condition')} className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-gray-900 focus:ring-2 focus:ring-[#6A1B9A]/20 focus:border-[#6A1B9A]">
                    <option value="good">Good</option>
                    <option value="fair">Fair</option>
                    <option value="poor">Poor</option>
                    <option value="critical">Critical</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-xl p-6 space-y-4 shadow-sm">
             <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider flex items-center gap-2">Custom Attributes</h3>
                <button type="button" onClick={() => append({ key: '', value: '' })} className="text-[#6A1B9A] p-2 hover:bg-purple-50 rounded-lg transition-all"><Plus size={20} /></button>
             </div>
             <div className="space-y-3">
               {fields.map((field, index) => (
                 <div key={field.id} className="flex gap-2">
                   <input {...register(`custom_attributes.${index}.key`)} placeholder="Key (e.g. OS)" className="flex-1 bg-white border border-gray-200 rounded-lg px-3 py-2 text-xs text-gray-900 placeholder:text-gray-400 focus:ring-2 focus:ring-[#6A1B9A]/20 focus:border-[#6A1B9A]" />
                   <input {...register(`custom_attributes.${index}.value`)} placeholder="Value (e.g. Linux)" className="flex-1 bg-white border border-gray-200 rounded-lg px-3 py-2 text-xs text-gray-900 placeholder:text-gray-400 focus:ring-2 focus:ring-[#6A1B9A]/20 focus:border-[#6A1B9A]" />
                   <button type="button" onClick={() => remove(index)} className="p-2 text-gray-500 hover:text-red-500"><Trash2 size={16} /></button>
                 </div>
               ))}
             </div>
          </div>
        </section>

        <section className="bg-white border border-gray-200 rounded-xl p-6 space-y-4 shadow-sm">
           <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Asset Photography</h3>
           <div className="flex gap-6">
             <label className="flex-1 h-48 bg-gray-50 border-2 border-dashed border-gray-200 rounded-xl flex flex-col items-center justify-center cursor-pointer hover:bg-gray-100 transition-all group">
                <input type="file" className="hidden" accept="image/*" onChange={handlePhotoUpload} />
                <Upload className="w-10 h-10 text-gray-400 group-hover:text-[#6A1B9A] mb-2 transition-all" />
                <p className="text-sm font-medium text-gray-900">Upload Asset Image</p>
                <p className="text-xs text-gray-500">Drag and drop or click to browse</p>
             </label>
             {photoPreview && (
               <div className="relative w-48 h-48 rounded-xl overflow-hidden border border-gray-200">
                 <img src={photoPreview} alt="Preview" className="w-full h-full object-cover" />
                 <button onClick={() => setPhotoPreview(null)} className="absolute top-2 right-2 p-1.5 bg-black/60 rounded-full text-white"><X size={16} /></button>
               </div>
             )}
           </div>
        </section>

        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-6 py-4 z-50">
          <div className="max-w-5xl mx-auto flex items-center justify-end gap-4">
             <button type="button" onClick={() => navigate(-1)} className="px-6 py-2.5 text-gray-500 font-medium hover:text-gray-900 transition-all">Cancel</button>
             <button type="submit" disabled={isSubmitting} className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-6 py-2.5 rounded-lg font-medium flex items-center gap-2 transition-all">
                {isSubmitting ? <Loader2 className="animate-spin" size={20} /> : <Save size={20} />} Save Profile
             </button>
             {!isEdit && (
               <button type="submit" className="bg-[#6A1B9A] hover:bg-[#7B1FA2] text-white px-6 py-2.5 rounded-lg font-medium flex items-center gap-2 shadow-lg shadow-purple-900/20 transition-all">
                  <QrCode size={20} /> Save & Generate QR
               </button>
             )}
          </div>
        </div>
      </form>
    </div>
  );
}
