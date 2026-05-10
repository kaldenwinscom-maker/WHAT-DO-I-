import { NextRequest, NextResponse } from "next/server";

const PLANS = {
  pro: {
    priceId: process.env.STRIPE_PRO_PRICE_ID || "price_pro",
    name: "Pro Plan",
  },
  agency: {
    priceId: process.env.STRIPE_AGENCY_PRICE_ID || "price_agency",
    name: "Agency Plan",
  },
};

export async function POST(req: NextRequest) {
  try {
    const { plan, userId, email } = await req.json();
    const secretKey = process.env.STRIPE_SECRET_KEY;

    if (!secretKey) {
      return NextResponse.json({ error: "Stripe not configured" }, { status: 500 });
    }

    const planConfig = PLANS[plan as keyof typeof PLANS];
    if (!planConfig) {
      return NextResponse.json({ error: "Invalid plan" }, { status: 400 });
    }

    const { default: Stripe } = await import("stripe");
    const stripe = new Stripe(secretKey);

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      mode: "subscription",
      line_items: [{ price: planConfig.priceId, quantity: 1 }],
      customer_email: email,
      metadata: { userId, plan },
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?upgraded=true`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?canceled=true`,
    });

    return NextResponse.json({ url: session.url });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
