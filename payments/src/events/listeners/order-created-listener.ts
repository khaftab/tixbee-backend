import { Listener, OrderCreatedEvent, OrderStatus, Subjects } from "@kh-micro-srv/common";
import { JsMsg } from "nats";
import { Order } from "../../models/Order";

export class OrderCreatedListener extends Listener<OrderCreatedEvent> {
  subject: Subjects.OrderCreated = Subjects.OrderCreated;
  consumer_name = "payments";

  async onMessage(data: OrderCreatedEvent["data"], msg: JsMsg) {
    const order = new Order({
      _id: data.id,
      userId: data.userId,
      price: data.ticket.price,
      status: data.status,
    });

    await order.save();

    msg.ack();
  }
}
