import { Request, Response } from "express";
import {
  NotFoundError,
  NotAuthorizedError,
  BadRequestError,
  OrderStatus,
  logger,
} from "@kh-micro-srv/common";
import { natsWrapper } from "../nats-wrapper";
import { Order } from "../models/Order";
import { stripe } from "../stripe";
import { Payment } from "../models/Payment";
import { PaymentCreatedPublisher } from "../events/publishers/payment-created-publisher";

const createCharge = async (req: Request, res: Response) => {
  const { token, orderId, billingInfo } = req.body;
  const billingAddress = { ...billingInfo };
  delete billingAddress.name;
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

  let customer;
  const existingCustomers = await stripe.customers.list({
    email: req.currentUser!.email,
    limit: 1,
  });

  if (existingCustomers.data.length > 0) {
    // Use existing customer
    customer = existingCustomers.data[0];
  } else {
    // Create new customer if not found
    customer = await stripe.customers.create({
      email: req.currentUser!.email,
      name: billingInfo.name,
      address: {
        ...billingAddress,
      },
    });
  }

  const paymentIntent = await stripe.paymentIntents.create({
    customer: customer.id,
    amount: order.price * 100,
    currency: "usd",
    payment_method: token,
    confirm: true,
    automatic_payment_methods: {
      enabled: true,
      allow_redirects: "never",
    },
    description: "Charge for order",
    shipping: {
      name: billingInfo.name,
      address: {
        ...billingAddress,
      },
    },
    metadata: {
      orderId: order.id,
      userId: req.currentUser!.id,
    },
  });

  if (paymentIntent.status === "requires_action") {
    // 3D Secure authentication is required
    return res.status(200).send({
      requiresAction: true,
      clientSecret: paymentIntent.client_secret,
    });
  } else if (paymentIntent.status === "succeeded") {
    // Payment is successful without 3D Secure
    return res.status(200).send({ success: true });
  } else {
    // Payment failed
    throw new BadRequestError("Payment failed");
  }
};

const webhook = async (req: Request, res: Response) => {
  const sig = req.headers["stripe-signature"];
  let event;

  try {
    // Use the production webhook secret
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;
    event = stripe.webhooks.constructEvent(req.body, sig!, webhookSecret);
  } catch (err: any) {
    logger.error(`⚠️  Webhook signature verification failed.`, err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Handle the event
  if (event.type === "payment_intent.succeeded") {
    const paymentIntent = event.data.object;
    try {
      const payment = new Payment({
        orderId: paymentIntent.metadata.orderId,
        stripeId: paymentIntent.id,
      });
      await payment.save();
      logger.info("Payment successfull", {
        id: payment.id,
        orderId: payment.orderId,
        stripeId: payment.stripeId,
      });
      new PaymentCreatedPublisher(natsWrapper.client).publish({
        id: payment.id,
        orderId: payment.orderId,
        stripeId: payment.stripeId,
      });
      res.status(201).send({ id: payment.id });
    } catch (error) {
      logger.error(error);
    }
  }

  // Return a 200 response to acknowledge receipt of the event
  res.send();
};

export { createCharge, webhook };
