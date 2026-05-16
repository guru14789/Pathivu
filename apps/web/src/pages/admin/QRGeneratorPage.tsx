import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { 
  Search, 
  QrCode, 
  Barcode, 
  Download, 
  Printer, 
  History, 
  CheckCircle2, 
  X, 
  Trash2,
  Loader2,
  ChevronRight,
  FileDown,
  RefreshCw,
  LayoutGrid
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
  serial_number: string;
}

interface GenerationResult {
  asset_id: string;
  asset_tag: string;
  dataUrl: string;
}

export default function QRGeneratorPage() {
  const { user } = useAuth();
  const [selectedAssets, setSelectedAssets] = useState<Asset[]>([]);
  const [format, setFormat] = useState<'qr' | 'barcode'>('qr');
  const [search, setSearch] = useState('');
  const [results, setResults] = useState<GenerationResult[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState(0);

  // --- Queries ---
  const { data: assets } = useQuery({
    queryKey: ['assets-search', search],
    queryFn: async () => {
      if (!search) return [];
      const res = await axios.get(`/api/assets?search=${search}&limit=10`);
      return res.data.data;
    },
    enabled: search.length > 2
  });

  const { data: history } = useQuery({
    queryKey: ['qr-history'],
    queryFn: async () => {
      const res = await axios.get('/api/qr/history');
      return res.data.data;
    }
  });

  // --- Handlers ---
  const toggleAsset = (asset: Asset) => {
    if (selectedAssets.find(a => a.asset_id === asset.asset_id)) {
      setSelectedAssets(prev => prev.filter(a => a.asset_id !== asset.asset_id));
    } else {
      if (selectedAssets.length >= 40) return;
      setSelectedAssets(prev => [...prev, asset]);
    }
  };

  const generateBulk = async () => {
    setIsGenerating(true);
    setProgress(0);
    const newResults: GenerationResult[] = [];
    
    for (let i = 0; i < selectedAssets.length; i++) {
      const asset = selectedAssets[i];
      // Mocking generation delay - In real app, this would be an API call per asset or a single bulk call
      await new Promise(r => setTimeout(r, 200));
      newResults.push({
        asset_id: asset.asset_id,
        asset_tag: asset.asset_tag,
        dataUrl: `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=ASSET-${asset.asset_tag}`
      });
      setProgress(Math.round(((i + 1) / selectedAssets.length) * 100));
    }
    
    setResults(newResults);
    setIsGenerating(false);
  };

  const downloadPDF = async () => {
    try {
      const res = await axios.post('/api/qr/generate-pdf', {
        asset_ids: selectedAssets.map(a => a.asset_id),
        format
      }, { responseType: 'blob' });
      
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `AssetTags_${Date.now()}.pdf`);
      document.body.appendChild(link);
      link.click();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-10 pb-32">
      {/* Header */}
      <div>
        <h1 className="text-4xl font-black text-white tracking-tighter">QR & Identity Generator</h1>
        <p className="text-slate-400 font-medium">Bulk generate asset tags, barcodes, and print-ready label sheets.</p>
      </div>

      <div className="grid lg:grid-cols-12 gap-8">
        {/* Left: Configuration (Selector) */}
        <div className="lg:col-span-4 space-y-8">
          {/* 1. Asset Selector */}
          <div className="bg-slate-900/50 border border-slate-800 rounded-3xl p-6 space-y-5">
            <h3 className="text-sm font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
              <Search size={16} className="text-blue-500" /> Asset Selection
            </h3>
            
            <div className="relative">
              <Search className="absolute left-3 top-3 text-slate-500" size={18} />
              <input 
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search by tag, name or serial..."
                className="w-full bg-slate-950 border border-slate-800 rounded-xl py-3 pl-10 pr-4 text-sm text-white focus:border-blue-500 outline-none transition-all"
              />
              <AnimatePresence>
                {search && assets?.length > 0 && (
                  <motion.div 
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="absolute top-full left-0 right-0 mt-2 bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl z-50 overflow-hidden"
                  >
                    {assets.map((asset: Asset) => (
                      <button 
                        key={asset.asset_id}
                        onClick={() => toggleAsset(asset)}
                        className="w-full p-3 flex items-center justify-between hover:bg-slate-800 transition-all text-left border-b border-slate-800/50 last:border-0"
                      >
                        <div>
                          <p className="text-xs font-bold text-white">{asset.name}</p>
                          <p className="text-[10px] text-slate-500 uppercase">{asset.asset_tag}</p>
                        </div>
                        {selectedAssets.find(a => a.asset_id === asset.asset_id) ? (
                          <CheckCircle2 size={16} className="text-emerald-500" />
                        ) : (
                          <Plus size={16} className="text-slate-500" />
                        )}
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <div className="space-y-2 max-h-64 overflow-y-auto pr-2 no-scrollbar">
              {selectedAssets.length === 0 ? (
                <div className="py-8 text-center border-2 border-dashed border-slate-800 rounded-2xl">
                  <p className="text-xs text-slate-500 font-bold uppercase">No Assets Selected</p>
                </div>
              ) : (
                selectedAssets.map(asset => (
                  <div key={asset.asset_id} className="p-3 bg-slate-950 border border-slate-800 rounded-xl flex items-center justify-between group">
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-white truncate">{asset.name}</p>
                      <p className="text-[10px] text-slate-500 uppercase">{asset.asset_tag}</p>
                    </div>
                    <button onClick={() => toggleAsset(asset)} className="p-1.5 text-slate-500 hover:text-red-500 transition-all">
                      <X size={14} />
                    </button>
                  </div>
                ))
              )}
            </div>
            
            <div className="flex justify-between items-center text-[10px] font-black uppercase text-slate-500">
              <span>Selected: {selectedAssets.length} / 40</span>
              <button onClick={() => setSelectedAssets([])} className="text-red-500 hover:underline">Clear All</button>
            </div>
          </div>

          {/* 2. Format Selector */}
          <div className="bg-slate-900/50 border border-slate-800 rounded-3xl p-6 space-y-6">
            <h3 className="text-sm font-black text-slate-500 uppercase tracking-widest">Identity Format</h3>
            <div className="grid grid-cols-2 gap-4">
              <button 
                onClick={() => setFormat('qr')}
                className={cn(
                  "p-4 rounded-2xl border flex flex-col items-center gap-3 transition-all",
                  format === 'qr' ? "bg-blue-500/10 border-blue-500 text-blue-500" : "bg-slate-950 border-slate-800 text-slate-500"
                )}
              >
                <QrCode size={32} />
                <span className="text-xs font-bold">QR Code</span>
              </button>
              <button 
                onClick={() => setFormat('barcode')}
                className={cn(
                  "p-4 rounded-2xl border flex flex-col items-center gap-3 transition-all",
                  format === 'barcode' ? "bg-blue-500/10 border-blue-500 text-blue-500" : "bg-slate-950 border-slate-800 text-slate-500"
                )}
              >
                <Barcode size={32} />
                <span className="text-xs font-bold">Barcode (128)</span>
              </button>
            </div>
            
            {/* 3. Generate Button */}
            <button 
              onClick={generateBulk}
              disabled={selectedAssets.length === 0 || isGenerating}
              className="w-full bg-blue-600 hover:bg-blue-500 disabled:bg-slate-800 disabled:text-slate-600 text-white py-4 rounded-2xl font-black text-sm shadow-xl shadow-blue-900/20 flex items-center justify-center gap-2 transition-all"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="animate-spin" size={20} /> Generating ({progress}%)
                </>
              ) : (
                <>
                  <RefreshCw size={20} /> Generate {selectedAssets.length} Identity Tags
                </>
              )}
            </button>
          </div>
        </div>

        {/* Right: Results & Preview */}
        <div className="lg:col-span-8 space-y-8">
          {/* 4. Preview Grid */}
          <div className="bg-slate-900/30 border border-slate-800 rounded-3xl min-h-[500px] overflow-hidden flex flex-col">
            <div className="p-6 border-b border-slate-800 flex items-center justify-between bg-slate-900/50">
              <h3 className="text-sm font-black text-white uppercase tracking-widest flex items-center gap-2">
                <LayoutGrid size={16} className="text-blue-500" /> Preview Matrix
              </h3>
              {results.length > 0 && (
                <div className="flex gap-3">
                  {/* 5. Download Options */}
                  <button onClick={downloadPDF} className="p-2.5 bg-slate-800 text-white rounded-xl border border-slate-700 hover:bg-slate-700 transition-all flex items-center gap-2 text-xs font-bold">
                    <FileDown size={16} /> A4 PDF Sheet
                  </button>
                  <button className="p-2.5 bg-slate-800 text-white rounded-xl border border-slate-700 hover:bg-slate-700 transition-all flex items-center gap-2 text-xs font-bold">
                    <Download size={16} /> ZIP (PNGs)
                  </button>
                  <button className="p-2.5 bg-blue-600 text-white rounded-xl shadow-lg shadow-blue-900/20 hover:bg-blue-500 transition-all flex items-center gap-2 text-xs font-bold">
                    <Printer size={16} /> Print Sheet
                  </button>
                </div>
              )}
            </div>

            <div className="p-8 flex-1">
              {results.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center space-y-4 opacity-50">
                   <QrCode size={64} className="text-slate-700" />
                   <p className="text-slate-500 font-bold uppercase tracking-widest text-xs">Awaiting Generation...</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-6">
                  {results.map((res) => (
                    <motion.div 
                      key={res.asset_id}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="bg-white p-4 rounded-2xl shadow-xl flex flex-col items-center space-y-3"
                    >
                      <img src={res.dataUrl} alt={res.asset_tag} className="w-full aspect-square" />
                      <div className="text-center">
                        <p className="text-[10px] font-black text-black uppercase tracking-tighter leading-tight">BeWell AssetIQ</p>
                        <p className="text-xs font-bold text-blue-600">{res.asset_tag}</p>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* 6. Recent Generations */}
          <div className="bg-slate-900/50 border border-slate-800 rounded-3xl p-6 space-y-6">
            <h3 className="text-sm font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
              <History size={16} className="text-amber-500" /> Generation Audit
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-800 text-left">
                    <th className="pb-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Generation ID</th>
                    <th className="pb-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Assets</th>
                    <th className="pb-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Format</th>
                    <th className="pb-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Generated By</th>
                    <th className="pb-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Date</th>
                    <th className="pb-4 text-[10px] font-black text-slate-500 uppercase tracking-widest text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="text-sm">
                  {[1, 2].map((i) => (
                    <tr key={i} className="border-b border-slate-800/50 last:border-0 hover:bg-slate-800/30 transition-colors">
                      <td className="py-4 font-mono text-xs text-blue-400">#QR-9021-{i}</td>
                      <td className="py-4 text-white font-bold">12 Assets</td>
                      <td className="py-4 text-slate-400">QR Code</td>
                      <td className="py-4 text-slate-400">Suresh K.</td>
                      <td className="py-4 text-slate-500">12 Oct 2024</td>
                      <td className="py-4 text-right">
                        <button className="text-blue-500 p-2 hover:bg-blue-500/10 rounded-lg transition-all">
                          <FileDown size={16} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

interface PlusProps {
  size?: number;
  className?: string;
}

function Plus({ size = 24, className }: PlusProps) {
  return (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      width={size} 
      height={size} 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      className={className}
    >
      <line x1="12" y1="5" x2="12" y2="19"></line>
      <line x1="5" y1="12" x2="19" y2="12"></line>
    </svg>
  );
}
