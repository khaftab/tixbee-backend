import { JsMsg } from "nats";
import { Listener, OrderCreatedEvent, Subjects } from "@kh-micro-srv/common";
import { Ticket } from "../../models/Ticket";
import { TicketUpdatePublisher } from "../publishers/ticket-update-publisher";

export class OrderCreatedListener extends Listener<OrderCreatedEvent> {
  subject: Subjects.OrderCreated = Subjects.OrderCreated;
  consumer_name = "tickets-consumer";
  // Had to provode type because ts thinks possibility of ressignment of subject (or use readonly keyword).

  async onMessage(data: OrderCreatedEvent["data"], msg: JsMsg) {
    const { ticket, id } = data;
    const ticketDoc = await Ticket.findByIdAndUpdate(ticket.id, {
      orderId: id,
    });
    if (!ticketDoc) {
      throw new Error("Ticket not found");
    }
    msg.ack();
  }
}

// Not pubslisheing TicketUpdatedEvent t here because we are not updating the ticket. We are just setting the orderId to null. Using findByIdAndUpdate method to not to update the versrion no. otherwise we will get a version error in future at order service.