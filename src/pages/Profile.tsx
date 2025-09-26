import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { User, Crown, Check, Star } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import CustomReports from '@/components/CustomReports';

interface Profile {
  id: string;
  full_name: string;
  business_name?: string;
  phone?: string;
  address?: string;
  subscription_tier: 'basic' | 'standard' | 'premium';
  subscription_expires_at?: string;
}

const subscriptionPlans = [
  {
    tier: 'basic',
    name: 'Basic',
    price: 'Free',
    features: [
      'Customer Management',
      'Mobile Inventory',
      'Sales Recording',
      'Purchase Tracking',
      'Basic Dashboard'
    ]
  },
  {
    tier: 'standard',
    name: 'Standard',
    price: 'PKR 799',
    features: [
      'Everything in Basic',
      'Advanced Reports',
      'Sales Analytics',
      'Export Data',
      'Email Support'
    ]
  },
  {
    tier: 'premium',
    name: 'Premium',
    price: 'PKR 1,499',
    features: [
      'Everything in Standard',
      'AI Assistant',
      'Predictive Analytics',
      'Priority Support',
      'Custom Reports',
      'API Access'
    ]
  }
];

export default function Profile() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [upgradeDialogOpen, setUpgradeDialogOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<string>('');
  const [formData, setFormData] = useState({
    full_name: '',
    business_name: '',
    phone: '',
    address: ''
  });

  useEffect(() => {
    if (user) {
      fetchProfile();
    }
  }, [user]);

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
    
    try {
      const { error } = await supabase
        .from('profiles')
        .update(formData)
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

  const handleUpgrade = (tier: string) => {
    setSelectedPlan(tier);
    setUpgradeDialogOpen(true);
  };

  const processFakePayment = async () => {
    // Simulate payment processing
    const paymentSuccess = Math.random() > 0.1; // 90% success rate
    
    if (paymentSuccess) {
      try {
        const expiresAt = new Date();
        expiresAt.setMonth(expiresAt.getMonth() + 1); // 1 month from now
        
        const { error } = await supabase
          .from('profiles')
          .update({
            subscription_tier: selectedPlan as 'basic' | 'standard' | 'premium',
            subscription_expires_at: expiresAt.toISOString()
          })
          .eq('user_id', user?.id);
        
        if (error) throw error;
        
        fetchProfile();
        setUpgradeDialogOpen(false);
        toast({
          title: "Payment Successful!",
          description: `You have successfully upgraded to ${selectedPlan.charAt(0).toUpperCase() + selectedPlan.slice(1)} plan.`
        });
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to update subscription",
          variant: "destructive"
        });
      }
    } else {
      toast({
        title: "Payment Failed",
        description: "Payment processing failed. Please try again.",
        variant: "destructive"
      });
    }
  };

  const getTierColor = (tier: string) => {
    switch (tier) {
      case 'basic': return 'bg-blue-500 text-white';
      case 'standard': return 'bg-green-500 text-white';
      case 'premium': return 'bg-purple-500 text-white';
      default: return 'bg-gray-500 text-white';
    }
  };

  const getPlanIcon = (tier: string) => {
    switch (tier) {
      case 'basic': return <User className="h-4 w-4" />;
      case 'standard': return <Star className="h-4 w-4" />;
      case 'premium': return <Crown className="h-4 w-4" />;
      default: return <User className="h-4 w-4" />;
    }
  };

  if (loading) return <div className="p-6">Loading profile...</div>;

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-2 mb-6">
        <User className="h-8 w-8 text-primary" />
        <h1 className="text-3xl font-bold text-foreground">Profile & Subscription</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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
                    .find(plan => plan.tier === (profile?.subscription_tier || 'basic'))
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
              <Card key={plan.tier} className={`relative ${profile?.subscription_tier === plan.tier ? 'border-primary' : ''}`}>
                {profile?.subscription_tier === plan.tier && (
                  <Badge className="absolute -top-2 left-4 bg-primary">
                    Current Plan
                  </Badge>
                )}
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    {getPlanIcon(plan.tier)}
                    {plan.name}
                  </CardTitle>
                  <div className="text-2xl font-bold">{plan.price}</div>
                  {plan.tier !== 'basic' && (
                    <p className="text-sm text-muted-foreground">per month</p>
                  )}
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
                  {profile?.subscription_tier !== plan.tier && (
                    <Button 
                      onClick={() => handleUpgrade(plan.tier)}
                      className="w-full"
                      variant={plan.tier === 'premium' ? 'default' : 'outline'}
                    >
                      {plan.tier === 'basic' ? 'Downgrade' : 'Upgrade'}
                    </Button>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Custom Reports for Premium Users */}
      {profile?.subscription_tier === 'premium' && (
        <CustomReports userSubscriptionTier={profile.subscription_tier} />
      )}

      {/* Fake Payment Dialog */}
      <Dialog open={upgradeDialogOpen} onOpenChange={setUpgradeDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Upgrade Subscription</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="p-4 bg-muted rounded-lg">
              <h3 className="font-semibold">
                {subscriptionPlans.find(p => p.tier === selectedPlan)?.name} Plan
              </h3>
              <p className="text-2xl font-bold">
                {subscriptionPlans.find(p => p.tier === selectedPlan)?.price}
                {selectedPlan !== 'basic' && <span className="text-sm font-normal">/month</span>}
              </p>
            </div>
            
            <div className="space-y-2">
              <h4 className="font-semibold">Payment Method (Demo)</h4>
              <div className="p-3 border rounded bg-yellow-50 border-yellow-200">
                <p className="text-sm text-yellow-800">
                  This is a demo payment system. No real payment will be processed.
                </p>
              </div>
            </div>
            
            <div className="flex gap-2">
              <Button 
                onClick={processFakePayment}
                className="flex-1"
              >
                Complete Payment (Demo)
              </Button>
              <Button 
                variant="outline" 
                onClick={() => setUpgradeDialogOpen(false)}
                className="flex-1"
              >
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}