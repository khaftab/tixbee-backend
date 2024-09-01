import { JsMsg } from "nats";
import { Listener, OrderCancelledEvent, Subjects } from "@kh-micro-srv/common";
import { Ticket } from "../../models/Ticket";
import { TicketUpdatePublisher } from "../publishers/ticket-update-publisher";
export class OrderCancelledListener extends Listener<OrderCancelledEvent> {
  subject: Subjects.OrderCancelled = Subjects.OrderCancelled;

  async onMessage(data: OrderCancelledEvent["data"], msg: JsMsg) {
    const ticket = await Ticket.findById(data.ticket.id);
    if (!ticket) {
      throw new Error("Ticket not found");
    }
    ticket.set({ orderId: undefined }); // Since orderId is optional, it some ts files, so putting null does not work all times. So, undefined is used.
    await ticket.save();
    await new TicketUpdatePublisher(this.nc).publish({
      id: ticket.id,
      title: ticket.title,
      price: ticket.price,
      userId: ticket.userId,
      orderId: ticket.orderId,
      version: ticket.version,
    });
    msg.ack();
  }
}
