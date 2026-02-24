// app/api/create-checkout-session/route.ts
import Stripe from "stripe";

// Add validation for the secret key
if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error("STRIPE_SECRET_KEY is not set in environment variables");
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2024-04-10",
});

export async function POST(request) {
  // Debug: Check if base URL is set correctly
  console.log("NEXT_PUBLIC_BASE_URL:", process.env.NEXT_PUBLIC_BASE_URL);

  const { amount, email, discountCode, widgetId, cancelUrl, successUrl } = await request.json();

  // Validate required fields
  if (!amount || !email) {
    return Response.json(
      {
        error: "Missing required fields: amount and email are required",
      },
      { status: 400 },
    );
  }

  // Validate amount is a positive integer
  if (typeof amount !== "number" || amount <= 0 || !Number.isInteger(amount)) {
    return Response.json(
      {
        error: "Amount must be a positive integer in cents",
      },
      { status: 400 },
    );
  }

  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return Response.json(
      {
        error: "Invalid email format",
      },
      { status: 400 },
    );
  }

  try {
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      customer_email: email,
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: "Donation",
              description: discountCode
                ? `Donation with discount code: ${discountCode}`
                : "Donation",
            },
            unit_amount: amount, // in cents
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      success_url:
        successUrl ||
        `${process.env.NEXT_PUBLIC_BASE_URL}/dashboard?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url:
        cancelUrl ||
        `${process.env.NEXT_PUBLIC_BASE_URL}/payment?canceled=true`,
      metadata: {
        discountCode: discountCode || "",
        widgetId: widgetId || "",
        originalAmount: amount.toString(),
      },
      // Optional: Set automatic tax calculation if you have it configured
      // automatic_tax: { enabled: true },

      // Optional: Add custom fields if needed
      // custom_fields: [
      //   {
      //     key: "donation_purpose",
      //     label: { type: "custom", custom: "Purpose of donation" },
      //     type: "text",
      //     optional: true,
      //   },
      // ],
    });

    if (!session.url) {
      throw new Error("Failed to create session URL");
    }

    return Response.json({ sessionUrl: session.url });
  } catch (error) {
    console.error("Stripe session creation error:", error);

    // Handle different types of Stripe errors
    if (error instanceof Stripe.errors.StripeError) {
      return Response.json(
        {
          error: `Stripe error: ${error.message}`,
        },
        { status: 400 },
      );
    }

    return Response.json(
      {
        error: "Failed to create checkout session. Please try again.",
      },
      { status: 500 },
    );
  }
}
