import { OrderCreatedEvent, Subjects } from "@kh-micro-srv/common";
import { Ticket } from "../../../models/Ticket";
import { OrderCreatedListener } from "../order-created-listener";
import { natsWrapper } from "../../../nats-wrapper";
import { JsMsg, StringCodec } from "nats";
import mongoose from "mongoose";
const setup = async () => {
  // Create an instance of the listener
  const listener = new OrderCreatedListener(natsWrapper.client);
  const ticket = new Ticket({
    title: "concert",
    price: 20,
    userId: new mongoose.Types.ObjectId().toHexString(),
  });
  await ticket.save();

  // Create a fake data event
  const data: OrderCreatedEvent["data"] = {
    id: new mongoose.Types.ObjectId().toHexString(),
    version: 0,
    status: Subjects.TicketCreated,
    userId: new mongoose.Types.ObjectId().toHexString(),
    expiresAt: new Date().toISOString(),
    ticket: {
      id: ticket.id,
      price: ticket.price,
    },
  };
  // Create a fake message object
  // @ts-ignore
  const msg: JsMsg = {
    ack: jest.fn(),
  };
  return { listener, data, msg, ticket };
};

it("sets the orderId of the ticket", async () => {
  const { listener, data, msg, ticket } = await setup();
  await listener.onMessage(data, msg);
  const updatedTicket = await Ticket.findById(ticket.id);
  expect(updatedTicket!.orderId).toEqual(data.id);
});

it("acks the message", async () => {
  const { listener, data, msg } = await setup();
  await listener.onMessage(data, msg);
  expect(msg.ack).toHaveBeenCalled();
});
