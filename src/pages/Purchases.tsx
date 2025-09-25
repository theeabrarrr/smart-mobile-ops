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
import { Plus, Edit, Trash2, ShoppingCart } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Purchase {
  id: string;
  purchase_price: number;
  purchase_date: string;
  supplier_name: string;
  notes?: string;
  created_at: string;
  mobile_id: string;
  mobiles: {
    brand: string;
    model: string;
  };
}

interface Mobile {
  id: string;
  brand: string;
  model: string;
}

export default function Purchases() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [mobiles, setMobiles] = useState<Mobile[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingPurchase, setEditingPurchase] = useState<Purchase | null>(null);
  const [formData, setFormData] = useState({
    mobile_id: '',
    purchase_price: '',
    purchase_date: new Date().toISOString().split('T')[0],
    supplier_name: '',
    notes: ''
  });

  useEffect(() => {
    if (user) {
      fetchPurchases();
      fetchMobiles();
    }
  }, [user]);

  const fetchPurchases = async () => {
    try {
      const { data, error } = await supabase
        .from('purchases')
        .select(`
          *,
          mobiles(brand, model)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPurchases(data || []);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch purchases",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchMobiles = async () => {
    try {
      const { data, error } = await supabase
        .from('mobiles')
        .select('id, brand, model')
        .order('brand');

      if (error) throw error;
      setMobiles(data || []);
    } catch (error) {
      console.error('Error fetching mobiles:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const purchaseData = {
        mobile_id: formData.mobile_id,
        purchase_price: parseFloat(formData.purchase_price),
        purchase_date: formData.purchase_date,
        supplier_name: formData.supplier_name,
        notes: formData.notes || null,
        user_id: user?.id
      };

      if (editingPurchase) {
        const { error } = await supabase
          .from('purchases')
          .update(purchaseData)
          .eq('id', editingPurchase.id);
        
        if (error) throw error;
        toast({ title: "Success", description: "Purchase updated successfully" });
      } else {
        const { error } = await supabase
          .from('purchases')
          .insert([purchaseData]);
        
        if (error) throw error;
        toast({ title: "Success", description: "Purchase recorded successfully" });
      }
      
      fetchPurchases();
      setIsDialogOpen(false);
      resetForm();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save purchase",
        variant: "destructive"
      });
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase
        .from('purchases')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      
      fetchPurchases();
      toast({ title: "Success", description: "Purchase deleted successfully" });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete purchase",
        variant: "destructive"
      });
    }
  };

  const resetForm = () => {
    setFormData({
      mobile_id: '',
      purchase_price: '',
      purchase_date: new Date().toISOString().split('T')[0],
      supplier_name: '',
      notes: ''
    });
    setEditingPurchase(null);
  };

  const openEditDialog = (purchase: Purchase) => {
    setEditingPurchase(purchase);
    setFormData({
      mobile_id: purchase.mobile_id,
      purchase_price: purchase.purchase_price.toString(),
      purchase_date: purchase.purchase_date,
      supplier_name: purchase.supplier_name,
      notes: purchase.notes || ''
    });
    setIsDialogOpen(true);
  };

  if (loading) return <div className="p-6">Loading...</div>;

  const totalPurchases = purchases.reduce((sum, purchase) => sum + purchase.purchase_price, 0);

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Purchases</h1>
          <p className="text-muted-foreground mt-1">
            Total Spent: ₹{totalPurchases.toLocaleString()} | Records: {purchases.length}
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetForm}>
              <Plus className="h-4 w-4 mr-2" />
              Record Purchase
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingPurchase ? 'Edit Purchase' : 'Record New Purchase'}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="mobile_id">Mobile *</Label>
                <Select value={formData.mobile_id} onValueChange={(value) => setFormData({ ...formData, mobile_id: value })} required>
                  <SelectTrigger>
                    <SelectValue placeholder="Select mobile" />
                  </SelectTrigger>
                  <SelectContent>
                    {mobiles.map((mobile) => (
                      <SelectItem key={mobile.id} value={mobile.id}>
                        {mobile.brand} {mobile.model}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="purchase_price">Purchase Price *</Label>
                <Input
                  id="purchase_price"
                  type="number"
                  value={formData.purchase_price}
                  onChange={(e) => setFormData({ ...formData, purchase_price: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label htmlFor="purchase_date">Purchase Date *</Label>
                <Input
                  id="purchase_date"
                  type="date"
                  value={formData.purchase_date}
                  onChange={(e) => setFormData({ ...formData, purchase_date: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label htmlFor="supplier_name">Supplier Name *</Label>
                <Input
                  id="supplier_name"
                  value={formData.supplier_name}
                  onChange={(e) => setFormData({ ...formData, supplier_name: e.target.value })}
                  required
                />
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
                {editingPurchase ? 'Update Purchase' : 'Record Purchase'}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {purchases.map((purchase) => (
          <Card key={purchase.id}>
            <CardHeader>
              <CardTitle className="flex justify-between items-start">
                <div className="flex items-center gap-2">
                  <ShoppingCart className="h-5 w-5" />
                  <span>₹{purchase.purchase_price.toLocaleString()}</span>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => openEditDialog(purchase)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleDelete(purchase.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm">
                <p><strong>Mobile:</strong> {purchase.mobiles.brand} {purchase.mobiles.model}</p>
                <p><strong>Supplier:</strong> {purchase.supplier_name}</p>
                <p><strong>Date:</strong> {new Date(purchase.purchase_date).toLocaleDateString()}</p>
                {purchase.notes && (
                  <p><strong>Notes:</strong> {purchase.notes}</p>
                )}
                <p className="text-muted-foreground">
                  <strong>Recorded:</strong> {new Date(purchase.created_at).toLocaleDateString()}
                </p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {purchases.length === 0 && (
        <Card>
          <CardContent className="p-6 text-center">
            <p className="text-muted-foreground">No purchases recorded yet. Record your first purchase to get started!</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}