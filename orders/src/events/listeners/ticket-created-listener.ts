import { JsMsg } from "nats";
import { Listener, TicketCreatedEvent, Subjects } from "@kh-micro-srv/common";
import { Ticket } from "../../models/Ticket";

export class TicketCreatedListener extends Listener<TicketCreatedEvent> {
  subject: Subjects.TicketCreated = Subjects.TicketCreated;
  // Had to provode type because ts thinks possibility of ressignment of subject (or use readonly keyword).

  async onMessage(data: TicketCreatedEvent["data"], msg: JsMsg) {
    console.log("Event data!", data);
    const { id: _id, title, price } = data;
    const ticket = await new Ticket({
      _id,
      title,
      price,
    });
    await ticket.save();

    msg.ack();
  }
}
