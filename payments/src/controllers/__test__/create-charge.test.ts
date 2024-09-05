import request from "supertest";
import app from "../../app";
import { getCookie, createTicket } from "../../test/helper";
import mongoose from "mongoose";
import { Order } from "../../models/Order";
import { OrderStatus } from "@kh-micro-srv/common";
import { stripe } from "../../stripe";
import { Payment } from "../../models/Payment";

it("should return 404 if order does not exist", async () => {
  const orderId = new mongoose.Types.ObjectId().toHexString();
  await request(app)
    .post("/api/payments")
    .set("Cookie", getCookie())
    .send({
      token: "tok_visa",
      orderId,
    })
    .expect(404);
});

it("should return 401 if order does not belong to the user", async () => {
  const order = await new Order({
    userId: new mongoose.Types.ObjectId().toHexString(),
    status: OrderStatus.Created,
    price: 10,
  });
  await order.save();
  await request(app)
    .post("/api/payments")
    .set("Cookie", getCookie())
    .send({
      token: "tok_visa",
      orderId: order.id,
    })
    .expect(401);
});

it("should return 400 if order is cancelled", async () => {
  const order = await new Order({
    userId: new mongoose.Types.ObjectId().toHexString(),
    status: OrderStatus.Cancelled,
    price: 10,
  });
  await order.save();
  await request(app)
    .post("/api/payments")
    .set("Cookie", getCookie(order.userId))
    .send({
      token: "tok_visa",
      orderId: order.id,
    })
    .expect(400);
});

it("should return 201 with valid inputs", async () => {
  const order = await new Order({
    userId: new mongoose.Types.ObjectId().toHexString(),
    status: OrderStatus.Created,
    price: Math.floor(Math.random() * 100),
  });
  await order.save();

  // this will create acutal charge (test) in stripe not a mock
  await request(app)
    .post("/api/payments")
    .set("Cookie", getCookie(order.userId))
    .send({
      token: "tok_visa",
      orderId: order.id,
    })
    .expect(201);

  const stripeCharges = await stripe.charges.list({ limit: 50 });
  const stripeCharge = stripeCharges.data.find((charge) => charge.amount === order.price * 100);
  expect(stripeCharge).toBeDefined();
  expect(stripeCharge!.currency).toEqual("inr");

  const payment = await Payment.findOne({
    orderId: order.id,
    stripeId: stripeCharge!.id,
  });
  // .toBeDefined() returns true for null. So, we use .not.toBeNull() as payment might be null or payment data. So, toBeDefined() will return true for both cases.
  expect(payment).not.toBeNull();
  expect(payment!.orderId).toEqual(order.id);
  expect(payment!.stripeId).toEqual(stripeCharge!.id);
});
