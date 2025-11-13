// Razorpay Create Order Edge Function
// Creates a Razorpay order for notice payment

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const RAZORPAY_KEY_ID = Deno.env.get("RAZORPAY_KEY_ID");
const RAZORPAY_KEY_SECRET = Deno.env.get("RAZORPAY_KEY_SECRET");
const RAZORPAY_BASE_URL = "https://api.razorpay.com/v1";

interface CreateOrderRequest {
  amount: number; // in paise (e.g., 10000 = ₹100)
  currency?: string;
  notice_id: string;
  profile_id: string;
  receipt?: string;
}

serve(async (req) => {
  // Handle CORS
  if (req.method === "OPTIONS") {
    return new Response(null, {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
      },
    });
  }

  try {
    // Verify authentication
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Missing authorization header" }),
        { status: 401, headers: { "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      { global: { headers: { Authorization: authHeader } } }
    );

    // Get user from token
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { "Content-Type": "application/json" } }
      );
    }

    // Parse request body
    const body: CreateOrderRequest = await req.json();
    const { amount, currency = "INR", notice_id, profile_id, receipt } = body;

    // Validate inputs
    if (!amount || amount < 100) {
      return new Response(
        JSON.stringify({ error: "Invalid amount. Minimum ₹1 required." }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    if (profile_id !== user.id) {
      return new Response(
        JSON.stringify({ error: "Profile ID mismatch" }),
        { status: 403, headers: { "Content-Type": "application/json" } }
      );
    }

    // Verify notice exists and belongs to user
    const { data: notice, error: noticeError } = await supabase
      .from("notice_requests")
      .select("id, status, profile_id")
      .eq("id", notice_id)
      .eq("profile_id", profile_id)
      .single();

    if (noticeError || !notice) {
      return new Response(
        JSON.stringify({ error: "Notice not found or access denied" }),
        { status: 404, headers: { "Content-Type": "application/json" } }
      );
    }

    if (notice.status !== "draft") {
      return new Response(
        JSON.stringify({ error: "Notice is not in draft status" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Create Razorpay order
    const orderData = {
      amount: Math.round(amount * 100), // Convert to paise
      currency: currency,
      receipt: receipt || `notice_${notice_id.substring(0, 8)}`,
      notes: {
        notice_id: notice_id,
        profile_id: profile_id,
      },
    };

    const razorpayResponse = await fetch(`${RAZORPAY_BASE_URL}/orders`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Basic ${btoa(`${RAZORPAY_KEY_ID}:${RAZORPAY_KEY_SECRET}`)}`,
      },
      body: JSON.stringify(orderData),
    });

    if (!razorpayResponse.ok) {
      const error = await razorpayResponse.json();
      console.error("Razorpay error:", error);
      return new Response(
        JSON.stringify({ error: "Failed to create Razorpay order", details: error }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    const razorpayOrder = await razorpayResponse.json();

    // Update notice with payment info
    const { error: updateError } = await supabase
      .from("notice_requests")
      .update({
        payment_id: razorpayOrder.id,
        payment_amount: amount,
        payment_currency: currency,
        payment_status: "pending",
        status: "paid", // Will be confirmed by webhook
      })
      .eq("id", notice_id);

    if (updateError) {
      console.error("Error updating notice:", updateError);
      // Don't fail the request, order is created
    }

    return new Response(
      JSON.stringify({
        order_id: razorpayOrder.id,
        amount: razorpayOrder.amount / 100, // Convert back to rupees
        currency: razorpayOrder.currency,
        key_id: RAZORPAY_KEY_ID,
      }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
      }
    );
  } catch (error) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error", message: error.message }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
});

