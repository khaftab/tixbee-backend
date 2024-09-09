import request from "supertest";
import app from "../../app";
import { getCookie, createOrder } from "../../test/helper";
import mongoose from "mongoose";
import { Order, OrderStatus } from "../../models/Order";
import { Ticket } from "../../models/Ticket";
import { natsWrapper } from "../../nats-wrapper";

it("has a route handler listening to /api/orders for post requests", async () => {
  const response = await request(app).post("/api/orders").send({});

  expect(response.status).not.toEqual(404);
});

it("can only be accessed if the user is signed in", async () => {
  await request(app).post("/api/orders").send({}).expect(401);
});

it("returns a status other than 401 if the user is signed in", async () => {
  const response = await request(app).post("/api/orders").set("Cookie", getCookie()).send({});

  expect(response.status).not.toEqual(401);
});

it("returns an error if an invalid ticketId is provided", async () => {
  await createOrder("4343422").expect(400);
});

it("returns a 404 if the ticket is not found for the specified order", async () => {
  const ticketId = new mongoose.Types.ObjectId().toHexString(); // 66c6d8f4f2a83ed3e0942234
  await createOrder(ticketId).expect(404);
});

it("returns a 400 if the ticket is already reserved", async () => {
  const ticket = new Ticket({
    title: "My custom test ticket",
    price: 20,
    category: "concert",
    imagePublicId: "123",
    description: "describe",
  });
  await ticket.save();
  const order = new Order({
    userId: "123", // Any user can reserve / buy a ticket
    status: OrderStatus.Created,
    expiresAt: new Date(), // expiration is not required for this test
    ticket,
  });
  await order.save();
  await createOrder(ticket.id).expect(400);
});

it("reserves a ticket", async () => {
  const order = await Order.find({});
  expect(order.length).toEqual(0);
  const ticket = new Ticket({
    title: "My custom test ticket",
    price: 20,
    category: "concert",
    imagePublicId: "123",
    description: "describe",
  });
  await ticket.save();
  await createOrder(ticket.id).expect(201);
  const orders = await Order.find({});
  expect(orders.length).toEqual(1);
  expect(orders[0].ticket.toString()).toEqual(ticket.id);
});

it("emits an order created event", async () => {
  const ticket = new Ticket({
    title: "My custom test ticket",
    price: 20,
    category: "concert",
    imagePublicId: "123",
    description: "describe",
  });
  await ticket.save();
  await createOrder(ticket.id).expect(201);
  expect(natsWrapper.client.jetstream().publish).toHaveBeenCalled();
});
