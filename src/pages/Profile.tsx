import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { User, Crown, Check, Star } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import CustomReports from '@/components/CustomReports';
import { profileSchema } from '@/lib/validationSchemas';
import { useNavigate } from 'react-router-dom';
import { Profile as ProfileType } from '@/types/profile';

interface SubscriptionPlan {
  id: string;
  name: string;
  price: number;
  description?: string;
  features: string[];
}

const planFeatures = {
  starter_kit: [
    'Basic sales, purchase & inventory management',
    'Limit: 50 mobiles/month',
    'Single user access',
    'Simple dashboard',
    'Ideal for small mobile sellers'
  ],
  dealer_pack: [
    'All Starter Kit features',
    'Limit: 200 mobiles/month',
    'Expense tracker',
    'Customer history',
    'Multi-user roles (Admin, Staff, Viewer)',
    'Monthly profit-loss summary',
    'Smart notifications for due payments or low stock'
  ],
  empire_plan: [
    'Unlimited mobiles',
    'Everything in Dealer Pack',
    'Advanced analytics & visual reports',
    'Stock alerts (low inventory)',
    'Custom report exports (CSV/PDF)',
    'Multi-branch support (coming soon)',
    'Priority support (24/7)',
    'Early access to new features'
  ]
};

export default function Profile() {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<ProfileType | null>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [subscriptionPlans, setSubscriptionPlans] = useState<SubscriptionPlan[]>([]);
  const [formData, setFormData] = useState({
    full_name: '',
    business_name: '',
    phone: '',
    address: ''
  });

  useEffect(() => {
    if (user) {
      fetchProfile();
      fetchPlans();
    }
  }, [user]);

  const fetchPlans = async () => {
    try {
      const { data, error } = await supabase
        .from('subscription_plans')
        .select('*')
        .order('price', { ascending: true });

      if (error) throw error;

      const enrichedPlans = data?.map(plan => ({
        id: plan.id,
        name: plan.name,
        price: plan.price,
        description: plan.description,
        features: planFeatures[plan.id as keyof typeof planFeatures] || []
      })) || [];

      setSubscriptionPlans(enrichedPlans);
    } catch (error) {
      console.error('Error fetching plans:', error);
    }
  };

  const fetchProfile = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user?.id)
        .maybeSingle();

      if (error) throw error;
      
      if (data) {
        setProfile(data);
        setFormData({
          full_name: data.full_name || '',
          business_name: data.business_name || '',
          phone: data.phone || '',
          address: data.address || ''
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch profile",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate input
    const validation = profileSchema.safeParse(formData);
    
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
      const { error } = await supabase
        .from('profiles')
        .update(validation.data)
        .eq('user_id', user?.id);
      
      if (error) throw error;
      
      fetchProfile();
      toast({
        title: "Success",
        description: "Profile updated successfully"
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update profile",
        variant: "destructive"
      });
    }
  };

  const handleUpgrade = async (planId: string) => {
    if (!user) return;
    
    setProcessing(true);
    
    try {
      const plan = subscriptionPlans.find(p => p.id === planId);
      if (!plan) throw new Error('Plan not found');

      // Generate invoice number using RPC
      const { data: invoiceNumber, error: invoiceNumberError } = await supabase
        .rpc('generate_invoice_number');

      if (invoiceNumberError) throw invoiceNumberError;

      // Create invoice
      const dueDate = new Date();
      dueDate.setDate(dueDate.getDate() + 3); // 3 days to pay

      const { data: invoice, error: invoiceError } = await supabase
        .from('invoices')
        .insert({
          invoice_number: invoiceNumber,
          user_id: user.id,
          plan: planId,
          amount: plan.price,
          status: 'UNPAID',
          due_date: dueDate.toISOString()
        })
        .select()
        .single();

      if (invoiceError) throw invoiceError;

      toast({
        title: "Invoice Generated!",
        description: "Please complete payment to activate your plan.",
      });
      
      // Navigate to invoice page
      navigate(`/invoice/${invoice.id}`);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || 'Failed to create invoice',
        variant: "destructive"
      });
    } finally {
      setProcessing(false);
    }
  };

  const getTierColor = (tier: string) => {
    switch (tier) {
      case 'starter_kit': return 'bg-blue-500 text-white';
      case 'dealer_pack': return 'bg-green-500 text-white';
      case 'empire_plan': return 'bg-purple-500 text-white';
      default: return 'bg-gray-500 text-white';
    }
  };

  const getPlanIcon = (tier: string) => {
    switch (tier) {
      case 'starter_kit': return <User className="h-4 w-4" />;
      case 'dealer_pack': return <Star className="h-4 w-4" />;
      case 'empire_plan': return <Crown className="h-4 w-4" />;
      default: return <User className="h-4 w-4" />;
    }
  };

  if (loading) return <div className="p-6">Loading profile...</div>;

  return (
    <div className="space-y-4 md:space-y-6">
      <div className="flex items-center gap-2 mb-4 md:mb-6">
        <User className="h-6 w-6 md:h-8 md:w-8 text-primary" />
        <h1 className="text-2xl md:text-3xl font-bold text-foreground">Profile & Subscription</h1>
      </div>

      <div className="grid gap-4 md:gap-6 grid-cols-1 lg:grid-cols-2">
        {/* Profile Information */}
        <Card>
          <CardHeader>
            <CardTitle>Profile Information</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleUpdateProfile} className="space-y-4">
              <div>
                <Label htmlFor="full_name">Full Name *</Label>
                <Input
                  id="full_name"
                  value={formData.full_name}
                  onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label htmlFor="business_name">Business Name</Label>
                <Input
                  id="business_name"
                  value={formData.business_name}
                  onChange={(e) => setFormData({ ...formData, business_name: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="address">Address</Label>
                <Textarea
                  id="address"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                />
              </div>
              <Button type="submit" className="w-full">
                Update Profile
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Current Subscription */}
        <Card>
          <CardHeader>
            <CardTitle>Current Subscription</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <Badge className={getTierColor(profile?.subscription_tier || 'basic')}>
                  {getPlanIcon(profile?.subscription_tier || 'basic')}
                  <span className="ml-1">
                    {(profile?.subscription_tier || 'basic').toUpperCase()}
                  </span>
                </Badge>
              </div>
              
              {profile?.subscription_expires_at && (
                <p className="text-sm text-muted-foreground">
                  Expires: {new Date(profile.subscription_expires_at).toLocaleDateString()}
                </p>
              )}
              
              <div className="space-y-2">
                <h4 className="font-semibold">Current Plan Features:</h4>
                <ul className="text-sm space-y-1">
                  {subscriptionPlans
                    .find(plan => plan.id === (profile?.subscription_tier || 'basic'))
                    ?.features.map((feature, index) => (
                      <li key={index} className="flex items-center gap-2">
                        <Check className="h-4 w-4 text-green-600" />
                        {feature}
                      </li>
                    ))}
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Subscription Plans */}
      <Card>
        <CardHeader>
          <CardTitle>Subscription Plans</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {subscriptionPlans.map((plan) => (
              <Card key={plan.id} className={`relative ${profile?.subscription_tier === plan.id ? 'border-primary' : ''}`}>
                {profile?.subscription_tier === plan.id && (
                  <Badge className="absolute -top-2 left-4 bg-primary">
                    Current Plan
                  </Badge>
                )}
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    {getPlanIcon(plan.id)}
                    {plan.name}
                  </CardTitle>
                  <div className="text-2xl font-bold">
                    {plan.price === 0 ? 'Free' : `PKR ${plan.price.toLocaleString()}`}
                    {plan.price !== 0 && <span className="text-sm text-muted-foreground ml-1">/month</span>}
                  </div>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2 mb-4">
                    {plan.features.map((feature, index) => (
                      <li key={index} className="flex items-center gap-2 text-sm">
                        <Check className="h-4 w-4 text-green-600" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                  {profile?.subscription_tier !== plan.id && (
                    <Button 
                      onClick={() => handleUpgrade(plan.id)}
                      className="w-full"
                      variant={plan.id === 'premium' ? 'default' : 'outline'}
                      disabled={processing}
                    >
                      {processing ? 'Processing...' : (plan.id === 'basic' ? 'Contact Admin' : 'Upgrade')}
                    </Button>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Custom Reports for Premium Users */}
      {profile?.subscription_tier === 'empire_plan' && (
        <CustomReports userSubscriptionTier={profile.subscription_tier} />
      )}
    </div>
  );
}