# Low Stock Alert System Setup

## Overview
The low stock alert system automatically monitors inventory levels for Empire Plan users and sends notifications when stock is running low.

## Features
- Automatic detection of low stock items (≤2 units available, with sales history)
- Detection of out-of-stock items that were previously in stock
- Real-time notifications in the notification bell
- Manual check button for Empire Plan users in the Inventory page
- Visual indicators on inventory cards showing low stock status

## How It Works

### Low Stock Criteria
An item is considered "low stock" when:
1. Available count is 2 or less
2. Available count is greater than 0
3. Total count (ever tracked) is at least 3 (indicating sales history)

### Out of Stock Criteria
An item is considered "out of stock" when:
1. Available count is 0
2. Total count is at least 2 (indicating it was previously stocked)

### Notification Types
- **Low Stock Alert**: "Only X unit(s) left of [Brand] [Model]"
- **Out of Stock Alert**: "Out of stock: [Brand] [Model] (X sold)"

## Manual Check
Empire Plan users can manually trigger a low stock check:
1. Go to Inventory page
2. Click "Check Low Stock" button in the top right
3. Notifications will be created for any low stock items

## Automated Checks (Optional)
To set up automated daily checks, you can use Supabase Edge Functions with a cron trigger.

### Using Supabase Cron (Recommended)
1. Go to Supabase Dashboard → Edge Functions
2. Create a new cron job for `check-low-stock`
3. Set schedule to run daily (e.g., "0 9 * * *" for 9 AM daily)

### Using External Cron Service
Alternatively, use a service like cron-job.org or GitHub Actions:
1. Set up a scheduled task to call the edge function
2. Use the function URL: `https://jwoleucbakneoiyctwyi.supabase.co/functions/v1/check-low-stock`
3. Schedule: Once daily (recommended: early morning)

## Visual Indicators
When viewing the Inventory page as an Empire Plan user, you'll see:
- **Orange "Low Stock" badge**: Shows remaining count for items running low
- **Red "Out of Stock" badge**: Shows items that are completely sold out

## Notifications
Notifications appear in the notification bell in the top right:
- 📦 icon for low stock alerts
- Click to mark as read
- Realtime updates when new alerts are generated
