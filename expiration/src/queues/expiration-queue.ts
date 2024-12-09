import { Queue } from "bullmq";

interface Payload {
  orderId: string;
}

const expirationQueue = new Queue<Payload>("order-expiration", {
  connection: {
    host: process.env.REDIS_HOST,
    port: parseInt(process.env.REDIS_PORT as string),
  },
});

import { Worker } from "bullmq";
import { ExpirationCompletePublisher } from "../events/publishers/expiration-complete-publisher";
import { natsWrapper } from "../nats-wrapper";
import { logger } from "@kh-micro-srv/common";

const expirationWorker = new Worker(
  "order-expiration",
  async (job) => {
    new ExpirationCompletePublisher(natsWrapper.client).publish({
      orderId: job.data.orderId,
    });
  },
  {
    connection: {
      host: process.env.REDIS_HOST,
      port: parseInt(process.env.REDIS_PORT as string),
    },
  }
);

expirationWorker.on("ready", () => {
  logger.info("Expiration worker is ready");
});

export { expirationQueue };
