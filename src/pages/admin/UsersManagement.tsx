import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Crown, User } from 'lucide-react';

interface UserProfile {
  user_id: string;
  full_name: string;
  subscription_tier: string;
  subscription_expires_at: string | null;
  created_at: string;
  email?: string;
}

export default function UsersManagement() {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchUsers = async () => {
    try {
      const { data: profiles, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Fetch emails from auth.users
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
    } catch (error: any) {
      console.error('Error fetching users:', error);
      toast({
        title: 'Error',
        description: 'Failed to load users',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const getTierColor = (tier: string) => {
    switch (tier) {
      case 'premium':
        return 'bg-gradient-to-r from-yellow-500 to-orange-500';
      case 'standard':
        return 'bg-gradient-to-r from-blue-500 to-cyan-500';
      default:
        return 'bg-gray-500';
    }
  };

  const formatDate = (date: string | null) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString();
  };

  if (loading) {
    return <div className="p-8">Loading...</div>;
  }

  return (
    <div className="p-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Users Management</h1>
        <p className="text-muted-foreground">View and manage all users</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Users ({users.length})</CardTitle>
          <CardDescription>Complete list of registered users</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Tier</TableHead>
                <TableHead>Expires At</TableHead>
                <TableHead>Joined</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((user) => (
                <TableRow key={user.user_id}>
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-muted-foreground" />
                      {user.full_name}
                    </div>
                  </TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>
                    <Badge className={getTierColor(user.subscription_tier)}>
                      {user.subscription_tier === 'premium' && (
                        <Crown className="h-3 w-3 mr-1" />
                      )}
                      {user.subscription_tier.toUpperCase()}
                    </Badge>
                  </TableCell>
                  <TableCell>{formatDate(user.subscription_expires_at)}</TableCell>
                  <TableCell>{formatDate(user.created_at)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
