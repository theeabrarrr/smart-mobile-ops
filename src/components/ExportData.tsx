import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Download, Mail } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import { sanitizeError } from '@/lib/errorHandling';
import { useSubscription } from '@/hooks/useSubscription';
import { canAccessFeature, getUpgradeMessage } from '@/lib/subscriptionTiers';
import { UpgradeDialog } from './UpgradeDialog';

const ExportData = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const { tier } = useSubscription();
  const [exportType, setExportType] = useState('');
  const [showUpgradeDialog, setShowUpgradeDialog] = useState(false);

  const exportData = async () => {
    // Check subscription tier
    if (!canAccessFeature(tier, 'custom_reports')) {
      setShowUpgradeDialog(true);
      return;
    }

    if (!exportType) {
      toast({
        title: "Error",
        description: "Please select a data type to export",
        variant: "destructive"
      });
      return;
    }

    try {
      let data;
      let filename;

      switch (exportType) {
        case 'sales':
          const { data: salesData } = await supabase
            .from('sales')
            .select(`
              *,
              mobiles(brand, model),
              customers(name)
            `)
            .eq('user_id', user?.id)
            .order('created_at', { ascending: false });
          
          data = salesData?.map(sale => ({
            'Sale Date': new Date(sale.sale_date).toLocaleDateString(),
            'Mobile': `${sale.mobiles.brand} ${sale.mobiles.model}`,
            'Customer': sale.customers.name,
            'Sale Price': sale.sale_price,
            'Payment Status': sale.payment_status,
            'Notes': sale.notes || ''
          }));
          filename = 'sales_export.csv';
          break;

        case 'customers':
          const { data: customersData } = await supabase
            .from('customers')
            .select('*')
            .eq('user_id', user?.id)
            .order('name');
          
          data = customersData?.map(customer => ({
            'Name': customer.name,
            'Email': customer.email || '',
            'Phone': customer.phone || '',
            'Address': customer.address || '',
            'Created': new Date(customer.created_at).toLocaleDateString(),
            'Notes': customer.notes || ''
          }));
          filename = 'customers_export.csv';
          break;

        case 'inventory':
          const { data: inventoryData } = await supabase
            .from('mobiles')
            .select('id, brand, model, imei, condition, selling_price, is_sold, notes')
            .eq('user_id', user?.id)
            .order('brand');
          
          // Fetch purchases to get purchase info
          const { data: purchasesForExport } = await supabase
            .from('purchases')
            .select('mobile_id, purchase_price, purchase_date, supplier_name')
            .eq('user_id', user?.id);
          
          const purchaseInfoMap = new Map(
            purchasesForExport?.map(p => [p.mobile_id, p]) || []
          );
          
          data = inventoryData?.map(mobile => {
            const purchaseInfo = purchaseInfoMap.get(mobile.id);
            return {
              'Brand': mobile.brand,
              'Model': mobile.model,
              'IMEI': mobile.imei || '',
              'Condition': mobile.condition,
              'Purchase Price': purchaseInfo?.purchase_price || '',
              'Selling Price': mobile.selling_price || '',
              'Purchase Date': purchaseInfo?.purchase_date ? new Date(purchaseInfo.purchase_date).toLocaleDateString() : '',
              'Status': mobile.is_sold ? 'Sold' : 'Available',
              'Supplier': purchaseInfo?.supplier_name || '',
              'Notes': mobile.notes || ''
            };
          });
          filename = 'inventory_export.csv';
          break;

        default:
          throw new Error('Invalid export type');
      }

      if (data && data.length > 0) {
        const csv = convertToCSV(data);
        downloadCSV(csv, filename);
        
        toast({
          title: "Export Successful",
          description: `${data.length} records exported successfully.`
        });
      } else {
        toast({
          title: "No Data",
          description: "No data found to export.",
          variant: "destructive"
        });
      }
    } catch (error) {
      if (import.meta.env.DEV) {
        console.error('[Dev] Export error:', error);
      }
      toast({
        title: "Export Failed",
        description: sanitizeError(error, 'Data export'),
        variant: "destructive"
      });
    }
  };

  const convertToCSV = (data: any[]) => {
    if (!data || data.length === 0) return '';
    
    const headers = Object.keys(data[0]);
    const csvHeaders = headers.join(',');
    
    const csvRows = data.map(row => 
      headers.map(header => {
        const value = row[header];
        return typeof value === 'string' && value.includes(',') 
          ? `"${value}"` 
          : value;
      }).join(',')
    );
    
    return [csvHeaders, ...csvRows].join('\n');
  };

  const downloadCSV = (csv: string, filename: string) => {
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', filename);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const sendEmailSupport = () => {
    // Check subscription tier
    if (!canAccessFeature(tier, 'priority_support')) {
      setShowUpgradeDialog(true);
      return;
    }

    const subject = 'Support Request - MobileSales Pro';
    const body = `Hello Support Team,

I need assistance with my MobileSales Pro account.

User ID: ${user?.id}
Email: ${user?.email}
Subscription: ${tier.toUpperCase()}

Please describe your issue:


Best regards`;
    
    const mailtoLink = `mailto:support@mobilesalespro.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    window.location.href = mailtoLink;

    toast({
      title: "Email Client Opened",
      description: "Your email client has been opened with pre-filled support request. Please send the email to complete your support request.",
    });
  };

  const hasExportAccess = canAccessFeature(tier, 'custom_reports');
  const hasEmailAccess = canAccessFeature(tier, 'priority_support');

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Export & Support</CardTitle>
          <CardDescription>
            Export your data or contact support
            {hasExportAccess && (
              <Badge variant="outline" className="ml-2">Standard+</Badge>
            )}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Select 
              value={exportType} 
              onValueChange={setExportType}
              disabled={!hasExportAccess}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select data to export" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="sales">Sales Records</SelectItem>
                <SelectItem value="customers">Customer Database</SelectItem>
                <SelectItem value="inventory">Mobile Inventory</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <Button 
            onClick={exportData} 
            className="w-full"
            disabled={!hasExportAccess}
          >
            <Download className="h-4 w-4 mr-2" />
            Export to CSV
          </Button>
          
          <Button 
            onClick={sendEmailSupport} 
            variant="outline" 
            className="w-full"
            disabled={!hasEmailAccess}
          >
            <Mail className="h-4 w-4 mr-2" />
            Email Support
          </Button>

          {!hasExportAccess && (
            <div className="text-sm text-muted-foreground p-3 bg-muted rounded-md">
              <p className="font-semibold mb-1">Upgrade to unlock:</p>
              <ul className="list-disc list-inside space-y-1">
                <li>CSV export for sales, customers, and inventory</li>
                <li>Direct email support</li>
                <li>Full business reports and analytics</li>
              </ul>
              <p className="mt-2 text-xs">
                Currently on Free plan. <a href="/profile" className="text-primary hover:underline">View upgrade options →</a>
              </p>
            </div>
          )}
        </CardContent>
      </Card>
      
      <UpgradeDialog
        open={showUpgradeDialog}
        onOpenChange={setShowUpgradeDialog}
        message={getUpgradeMessage(tier, 'custom_reports')}
      />
    </>
  );
};

export default ExportData;
