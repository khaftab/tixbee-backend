import request from "supertest";
import app from "../../app";
import { getCookie, createTicket } from "../../test/helper";
import { Ticket } from "../../models/Ticket";
import mongoose from "mongoose";
import { natsWrapper } from "../../nats-wrapper";

it("returns a 404 if the provided id does not exist", async () => {
  const id = new mongoose.Types.ObjectId().toHexString();
  await request(app)
    .put(`/api/tickets/${id}`)
    .set("Cookie", getCookie())
    .send({
      title: "test",
      price: 10,
      category: "concert",
      thumbnailImagePublicId: "qplx7tdxtef2wvoffghe",
      ticketImagePublicId: "b5zol3ofgu29wpcfssab",
      description: "describe",
    })
    .expect(404);
});

it("returns a 401 if the user is not authenticated", async () => {
  const id = new mongoose.Types.ObjectId().toHexString();
  await request(app).put(`/api/tickets/${id}`).send({ title: "test", price: 20 }).expect(401);
});

it("returns a 401 if the user does not own the ticket", async () => {
  const response = await createTicket("test", 20);
  await request(app)
    .put(`/api/tickets/${response.body.id}`)
    .set("Cookie", getCookie())
    .send({
      title: "test",
      price: 10,
      category: "concert",
      thumbnailImagePublicId: "qplx7tdxtef2wvoffghe",
      ticketImagePublicId: "b5zol3ofgu29wpcfssab",
      description: "describe",
    })
    .expect(401);

  const ticket = await Ticket.findById(response.body.id);
  expect(ticket!.price).toEqual(20);
  expect(ticket!.title).toEqual("test");
});

it("returns a 400 if the user provides an invalid title or price or category", async () => {
  const cookie = getCookie(); // User has be same to update the ticket
  const response = await request(app)
    .post("/api/tickets")
    .set("Cookie", cookie)
    .send({ title: "test", price: 20 });

  await request(app)
    .put(`/api/tickets/${response.body.id}`)
    .set("Cookie", cookie)
    .send({ title: "", price: 20 })
    .expect(400);
  await request(app)
    .put(`/api/tickets/${response.body.id}`)
    .set("Cookie", cookie)
    .send({ price: 20 })
    .expect(400);
  await request(app)
    .put(`/api/tickets/${response.body.id}`)
    .set("Cookie", cookie)
    .send({ title: "test", price: -20 })
    .expect(400);
  await request(app)
    .put(`/api/tickets/${response.body.id}`)
    .set("Cookie", cookie)
    .send({ title: "test", price: 20, category: "miscellaneous" })
    .expect(400);
});

it("updates the ticket provided valid inputs", async () => {
  const cookie = getCookie();
  const response = await request(app)
    .post("/api/tickets")
    .set("Cookie", cookie)
    .send({
      title: "test",
      price: 10,
      category: "concert",
      thumbnailImagePublicId: "qplx7tdxtef2wvoffghe",
      ticketImagePublicId: "b5zol3ofgu29wpcfssab",
      description: "describe",
    })
    .expect(201);
  await request(app)
    .put(`/api/tickets/${response.body.id}`)
    .set("Cookie", cookie)
    .send({
      title: "updated title",
      price: 100,
      category: "concert",
      thumbnailImagePublicId: "1234",
      ticketImagePublicId: "4321",
      description: "updated describe",
    })
    .expect(200);
  const ticketResponse = await request(app)
    .get(`/api/tickets/${response.body.id}`)
    .set("Cookie", cookie);

  const ticketRes = await request(app).get(`/api/tickets/${response.body.id}`);
  // without the ticket creating user, it will return empty string on tikcet image.
  expect(ticketRes.body.ticketImagePublicId).toEqual("");
  expect(ticketResponse.body.title).toEqual("updated title");
  expect(ticketResponse.body.price).toEqual(100);
  expect(ticketResponse.body.category).toEqual("concert");
  expect(ticketResponse.body.thumbnailImagePublicId).toEqual("1234");
  expect(ticketResponse.body.ticketImagePublicId).toEqual("4321");
  expect(ticketResponse.body.description).toEqual("updated describe");
});

it("publishes an event after updating a ticket", async () => {
  const cookie = getCookie();
  const response = await request(app)
    .post("/api/tickets")
    .set("Cookie", cookie)
    .send({
      title: "test",
      price: 10,
      category: "concert",
      thumbnailImagePublicId: "qplx7tdxtef2wvoffghe",
      ticketImagePublicId: "b5zol3ofgu29wpcfssab",
      description: "describe",
    })
    .expect(201);
  await request(app)
    .put(`/api/tickets/${response.body.id}`)
    .set("Cookie", cookie)
    .send({
      title: "updated title",
      price: 100,
      category: "concert",
      thumbnailImagePublicId: "qplx7tdxtef2wvoffghe",
      ticketImagePublicId: "b5zol3ofgu29wpcfssab",
      description: "updated describe",
    })
    .expect(200);
  expect(natsWrapper.client.jetstream().publish).toHaveBeenCalled();
});

it("rejects updates if the ticket is reserved", async () => {
  const cookie = getCookie();
  const response = await request(app)
    .post("/api/tickets")
    .set("Cookie", cookie)
    .send({
      title: "test",
      price: 10,
      category: "concert",
      thumbnailImagePublicId: "qplx7tdxtef2wvoffghe",
      ticketImagePublicId: "b5zol3ofgu29wpcfssab",
      description: "describe",
    })
    .expect(201);
  const ticket = await Ticket.findById(response.body.id);
  ticket!.set({ orderId: new mongoose.Types.ObjectId().toHexString() });
  await ticket!.save();
  await request(app)
    .put(`/api/tickets/${response.body.id}`)
    .set("Cookie", cookie)
    .send({
      title: "updated title",
      price: 100,
      category: "concert",
      thumbnailImagePublicId: "qplx7tdxtef2wvoffghe",
      ticketImagePublicId: "b5zol3ofgu29wpcfssab",
      description: "updated describe",
    })
    .expect(400);
});
