import { JsMsg } from "nats";
import { Listener, logger, OrderStatus, PaymentCreatedEvent, Subjects } from "@kh-micro-srv/common";
import { Order } from "../../models/Order";
import { TicketUnavailablePublisher } from "../publishers/ticket-unavailable-publisher";
import { natsWrapper } from "../../nats-wrapper";

export class PaymentCreatedListener extends Listener<PaymentCreatedEvent> {
  subject: Subjects.PaymentCreated = Subjects.PaymentCreated;
  consumer_name = "orders";

  async onMessage(data: PaymentCreatedEvent["data"], msg: JsMsg) {
    try {
      const order = await Order.findById(data.orderId);
      if (!order) {
        throw new Error("Order not found");
      }
      order.set({ status: OrderStatus.Complete });
      await order.save();
      // After completing the order, we don't need to publish event like OrderUpdatedEvent bcs no one is updating order after being complete.

      await new TicketUnavailablePublisher(natsWrapper.client).publish({
        ticketId: order.ticket.toString(),
      });
      logger.info("Order successfully completed", {
        orderId: order.id,
        userId: order.userId,
        ticketId: order.ticket.toString(),
        stripeId: data.stripeId,
      });
      msg.ack();
    } catch (error) {
      logger.error("Error processing PaymentCreatedEvent", error);
    }
  }
}
