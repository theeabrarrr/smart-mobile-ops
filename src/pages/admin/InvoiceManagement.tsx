import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { FileText, Eye, Edit, Trash2, Search, ExternalLink } from 'lucide-react';

interface Invoice {
  id: string;
  invoice_number: string;
  user_id: string;
  plan: string;
  amount: number;
  status: 'UNPAID' | 'PAID' | 'EXPIRED';
  invoice_date: string;
  due_date: string;
  transaction_id?: string;
  payment_proof_url?: string;
  created_at: string;
}

interface UserProfile {
  user_id: string;
  full_name: string;
  business_name?: string;
}

export default function InvoiceManagement() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [profiles, setProfiles] = useState<Record<string, UserProfile>>({});
  const [loading, setLoading] = useState(true);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [newStatus, setNewStatus] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchInvoices();
  }, []);

  const fetchInvoices = async () => {
    try {
      const { data: invoicesData, error: invoicesError } = await supabase
        .from('invoices')
        .select('*')
        .order('created_at', { ascending: false });

      if (invoicesError) throw invoicesError;

      setInvoices(invoicesData || []);

      // Fetch user profiles
      const userIds = [...new Set(invoicesData?.map(inv => inv.user_id) || [])];
      const { data: profilesData } = await supabase
        .from('profiles')
        .select('user_id, full_name, business_name')
        .in('user_id', userIds);

      const profilesMap: Record<string, UserProfile> = {};
      profilesData?.forEach(profile => {
        profilesMap[profile.user_id] = profile;
      });
      setProfiles(profilesMap);
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async () => {
    if (!selectedInvoice || !newStatus) return;

    try {
      const { error } = await supabase
        .from('invoices')
        .update({ 
          status: newStatus as 'UNPAID' | 'PAID' | 'EXPIRED',
          verified_by: (await supabase.auth.getUser()).data.user?.id
        })
        .eq('id', selectedInvoice.id);

      if (error) throw error;

      toast.success('Invoice status updated successfully');
      setEditDialogOpen(false);
      fetchInvoices();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this invoice?')) return;

    try {
      const { error } = await supabase
        .from('invoices')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast.success('Invoice deleted successfully');
      fetchInvoices();
    } catch (error: any) {
      toast.error(error.message);
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

  const filteredInvoices = invoices.filter(invoice => {
    const profile = profiles[invoice.user_id];
    const searchLower = searchTerm.toLowerCase();
    return (
      invoice.invoice_number.toLowerCase().includes(searchLower) ||
      profile?.full_name.toLowerCase().includes(searchLower) ||
      invoice.plan.toLowerCase().includes(searchLower)
    );
  });

  if (loading) {
    return (
      <div className="container mx-auto p-6 space-y-4">
        <Skeleton className="h-12 w-64" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <FileText className="h-8 w-8" />
            Invoice Management
          </h1>
          <p className="text-muted-foreground mt-1">
            Manage and verify subscription invoices
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by invoice number, user name, or plan..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Invoice #</TableHead>
                <TableHead>User</TableHead>
                <TableHead>Plan</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Payment Proof</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredInvoices.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                    No invoices found
                  </TableCell>
                </TableRow>
              ) : (
                filteredInvoices.map((invoice) => {
                  const profile = profiles[invoice.user_id];
                  return (
                    <TableRow key={invoice.id}>
                      <TableCell className="font-medium">{invoice.invoice_number}</TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{profile?.full_name || 'Unknown'}</p>
                          {profile?.business_name && (
                            <p className="text-xs text-muted-foreground">{profile.business_name}</p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>{getPlanName(invoice.plan)}</TableCell>
                      <TableCell>Rs. {invoice.amount.toLocaleString()}</TableCell>
                      <TableCell>{getStatusBadge(invoice.status)}</TableCell>
                      <TableCell>{new Date(invoice.invoice_date).toLocaleDateString()}</TableCell>
                      <TableCell>
                        {invoice.payment_proof_url ? (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => window.open(invoice.payment_proof_url, '_blank')}
                          >
                            <ExternalLink className="h-3 w-3 mr-1" />
                            View
                          </Button>
                        ) : (
                          <span className="text-muted-foreground text-sm">No proof</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setSelectedInvoice(invoice);
                              setNewStatus(invoice.status);
                              setEditDialogOpen(true);
                            }}
                          >
                            <Edit className="h-3 w-3" />
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleDelete(invoice.id)}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Edit Status Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Update Invoice Status</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground">Invoice: {selectedInvoice?.invoice_number}</p>
              <p className="text-sm text-muted-foreground">
                User: {selectedInvoice ? profiles[selectedInvoice.user_id]?.full_name : ''}
              </p>
              {selectedInvoice?.transaction_id && (
                <p className="text-sm text-muted-foreground">
                  Transaction ID: {selectedInvoice.transaction_id}
                </p>
              )}
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Status</label>
              <Select value={newStatus} onValueChange={setNewStatus}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="UNPAID">UNPAID</SelectItem>
                  <SelectItem value="PAID">PAID</SelectItem>
                  <SelectItem value="EXPIRED">EXPIRED</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {newStatus === 'PAID' && (
              <div className="bg-green-500/10 border border-green-500/20 p-3 rounded">
                <p className="text-sm text-green-700 dark:text-green-400">
                  ⚠️ Marking as PAID will automatically activate the user's subscription
                </p>
              </div>
            )}

            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleStatusUpdate}>
                Update Status
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
