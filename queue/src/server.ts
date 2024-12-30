import { natsWrapper } from "./nats-wrapper";
import { OrderCreatedListener } from "./events/listeners/order-created-listener";
import { OrderCancelledListener } from "./events/listeners/order-cancelled-listener";
import { queueService } from "./queue-management";
import "./socket";
import { AddUserToQueueListener } from "./events/listeners/add-user-queue-listener";
import { TicketUnavailableListener } from "./events/listeners/ticket-unavailable-listener";

import { checkEnvVariables } from "./utils/utils";
import { logger } from "@kh-micro-srv/common";

const start = async () => {
  checkEnvVariables(["JWT_KEY", "NATS_URL", "ORIGIN_URL", "SERVICE_NAME", "TIXBEE_SOURCE_TOKEN"]);
  logger.info("Queue service starting...");
  try {
    await natsWrapper.connect(process.env.NATS_URL!);
    natsWrapper.client.closed().then(() => {
      logger.info("NATS connection closed.");
      process.exit(0);
    });

    process.on("SIGINT", natsWrapper.shutdown);
    process.on("SIGTERM", natsWrapper.shutdown);
    await queueService.connect(natsWrapper.client);
    new OrderCreatedListener(natsWrapper.client).listen();
    new OrderCancelledListener(natsWrapper.client).listen();
    new AddUserToQueueListener(natsWrapper.client).listen();
    new TicketUnavailableListener(natsWrapper.client).listen();
  } catch (err) {
    logger.error(err);
  }
};

start();
// Note: This is purely a websocket service without express / http server and does not have any routes. So, throwing BadRequest error will crash the server. Instead, we need to emit an event to the client to show the error message.
