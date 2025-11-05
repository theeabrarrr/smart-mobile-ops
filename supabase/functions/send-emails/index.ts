import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@4.0.0";
import React from "npm:react@18.3.1";
import { renderAsync } from "npm:@react-email/components@0.0.22";
import { WelcomeEmail } from "./_templates/welcome-email.tsx";
import { ExpiryWarningEmail } from "./_templates/subscription-expiry-warning.tsx";
import { DowngradeNoticeEmail } from "./_templates/tier-downgrade-notice.tsx";

const resend = new Resend(Deno.env.get("RESEND_API_KEY") as string);

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface EmailRequest {
  type: "welcome" | "expiry_warning" | "downgrade_notice" | "upgrade_confirmation";
  to: string;
  data: {
    name?: string;
    tier?: string;
    expiryDate?: string;
    daysRemaining?: number;
    fromTier?: string;
    toTier?: string;
  };
}

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { type, to, data }: EmailRequest = await req.json();
    console.log(`Sending ${type} email to ${to}`);

    let html = "";
    let subject = "";

    switch (type) {
      case "welcome":
        html = await renderAsync(
          React.createElement(WelcomeEmail, {
            name: data.name || "User",
          })
        );
        subject = "Welcome to Mobile Shop Management!";
        break;

      case "expiry_warning":
        html = await renderAsync(
          React.createElement(ExpiryWarningEmail, {
            name: data.name || "User",
            tier: data.tier || "premium",
            expiryDate: data.expiryDate || "",
            daysRemaining: data.daysRemaining || 7,
          })
        );
        subject = `Your ${data.tier} subscription expires in ${data.daysRemaining} days`;
        break;

      case "downgrade_notice":
        html = await renderAsync(
          React.createElement(DowngradeNoticeEmail, {
            name: data.name || "User",
            fromTier: data.fromTier || "premium",
            toTier: data.toTier || "basic",
          })
        );
        subject = "Your subscription has been updated";
        break;

      case "upgrade_confirmation":
        html = `
          <h1>Subscription Upgraded!</h1>
          <p>Hi ${data.name},</p>
          <p>Your subscription has been upgraded to <strong>${data.toTier}</strong>!</p>
          <p>Expiry Date: ${data.expiryDate}</p>
        `;
        subject = "Subscription Upgraded Successfully";
        break;

      default:
        throw new Error("Invalid email type");
    }

    const { error } = await resend.emails.send({
      from: "Mobile Shop Management <onboarding@resend.dev>",
      to: [to],
      subject,
      html,
    });

    if (error) {
      console.error("Resend error:", error);
      throw error;
    }

    console.log(`Email sent successfully to ${to}`);

    return new Response(
      JSON.stringify({ success: true }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: any) {
    console.error("Error sending email:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
});
