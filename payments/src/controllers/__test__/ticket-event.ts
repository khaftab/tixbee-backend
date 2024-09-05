import request from "supertest";
import app from "../../app";
import { getCookie, createTicket } from "../../test/helper";
import { Ticket } from "../../models/Ticket";
import { natsWrapper } from "../../nats-wrapper"; // this will be replaced with the mock file imported in test/setup.ts

it("publish an event when a ticket is created", async () => {
  const response = await request(app)
    .post("/api/tickets")
    .set("Cookie", getCookie())
    .send({ title: "test", price: 20 });
  expect(response.status).toEqual(201);
  const jetstreamClient = natsWrapper.client.jetstream();
  expect(jetstreamClient).toHaveProperty("publish");
  expect(natsWrapper.client.jetstream().publish).toHaveBeenCalled();
});
