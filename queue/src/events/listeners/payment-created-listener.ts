import { JsMsg } from "nats";
import { Listener, OrderStatus, PaymentCreatedEvent, Subjects } from "@kh-micro-srv/common";
import { Ticket } from "../../models/Ticket";

export class PaymentCreatedListener extends Listener<PaymentCreatedEvent> {
  subject: Subjects.PaymentCreated = Subjects.PaymentCreated;
  consumer_name = "queue";
  // Had to provode type because ts thinks possibility of ressignment of subject (or use readonly keyword).

  async onMessage(data: PaymentCreatedEvent["data"], msg: JsMsg) {
    console.log("hellow buddydy");

    const ticket = await Ticket.findOne({ orderId: data.orderId });
    if (!ticket) {
      throw new Error("Ticket not found");
    }
    ticket.orderStatus = OrderStatus.Complete;
    await Ticket.updateOne({ _id: ticket._id }, { orderStatus: OrderStatus.Complete });
    // After completing the order, we don't need to publish event like OrderUpdatedEvent bcs no one is updating order after being complete.
    msg.ack();
  }
}
