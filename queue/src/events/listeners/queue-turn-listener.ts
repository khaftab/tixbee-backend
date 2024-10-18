import { JsMsg } from "nats";
import { Listener, OrderStatus, PaymentCreatedEvent, Subjects } from "@kh-micro-srv/common";

interface QueueTurnEvent {
  subject: "ticket:queue-turn";
  data: {
    ticketId: string;
    userId: string;
  };
}

export class QueueUpdateListener extends Listener<QueueTurnEvent> {
  // @ts-ignore
  subject = "ticket:queue-turn";
  consumer_name = "queue";
  // Had to provode type because ts thinks possibility of ressignment of subject (or use readonly keyword).

  async onMessage(data: QueueTurnEvent["data"], msg: JsMsg) {
    console.log("Queue Turn listner: ", data);
    msg.ack();
  }
}
