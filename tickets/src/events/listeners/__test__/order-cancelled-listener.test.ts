import { OrderCancelledEvent } from "@kh-micro-srv/common";
import { Ticket } from "../../../models/Ticket";
import { OrderCancelledListener } from "../order-cancelled-listener";
import { natsWrapper } from "../../../nats-wrapper";
import { JsMsg } from "nats";
import mongoose from "mongoose";
const setup = async () => {
  // Create an instance of the listener
  const listener = new OrderCancelledListener(natsWrapper.client);
  const orderId = new mongoose.Types.ObjectId().toHexString();
  const ticket = new Ticket({
    title: "Title",
    price: 20,
    userId: new mongoose.Types.ObjectId().toHexString(),
    category: "concert",
    thumbnailImagePublicId: "sf23opsenxoss",
    ticketImagePublicId: "wtopenvSvso322",
    description: "describe",
  });
  ticket.set({ orderId });
  await ticket.save();
  // Create a fake data event
  const data: OrderCancelledEvent["data"] = {
    id: new mongoose.Types.ObjectId().toHexString(),
    version: 0,
    ticket: {
      id: ticket.id,
    },
  };
  // Create a fake message object
  // @ts-ignore
  const msg: JsMsg = {
    ack: jest.fn(),
  };
  return { listener, data, msg, ticket, orderId };
};

it("updates the ticket, publishes an event, and acks the message", async () => {
  const { listener, data, msg, ticket } = await setup();
  await listener.onMessage(data, msg);
  const updatedTicket = await Ticket.findById(ticket.id);
  expect(updatedTicket!.orderId).toEqual(null);
  expect(msg.ack).toHaveBeenCalled();
});
