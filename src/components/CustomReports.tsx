import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, FileText, TrendingUp, Users, Smartphone } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { sanitizeError } from '@/lib/errorHandling';

interface CustomReportsProps {
  userSubscriptionTier: string;
}

export default function CustomReports({ userSubscriptionTier }: CustomReportsProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [reportType, setReportType] = useState('');
  const [dateRange, setDateRange] = useState<{ from: Date | undefined; to: Date | undefined }>({
    from: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
    to: new Date()
  });
  const [loading, setLoading] = useState(false);
  const [reportData, setReportData] = useState<any>(null);

  const canUseCustomReports = userSubscriptionTier === 'premium';

  const generateReport = async () => {
    if (!canUseCustomReports) {
      toast({
        title: "Premium Feature",
        description: "Custom reports are available for Premium plan users only.",
        variant: "destructive"
      });
      return;
    }

    if (!reportType) {
      toast({
        title: "Select Report Type",
        description: "Please select what type of report you want to generate.",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      let data;
      const fromDate = dateRange.from?.toISOString().split('T')[0];
      const toDate = dateRange.to?.toISOString().split('T')[0];

      switch (reportType) {
        case 'sales-analysis':
          data = await generateSalesAnalysisReport(fromDate, toDate);
          break;
        case 'profit-analysis':
          data = await generateProfitAnalysisReport(fromDate, toDate);
          break;
        case 'customer-insights':
          data = await generateCustomerInsightsReport(fromDate, toDate);
          break;
        case 'inventory-turnover':
          data = await generateInventoryTurnoverReport(fromDate, toDate);
          break;
        default:
          throw new Error('Invalid report type');
      }

      setReportData(data);
      toast({
        title: "Report Generated",
        description: "Custom report has been generated successfully."
      });
    } catch (error) {
      if (import.meta.env.DEV) {
        console.error('[Dev] Report generation error:', error);
      }
      toast({
        title: "Report Generation Failed",
        description: sanitizeError(error, 'Report generation'),
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const generateSalesAnalysisReport = async (fromDate?: string, toDate?: string) => {
    const query = supabase
      .from('sales')
      .select(`
        *,
        mobiles(brand, model, selling_price),
        customers(name)
      `)
      .eq('user_id', user?.id);

    if (fromDate) query.gte('sale_date', fromDate);
    if (toDate) query.lte('sale_date', toDate);

    const { data: salesData } = await query.order('sale_date', { ascending: false });

    if (!salesData) return null;

    const totalSales = salesData.length;
    const totalRevenue = salesData.reduce((sum, sale) => sum + Number(sale.sale_price), 0);
    const avgSaleValue = totalSales > 0 ? totalRevenue / totalSales : 0;

    const brandAnalysis = salesData.reduce((acc: any, sale) => {
      const brand = sale.mobiles?.brand || 'Unknown';
      if (!acc[brand]) {
        acc[brand] = { count: 0, revenue: 0 };
      }
      acc[brand].count += 1;
      acc[brand].revenue += Number(sale.sale_price);
      return acc;
    }, {});

    const paymentStatusAnalysis = salesData.reduce((acc: any, sale) => {
      const status = sale.payment_status;
      acc[status] = (acc[status] || 0) + 1;
      return acc;
    }, {});

    return {
      type: 'Sales Analysis',
      period: `${fromDate} to ${toDate}`,
      summary: {
        totalSales,
        totalRevenue,
        avgSaleValue
      },
      brandAnalysis,
      paymentStatusAnalysis,
      topSales: salesData.slice(0, 5)
    };
  };

  const generateProfitAnalysisReport = async (fromDate?: string, toDate?: string) => {
    // Get sales data
    const salesQuery = supabase
      .from('sales')
      .select(`
        sale_price,
        sale_date,
        mobile_id,
        mobiles(brand, model)
      `)
      .eq('user_id', user?.id);

    if (fromDate) salesQuery.gte('sale_date', fromDate);
    if (toDate) salesQuery.lte('sale_date', toDate);

    const { data: sales } = await salesQuery;
    
    // Fetch purchases to get purchase_price
    const { data: purchasesForPrice } = await supabase
      .from('purchases')
      .select('mobile_id, purchase_price')
      .eq('user_id', user?.id);
    
    const purchasePriceMap = new Map(
      purchasesForPrice?.map(p => [p.mobile_id, p.purchase_price]) || []
    );
    
    // Enrich sales with purchase_price
    const salesData = sales?.map(sale => ({
      ...sale,
      mobiles: {
        ...sale.mobiles,
        purchase_price: purchasePriceMap.get(sale.mobile_id) || 0
      }
    })) || [];

    // Get purchases data for cost calculation
    const purchasesQuery = supabase
      .from('purchases')
      .select('purchase_price, purchase_date')
      .eq('user_id', user?.id);

    if (fromDate) purchasesQuery.gte('purchase_date', fromDate);
    if (toDate) purchasesQuery.lte('purchase_date', toDate);

    const { data: purchasesData } = await purchasesQuery;

    const totalRevenue = salesData.reduce((sum, sale) => sum + Number(sale.sale_price), 0);
    const totalCosts = purchasesData?.reduce((sum, purchase) => sum + Number(purchase.purchase_price), 0) || 0;
    const grossProfit = totalRevenue - totalCosts;
    const profitMargin = totalRevenue > 0 ? (grossProfit / totalRevenue) * 100 : 0;

    // Calculate per-sale profitability
    const salesWithProfit = salesData.map(sale => {
      const purchasePrice = sale.mobiles.purchase_price || 0;
      const profit = Number(sale.sale_price) - purchasePrice;
      const margin = purchasePrice > 0 ? (profit / purchasePrice) * 100 : 0;
      return {
        ...sale,
        profit,
        margin,
        purchasePrice
      };
    });
    
    // Sort by profit to find most and least profitable
    const sortedByProfit = [...salesWithProfit].sort((a, b) => b.profit - a.profit);
    const mostProfitable = sortedByProfit.slice(0, 5);
    const leastProfitable = sortedByProfit.slice(-5).reverse();
    const lowMarginSales = salesWithProfit.filter(s => s.margin < 10 && s.margin >= 0);

    return {
      type: 'Profit Analysis',
      period: `${fromDate} to ${toDate}`,
      summary: {
        totalRevenue,
        totalCosts,
        grossProfit,
        profitMargin,
        avgProfitPerSale: salesWithProfit.length > 0 ? salesWithProfit.reduce((sum, s) => sum + s.profit, 0) / salesWithProfit.length : 0,
        lowMarginSalesCount: lowMarginSales.length
      },
      mostProfitable,
      leastProfitable,
      lowMarginSales: lowMarginSales.slice(0, 10),
      salesData: salesWithProfit.slice(0, 10),
      purchasesData: purchasesData?.slice(0, 10)
    };
  };

  const generateCustomerInsightsReport = async (fromDate?: string, toDate?: string) => {
    const query = supabase
      .from('sales')
      .select(`
        customer_id,
        sale_price,
        sale_date,
        customers(name, email, phone)
      `)
      .eq('user_id', user?.id);

    if (fromDate) query.gte('sale_date', fromDate);
    if (toDate) query.lte('sale_date', toDate);

    const { data: salesData } = await query;

    const customerAnalysis = salesData?.reduce((acc: any, sale) => {
      const customerId = sale.customer_id;
      if (!acc[customerId]) {
        acc[customerId] = {
          name: sale.customers?.name || 'Unknown',
          email: sale.customers?.email,
          phone: sale.customers?.phone,
          totalPurchases: 0,
          totalSpent: 0,
          lastPurchase: sale.sale_date
        };
      }
      acc[customerId].totalPurchases += 1;
      acc[customerId].totalSpent += Number(sale.sale_price);
      if (sale.sale_date > acc[customerId].lastPurchase) {
        acc[customerId].lastPurchase = sale.sale_date;
      }
      return acc;
    }, {});

    const topCustomers = Object.values(customerAnalysis || {})
      .sort((a: any, b: any) => b.totalSpent - a.totalSpent)
      .slice(0, 10);

    return {
      type: 'Customer Insights',
      period: `${fromDate} to ${toDate}`,
      summary: {
        totalCustomers: Object.keys(customerAnalysis || {}).length,
        totalSales: salesData?.length || 0
      },
      topCustomers,
      customerAnalysis
    };
  };

  const generateInventoryTurnoverReport = async (fromDate?: string, toDate?: string) => {
    // Get all mobiles
    const { data: mobilesData } = await supabase
      .from('mobiles')
      .select('*')
      .eq('user_id', user?.id);

    // Get sales in the period
    const salesQuery = supabase
      .from('sales')
      .select(`
        mobile_id,
        sale_date,
        mobiles(brand, model)
      `)
      .eq('user_id', user?.id);

    if (fromDate) salesQuery.gte('sale_date', fromDate);
    if (toDate) salesQuery.lte('sale_date', toDate);

    const { data: salesData } = await salesQuery;

    // Get purchases to check purchase dates
    const { data: purchasesData } = await supabase
      .from('purchases')
      .select('mobile_id, purchase_date')
      .eq('user_id', user?.id);
    
    const purchaseDateMap = new Map(
      purchasesData?.map(p => [p.mobile_id, p.purchase_date]) || []
    );

    const soldMobiles = new Set(salesData?.map(sale => sale.mobile_id));
    const availableMobiles = mobilesData?.filter(mobile => !mobile.is_sold) || [];
    const slowMovingInventory = availableMobiles.filter(mobile => {
      const purchaseDate = purchaseDateMap.get(mobile.id);
      const daysSincePurchase = purchaseDate 
        ? Math.floor((new Date().getTime() - new Date(purchaseDate).getTime()) / (1000 * 60 * 60 * 24))
        : 0;
      return daysSincePurchase > 30;
    });

    return {
      type: 'Inventory Turnover',
      period: `${fromDate} to ${toDate}`,
      summary: {
        totalInventory: mobilesData?.length || 0,
        soldInPeriod: salesData?.length || 0,
        availableInventory: availableMobiles.length,
        slowMovingItems: slowMovingInventory.length
      },
      slowMovingInventory: slowMovingInventory.slice(0, 10),
      salesData: salesData?.slice(0, 10)
    };
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Custom Reports
            {canUseCustomReports && (
              <Badge variant="secondary">Premium</Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {!canUseCustomReports && (
            <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-sm text-yellow-800">
                🔒 Custom reports are available for Premium plan users only.
              </p>
            </div>
          )}
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium">Report Type</label>
              <Select value={reportType} onValueChange={setReportType} disabled={!canUseCustomReports}>
                <SelectTrigger>
                  <SelectValue placeholder="Select report type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="sales-analysis">Sales Analysis</SelectItem>
                  <SelectItem value="profit-analysis">Profit Analysis</SelectItem>
                  <SelectItem value="customer-insights">Customer Insights</SelectItem>
                  <SelectItem value="inventory-turnover">Inventory Turnover</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <label className="text-sm font-medium">Date Range</label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" disabled={!canUseCustomReports} className="w-full justify-start text-left font-normal">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dateRange.from ? (
                      dateRange.to ? (
                        <>
                          {format(dateRange.from, "LLL dd, y")} -{" "}
                          {format(dateRange.to, "LLL dd, y")}
                        </>
                      ) : (
                        format(dateRange.from, "LLL dd, y")
                      )
                    ) : (
                      <span>Pick a date range</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    initialFocus
                    mode="range"
                    defaultMonth={dateRange.from}
                    selected={dateRange}
                    onSelect={(range) => setDateRange({ from: range?.from, to: range?.to })}
                    numberOfMonths={2}
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>
          
          <Button 
            onClick={generateReport} 
            disabled={loading || !canUseCustomReports}
            className="w-full"
          >
            {loading ? 'Generating Report...' : 'Generate Custom Report'}
          </Button>
        </CardContent>
      </Card>

      {reportData && (
        <Card>
          <CardHeader>
            <CardTitle>{reportData.type}</CardTitle>
            <p className="text-sm text-muted-foreground">Period: {reportData.period}</p>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {Object.entries(reportData.summary).map(([key, value]: [string, any]) => (
                  <div key={key} className="p-3 bg-muted rounded-lg">
                    <p className="text-sm font-medium capitalize">{key.replace(/([A-Z])/g, ' $1')}</p>
                    <p className="text-lg font-bold">
                      {typeof value === 'number' && key.includes('revenue') || key.includes('cost') || key.includes('profit') 
                        ? `PKR ${value.toLocaleString()}` 
                        : typeof value === 'number' && key.includes('margin')
                        ? `${value.toFixed(2)}%`
                        : value
                      }
                    </p>
                  </div>
                ))}
              </div>
              
              {/* Most Profitable Sales */}
              {reportData.mostProfitable && (
                <div>
                  <h4 className="font-semibold mb-2 flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-green-600" />
                    Most Profitable Sales
                  </h4>
                  <div className="space-y-2">
                    {reportData.mostProfitable.map((sale: any, index: number) => (
                      <div key={index} className="flex justify-between items-center p-2 bg-muted rounded">
                        <div>
                          <span className="font-medium">{sale.mobiles?.brand} {sale.mobiles?.model}</span>
                          <p className="text-xs text-muted-foreground">{new Date(sale.sale_date).toLocaleDateString()}</p>
                        </div>
                        <div className="text-right">
                          <div className="font-semibold text-green-600">PKR {sale.profit.toLocaleString()}</div>
                          <Badge variant="default" className="text-xs">{sale.margin.toFixed(1)}%</Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Low Margin Sales Alert */}
              {reportData.lowMarginSales && reportData.lowMarginSales.length > 0 && (
                <div className="p-4 bg-orange-50 border border-orange-200 rounded-lg">
                  <h4 className="font-semibold mb-2 text-orange-800">⚠️ Low Margin Sales ({reportData.lowMarginSales.length})</h4>
                  <p className="text-sm text-orange-700 mb-2">These sales have profit margins below 10%</p>
                  <div className="space-y-2">
                    {reportData.lowMarginSales.slice(0, 3).map((sale: any, index: number) => (
                      <div key={index} className="flex justify-between items-center p-2 bg-white rounded text-sm">
                        <span>{sale.mobiles?.brand} {sale.mobiles?.model}</span>
                        <Badge variant="outline" className="text-orange-600">{sale.margin.toFixed(1)}%</Badge>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {reportData.topCustomers && (
                <div>
                  <h4 className="font-semibold mb-2">Top Customers</h4>
                  <div className="space-y-2">
                    {reportData.topCustomers.slice(0, 5).map((customer: any, index: number) => (
                      <div key={index} className="flex justify-between items-center p-2 bg-muted rounded">
                        <span>{customer.name}</span>
                        <span className="font-medium">PKR {customer.totalSpent.toLocaleString()}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {reportData.brandAnalysis && (
                <div>
                  <h4 className="font-semibold mb-2">Brand Performance</h4>
                  <div className="space-y-2">
                    {Object.entries(reportData.brandAnalysis).slice(0, 5).map(([brand, data]: [string, any]) => (
                      <div key={brand} className="flex justify-between items-center p-2 bg-muted rounded">
                        <span>{brand}</span>
                        <div className="text-right">
                          <div className="font-medium">{data.count} sales</div>
                          <div className="text-sm text-muted-foreground">PKR {data.revenue.toLocaleString()}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}