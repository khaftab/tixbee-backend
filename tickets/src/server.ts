import mongoose from "mongoose";
import app from "./app";
import { natsWrapper } from "./nats-wrapper";
import { OrderCreatedListener } from "./events/listeners/order-created-listener";
import { OrderCancelledListener } from "./events/listeners/order-cancelled-listener";
import { PaymentCreatedListener } from "./events/listeners/payment-created-listener";
import { checkEnvVariables, logger } from "@kh-micro-srv/common";

const start = async () => {
  checkEnvVariables(["JWT_KEY", "NATS_URL", "SERVICE_NAME", "TIXBEE_SOURCE_TOKEN", "ORIGIN_URL"]);
  try {
    await natsWrapper.connect(process.env.NATS_URL!);
    natsWrapper.client.closed().then(() => {
      logger.info("NATS connection closed.");
      process.exit(0);
    });
    process.on("SIGINT", natsWrapper.shutdown);
    process.on("SIGTERM", natsWrapper.shutdown);

    new OrderCreatedListener(natsWrapper.client).listen();
    new OrderCancelledListener(natsWrapper.client).listen();
    new PaymentCreatedListener(natsWrapper.client).listen();

    await mongoose.connect(process.env.MONGO_URI!);
    logger.info("Connected to MongoDB");
    app.listen(3000, () => {
      logger.info("Tickets service running on port 3000");
    });
  } catch (err) {
    logger.error(err);
  }
};

start();
