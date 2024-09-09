import { JsMsg } from "nats";
import { Listener, TicketUpdatedEvent, Subjects } from "@kh-micro-srv/common";
import { Ticket } from "../../models/Ticket";

export class TicketUpdatedListener extends Listener<TicketUpdatedEvent> {
  subject: Subjects.TicketUpdated = Subjects.TicketUpdated;
  consumer_name = "orders";
  // Had to provode type because ts thinks possibility of ressignment of subject (or use readonly keyword).

  async onMessage(data: TicketUpdatedEvent["data"], msg: JsMsg) {
    const { id: _id, title, price, version, category, imagePublicId, description } = data;
    /* 
     // Alternative way to update the ticket
     const ticket = await Ticket.findOneAndUpdate(
       { _id, version: version - 1 },
       { title, price, version }
     );
     */
    const ticket = await Ticket.findOne({ _id, version: version - 1 });
    if (!ticket) {
      throw new Error("Ticket not found");
    }
    ticket.set({ title, price, category, imagePublicId, description });
    await ticket.save();
    msg.ack();
  }
}
