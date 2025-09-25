import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Plus, Edit, Trash2, TrendingUp } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Sale {
  id: string;
  sale_price: number;
  sale_date: string;
  payment_status: string;
  notes?: string;
  created_at: string;
  mobile_id: string;
  customer_id: string;
  mobiles: {
    brand: string;
    model: string;
  };
  customers: {
    name: string;
  };
}

interface Customer {
  id: string;
  name: string;
}

interface Mobile {
  id: string;
  brand: string;
  model: string;
  selling_price?: number;
}

export default function Sales() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [sales, setSales] = useState<Sale[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [availableMobiles, setAvailableMobiles] = useState<Mobile[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingSale, setEditingSale] = useState<Sale | null>(null);
  const [formData, setFormData] = useState({
    mobile_id: '',
    customer_id: '',
    sale_price: '',
    sale_date: new Date().toISOString().split('T')[0],
    payment_status: 'pending',
    notes: ''
  });

  useEffect(() => {
    if (user) {
      fetchSales();
      fetchCustomers();
      fetchAvailableMobiles();
    }
  }, [user]);

  const fetchSales = async () => {
    try {
      const { data, error } = await supabase
        .from('sales')
        .select(`
          *,
          mobiles(brand, model),
          customers(name)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setSales(data || []);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch sales",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchCustomers = async () => {
    try {
      const { data, error } = await supabase
        .from('customers')
        .select('id, name')
        .order('name');

      if (error) throw error;
      setCustomers(data || []);
    } catch (error) {
      console.error('Error fetching customers:', error);
    }
  };

  const fetchAvailableMobiles = async () => {
    try {
      const { data, error } = await supabase
        .from('mobiles')
        .select('id, brand, model, selling_price')
        .eq('is_sold', false)
        .order('brand');

      if (error) throw error;
      setAvailableMobiles(data || []);
    } catch (error) {
      console.error('Error fetching mobiles:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const saleData = {
        mobile_id: formData.mobile_id,
        customer_id: formData.customer_id,
        sale_price: parseFloat(formData.sale_price),
        sale_date: formData.sale_date,
        payment_status: formData.payment_status as 'pending' | 'paid' | 'partial' | 'cancelled',
        notes: formData.notes || null,
        user_id: user?.id
      };

      if (editingSale) {
        const { error } = await supabase
          .from('sales')
          .update(saleData)
          .eq('id', editingSale.id);
        
        if (error) throw error;
        toast({ title: "Success", description: "Sale updated successfully" });
      } else {
        const { error } = await supabase
          .from('sales')
          .insert([saleData]);
        
        if (error) throw error;

        // Mark mobile as sold
        await supabase
          .from('mobiles')
          .update({ is_sold: true })
          .eq('id', formData.mobile_id);
        
        toast({ title: "Success", description: "Sale recorded successfully" });
      }
      
      fetchSales();
      fetchAvailableMobiles();
      setIsDialogOpen(false);
      resetForm();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save sale",
        variant: "destructive"
      });
    }
  };

  const handleDelete = async (id: string, mobileId: string) => {
    try {
      const { error } = await supabase
        .from('sales')
        .delete()
        .eq('id', id);
      
      if (error) throw error;

      // Mark mobile as available again
      await supabase
        .from('mobiles')
        .update({ is_sold: false })
        .eq('id', mobileId);
      
      fetchSales();
      fetchAvailableMobiles();
      toast({ title: "Success", description: "Sale deleted successfully" });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete sale",
        variant: "destructive"
      });
    }
  };

  const resetForm = () => {
    setFormData({
      mobile_id: '',
      customer_id: '',
      sale_price: '',
      sale_date: new Date().toISOString().split('T')[0],
      payment_status: 'pending',
      notes: ''
    });
    setEditingSale(null);
  };

  const openEditDialog = (sale: Sale) => {
    setEditingSale(sale);
    setFormData({
      mobile_id: sale.mobile_id,
      customer_id: sale.customer_id,
      sale_price: sale.sale_price.toString(),
      sale_date: sale.sale_date,
      payment_status: sale.payment_status,
      notes: sale.notes || ''
    });
    setIsDialogOpen(true);
  };

  const handleMobileSelect = (mobileId: string) => {
    const mobile = availableMobiles.find(m => m.id === mobileId);
    setFormData({
      ...formData,
      mobile_id: mobileId,
      sale_price: mobile?.selling_price?.toString() || ''
    });
  };

  if (loading) return <div className="p-6">Loading...</div>;

  const totalSales = sales.reduce((sum, sale) => sum + sale.sale_price, 0);

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Sales</h1>
          <p className="text-muted-foreground mt-1">
            Total Sales: ₹{totalSales.toLocaleString()} | Records: {sales.length}
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetForm}>
              <Plus className="h-4 w-4 mr-2" />
              Record Sale
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingSale ? 'Edit Sale' : 'Record New Sale'}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="mobile_id">Mobile *</Label>
                <Select value={formData.mobile_id} onValueChange={handleMobileSelect} required>
                  <SelectTrigger>
                    <SelectValue placeholder="Select mobile" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableMobiles.map((mobile) => (
                      <SelectItem key={mobile.id} value={mobile.id}>
                        {mobile.brand} {mobile.model}
                        {mobile.selling_price && ` - ₹${mobile.selling_price}`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="customer_id">Customer *</Label>
                <Select value={formData.customer_id} onValueChange={(value) => setFormData({ ...formData, customer_id: value })} required>
                  <SelectTrigger>
                    <SelectValue placeholder="Select customer" />
                  </SelectTrigger>
                  <SelectContent>
                    {customers.map((customer) => (
                      <SelectItem key={customer.id} value={customer.id}>
                        {customer.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="sale_price">Sale Price *</Label>
                <Input
                  id="sale_price"
                  type="number"
                  value={formData.sale_price}
                  onChange={(e) => setFormData({ ...formData, sale_price: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label htmlFor="sale_date">Sale Date *</Label>
                <Input
                  id="sale_date"
                  type="date"
                  value={formData.sale_date}
                  onChange={(e) => setFormData({ ...formData, sale_date: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label htmlFor="payment_status">Payment Status</Label>
                <Select value={formData.payment_status} onValueChange={(value) => setFormData({ ...formData, payment_status: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="paid">Paid</SelectItem>
                    <SelectItem value="partial">Partial</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                />
              </div>
              <Button type="submit" className="w-full">
                {editingSale ? 'Update Sale' : 'Record Sale'}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {sales.map((sale) => (
          <Card key={sale.id}>
            <CardHeader>
              <CardTitle className="flex justify-between items-start">
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  <span>₹{sale.sale_price.toLocaleString()}</span>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => openEditDialog(sale)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleDelete(sale.id, sale.mobile_id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm">
                <p><strong>Mobile:</strong> {sale.mobiles.brand} {sale.mobiles.model}</p>
                <p><strong>Customer:</strong> {sale.customers.name}</p>
                <p><strong>Date:</strong> {new Date(sale.sale_date).toLocaleDateString()}</p>
                <div className="flex justify-between items-center">
                  <Badge variant={
                    sale.payment_status === 'paid' ? 'default' :
                    sale.payment_status === 'partial' ? 'secondary' : 'destructive'
                  }>
                    {sale.payment_status}
                  </Badge>
                </div>
                {sale.notes && (
                  <p><strong>Notes:</strong> {sale.notes}</p>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {sales.length === 0 && (
        <Card>
          <CardContent className="p-6 text-center">
            <p className="text-muted-foreground">No sales recorded yet. Record your first sale to get started!</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}