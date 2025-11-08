import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
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
    name: 'Free',
    price: 'Free',
    features: [
      'Up to 20 mobiles only',
      'Basic customer management',
      'Simple sales tracking',
      'No profit tracking',
      'No export or reports'
    ],
    icon: Star,
    color: 'bg-blue-500'
  },
  {
    id: 'standard',
    name: 'Standard',
    price: 'PKR 799/month',
    features: [
      'Unlimited inventory',
      'Profit tracking on dashboard',
      'Per-sale profit calculation',
      'Seller CNIC & Phone tracking',
      'Standard reports',
      'CSV data export'
    ],
    icon: Crown,
    color: 'bg-green-500'
  },
  {
    id: 'premium',
    name: 'Premium',
    price: 'PKR 1,499/month',
    features: [
      'Everything in Standard',
      'AI Business Assistant',
      'Bulk stock purchase',
      'Custom date-range reports',
      'Advanced analytics',
      'Priority support'
    ],
    icon: Crown,
    color: 'bg-purple-500'
  }
];

export default function SubscriptionManager({ currentTier, onTierChange }: SubscriptionManagerProps) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [processing, setProcessing] = useState<string | null>(null);

  const handleUpgrade = async (planId: string) => {
    if (!user) return;
    
    if (planId === 'basic') {
      toast({
        title: "Error",
        description: "Cannot downgrade to free plan. Please contact admin.",
        variant: "destructive"
      });
      return;
    }
    
    setProcessing(planId);
    
    try {
      // Get user profile for invoice
      const { data: profile } = await supabase
        .from('profiles')
        .select('full_name, business_name')
        .eq('user_id', user.id)
        .single();

      // Get plan details
      const plan = plans.find(p => p.id === planId);
      if (!plan) throw new Error('Plan not found');

      // Extract numeric price (remove commas, PKR and /month)
      const priceMatch = plan.price.replace(/,/g, '').match(/\d+/);
      const price = priceMatch ? parseInt(priceMatch[0]) : 0;

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
          amount: price,
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