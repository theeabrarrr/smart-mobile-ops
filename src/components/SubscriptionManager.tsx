import { useState, useEffect } from 'react';
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

interface Plan {
  id: string;
  name: string;
  price: number;
  description?: string;
  features: string[];
  icon: any;
  color: string;
}

const planFeatures = {
  basic: [
    'Up to 20 mobiles only',
    'Basic customer management',
    'Simple sales tracking',
    'Single user access',
    'Email support'
  ],
  standard: [
    'Unlimited inventory',
    'Unlimited customers',
    'Bulk import (CSV/Excel)',
    'Advanced profit tracking',
    'Detailed reports & analytics',
    'CSV/Excel export',
    'Seller tracking (CNIC/Phone)',
    'Purchase history',
    'Priority email support'
  ],
  premium: [
    'Everything in Standard',
    'AI Business Assistant',
    'Custom reports & insights',
    'Predictive analytics',
    'Smart recommendations',
    'Advanced export options',
    'Premium support (24/7)',
    'Early access to new features'
  ]
};

const planColors = {
  basic: 'bg-blue-500',
  standard: 'bg-green-500',
  premium: 'bg-purple-500'
};

const planIcons = {
  basic: Star,
  standard: Crown,
  premium: Crown
};

export default function SubscriptionManager({ currentTier, onTierChange }: SubscriptionManagerProps) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [processing, setProcessing] = useState<string | null>(null);
  const [plans, setPlans] = useState<Plan[]>([]);

  useEffect(() => {
    fetchPlans();
  }, []);

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
        features: planFeatures[plan.id as keyof typeof planFeatures] || [],
        icon: planIcons[plan.id as keyof typeof planIcons] || Star,
        color: planColors[plan.id as keyof typeof planColors] || 'bg-gray-500'
      })) || [];

      setPlans(enrichedPlans);
    } catch (error) {
      console.error('Error fetching plans:', error);
      toast({
        title: "Error",
        description: "Failed to load subscription plans",
        variant: "destructive"
      });
    }
  };

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
      // Get plan details from database
      const plan = plans.find(p => p.id === planId);
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
                <CardDescription className="text-2xl font-bold">
                  {plan.price === 0 ? 'Free' : `PKR ${plan.price.toLocaleString()}/month`}
                </CardDescription>
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