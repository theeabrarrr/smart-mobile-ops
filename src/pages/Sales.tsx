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
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Plus, Edit, Trash2, TrendingUp, Crown, Eye } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { saleSchema, customerSchema } from '@/lib/validationSchemas';
import { sanitizeError } from '@/lib/errorHandling';
import { useSubscription } from '@/hooks/useSubscription';
import { useRoleCheck } from '@/hooks/useRoleCheck';

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
    purchase_price: number | null;
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
  const { features } = useSubscription();
  const { isReadOnly, role } = useRoleCheck();
  const [sales, setSales] = useState<Sale[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [availableMobiles, setAvailableMobiles] = useState<Mobile[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingSale, setEditingSale] = useState<Sale | null>(null);
  const [formData, setFormData] = useState({
    mobile_id: '',
    customer_id: '',
    customer_name: '',
    sale_price: '',
    sale_date: new Date().toISOString().split('T')[0],
    payment_status: 'pending',
    notes: ''
  });
  const [isCustomerPopoverOpen, setIsCustomerPopoverOpen] = useState(false);
  const [newCustomerName, setNewCustomerName] = useState('');

  useEffect(() => {
    if (user) {
      fetchSales();
      fetchCustomers();
      fetchAvailableMobiles();
    }
  }, [user]);

  const fetchSales = async () => {
    try {
      // Fetch sales with customer and mobile info
      const { data, error } = await supabase
        .from('sales')
        .select(`
          *,
          mobiles(brand, model),
          customers(name)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      // Fetch purchases to get purchase_price
      const { data: purchasesData } = await supabase
        .from('purchases')
        .select('mobile_id, purchase_price');
      
      // Create a map of mobile_id to purchase_price
      const purchasePriceMap = new Map(
        purchasesData?.map(p => [p.mobile_id, p.purchase_price]) || []
      );
      
      // Merge purchase_price into sales data
      const enrichedSales = data?.map(sale => ({
        ...sale,
        mobiles: {
          ...sale.mobiles,
          purchase_price: purchasePriceMap.get(sale.mobile_id) || null
        }
      })) || [];
      
      setSales(enrichedSales);
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
      if (import.meta.env.DEV) {
        console.error('[Dev] Error fetching customers:', error);
      }
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
      if (import.meta.env.DEV) {
        console.error('[Dev] Error fetching mobiles:', error);
      }
    }
  };

  const createNewCustomer = async (customerName: string) => {
    // Validate customer name
    const validation = customerSchema.safeParse({ 
      name: customerName.trim(),
      email: '',
      phone: '',
      address: '',
      notes: ''
    });
    
    if (!validation.success) {
      const firstError = validation.error.errors[0];
      throw new Error(firstError.message);
    }
    
    try {
      const { data, error } = await supabase
        .from('customers')
        .insert([{
          name: validation.data.name,
          user_id: user?.id
        }])
        .select()
        .single();
        
      if (error) throw error;
      
      // Update customers list
      await fetchCustomers();
      
      return data.id;
    } catch (error) {
      if (import.meta.env.DEV) {
        console.error('[Dev] Error creating customer:', error);
      }
      throw error;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate input
    const validation = saleSchema.safeParse(formData);
    
    if (!validation.success) {
      const firstError = validation.error.errors[0];
      toast({
        title: "Validation Error",
        description: firstError.message,
        variant: "destructive"
      });
      return;
    }
    
    try {
      let customerId = formData.customer_id;
      
      // If no customer_id but we have a customer_name, create new customer
      if (!customerId && formData.customer_name.trim()) {
        try {
          customerId = await createNewCustomer(formData.customer_name);
        } catch (validationError) {
          toast({
            title: "Validation Error",
            description: validationError instanceof Error ? validationError.message : "Invalid customer name",
            variant: "destructive"
          });
          return;
        }
      }
      
      if (!customerId) {
        toast({
          title: "Error",
          description: "Please select or enter a customer name",
          variant: "destructive"
        });
        return;
      }
      
      const saleData = {
        mobile_id: validation.data.mobile_id,
        customer_id: customerId,
        sale_price: parseFloat(validation.data.sale_price),
        sale_date: validation.data.sale_date,
        payment_status: validation.data.payment_status as 'pending' | 'paid' | 'partial' | 'cancelled',
        notes: validation.data.notes || null,
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
      customer_name: '',
      sale_price: '',
      sale_date: new Date().toISOString().split('T')[0],
      payment_status: 'pending',
      notes: ''
    });
    setEditingSale(null);
    setNewCustomerName('');
    setIsCustomerPopoverOpen(false);
  };

  const openEditDialog = (sale: Sale) => {
    setEditingSale(sale);
    setFormData({
      mobile_id: sale.mobile_id,
      customer_id: sale.customer_id,
      customer_name: '',
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
  const totalPurchaseCost = sales.reduce((sum, sale) => sum + (sale.mobiles.purchase_price || 0), 0);
  const totalProfit = totalSales - totalPurchaseCost;

  return (
    <div className="p-6 space-y-6">
      {isReadOnly() && (
        <Alert className="border-green-500 bg-green-50 dark:bg-green-950">
          <Eye className="h-4 w-4" />
          <AlertDescription>
            You are viewing in read-only mode as a <strong className="uppercase">{role}</strong>. Contact an admin to create or edit records.
          </AlertDescription>
        </Alert>
      )}
      
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Sales</h1>
          <div className="flex gap-4 mt-1">
            <p className="text-muted-foreground">
              Total Sales: PKR {totalSales.toLocaleString()}
            </p>
            {features.canAccessProfitTracking ? (
              <p className="text-muted-foreground">
                Total Profit: <span className={totalProfit >= 0 ? 'text-green-600 font-semibold' : 'text-red-600 font-semibold'}>
                  PKR {totalProfit.toLocaleString()}
                </span>
              </p>
            ) : (
              <p className="text-muted-foreground flex items-center gap-1">
                <Crown className="h-4 w-4 text-yellow-500" />
                Profit tracking available on Dealer Pack+
              </p>
            )}
            <p className="text-muted-foreground">Records: {sales.length}</p>
          </div>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetForm} disabled={isReadOnly()}>
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
                        {mobile.selling_price && ` - PKR ${mobile.selling_price}`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="customer_id">Customer *</Label>
                <Popover open={isCustomerPopoverOpen} onOpenChange={setIsCustomerPopoverOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      aria-expanded={isCustomerPopoverOpen}
                      className="w-full justify-between"
                    >
                      {formData.customer_id
                        ? customers.find((customer) => customer.id === formData.customer_id)?.name
                        : formData.customer_name
                        ? formData.customer_name
                        : "Select or add customer..."}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-full p-0">
                    <Command>
                      <CommandInput 
                        placeholder="Search or add new customer..." 
                        value={newCustomerName}
                        onValueChange={setNewCustomerName}
                      />
                      <CommandList>
                        <CommandEmpty>
                          {newCustomerName.trim() && (
                            <div className="p-2">
                              <Button
                                variant="outline"
                                className="w-full"
                                onClick={() => {
                                  setFormData({ ...formData, customer_id: '', customer_name: newCustomerName.trim() });
                                  setIsCustomerPopoverOpen(false);
                                  setNewCustomerName('');
                                }}
                              >
                                Add "{newCustomerName.trim()}" as new customer
                              </Button>
                            </div>
                          )}
                        </CommandEmpty>
                        <CommandGroup>
                          {customers.map((customer) => (
                            <CommandItem
                              key={customer.id}
                              value={customer.name}
                              onSelect={() => {
                                setFormData({ ...formData, customer_id: customer.id, customer_name: '' });
                                setIsCustomerPopoverOpen(false);
                                setNewCustomerName('');
                              }}
                            >
                              {customer.name}
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
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
                  <span>PKR {sale.sale_price.toLocaleString()}</span>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => openEditDialog(sale)}
                    disabled={isReadOnly()}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleDelete(sale.id, sale.mobile_id)}
                    disabled={isReadOnly()}
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
                
                {/* Profit calculation and display - only for Dealer Pack+ users */}
                {features.canAccessProfitTracking && sale.mobiles.purchase_price !== null && (
                  <div className="pt-2 border-t">
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">Sale Price:</span>
                      <span className="font-medium">PKR {sale.sale_price.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">Purchase Cost:</span>
                      <span className="font-medium">PKR {sale.mobiles.purchase_price.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between font-semibold mt-1">
                      <span>Profit:</span>
                      <span className={sale.sale_price - sale.mobiles.purchase_price >= 0 ? 'text-green-600' : 'text-red-600'}>
                        PKR {(sale.sale_price - sale.mobiles.purchase_price).toLocaleString()}
                        {' '}
                        ({((sale.sale_price - sale.mobiles.purchase_price) / sale.mobiles.purchase_price * 100).toFixed(1)}%)
                      </span>
                    </div>
                    <div className="mt-1">
                      {(() => {
                        const margin = ((sale.sale_price - sale.mobiles.purchase_price) / sale.mobiles.purchase_price * 100);
                        return margin > 20 ? (
                          <Badge className="bg-green-600 text-white">High Profit</Badge>
                        ) : margin > 10 ? (
                          <Badge className="bg-yellow-600 text-white">Medium Profit</Badge>
                        ) : margin >= 0 ? (
                          <Badge className="bg-orange-600 text-white">Low Profit</Badge>
                        ) : (
                          <Badge variant="destructive">Loss</Badge>
                        );
                      })()}
                    </div>
                  </div>
                )}
                
                {/* Upgrade prompt for Free tier users */}
                {!features.canAccessProfitTracking && (
                  <div className="pt-2 border-t bg-muted p-2 rounded-lg">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Crown className="h-3 w-3 text-yellow-500" />
                      <span>Upgrade to Dealer Pack or Empire Plan to see profit tracking</span>
                    </div>
                  </div>
                )}
                
                <div className="flex justify-between items-center pt-2">
                  <Badge variant={
                    sale.payment_status === 'paid' ? 'default' :
                    sale.payment_status === 'partial' ? 'secondary' : 'destructive'
                  }>
                    {sale.payment_status}
                  </Badge>
                </div>
                {sale.notes && (
                  <p className="text-xs"><strong>Notes:</strong> {sale.notes}</p>
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