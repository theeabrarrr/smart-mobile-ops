import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface SubscriptionLog {
  id: string;
  user_id: string;
  action: string;
  from_tier: string | null;
  to_tier: string | null;
  reason: string | null;
  created_at: string;
  profiles?: {
    full_name: string;
  };
}

export default function SystemLogs() {
  const [logs, setLogs] = useState<SubscriptionLog[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchLogs = async () => {
    try {
      const { data, error } = await supabase
        .from('subscription_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) throw error;

      // Fetch user names separately
      const logsWithNames = await Promise.all(
        (data || []).map(async (log) => {
          const { data: profile } = await supabase
            .from('profiles')
            .select('full_name')
            .eq('user_id', log.user_id)
            .single();
          
          return {
            ...log,
            profiles: profile,
          };
        })
      );

      setLogs(logsWithNames);
    } catch (error: any) {
      console.error('Error fetching logs:', error);
      toast({
        title: 'Error',
        description: 'Failed to load system logs',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const getActionColor = (action: string) => {
    switch (action) {
      case 'upgraded':
        return 'bg-green-500';
      case 'downgraded':
        return 'bg-red-500';
      case 'manual_update':
        return 'bg-blue-500';
      default:
        return 'bg-gray-500';
    }
  };

  if (loading) {
    return <div className="p-8">Loading...</div>;
  }

  return (
    <div className="p-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">System Logs</h1>
        <p className="text-muted-foreground">Subscription activity history</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
          <CardDescription>Last 100 subscription changes</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>User</TableHead>
                <TableHead>Action</TableHead>
                <TableHead>From</TableHead>
                <TableHead>To</TableHead>
                <TableHead>Reason</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {logs.map((log) => (
                <TableRow key={log.id}>
                  <TableCell>
                    {new Date(log.created_at).toLocaleString()}
                  </TableCell>
                  <TableCell className="font-medium">
                    {log.profiles?.full_name}
                  </TableCell>
                  <TableCell>
                    <Badge className={getActionColor(log.action)}>
                      {log.action.replace('_', ' ').toUpperCase()}
                    </Badge>
                  </TableCell>
                  <TableCell>{log.from_tier || '-'}</TableCell>
                  <TableCell>{log.to_tier || '-'}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {log.reason || '-'}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
