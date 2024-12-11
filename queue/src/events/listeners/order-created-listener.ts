import { JsMsg } from "nats";
import { Listener, logger, OrderCreatedEvent, Subjects } from "@kh-micro-srv/common";
import { queueService } from "../../queue-management";
import { emitEventToAll } from "../../socket";

export class OrderCreatedListener extends Listener<OrderCreatedEvent> {
  subject: Subjects.OrderCreated = Subjects.OrderCreated;
  consumer_name = "queue";

  async onMessage(data: OrderCreatedEvent["data"], msg: JsMsg) {
    try {
      await queueService.addOrderExipirationDate(data.ticket.id, data.expiresAt);
      await emitEventToAll("queue-update", data.ticket.id);
      msg.ack();
    } catch (error) {
      logger.error(error);
    }
  }
}
