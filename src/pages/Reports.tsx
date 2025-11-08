import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { BarChart3, TrendingUp, TrendingDown, Users, Smartphone, ShoppingCart, FileText, Crown } from 'lucide-react';
import { useSubscription } from '@/hooks/useSubscription';
import { AlertDialog, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { sanitizeError } from '@/lib/errorHandling';
import { useToast } from '@/hooks/use-toast';
import { canAccessFeature } from '@/lib/subscriptionTiers';

interface ReportData {
  totalSales: number;
  totalPurchases: number;
  totalProfit: number;
  totalCustomers: number;
  totalMobiles: number;
  availableMobiles: number;
  soldMobiles: number;
  pendingPayments: number;
  recentSales: Array<{
    id: string;
    sale_price: number;
    sale_date: string;
    payment_status: string;
    mobiles: { brand: string; model: string; purchase_price: number | null };
    customers: { name: string };
  }>;
  topMobiles: Array<{
    brand: string;
    model: string;
    count: number;
  }>;
}

export default function Reports() {
  const { user } = useAuth();
  const { tier, features, loading: subscriptionLoading } = useSubscription();
  const { toast } = useToast();
  const [reportData, setReportData] = useState<ReportData>({
    totalSales: 0,
    totalPurchases: 0,
    totalProfit: 0,
    totalCustomers: 0,
    totalMobiles: 0,
    availableMobiles: 0,
    soldMobiles: 0,
    pendingPayments: 0,
    recentSales: [],
    topMobiles: []
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user || subscriptionLoading) {
      setLoading(subscriptionLoading);
      return;
    }

    if (!features.canAccessReports) {
      setLoading(false);
      return;
    }
    fetchReportData();
  }, [user, tier, subscriptionLoading, features.canAccessReports]);

  const fetchReportData = async () => {
    try {
      setLoading(true);

      // Fetch sales data
      const { data: salesData } = await supabase
        .from('sales')
        .select(`
          id,
          sale_price,
          sale_date,
          payment_status,
          mobile_id,
          mobiles(brand, model),
          customers(name)
        `)
        .order('sale_date', { ascending: false });
      
      // Fetch purchases to get purchase_price
      const { data: purchasesForPrice } = await supabase
        .from('purchases')
        .select('mobile_id, purchase_price');
      
      const purchasePriceMap = new Map(
        purchasesForPrice?.map(p => [p.mobile_id, p.purchase_price]) || []
      );

      // Fetch purchases data for cost calculation
      const { data: purchasesData } = await supabase
        .from('purchases')
        .select('purchase_price');

      // Fetch customers count
      const { count: customersCount } = await supabase
        .from('customers')
        .select('*', { count: 'exact' });

      // Fetch mobiles data
      const { data: mobilesData } = await supabase
        .from('mobiles')
        .select('is_sold, brand, model');

      const totalSales = salesData?.reduce((sum, sale) => sum + sale.sale_price, 0) || 0;
      const totalPurchases = purchasesData?.reduce((sum, purchase) => sum + purchase.purchase_price, 0) || 0;
      const totalProfit = totalSales - totalPurchases;
      
      const availableMobiles = mobilesData?.filter(mobile => !mobile.is_sold).length || 0;
      const soldMobiles = mobilesData?.filter(mobile => mobile.is_sold).length || 0;
      
      const pendingPayments = salesData?.filter(sale => sale.payment_status === 'pending').length || 0;
      
      // Enrich recent sales with purchase_price
      const enrichedSales = salesData?.map(sale => ({
        ...sale,
        mobiles: {
          ...sale.mobiles,
          purchase_price: purchasePriceMap.get(sale.mobile_id) || null
        }
      })) || [];
      
      // Get recent sales (last 5)
      const recentSales = enrichedSales.slice(0, 5);

      // Get top mobile brands/models
      const mobileCounts: { [key: string]: number } = {};
      enrichedSales.forEach(sale => {
        const key = `${sale.mobiles.brand} ${sale.mobiles.model}`;
        mobileCounts[key] = (mobileCounts[key] || 0) + 1;
      });

      const topMobiles = Object.entries(mobileCounts)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 5)
        .map(([mobile, count]) => {
          const [brand, model] = mobile.split(' ', 2);
          return { brand, model, count };
        });

      setReportData({
        totalSales,
        totalPurchases,
        totalProfit,
        totalCustomers: customersCount || 0,
        totalMobiles: mobilesData?.length || 0,
        availableMobiles,
        soldMobiles,
        pendingPayments,
        recentSales,
        topMobiles
      });
    } catch (error) {
      if (import.meta.env.DEV) {
        console.error('[Dev] Error fetching report data:', error);
      }
      toast({
        title: "Error",
        description: sanitizeError(error, 'Fetching report data'),
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-lg text-muted-foreground">Loading reports...</div>
      </div>
    );
  }

  if (!features.canAccessReports) {
    return (
      <AlertDialog open={true} onOpenChange={() => window.location.href = '/dashboard'}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <Crown className="h-5 w-5 text-yellow-500" />
              Upgrade to Standard or Premium
            </AlertDialogTitle>
            <AlertDialogDescription>
              Reports and analytics are available on Standard and Premium plans. Upgrade now to access detailed business insights, profit tracking, and data export features!
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <Button variant="outline" onClick={() => window.location.href = '/dashboard'}>
              Go Back
            </Button>
            <Button onClick={() => window.location.href = '/profile'}>
              View Plans
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-2 mb-6">
        <BarChart3 className="h-8 w-8 text-primary" />
        <h1 className="text-3xl font-bold text-foreground">
          Reports & Analytics <Badge variant="outline" className="ml-2">Standard+</Badge>
        </h1>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Sales</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">PKR {reportData.totalSales.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Revenue generated</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Purchases</CardTitle>
            <TrendingDown className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">PKR {reportData.totalPurchases.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Money spent</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Net Profit</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${reportData.totalProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              PKR {reportData.totalProfit.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              {reportData.totalProfit >= 0 ? 'Profit' : 'Loss'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Customers</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{reportData.totalCustomers}</div>
            <p className="text-xs text-muted-foreground">Total customers</p>
          </CardContent>
        </Card>
      </div>

      {/* Inventory Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Mobiles</CardTitle>
            <Smartphone className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{reportData.totalMobiles}</div>
            <p className="text-xs text-muted-foreground">In inventory</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Available</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{reportData.availableMobiles}</div>
            <p className="text-xs text-muted-foreground">Ready for sale</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Sold</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{reportData.soldMobiles}</div>
            <p className="text-xs text-muted-foreground">Completed sales</p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Sales and Top Mobiles */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Recent Sales</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {reportData.recentSales.length > 0 ? (
                reportData.recentSales.map((sale) => {
                  const profit = sale.mobiles.purchase_price !== null 
                    ? sale.sale_price - sale.mobiles.purchase_price 
                    : null;
                  const profitMargin = profit !== null && sale.mobiles.purchase_price 
                    ? (profit / sale.mobiles.purchase_price * 100).toFixed(1) 
                    : null;
                  
                  return (
                    <div key={sale.id} className="flex justify-between items-center p-3 bg-muted rounded-lg">
                      <div>
                        <p className="font-medium">{sale.mobiles.brand} {sale.mobiles.model}</p>
                        <p className="text-sm text-muted-foreground">{sale.customers.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(sale.sale_date).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-green-600">PKR {sale.sale_price.toLocaleString()}</p>
                        {profit !== null && (
                          <>
                            <p className={`text-sm font-semibold ${profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                              Profit: PKR {profit.toLocaleString()}
                            </p>
                            {profitMargin && (
                              <Badge variant={
                                parseFloat(profitMargin) > 20 ? 'default' : 
                                parseFloat(profitMargin) > 10 ? 'secondary' : 
                                'outline'
                              } className="text-xs">
                                {profitMargin}%
                              </Badge>
                            )}
                          </>
                        )}
                      </div>
                    </div>
                  );
                })
              ) : (
                <p className="text-muted-foreground text-center py-4">No sales recorded yet</p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Top Selling Mobiles</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {reportData.topMobiles.length > 0 ? (
                reportData.topMobiles.map((mobile, index) => (
                  <div key={`${mobile.brand}-${mobile.model}`} className="flex justify-between items-center p-3 bg-muted rounded-lg">
                    <div className="flex items-center gap-3">
                      <Badge variant="outline">#{index + 1}</Badge>
                      <div>
                        <p className="font-medium">{mobile.brand} {mobile.model}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <Badge>{mobile.count} sold</Badge>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-muted-foreground text-center py-4">No sales data available</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Pending Payments Alert */}
      {reportData.pendingPayments > 0 && (
        <Card className="border-orange-200 bg-orange-50">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-orange-600" />
              <div>
                <p className="font-medium text-orange-800">Pending Payments</p>
                <p className="text-sm text-orange-600">
                  You have {reportData.pendingPayments} sale(s) with pending payments that need attention.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}