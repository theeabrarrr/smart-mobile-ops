import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Upload, Download, CheckCircle, XCircle, AlertCircle, Crown } from 'lucide-react';
import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import { mobileSchema } from '@/lib/validationSchemas';
import { useSubscription } from '@/hooks/useSubscription';
import { canAccessFeature } from '@/lib/subscriptionTiers';
import { UpgradeDialog } from './UpgradeDialog';

interface ImportRow {
  brand: string;
  model: string;
  imei?: string;
  condition: string;
  selling_price?: string;
  notes?: string;
  valid: boolean;
  errors: string[];
}

interface BulkInventoryImportProps {
  onImportComplete: () => void;
}

export default function BulkInventoryImport({ onImportComplete }: BulkInventoryImportProps) {
  const { user } = useAuth();
  const { tier } = useSubscription();
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [showUpgradeDialog, setShowUpgradeDialog] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [parsedData, setParsedData] = useState<ImportRow[]>([]);
  const [importing, setImporting] = useState(false);

  const downloadTemplate = () => {
    const template = [
      {
        brand: 'Samsung',
        model: 'Galaxy S21',
        imei: '123456789012345',
        condition: 'good',
        selling_price: '75000',
        notes: 'Like new condition'
      },
      {
        brand: 'Apple',
        model: 'iPhone 13',
        imei: '',
        condition: 'excellent',
        selling_price: '125000',
        notes: ''
      }
    ];

    const ws = XLSX.utils.json_to_sheet(template);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Template');
    XLSX.writeFile(wb, 'inventory-import-template.xlsx');

    toast({
      title: "Template Downloaded",
      description: "Fill in the template and upload to import your inventory"
    });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    setFile(selectedFile);
    parseFile(selectedFile);
  };

  const parseFile = async (file: File) => {
    const fileExtension = file.name.split('.').pop()?.toLowerCase();

    if (fileExtension === 'csv') {
      Papa.parse(file, {
        header: true,
        complete: (results) => {
          validateData(results.data as any[]);
        },
        error: (error) => {
          toast({
            title: "Parse Error",
            description: error.message,
            variant: "destructive"
          });
        }
      });
    } else if (fileExtension === 'xlsx' || fileExtension === 'xls') {
      const reader = new FileReader();
      reader.onload = (e) => {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
        const jsonData = XLSX.utils.sheet_to_json(firstSheet);
        validateData(jsonData as any[]);
      };
      reader.readAsArrayBuffer(file);
    } else {
      toast({
        title: "Invalid File",
        description: "Please upload a CSV or Excel file",
        variant: "destructive"
      });
    }
  };

  const validateData = (data: any[]) => {
    const validatedRows: ImportRow[] = data
      .filter(row => row.brand || row.model) // Filter out completely empty rows
      .map((row) => {
        const rowData = {
          brand: row.brand?.toString().trim() || '',
          model: row.model?.toString().trim() || '',
          imei: row.imei?.toString().trim() || '',
          condition: row.condition?.toString().toLowerCase().trim() || 'good',
          selling_price: row.selling_price?.toString().trim() || '',
          notes: row.notes?.toString().trim() || ''
        };

        const validation = mobileSchema.safeParse(rowData);
        
        return {
          ...rowData,
          valid: validation.success,
          errors: validation.success ? [] : validation.error.errors.map(e => e.message)
        };
      });

    setParsedData(validatedRows);

    if (validatedRows.length === 0) {
      toast({
        title: "No Data Found",
        description: "The file appears to be empty or improperly formatted",
        variant: "destructive"
      });
    }
  };

  const handleImport = async () => {
    const validRows = parsedData.filter(row => row.valid);
    
    if (validRows.length === 0) {
      toast({
        title: "No Valid Rows",
        description: "Please fix validation errors before importing",
        variant: "destructive"
      });
      return;
    }

    setImporting(true);

    try {
      const mobilesToInsert = validRows.map(row => ({
        brand: row.brand,
        model: row.model,
        imei: row.imei || null,
        condition: row.condition as 'excellent' | 'good' | 'fair' | 'poor',
        selling_price: row.selling_price ? parseFloat(row.selling_price) : null,
        notes: row.notes || null,
        user_id: user?.id
      }));

      const { error } = await supabase
        .from('mobiles')
        .insert(mobilesToInsert);

      if (error) throw error;

      toast({
        title: "Import Successful",
        description: `${validRows.length} mobile${validRows.length > 1 ? 's' : ''} imported successfully`
      });

      setIsOpen(false);
      setParsedData([]);
      setFile(null);
      onImportComplete();
    } catch (error: any) {
      toast({
        title: "Import Failed",
        description: error.message || "Failed to import mobiles",
        variant: "destructive"
      });
    } finally {
      setImporting(false);
    }
  };

  const validCount = parsedData.filter(row => row.valid).length;
  const invalidCount = parsedData.filter(row => !row.valid).length;

  const handleOpenDialog = () => {
    if (!canAccessFeature(tier, 'custom_reports')) {
      setShowUpgradeDialog(true);
      return;
    }
    setIsOpen(true);
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogTrigger asChild>
          <Button variant="outline" onClick={handleOpenDialog}>
            <Upload className="h-4 w-4 mr-2" />
            Bulk Import
          </Button>
        </DialogTrigger>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Bulk Import Inventory</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Download Template */}
          <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
            <div>
              <h3 className="font-medium">Download Template</h3>
              <p className="text-sm text-muted-foreground">
                Use our template to ensure correct formatting
              </p>
            </div>
            <Button onClick={downloadTemplate} variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              Download
            </Button>
          </div>

          {/* File Upload */}
          <div>
            <Label htmlFor="file-upload">Upload CSV or Excel File</Label>
            <input
              id="file-upload"
              type="file"
              accept=".csv,.xlsx,.xls"
              onChange={handleFileChange}
              className="mt-2 block w-full text-sm text-muted-foreground
                file:mr-4 file:py-2 file:px-4
                file:rounded-md file:border-0
                file:text-sm file:font-semibold
                file:bg-primary file:text-primary-foreground
                hover:file:bg-primary/90
                cursor-pointer"
            />
          </div>

          {/* Preview & Validation */}
          {parsedData.length > 0 && (
            <>
              <div className="flex gap-2">
                <Badge variant="default" className="flex items-center gap-1">
                  <CheckCircle className="h-3 w-3" />
                  Valid: {validCount}
                </Badge>
                {invalidCount > 0 && (
                  <Badge variant="destructive" className="flex items-center gap-1">
                    <XCircle className="h-3 w-3" />
                    Invalid: {invalidCount}
                  </Badge>
                )}
              </div>

              <div className="border rounded-lg overflow-hidden">
                <div className="max-h-96 overflow-y-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-12">Status</TableHead>
                        <TableHead>Brand</TableHead>
                        <TableHead>Model</TableHead>
                        <TableHead>IMEI</TableHead>
                        <TableHead>Condition</TableHead>
                        <TableHead>Price</TableHead>
                        <TableHead>Notes</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {parsedData.map((row, index) => (
                        <TableRow key={index} className={!row.valid ? 'bg-destructive/10' : ''}>
                          <TableCell>
                            {row.valid ? (
                              <CheckCircle className="h-4 w-4 text-green-500" />
                            ) : (
                              <div className="relative group">
                                <AlertCircle className="h-4 w-4 text-destructive cursor-help" />
                                <div className="absolute left-0 top-6 z-10 hidden group-hover:block w-64 p-2 bg-popover border rounded-md shadow-lg text-xs">
                                  {row.errors.map((error, i) => (
                                    <div key={i} className="text-destructive">{error}</div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </TableCell>
                          <TableCell className="font-medium">{row.brand}</TableCell>
                          <TableCell>{row.model}</TableCell>
                          <TableCell className="text-muted-foreground">{row.imei || '-'}</TableCell>
                          <TableCell>
                            <Badge variant="outline" className="capitalize">
                              {row.condition}
                            </Badge>
                          </TableCell>
                          <TableCell>{row.selling_price ? `PKR ${row.selling_price}` : '-'}</TableCell>
                          <TableCell className="text-muted-foreground text-sm truncate max-w-32">
                            {row.notes || '-'}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>

              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setParsedData([]);
                    setFile(null);
                  }}
                >
                  Clear
                </Button>
                <Button
                  onClick={handleImport}
                  disabled={validCount === 0 || importing}
                >
                  {importing ? 'Importing...' : `Import ${validCount} Mobile${validCount > 1 ? 's' : ''}`}
                </Button>
              </div>
            </>
          )}
        </div>
      </DialogContent>
      </Dialog>

      <UpgradeDialog
        open={showUpgradeDialog}
        onOpenChange={setShowUpgradeDialog}
        title="Premium Feature"
        message="Bulk import is available for Standard and Premium subscribers. Upgrade to import multiple mobiles at once using CSV or Excel files."
      />
    </>
  );
}
