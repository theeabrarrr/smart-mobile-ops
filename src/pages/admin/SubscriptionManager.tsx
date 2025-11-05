import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface UserProfile {
  user_id: string;
  full_name: string;
  subscription_tier: string;
  subscription_expires_at: string | null;
  email?: string;
}

export default function SubscriptionManager() {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [selectedUser, setSelectedUser] = useState('');
  const [newTier, setNewTier] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    const { data: profiles, error } = await supabase
      .from('profiles')
      .select('*')
      .order('full_name');

    if (error) {
      toast({
        title: 'Error',
        description: 'Failed to load users',
        variant: 'destructive',
      });
      return;
    }

    const usersWithEmails = await Promise.all(
      (profiles || []).map(async (profile) => {
        const { data: authData } = await supabase.auth.admin.getUserById(profile.user_id);
        return {
          ...profile,
          email: authData?.user?.email || 'N/A',
        };
      })
    );

    setUsers(usersWithEmails);
  };

  const handleUpdateSubscription = async () => {
    if (!selectedUser || !newTier) {
      toast({
        title: 'Validation Error',
        description: 'Please select a user and tier',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);

    try {
      const selectedUserData = users.find((u) => u.user_id === selectedUser);
      const oldTier = selectedUserData?.subscription_tier;

      // Update subscription
      const { error } = await supabase
        .from('profiles')
        .update({
          subscription_tier: newTier as 'basic' | 'standard' | 'premium',
          subscription_expires_at: expiryDate || null,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', selectedUser);

      if (error) throw error;

      // Log the change
      await supabase.from('subscription_logs').insert({
        user_id: selectedUser,
        action: 'manual_update',
        from_tier: oldTier,
        to_tier: newTier,
        reason: 'Admin manual update',
      });

      // Send confirmation email
      await supabase.functions.invoke('send-emails', {
        body: {
          type: 'upgrade_confirmation',
          to: selectedUserData?.email,
          data: {
            name: selectedUserData?.full_name,
            toTier: newTier,
            expiryDate: expiryDate ? new Date(expiryDate).toLocaleDateString() : 'Lifetime',
          },
        },
      });

      toast({
        title: 'Success',
        description: 'Subscription updated successfully',
      });

      fetchUsers();
      setSelectedUser('');
      setNewTier('');
      setExpiryDate('');
    } catch (error: any) {
      console.error('Error updating subscription:', error);
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const selectedUserData = users.find((u) => u.user_id === selectedUser);

  return (
    <div className="p-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Subscription Manager</h1>
        <p className="text-muted-foreground">Manually update user subscriptions</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Update Subscription</CardTitle>
          <CardDescription>Change user subscription tier and expiry date</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Select User</Label>
            <Select value={selectedUser} onValueChange={setSelectedUser}>
              <SelectTrigger>
                <SelectValue placeholder="Choose a user" />
              </SelectTrigger>
              <SelectContent>
                {users.map((user) => (
                  <SelectItem key={user.user_id} value={user.user_id}>
                    {user.full_name} ({user.email}) - Current: {user.subscription_tier}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {selectedUser && selectedUserData && (
            <div className="p-4 bg-muted rounded-lg space-y-2">
              <p className="text-sm">
                <strong>Current Tier:</strong> {selectedUserData.subscription_tier.toUpperCase()}
              </p>
              <p className="text-sm">
                <strong>Current Expiry:</strong>{' '}
                {selectedUserData.subscription_expires_at
                  ? new Date(selectedUserData.subscription_expires_at).toLocaleDateString()
                  : 'N/A'}
              </p>
            </div>
          )}

          <div className="space-y-2">
            <Label>New Tier</Label>
            <Select value={newTier} onValueChange={setNewTier}>
              <SelectTrigger>
                <SelectValue placeholder="Choose new tier" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="basic">Free (Basic)</SelectItem>
                <SelectItem value="standard">Standard</SelectItem>
                <SelectItem value="premium">Premium</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Expiry Date (Optional)</Label>
            <Input
              type="date"
              value={expiryDate}
              onChange={(e) => setExpiryDate(e.target.value)}
              placeholder="Leave empty for lifetime"
            />
          </div>

          <Button onClick={handleUpdateSubscription} disabled={loading} className="w-full">
            {loading ? 'Updating...' : 'Update Subscription'}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
