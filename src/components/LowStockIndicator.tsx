import { Badge } from '@/components/ui/badge';
import { AlertTriangle, XCircle } from 'lucide-react';

interface LowStockIndicatorProps {
  availableCount: number;
  totalCount: number;
}

export const LowStockIndicator = ({ availableCount, totalCount }: LowStockIndicatorProps) => {
  // No indicator if never had stock
  if (totalCount === 0) return null;

  // Out of stock - had stock before but none now
  if (availableCount === 0 && totalCount >= 2) {
    return (
      <Badge variant="destructive" className="gap-1">
        <XCircle className="h-3 w-3" />
        Out of Stock
      </Badge>
    );
  }

  // Low stock - 2 or less available and has sold at least 1
  if (availableCount <= 2 && availableCount > 0 && totalCount >= 3) {
    return (
      <Badge variant="outline" className="gap-1 border-orange-500 text-orange-700 bg-orange-50">
        <AlertTriangle className="h-3 w-3" />
        Low Stock ({availableCount})
      </Badge>
    );
  }

  return null;
};
