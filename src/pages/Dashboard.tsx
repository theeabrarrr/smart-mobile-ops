import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { Users, Smartphone, ShoppingCart, TrendingUp } from 'lucide-react';

interface Profile {
  id: string;
  full_name: string;
  business_name?: string;
  subscription_tier: 'basic' | 'standard' | 'premium';
}

interface DashboardStats {
  totalCustomers: number;
  totalMobiles: number;
  totalSales: number;
  totalRevenue: number;
}

const Dashboard = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [stats, setStats] = useState<DashboardStats>({
    totalCustomers: 0,
    totalMobiles: 0,
    totalSales: 0,
    totalRevenue: 0
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
      .single();

    if (error) {
      console.error('Error fetching profile:', error);
    } else {
      setProfile(data);
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

      // Fetch mobiles count
      const { count: mobilesCount } = await supabase
        .from('mobiles')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id);

      // Fetch sales count and revenue
      const { data: salesData } = await supabase
        .from('sales')
        .select('sale_price')
        .eq('user_id', user.id);

      const totalSales = salesData?.length || 0;
      const totalRevenue = salesData?.reduce((sum, sale) => sum + Number(sale.sale_price), 0) || 0;

      setStats({
        totalCustomers: customersCount || 0,
        totalMobiles: mobilesCount || 0,
        totalSales,
        totalRevenue
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
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
              Devices in stock
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
            <div className="text-2xl font-bold">${stats.totalRevenue.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">
              Total earnings
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Feature Access Based on Subscription */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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
            {profile?.subscription_tier !== 'basic' && (
              <>
                <div className="text-sm text-green-600">• Generate invoice (Standard+)</div>
                <div className="text-sm text-green-600">• View monthly reports (Standard+)</div>
              </>
            )}
            {profile?.subscription_tier === 'premium' && (
              <div className="text-sm text-purple-600">• AI Assistant & Insights (Premium)</div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Subscription Benefits</CardTitle>
            <CardDescription>
              Your current plan: {profile?.subscription_tier?.toUpperCase() || 'BASIC'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="text-sm">✓ Customer management</div>
            <div className="text-sm">✓ Mobile inventory tracking</div>
            <div className="text-sm">✓ Sales & purchase records</div>
            {profile?.subscription_tier !== 'basic' ? (
              <>
                <div className="text-sm text-green-600">✓ Invoice generation</div>
                <div className="text-sm text-green-600">✓ Monthly reports</div>
              </>
            ) : (
              <>
                <div className="text-sm text-muted-foreground">✗ Invoice generation</div>
                <div className="text-sm text-muted-foreground">✗ Monthly reports</div>
              </>
            )}
            {profile?.subscription_tier === 'premium' ? (
              <div className="text-sm text-purple-600">✓ AI Assistant & Predictions</div>
            ) : (
              <div className="text-sm text-muted-foreground">✗ AI Assistant & Predictions</div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;