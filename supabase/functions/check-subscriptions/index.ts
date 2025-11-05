import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.4";

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("Starting subscription check...");

    // 1. Send warning emails for expiring subscriptions (7 days ahead)
    const { data: expiring, error: expiringError } = await supabase
      .rpc("get_expiring_subscriptions", { days_ahead: 7 });

    if (expiringError) {
      console.error("Error fetching expiring subscriptions:", expiringError);
    } else if (expiring && expiring.length > 0) {
      console.log(`Found ${expiring.length} expiring subscriptions`);
      
      for (const sub of expiring) {
        try {
          await supabase.functions.invoke("send-emails", {
            body: {
              type: "expiry_warning",
              to: sub.email,
              data: {
                name: sub.full_name,
                tier: sub.subscription_tier,
                expiryDate: new Date(sub.expires_at).toLocaleDateString(),
                daysRemaining: sub.days_remaining,
              },
            },
          });
          console.log(`Warning email sent to ${sub.email}`);
        } catch (emailError) {
          console.error(`Failed to send email to ${sub.email}:`, emailError);
        }
      }
    } else {
      console.log("No expiring subscriptions found");
    }

    // 2. Handle expired subscriptions
    const { data: result, error: expiryError } = await supabase
      .rpc("handle_subscription_expiry");

    if (expiryError) {
      console.error("Error handling expired subscriptions:", expiryError);
      throw expiryError;
    }

    const downgraded = result?.[0]?.downgraded_count || 0;
    console.log(`Downgraded ${downgraded} expired subscriptions`);

    // 3. Send downgrade notification emails
    if (downgraded > 0) {
      const { data: downgradedUsers, error: logsError } = await supabase
        .from("subscription_logs")
        .select(`
          user_id,
          from_tier,
          to_tier,
          profiles!inner(full_name, user_id)
        `)
        .eq("action", "downgraded")
        .gte("created_at", new Date(Date.now() - 5 * 60 * 1000).toISOString()); // Last 5 minutes

      if (!logsError && downgradedUsers) {
        for (const log of downgradedUsers) {
          try {
            // Get user email from auth
            const { data: authUser } = await supabase.auth.admin.getUserById(
              log.user_id
            );

            if (authUser?.user?.email) {
              await supabase.functions.invoke("send-emails", {
                body: {
                  type: "downgrade_notice",
                  to: authUser.user.email,
                  data: {
                    name: log.profiles.full_name,
                    fromTier: log.from_tier,
                    toTier: log.to_tier,
                  },
                },
              });
              console.log(`Downgrade email sent to ${authUser.user.email}`);
            }
          } catch (emailError) {
            console.error(`Failed to send downgrade email:`, emailError);
          }
        }
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        expiring_count: expiring?.length || 0,
        downgraded_count: downgraded,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: any) {
    console.error("Error in check-subscriptions:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
});
