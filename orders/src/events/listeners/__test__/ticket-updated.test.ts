import { TicketUpdatedEvent } from "@kh-micro-srv/common";
import { Ticket } from "../../../models/Ticket";
import { natsWrapper } from "../../../nats-wrapper";
import { JsMsg } from "nats";
import mongoose from "mongoose";
import { TicketUpdatedListener } from "../ticket-updated-listeners";

const updateSetup = async () => {
  const listener = new TicketUpdatedListener(natsWrapper.client);
  const ticket = new Ticket({
    title: "concert",
    price: 20,
  });
  await ticket.save();
  const data: TicketUpdatedEvent["data"] = {
    id: ticket.id,
    title: "new concert",
    price: 209,
    userId: new mongoose.Types.ObjectId().toHexString(),
    version: ticket.version + 1,
  };
  // @ts-ignore
  const msg: JsMsg = {
    ack: jest.fn(),
  };
  return { listener, data, msg, ticket };
};

it("updates a ticket", async () => {
  const { listener, data, msg, ticket } = await updateSetup();
  await listener.onMessage(data, msg);
  const updatedTicket = await Ticket.findById(data.id);
  console.log(ticket);
  expect(updatedTicket).toBeDefined();
  expect(updatedTicket!.title).toEqual(data.title);
  expect(updatedTicket!.price).toEqual(data.price);
  expect(updatedTicket!.version).toEqual(data.version);
});

it("acknowledges the message after updating a ticket", async () => {
  const { listener, data, msg } = await updateSetup();
  await listener.onMessage(data, msg);
  expect(msg.ack).toHaveBeenCalled();
});

it("does not acknowledge the message if the version is not consecutive", async () => {
  const { listener, data, msg } = await updateSetup();
  data.version = 10;
  try {
    await listener.onMessage(data, msg);
  } catch (err) {}
  expect(msg.ack).not.toHaveBeenCalled();
});
