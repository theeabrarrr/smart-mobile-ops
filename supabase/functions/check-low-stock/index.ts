import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface MobileInventory {
  brand: string;
  model: string;
  available_count: number;
  total_count: number;
  user_id: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log("Starting low stock check...");

    // Get all Empire Plan users
    const { data: empirePlanUsers, error: usersError } = await supabase
      .from("profiles")
      .select("user_id")
      .eq("subscription_tier", "empire_plan");

    if (usersError) {
      console.error("Error fetching Empire Plan users:", usersError);
      throw usersError;
    }

    console.log(`Found ${empirePlanUsers?.length || 0} Empire Plan users`);

    let totalNotificationsCreated = 0;

    // Process each Empire Plan user
    for (const user of empirePlanUsers || []) {
      // Get inventory grouped by brand and model
      const { data: mobiles, error: mobilesError } = await supabase
        .from("mobiles")
        .select("brand, model, is_sold")
        .eq("user_id", user.user_id);

      if (mobilesError) {
        console.error(`Error fetching mobiles for user ${user.user_id}:`, mobilesError);
        continue;
      }

      // Group by brand/model and count available vs total
      const inventoryMap = new Map<string, MobileInventory>();
      
      mobiles?.forEach((mobile) => {
        const key = `${mobile.brand}|${mobile.model}`;
        
        if (!inventoryMap.has(key)) {
          inventoryMap.set(key, {
            brand: mobile.brand,
            model: mobile.model,
            available_count: 0,
            total_count: 0,
            user_id: user.user_id,
          });
        }

        const inventory = inventoryMap.get(key)!;
        inventory.total_count++;
        
        if (!mobile.is_sold) {
          inventory.available_count++;
        }
      });

      // Check for low stock items (available count <= 2 and has sales history)
      const lowStockItems: MobileInventory[] = [];
      
      inventoryMap.forEach((inventory) => {
        // Low stock criteria:
        // 1. Available count is 2 or less
        // 2. Total count is at least 3 (meaning they've sold some)
        // 3. This indicates a popular item running low
        if (inventory.available_count <= 2 && inventory.available_count > 0 && inventory.total_count >= 3) {
          lowStockItems.push(inventory);
        }
      });

      // Check for existing notifications to avoid duplicates
      const { data: existingNotifications } = await supabase
        .from("notifications")
        .select("message")
        .eq("user_id", user.user_id)
        .eq("type", "low_stock")
        .eq("is_read", false);

      const existingMessages = new Set(
        existingNotifications?.map((n) => n.message) || []
      );

      // Create notifications for low stock items
      for (const item of lowStockItems) {
        const message = `Only ${item.available_count} unit${item.available_count > 1 ? 's' : ''} left of ${item.brand} ${item.model}`;
        
        // Skip if notification already exists and is unread
        if (existingMessages.has(message)) {
          console.log(`Skipping duplicate notification: ${message}`);
          continue;
        }

        const { error: notificationError } = await supabase
          .from("notifications")
          .insert({
            user_id: user.user_id,
            type: "low_stock",
            title: "⚠️ Low Stock Alert",
            message: message,
            is_read: false,
          });

        if (notificationError) {
          console.error(`Error creating notification for user ${user.user_id}:`, notificationError);
        } else {
          console.log(`Created low stock notification for ${item.brand} ${item.model}`);
          totalNotificationsCreated++;
        }
      }

      // Also check for completely out of stock popular items
      const outOfStockItems: MobileInventory[] = [];
      
      inventoryMap.forEach((inventory) => {
        // Out of stock of a previously stocked item
        if (inventory.available_count === 0 && inventory.total_count >= 2) {
          outOfStockItems.push(inventory);
        }
      });

      for (const item of outOfStockItems) {
        const message = `Out of stock: ${item.brand} ${item.model} (${item.total_count} sold)`;
        
        if (existingMessages.has(message)) {
          continue;
        }

        const { error: notificationError } = await supabase
          .from("notifications")
          .insert({
            user_id: user.user_id,
            type: "low_stock",
            title: "🚫 Out of Stock Alert",
            message: message,
            is_read: false,
          });

        if (notificationError) {
          console.error(`Error creating out of stock notification:`, notificationError);
        } else {
          console.log(`Created out of stock notification for ${item.brand} ${item.model}`);
          totalNotificationsCreated++;
        }
      }
    }

    console.log(`Low stock check completed. Created ${totalNotificationsCreated} notifications.`);

    return new Response(
      JSON.stringify({
        success: true,
        message: `Low stock check completed successfully`,
        usersProcessed: empirePlanUsers?.length || 0,
        notificationsCreated: totalNotificationsCreated,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    console.error("Error in check-low-stock function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});
