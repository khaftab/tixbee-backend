import { JsMsg, StringCodec } from "nats";
import { Order, OrderStatus } from "../../../models/Order";
import { natsWrapper } from "../../../nats-wrapper";
import { ExpirationCompleteListener } from "../expiration-complete-listener";
import { Ticket } from "../../../models/Ticket";
import { ExpirationCompleteEvent } from "@kh-micro-srv/common";

const setup = async () => {
  // Create an instance of the listener
  const listener = new ExpirationCompleteListener(natsWrapper.client);

  const ticket = new Ticket({
    title: "concert",
    price: 20,
  });
  await ticket.save();

  const order = new Order({
    status: OrderStatus.Created,
    userId: "randomUserId",
    expiresAt: new Date(),
    ticket,
  });
  await order.save();

  // Create a fake data event
  const data: ExpirationCompleteEvent["data"] = {
    orderId: order.id,
  };

  // Create a fake message object
  // @ts-ignore
  const msg: JsMsg = {
    ack: jest.fn(),
  };

  return { listener, order, data, msg };
};

it("updates the order status to cancelled", async () => {
  const { listener, order, data, msg } = await setup();

  await listener.onMessage(data, msg);

  const updatedOrder = await Order.findById(order.id);
  expect(updatedOrder!.status).toEqual(OrderStatus.Cancelled);
});

it("emits an OrderCancelled event", async () => {
  const { listener, order, data, msg } = await setup();

  await listener.onMessage(data, msg);

  expect(natsWrapper.client.jetstream().publish).toHaveBeenCalled();

  const sc = StringCodec();
  const unitArrayPayload = (natsWrapper.client.jetstream().publish as jest.Mock).mock.calls[0][1];
  const payload = JSON.parse(sc.decode(unitArrayPayload));

  expect(payload.id).toEqual(order.id);
});

it("acks the message", async () => {
  const { listener, data, msg } = await setup();

  await listener.onMessage(data, msg);

  expect(msg.ack).toHaveBeenCalled();
});
