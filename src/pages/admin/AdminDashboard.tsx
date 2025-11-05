import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Users, TrendingUp, AlertTriangle, DollarSign, Package, ShoppingCart } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface AdminStats {
  totalUsers: number;
  tierBreakdown: {
    basic: number;
    standard: number;
    premium: number;
  };
  expiringCount: number;
  recentSignups: number;
  mrr: number;
  totalInventory: number;
  totalSales: number;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchStats = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('admin-stats');

      if (error) throw error;

      setStats(data);
    } catch (error: any) {
      console.error('Error fetching admin stats:', error);
      toast({
        title: 'Error',
        description: 'Failed to load admin statistics',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const triggerSubscriptionCheck = async () => {
    try {
      toast({
        title: 'Running Check',
        description: 'Checking subscriptions...',
      });

      const { data, error } = await supabase.functions.invoke('check-subscriptions');

      if (error) throw error;

      toast({
        title: 'Check Complete',
        description: `${data.downgraded_count} subscriptions downgraded, ${data.expiring_count} warnings sent`,
      });

      fetchStats();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  if (loading) {
    return <div className="p-8">Loading...</div>;
  }

  return (
    <div className="p-8 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Admin Dashboard</h1>
          <p className="text-muted-foreground">System overview and management</p>
        </div>
        <Button onClick={triggerSubscriptionCheck}>
          Run Subscription Check
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalUsers}</div>
            <p className="text-xs text-muted-foreground">
              {stats?.recentSignups} new in last 30 days
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">MRR</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${stats?.mrr}</div>
            <p className="text-xs text-muted-foreground">
              Monthly recurring revenue
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Expiring Soon</CardTitle>
            <AlertTriangle className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.expiringCount}</div>
            <p className="text-xs text-muted-foreground">
              In next 7 days
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Inventory</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalInventory}</div>
            <p className="text-xs text-muted-foreground">
              Mobile devices tracked
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Subscription Tiers</CardTitle>
            <CardDescription>User distribution across plans</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm">Free (Basic)</span>
              <span className="text-2xl font-bold">{stats?.tierBreakdown.basic}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm">Standard</span>
              <span className="text-2xl font-bold">{stats?.tierBreakdown.standard}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm">Premium</span>
              <span className="text-2xl font-bold">{stats?.tierBreakdown.premium}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>System Activity</CardTitle>
            <CardDescription>Recent platform statistics</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm flex items-center gap-2">
                <ShoppingCart className="h-4 w-4" />
                Total Sales
              </span>
              <span className="text-2xl font-bold">{stats?.totalSales}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                Recent Signups
              </span>
              <span className="text-2xl font-bold">{stats?.recentSignups}</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
