import { JsMsg } from "nats";
import { Listener, PaymentCreatedEvent, Subjects } from "@kh-micro-srv/common";
import { Ticket } from "../../models/Ticket";
import { Order } from "../../models/Order";

export class PaymentCreatedListener extends Listener<PaymentCreatedEvent> {
  subject: Subjects.PaymentCreated = Subjects.PaymentCreated;
  consumer_name = "orders";
  // Had to provode type because ts thinks possibility of ressignment of subject (or use readonly keyword).

  async onMessage(data: PaymentCreatedEvent["data"], msg: JsMsg) {
    const order = await Order.findById(data.orderId);
    if (!order) {
      throw new Error("Order not found");
    }
    order.set({ status: "complete" });
    await order.save();
    // After completing the order, we don't need to publish event like OrderUpdatedEvent bcs no one is updating order after being complete.
    msg.ack();
  }
}
