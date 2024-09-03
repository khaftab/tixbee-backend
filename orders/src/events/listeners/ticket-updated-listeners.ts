import { JsMsg } from "nats";
import { Listener, TicketUpdatedEvent, Subjects } from "@kh-micro-srv/common";
import { Ticket } from "../../models/Ticket";

export class TicketUpdatedListener extends Listener<TicketUpdatedEvent> {
  subject: Subjects.TicketUpdated = Subjects.TicketUpdated;
  consumer_name = "orders-consumer";
  // Had to provode type because ts thinks possibility of ressignment of subject (or use readonly keyword).

  async onMessage(data: TicketUpdatedEvent["data"], msg: JsMsg) {
    // console.log("Ticket updated data received: order__", data);
    const { id: _id, title, price, version } = data;

    // Using of ticket.set() and ticket.save() for updating ticket, will not increment the version number if the updated value is same as before. Since, in this ticket model, it has title & price property, so it will not update for orderCancel event. .So, we have to use findOneAndUpdate() method.
    const ticket = await Ticket.findOneAndUpdate(
      { _id, version: version - 1 },
      { title, price, version }
    );
    if (!ticket) {
      throw new Error("Ticket not found");
    }

    msg.ack();
  }
}
