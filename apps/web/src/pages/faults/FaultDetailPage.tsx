import { AlertCircle, ArrowLeft } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';

export default function FaultDetailPage() {
  const { id } = useParams();
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
          <h1 className="text-4xl font-black text-gray-900 tracking-tighter">Fault Detail</h1>
          <p className="text-gray-500 font-medium text-sm">Fault ID: {id?.slice(0, 8)}</p>
        </div>
      </div>
      <div className="bg-white border border-gray-200 rounded-3xl p-12 flex flex-col items-center justify-center space-y-6 shadow-sm min-h-[400px]">
        <div className="w-20 h-20 bg-red-50 rounded-3xl flex items-center justify-center">
          <AlertCircle size={40} className="text-red-500" />
        </div>
        <div className="text-center space-y-2">
          <h2 className="text-2xl font-bold text-gray-900">Fault Investigation</h2>
          <p className="text-gray-500">Detailed fault information will be displayed here.</p>
        </div>
        <button 
          onClick={() => navigate('/faults')}
          className="px-8 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-2xl font-bold transition-all"
        >
          Back to Faults List
        </button>
      </div>
    </div>
  );
}
