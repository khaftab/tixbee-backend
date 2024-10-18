import { JsMsg } from "nats";
import { Listener, OrderStatus, PaymentCreatedEvent, Subjects } from "@kh-micro-srv/common";

interface TicketUnavailableEvent {
  subject: "ticket:unavailable";
  data: {
    ticketId: string;
    queueLength: number;
  };
}

export class QueueUpdateListener extends Listener<TicketUnavailableEvent> {
  // @ts-ignore
  subject = "ticket:unavailable";
  consumer_name = "queue";
  // Had to provode type because ts thinks possibility of ressignment of subject (or use readonly keyword).

  async onMessage(data: TicketUnavailableEvent["data"], msg: JsMsg) {
    console.log("TicketUnavailable listner: ", data);
    msg.ack();
  }
}
