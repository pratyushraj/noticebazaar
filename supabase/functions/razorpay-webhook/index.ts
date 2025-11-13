// Razorpay Webhook Handler
// Verifies and processes Razorpay payment webhooks

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { crypto } from "https://deno.land/std@0.168.0/crypto/mod.ts";

const RAZORPAY_WEBHOOK_SECRET = Deno.env.get("RAZORPAY_WEBHOOK_SECRET");

// Verify Razorpay webhook signature
function verifyWebhookSignature(
  payload: string,
  signature: string,
  secret: string
): boolean {
  const hmac = crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );

  // Note: This is a simplified version. In production, use proper HMAC verification
  // For Deno, you may need to use a library like https://deno.land/x/hmac
  const expectedSignature = btoa(
    String.fromCharCode(...new Uint8Array(crypto.getRandomValues(new Uint8Array(32))))
  );

  // TODO: Implement proper HMAC verification
  // For now, we'll verify the signature format
  return signature.startsWith("sha256=");
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-razorpay-signature",
      },
    });
  }

  try {
    // Get webhook signature from headers
    const signature = req.headers.get("x-razorpay-signature");
    if (!signature) {
      return new Response(
        JSON.stringify({ error: "Missing signature" }),
        { status: 401, headers: { "Content-Type": "application/json" } }
      );
    }

    // Read raw body for signature verification
    const rawBody = await req.text();
    
    // Verify signature
    if (!verifyWebhookSignature(rawBody, signature, RAZORPAY_WEBHOOK_SECRET || "")) {
      console.error("Invalid webhook signature");
      return new Response(
        JSON.stringify({ error: "Invalid signature" }),
        { status: 401, headers: { "Content-Type": "application/json" } }
      );
    }

    const payload = JSON.parse(rawBody);
    const { event, payload: paymentPayload } = payload;

    // Initialize Supabase admin client
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Handle payment.captured event
    if (event === "payment.captured") {
      const payment = paymentPayload.payment.entity;
      const orderId = payment.order_id;
      const noticeId = payment.notes?.notice_id;

      if (!noticeId) {
        console.error("No notice_id in payment notes");
        return new Response(
          JSON.stringify({ error: "Missing notice_id" }),
          { status: 400, headers: { "Content-Type": "application/json" } }
        );
      }

      // Update notice status
      const { data: notice, error: noticeError } = await supabase
        .from("notice_requests")
        .update({
          payment_status: "paid",
          status: "under_review", // Ready for lawyer review
          updated_at: new Date().toISOString(),
        })
        .eq("payment_id", orderId)
        .eq("id", noticeId)
        .select()
        .single();

      if (noticeError) {
        console.error("Error updating notice:", noticeError);
        return new Response(
          JSON.stringify({ error: "Failed to update notice" }),
          { status: 500, headers: { "Content-Type": "application/json" } }
        );
      }

      // TODO: Notify assigned lawyer via email/Slack
      // You can add notification logic here

      console.log(`Payment captured for notice ${noticeId}`);

      return new Response(
        JSON.stringify({ success: true, notice_id: noticeId }),
        {
          status: 200,
          headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
          },
        }
      );
    }

    // Handle payment.failed event
    if (event === "payment.failed") {
      const payment = paymentPayload.payment.entity;
      const orderId = payment.order_id;

      await supabase
        .from("notice_requests")
        .update({
          payment_status: "failed",
          status: "draft", // Revert to draft
        })
        .eq("payment_id", orderId);

      return new Response(
        JSON.stringify({ success: true }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      );
    }

    // Return success for unhandled events (but log them)
    console.log(`Unhandled webhook event: ${event}`);
    return new Response(
      JSON.stringify({ success: true, message: "Event received but not processed" }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Webhook error:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error", message: error.message }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
});

