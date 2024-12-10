import { TicketCreatedEvent } from "@kh-micro-srv/common";
import { Ticket } from "../../../models/Ticket";
import { TicketCreatedListener } from "../ticket-created-listener";
import { natsWrapper } from "../../../nats-wrapper";
import { JsMsg } from "nats";
import mongoose from "mongoose";

const setup = async () => {
  const listener = new TicketCreatedListener(natsWrapper.client);
  const data: TicketCreatedEvent["data"] = {
    id: new mongoose.Types.ObjectId().toHexString(),
    title: "concert",
    price: 20,
    category: "concert",
    thumbnailImagePublicId: "qplx7tdxtef2wvoffghe",
    ticketImagePublicId: "b5zol3ofgu29wpcfssab",
    description: "describe",
    userId: new mongoose.Types.ObjectId().toHexString(),
    orderId: null,
    version: 0,
  };
  // @ts-ignore
  const msg: JsMsg = {
    ack: jest.fn(),
  };
  return { listener, data, msg };
};

it("creates and saves a ticket", async () => {
  const { listener, data, msg } = await setup();
  await listener.onMessage(data, msg);
  const ticket = await Ticket.findById(data.id);

  expect(ticket).toBeDefined();
  expect(ticket!.title).toEqual(data.title);
  expect(ticket!.price).toEqual(data.price);
});

it("acknowledges the message after creating a ticket", async () => {
  const { listener, data, msg } = await setup();
  await listener.onMessage(data, msg);
  expect(msg.ack).toHaveBeenCalled();
});
