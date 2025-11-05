import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useNavigate } from 'react-router-dom';
import { FileText, Eye } from 'lucide-react';
import { toast } from 'sonner';

interface Invoice {
  id: string;
  invoice_number: string;
  plan: string;
  amount: number;
  status: 'UNPAID' | 'PAID' | 'EXPIRED';
  invoice_date: string;
  due_date: string;
  created_at: string;
}

export default function MyInvoices() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchInvoices();
    }
  }, [user]);

  const fetchInvoices = async () => {
    try {
      const { data, error } = await supabase
        .from('invoices')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setInvoices(data || []);
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, any> = {
      UNPAID: 'destructive',
      PAID: 'default',
      EXPIRED: 'secondary'
    };
    return <Badge variant={variants[status]}>{status}</Badge>;
  };

  const getPlanName = (plan: string) => {
    const names: Record<string, string> = {
      basic: 'Free',
      standard: 'Standard',
      premium: 'Premium'
    };
    return names[plan] || plan;
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6 space-y-4">
        <Skeleton className="h-12 w-64" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <FileText className="h-8 w-8" />
            My Invoices
          </h1>
          <p className="text-muted-foreground mt-1">
            View and manage your subscription invoices
          </p>
        </div>
      </div>

      {invoices.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <FileText className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-xl font-semibold mb-2">No Invoices Yet</h3>
            <p className="text-muted-foreground mb-4">
              You haven't made any purchases yet. Upgrade your plan to get started.
            </p>
            <Button onClick={() => navigate('/profile')}>
              View Plans
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {invoices.map((invoice) => (
            <Card key={invoice.id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-xl">{invoice.invoice_number}</CardTitle>
                    <p className="text-sm text-muted-foreground mt-1">
                      {getPlanName(invoice.plan)} Plan
                    </p>
                  </div>
                  {getStatusBadge(invoice.status)}
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-4 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Amount</p>
                    <p className="font-semibold text-lg">Rs. {invoice.amount.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Invoice Date</p>
                    <p className="font-medium">{new Date(invoice.invoice_date).toLocaleDateString()}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Due Date</p>
                    <p className="font-medium">{new Date(invoice.due_date).toLocaleDateString()}</p>
                  </div>
                  <div className="flex items-end justify-end">
                    <Button 
                      onClick={() => navigate(`/invoice/${invoice.id}`)}
                      variant="outline"
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      View Details
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
