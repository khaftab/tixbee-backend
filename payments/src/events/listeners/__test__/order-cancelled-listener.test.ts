import { OrderCancelledEvent, OrderStatus } from "@kh-micro-srv/common";
import { natsWrapper } from "../../../nats-wrapper";
import { OrderCancelledListener } from "../order-cancelled-listener";
import mongoose from "mongoose";
import { JsMsg } from "nats";
import { Order } from "../../../models/Order";

const setup = async () => {
  // Create an instance of the listener
  const listener = new OrderCancelledListener(natsWrapper.client);

  const order = new Order({
    _id: new mongoose.Types.ObjectId().toHexString(),
    price: 10,
    userId: new mongoose.Types.ObjectId().toHexString(),
    status: OrderStatus.Created,
  });

  await order.save();

  // Create a fake data event
  const data: OrderCancelledEvent["data"] = {
    id: order.id,
    version: order.version + 1,
    ticket: {
      id: new mongoose.Types.ObjectId().toHexString(),
    },
  };

  // Create a fake message object
  // @ts-ignore
  const msg: JsMsg = {
    ack: jest.fn(),
  };

  return { listener, data, msg };
};

it("update the order status to cancelled", async () => {
  const { listener, data, msg } = await setup();

  // Call the onMessage function with the data object + message object
  await listener.onMessage(data, msg);

  // Write assertions to make sure a ticket was created!
  const order = await Order.findById(data.id);

  expect(order).toBeDefined();
  expect(order!.status).toEqual(OrderStatus.Cancelled);
});

it("acks the message", async () => {
  const { listener, data, msg } = await setup();

  // Call the onMessage function with the data object + message object
  await listener.onMessage(data, msg);

  // Write assertions to make sure ack function is called
  expect(msg.ack).toHaveBeenCalled();
});
