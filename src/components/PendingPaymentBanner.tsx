import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { AlertCircle, X } from 'lucide-react';

export const PendingPaymentBanner = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [unpaidInvoices, setUnpaidInvoices] = useState<any[]>([]);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (user) {
      checkUnpaidInvoices();
    }
  }, [user]);

  const checkUnpaidInvoices = async () => {
    try {
      const { data, error } = await supabase
        .from('invoices')
        .select('id, invoice_number, amount')
        .eq('user_id', user?.id)
        .eq('status', 'UNPAID')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setUnpaidInvoices(data || []);
    } catch (error) {
      console.error('Error fetching unpaid invoices:', error);
    }
  };

  if (dismissed || unpaidInvoices.length === 0) {
    return null;
  }

  return (
    <Alert className="mb-4 border-yellow-500/50 bg-yellow-500/10">
      <AlertCircle className="h-4 w-4 text-yellow-600" />
      <AlertDescription className="flex items-center justify-between">
        <div className="flex-1">
          <p className="font-medium text-yellow-800 dark:text-yellow-400">
            You have {unpaidInvoices.length} pending payment{unpaidInvoices.length > 1 ? 's' : ''}
          </p>
          <p className="text-sm text-muted-foreground mt-1">
            Complete your payment to activate your subscription and unlock all features.
          </p>
        </div>
        <div className="flex items-center gap-2 ml-4">
          <Button 
            size="sm" 
            onClick={() => navigate('/invoices')}
            className="bg-yellow-600 hover:bg-yellow-700"
          >
            View Invoices
          </Button>
          <Button 
            size="sm" 
            variant="ghost"
            onClick={() => setDismissed(true)}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </AlertDescription>
    </Alert>
  );
};
