import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Bot, Send, Sparkles, TrendingUp, Smartphone, Users } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { sanitizeError } from '@/lib/errorHandling';
import { useSubscription } from '@/hooks/useSubscription';
import { canAccessFeature, getUpgradeMessage } from '@/lib/subscriptionTiers';
import { UpgradeDialog } from '@/components/UpgradeDialog';

interface BusinessStats {
  totalSales: number;
  totalPurchases: number;
  profit: number;
  availableInventory: number;
  totalCustomers: number;
}

export default function AIAssistant() {
  const { user } = useAuth();
  const { toast } = useToast();
  const { tier } = useSubscription();
  const [messages, setMessages] = useState<Array<{role: 'user' | 'assistant', content: string}>>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [showUpgradeDialog, setShowUpgradeDialog] = useState(false);
  const [businessStats, setBusinessStats] = useState<BusinessStats>({
    totalSales: 0,
    totalPurchases: 0,
    profit: 0,
    availableInventory: 0,
    totalCustomers: 0
  });

  useEffect(() => {
    if (user) {
      fetchBusinessStats();
    }
  }, [user]);

  const fetchBusinessStats = async () => {
    try {
      // Fetch sales data
      const { data: salesData } = await supabase
        .from('sales')
        .select('sale_price')
        .eq('user_id', user?.id);

      // Fetch purchases data
      const { data: purchasesData } = await supabase
        .from('purchases')
        .select('purchase_price')
        .eq('user_id', user?.id);

      // Fetch inventory count
      const { count: inventoryCount } = await supabase
        .from('mobiles')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user?.id)
        .eq('is_sold', false);

      // Fetch customers count
      const { count: customersCount } = await supabase
        .from('customers')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user?.id);

      const totalSales = salesData?.reduce((sum, sale) => sum + Number(sale.sale_price), 0) || 0;
      const totalPurchases = purchasesData?.reduce((sum, purchase) => sum + Number(purchase.purchase_price), 0) || 0;
      const profit = totalSales - totalPurchases;

      setBusinessStats({
        totalSales,
        totalPurchases,
        profit,
        availableInventory: inventoryCount || 0,
        totalCustomers: customersCount || 0
      });
    } catch (error) {
      if (import.meta.env.DEV) {
        console.error('[Dev] Error fetching business stats:', error);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    // Check subscription for premium features
    if (!canAccessFeature(tier, 'advanced_analytics')) {
      setShowUpgradeDialog(true);
      return;
    }

    const userMessage = input.trim();
    setInput('');
    setLoading(true);

    // Add user message
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);

    try {
      const { data, error } = await supabase.functions.invoke('gemini-assistant', {
        body: { 
          prompt: userMessage,
          businessData: businessStats,
          subscriptionTier: tier,
          supportRomanUrdu: true
        }
      });

      if (error) throw error;

      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: data.response || 'Sorry, I could not generate a response. Please try again.' 
      }]);
    } catch (error) {
      if (import.meta.env.DEV) {
        console.error('[Dev] Error calling AI assistant:', error);
      }
      
      const errorMsg = sanitizeError(error, 'AI assistant call');
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: 'Sorry, I encountered an error. Please try again.' 
      }]);
      
      toast({
        title: "AI Assistant Error",
        description: errorMsg,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const hasAccess = canAccessFeature(tier, 'advanced_analytics');

  return (
    <div className="p-6 max-w-6xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
            <Bot className="h-8 w-8" />
            AI Business Assistant
            {hasAccess && (
              <Badge variant="secondary" className="ml-2">Roman Urdu Support</Badge>
            )}
          </h1>
          <p className="text-muted-foreground mt-1">
            {hasAccess 
              ? "Get AI-powered insights in English and Roman Urdu for your mobile business"
              : "AI Assistant is available for Premium plan users only"
            }
          </p>
        </div>

      {/* Business Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-green-500" />
              <div>
                <p className="text-sm font-medium">Sales</p>
                <p className="text-lg font-bold">PKR {businessStats.totalSales.toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-red-500" />
              <div>
                <p className="text-sm font-medium">Purchases</p>
                <p className="text-lg font-bold">PKR {businessStats.totalPurchases.toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-blue-500" />
              <div>
                <p className="text-sm font-medium">Profit</p>
                <p className={`text-lg font-bold ${businessStats.profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  PKR {businessStats.profit.toLocaleString()}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Smartphone className="h-4 w-4 text-purple-500" />
              <div>
                <p className="text-sm font-medium">Inventory</p>
                <p className="text-lg font-bold">{businessStats.availableInventory}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-orange-500" />
              <div>
                <p className="text-sm font-medium">Customers</p>
                <p className="text-lg font-bold">{businessStats.totalCustomers}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Suggested Questions */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-lg">Quick Questions</CardTitle>
            <CardDescription>Click to ask</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <Button variant="outline" size="sm" className="w-full text-left justify-start h-auto p-3" 
                    disabled={!hasAccess}
                    onClick={() => hasAccess ? setInput('What are my top selling mobile models and which ones should I focus on?') : setShowUpgradeDialog(true)}>
              Top selling models
            </Button>
            <Button variant="outline" size="sm" className="w-full text-left justify-start h-auto p-3"
                    disabled={!hasAccess}
                    onClick={() => hasAccess ? setInput('How can I improve my profit margins? What pricing strategies should I use?') : setShowUpgradeDialog(true)}>
              Improve profit margins
            </Button>
            <Button variant="outline" size="sm" className="w-full text-left justify-start h-auto p-3"
                    disabled={!hasAccess}
                    onClick={() => hasAccess ? setInput('What inventory should I stock next month based on my sales data?') : setShowUpgradeDialog(true)}>
              Inventory predictions
            </Button>
            <Button variant="outline" size="sm" className="w-full text-left justify-start h-auto p-3"
                    disabled={!hasAccess}
                    onClick={() => hasAccess ? setInput('Analyze my sales trends and business performance. Give me insights.') : setShowUpgradeDialog(true)}>
              Business analysis
            </Button>
            <Button variant="outline" size="sm" className="w-full text-left justify-start h-auto p-3"
                    disabled={!hasAccess}
                    onClick={() => hasAccess ? setInput('Mujhe apne business ke liye Roman Urdu mein tips chahiye') : setShowUpgradeDialog(true)}>
              Roman Urdu Business Tips
            </Button>
          </CardContent>
        </Card>

        {/* Chat Interface */}
        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5" />
              AI Business Intelligence Chat
            </CardTitle>
            <Badge variant="secondary">Powered by Google Gemini</Badge>
          </CardHeader>
          <CardContent>
            {/* Messages */}
            <div className="space-y-4 h-96 overflow-y-auto mb-4 p-4 border rounded-lg">
              {messages.length === 0 && (
                <div className="text-center text-muted-foreground">
                  <Bot className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>Ask me anything about your mobile business!</p>
                  <p className="text-sm mt-2">I can analyze your data and provide insights on sales, inventory, profits, and business strategy.</p>
                </div>
              )}
              {messages.map((message, index) => (
                <div key={index} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[80%] p-3 rounded-lg whitespace-pre-wrap ${
                    message.role === 'user' 
                      ? 'bg-primary text-primary-foreground' 
                      : 'bg-muted'
                  }`}>
                    {message.content}
                  </div>
                </div>
              ))}
              {loading && (
                <div className="flex justify-start">
                  <div className="bg-muted p-3 rounded-lg">
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                      <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Input Form */}
            <form onSubmit={handleSubmit} className="flex gap-2">
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={hasAccess 
                  ? "Ask in English or Roman Urdu about your business..." 
                  : "Upgrade to Premium to use AI Assistant..."
                }
                disabled={loading || !hasAccess}
                className="flex-1"
              />
              <Button type="submit" disabled={loading || !input.trim() || !hasAccess}>
                <Send className="h-4 w-4" />
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>

      {/* Features */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
        <Card>
          <CardContent className="p-4">
            <h3 className="font-semibold mb-2">📊 Business Analytics</h3>
            <p className="text-sm text-muted-foreground">Get insights on sales trends, profit margins, and performance metrics</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <h3 className="font-semibold mb-2">📱 Inventory Optimization</h3>
            <p className="text-sm text-muted-foreground">AI-powered recommendations for stock management and purchasing</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <h3 className="font-semibold mb-2">🎯 Market Predictions</h3>
            <p className="text-sm text-muted-foreground">Forecast demand and identify growth opportunities</p>
          </CardContent>
        </Card>
      </div>

      {/* Upgrade Dialog */}
      <UpgradeDialog
        open={showUpgradeDialog}
        onOpenChange={setShowUpgradeDialog}
        message={getUpgradeMessage(tier, 'advanced_analytics')}
      />
    </div>
  );
}