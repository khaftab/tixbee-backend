import { OrderCreatedListener } from "./events/listeners/order-created-listener";

import { natsWrapper } from "./nats-wrapper";

const start = async () => {
  if (!process.env.NATS_URL) {
    throw new Error("NATS_URL must be defined for for expiration service");
  }

  if (!process.env.REDIS_HOST) {
    throw new Error("REDIS_HOST must be defined for expiration service");
  }
  if (!process.env.REDIS_PORT) {
    throw new Error("REDIS_PORT must be defined for expiration service");
  }

  try {
    await natsWrapper.connect(process.env.NATS_URL);
    natsWrapper.client.closed().then(() => {
      console.log("NATS connection closed.");
      process.exit(0); // will exit the node server when nats connection is closed.
    });
    process.on("SIGINT", natsWrapper.shutdown);
    process.on("SIGTERM", natsWrapper.shutdown);
    new OrderCreatedListener(natsWrapper.client).listen();
  } catch (err) {
    console.error(err);
  }
};

start();
