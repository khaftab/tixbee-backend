import request from "supertest";
import app from "../../app";
import { getCookie, createTicket } from "../../test/helper";
import { Ticket } from "../../models/Ticket";
import mongoose from "mongoose";

it("has a route handler listening to /api/tickets for post requests", async () => {
  const response = await request(app).post("/api/tickets").send({});

  expect(response.status).not.toEqual(404);
});

it("can only be accessed if the user is signed in", async () => {
  await request(app).post("/api/tickets").send({}).expect(401);
});

it("returns a status other than 401 if the user is signed in", async () => {
  const response = await request(app).post("/api/tickets").set("Cookie", getCookie()).send({});

  expect(response.status).not.toEqual(401);
});

it("returns an error if an invalid title is provided", async () => {
  await createTicket("", 10).expect(400);
  await request(app)
    .post("/api/tickets")
    .set("Cookie", getCookie())
    .send({ price: 10 })
    .expect(400);
});

it("returns an error if an invalid price is provided", async () => {
  await createTicket("test", -10).expect(400);
  await request(app)
    .post("/api/tickets")
    .set("Cookie", getCookie())
    .send({ title: "test" })
    .expect(400);
});

it("creates a ticket with valid inputs", async () => {
  // add in a check to make sure a ticket was saved
  let tickets = await Ticket.find({});
  expect(tickets.length).toEqual(0);
  const title = "test";
  const price = 20;
  await createTicket(title, price).expect(201);
  tickets = await Ticket.find({});
  expect(tickets.length).toEqual(1);
  expect(tickets[0].price).toEqual(price);
  expect(tickets[0].title).toEqual(title);
});

// Get the ticket

it("returns a 404 if the ticket is not found", async () => {
  const id = new mongoose.Types.ObjectId().toHexString(); // 66c6d8f4f2a83ed3e0942234
  await request(app).get(`/api/tickets/${id}`).send().expect(404);
});

it("returns the ticket if the ticket is found", async () => {
  const title = "test";
  const price = 20;
  const response = await createTicket(title, price).expect(201);
  const ticketResponse = await request(app)
    .get(`/api/tickets/${response.body.id}`)
    .send()
    .expect(200);
  expect(ticketResponse.body.title).toEqual(title);
  expect(ticketResponse.body.price).toEqual(price);
});

it("returns all tickets", async () => {
  const title = "test";
  const price = 20;
  await createTicket(title, price).expect(201);
  await createTicket(title, price).expect(201);
  const response = await request(app).get("/api/tickets").send().expect(200);
  expect(response.body.length).toEqual(2);
});
