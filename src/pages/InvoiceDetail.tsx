import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { InvoiceView } from '@/components/InvoiceView';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';

export default function InvoiceDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [invoice, setInvoice] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user && id) {
      fetchInvoiceData();
    }
  }, [user, id]);

  const fetchInvoiceData = async () => {
    try {
      // Fetch invoice
      const { data: invoiceData, error: invoiceError } = await supabase
        .from('invoices')
        .select('*')
        .eq('id', id)
        .single();

      if (invoiceError) throw invoiceError;

      // Verify user owns this invoice
      if (invoiceData.user_id !== user?.id) {
        toast.error('Unauthorized access');
        navigate('/invoices');
        return;
      }

      setInvoice(invoiceData);

      // Fetch user profile
      const { data: profileData } = await supabase
        .from('profiles')
        .select('full_name, business_name')
        .eq('user_id', user?.id)
        .single();

      setProfile(profileData);
    } catch (error: any) {
      toast.error(error.message);
      navigate('/invoices');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <Skeleton className="h-96 w-full max-w-4xl mx-auto" />
      </div>
    );
  }

  if (!invoice) {
    return null;
  }

  return (
    <div className="container mx-auto p-6">
      <Button 
        variant="ghost" 
        onClick={() => navigate('/invoices')}
        className="mb-6"
      >
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back to Invoices
      </Button>
      
      <InvoiceView 
        invoice={invoice} 
        userProfile={profile}
        onUpdate={fetchInvoiceData}
      />
    </div>
  );
}
