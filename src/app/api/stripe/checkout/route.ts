import { createClient as createServerClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { logger } from "@/lib/logging/logger";
import { NextRequest, NextResponse } from "next/server";
import { getStripe, requireEnv } from '@/lib/billing/stripe';



export async function POST(request: NextRequest) {
  try {
    const serverClient = await createServerClient();
    const { data: { user } } = await serverClient.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = user.id;
    const adminClient = createAdminClient();

    const { data: profile, error: profileError } = await adminClient
      .from("profiles")
      .select("stripe_customer_id, email")
      .eq("id", userId)
      .single();

    if (profileError) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    let customerId = profile.stripe_customer_id;

    if (!customerId) {
      const customer = await getStripe().customers.create({
        email: profile.email,
        metadata: { userId },
      });

      customerId = customer.id;

      await adminClient
        .from("profiles")
        .update({ stripe_customer_id: customerId })
        .eq("id", userId);
    }

    const session = await getStripe().checkout.sessions.create({
      customer: customerId,
      mode: "subscription",
      line_items: [
        {
          price: requireEnv('STRIPE_PRICE_ID'),
          quantity: 1,
        },
      ],
      metadata: { supabase_user_id: userId },
      success_url: `${requireEnv('NEXT_PUBLIC_APP_URL')}/dashboard?upgraded=true`,
      cancel_url: `${requireEnv('NEXT_PUBLIC_APP_URL')}/#pricing`,
    });

    return NextResponse.json({ url: session.url });
  } catch (error) {
    logger.error("Checkout error:", { error });
    return NextResponse.json(
      { error: "Failed to create checkout session" },
      { status: 500 }
    );
  }
}
