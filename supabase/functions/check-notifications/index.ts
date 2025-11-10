import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.4";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log('Starting notification check...');

    // Check for low stock (available mobiles < 5)
    const { data: usersWithLowStock, error: lowStockError } = await supabase
      .rpc('get_users_with_low_stock');

    if (lowStockError) {
      console.error('Error fetching low stock users:', lowStockError);
    } else if (usersWithLowStock && usersWithLowStock.length > 0) {
      console.log(`Found ${usersWithLowStock.length} users with low stock`);
      
      for (const user of usersWithLowStock) {
        // Check if notification already sent today
        const today = new Date().toISOString().split('T')[0];
        const { data: existingNotif } = await supabase
          .from('notifications')
          .select('id')
          .eq('user_id', user.user_id)
          .eq('type', 'low_stock')
          .gte('created_at', `${today}T00:00:00Z`)
          .single();

        if (!existingNotif) {
          await supabase.from('notifications').insert({
            user_id: user.user_id,
            type: 'low_stock',
            title: 'Low Inventory Alert',
            message: `You have only ${user.available_count} mobile(s) available in stock. Consider adding more inventory!`
          });
          console.log(`Sent low stock notification to user ${user.user_id}`);
        }
      }
    }

    // Check for pending payments (unpaid invoices older than 3 days)
    const threeDaysAgo = new Date();
    threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);

    const { data: unpaidInvoices, error: invoiceError } = await supabase
      .from('invoices')
      .select('id, user_id, invoice_number, amount, due_date')
      .eq('status', 'UNPAID')
      .lt('created_at', threeDaysAgo.toISOString());

    if (invoiceError) {
      console.error('Error fetching unpaid invoices:', invoiceError);
    } else if (unpaidInvoices && unpaidInvoices.length > 0) {
      console.log(`Found ${unpaidInvoices.length} unpaid invoices`);
      
      for (const invoice of unpaidInvoices) {
        // Check if notification already sent for this invoice
        const { data: existingNotif } = await supabase
          .from('notifications')
          .select('id')
          .eq('user_id', invoice.user_id)
          .eq('type', 'payment_reminder')
          .contains('message', invoice.invoice_number)
          .single();

        if (!existingNotif) {
          await supabase.from('notifications').insert({
            user_id: invoice.user_id,
            type: 'payment_reminder',
            title: 'Payment Reminder',
            message: `Invoice ${invoice.invoice_number} for PKR ${invoice.amount} is still pending. Please complete payment to continue using premium features.`
          });
          console.log(`Sent payment reminder to user ${invoice.user_id}`);
        }
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        lowStockNotifications: usersWithLowStock?.length || 0,
        paymentReminders: unpaidInvoices?.length || 0
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    console.error('Error in check-notifications:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});