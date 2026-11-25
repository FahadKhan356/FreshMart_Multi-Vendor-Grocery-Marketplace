import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { orderId, orderNumber, total, items, customerEmail } = body;

    if (!orderId || !total) {
      return NextResponse.json({ error: "Missing required order parameters." }, { status: 400 });
    }

    const host = req.headers.get("origin") || req.headers.get("host") || "http://localhost:3000";
    const origin = host.startsWith("http") ? host : `https://${host}`;

    // Test or placeholder mode fallback
    const isMockStripe = !process.env.STRIPE_SECRET_KEY || process.env.STRIPE_SECRET_KEY.includes("placeholder");

    if (isMockStripe) {
      // In development/test mode without an active live Stripe secret key,
      // simulate instant payment success and redirect directly to order success
      const adminSupabase = createAdminClient();
      await adminSupabase
        .from("orders")
        .update({
          payment_status: "paid",
          order_status: "paid",
          stripe_payment_intent_id: `pi_mock_${Date.now()}`,
          stripe_checkout_session_id: `cs_mock_${Date.now()}`,
          updated_at: new Date().toISOString(),
        })
        .eq("id", orderId);

      // Auto update vendor orders to accepted
      await adminSupabase
        .from("vendor_orders")
        .update({ status: "accepted", updated_at: new Date().toISOString() })
        .eq("order_id", orderId);

      return NextResponse.json({
        url: `${origin}/order-success?order_id=${orderId}&orderNumber=${orderNumber || "FM-100293"}&mock=true`,
        sessionId: `cs_mock_${Date.now()}`,
      });
    }

    // Build real Stripe line items
    const line_items = (items || []).map((item: any) => ({
      price_data: {
        currency: "usd",
        product_data: {
          name: item.name,
          description: `Store: ${item.storeName || "FreshMart Grocer"} (${item.unit})`,
          images: item.image ? [item.image] : undefined,
        },
        unit_amount: Math.round(item.price * 100),
      },
      quantity: item.quantity,
    }));

    // If no line items passed or small mismatch, pass single multi-vendor grocery basket line item
    if (line_items.length === 0) {
      line_items.push({
        price_data: {
          currency: "usd",
          product_data: {
            name: `FreshMart Multi-Vendor Order #${orderNumber || orderId.slice(0, 8)}`,
            description: "Direct farm-fresh groceries & store items",
          },
          unit_amount: Math.round(total * 100),
        },
        quantity: 1,
      });
    }

    const session = await stripe.checkout.sessions.create({
      line_items,
      mode: "payment",
      customer_email: customerEmail || undefined,
      success_url: `${origin}/order-success?session_id={CHECKOUT_SESSION_ID}&order_id=${orderId}&orderNumber=${orderNumber}`,
      cancel_url: `${origin}/checkout?canceled=true&order_id=${orderId}`,
      metadata: {
        orderId,
        orderNumber: orderNumber || "",
      },
    });

    const adminSupabase = createAdminClient();
    await adminSupabase
      .from("orders")
      .update({
        stripe_checkout_session_id: session.id,
        updated_at: new Date().toISOString(),
      })
      .eq("id", orderId);

    return NextResponse.json({
      url: session.url,
      sessionId: session.id,
    });
  } catch (err: any) {
    console.error("Stripe checkout error:", err);
    return NextResponse.json(
      { error: err.message || "Failed to initiate Stripe Checkout." },
      { status: 500 }
    );
  }
}
