import { JsMsg } from "nats";
import { Listener, logger, OrderCancelledEvent, Subjects } from "@kh-micro-srv/common";
import { queueService } from "../../queue-management";
import { emitEvent } from "../../socket";

export class OrderCancelledListener extends Listener<OrderCancelledEvent> {
  subject: Subjects.OrderCancelled = Subjects.OrderCancelled;
  consumer_name = "queue";

  async onMessage(data: OrderCancelledEvent["data"], msg: JsMsg) {
    logger.info("Order cancelled", data);
    try {
      await queueService.removeFromQueue(data.ticket.id, "queueTurn");
      const nextUser = await queueService.notifyNextInQueue(data.ticket.id);
      if (nextUser) {
        emitEvent("queue-turn", nextUser, nextUser.userId, data.ticket.id);
      }
      await queueService.removeOrderExpirationDate(data.ticket.id);
      msg.ack();
    } catch (error) {
      logger.error(error);
    }
  }
}

// Not pubslisheing an TicketUpdatedEvent here because we are not updating the ticket. We are just setting the orderId to null. Using findByIdAndUpdate method to not to update the versrion no. otherwise we will get a version error in future at order service.
