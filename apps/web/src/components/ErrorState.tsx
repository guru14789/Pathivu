import { AlertCircle } from 'lucide-react';
import { cn } from '../lib/utils';

interface ErrorStateProps {
  message?: string;
  onRetry?: () => void;
  className?: string;
}

export default function ErrorState({ message = 'Failed to load data', onRetry, className }: ErrorStateProps) {
  return (
    <div className={cn('bg-red-50 border border-red-200 rounded-xl p-6 text-center', className)}>
      <AlertCircle className="text-[#E53935] mx-auto mb-3" size={28} />
      <p className="text-sm text-red-700 font-semibold">{message}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="mt-3 text-xs font-semibold text-red-600 hover:text-red-700 bg-red-100 hover:bg-red-200 px-3 py-1.5 rounded-lg transition-all"
        >
          Try again
        </button>
      )}
    </div>
  );
}
