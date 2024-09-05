import { Request, Response } from "express";
import {
  NotFoundError,
  NotAuthorizedError,
  BadRequestError,
  OrderStatus,
} from "@kh-micro-srv/common";
import mongoose from "mongoose";
import { natsWrapper } from "../nats-wrapper";
import { Order } from "../models/Order";
import { stripe } from "../stripe";
import { Payment } from "../models/Payment";
import { PaymentCreatedPublisher } from "../events/publishers/payment-created-publisher";

const createCharge = async (req: Request, res: Response) => {
  const { token, orderId } = req.body;
  const order = await Order.findById(orderId);
  if (!order) {
    throw new NotFoundError();
  }
  if (order.userId !== req.currentUser!.id) {
    throw new NotAuthorizedError();
  }
  if (order.status === OrderStatus.Cancelled) {
    throw new BadRequestError("Cannot pay for a cancelled order");
  }
  // /**
  const customer = await stripe.customers.create({
    name: "Jenny Rosen",
    address: {
      line1: "510 Townsend St",
      postal_code: "98140",
      city: "San Francisco",
      state: "CA",
      country: "US",
    },
  });

  const charge = await stripe.charges.create({
    currency: "inr",
    amount: order.price * 100, // stripe expects amount in lowest currency unit.
    source: token,
    description: "Charge for order",
    shipping: {
      name: "Jenny Rosen",
      address: {
        line1: "510 Townsend St",
        postal_code: "98140",
        city: "San Francisco",
        state: "CA",
        country: "US",
      },
    },
  });

  const payment = new Payment({
    orderId: order.id,
    stripeId: charge.id,
  });
  await payment.save();
  new PaymentCreatedPublisher(natsWrapper.client).publish({
    id: payment.id,
    orderId: payment.orderId,
    stripeId: payment.stripeId,
  });

  // */
  res.status(201).send({ id: payment.id });
};

export { createCharge };

async function testPaymentIntent() {
  // Create a Customer
  const customer = await stripe.customers.create({
    name: "Tamu Ahmed",
    address: {
      line1: "510 Townsend St",
      postal_code: "98140",
      city: "San Francisco",
      state: "CA",
      country: "US",
    },
  });

  try {
    // Step 1: Create a PaymentIntent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: 200, // $2.00
      currency: "usd",
      payment_method_types: ["card"],
      description: "Test charge for order",
      payment_method: "pm_card_visa", // Use a test card that doesn't trigger requires_action
      off_session: true, // Confirm the PaymentIntent without handling next actions
      confirm: true, // Automatically confirms the payment
      customer: customer.id,
    });

    console.log("PaymentIntent created:", paymentIntent);

    if (paymentIntent.status === "succeeded") {
      console.log("Payment succeeded without further action:", paymentIntent);
    } else {
      console.log("Payment failed or is pending:", paymentIntent.status);
    }
  } catch (error) {
    console.error("Error:", error);
    throw error;
  }
}
