import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Download, FileText, Mail } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface ExportDataProps {
  userSubscriptionTier: string;
}

export default function ExportData({ userSubscriptionTier }: ExportDataProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [exportType, setExportType] = useState('');
  const [loading, setLoading] = useState(false);

  const canExport = userSubscriptionTier === 'standard' || userSubscriptionTier === 'premium';

  const exportData = async () => {
    if (!canExport) {
      toast({
        title: "Upgrade to Standard",
        description: "Data export is available on Standard and Premium plans.",
        variant: "destructive"
      });
      return;
    }

    if (!exportType) {
      toast({
        title: "Select Export Type",
        description: "Please select what data you want to export.",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
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
            .select('*')
            .eq('user_id', user?.id)
            .order('brand');
          
          data = inventoryData?.map(mobile => ({
            'Brand': mobile.brand,
            'Model': mobile.model,
            'IMEI': mobile.imei || '',
            'Condition': mobile.condition,
            'Purchase Price': mobile.purchase_price || '',
            'Selling Price': mobile.selling_price || '',
            'Purchase Date': mobile.purchase_date ? new Date(mobile.purchase_date).toLocaleDateString() : '',
            'Status': mobile.is_sold ? 'Sold' : 'Available',
            'Supplier': mobile.supplier_name || '',
            'Notes': mobile.notes || ''
          }));
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
      console.error('Export error:', error);
      toast({
        title: "Export Failed",
        description: "Failed to export data. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
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
    if (!canExport) {
      toast({
        title: "Upgrade Required",
        description: "Email support is available for Standard and Premium plans only.",
        variant: "destructive"
      });
      return;
    }

    const subject = 'Support Request - Mobile Management System';
    const body = `Hello Support Team,

I need assistance with my mobile management system account.

User ID: ${user?.id}
Email: ${user?.email}
Subscription: ${userSubscriptionTier.toUpperCase()}

Please describe your issue:


Best regards`;
    
    const mailtoLink = `mailto:support@mobilemgmt.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    window.open(mailtoLink);
    
    toast({
      title: "Email Client Opened",
      description: "Your email client should open with a pre-filled support request."
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Download className="h-5 w-5" />
          Data Export & Support
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {!canExport && (
          <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-sm text-yellow-800">
              🔒 Export functionality and email support are available for Standard and Premium plans.
            </p>
          </div>
        )}
        
        <div className="space-y-3">
          <div>
            <label className="text-sm font-medium">Export Data</label>
            <Select value={exportType} onValueChange={setExportType} disabled={!canExport}>
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
          
          <div className="flex gap-2">
            <Button 
              onClick={exportData} 
              disabled={loading || !canExport}
              className="flex-1"
            >
              <FileText className="h-4 w-4 mr-2" />
              {loading ? 'Exporting...' : 'Export to CSV'}
            </Button>
            
            <Button 
              onClick={sendEmailSupport}
              variant="outline"
              disabled={!canExport}
              className="flex-1"
            >
              <Mail className="h-4 w-4 mr-2" />
              Email Support
            </Button>
          </div>
        </div>
        
        <div className="text-xs text-muted-foreground">
          <Badge variant="secondary" className="mr-2">
            {userSubscriptionTier.toUpperCase()}
          </Badge>
          {canExport ? (
            "Export your data in CSV format for external analysis and backup."
          ) : (
            "Upgrade to Standard or Premium to unlock export and email support features."
          )}
        </div>
      </CardContent>
    </Card>
  );
}