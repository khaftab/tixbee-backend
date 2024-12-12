import request from "supertest";
import app from "../../app";
import { getCookie } from "../../test/helper";
import { natsWrapper } from "../../nats-wrapper"; // this will be replaced with the mock file imported in test/setup.ts

it("publish an event when a ticket is created", async () => {
  const response = await request(app).post("/api/tickets").set("Cookie", getCookie()).send({
    title: "test",
    price: 10,
    category: "concert",
    thumbnailImagePublicId: "qplx7tdxtef2wvoffghe",
    ticketImagePublicId: "b5zol3ofgu29wpcfssab",
    description: "describe",
  });
  expect(response.status).toEqual(201);
  const jetstreamClient = natsWrapper.client.jetstream();
  expect(jetstreamClient).toHaveProperty("publish");
  expect(natsWrapper.client.jetstream().publish).toHaveBeenCalled();
});
