import { JsMsg } from "nats";
import { Listener, OrderCancelledEvent, Subjects } from "@kh-micro-srv/common";
import { Ticket } from "../../models/Ticket";
import { TicketUpdatePublisher } from "../publishers/ticket-update-publisher";
export class OrderCancelledListener extends Listener<OrderCancelledEvent> {
  subject: Subjects.OrderCancelled = Subjects.OrderCancelled;
  consumer_name = "tickets-consumer";

  async onMessage(data: OrderCancelledEvent["data"], msg: JsMsg) {
    const ticket = await Ticket.findByIdAndUpdate(data.ticket.id, {
      orderId: null,
    });
    if (!ticket) {
      throw new Error("Ticket not found");
    }
    msg.ack();
  }
}
