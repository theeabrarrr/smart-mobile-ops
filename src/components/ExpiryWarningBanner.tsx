import { useEffect, useState } from 'react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { AlertTriangle, X } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export const ExpiryWarningBanner = () => {
  const { user } = useAuth();
  const [show, setShow] = useState(false);
  const [daysRemaining, setDaysRemaining] = useState(0);
  const [tier, setTier] = useState('');

  useEffect(() => {
    if (!user) return;

    const checkExpiry = async () => {
      const { data } = await supabase
        .from('profiles')
        .select('subscription_tier, subscription_expires_at')
        .eq('user_id', user.id)
        .single();

      if (data?.subscription_expires_at && data.subscription_tier !== 'basic') {
        const expiryDate = new Date(data.subscription_expires_at);
        const now = new Date();
        const diffTime = expiryDate.getTime() - now.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays > 0 && diffDays <= 7) {
          setDaysRemaining(diffDays);
          setTier(data.subscription_tier);
          setShow(true);
        }
      }
    };

    checkExpiry();
  }, [user]);

  if (!show) return null;

  return (
    <Alert variant="destructive" className="mb-4">
      <AlertTriangle className="h-4 w-4" />
      <AlertTitle>Subscription Expiring Soon</AlertTitle>
      <AlertDescription className="flex items-center justify-between">
        <span>
          Your {tier.toUpperCase()} subscription expires in {daysRemaining} day{daysRemaining > 1 ? 's' : ''}. 
          Contact your administrator to renew.
        </span>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShow(false)}
          className="ml-4"
        >
          <X className="h-4 w-4" />
        </Button>
      </AlertDescription>
    </Alert>
  );
};
