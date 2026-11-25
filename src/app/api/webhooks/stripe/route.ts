import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(req: NextRequest) {
  const body = await req.text();
  const signature = req.headers.get("stripe-signature");

  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  let event: any;

  if (webhookSecret && signature) {
    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    } catch (err: any) {
      console.error(`Webhook signature verification failed: ${err.message}`);
      return NextResponse.json({ error: `Webhook Error: ${err.message}` }, { status: 400 });
    }
  } else {
    // If testing webhook directly without secret
    try {
      event = JSON.parse(body);
    } catch {
      return NextResponse.json({ error: "Invalid payload JSON" }, { status: 400 });
    }
  }

  const adminSupabase = createAdminClient();

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object;
        const orderId = session.metadata?.orderId;
        const sessionId = session.id;

        console.log(`Payment confirmed for Checkout Session ${sessionId}, Order ${orderId}`);

        // Update Parent Order to Paid
        let query = adminSupabase.from("orders").update({
          payment_status: "paid",
          order_status: "paid",
          stripe_payment_intent_id: typeof session.payment_intent === "string" ? session.payment_intent : session.payment_intent?.id,
          updated_at: new Date().toISOString(),
        });

        if (orderId) {
          await query.eq("id", orderId);
        } else {
          await query.eq("stripe_checkout_session_id", sessionId);
        }

        // Set all participating vendor orders to 'accepted'
        if (orderId) {
          await adminSupabase
            .from("vendor_orders")
            .update({
              status: "accepted",
              updated_at: new Date().toISOString(),
            })
            .eq("order_id", orderId);

          // Get items and decrement stock
          const { data: items } = await adminSupabase
            .from("order_items")
            .select("product_id, quantity")
            .eq("order_id", orderId);

          if (items && items.length > 0) {
            for (const item of items) {
              if (item.product_id) {
                // Decrement product stock
                const { data: prod } = await adminSupabase
                  .from("products")
                  .select("stock")
                  .eq("id", item.product_id)
                  .single();

                if (prod) {
                  const newStock = Math.max(0, (prod.stock || 0) - item.quantity);
                  await adminSupabase
                    .from("products")
                    .update({ stock: newStock })
                    .eq("id", item.product_id);
                }
              }
            }
          }
        }
        break;
      }

      case "payment_intent.succeeded": {
        const paymentIntent = event.data.object;
        await adminSupabase
          .from("orders")
          .update({
            payment_status: "paid",
            order_status: "paid",
            updated_at: new Date().toISOString(),
          })
          .eq("stripe_payment_intent_id", paymentIntent.id);
        break;
      }

      case "charge.refunded": {
        const charge = event.data.object;
        console.log("Stripe charge refunded:", charge.id);
        break;
      }

      default:
        console.log(`Unhandled Stripe event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (dbErr: any) {
    console.error("Error processing Stripe webhook:", dbErr);
    return NextResponse.json({ error: "Webhook handler failed." }, { status: 500 });
  }
}
