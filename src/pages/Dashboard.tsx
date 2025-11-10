import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { Users, Smartphone, ShoppingCart, TrendingUp, DollarSign } from 'lucide-react';
import ExportData from '@/components/ExportData';
import { useSubscription } from '@/hooks/useSubscription';
import { sanitizeError } from '@/lib/errorHandling';
import { useToast } from '@/hooks/use-toast';
import { Profile } from '@/types/profile';

interface DashboardStats {
  totalCustomers: number;
  totalMobiles: number;
  totalSales: number;
  totalRevenue: number;
  totalProfit: number;
}

const Dashboard = () => {
  const { user } = useAuth();
  const { features } = useSubscription();
  const { toast } = useToast();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [stats, setStats] = useState<DashboardStats>({
    totalCustomers: 0,
    totalMobiles: 0,
    totalSales: 0,
    totalRevenue: 0,
    totalProfit: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchProfile();
      fetchStats();
    }
  }, [user]);

  const fetchProfile = async () => {
    if (!user) return;
    
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle();

    if (error) {
      if (import.meta.env.DEV) {
        console.error('[Dev] Error fetching profile:', error);
      }
      toast({
        title: "Error",
        description: sanitizeError(error, 'Fetching profile'),
        variant: "destructive"
      });
    } else if (data) {
      setProfile(data);
    } else {
      // Create profile if it doesn't exist
      const { data: newProfile, error: insertError } = await supabase
        .from('profiles')
        .insert([{
          user_id: user.id,
          full_name: user.email || 'User',
          subscription_tier: 'starter_kit'
        }])
        .select()
        .single();
      
      if (insertError) {
        if (import.meta.env.DEV) {
          console.error('[Dev] Error creating profile:', insertError);
        }
        toast({
          title: "Error",
          description: sanitizeError(insertError, 'Creating profile'),
          variant: "destructive"
        });
      } else {
        setProfile(newProfile);
      }
    }
  };

  const fetchStats = async () => {
    if (!user) return;

    try {
      // Fetch customers count
      const { count: customersCount } = await supabase
        .from('customers')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id);

      // Fetch mobiles count (available only)
      const { count: mobilesCount } = await supabase
        .from('mobiles')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('is_sold', false);

      // Fetch sales with mobile_id for profit calculation
      const { data: salesData } = await supabase
        .from('sales')
        .select('sale_price, mobile_id')
        .eq('user_id', user.id);

      // Fetch purchases for sold items only
      const soldMobileIds = salesData?.map(sale => sale.mobile_id) || [];
      
      const { data: purchasesData } = await supabase
        .from('purchases')
        .select('purchase_price, mobile_id')
        .eq('user_id', user.id)
        .in('mobile_id', soldMobileIds);

      const totalSales = salesData?.length || 0;
      const totalRevenue = salesData?.reduce((sum, sale) => sum + Number(sale.sale_price), 0) || 0;
      
      // Calculate total purchase cost for sold items only
      const purchasePriceMap = new Map(
        purchasesData?.map(p => [p.mobile_id, p.purchase_price]) || []
      );
      
      const totalPurchases = salesData?.reduce((sum, sale) => {
        return sum + (purchasePriceMap.get(sale.mobile_id) || 0);
      }, 0) || 0;
      
      const totalProfit = totalRevenue - totalPurchases;

      setStats({
        totalCustomers: customersCount || 0,
        totalMobiles: mobilesCount || 0,
        totalSales,
        totalRevenue,
        totalProfit
      });
    } catch (error) {
      if (import.meta.env.DEV) {
        console.error('[Dev] Error fetching stats:', error);
      }
      toast({
        title: "Error",
        description: sanitizeError(error, 'Fetching dashboard stats'),
        variant: "destructive"
      });
    }
    
    setLoading(false);
  };

  const getTierColor = (tier: string) => {
    switch (tier) {
      case 'basic': return 'bg-blue-500';
      case 'standard': return 'bg-green-500';
      case 'premium': return 'bg-purple-500';
      default: return 'bg-gray-500';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Loading dashboard...</div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">
              Welcome back, {profile?.full_name || user?.email}
            </h1>
            {profile?.business_name && (
              <p className="text-muted-foreground mt-1">{profile.business_name}</p>
            )}
          </div>
          <Badge 
            className={`${getTierColor(profile?.subscription_tier || 'basic')} text-white px-3 py-1`}
          >
            {profile?.subscription_tier?.toUpperCase() || 'BASIC'} PLAN
          </Badge>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Customers</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalCustomers}</div>
            <p className="text-xs text-muted-foreground">
              Registered customers
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Mobile Inventory</CardTitle>
            <Smartphone className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalMobiles}</div>
            <p className="text-xs text-muted-foreground">
              Available in stock
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Sales</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalSales}</div>
            <p className="text-xs text-muted-foreground">
              Completed transactions
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Revenue</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">PKR {stats.totalRevenue.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              Total earnings
            </p>
          </CardContent>
        </Card>

        {features.canAccessProfitLossSummary && (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total Profit <Badge variant="outline" className="ml-2">Dealer Pack+</Badge>
              </CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${stats.totalProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                PKR {stats.totalProfit.toLocaleString()}
              </div>
              <p className="text-xs text-muted-foreground">
                {stats.totalProfit >= 0 ? 'Profit' : 'Loss'}
              </p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Feature Access Based on Subscription */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>
              Common tasks and operations
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="text-sm">• Add new customer</div>
            <div className="text-sm">• Register mobile device</div>
            <div className="text-sm">• Record new sale</div>
            <div className="text-sm">• Track purchase</div>
            {profile?.subscription_tier !== 'starter_kit' && (
              <>
                <div className="text-sm text-green-600">• Expense Tracker (Dealer Pack+)</div>
                <div className="text-sm text-green-600">• Customer History (Dealer Pack+)</div>
              </>
            )}
            {profile?.subscription_tier === 'empire_plan' && (
              <>
                <div className="text-sm text-purple-600">• Advanced Analytics (Empire Plan)</div>
                <div className="text-sm text-purple-600">• Custom Reports (Empire Plan)</div>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Subscription Benefits</CardTitle>
            <CardDescription>
              Your current plan: {profile?.subscription_tier ? profile.subscription_tier.toUpperCase().replace('_', ' ') : 'STARTER KIT'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="text-sm">✓ Customer management</div>
            <div className="text-sm">✓ Basic inventory (Starter: 50 limit)</div>
            <div className="text-sm">✓ Sales tracking</div>
            {features.canAccessProfitLossSummary ? (
              <>
                <div className="text-sm text-green-600">✓ Up to 200 mobiles (Dealer Pack)</div>
                <div className="text-sm text-green-600">✓ Expense Tracker</div>
                <div className="text-sm text-green-600">✓ Customer History</div>
                <div className="text-sm text-green-600">✓ Multi-user Roles</div>
              </>
            ) : (
              <>
                <div className="text-sm text-muted-foreground">✗ Expense Tracker</div>
                <div className="text-sm text-muted-foreground">✗ Multi-user Roles</div>
                <div className="text-sm text-muted-foreground">✗ Customer History</div>
              </>
            )}
            {features.canAccessAdvancedAnalytics ? (
              <>
                <div className="text-sm text-purple-600">✓ Advanced Analytics</div>
                <div className="text-sm text-purple-600">✓ Stock Alerts</div>
                <div className="text-sm text-purple-600">✓ Custom Reports</div>
              </>
            ) : (
              <div className="text-sm text-muted-foreground">✗ Empire Plan features (AI, Bulk, Custom Reports)</div>
            )}
          </CardContent>
        </Card>

        <ExportData />
      </div>
    </div>
  );
};

export default Dashboard;