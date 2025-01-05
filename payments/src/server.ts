import mongoose from "mongoose";
import app from "./app";
import { natsWrapper } from "./nats-wrapper";
import { OrderCreatedListener } from "./events/listeners/order-created-listener";
import { OrderCancelledListener } from "./events/listeners/order-cancelled-listener";
import { checkEnvVariables, logger } from "@kh-micro-srv/common";

const start = async () => {
  checkEnvVariables([
    "JWT_KEY",
    "MONGO_URI",
    "NATS_URL",
    "SERVICE_NAME",
    "STRIPE_WEBHOOK_SECRET",
    "STRIPE_KEY",
    "TIXBEE_SOURCE_TOKEN",
    "ORIGIN_URL",
  ]);
  logger.info("Env chekc on bootup", {
    JWT_KEY: process.env.JWT_KEY,
    MONGO_URI: process.env.MONGO_URI,
    NATS_URL: process.env.NATS_URL,
    SERVICE_NAME: process.env.SERVICE_NAME,
    STRIPE_WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET,
    STRIPE_KEY: process.env.STRIPE_KEY,
    TIXBEE_SOURCE_TOKEN: process.env.TIXBEE_SOURCE_TOKEN,
    ORIGIN_URL: process.env.ORIGIN_URL,
  });
  try {
    await natsWrapper.connect(process.env.NATS_URL!);
    natsWrapper.client.closed().then(() => {
      logger.info("NATS connection closed.");
      process.exit(0); // will exit the node server when nats connection is closed.
    });
    process.on("SIGINT", natsWrapper.shutdown);
    process.on("SIGTERM", natsWrapper.shutdown);

    new OrderCreatedListener(natsWrapper.client).listen();
    new OrderCancelledListener(natsWrapper.client).listen();
    await mongoose.connect(process.env.MONGO_URI!);
    logger.info("Connected to MongoDB");
    app.listen(3000, () => {
      logger.info("Payments service running on port 3000");
    });
  } catch (err) {
    logger.error(err);
  }
};

start();
