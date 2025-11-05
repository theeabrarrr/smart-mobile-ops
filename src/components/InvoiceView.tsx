import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useState } from 'react';
import { toast } from 'sonner';
import { Upload, Building2, User, Calendar, DollarSign, CreditCard } from 'lucide-react';

interface Invoice {
  id: string;
  invoice_number: string;
  plan: string;
  amount: number;
  status: 'UNPAID' | 'PAID' | 'EXPIRED';
  invoice_date: string;
  due_date: string;
  transaction_id?: string;
  payment_proof_url?: string;
}

interface InvoiceViewProps {
  invoice: Invoice;
  userProfile?: { full_name: string; business_name?: string };
  onUpdate?: () => void;
}

export const InvoiceView = ({ invoice, userProfile, onUpdate }: InvoiceViewProps) => {
  const { user } = useAuth();
  const [transactionId, setTransactionId] = useState(invoice.transaction_id || '');
  const [uploading, setUploading] = useState(false);
  const [updating, setUpdating] = useState(false);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !e.target.files[0] || !user) return;

    const file = e.target.files[0];
    const fileExt = file.name.split('.').pop();
    const fileName = `${user.id}/${invoice.invoice_number}-${Date.now()}.${fileExt}`;

    setUploading(true);
    try {
      const { error: uploadError } = await supabase.storage
        .from('payment-proofs')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('payment-proofs')
        .getPublicUrl(fileName);

      const { error: updateError } = await supabase
        .from('invoices')
        .update({ payment_proof_url: publicUrl })
        .eq('id', invoice.id);

      if (updateError) throw updateError;

      toast.success('Payment proof uploaded successfully');
      onUpdate?.();
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setUploading(false);
    }
  };

  const handleTransactionSubmit = async () => {
    if (!transactionId.trim()) {
      toast.error('Please enter transaction ID');
      return;
    }

    setUpdating(true);
    try {
      const { error } = await supabase
        .from('invoices')
        .update({ transaction_id: transactionId })
        .eq('id', invoice.id);

      if (error) throw error;

      toast.success('Transaction ID saved successfully');
      onUpdate?.();
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setUpdating(false);
    }
  };

  const getStatusBadge = () => {
    const variants = {
      UNPAID: 'destructive',
      PAID: 'default',
      EXPIRED: 'secondary'
    };
    return <Badge variant={variants[invoice.status] as any}>{invoice.status}</Badge>;
  };

  const getPlanName = (plan: string) => {
    const names: Record<string, string> = {
      basic: 'Free',
      standard: 'Standard',
      premium: 'Premium'
    };
    return names[plan] || plan;
  };

  return (
    <Card className="max-w-4xl mx-auto">
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-3xl font-bold">Invoice</CardTitle>
            <p className="text-muted-foreground mt-1">{invoice.invoice_number}</p>
          </div>
          {getStatusBadge()}
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Invoice Details */}
        <div className="grid md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <User className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Billed To</p>
                <p className="font-medium">{userProfile?.full_name || 'User'}</p>
                {userProfile?.business_name && (
                  <p className="text-sm text-muted-foreground">{userProfile.business_name}</p>
                )}
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <Building2 className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">From</p>
                <p className="font-medium">MobileSales Pro</p>
                <p className="text-sm text-muted-foreground">Muhammad Abrar</p>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Invoice Date</p>
                <p className="font-medium">{new Date(invoice.invoice_date).toLocaleDateString()}</p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Due Date</p>
                <p className="font-medium">{new Date(invoice.due_date).toLocaleDateString()}</p>
              </div>
            </div>
          </div>
        </div>

        <Separator />

        {/* Plan Details */}
        <div>
          <h3 className="font-semibold mb-4">Subscription Details</h3>
          <div className="bg-muted/50 p-4 rounded-lg">
            <div className="flex justify-between items-center">
              <div>
                <p className="font-medium">{getPlanName(invoice.plan)} Plan</p>
                <p className="text-sm text-muted-foreground">30 days subscription</p>
              </div>
              <div className="flex items-center gap-2">
                <DollarSign className="h-5 w-5 text-muted-foreground" />
                <p className="text-2xl font-bold">Rs. {invoice.amount.toLocaleString()}</p>
              </div>
            </div>
          </div>
        </div>

        <Separator />

        {/* Payment Information */}
        {invoice.status === 'UNPAID' && (
          <div className="bg-primary/5 p-6 rounded-lg border border-primary/20">
            <h3 className="font-semibold mb-4 flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Payment Instructions
            </h3>
            <div className="space-y-3 text-sm">
              <div className="grid grid-cols-[120px_1fr] gap-2">
                <span className="text-muted-foreground">Account Title:</span>
                <span className="font-medium">Muhammad Abrar</span>
              </div>
              <div className="grid grid-cols-[120px_1fr] gap-2">
                <span className="text-muted-foreground">Bank Name:</span>
                <span className="font-medium">United Bank Limited (UBL)</span>
              </div>
              <div className="grid grid-cols-[120px_1fr] gap-2">
                <span className="text-muted-foreground">Account Number:</span>
                <span className="font-medium">1768327457882</span>
              </div>
              <div className="grid grid-cols-[120px_1fr] gap-2">
                <span className="text-muted-foreground">IBAN:</span>
                <span className="font-medium">PK36UNIL0109000327457882</span>
              </div>
              <div className="grid grid-cols-[120px_1fr] gap-2">
                <span className="text-muted-foreground">Mobile Wallets:</span>
                <span className="font-medium">03170446349</span>
              </div>
              <div className="grid grid-cols-[120px_1fr] gap-2">
                <span className="text-muted-foreground"></span>
                <span className="text-xs text-muted-foreground">(Easypaisa / JazzCash / SadaPay / NayaPay)</span>
              </div>
              <div className="grid grid-cols-[120px_1fr] gap-2">
                <span className="text-muted-foreground">Payment Email:</span>
                <span className="font-medium">croabrarrr@gmail.com</span>
              </div>
            </div>
            
            <div className="mt-4 p-3 bg-yellow-500/10 border border-yellow-500/20 rounded">
              <p className="text-sm font-medium">
                ⚠️ Please pay the exact amount of Rs. {invoice.amount.toLocaleString()} to activate your plan.
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                After payment, upload your payment proof or enter transaction ID below.
              </p>
            </div>
          </div>
        )}

        {/* Payment Proof Upload */}
        {invoice.status === 'UNPAID' && (
          <>
            <Separator />
            <div className="space-y-4">
              <h3 className="font-semibold">Submit Payment Proof</h3>
              
              <div className="space-y-2">
                <Label htmlFor="payment-proof">Upload Screenshot</Label>
                <div className="flex gap-2">
                  <Input
                    id="payment-proof"
                    type="file"
                    accept="image/*"
                    onChange={handleFileUpload}
                    disabled={uploading}
                  />
                  {uploading && <Button disabled><Upload className="h-4 w-4 mr-2 animate-spin" />Uploading...</Button>}
                </div>
                {invoice.payment_proof_url && (
                  <p className="text-sm text-green-600">✓ Payment proof uploaded</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="transaction-id">Transaction ID (Optional)</Label>
                <div className="flex gap-2">
                  <Input
                    id="transaction-id"
                    placeholder="Enter your transaction ID"
                    value={transactionId}
                    onChange={(e) => setTransactionId(e.target.value)}
                  />
                  <Button onClick={handleTransactionSubmit} disabled={updating}>
                    Save
                  </Button>
                </div>
              </div>

              <p className="text-sm text-muted-foreground">
                After submitting your payment proof, an admin will verify and activate your subscription within 24 hours.
              </p>
            </div>
          </>
        )}

        {/* Payment Status */}
        {invoice.status === 'PAID' && (
          <div className="bg-green-500/10 border border-green-500/20 p-4 rounded-lg">
            <p className="text-green-700 dark:text-green-400 font-medium">
              ✓ Payment Verified - Your subscription has been activated!
            </p>
            {invoice.transaction_id && (
              <p className="text-sm text-muted-foreground mt-1">
                Transaction ID: {invoice.transaction_id}
              </p>
            )}
          </div>
        )}

        {invoice.status === 'EXPIRED' && (
          <div className="bg-red-500/10 border border-red-500/20 p-4 rounded-lg">
            <p className="text-red-700 dark:text-red-400 font-medium">
              This invoice has expired. Please contact support.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
