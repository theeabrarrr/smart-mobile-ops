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
  currentTier: 'starter_kit' | 'dealer_pack' | 'empire_plan';
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
  starter_kit: [
    'Up to 50 mobiles per month',
    'Basic inventory management',
    'Simple sales & purchase tracking',
    'Limited customer history',
    'Single user access',
    'Email support'
  ],
  dealer_pack: [
    'Up to 200 mobiles per month',
    'Full inventory management',
    'Expense tracker',
    'Customer history tracking',
    'Multi-user roles (Admin/Staff/Viewer)',
    'Monthly profit-loss summary',
    'Purchase & sales history',
    'Auto data backup',
    'Priority email support'
  ],
  empire_plan: [
    'Unlimited mobiles',
    'Everything in Dealer Pack',
    'Advanced analytics & charts',
    'Stock alerts (low inventory)',
    'Custom report exports (CSV/PDF)',
    'Multi-branch support (coming soon)',
    'Priority support (24/7)',
    'Early access to new features'
  ]
};

const planColors = {
  starter_kit: 'bg-blue-500',
  dealer_pack: 'bg-green-500',
  empire_plan: 'bg-purple-500'
};

const planIcons = {
  starter_kit: Star,
  dealer_pack: Star,
  empire_plan: Crown
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
    
    if (planId === 'starter_kit') {
      toast({
        title: "Error",
        description: "Cannot downgrade to starter kit. Please contact admin.",
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
    <div className="space-y-8 py-8">
      <div className="text-center space-y-3">
        <h2 className="text-3xl md:text-4xl font-bold text-foreground">Simple, Transparent Pricing</h2>
        <p className="text-lg text-muted-foreground">Choose the plan that fits your needs. Upgrade, downgrade, or cancel anytime.</p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-6xl mx-auto">
        {plans.map((plan) => {
          const Icon = plan.icon;
          const isCurrentPlan = currentTier === plan.id;
          const isUpgrade = plans.findIndex(p => p.id === currentTier) < plans.findIndex(p => p.id === plan.id);
          const isMostPopular = plan.id === 'dealer_pack';
          
          return (
            <Card 
              key={plan.id} 
              className={`relative transition-all ${
                isCurrentPlan 
                  ? 'border-primary shadow-lg' 
                  : isMostPopular 
                    ? 'border-primary border-2 shadow-xl md:scale-105' 
                    : 'border-border hover:border-primary/50 hover:shadow-md'
              }`}
            >
              {isMostPopular && !isCurrentPlan && (
                <div className="absolute -top-3 left-0 right-0 flex justify-center z-10">
                  <Badge className="bg-orange-500 hover:bg-orange-500 text-white px-4 py-1 text-xs font-semibold">
                    Most Popular
                  </Badge>
                </div>
              )}
              
              {isCurrentPlan && (
                <div className="absolute -top-3 left-0 right-0 flex justify-center z-10">
                  <Badge className="bg-primary hover:bg-primary text-primary-foreground px-4 py-1 text-xs font-semibold">
                    Current Plan
                  </Badge>
                </div>
              )}
              
              <CardHeader className="text-center pb-8 pt-8">
                <CardTitle className="text-xl font-bold text-foreground mb-2">
                  {plan.name}
                </CardTitle>
                <CardDescription className="text-sm text-muted-foreground mb-4">
                  {plan.id === 'starter_kit' && 'Perfect for small mobile sellers'}
                  {plan.id === 'dealer_pack' && 'For mid-level shop owners'}
                  {plan.id === 'empire_plan' && 'For wholesalers & chains'}
                </CardDescription>
                <div className="mt-4">
                  <span className="text-4xl md:text-5xl font-bold text-foreground">
                    {plan.price === 0 ? 'PKR 0' : `PKR ${plan.price.toLocaleString()}`}
                  </span>
                  <span className="text-muted-foreground text-sm ml-1">/month</span>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-6">
                <ul className="space-y-3 min-h-[240px]">
                  {plan.features.map((feature, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <Check className="h-4 w-4 text-accent mt-0.5 flex-shrink-0" />
                      <span className="text-sm text-foreground">{feature}</span>
                    </li>
                  ))}
                </ul>
                
                {!isCurrentPlan && (
                  <Button 
                    className={`w-full ${isMostPopular ? 'bg-primary hover:bg-primary/90' : ''}`}
                    onClick={() => handleUpgrade(plan.id)}
                    disabled={!!processing}
                    variant={isUpgrade && isMostPopular ? "default" : isUpgrade ? "default" : "outline"}
                  >
                  {processing === plan.id ? 'Processing...' : 
                     plan.id === 'starter_kit' ? 'Get Started' :
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