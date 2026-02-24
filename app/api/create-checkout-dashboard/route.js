import { NextResponse } from "next/server";
import Stripe from "stripe";
import prisma from "@/db";
import { auth } from "@/lib/auth";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export async function POST(request) {
  try {
    const { amount, donationType, metadata, email, discountCode, paymentMethod, cancelUrl, successUrl } = await request.json();

    // Handle free signup with 100% discount
    if (amount === 0 && paymentMethod === "free_discount") {
      const session = await auth();
      
      if (!session?.user?.id) {
        return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
      }

      // Update user to premium
      await prisma.user.update({
        where: { id: session.user.id },
        data: {
          premium: true,
          paymentDetails: {
            push: {
              paymentMethod: "free_discount",
              paymentType: "signup_fee",
              amountPaid: 0,
              paidAt: new Date(),
              pledgeEmail: email,
            },
          },
        },
      });

      return NextResponse.json({ success: true, redirectUrl: "/dashboard" });
    }

    // Validate the amount for paid transactions
    if (!amount || amount <= 0) {
      return NextResponse.json({ error: "Invalid amount" }, { status: 400 });
    }

    // Create checkout session parameters
    const sessionParams = {
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: `Donation to The Clean Program`,
              description:
                donationType === "monthly"
                  ? "Monthly donation"
                  : "One-time donation",
            },
            unit_amount: Math.round(amount * 100), // Stripe expects cents
            ...(donationType === "monthly" && {
              recurring: {
                interval: "month",
              },
            }),
          },
          quantity: 1,
        },
      ],
      mode: donationType === "monthly" ? "subscription" : "payment",
      success_url: successUrl || `${process.env.NEXT_PUBLIC_BASE_URL}/dashboard`,
      cancel_url: cancelUrl || `${process.env.NEXT_PUBLIC_BASE_URL}/payment?canceled=true`,
      metadata: {
        ...metadata,
        amount: amount.toString(),
        donationType,
      },
    };

    // Create the checkout session
    const session = await stripe.checkout.sessions.create(sessionParams);

    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error("Stripe checkout error:", error);
    return NextResponse.json(
      { error: "Failed to create checkout session" },
      { status: 500 },
    );
  }
}
