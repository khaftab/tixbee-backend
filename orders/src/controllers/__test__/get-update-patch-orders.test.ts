import request from "supertest";
import app from "../../app";
import { getCookie, createOrder, createOrderWithCookie } from "../../test/helper";
import mongoose from "mongoose";
import { Order, OrderStatus } from "../../models/Order";
import { Ticket } from "../../models/Ticket";
import { natsWrapper } from "../../nats-wrapper";

it("has a route handler listening to /api/orders for post requests", async () => {
  const response = await request(app).get("/api/orders").send({});
  expect(response.status).not.toEqual(404);
});

it("returns 401 if not logged in", async () => {
  await request(app).get("/api/orders").send({}).expect(401);
});

it("fetches orders for a particular user", async () => {
  // Create three tickets
  const ticket1 = new Ticket({
    title: "Concert 1",
    price: 10,
  });
  await ticket1.save();

  const ticket2 = new Ticket({
    title: "Concert 2",
    price: 20,
  });
  await ticket2.save();

  const ticket3 = new Ticket({
    title: "Concert 3",
    price: 30,
  });
  await ticket3.save();

  const user1 = getCookie();
  const user2 = getCookie();

  // Create one order as User #1
  await createOrderWithCookie(ticket1.id, user1);

  // Create two orders as User #2
  const { body: orderOne } = await createOrderWithCookie(ticket2.id, user2);
  const { body: orderTwo } = await createOrderWithCookie(ticket3.id, user2);

  // Make request to get orders for User #2
  const response = await request(app).get("/api/orders").set("Cookie", user2).send().expect(200);
  // Make sure we only got the orders for User #2
  expect(response.body.length).toEqual(2);
  expect(response.body[0].id).toEqual(orderOne.id);
  expect(response.body[1].id).toEqual(orderTwo.id);
  expect(response.body[0].ticket.id).toEqual(ticket2.id);
  expect(response.body[1].ticket.id).toEqual(ticket3.id);
});

it("it fetches orders for a particular user", async () => {
  // Create three tickets
  const ticket = new Ticket({
    title: "Concert play",
    price: 10,
  });
  await ticket.save();
  const user = getCookie();

  const { body } = await createOrderWithCookie(ticket.id, user);
  const res = await request(app)
    .get(`/api/orders/${body.id}`)
    .set("Cookie", user)
    .send()
    .expect(200);
  expect(res.body.ticket.id).toEqual(ticket.id);
  expect(res.body.id).toEqual(body.id);
});

it("returns 404 if order is not found", async () => {
  const id = new mongoose.Types.ObjectId().toHexString();
  await request(app).get(`/api/orders/${id}`).set("Cookie", getCookie()).send().expect(404);
});

it("returns 404 if order does not belong to the user", async () => {
  // Typically, it should return 401 unathorized. But, inside our controller, we are silmultaneously checking if the order exists and if the order belongs to the user. So, it will return 404 if the order does not exist with that userId.
  const ticket = new Ticket({
    title: "Concert play",
    price: 10,
  });
  await ticket.save();
  const user = getCookie();

  const { body } = await createOrderWithCookie(ticket.id, user);

  await request(app).get(`/api/orders/${body.id}`).set("Cookie", getCookie()).send().expect(404);
});

it("returns 404 if order is not found for cancellation", async () => {
  const id = new mongoose.Types.ObjectId().toHexString();
  await request(app).patch(`/api/orders/${id}`).set("Cookie", getCookie()).send().expect(404);
});

it("returns 404 if order does not belong to the user for cancellation", async () => {
  const ticket = new Ticket({
    title: "Concert play",
    price: 10,
  });
  await ticket.save();
  const user = getCookie();

  const { body } = await createOrderWithCookie(ticket.id, user);

  await request(app).patch(`/api/orders/${body.id}`).set("Cookie", getCookie()).send().expect(404);
});

it("marks an order as cancelled", async () => {
  const ticket = new Ticket({
    title: "Concert play",
    price: 10,
  });
  await ticket.save();
  const user = getCookie();

  const { body } = await createOrderWithCookie(ticket.id, user);

  await request(app).patch(`/api/orders/${body.id}`).set("Cookie", user).send().expect(204);

  const order = await Order.findById(body.id);

  expect(order!.status).toEqual(OrderStatus.Cancelled);
});

it("emits an order cancelled event", async () => {
  const ticket = new Ticket({
    title: "Concert play",
    price: 10,
  });
  await ticket.save();
  const user = getCookie();

  const { body } = await createOrderWithCookie(ticket.id, user);

  await request(app).patch(`/api/orders/${body.id}`).set("Cookie", user).send().expect(204);

  expect(natsWrapper.client.jetstream().publish).toHaveBeenCalled();
});
