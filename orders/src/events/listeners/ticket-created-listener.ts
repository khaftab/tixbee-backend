import { JsMsg } from "nats";
import { Listener, TicketCreatedEvent, Subjects } from "@kh-micro-srv/common";
import { Ticket } from "../../models/Ticket";

export class TicketCreatedListener extends Listener<TicketCreatedEvent> {
  subject: Subjects.TicketCreated = Subjects.TicketCreated;
  consumer_name = "orders";
  // Had to provode type because ts thinks possibility of ressignment of subject (or use readonly keyword).

  async onMessage(data: TicketCreatedEvent["data"], msg: JsMsg) {
    const { id: _id, title, price, category, imagePublicId, description } = data;
    const ticket = await new Ticket({
      _id,
      title,
      price,
      category,
      imagePublicId,
      description,
    });
    await ticket.save();

    msg.ack();
  }
}
