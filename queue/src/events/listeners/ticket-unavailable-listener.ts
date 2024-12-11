import { JsMsg } from "nats";
import { Listener, logger, Subjects, TicketUnavailableEvent } from "@kh-micro-srv/common";
import { queueService } from "../../queue-management";
import { emitEventToAll } from "../../socket";

export class TicketUnavailableListener extends Listener<TicketUnavailableEvent> {
  subject: Subjects.TicketUnavailable = Subjects.TicketUnavailable;
  consumer_name = "queue";

  async onMessage(data: TicketUnavailableEvent["data"], msg: JsMsg) {
    try {
      await queueService.deleteKey(data.ticketId);
      await emitEventToAll("ticket-unavilable", data.ticketId);
      msg.ack();
    } catch (error) {
      logger.error(error);
    }
  }
}
