import { JsMsg } from "nats";
import { Listener, OrderCreatedEvent, Subjects } from "@kh-micro-srv/common";
import { expirationQueue } from "../../queues/expiration-queue";

export class OrderCreatedListener extends Listener<OrderCreatedEvent> {
  subject: Subjects.OrderCreated = Subjects.OrderCreated;
  consumer_name = "expiration";
  // Had to provode type because ts thinks possibility of ressignment of subject (or use readonly keyword).

  async onMessage(data: OrderCreatedEvent["data"], msg: JsMsg) {
    const delay = new Date(data.expiresAt).getTime() - new Date().getTime();
    // We are eliminating the delay from the time of creation of order to the time reaching here. Let's say, if the delay is 15 min, and it takes 5 min to reach here, then we will set the delay to 10 min.
    expirationQueue.add(
      "order-expiration",
      {
        orderId: data.id,
      },
      {
        delay: delay,
      }
    );
    msg.ack();
  }
}
