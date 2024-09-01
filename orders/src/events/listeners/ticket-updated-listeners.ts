import { JsMsg } from "nats";
import { Listener, TicketUpdatedEvent, Subjects } from "@kh-micro-srv/common";
import { Ticket } from "../../models/Ticket";

export class TicketUpdatedListener extends Listener<TicketUpdatedEvent> {
  subject: Subjects.TicketUpdated = Subjects.TicketUpdated;
  // Had to provode type because ts thinks possibility of ressignment of subject (or use readonly keyword).

  async onMessage(data: TicketUpdatedEvent["data"], msg: JsMsg) {
    console.log("Ticket updated listeners Event data!", data);
    const { id: _id, title, price, version } = data;
    const ticket = await Ticket.findOneAndUpdate(
      { _id, version: version - 1 },
      { title, price, version }
    );
    if (!ticket) {
      console.log(ticket);
      throw new Error("Ticket not found");
    }
    msg.ack();
  }
}
