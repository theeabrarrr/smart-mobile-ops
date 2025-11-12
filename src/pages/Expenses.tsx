import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useSubscription } from '@/hooks/useSubscription';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Trash2, TrendingDown } from 'lucide-react';
import { toast } from 'sonner';
import { UpgradeDialog } from '@/components/UpgradeDialog';
import { format } from 'date-fns';

interface Expense {
  id: string;
  category: string;
  amount: number;
  description: string | null;
  expense_date: string;
  created_at: string;
}

const EXPENSE_CATEGORIES = [
  'Rent',
  'Salaries',
  'Utilities',
  'Marketing',
  'Transportation',
  'Maintenance',
  'Supplies',
  'Other'
];

export default function Expenses() {
  const { user } = useAuth();
  const { tier, features } = useSubscription();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [upgradeOpen, setUpgradeOpen] = useState(false);
  
  const [formData, setFormData] = useState({
    category: '',
    amount: '',
    description: '',
    expense_date: new Date().toISOString().split('T')[0]
  });

  useEffect(() => {
    if (user && features.canAccessExpenseTracker) {
      fetchExpenses();
    }
    setLoading(false);
  }, [user, features.canAccessExpenseTracker]);

  const fetchExpenses = async () => {
    const { data, error } = await supabase
      .from('expenses')
      .select('*')
      .eq('user_id', user!.id)
      .order('expense_date', { ascending: false });

    if (error) {
      toast.error('Failed to load expenses');
      return;
    }
    setExpenses(data || []);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!features.canAccessExpenseTracker) {
      setUpgradeOpen(true);
      return;
    }

    const { error } = await supabase
      .from('expenses')
      .insert({
        user_id: user!.id,
        category: formData.category,
        amount: parseFloat(formData.amount),
        description: formData.description || null,
        expense_date: formData.expense_date
      });

    if (error) {
      toast.error('Failed to add expense');
      return;
    }

    toast.success('Expense added successfully');
    setDialogOpen(false);
    setFormData({ category: '', amount: '', description: '', expense_date: new Date().toISOString().split('T')[0] });
    fetchExpenses();
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase
      .from('expenses')
      .delete()
      .eq('id', id);

    if (error) {
      toast.error('Failed to delete expense');
      return;
    }

    toast.success('Expense deleted');
    fetchExpenses();
  };

  const totalExpenses = expenses.reduce((sum, exp) => sum + Number(exp.amount), 0);

  if (!features.canAccessExpenseTracker) {
    return (
        <div className="space-y-4 md:space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1 className="text-3xl font-bold">Expense Tracker</h1>
              <p className="text-muted-foreground mt-1">Track your business expenses</p>
            </div>
          </div>

          <Card>
            <CardContent className="pt-6">
              <div className="text-center py-12">
                <TrendingDown className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">Expense Tracker Available in Dealer Pack</h3>
                <p className="text-muted-foreground mb-4">
                  Upgrade to Dealer Pack or Empire Plan to track your business expenses and view profit-loss summaries.
                </p>
                <Button onClick={() => setUpgradeOpen(true)}>Upgrade Now</Button>
              </div>
            </CardContent>
          </Card>

          <UpgradeDialog 
            open={upgradeOpen} 
            onOpenChange={setUpgradeOpen}
            message="Upgrade to Dealer Pack or Empire Plan to track your business expenses and view profit-loss summaries."
          />
        </div>
    );
  }

  return (
    
      <div className="space-y-4 md:space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold">Expense Tracker</h1>
            <p className="text-muted-foreground mt-1">Manage your business expenses</p>
          </div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add Expense
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New Expense</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label>Category</Label>
                  <Select value={formData.category} onValueChange={(value) => setFormData({...formData, category: value})}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {EXPENSE_CATEGORIES.map((cat) => (
                        <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Amount</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={formData.amount}
                    onChange={(e) => setFormData({...formData, amount: e.target.value})}
                    required
                  />
                </div>
                <div>
                  <Label>Date</Label>
                  <Input
                    type="date"
                    value={formData.expense_date}
                    onChange={(e) => setFormData({...formData, expense_date: e.target.value})}
                    required
                  />
                </div>
                <div>
                  <Label>Description (Optional)</Label>
                  <Input
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                  />
                </div>
                <Button type="submit" className="w-full">Add Expense</Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg md:text-xl">Total Expenses: PKR {totalExpenses.toLocaleString()}</CardTitle>
          </CardHeader>
          <CardContent className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="min-w-[100px]">Date</TableHead>
                  <TableHead className="min-w-[100px]">Category</TableHead>
                  <TableHead className="hidden md:table-cell">Description</TableHead>
                  <TableHead className="text-right min-w-[100px]">Amount</TableHead>
                  <TableHead className="text-right min-w-[80px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {expenses.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-muted-foreground">
                      No expenses recorded yet
                    </TableCell>
                  </TableRow>
                ) : (
                  expenses.map((expense) => (
                    <TableRow key={expense.id}>
                      <TableCell className="text-sm">{format(new Date(expense.expense_date), 'PP')}</TableCell>
                      <TableCell className="text-sm">{expense.category}</TableCell>
                      <TableCell className="hidden md:table-cell text-sm">{expense.description || '-'}</TableCell>
                      <TableCell className="text-right text-sm font-medium">PKR {Number(expense.amount).toLocaleString()}</TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(expense.id)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    
  );
}
