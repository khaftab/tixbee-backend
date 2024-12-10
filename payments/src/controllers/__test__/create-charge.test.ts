import request from "supertest";
import app from "../../app";
import { getCookie } from "../../test/helper";
import mongoose from "mongoose";
import { Order } from "../../models/Order";
import { OrderStatus } from "@kh-micro-srv/common";

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
