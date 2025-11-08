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
import { Plus, Edit, Trash2, Smartphone, Crown } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useSubscription } from '@/hooks/useSubscription';
import { AlertDialog, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { mobileSchema } from '@/lib/validationSchemas';
import BulkInventoryImport from '@/components/BulkInventoryImport';

interface Mobile {
  id: string;
  brand: string;
  model: string;
  imei?: string;
  condition: string;
  selling_price?: number;
  notes?: string;
  is_sold: boolean;
  created_at: string;
}

export default function Inventory() {
  const { user } = useAuth();
  const { toast } = useToast();
  const { tier, features } = useSubscription();
  const [mobiles, setMobiles] = useState<Mobile[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [showUpgradeAlert, setShowUpgradeAlert] = useState(false);
  const [editingMobile, setEditingMobile] = useState<Mobile | null>(null);
  const [formData, setFormData] = useState({
    brand: '',
    model: '',
    imei: '',
    condition: 'good',
    selling_price: '',
    notes: ''
  });

  useEffect(() => {
    if (user) {
      fetchMobiles();
    }
  }, [user]);

  const fetchMobiles = async () => {
    try {
      const { data, error } = await supabase
        .from('mobiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setMobiles(data || []);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch inventory",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAddClick = () => {
    // Check if free tier can add more mobiles
    if (!features.canAddMoreMobiles(mobiles.length)) {
      setShowUpgradeAlert(true);
      return;
    }
    resetForm();
    setIsDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Double-check inventory limit before adding
    if (!editingMobile && !features.canAddMoreMobiles(mobiles.length)) {
      setShowUpgradeAlert(true);
      return;
    }

    // Validate input
    const validation = mobileSchema.safeParse(formData);
    
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
      const mobileData = {
        brand: validation.data.brand,
        model: validation.data.model,
        imei: validation.data.imei || null,
        condition: validation.data.condition as 'excellent' | 'good' | 'fair' | 'poor',
        selling_price: validation.data.selling_price ? parseFloat(validation.data.selling_price) : null,
        notes: validation.data.notes || null,
        user_id: user?.id
      };

      if (editingMobile) {
        const { error } = await supabase
          .from('mobiles')
          .update(mobileData)
          .eq('id', editingMobile.id);
        
        if (error) throw error;
        toast({ title: "Success", description: "Mobile updated successfully" });
      } else {
        const { error } = await supabase
          .from('mobiles')
          .insert([mobileData]);
        
        if (error) throw error;
        toast({ title: "Success", description: "Mobile added successfully" });
      }
      
      fetchMobiles();
      setIsDialogOpen(false);
      resetForm();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save mobile",
        variant: "destructive"
      });
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase
        .from('mobiles')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      
      fetchMobiles();
      toast({ title: "Success", description: "Mobile deleted successfully" });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete mobile",
        variant: "destructive"
      });
    }
  };

  const resetForm = () => {
    setFormData({
      brand: '',
      model: '',
      imei: '',
      condition: 'good',
      selling_price: '',
      notes: ''
    });
    setEditingMobile(null);
  };

  const openEditDialog = (mobile: Mobile) => {
    setEditingMobile(mobile);
    setFormData({
      brand: mobile.brand,
      model: mobile.model,
      imei: mobile.imei || '',
      condition: mobile.condition,
      selling_price: mobile.selling_price?.toString() || '',
      notes: mobile.notes || ''
    });
    setIsDialogOpen(true);
  };

  if (loading) return <div className="p-6">Loading...</div>;

  const availableMobiles = mobiles.filter(mobile => !mobile.is_sold);
  const soldMobiles = mobiles.filter(mobile => mobile.is_sold);

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Mobile Inventory</h1>
          <p className="text-muted-foreground mt-1">
            Available: {availableMobiles.length} | Sold: {soldMobiles.length}
            {features.maxMobiles && ` | Limit: ${mobiles.length}/${features.maxMobiles}`}
          </p>
        </div>
        <div className="flex gap-2">
          <BulkInventoryImport onImportComplete={fetchMobiles} />
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={handleAddClick}>
                <Plus className="h-4 w-4 mr-2" />
                Add Mobile
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>{editingMobile ? 'Edit Mobile' : 'Add New Mobile'}</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="brand">Brand *</Label>
                  <Input
                    id="brand"
                    value={formData.brand}
                    onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="model">Model *</Label>
                  <Input
                    id="model"
                    value={formData.model}
                    onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="imei">IMEI</Label>
                  <Input
                    id="imei"
                    value={formData.imei}
                    onChange={(e) => setFormData({ ...formData, imei: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="condition">Condition</Label>
                  <Select value={formData.condition} onValueChange={(value) => setFormData({ ...formData, condition: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="excellent">Excellent</SelectItem>
                      <SelectItem value="good">Good</SelectItem>
                      <SelectItem value="fair">Fair</SelectItem>
                      <SelectItem value="poor">Poor</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="selling_price">Selling Price</Label>
                  <Input
                    id="selling_price"
                    type="number"
                    value={formData.selling_price}
                    onChange={(e) => setFormData({ ...formData, selling_price: e.target.value })}
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
                  {editingMobile ? 'Update Mobile' : 'Add Mobile'}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {mobiles.map((mobile) => (
          <Card key={mobile.id} className={mobile.is_sold ? 'opacity-60' : ''}>
            <CardHeader>
              <CardTitle className="flex justify-between items-start">
                <div className="flex items-center gap-2">
                  <Smartphone className="h-5 w-5" />
                  <span>{mobile.brand} {mobile.model}</span>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => openEditDialog(mobile)}
                    disabled={mobile.is_sold}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleDelete(mobile.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between items-center">
                  <Badge variant={mobile.is_sold ? 'destructive' : 'default'}>
                    {mobile.is_sold ? 'Sold' : 'Available'}
                  </Badge>
                  <Badge variant="outline">
                    {mobile.condition}
                  </Badge>
                </div>
                {mobile.imei && (
                  <p><strong>IMEI:</strong> {mobile.imei}</p>
                )}
                {mobile.selling_price && (
                  <p><strong>Selling:</strong> PKR {mobile.selling_price}</p>
                )}
                {mobile.notes && (
                  <p><strong>Notes:</strong> {mobile.notes}</p>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {mobiles.length === 0 && (
        <Card>
          <CardContent className="p-6 text-center">
            <p className="text-muted-foreground">No mobiles in inventory. Add your first mobile to get started!</p>
          </CardContent>
        </Card>
      )}

      {/* Upgrade Alert Dialog */}
      <AlertDialog open={showUpgradeAlert} onOpenChange={setShowUpgradeAlert}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <Crown className="h-5 w-5 text-yellow-500" />
              Upgrade Required
            </AlertDialogTitle>
            <AlertDialogDescription>
              You've reached the limit of {features.maxMobiles} mobiles on the Free plan. 
              Upgrade to Standard or Premium to add unlimited mobiles and access more features like profit tracking, seller info, and reports!
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <Button variant="outline" onClick={() => setShowUpgradeAlert(false)}>
              Cancel
            </Button>
            <Button onClick={() => window.location.href = '/profile'}>
              View Plans
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}