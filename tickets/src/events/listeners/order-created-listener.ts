import { JsMsg } from "nats";
import { Listener, OrderCreatedEvent, Subjects } from "@kh-micro-srv/common";
import { Ticket } from "../../models/Ticket";
import { TicketUpdatePublisher } from "../publishers/ticket-update-publisher";

export class OrderCreatedListener extends Listener<OrderCreatedEvent> {
  subject: Subjects.OrderCreated = Subjects.OrderCreated;
  // Had to provode type because ts thinks possibility of ressignment of subject (or use readonly keyword).

  async onMessage(data: OrderCreatedEvent["data"], msg: JsMsg) {
    console.log("Event data!", data);
    const { ticket, id } = data;
    const ticketDoc = await Ticket.findById(ticket.id);
    if (!ticketDoc) {
      throw new Error("Ticket not found");
    }
    ticketDoc.set({ orderId: id });
    await ticketDoc.save();
    await new TicketUpdatePublisher(this.nc).publish({
      id: ticketDoc.id,
      title: ticketDoc.title,
      price: ticketDoc.price,
      userId: ticketDoc.userId,
      orderId: ticketDoc.orderId,
      version: ticketDoc.version,
    });
    msg.ack();
  }
}
