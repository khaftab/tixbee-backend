import { JsMsg } from "nats";
import { Listener, TicketCreatedEvent, Subjects } from "@kh-micro-srv/common";
import { Ticket } from "../../models/Ticket";

export class TicketCreatedListener extends Listener<TicketCreatedEvent> {
  subject: Subjects.TicketCreated = Subjects.TicketCreated;
  consumer_name = "orders";

  async onMessage(data: TicketCreatedEvent["data"], msg: JsMsg) {
    const {
      id: _id,
      title,
      price,
      category,
      thumbnailImagePublicId,
      ticketImagePublicId,
      description,
    } = data;
    const ticket = await new Ticket({
      _id,
      title,
      price,
      category,
      thumbnailImagePublicId,
      ticketImagePublicId,
      description,
    });
    await ticket.save();

    msg.ack();
  }
}
