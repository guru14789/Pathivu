import { Package } from 'lucide-react';
import { cn } from '../lib/utils';

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}

export default function EmptyState({ icon, title, description, action, className }: EmptyStateProps) {
  return (
    <div className={cn('text-center py-16', className)}>
      <div className="text-gray-300 mx-auto mb-4 flex justify-center">
        {icon || <Package size={40} />}
      </div>
      <p className="text-gray-600 font-semibold">{title}</p>
      {description && <p className="text-gray-400 text-sm mt-1">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
