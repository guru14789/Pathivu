import { QrCode, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function AssetQRPage() {
  const navigate = useNavigate();

  return (
    <div className="space-y-8 pb-32">
      <div className="flex items-center gap-5">
        <button 
          onClick={() => navigate(-1)} 
          className="mt-1 p-2 bg-white border border-gray-200 rounded-xl text-gray-400 hover:text-gray-900 transition-all shadow-sm"
        >
          <ArrowLeft size={20} />
        </button>
        <div>
          <h1 className="text-4xl font-black text-gray-900 tracking-tighter">QR Code Management</h1>
          <p className="text-gray-500 font-medium text-sm">Asset identity tagging and QR lifecycle.</p>
        </div>
      </div>
      <div className="bg-white border border-gray-200 rounded-3xl p-12 flex flex-col items-center justify-center space-y-6 shadow-sm min-h-[400px]">
        <div className="w-20 h-20 bg-purple-100 rounded-3xl flex items-center justify-center">
          <QrCode size={40} className="text-[#6A1B9A]" />
        </div>
        <div className="text-center space-y-2">
          <h2 className="text-2xl font-bold text-gray-900">QR Configuration</h2>
          <p className="text-gray-500">Full QR generator is available in the admin panel.</p>
        </div>
        <button 
          onClick={() => navigate('/admin/qr-generator')}
          className="px-8 py-3 bg-[#6A1B9A] hover:bg-[#7B1FA2] text-white rounded-2xl font-bold shadow-lg shadow-purple-900/20 transition-all"
        >
          Open QR Generator
        </button>
      </div>
    </div>
  );
}
