import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { createAdminClient } from "@/lib/supabase/admin";
import { markOrderPaid } from "@/lib/server/orderHelpers";

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
        let orderId = session.metadata?.orderId;
        const sessionId = session.id;

        if (!orderId && sessionId) {
          const { data: found } = await adminSupabase
            .from("orders")
            .select("id")
            .eq("stripe_checkout_session_id", sessionId)
            .maybeSingle();
          orderId = found?.id;
        }

        if (orderId) {
          const paymentIntentId =
            typeof session.payment_intent === "string"
              ? session.payment_intent
              : session.payment_intent?.id;
          await markOrderPaid(adminSupabase, orderId, paymentIntentId);
        }
        break;
      }

      case "payment_intent.succeeded": {
        const paymentIntent = event.data.object;
        const { data: found } = await adminSupabase
          .from("orders")
          .select("id")
          .eq("stripe_payment_intent_id", paymentIntent.id)
          .maybeSingle();
        if (found?.id) {
          await markOrderPaid(adminSupabase, found.id, paymentIntent.id);
        }
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
