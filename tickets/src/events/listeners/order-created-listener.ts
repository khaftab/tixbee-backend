import { JsMsg } from "nats";
import { Listener, OrderCreatedEvent, Subjects } from "@kh-micro-srv/common";
import { Ticket } from "../../models/Ticket";
import { TicketUpdatePublisher } from "../publishers/ticket-update-publisher";

export class OrderCreatedListener extends Listener<OrderCreatedEvent> {
  subject: Subjects.OrderCreated = Subjects.OrderCreated;
  consumer_name = "tickets-consumer";

  async onMessage(data: OrderCreatedEvent["data"], msg: JsMsg) {
    const { ticket, id } = data;
    const ticketDoc = await Ticket.findByIdAndUpdate(
      ticket.id,
      { orderId: id },
      { timestamps: false } // timestamps: false prevents updatedAt from being changed
    );
    if (!ticketDoc) {
      throw new Error("Ticket not found");
    }
    msg.ack();
  }
}

// If timestamp not set to false, this will update updated property in ticket collection, which will relect in the frontned as a newly updated ticket.

// Not pubslisheing TicketUpdatedEvent t here because we are not updating the ticket. We are just setting the orderId to null. Using findByIdAndUpdate method to not to update the versrion no. otherwise we will get a version error in future at order service.
