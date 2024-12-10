import mongoose from "mongoose";
import app from "./app";
import { natsWrapper } from "./nats-wrapper";
import { TicketCreatedListener } from "./events/listeners/ticket-created-listener";
import { TicketUpdatedListener } from "./events/listeners/ticket-updated-listeners";
import { ExpirationCompleteListener } from "./events/listeners/expiration-complete-listener";
import { PaymentCreatedListener } from "./events/listeners/payment-created-listener";
import { checkEnvVariables, logger } from "@kh-micro-srv/common";

const start = async () => {
  checkEnvVariables(["JWT_KEY", "MONGO_URI", "NATS_URL"]);

  try {
    await natsWrapper.connect(process.env.NATS_URL!);
    natsWrapper.client.closed().then(() => {
      logger.info("NATS connection closed.");
      process.exit(0);
    });
    process.on("SIGINT", natsWrapper.shutdown);
    process.on("SIGTERM", natsWrapper.shutdown);
    new TicketCreatedListener(natsWrapper.client).listen();
    new TicketUpdatedListener(natsWrapper.client).listen();
    new ExpirationCompleteListener(natsWrapper.client).listen();
    new PaymentCreatedListener(natsWrapper.client).listen();
    await mongoose.connect(process.env.MONGO_URI!);
    logger.info("Connected to MongoDB");
    app.listen(3000, () => {
      logger.info("Orders service running on pRT 3000");
    });
  } catch (err) {
    logger.error(err);
  }
};

start();
