import { checkEnvVariables, logger } from "@kh-micro-srv/common";
import { OrderCreatedListener } from "./events/listeners/order-created-listener";

import { natsWrapper } from "./nats-wrapper";

const start = async () => {
  checkEnvVariables(["NATS_URL", "REDIS_HOST", "REDIS_PORT"]);
  try {
    await natsWrapper.connect(process.env.NATS_URL!);
    natsWrapper.client.closed().then(() => {
      logger.info("NATS connection closed.");
      process.exit(0); // will exit the node server when nats connection is closed.
    });
    process.on("SIGINT", natsWrapper.shutdown);
    process.on("SIGTERM", natsWrapper.shutdown);
    new OrderCreatedListener(natsWrapper.client).listen();
  } catch (err) {
    logger.error(err);
  }
};

start();
