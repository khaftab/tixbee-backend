import { Listener, OrderCancelledEvent, OrderStatus, Subjects } from "@kh-micro-srv/common";
import { JsMsg } from "nats";
import { Order } from "../../models/Order";

export class OrderCancelledListener extends Listener<OrderCancelledEvent> {
  subject: Subjects.OrderCancelled = Subjects.OrderCancelled;
  consumer_name = "payments";

  async onMessage(data: OrderCancelledEvent["data"], msg: JsMsg) {
    // Here, we don't need to filter by version because we don't have any update event to update order. So, we can directly find the order by id and set the status "cancelled". But for the sake of future proofing, we are filtering by version.

    const order = await Order.findOne({ _id: data.id, version: data.version - 1 });

    if (!order) {
      throw new Error("Order not found");
    }

    order.set({ status: OrderStatus.Cancelled });
    await order.save();

    msg.ack();
  }
}
