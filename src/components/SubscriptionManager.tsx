import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Check, Star, Crown } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface SubscriptionManagerProps {
  currentTier: 'basic' | 'standard' | 'premium';
  onTierChange: () => void;
}

const plans = [
  {
    id: 'basic',
    name: 'Basic',
    price: 'Free',
    features: [
      'Customer management',
      'Mobile inventory tracking',
      'Sales & purchase records',
      'Basic reports'
    ],
    icon: Star,
    color: 'bg-blue-500'
  },
  {
    id: 'standard',
    name: 'Standard',
    price: 'PKR 799',
    features: [
      'Everything in Basic',
      'Invoice generation',
      'Monthly reports',
      'Export data',
      'Priority support'
    ],
    icon: Crown,
    color: 'bg-green-500'
  },
  {
    id: 'premium',
    name: 'Premium',
    price: 'PKR 1,499',
    features: [
      'Everything in Standard',
      'AI Assistant & Predictions',
      'Advanced analytics',
      'Automated insights',
      'White-label reports'
    ],
    icon: Crown,
    color: 'bg-purple-500'
  }
];

export default function SubscriptionManager({ currentTier, onTierChange }: SubscriptionManagerProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [processing, setProcessing] = useState<string | null>(null);

  const handleUpgrade = async (planId: string) => {
    if (!user) return;
    
    setProcessing(planId);
    
    try {
      // Simulate payment processing
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Update subscription tier
      const { error } = await supabase
        .from('profiles')
        .update({ 
          subscription_tier: planId as 'basic' | 'standard' | 'premium',
          subscription_expires_at: planId !== 'basic' ? 
            new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() : null
        })
        .eq('user_id', user.id);

      if (error) throw error;

      toast({
        title: "Subscription Updated!",
        description: `Successfully upgraded to ${planId} plan`,
      });
      
      onTierChange();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update subscription",
        variant: "destructive"
      });
    } finally {
      setProcessing(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold">Choose Your Plan</h2>
        <p className="text-muted-foreground mt-2">Upgrade your mobile business management experience</p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {plans.map((plan) => {
          const Icon = plan.icon;
          const isCurrentPlan = currentTier === plan.id;
          const isUpgrade = plans.findIndex(p => p.id === currentTier) < plans.findIndex(p => p.id === plan.id);
          
          return (
            <Card key={plan.id} className={`relative ${isCurrentPlan ? 'ring-2 ring-primary' : ''}`}>
              {isCurrentPlan && (
                <Badge className="absolute -top-2 left-1/2 -translate-x-1/2 bg-primary">
                  Current Plan
                </Badge>
              )}
              
              <CardHeader className="text-center">
                <div className={`w-12 h-12 ${plan.color} rounded-full flex items-center justify-center mx-auto mb-4`}>
                  <Icon className="h-6 w-6 text-white" />
                </div>
                <CardTitle>{plan.name}</CardTitle>
                <CardDescription className="text-2xl font-bold">{plan.price}</CardDescription>
              </CardHeader>
              
              <CardContent className="space-y-4">
                <ul className="space-y-2">
                  {plan.features.map((feature, index) => (
                    <li key={index} className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-green-500" />
                      <span className="text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>
                
                {!isCurrentPlan && (
                  <Button 
                    className="w-full"
                    onClick={() => handleUpgrade(plan.id)}
                    disabled={!!processing}
                    variant={isUpgrade ? "default" : "outline"}
                  >
                    {processing === plan.id ? 'Processing...' : 
                     isUpgrade ? `Upgrade to ${plan.name}` : `Switch to ${plan.name}`}
                  </Button>
                )}
                
                {isCurrentPlan && (
                  <Button className="w-full" disabled variant="secondary">
                    Current Plan
                  </Button>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}