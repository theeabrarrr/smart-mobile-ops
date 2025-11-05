import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.4";

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Verify admin role from auth header
    const authHeader = req.headers.get("authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Missing authorization header" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check if user is admin
    const { data: isAdmin } = await supabase
      .rpc("has_role", { _user_id: user.id, _role: "admin" });

    if (!isAdmin) {
      return new Response(
        JSON.stringify({ error: "Admin access required" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("Fetching admin stats...");

    // Get total users count
    const { count: totalUsers } = await supabase
      .from("profiles")
      .select("*", { count: "exact", head: true });

    // Get subscription tier breakdown
    const { data: tierBreakdown } = await supabase
      .from("profiles")
      .select("subscription_tier");

    const tierCounts = {
      basic: 0,
      standard: 0,
      premium: 0,
    };

    tierBreakdown?.forEach((profile) => {
      if (profile.subscription_tier in tierCounts) {
        tierCounts[profile.subscription_tier as keyof typeof tierCounts]++;
      }
    });

    // Get expiring subscriptions (next 7 days)
    const { data: expiring } = await supabase
      .rpc("get_expiring_subscriptions", { days_ahead: 7 });

    // Get recent signups (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const { count: recentSignups } = await supabase
      .from("profiles")
      .select("*", { count: "exact", head: true })
      .gte("created_at", thirtyDaysAgo.toISOString());

    // Calculate MRR (Monthly Recurring Revenue) - assuming prices
    const prices = { basic: 0, standard: 50, premium: 100 }; // Example prices
    const mrr = 
      tierCounts.standard * prices.standard + 
      tierCounts.premium * prices.premium;

    // Get total inventory count across all users
    const { count: totalInventory } = await supabase
      .from("mobiles")
      .select("*", { count: "exact", head: true });

    // Get total sales count
    const { count: totalSales } = await supabase
      .from("sales")
      .select("*", { count: "exact", head: true });

    const stats = {
      totalUsers: totalUsers || 0,
      tierBreakdown: tierCounts,
      expiringCount: expiring?.length || 0,
      expiringSubscriptions: expiring || [],
      recentSignups: recentSignups || 0,
      mrr,
      totalInventory: totalInventory || 0,
      totalSales: totalSales || 0,
    };

    console.log("Admin stats fetched successfully");

    return new Response(
      JSON.stringify(stats),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: any) {
    console.error("Error in admin-stats:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
});
