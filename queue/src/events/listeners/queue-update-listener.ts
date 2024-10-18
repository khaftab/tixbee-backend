import { JsMsg } from "nats";
import { Listener, OrderStatus, PaymentCreatedEvent, Subjects } from "@kh-micro-srv/common";
import { Ticket } from "../../models/Ticket";
// import { Order } from "../../models/Order";

interface QueueUpdateEvent {
  subject: "ticket:queue-update";
  data: {
    ticketId: string;
    queueLength: number;
  };
}

export class QueueUpdateListener extends Listener<QueueUpdateEvent> {
  // @ts-ignore
  subject = "ticket:queue-update";
  consumer_name = "queue";
  // Had to provode type because ts thinks possibility of ressignment of subject (or use readonly keyword).

  async onMessage(data: QueueUpdateEvent["data"], msg: JsMsg) {
    console.log("QueueUpdateListener: ", data);

    msg.ack();
  }
}
