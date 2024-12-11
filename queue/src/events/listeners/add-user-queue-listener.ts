import { JsMsg } from "nats";
import { Listener, AddUserToQueue, Subjects } from "@kh-micro-srv/common";
import { queueService } from "../../queue-management";
import { logger } from "@kh-micro-srv/common";

export class AddUserToQueueListener extends Listener<AddUserToQueue> {
  subject: Subjects.AddUser = Subjects.AddUser;
  consumer_name = "queue";

  async onMessage(data: AddUserToQueue["data"], msg: JsMsg) {
    try {
      await queueService.addToQueue(data.ticketId, data.userId, "ticket");
      msg.ack();
    } catch (error) {
      logger.error("Error: ", error);
    }
  }
}
